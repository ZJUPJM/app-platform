/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.fit.jober.aipp.validation.impl;

import modelengine.fit.jober.aipp.common.exception.AippErrCode;
import modelengine.fit.jober.aipp.common.exception.AippException;
import modelengine.fit.jober.aipp.domains.task.AppTask;
import modelengine.fit.jober.aipp.domains.task.service.AppTaskService;
import modelengine.fit.jober.aipp.domains.taskinstance.service.AppTaskInstanceService;
import modelengine.fit.jober.aipp.dto.AppBuilderAppDto;
import modelengine.fit.jober.aipp.validation.GuestValidator;
import modelengine.fitframework.annotation.Component;
import modelengine.fitframework.util.ObjectUtils;

import static modelengine.fit.jober.aipp.common.exception.AippErrCode.APP_NOT_IN_GUEST_MODE;

/**
 * 游客模式校验器实现类
 *
 * @author 邬涨财
 * @since 2025/09/22
 */
@Component
public class GuestValidatorImpl implements GuestValidator {
    private final modelengine.fit.jober.aipp.genericable.AppBuilderAppService appGenericable;
    private final AppTaskInstanceService appTaskInstanceService;
    private final AppTaskService appTaskService;

    public GuestValidatorImpl(modelengine.fit.jober.aipp.genericable.AppBuilderAppService appGenericable,
        AppTaskInstanceService appTaskInstanceService,
        AppTaskService appTaskService) {
        this.appGenericable = appGenericable;
        this.appTaskInstanceService = appTaskInstanceService;
        this.appTaskService = appTaskService;
    }

    @Override
    public void validateByAppId(String appId) {
        AppBuilderAppDto appDto = this.appGenericable.query(appId, null);
        boolean allow_guest = ObjectUtils.cast(appDto.getAttributes().getOrDefault("allow_guest", false));
        if (!allow_guest) {
            throw new AippException(APP_NOT_IN_GUEST_MODE);
        }
    }

    @Override
    public void validateByInstanceId(String instanceId) {
        String taskId = this.appTaskInstanceService.getTaskId(instanceId);
        AppTask task = this.appTaskService.getTaskById(taskId, null)
                .orElseThrow(() -> new AippException(AippErrCode.TASK_NOT_FOUND));
        String appId = task.getEntity().getAppId();
        this.validateByAppId(appId);
    }
}
