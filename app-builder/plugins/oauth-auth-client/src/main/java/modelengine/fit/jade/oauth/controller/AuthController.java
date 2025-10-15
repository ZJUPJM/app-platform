/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.fit.jade.oauth.controller;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.nimbusds.oauth2.sdk.AuthorizationCode;
import com.nimbusds.oauth2.sdk.AuthorizationCodeGrant;
import com.nimbusds.oauth2.sdk.AuthorizationGrant;
import com.nimbusds.oauth2.sdk.AuthorizationRequest;
import com.nimbusds.oauth2.sdk.AuthorizationResponse;
import com.nimbusds.oauth2.sdk.AuthorizationSuccessResponse;
import com.nimbusds.oauth2.sdk.ResponseType;
import com.nimbusds.oauth2.sdk.Scope;
import com.nimbusds.oauth2.sdk.TokenRequest;
import com.nimbusds.oauth2.sdk.TokenResponse;
import com.nimbusds.oauth2.sdk.auth.ClientAuthentication;
import com.nimbusds.oauth2.sdk.auth.ClientSecretBasic;
import com.nimbusds.oauth2.sdk.auth.Secret;
import com.nimbusds.oauth2.sdk.id.ClientID;
import com.nimbusds.oauth2.sdk.id.State;
import com.nimbusds.oauth2.sdk.token.Tokens;

import modelengine.fit.http.Cookie;
import modelengine.fit.http.annotation.GetMapping;
import modelengine.fit.http.annotation.PostMapping;
import modelengine.fit.http.annotation.RequestMapping;
import modelengine.fit.http.annotation.RequestParam;
import modelengine.fit.http.annotation.ResponseStatus;
import modelengine.fit.http.protocol.HttpResponseStatus;
import modelengine.fit.http.server.HttpClassicServerRequest;
import modelengine.fit.http.server.HttpClassicServerResponse;
import modelengine.fit.jane.common.response.Rsp;
import modelengine.fitframework.annotation.Component;
import modelengine.fitframework.annotation.Value;
import modelengine.fitframework.validation.Validated;
import modelengine.jade.authentication.context.UserContext;
import modelengine.jade.authentication.context.UserContextHolder;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

/**
 * 用户认证控制器（OAuth2）。
 * 提供登录、注销和回调处理接口，实现基于 OAuth2 的认证流程，
 * 并将 Access Token 设置到 HttpOnly Cookie 中。
 *
 * @author Maiicy
 * @since 2025-09-22
 */
@Component
@Validated
@RequestMapping(path = "v1/api/auth", group = "用户认证相关（OAuth）")
public class AuthController {
    @Value("${oauth.client.id}")
    private String clientId;

    @Value("${oauth.client.secret}")
    private String clientSecret;

    @Value("${oauth.client.redirect-uri}")
    private String redirectUri;

    @Value("${oauth.login-endpoint}")
    private String loginEndpoint;

    @Value("${oauth.token-endpoint}")
    private String tokenEndpoint;

    @Value("${oauth.auth-endpoint}")
    private String authEndpoint;

    @Value("${oauth.api-endpoint}")
    private String apiEndpoint;

    @Value("${oauth.state-secret}")
    private String stateSecret;

    /**
     * 处理 OAuth2 回调请求。
     * <p>
     * 接收授权服务器返回的重定向请求，解析 Authorization Code，
     * 使用该 Code 向 Token Endpoint 请求 Access Token，然后将其设置到 HttpOnly Cookie 中，
     * 最后重定向到首页。
     *
     * @param request 当前的 HTTP 请求对象，包含查询参数和请求信息
     * @param response 当前的 HTTP 响应对象，用于写入 Set-Cookie 和重定向头
     * @throws Exception 解析 URI、发送 Token 请求或处理响应时可能抛出的异常
     */
    @GetMapping("/callback")
    @ResponseStatus(HttpResponseStatus.MOVED_PERMANENTLY)
    public void handleCallback(HttpClassicServerRequest request, HttpClassicServerResponse response) throws Exception {
        String scheme = request.isSecure() ? "https" : "http";
        String host = request.host();
        String path = request.path();
        String query = request.queries().queryString();
        String fullUrl = scheme + "://" + host + path + (!query.isEmpty() ? "?" + query : "");

        URI callbackURI = new URI(fullUrl);
        AuthorizationResponse authResp = AuthorizationResponse.parse(callbackURI);
        if (!authResp.indicatesSuccess()) {
            response.statusCode(400);
            response.send();
            return;
        }
        AuthorizationSuccessResponse successResponse = (AuthorizationSuccessResponse) authResp;
        if (successResponse.getAuthorizationCode() == null) {
            response.statusCode(400);
            response.send();
        }

        TokenRequest tokenRequest = getTokenRequest(successResponse);
        TokenResponse tokenResponse = TokenResponse.parse(tokenRequest.toHTTPRequest().send());

        if (!tokenResponse.indicatesSuccess()) {
            response.statusCode(400);
            response.send();
            return;
        }

        Tokens tokens = tokenResponse.toSuccessResponse().getTokens();
        String accessToken = tokens.getAccessToken().getValue();

        Cookie cookie = Cookie.builder().name("access-token").value(accessToken).httpOnly(true)
                .secure(true)
                .path("/").build();
        // response.cookies().add(cookie);

        StringBuilder sb = new StringBuilder();
        sb.append(cookie.name()).append("=").append(cookie.value());
        if (cookie.path() != null) {
            sb.append("; Path=").append(cookie.path());
        }
        if (cookie.httpOnly()) {
            sb.append("; HttpOnly");
        }
        if (cookie.secure()) {
            sb.append("; Secure");
            sb.append("; SameSite=None");
        }

        // response 内写 cookie 框架还暂时不会把他改为 Set-Cookie, 因此暂时先手动写入响应头，等新版fit-framework后修改
        response.headers().add("Set-Cookie", sb.toString());

        try {
            String redirectUrl = decryptState(authResp.getState().toString());
            response.headers().set("Location", redirectUrl);
        } catch (JOSEException e) {
            response.headers().set("Location", "/");
        }
    }

    @GetMapping("/redirect")
    @ResponseStatus(HttpResponseStatus.FOUND)
    public void handleRedirect(HttpClassicServerResponse response, @RequestParam("redirect_uri") String url)
            throws Exception {
        String state = encryptState(url);
        AuthorizationRequest authRequest = new AuthorizationRequest.Builder(new ResponseType(ResponseType.Value.CODE),
                new ClientID(clientId)).scope(new Scope("read"))
                .state(new State(state))
                .redirectionURI(new URI(redirectUri))
                .endpointURI(new URI(loginEndpoint))
                .build();

        response.headers().add("Location", authRequest.toURI().toString());
    }

    /**
     * 获取用户名信息
     */
    @GetMapping("/username")
    @ResponseStatus(HttpResponseStatus.OK)
    public Rsp<String> handleUsername() {
        String username = Optional.ofNullable(UserContextHolder.get())
                .map(UserContext::getName)
                .orElseThrow(() -> new IllegalArgumentException("The user name cannot be null."));
        Rsp<String> res = Rsp.ok(username);
        res.setCode(200);
        return res;
    }

    /**
     * 处理登录请求。
     * <p>
     * 返回 401 Unauthorized 状态，并在自定义响应头中指明 OAuth2 授权端点。
     * 前端可根据该头信息发起 OAuth2 授权流程。
     *
     * @param response 当前的 HTTP 响应对象，用于写入状态码和自定义跳转头
     */
    @PostMapping("/login")
    @ResponseStatus(HttpResponseStatus.UNAUTHORIZED)
    public void handleLogin(HttpClassicServerResponse response) {
        response.headers().add("fit-redirect-to-prefix", apiEndpoint + "/v1/api/auth/redirect?redirect_uri=");
    }

    /**
     * 处理注销请求。
     * <p>
     * 清除客户端的 Access Token Cookie，将其 Max-Age 设置为 0。
     *
     * @param response 当前的 HTTP 响应对象，用于写入 Set-Cookie 头
     */
    @PostMapping("/logout")
    @ResponseStatus(HttpResponseStatus.OK)
    public void handleLogout(HttpClassicServerResponse response) {
        Cookie cookie = Cookie.builder().name("access-token").value("").httpOnly(true)
                // .secure(true)
                .path("/").maxAge(0).build();

        // 拼接 Set-Cookie 字符串
        StringBuilder sb = new StringBuilder();
        sb.append(cookie.name()).append("=").append(cookie.value());
        if (cookie.path() != null) {
            sb.append("; Path=").append(cookie.path());
        }
          if (cookie.httpOnly()) {
            sb.append("; HttpOnly");
        }
        if (cookie.secure()) {
            sb.append("; Secure");
        }
        sb.append("; Max-Age=").append(cookie.maxAge());

        response.headers().add("Set-Cookie", sb.toString());
    }

    /**
     * 构建 TokenRequest 对象。
     * <p>
     * 使用从 OAuth2 授权端点返回的 Authorization Code，
     * 创建向 Token Endpoint 请求 Access Token 所需的 TokenRequest。
     *
     * @param authResp 授权成功响应，包含 Authorization Code
     * @return 构建好的 TokenRequest 对象
     * @throws URISyntaxException 当 tokenEndpoint 或 redirectUri 无法解析为合法 URI 时抛出
     */
    private TokenRequest getTokenRequest(AuthorizationSuccessResponse authResp) throws URISyntaxException {
        AuthorizationCode code = authResp.getAuthorizationCode();

        URI tokenEndpoint = new URI(this.tokenEndpoint);
        ClientID clientId = new ClientID(this.clientId);
        Secret clientSecret = new Secret(this.clientSecret);
        URI redirectUri = new URI(this.redirectUri);

        ClientAuthentication clientAuth = new ClientSecretBasic(clientId, clientSecret);
        AuthorizationGrant codeGrant = new AuthorizationCodeGrant(code, redirectUri);

        return new TokenRequest.Builder(tokenEndpoint, clientAuth, codeGrant).build();
    }

    private String encryptState(String redirectUrl) throws JOSEException {
        JWTClaimsSet claims = new JWTClaimsSet.Builder().claim("redirect_uri", redirectUrl)
                .claim("nonce", UUID.randomUUID().toString())
                .expirationTime(Date.from(Instant.now().plusSeconds(300))) // 5分钟有效
                .build();

        SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        signedJWT.sign(new MACSigner(stateSecret.getBytes()));

        return signedJWT.serialize();
    }

    public String decryptState(String state) throws Exception {
        SignedJWT signedJWT = SignedJWT.parse(state);

        if (!signedJWT.verify(new MACVerifier(stateSecret.getBytes()))) {
            throw new IllegalArgumentException("Invalid state signature");
        }

        Date exp = signedJWT.getJWTClaimsSet().getExpirationTime();
        if (exp.before(new Date())) {
            throw new IllegalArgumentException("State expired");
        }

        return signedJWT.getJWTClaimsSet().getStringClaim("redirect_uri");
    }

}
