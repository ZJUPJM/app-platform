/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.jade.common.controller;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.KeyLengthException;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.nimbusds.oauth2.sdk.AccessTokenResponse;
import com.nimbusds.oauth2.sdk.AuthorizationCode;
import com.nimbusds.oauth2.sdk.AuthorizationCodeGrant;
import com.nimbusds.oauth2.sdk.AuthorizationGrant;
import com.nimbusds.oauth2.sdk.AuthorizationRequest;
import com.nimbusds.oauth2.sdk.AuthorizationResponse;
import com.nimbusds.oauth2.sdk.AuthorizationSuccessResponse;
import com.nimbusds.oauth2.sdk.RefreshTokenGrant;
import com.nimbusds.oauth2.sdk.ResponseType;
import com.nimbusds.oauth2.sdk.Scope;
import com.nimbusds.oauth2.sdk.TokenRequest;
import com.nimbusds.oauth2.sdk.TokenResponse;
import com.nimbusds.oauth2.sdk.TokenRevocationRequest;
import com.nimbusds.oauth2.sdk.auth.ClientAuthentication;
import com.nimbusds.oauth2.sdk.auth.ClientSecretBasic;
import com.nimbusds.oauth2.sdk.auth.Secret;
import com.nimbusds.oauth2.sdk.http.HTTPResponse;
import com.nimbusds.oauth2.sdk.id.ClientID;
import com.nimbusds.oauth2.sdk.id.State;
import com.nimbusds.oauth2.sdk.token.AccessToken;
import com.nimbusds.oauth2.sdk.token.RefreshToken;
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
import modelengine.fitframework.annotation.Component;
import modelengine.fitframework.annotation.Value;
import modelengine.fitframework.log.Logger;
import modelengine.fitframework.validation.Validated;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Instant;
import java.util.Date;
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
    private static final Logger log = Logger.get(AuthController.class);

    private final static String TOKEN_PATH = "/oauth2/token";
    private final static String REVOKE_PATH = "/oauth2/revoke";
    private final static String REDIRECT_PATH = "/v1/api/auth/redirect?redirect_uri=";

    private final ClientAuthentication clientAuth;
    private final ClientID clientId;

    private final URI tokenEndpoint;
    private final URI revokeEndpoint;
    private final URI redirectUri;
    private final URI loginEndpoint;

    private final String loginBridgeUrlPrefix;

    private final MACSigner stateSigner;
    private final MACVerifier stateVerifier;

    AuthController(@Value("${oauth.client.id}") String clientIdValue,
            @Value("${oauth.client.secret}") String clientSecretValue,
            @Value("${oauth.oauth-endpoint}") String oauthEndpoint,
            @Value("${oauth.client.redirect-uri}") String redirectUriValue,
            @Value("${oauth.state-secret}") String stateSecret,
            @Value("${oauth.login-endpoint}") String loginEndpointValue,
            @Value("${oauth.client-api-endpoint}") String apiEndpoint) {
        Secret clientSecret = new Secret(clientSecretValue);
        this.clientId = new ClientID(clientIdValue);
        this.clientAuth = new ClientSecretBasic(this.clientId, clientSecret);
        this.loginBridgeUrlPrefix = apiEndpoint + REDIRECT_PATH;

        try {
            this.tokenEndpoint = new URI(oauthEndpoint + TOKEN_PATH);
            this.revokeEndpoint = new URI(oauthEndpoint + REVOKE_PATH);
            this.redirectUri = new URI(redirectUriValue);
            this.loginEndpoint = new URI(loginEndpointValue);

            this.stateSigner = new MACSigner(stateSecret.getBytes());
            this.stateVerifier = new MACVerifier(stateSecret.getBytes());
        } catch (URISyntaxException e) {
            throw new IllegalStateException(
                    "Invalid OAuth endpoint or redirect URI: please check your oauth.* configuration.",
                    e);
        } catch (KeyLengthException e) {
            throw new IllegalStateException(
                    "Invalid state secret: the configured oauth.state-secret is too short for MACSigner/MACVerifier.",
                    e);
        } catch (JOSEException e) {
            throw new IllegalStateException("Failed to initialize JOSE signer/verifier for OAuth state parameter.", e);
        }
    }

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
            // throw new BadRequestException("Authorization failed: invalid response.");
            response.statusCode(400);
            response.send();
            return;
        }
        AuthorizationSuccessResponse successResponse = (AuthorizationSuccessResponse) authResp;
        if (successResponse.getAuthorizationCode() == null) {
            // throw new BadRequestException("Authorization code is missing.");
            response.statusCode(400);
            response.send();
            return;
        }

        AuthorizationCode code = successResponse.getAuthorizationCode();
        AuthorizationGrant codeGrant = new AuthorizationCodeGrant(code, this.redirectUri);
        TokenRequest tokenRequest = new TokenRequest.Builder(this.tokenEndpoint, this.clientAuth, codeGrant).build();
        HTTPResponse httpResponse = tokenRequest.toHTTPRequest().send();
        TokenResponse tokenResponse = TokenResponse.parse(httpResponse);

        if (!tokenResponse.indicatesSuccess()) {
            response.statusCode(400);
            response.send();
            return;
        }

        Tokens tokens = tokenResponse.toSuccessResponse().getTokens();
        String accessToken = tokens.getAccessToken().getValue();
        String refreshToken = tokens.getRefreshToken().getValue();

        Cookie cookie1 =
                Cookie.builder().name("access-token").value(accessToken).httpOnly(true).secure(true).path("/").build();
        Cookie cookie2 = Cookie.builder()
                .name("refresh-token")
                .value(refreshToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .build();
        // 3.5.4 版本之后应当添加   .sameSite("None")

        // 3.5.4 版本之前 response 内写 cookie 框架还暂时不会把他改为 Set-Cookie, 因此暂时先手动写入响应头，等新版fit-framework后修改
        response.headers().add("Set-Cookie", toSetCookieHeaderValue(cookie1));
        response.headers().add("Set-Cookie", toSetCookieHeaderValue(cookie2));

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

        URI target = new URI(url);

        boolean sameHost = this.redirectUri.getHost().equalsIgnoreCase(target.getHost());
        boolean sameScheme = this.redirectUri.getScheme().equalsIgnoreCase(target.getScheme());
        boolean samePort = (this.redirectUri.getPort() == -1
                ? this.redirectUri.toURL().getDefaultPort()
                : this.redirectUri.getPort()) == (target.getPort() == -1
                ? target.toURL().getDefaultPort()
                : target.getPort());

        if (!(sameHost && sameScheme && samePort)) {
            // throw new BadRequestException("Redirect URI must be same-domain as registered redirectUri");
            response.statusCode(400);
            response.send();
            return;
        }

        String state = encryptState(url);
        AuthorizationRequest authRequest = new AuthorizationRequest.Builder(new ResponseType(ResponseType.Value.CODE),
                this.clientId).scope(new Scope("read"))
                .state(new State(state))
                .redirectionURI(this.redirectUri)
                .endpointURI(this.loginEndpoint)
                .build();

        response.headers().add("Location", authRequest.toURI().toString());
    }

    @GetMapping("/refresh-token")
    @ResponseStatus(HttpResponseStatus.OK)
    public void handleRefreshToken(HttpClassicServerRequest request, HttpClassicServerResponse response)
            throws Exception {
        if (request.cookies().get("refresh-token").isEmpty()) {
            response.statusCode(400);
            response.send();
            return;
        }
        String refreshToken = request.cookies().get("refresh-token").get().value();

        RefreshTokenGrant refreshGrant = new RefreshTokenGrant(new RefreshToken(refreshToken));
        TokenRequest tokenRequest = new TokenRequest.Builder(this.tokenEndpoint, this.clientAuth, refreshGrant).build();
        HTTPResponse httpResponse = tokenRequest.toHTTPRequest().send();

        TokenResponse tokenResponse = TokenResponse.parse(httpResponse);
        if (!tokenResponse.indicatesSuccess()) {
            // throw new BadRequestException("Failed to refresh access token");
            response.statusCode(400);
            response.send();
            return;
        }

        AccessTokenResponse successResponse = tokenResponse.toSuccessResponse();
        AccessToken newAccessToken = successResponse.getTokens().getAccessToken();
        String accessToken = newAccessToken.getValue();

        Cookie cookie =
                Cookie.builder().name("access-token").value(accessToken).httpOnly(true).secure(true).path("/").build();

        response.headers().add("Set-Cookie", toSetCookieHeaderValue(cookie));
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
        response.headers().add("fit-redirect-to-prefix", loginBridgeUrlPrefix);
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
    public void handleLogout(HttpClassicServerRequest request, HttpClassicServerResponse response) {
        Cookie cookie1 =
                Cookie.builder().name("access-token").value("").httpOnly(true).secure(true).path("/").maxAge(0).build();
        Cookie cookie2 = Cookie.builder()
                .name("refresh-token")
                .value("")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .build();
        response.headers().add("Set-Cookie", toSetCookieHeaderValue(cookie1));
        response.headers().add("Set-Cookie", toSetCookieHeaderValue(cookie2));

        if (request.cookies().get("refresh-token").isPresent()) {
            String refreshTokenValue = request.cookies().get("refresh-token").get().value();
            try {
                RefreshToken refreshToken = new RefreshToken(refreshTokenValue);
                TokenRevocationRequest revocationRequest =
                        new TokenRevocationRequest(this.revokeEndpoint, this.clientAuth, refreshToken);
                revocationRequest.toHTTPRequest().send();
            } catch (Exception e) {
                System.out.println(e.getMessage());
            }
        }
    }

    private String encryptState(String redirectUrl) throws JOSEException {
        JWTClaimsSet claims = new JWTClaimsSet.Builder().claim("redirect_uri", redirectUrl)
                .claim("nonce", UUID.randomUUID().toString())
                .expirationTime(Date.from(Instant.now().plusSeconds(300))) // 5分钟有效
                .build();

        SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        signedJWT.sign(this.stateSigner);

        return signedJWT.serialize();
    }

    private String decryptState(String state) throws Exception {
        SignedJWT signedJWT = SignedJWT.parse(state);

        if (!signedJWT.verify(this.stateVerifier)) {
            throw new IllegalArgumentException("Invalid state signature");
        }

        Date exp = signedJWT.getJWTClaimsSet().getExpirationTime();
        if (exp.before(new Date())) {
            throw new IllegalArgumentException("State expired");
        }

        return signedJWT.getJWTClaimsSet().getStringClaim("redirect_uri");
    }

    /**
     * 临时辅助使用，等 fit-framework 依赖版本升级为 3.5.4 时替换为 response.cookies().add(cookie) 并删除此函数
     * 并且 3.5.4 版本的 Cookie 将支持 Samesite 注意显式设置
     */
    private String toSetCookieHeaderValue(Cookie cookie) {
        StringBuilder sb = new StringBuilder();
        sb.append(cookie.name())
                .append("=")
                .append(cookie.value() != null ? cookie.value() : "")
                .append("; Path=")
                .append(cookie.path() != null ? cookie.path() : "/");
        if (cookie.domain() != null) {
            sb.append("; Domain=").append(cookie.domain());
        }
        if (cookie.httpOnly()) {
            sb.append("; HttpOnly");
        }
        if (cookie.secure()) {
            sb.append("; Secure");
            sb.append("; SameSite=None");
        }
        if (cookie.maxAge() > 0) {
            sb.append("; Max-Age=").append(cookie.maxAge());
        }
        return sb.toString();
    }
}
