/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.jade.common.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import modelengine.fit.http.Cookie;
import modelengine.fit.http.server.HttpClassicServerRequest;
import modelengine.fit.http.server.HttpClassicServerResponse;
import modelengine.fit.http.server.HttpServerFilterChain;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;

import java.util.Collections;
import java.util.List;

/**
 * OAuthJwtFilter 的单元测试类
 *
 * @author 徐吴昊
 * @since 2025-09-29
 */
// 使用手动初始化Mock对象
@DisplayName("测试 OAuthJwtFilter")
public class OAuthJwtFilterTest {

    @Mock
    private HttpClassicServerRequest request;

    @Mock
    private HttpClassicServerResponse response;

    @Mock
    private HttpServerFilterChain chain;

    private OAuthJwtFilter filter;

    @BeforeEach
    void setUp() {
        filter = new OAuthJwtFilter();
        // 手动初始化Mock对象
        request = mock(HttpClassicServerRequest.class);
        response = mock(HttpClassicServerResponse.class);
        chain = mock(HttpServerFilterChain.class);
    }

    @AfterEach
    void tearDown() {
        // UserContextHolder.clear(); // 如果clear方法不存在，注释掉
    }

    @Test
    @DisplayName("当没有 access-token Cookie 时返回 401")
    void shouldReturn401WhenNoTokenCookie() {
        // 模拟cookies()方法返回的CookieCollection
        var cookieCollection = mock(modelengine.fit.http.header.CookieCollection.class);
        when(request.cookies()).thenReturn(cookieCollection);
        when(cookieCollection.all()).thenReturn(Collections.emptyList());

        // 模拟headers()方法返回的ConfigurableMessageHeaders
        var headers = mock(modelengine.fit.http.protocol.ConfigurableMessageHeaders.class);
        when(response.headers()).thenReturn(headers);

        filter.doFilter(request, response, chain);

        verify(response).statusCode(401);
        verify(response).send();
        verify(chain, never()).doFilter(request, response);
    }

    @Test
    @DisplayName("当 access-token 无效时返回 401")
    void shouldReturn401WhenTokenInvalid() {
        // 模拟cookies()方法返回的CookieCollection
        var cookieCollection = mock(modelengine.fit.http.header.CookieCollection.class);
        when(request.cookies()).thenReturn(cookieCollection);

        // 模拟headers()方法返回的ConfigurableMessageHeaders
        var headers = mock(modelengine.fit.http.protocol.ConfigurableMessageHeaders.class);
        when(response.headers()).thenReturn(headers);

        Cookie invalidCookie = Cookie.builder().name("access-token").value("invalid.jwt.token").build();
        when(cookieCollection.all()).thenReturn(List.of(invalidCookie));

        filter.doFilter(request, response, chain);

        verify(response).statusCode(401);
        verify(response).send();
        verify(chain, never()).doFilter(request, response);
    }

    @Test
    @DisplayName("测试 sendUnAuthResponse 设置状态码和 header")
    void shouldSet401AndHeaderOnUnAuth() {
        // 模拟headers()方法返回的ConfigurableMessageHeaders
        var headers = mock(modelengine.fit.http.protocol.ConfigurableMessageHeaders.class);
        when(response.headers()).thenReturn(headers);

        filter.sendUnAuthResponse(response);

        verify(response).statusCode(401);
        verify(headers).add(eq("fit-redirect-to-prefix"), anyString());
        verify(response).send();
    }

    @Test
    @DisplayName("测试过滤器名称和优先级")
    void shouldHaveCorrectNameAndPriority() {
        assertThat(filter.name()).isEqualTo("OAuthJwtFilter");
        assertThat(filter.priority()).isEqualTo(-1000); // Order.HIGH 的实际值
    }

    @Test
    @DisplayName("测试匹配模式")
    void shouldHaveCorrectMatchPatterns() {
        assertThat(filter.matchPatterns()).containsExactly("/**");
        assertThat(filter.mismatchPatterns()).containsExactlyInAnyOrder("/api/app/v1/**",
                "/fit/check/**",
                "/v1/api/auth/callback",
                "/v1/api/auth/login",
                "/v1/api/auth/redirect");
    }
}
