/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.jade.store.tool.upload.service;

import modelengine.jade.store.tool.upload.dto.McpProviderRequest;
import modelengine.jade.store.tool.upload.dto.McpProviderResponse;

import java.util.List;

/**
 * 表示 MCP 工具提供者服务的接口。
 *
 * @author Generated
 * @since 2025-10-24
 */
public interface McpProviderService {

    /**
     * 创建 MCP 工具提供者。
     *
     * @param request 表示创建请求的 {@link McpProviderRequest}。
     * @param userId 表示用户 ID 的 {@link String}。
     * @return 表示创建结果的 {@link McpProviderResponse}。
     */
    McpProviderResponse createMcpProvider(McpProviderRequest request, String userId);

    /**
     * 更新 MCP 工具提供者。
     *
     * @param providerId 表示提供者 ID 的 {@link String}。
     * @param request 表示更新请求的 {@link McpProviderRequest}。
     * @param userId 表示用户 ID 的 {@link String}。
     * @return 表示更新结果的 {@link McpProviderResponse}。
     */
    McpProviderResponse updateMcpProvider(String providerId, McpProviderRequest request, String userId);

    /**
     * 删除 MCP 工具提供者。
     *
     * @param providerId 表示提供者 ID 的 {@link String}。
     * @param userId 表示用户 ID 的 {@link String}。
     * @return 表示删除数量的 {@code int}。
     */
    int deleteMcpProvider(String providerId, String userId);

    /**
     * 获取 MCP 工具提供者列表。
     *
     * @param userId 表示用户 ID 的 {@link String}。
     * @return 表示提供者列表的 {@link List}{@code <}{@link McpProviderResponse}{@code >}。
     */
    List<McpProviderResponse> listMcpProviders(String userId);

    /**
     * 获取 MCP 工具提供者详情。
     *
     * @param providerId 表示提供者 ID 的 {@link String}。
     * @param userId 表示用户 ID 的 {@link String}。
     * @return 表示提供者详情的 {@link McpProviderResponse}。
     */
    McpProviderResponse getMcpProvider(String providerId, String userId);

    /**
     * 测试 MCP 连接。
     *
     * @param request 表示测试请求的 {@link McpProviderRequest}。
     * @return 表示连接测试结果的 {@link McpProviderResponse}。
     */
    McpProviderResponse testConnection(McpProviderRequest request);
}

