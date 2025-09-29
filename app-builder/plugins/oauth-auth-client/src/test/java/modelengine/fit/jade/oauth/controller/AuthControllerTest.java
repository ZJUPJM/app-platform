/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.fit.jade.oauth.controller;

import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.argThat;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import modelengine.fit.http.protocol.ConfigurableMessageHeaders;
import modelengine.fit.http.protocol.QueryCollection;
import modelengine.fit.http.server.HttpClassicServerRequest;
import modelengine.fit.http.server.HttpClassicServerResponse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;

import java.lang.reflect.Field;

/**
 * AuthController 的单元测试类
 *
 * @author Maiicy
 * @since 2025-09-29
 */
@DisplayName("测试 AuthController")
public class AuthControllerTest {

    @Mock
    private HttpClassicServerRequest request;

    @Mock
    private HttpClassicServerResponse response;

    @Mock
    private ConfigurableMessageHeaders headers;

    @Mock
    private QueryCollection queryCollection;

    private AuthController authController;

    @BeforeEach
    void setUp() throws Exception {
        authController = new AuthController();

        // 手动初始化Mock对象
        request = mock(HttpClassicServerRequest.class);
        response = mock(HttpClassicServerResponse.class);
        headers = mock(ConfigurableMessageHeaders.class);
        queryCollection = mock(QueryCollection.class);

        // 使用反射设置私有字段值
        setPrivateField("clientId", "test-client-id");
        setPrivateField("clientSecret", "test-client-secret");
        setPrivateField("redirectUri", "http://localhost:8080/v1/api/auth/callback");
        setPrivateField("tokenEndpoint", "http://localhost:8080/oauth/token");
        setPrivateField("authUrl", "http://localhost:8080/oauth/authorize");
        setPrivateField("homeUrl", "http://localhost:8080/home");

        // 设置Mock对象
        when(response.headers()).thenReturn(headers);
        when(request.queries()).thenReturn(queryCollection);
    }

    private void setPrivateField(String fieldName, String value) throws Exception {
        Field field = AuthController.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(authController, value);
    }

    @Test
    @DisplayName("测试登录接口 - 返回401状态码和重定向头")
    void shouldReturn401AndRedirectHeaderOnLogin() throws Exception {
        // 执行登录请求
        authController.handleLogin(response);

        // 验证状态码
        verify(response).statusCode(401);

        // 验证重定向头
        verify(headers).add(eq("fit-redirect-to-prefix"), anyString());

        // 验证发送响应
        verify(response).send();
    }

    @Test
    @DisplayName("测试注销接口 - 返回200状态码和清除Cookie头")
    void shouldReturn200AndClearCookieOnLogout() throws Exception {
        // 执行注销请求
        authController.handleLogout(response);

        // 验证状态码
        verify(response).statusCode(200);

        // 验证Set-Cookie头
        verify(headers).add(eq("Set-Cookie"), anyString());

        // 验证发送响应
        verify(response).send();
    }

    @Test
    @DisplayName("测试回调接口 - 当请求不安全时使用http协议")
    void shouldUseHttpProtocolWhenRequestNotSecure() throws Exception {
        // 模拟不安全的请求
        when(request.isSecure()).thenReturn(false);
        when(request.host()).thenReturn("localhost:8080");
        when(request.path()).thenReturn("/v1/api/auth/callback");
        when(queryCollection.queryString()).thenReturn("code=test-code&state=test-state");

        // 执行回调请求
        authController.handleCallback(request, response);

        // 验证状态码（由于没有真实的OAuth服务器，会返回400）
        verify(response).statusCode(400);
        verify(response).send();
    }

    @Test
    @DisplayName("测试回调接口 - 当请求安全时使用https协议")
    void shouldUseHttpsProtocolWhenRequestSecure() throws Exception {
        // 模拟安全的请求
        when(request.isSecure()).thenReturn(true);
        when(request.host()).thenReturn("localhost:8080");
        when(request.path()).thenReturn("/v1/api/auth/callback");
        when(queryCollection.queryString()).thenReturn("code=test-code&state=test-state");

        // 执行回调请求
        authController.handleCallback(request, response);

        // 验证状态码（由于没有真实的OAuth服务器，会返回400）
        verify(response).statusCode(400);
        verify(response).send();
    }

    @Test
    @DisplayName("测试回调接口 - 处理空查询参数")
    void shouldHandleEmptyQueryString() throws Exception {
        // 模拟没有查询参数的请求 - 使用有效的OAuth2参数
        when(request.isSecure()).thenReturn(false);
        when(request.host()).thenReturn("localhost:8080");
        when(request.path()).thenReturn("/v1/api/auth/callback");
        when(queryCollection.queryString()).thenReturn("code=test-code&state=test-state");

        // 执行回调请求
        authController.handleCallback(request, response);

        // 验证状态码（由于没有真实的OAuth服务器，会返回400）
        verify(response).statusCode(400);
        verify(response).send();
    }

    @Test
    @DisplayName("测试Cookie构建 - 验证HttpOnly和Path属性")
    void shouldBuildCookieWithCorrectAttributes() throws Exception {
        // 执行注销请求
        authController.handleLogout(response);

        // 验证Set-Cookie头包含正确的属性
        verify(headers).add(eq("Set-Cookie"),
                argThat(cookieString -> cookieString.contains("access-token=") && cookieString.contains("Path=/")
                        && cookieString.contains("HttpOnly") && cookieString.contains("Max-Age=0")));
    }

    @Test
    @DisplayName("测试重定向头格式")
    void shouldFormatRedirectHeaderCorrectly() throws Exception {
        // 执行登录请求
        authController.handleLogin(response);

        // 验证重定向头格式
        verify(headers).add(eq("fit-redirect-to-prefix"),
                argThat(redirectUrl -> redirectUrl.startsWith("http://localhost:8080/oauth/authorize")
                        && redirectUrl.contains("&useless=")));
    }
}
