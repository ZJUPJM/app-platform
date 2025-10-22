/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.fit.jade.aipp.northbound.controller;

import static org.assertj.core.api.Assertions.assertThatCode;

import modelengine.fit.http.protocol.Address;
import modelengine.fit.http.protocol.support.DefaultMessageHeaders;
import modelengine.fit.http.server.HttpClassicServerRequest;
import modelengine.fit.http.support.DefaultCookieCollection;
import modelengine.fit.jane.task.gateway.Authenticator;
import modelengine.fit.jober.aipp.dto.chat.AppQueryParams;
import modelengine.fit.jober.aipp.genericable.AppBuilderAppService;
import modelengine.fit.jober.aipp.genericable.adapter.AppBuilderAppServiceAdapter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;

/**
 * {@link AppBuilderAppController} 的测试类。
 *
 * @author 曹嘉美
 * @since 2024-12-17
 */
@DisplayName("测试 AppBuilderAppController")
@ExtendWith(MockitoExtension.class)
public class AppBuilderAppControllerTest {
    private AppBuilderAppController controller;
    @Mock
    private AppBuilderAppServiceAdapter appService;
    @Mock
    private AppBuilderAppService appGenericable;
    @Mock
    private Authenticator authenticator;
    @Mock
    private HttpClassicServerRequest request;

    @BeforeEach
    void before() {
        this.controller = new AppBuilderAppController(authenticator,
                appService,
                appGenericable,
                Collections.singletonList("testExcludeName"));
    }

    @Test
    @DisplayName("当查询用户应用列表时，返回正确结果。")
    void shouldReturnOkWhenGetAppList() {
        AppQueryParams cond =
                AppQueryParams.builder().name("name").state("state").offset(1).limit(2).build();
        Mockito.when(request.headers()).thenReturn(new DefaultMessageHeaders());
        Mockito.when(request.cookies()).thenReturn(new DefaultCookieCollection());
        Mockito.when(request.remoteAddress()).thenReturn(Address.builder().hostAddress("127.0.0.1").port(6666).build());
        assertThatCode(() -> this.controller.list(request, "123", cond)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("当查询用户应用配置时，返回正确结果。")
    void shouldReturnOkWhenGetAppConfig() {
        Mockito.when(request.headers()).thenReturn(new DefaultMessageHeaders());
        Mockito.when(request.cookies()).thenReturn(new DefaultCookieCollection());
        Mockito.when(request.remoteAddress()).thenReturn(Address.builder().hostAddress("127.0.0.1").port(6666).build());
        assertThatCode(() -> this.controller.query(request, "123", "456")).doesNotThrowAnyException();
    }
}
