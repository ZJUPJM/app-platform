/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.fit.jade.aipp.northbound.controller;

import modelengine.fit.http.annotation.DeleteMapping;
import modelengine.fit.http.annotation.GetMapping;
import modelengine.fit.http.annotation.PathVariable;
import modelengine.fit.http.annotation.PostMapping;
import modelengine.fit.http.annotation.PutMapping;
import modelengine.fit.http.annotation.RequestBean;
import modelengine.fit.http.annotation.RequestBody;
import modelengine.fit.http.annotation.RequestMapping;
import modelengine.fit.http.server.HttpClassicServerRequest;
import modelengine.fit.jane.common.controller.AbstractController;
import modelengine.fit.jane.common.response.Rsp;
import modelengine.fit.jane.task.gateway.Authenticator;
import modelengine.fitframework.annotation.Component;
import modelengine.fitframework.annotation.Property;
import modelengine.fitframework.broker.client.BrokerClient;
import modelengine.fitframework.broker.client.filter.route.FitableIdFilter;

import java.util.List;

/**
 * 模型配置管理北向接口。
 *
 * @author Claude
 * @since 2025-11-25
 */
@Component
@RequestMapping(path = "/v1/api/{tenant_id}/models", group = "模型配置管理接口")
public class ModelConfigController extends AbstractController {
    // UserModelConfig 的 @Fitable ID
    private static final String FITABLE_ID = "aipp.model.service.impl";

    // 每个方法的 @Genericable ID
    private static final String GENERICABLE_GET_LIST = "modelengine.fit.jade.aipp.model.service.getUserModelList";
    private static final String GENERICABLE_ADD = "modelengine.fit.jade.aipp.model.service.addUserModel";
    private static final String GENERICABLE_DELETE = "modelengine.fit.jade.aipp.model.service.deleteUserModel";
    private static final String GENERICABLE_SWITCH = "modelengine.fit.jade.aipp.model.service.switchDefaultModel";

    private final BrokerClient brokerClient;

    /**
     * 构造方法。
     *
     * @param authenticator 表示身份校验器的 {@link Authenticator}。
     * @param brokerClient 表示Broker客户端的 {@link BrokerClient}。
     */
    public ModelConfigController(Authenticator authenticator, BrokerClient brokerClient) {
        super(authenticator);
        this.brokerClient = brokerClient;
    }

    /**
     * 查询用户模型列表。
     *
     * @param httpRequest 表示 Http 请求体的 {@link HttpClassicServerRequest}。
     * @param tenantId 表示租户的唯一标识符的 {@link String}。
     * @return 表示用户模型列表的 {@link Rsp}{@code <}{@link List}{@code >}。
     */
    @GetMapping(summary = "查询用户模型列表",
            description = "该接口可以查询指定用户的所有可用模型列表。")
    public Rsp<List> list(HttpClassicServerRequest httpRequest,
            @PathVariable("tenant_id") @Property(description = "租户的唯一标识符") String tenantId) {
        String userId = this.contextOf(httpRequest, tenantId).getOperator();

        List result = this.brokerClient.getRouter(GENERICABLE_GET_LIST)
                .route(new FitableIdFilter(FITABLE_ID))
                .invoke(userId);

        return Rsp.ok(result);
    }

    /**
     * 添加用户模型。
     *
     * @param httpRequest 表示 Http 请求体的 {@link HttpClassicServerRequest}。
     * @param tenantId 表示租户的唯一标识符的 {@link String}。
     * @param request 表示添加模型请求的 {@link AddModelRequest}。
     * @return 表示操作结果的 {@link Rsp}{@code <}{@link String}{@code >}。
     */
    @PostMapping(summary = "添加用户模型",
            description = "该接口可以为用户添加新的可用模型配置。")
    public Rsp<String> add(HttpClassicServerRequest httpRequest,
            @PathVariable("tenant_id") @Property(description = "租户的唯一标识符") String tenantId,
            @RequestBody AddModelRequest request) {
        String userId = this.contextOf(httpRequest, tenantId).getOperator();

        String result = this.brokerClient.getRouter(GENERICABLE_ADD)
                .route(new FitableIdFilter(FITABLE_ID))
                .invoke(userId, request.getApiKey(), request.getModelName(), request.getBaseUrl(), request.getType());

        // 如果需要设置为默认模型，则调用切换默认模型接口
        if (request.getIsDefault() != null && request.getIsDefault()) {
            // 获取刚添加的模型列表，找到最新的模型ID
            List models = this.brokerClient.getRouter(GENERICABLE_GET_LIST)
                    .route(new FitableIdFilter(FITABLE_ID))
                    .invoke(userId);
            if (!models.isEmpty()) {
                // 假设返回的列表中最后一个是最新添加的
                Object lastModel = models.get(models.size() - 1);
                if (lastModel instanceof java.util.Map) {
                    String modelId = (String) ((java.util.Map) lastModel).get("modelId");
                    if (modelId != null) {
                        this.brokerClient.getRouter(GENERICABLE_SWITCH)
                                .route(new FitableIdFilter(FITABLE_ID))
                                .invoke(userId, modelId);
                    }
                }
            }
        }

        return Rsp.ok(result);
    }

    /**
     * 删除用户模型。
     *
     * @param httpRequest 表示 Http 请求体的 {@link HttpClassicServerRequest}。
     * @param tenantId 表示租户的唯一标识符的 {@link String}。
     * @param modelId 表示模型的唯一标识符的 {@link String}。
     * @return 表示操作结果的 {@link Rsp}{@code <}{@link String}{@code >}。
     */
    @DeleteMapping(path = "/{modelId}", summary = "删除用户模型",
            description = "该接口可以删除用户指定的模型配置。")
    public Rsp<String> delete(HttpClassicServerRequest httpRequest,
            @PathVariable("tenant_id") @Property(description = "租户的唯一标识符") String tenantId,
            @PathVariable("modelId") @Property(description = "模型的唯一标识符") String modelId) {
        String userId = this.contextOf(httpRequest, tenantId).getOperator();

        String result = this.brokerClient.getRouter(GENERICABLE_DELETE)
                .route(new FitableIdFilter(FITABLE_ID))
                .invoke(userId, modelId);

        return Rsp.ok(result);
    }

    /**
     * 切换默认模型。
     *
     * @param httpRequest 表示 Http 请求体的 {@link HttpClassicServerRequest}。
     * @param tenantId 表示租户的唯一标识符的 {@link String}。
     * @param modelId 表示模型的唯一标识符的 {@link String}。
     * @return 表示操作结果的 {@link Rsp}{@code <}{@link String}{@code >}。
     */
    @PutMapping(path = "/{modelId}/default", summary = "切换默认模型",
            description = "该接口可以将指定模型设置为用户的默认模型。")
    public Rsp<String> switchDefault(HttpClassicServerRequest httpRequest,
            @PathVariable("tenant_id") @Property(description = "租户的唯一标识符") String tenantId,
            @PathVariable("modelId") @Property(description = "模型的唯一标识符") String modelId) {
        String userId = this.contextOf(httpRequest, tenantId).getOperator();

        String result = this.brokerClient.getRouter(GENERICABLE_SWITCH)
                .route(new FitableIdFilter(FITABLE_ID))
                .invoke(userId, modelId);

        return Rsp.ok(result);
    }

    /**
     * 添加模型请求类。
     */
    public static class AddModelRequest {
        @Property(description = "模型名称")
        private String modelName;

        @Property(description = "API Key")
        private String apiKey;

        @Property(description = "Base URL")
        private String baseUrl;

        @Property(description = "模型类型")
        private String type;

        @Property(description = "是否设置为默认")
        private Boolean isDefault;

        public String getModelName() {
            return this.modelName;
        }

        public void setModelName(String modelName) {
            this.modelName = modelName;
        }

        public String getApiKey() {
            return this.apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public String getBaseUrl() {
            return this.baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public String getType() {
            return this.type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public Boolean getIsDefault() {
            return this.isDefault;
        }

        public void setIsDefault(Boolean isDefault) {
            this.isDefault = isDefault;
        }
    }
}
