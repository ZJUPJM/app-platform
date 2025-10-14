/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.fit.jade.oauth.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
import modelengine.fit.jane.common.response.Rsp;
import modelengine.jade.authentication.context.UserContext;
import modelengine.jade.authentication.context.UserContextHolder;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

/**
 * AuthController 的单元测试类
 *
 * @author Maiicy
 * @since 2025-09-29
 */
@DisplayName("测试 AuthController")
public class AuthControllerTest {

    private HttpClassicServerRequest request;

    private HttpClassicServerResponse response;

    private ConfigurableMessageHeaders headers;

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
        setPrivateField("authEndpoint", "http://localhost:8080/oauth/authorize");
        setPrivateField("apiEndpoint", "http://localhost:8080/api");
        setPrivateField("stateSecret", "test-state-secret");

        // 设置Mock对象
        when(response.headers()).thenReturn(headers);
        when(request.queries()).thenReturn(queryCollection);
    }

    @AfterEach
    void tearDown() throws Exception {
        // 清理UserContextHolder的ThreadLocal
        clearUserContext();
    }

    private void setPrivateField(String fieldName, String value) throws Exception {
        Field field = AuthController.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(authController, value);
    }

    @SuppressWarnings("unchecked")
    private void setUserContext(UserContext userContext) throws Exception {
        Field field = UserContextHolder.class.getDeclaredField("OPERATION_CONTEXT_THREAD_LOCAL");
        field.setAccessible(true);
        ThreadLocal<UserContext> threadLocal = (ThreadLocal<UserContext>) field.get(null);
        threadLocal.set(userContext);
    }

    @SuppressWarnings("unchecked")
    private void clearUserContext() throws Exception {
        Field field = UserContextHolder.class.getDeclaredField("OPERATION_CONTEXT_THREAD_LOCAL");
        field.setAccessible(true);
        ThreadLocal<UserContext> threadLocal = (ThreadLocal<UserContext>) field.get(null);
        threadLocal.remove();
    }

    @Test
    @DisplayName("测试获取用户名接口 - 成功获取用户名")
    void shouldReturnUsername() throws Exception {
        String username = "testUser";
        UserContext userContext = mock(UserContext.class);
        when(userContext.getName()).thenReturn(username);
        
        setUserContext(userContext);
        
        Rsp<String> usernameResponse = authController.handleUsername();
        
        assertEquals(username, usernameResponse.getData());
    }

    @Test
    @DisplayName("测试获取用户名接口 - UserContext为null时抛出异常")
    void shouldThrowExceptionWhenUserContextIsNull() throws Exception {
        setUserContext(null);
        
        assertThrows(IllegalArgumentException.class, () -> {
            authController.handleUsername();
        });
    }

    @Test
    @DisplayName("测试获取用户名接口 - UserContext.getName()为null时抛出异常")
    void shouldThrowExceptionWhenUserNameIsNull() throws Exception {
        UserContext userContext = mock(UserContext.class);
        when(userContext.getName()).thenReturn(null);
        
        setUserContext(userContext);
        
        assertThrows(IllegalArgumentException.class, () -> {
            authController.handleUsername();
        });
    }

    @Test
    @DisplayName("测试登录接口 - 返回重定向头")
    void shouldReturn401AndRedirectHeaderOnLogin() throws Exception {
        // 执行登录请求
        authController.handleLogin(response);

        // 验证重定向头
        verify(headers).add(eq("fit-redirect-to-prefix"), anyString());
    }

    @Test
    @DisplayName("测试注销接口 - 清除Cookie头")
    void shouldReturn200AndClearCookieOnLogout() throws Exception {
        // 执行注销请求
        authController.handleLogout(response);

        // 验证Set-Cookie头
        verify(headers).add(eq("Set-Cookie"), anyString());
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
                argThat(redirectUrl -> redirectUrl.startsWith("http://localhost:8080/api/v1/api/auth/redirect?redirect_uri=")));
    }
}
