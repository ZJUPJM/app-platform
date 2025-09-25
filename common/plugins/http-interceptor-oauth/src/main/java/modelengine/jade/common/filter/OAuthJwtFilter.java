/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.jade.common.filter;

import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jwt.SignedJWT;
import com.nimbusds.jose.JOSEException;

import modelengine.fit.http.Cookie;
import modelengine.fit.http.server.HttpClassicServerRequest;
import modelengine.fit.http.server.HttpClassicServerResponse;
import modelengine.fit.http.server.HttpServerFilter;
import modelengine.fit.http.server.HttpServerFilterChain;
import modelengine.fitframework.annotation.Component;
import modelengine.fitframework.annotation.Order;
import modelengine.fitframework.annotation.Scope;
import modelengine.fitframework.annotation.Value;
import modelengine.fitframework.log.Logger;
import modelengine.jade.authentication.context.HttpRequestUtils;
import modelengine.jade.authentication.context.UserContext;
import modelengine.jade.authentication.context.UserContextHolder;

import java.io.IOException;
import java.net.URL;
import java.security.interfaces.RSAPublicKey;
import java.text.ParseException;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

/**
 * 全局 HTTP 过滤器，用于验证请求中的 JWT，并根据结果执行后续请求或返回 401。
 * 支持 JWK 缓存、自动刷新、验证失败回退及旧密钥清理。
 *
 * @author Maiicy
 * @since 2025-09-22
 */
@Component
public class OAuthJwtFilter implements HttpServerFilter {
    private static final Logger log = Logger.get(OAuthJwtFilter.class);

    private static final String TOKEN_KEY = "access-token";

    @Value("${authorization-server.jwks-url}")
    private String jwksUrl;

    @Value("${authorization-server.auth-url}")
    private String authUrl;

    // 缓存 JWK 集合
    private final CopyOnWriteArrayList<CachedJwk> cachedJwks = new CopyOnWriteArrayList<>();
    private volatile long lastJwkLoadTime = 0;

    // 缓存/轮换策略
    private static final long JWKS_CACHE_MS = 24 * 60 * 60 * 1000L; // 24小时刷新
    private static final long JWKS_KEY_MAX_AGE = 2L * 24 * 60 * 60 * 1000; // 2天旧密钥保留

    private static class CachedJwk {
        final JWK jwk;
        final long loadTime;

        CachedJwk(JWK jwk, long loadTime) {
            this.jwk = jwk;
            this.loadTime = loadTime;
        }
    }

    @Override
    public String name() {
        return "OAuthJwtFilter";
    }

    @Override
    public int priority() {
        return Order.HIGH;
    }

    @Override
    public List<String> matchPatterns() {
        return Collections.singletonList("/**");
    }

    @Override
    public List<String> mismatchPatterns() {
        return Arrays.asList(
                "/api/app/v1/**",
                "/fit/check/**",
                "/v1/api/auth/callback",
                "/v1/api/auth/login"
        );
    }

    @Override
    public void doFilter(HttpClassicServerRequest request, HttpClassicServerResponse response,
            HttpServerFilterChain chain) {

        String accessToken = request.cookies()
                .all()
                .stream()
                .filter(cookie -> TOKEN_KEY.equals(cookie.name()))
                .findFirst()
                .map(Cookie::value)
                .orElse(null);

        if (accessToken == null) {
            sendUnAuthResponse(response);
            return;
        }

        String username = parseTokenSubject(accessToken);
        if (username == null) {
            sendUnAuthResponse(response);
            return;
        }

        UserContext operationContext = new UserContext(username,
                HttpRequestUtils.getUserIp(request),
                HttpRequestUtils.getAcceptLanguages(request));
        UserContextHolder.apply(operationContext, () -> chain.doFilter(request, response));
    }

    @Override
    public Scope scope() {
        return Scope.GLOBAL;
    }

    /**
     * 解析 JWT 并验证签名及过期时间。
     *
     * @param jwtString 待验证的 JWT 字符串
     * @return 验证成功返回 token 的 subject（用户名），否则返回 null
     */
    private String parseTokenSubject(String jwtString) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(jwtString);
            Date exp = signedJWT.getJWTClaimsSet().getExpirationTime();
            if (exp == null || exp.before(new Date())) return null;

            String kid = signedJWT.getHeader().getKeyID();

            // 定期刷新 JWK
            if (System.currentTimeMillis() - lastJwkLoadTime > JWKS_CACHE_MS) {
                refreshJwkSet();
            }

            // 尝试验证
            if (verifyWithCachedJwks(signedJWT, kid)) {
                return signedJWT.getJWTClaimsSet().getSubject();
            }

            // 验证失败，回退刷新一次
            refreshJwkSet();
            if (verifyWithCachedJwks(signedJWT, kid)) {
                return signedJWT.getJWTClaimsSet().getSubject();
            }

        } catch (ParseException | JOSEException e) {
            log.warn("JWT parse or verify failed: {}", e.getMessage());
        }
        return null;
    }

    /**
     * 用本地缓存的 JWK 验证 JWT。
     */
    private boolean verifyWithCachedJwks(SignedJWT signedJWT, String kid) throws JOSEException {
        long now = System.currentTimeMillis();
        List<CachedJwk> activeKeys = cachedJwks.stream()
                .filter(c -> now - c.loadTime <= JWKS_KEY_MAX_AGE)
                .collect(Collectors.toList());

        for (CachedJwk cached : activeKeys) {
            JWK jwk = cached.jwk;
            if (!"RSA".equals(jwk.getKeyType().getValue())) continue;
            if (kid != null && !kid.equals(jwk.getKeyID())) continue;

            RSAPublicKey publicKey = jwk.toRSAKey().toRSAPublicKey();
            JWSVerifier verifier = new RSASSAVerifier(publicKey);
            if (signedJWT.verify(verifier)) return true;
        }
        return false;
    }

    /**
     * 刷新远程 JWK，并合并到本地缓存，同时清理过期旧密钥。
     */
    private synchronized void refreshJwkSet() {
        try {
            JWKSet newSet = JWKSet.load(new URL(jwksUrl));
            long now = System.currentTimeMillis();

            // 清理过期旧密钥
            cachedJwks.removeIf(c -> now - c.loadTime > JWKS_KEY_MAX_AGE);

            // 添加新密钥（去重 kid）
            for (JWK jwk : newSet.getKeys()) {
                boolean exists = cachedJwks.stream().anyMatch(c -> c.jwk.getKeyID().equals(jwk.getKeyID()));
                if (!exists) cachedJwks.add(new CachedJwk(jwk, now));
            }

            lastJwkLoadTime = now;

        } catch (IOException | ParseException e) {
            log.warn("Failed to refresh JWKS: {}", e.getMessage());
        }
    }

    /**
     * 返回 401 未授权响应，并在 header 中添加跳转授权前缀。
     *
     * @param response 当前 HTTP 响应对象
     */
    private void sendUnAuthResponse(HttpClassicServerResponse response) {
        response.statusCode(401);
        response.headers().add("fit-redirect-to-prefix", authUrl + "&useless=");
        response.send();
    }
}