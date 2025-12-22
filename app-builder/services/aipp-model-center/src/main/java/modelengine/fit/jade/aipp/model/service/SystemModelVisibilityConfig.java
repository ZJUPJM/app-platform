/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.fit.jade.aipp.model.service;

/**
 * 系统模型可见性配置管理接口。
 * 控制普通用户在编排应用时是否可以使用系统模型。
 *
 * @author Claude
 * @since 2025-12-17
 */
public interface SystemModelVisibilityConfig {
    /**
     * 获取系统模型对普通用户的可见性配置。
     *
     * @return true 表示可见，false 表示不可见
     */
    boolean isVisibleToUsers();

    /**
     * 设置系统模型对普通用户的可见性配置。
     *
     * @param visible true 表示可见，false 表示不可见
     */
    void setVisibleToUsers(boolean visible);
}
