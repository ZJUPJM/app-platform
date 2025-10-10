/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.fit.jober.aipp.validation;

/**
 * 游客模式校验器
 *
 * @author 邬涨财
 * @since 2025/09/22
 */
public interface GuestValidator {
    /**
     * 通过应用唯一标识校验游客模式。
     *
     * @param appId 表示应用的唯一标识的 {@link String}。
     */
    void validateByAppId(String appId);

    /**
     * 通过应用唯一实例标识校验游客模式。
     *
     * @param instanceId 表示应用唯一实例标识的 {@link String}。
     */
    void validateByInstanceId(String instanceId);
}
