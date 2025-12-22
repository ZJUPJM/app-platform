/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.fit.jade.aipp.model.service.impl;

import modelengine.fit.jade.aipp.model.dto.ModelAccessInfo;
import modelengine.fit.jade.aipp.model.dto.ModelListDto;
import modelengine.fit.jade.aipp.model.po.ModelAccessPo;
import modelengine.fit.jade.aipp.model.po.ModelPo;
import modelengine.fit.jade.aipp.model.po.UserModelPo;
import modelengine.fit.jade.aipp.model.repository.UserModelRepo;
import modelengine.fit.jade.aipp.model.service.AippModelCenterExtension;
import modelengine.fit.jade.aipp.model.service.SystemModelVisibilityConfig;
import modelengine.fit.jane.common.entity.OperationContext;
import modelengine.fitframework.annotation.Component;
import modelengine.fitframework.annotation.Fit;
import modelengine.fitframework.log.Logger;
import modelengine.fitframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 自定义的模型中心服务实现。
 *
 * @author songyongtan
 * @since 2025/3/6
 */
@Component("customAippModelCenter")
public class CustomAippModelCenter implements AippModelCenterExtension {
    private static final Logger LOG = Logger.get(CustomAippModelCenter.class);
    private static final String SYSTEM_USER = "system";

    // 平台内置功能的 scene 标识
    private static final String SCENE_PLATFORM_BUILTIN = "platform-builtin";

    private final UserModelRepo userModelRepo;

    private final AippModelCenterExtension defaultModelCenter;

    private final SystemModelVisibilityConfig visibilityConfig;

    private OperationContext systemContext;

    /**
     * 构造方法。
     *
     * @param userModelRepo repo 层。
     * @param defaultModelCenter 默认实现，找不到时会使用默认的进行兜底。
     * @param visibilityConfig 系统模型可见性配置。
     */
    public CustomAippModelCenter(UserModelRepo userModelRepo,
            @Fit(alias = "defaultAippModelCenter") AippModelCenterExtension defaultModelCenter,
            SystemModelVisibilityConfig visibilityConfig) {
        this.userModelRepo = userModelRepo;
        this.defaultModelCenter = defaultModelCenter;
        this.visibilityConfig = visibilityConfig;
        this.systemContext = new OperationContext();
        this.systemContext.setOperator(SYSTEM_USER);
    }

    @Override
    public ModelListDto fetchModelList(String type, String scene, OperationContext context) {
        LOG.info("[Custom][fetchModelList] operator={}, type={}, scene={}.", context.getOperator(), type, scene);

        // 判断是否应该包含系统模型
        // 1. 如果是平台内置功能，始终包含系统模型
        // 2. 如果是用户应用，根据配置决定
        boolean shouldIncludeSystemModels = SCENE_PLATFORM_BUILTIN.equals(scene) || visibilityConfig.isVisibleToUsers();

        // 1. 查询当前用户的个人模型（user_id = 当前用户）
        List<UserModelPo> personalUserModels = this.userModelRepo.listUserModelsByUserId(context.getOperator());

        // 2. 查询系统模型（user_id = 'system'）
        List<UserModelPo> systemUserModels = Collections.emptyList();
        if (shouldIncludeSystemModels) {
            systemUserModels = this.userModelRepo.listUserModelsByUserId(SYSTEM_USER);
            LOG.info("[Custom][fetchModelList] Include system models. visible={}, scene={}",
                    visibilityConfig.isVisibleToUsers(), scene);
        } else {
            LOG.info("[Custom][fetchModelList] Exclude system models. visible={}, scene={}",
                    visibilityConfig.isVisibleToUsers(), scene);
        }

        // 3. 合并两个列表
        List<UserModelPo> allUserModels = new ArrayList<>();
        allUserModels.addAll(personalUserModels);
        allUserModels.addAll(systemUserModels);

        if (CollectionUtils.isEmpty(allUserModels)) {
            if (this.defaultModelCenter == null) {
                return ModelListDto.builder().models(Collections.emptyList()).total(0).build();
            }
            return this.defaultModelCenter.fetchModelList(type, scene, context);
        }

        // 4. 获取所有模型ID
        List<String> modelIds = allUserModels.stream()
                .map(UserModelPo::getModelId)
                .distinct()
                .collect(Collectors.toList());

        // 5. 批量查询模型信息
        List<ModelPo> modelPos = this.userModelRepo.listModels(modelIds);
        Map<String, ModelPo> modelMap = modelPos.stream()
                .collect(Collectors.toMap(ModelPo::getModelId, m -> m, (a, b) -> a));

        // 6. 构建返回结果，正确设置 isDefault 值
        List<ModelAccessInfo> modelDtoList = allUserModels.stream()
                .filter(userModel -> {
                    // 如果指定了类型，只返回匹配类型的模型
                    if (type != null && !type.isEmpty()) {
                        ModelPo modelPo = modelMap.get(userModel.getModelId());
                        return modelPo != null && type.equals(modelPo.getType());
                    }
                    return true;
                })
                .map(userModel -> {
                    ModelPo modelPo = modelMap.get(userModel.getModelId());
                    if (modelPo == null) {
                        return null;
                    }

                    // 根据 user_id 判断是系统模型还是个人模型
                    boolean isSystemModel = SYSTEM_USER.equals(userModel.getUserId());

                    return ModelAccessInfo.builder()
                            .serviceName(modelPo.getName())
                            .baseUrl(modelPo.getBaseUrl())
                            .tag(CustomTag.pack(
                                    isSystemModel ? systemContext : context,
                                    modelPo
                            ))
                            .type(modelPo.getType())
                            .isDefault(isSystemModel && userModel.getIsDefault() == 1)  // 只有系统模型且 is_default=1 才返回 true
                            .build();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        return ModelListDto.builder().models(modelDtoList).total(modelDtoList.size()).build();
    }

    @Override
    public ModelAccessInfo getModelAccessInfo(String tag, String modelName, OperationContext context) {
        LOG.info("[Custom][getModelAccessInfo] operator={}, tag={}, name={}.",
                context == null ? "null" : context.getOperator(), tag, modelName);

        // 特殊处理：当 tag 或 modelName 为 "#DEFAULT#" 时，使用默认模型
        if ("#DEFAULT#".equals(tag) || "#DEFAULT#".equals(modelName)) {
            LOG.info("[Custom][getModelAccessInfo] Detected #DEFAULT# placeholder, using default model.");
            return this.getDefaultModel("chat_completions", context);
        }

        // context暂时不使用，当前内置工具调用大模型场景用不了，统一基于tag特殊处理。
        CustomTag customTag = CustomTag.unpack(tag);
        if (customTag == null) {
            ModelAccessInfo modelAccessInfo = this.defaultModelCenter.getModelAccessInfo(tag, modelName, context);
            if (modelAccessInfo != null) {
                return modelAccessInfo;
            }
            return this.defaultModelCenter.getModelAccessInfo(tag, modelName, systemContext);
        }

        // 首先检查用户是否试图访问系统模型（customTag.userId == 'system'）
        boolean isAccessingSystemModel = SYSTEM_USER.equals(customTag.userId);

        // 如果是访问系统模型，需要检查可见性配置
        if (isAccessingSystemModel) {
            // 检查当前操作者是否有权限访问系统模型
            // 1. 配置为可见 OR
            // 2. context为null（平台内置功能调用） OR
            // 3. 操作者是系统用户
            boolean canAccessSystemModel = visibilityConfig.isVisibleToUsers() ||
                    context == null ||
                    (context.getOperator() != null && SYSTEM_USER.equals(context.getOperator()));

            if (!canAccessSystemModel) {
                String operator = context == null ? "null" : context.getOperator();
                LOG.info("[Custom][getModelAccessInfo] Access to system model denied. visible={}, operator={}, tag={}, modelName={}",
                        visibilityConfig.isVisibleToUsers(), operator, tag, modelName);
                return null;
            }
        }

        ModelAccessPo accessInfo = this.userModelRepo.getModelAccessInfo(customTag.userId, customTag.tag, modelName);
        if (accessInfo == null) {
            // 如果当前用户没有该模型，尝试从系统模型获取（需要检查权限）
            // 1. 配置为可见 OR
            // 2. context为null（平台内置功能调用） OR
            // 3. 操作者是系统用户
            boolean allowSystemFallback = visibilityConfig.isVisibleToUsers() ||
                    context == null ||
                    (context.getOperator() != null && SYSTEM_USER.equals(context.getOperator()));

            if (allowSystemFallback) {
                String operator = context == null ? "null" : context.getOperator();
                LOG.info("[Custom][getModelAccessInfo] User model not found, trying system model. visible={}, operator={}",
                        visibilityConfig.isVisibleToUsers(), operator);
                accessInfo = this.userModelRepo.getModelAccessInfo(systemContext.getOperator(), customTag.tag, modelName);
            } else {
                String operator = context == null ? "null" : context.getOperator();
                LOG.info("[Custom][getModelAccessInfo] System model access denied. visible={}, operator={}",
                        visibilityConfig.isVisibleToUsers(), operator);
            }

            if (accessInfo == null) {
                return null;
            }
        }
        return ModelAccessInfo.builder()
                .serviceName(accessInfo.getModelPO().getName())
                .baseUrl(accessInfo.getModelPO().getBaseUrl())
                .tag(tag)
                .accessKey(accessInfo.getApiKey())
                .build();
    }

    @Override
    public ModelAccessInfo getDefaultModel(String type, OperationContext context) {
        String operator = context == null ? "null" : context.getOperator();
        LOG.info("[Custom][getDefaultModel] operator={}, type={}.", operator, type);

        // 1. 首先查询当前用户的默认模型（个人模型）
        ModelPo defaultModel = null;
        if (context != null && context.getOperator() != null) {
            defaultModel = this.userModelRepo.getDefaultModel(context.getOperator(), type);
        }

        // 2. 如果当前用户没有默认模型，考虑是否fallback到系统模型
        if (defaultModel == null) {
            // 判断是否允许fallback到系统模型：
            // - 如果配置为可见，允许所有用户fallback
            // - 如果 context 为 null，认为是平台内置功能，允许 fallback
            // - 如果配置为不可见，只允许系统用户fallback
            boolean allowSystemFallback = visibilityConfig.isVisibleToUsers() ||
                    context == null ||
                    (context.getOperator() != null && SYSTEM_USER.equals(context.getOperator()));

            if (allowSystemFallback) {
                LOG.info("[Custom][getDefaultModel] User has no default model, trying system default model (user_id='system'). visible={}, operator={}",
                        visibilityConfig.isVisibleToUsers(), operator);
                defaultModel = this.userModelRepo.getDefaultModel(SYSTEM_USER, type);
            } else {
                LOG.info("[Custom][getDefaultModel] System model fallback disabled. visible={}, operator={}",
                        visibilityConfig.isVisibleToUsers(), operator);
            }
        }

        // 3. 如果还没有，使用默认的 model center 兜底（如果存在）
        if (defaultModel == null) {
            if (this.defaultModelCenter != null) {
                LOG.info("[Custom][getDefaultModel] No default model found, using default model center.");
                return this.defaultModelCenter.getDefaultModel(type, context);
            } else {
                LOG.warn("[Custom][getDefaultModel] No default model found and defaultModelCenter is null. visible={}, operator={}",
                        visibilityConfig.isVisibleToUsers(), operator);
                return null;
            }
        }

        return ModelAccessInfo.builder()
                .serviceName(defaultModel.getName())
                .baseUrl(defaultModel.getBaseUrl())
                .tag(CustomTag.pack(context, defaultModel))
                .type(defaultModel.getType())
                .build();
    }

    private static class CustomTag {
        private String tag;

        private String userId;

        private CustomTag(String tag, String userId) {
            this.tag = tag;
            this.userId = userId;
        }

        private static String pack(OperationContext context, ModelPo po) {
            return po.getTag() + "," + context.getOperator();
        }

        private static CustomTag unpack(String tag) {
            // 格式："tag,userId"
            String[] split = tag.split(",");
            if (split.length != 2) {
                return null;
            }
            return new CustomTag(split[0], split[1]);
        }
    }
}
