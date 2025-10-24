/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.jade.store.tool.upload.controller;

import static modelengine.fitframework.inspection.Validation.notBlank;
import static modelengine.fitframework.inspection.Validation.notNull;

import modelengine.fel.tool.info.entity.HttpJsonEntity;
import modelengine.fit.http.annotation.DeleteMapping;
import modelengine.fit.http.annotation.GetMapping;
import modelengine.fit.http.annotation.PathVariable;
import modelengine.fit.http.annotation.PostMapping;
import modelengine.fit.http.annotation.PutMapping;
import modelengine.fit.http.annotation.RequestBody;
import modelengine.fit.http.annotation.RequestHeader;
import modelengine.fit.http.annotation.RequestMapping;
import modelengine.fit.http.annotation.RequestParam;
import modelengine.fit.http.entity.NamedEntity;
import modelengine.fit.http.entity.PartitionedEntity;
import modelengine.fit.jade.aipp.domain.division.annotation.CreateSource;
import modelengine.fitframework.annotation.Component;
import modelengine.jade.common.Result;
import modelengine.jade.common.exception.ModelEngineException;
import modelengine.jade.service.annotations.CarverSpan;
import modelengine.jade.service.annotations.SpanAttr;
import modelengine.jade.store.code.PluginRetCode;
import modelengine.jade.store.entity.aop.PluginValidation;
import modelengine.jade.store.tool.upload.dto.McpProviderRequest;
import modelengine.jade.store.tool.upload.dto.McpProviderResponse;
import modelengine.jade.store.tool.upload.service.McpProviderService;
import modelengine.jade.store.tool.upload.service.PluginUploadService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 表示上传文件的控制器。
 *
 * @author 杭潇
 * @since 2024-07-11
 */
@Component
@RequestMapping("/plugins")
public class UploadPluginController {
    private final PluginUploadService pluginUploadService;
    private final McpProviderService mcpProviderService;

    /**
     * 通过插件服务来初始化 {@link UploadPluginController} 的新实例。
     *
     * @param pluginUploadService 表示插件上传服务的 {@link PluginUploadService}。
     * @param mcpProviderService 表示 MCP 提供者服务的 {@link McpProviderService}。
     */
    public UploadPluginController(PluginUploadService pluginUploadService, McpProviderService mcpProviderService) {
        this.pluginUploadService = notNull(pluginUploadService, "The plugin deploy service cannot be null.");
        this.mcpProviderService = notNull(mcpProviderService, "The MCP provider service cannot be null.");
    }

    /**
     * 表示保存上传工具文件的请求。
     *
     * @param receivedFiles 表示分块的消息体数据的 {@link PartitionedEntity}。
     * @param toolNames 表示工具名的列表的 {@link String}。
     * @return 表示格式化之后的返回消息的 {@link Result}{@code <}{@link String}{@code >}。
     */
    @CarverSpan("operation.store.plugin.upload")
    @PostMapping(path = "/save/plugins", description = "保存上传工具文件")
    @CreateSource
    public Result<String> saveUploadFile(PartitionedEntity receivedFiles,
            @RequestParam("toolNames") @SpanAttr("toolNames") List<String> toolNames) {
        notNull(receivedFiles, "The file to be uploaded cannot be null.");
        notNull(toolNames, "The tools name cannot be null.");
        List<NamedEntity> entityList =
                receivedFiles.entities().stream().filter(NamedEntity::isFile).collect(Collectors.toList());
        if (entityList.isEmpty()) {
            throw new ModelEngineException(PluginRetCode.NO_FILE_UPLOADED_ERROR);
        }
        this.pluginUploadService.uploadPlugins(entityList, toolNames);
        return Result.ok(null, 1);
    }

    /**
     * 删除插件的请求。
     *
     * @param pluginId 表示插件唯一标识的 {@link String}。
     * @return 表示格式化之后的返回消息的 {@link Result}{@code <}{@link String}{@code >}。
     */
    @CarverSpan("operation.store.plugin.delete")
    @DeleteMapping(value = "/delete/{pluginId}", description = "删除插件")
    @PluginValidation
    public Result<String> deletePlugin(@PathVariable("pluginId") @SpanAttr("pluginId") String pluginId) {
        notBlank(pluginId, "The plugin id cannot be blank.");
        int deleteNum = this.pluginUploadService.deletePlugin(pluginId);
        return Result.ok(null, deleteNum);
    }

    /**
     * 表示保存上传工具文件的请求。
     *
     * @param httpEntity 表示 Http 工具的消息体 {@link HttpJsonEntity}。
     * @return 表示格式化之后的返回消息的 {@link Result}{@code <}{@link String}{@code >}。
     */
    @CarverSpan("operation.store.plugin.http")
    @PostMapping(path = "/save/http", description = "保存上传 http 工具")
    @CreateSource
    public Result<String> saveUploadHttp(@RequestBody @SpanAttr("name:$.name") HttpJsonEntity httpEntity) {
        notNull(httpEntity, "The http plugin cannot be null.");
        this.pluginUploadService.uploadHttp(httpEntity);
        return Result.ok(null, 1);
    }

    /**
     * 创建 MCP 工具提供者。
     *
     * @param request 表示创建请求的 {@link McpProviderRequest}。
     * @param userId 表示用户 ID 的 {@link String}。
     * @return 表示格式化之后的返回消息的 {@link Result}{@code <}{@link McpProviderResponse}{@code >}。
     */
    @CarverSpan("operation.store.mcp.create")
    @PostMapping(path = "/mcp", description = "创建 MCP 工具提供者")
    @CreateSource
    public Result<McpProviderResponse> createMcpProvider(
            @RequestBody @SpanAttr("name:$.name") McpProviderRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        notNull(request, "The MCP provider request cannot be null.");
        String effectiveUserId = notBlank(userId, "The user ID cannot be blank.");
        McpProviderResponse response = this.mcpProviderService.createMcpProvider(request, effectiveUserId);
        return Result.ok(response, 1);
    }

    /**
     * 更新 MCP 工具提供者。
     *
     * @param providerId 表示提供者 ID 的 {@link String}。
     * @param request 表示更新请求的 {@link McpProviderRequest}。
     * @param userId 表示用户 ID 的 {@link String}。
     * @return 表示格式化之后的返回消息的 {@link Result}{@code <}{@link McpProviderResponse}{@code >}。
     */
    @CarverSpan("operation.store.mcp.update")
    @PutMapping(path = "/mcp/{providerId}", description = "更新 MCP 工具提供者")
    public Result<McpProviderResponse> updateMcpProvider(
            @PathVariable("providerId") @SpanAttr("providerId") String providerId,
            @RequestBody McpProviderRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        notBlank(providerId, "The provider ID cannot be blank.");
        notNull(request, "The MCP provider request cannot be null.");
        String effectiveUserId = notBlank(userId, "The user ID cannot be blank.");
        McpProviderResponse response = this.mcpProviderService.updateMcpProvider(providerId, request, effectiveUserId);
        return Result.ok(response, 1);
    }

    /**
     * 删除 MCP 工具提供者。
     *
     * @param providerId 表示提供者 ID 的 {@link String}。
     * @param userId 表示用户 ID 的 {@link String}。
     * @return 表示格式化之后的返回消息的 {@link Result}{@code <}{@link String}{@code >}。
     */
    @CarverSpan("operation.store.mcp.delete")
    @DeleteMapping(path = "/mcp/{providerId}", description = "删除 MCP 工具提供者")
    @PluginValidation
    public Result<String> deleteMcpProvider(
            @PathVariable("providerId") @SpanAttr("providerId") String providerId,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        notBlank(providerId, "The provider ID cannot be blank.");
        String effectiveUserId = notBlank(userId, "The user ID cannot be blank.");
        int deleteNum = this.mcpProviderService.deleteMcpProvider(providerId, effectiveUserId);
        return Result.ok(null, deleteNum);
    }

    /**
     * 获取 MCP 工具提供者列表。
     *
     * @param userId 表示用户 ID 的 {@link String}。
     * @return 表示格式化之后的返回消息的 {@link Result}{@code <}{@link Map}{@code <}{@link String}{@code , }{@link Object}{@code >}{@code >}。
     */
    @CarverSpan("operation.store.mcp.list")
    @GetMapping(path = "/mcp", description = "获取 MCP 工具提供者列表")
    public Result<Map<String, Object>> listMcpProviders(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        String effectiveUserId = notBlank(userId, "The user ID cannot be blank.");
        List<McpProviderResponse> providers = this.mcpProviderService.listMcpProviders(effectiveUserId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("items", providers);
        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", 1);
        pagination.put("page_size", providers.size());
        pagination.put("total", providers.size());
        pagination.put("total_pages", 1);
        result.put("pagination", pagination);
        
        return Result.ok(result, providers.size());
    }

    /**
     * 获取 MCP 工具提供者详情。
     *
     * @param providerId 表示提供者 ID 的 {@link String}。
     * @param userId 表示用户 ID 的 {@link String}。
     * @return 表示格式化之后的返回消息的 {@link Result}{@code <}{@link McpProviderResponse}{@code >}。
     */
    @CarverSpan("operation.store.mcp.get")
    @GetMapping(path = "/mcp/{providerId}", description = "获取 MCP 工具提供者详情")
    public Result<McpProviderResponse> getMcpProvider(
            @PathVariable("providerId") @SpanAttr("providerId") String providerId,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        notBlank(providerId, "The provider ID cannot be blank.");
        String effectiveUserId = notBlank(userId, "The user ID cannot be blank.");
        McpProviderResponse response = this.mcpProviderService.getMcpProvider(providerId, effectiveUserId);
        return Result.ok(response, 1);
    }

    /**
     * 测试 MCP 连接。
     *
     * @param request 表示测试请求的 {@link McpProviderRequest}。
     * @return 表示格式化之后的返回消息的 {@link Result}{@code <}{@link McpProviderResponse}{@code >}。
     */
    @CarverSpan("operation.store.mcp.test")
    @PostMapping(path = "/mcp/test-connection", description = "测试 MCP 连接")
    public Result<McpProviderResponse> testMcpConnection(@RequestBody McpProviderRequest request) {
        notNull(request, "The MCP provider request cannot be null.");
        McpProviderResponse response = this.mcpProviderService.testConnection(request);
        return Result.ok(response, 1);
    }
}