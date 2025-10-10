/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.fit.jade.oauth.controller;

import com.nimbusds.oauth2.sdk.AuthorizationCode;
import com.nimbusds.oauth2.sdk.AuthorizationCodeGrant;
import com.nimbusds.oauth2.sdk.AuthorizationGrant;
import com.nimbusds.oauth2.sdk.AuthorizationResponse;
import com.nimbusds.oauth2.sdk.AuthorizationSuccessResponse;
import com.nimbusds.oauth2.sdk.TokenRequest;
import com.nimbusds.oauth2.sdk.TokenResponse;
import com.nimbusds.oauth2.sdk.auth.ClientAuthentication;
import com.nimbusds.oauth2.sdk.auth.ClientSecretBasic;
import com.nimbusds.oauth2.sdk.auth.Secret;
import com.nimbusds.oauth2.sdk.id.ClientID;
import com.nimbusds.oauth2.sdk.token.Tokens;

import modelengine.fit.http.Cookie;
import modelengine.fit.http.annotation.GetMapping;
import modelengine.fit.http.annotation.PostMapping;
import modelengine.fit.http.annotation.RequestMapping;
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
import java.util.Optional;

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

    @Value("${oauth.token-endpoint}")
    private String tokenEndpoint;

    @Value("${oauth.auth-url}")
    private String authUrl;

    @Value("${oauth.home-url}")
    private String homeUrl;

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
                // .secure(true)
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
        }

        // response 内写 cookie 框架还暂时不会把他改为 Set-Cookie, 因此暂时先手动写入响应头
        response.headers().add("Set-Cookie", sb.toString());

        response.statusCode(301);
        response.headers().set("Location", homeUrl);
        response.send();
    }

    /**
     * 获取用户名信息
     */
    @PostMapping("/username")
    public Rsp<String> handleUsername() {
        String username = Optional.ofNullable(UserContextHolder.get())
                .map(UserContext::getName)
                .orElseThrow(() -> new IllegalArgumentException("The user name cannot be null."));
        return Rsp.ok(username);
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
    public void handleLogin(HttpClassicServerResponse response) {
        response.statusCode(401);
        response.headers().add("fit-redirect-to-prefix", authUrl + "&useless=");
        response.send();
    }

    /**
     * 处理注销请求。
     * <p>
     * 清除客户端的 Access Token Cookie，将其 Max-Age 设置为 0。
     *
     * @param response 当前的 HTTP 响应对象，用于写入 Set-Cookie 头
     */
    @PostMapping("/logout")
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

        // 写入响应头
        response.statusCode(200);
        response.headers().add("Set-Cookie", sb.toString());
        response.send();
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
}
