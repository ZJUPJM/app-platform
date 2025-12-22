/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.fit.jade.aipp.model.service.impl;

import modelengine.fit.jade.aipp.model.service.SystemModelVisibilityConfig;
import modelengine.fitframework.annotation.Component;

import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 系统模型可见性配置管理实现。
 * 控制普通用户在编排应用时是否可以使用系统模型。
 *
 * @author Claude
 * @since 2025-12-17
 */
@Component
public class SystemModelVisibilityConfigService implements SystemModelVisibilityConfig {
    // 使用 AtomicBoolean 保证线程安全
    // 默认值为 false：系统模型对普通用户不可见
    private final AtomicBoolean visibleToUsers = new AtomicBoolean(false);

    /**
     * 获取系统模型对普通用户的可见性配置。
     *
     * @return true 表示可见，false 表示不可见
     */
    @Override
    public boolean isVisibleToUsers() {
        return visibleToUsers.get();
    }

    /**
     * 设置系统模型对普通用户的可见性配置。
     *
     * @param visible true 表示可见，false 表示不可见
     */
    @Override
    public void setVisibleToUsers(boolean visible) {
        visibleToUsers.set(visible);
    }
}
