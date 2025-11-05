/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.jade.store.tool.upload.factory;

import static modelengine.fitframework.inspection.Validation.notBlank;
import static modelengine.fitframework.inspection.Validation.notNull;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import modelengine.fel.tool.Tool;
import modelengine.fel.tool.mcp.client.McpClient;
import modelengine.fel.tool.mcp.client.McpClientFactory;
import modelengine.fitframework.inspection.Nonnull;
import modelengine.fitframework.log.Logger;
import modelengine.fitframework.util.ObjectUtils;
import modelengine.jade.store.tool.upload.util.McpUtils;

import java.io.IOException;
import java.util.Map;

/**
 * 表示 MCP 工具的实现。
 *
 * @author Generated
 * @since 2025-10-24
 */
public class McpTool implements Tool {
    private static final Logger log = Logger.get(McpTool.class);
    // 使用与 AippConst 相同的常量值
    private static final String MCP_SERVER_KEY = "mcpServer";
    private static final String MCP_SERVER_URL_KEY = "url";
    private static final String TOOL_REAL_NAME = "toolRealName";
    
    private final McpClientFactory mcpClientFactory;
    private final Info toolInfo;
    private final Metadata metadata;

    /**
     * 构造 MCP 工具实例。
     *
     * @param mcpClientFactory 表示 MCP 客户端工厂的 {@link McpClientFactory}。
     * @param toolInfo 表示工具信息的 {@link Info}。
     * @param metadata 表示工具元数据的 {@link Metadata}。
     */
    public McpTool(McpClientFactory mcpClientFactory, Info toolInfo, Metadata metadata) {
        this.mcpClientFactory = notNull(mcpClientFactory, "The MCP client factory cannot be null.");
        this.toolInfo = notNull(toolInfo, "The tool info cannot be null.");
        this.metadata = notNull(metadata, "The tool metadata cannot be null.");
    }

    @Nonnull
    @Override
    public Info info() {
        return this.toolInfo;
    }

    @Nonnull
    @Override
    public Metadata metadata() {
        return this.metadata;
    }

    @Override
    public Object execute(Object... args) {
        log.info("Executing MCP tool with args: {}", args);
        // MCP 工具通常通过 JSON 调用，不使用可变参数方式
        throw new UnsupportedOperationException("MCP tools should be called via executeWithJson or executeWithJsonObject");
    }

    @Override
    public Object executeWithJson(String jsonArgs) {
        notBlank(jsonArgs, "The json arguments cannot be blank.");
        return executeWithJsonObject(JSONObject.parseObject(jsonArgs));
    }

    @Override
    public Object executeWithJsonObject(Map<String, Object> jsonObject) {
        notNull(jsonObject, "The json object cannot be null.");
        
        // 从 extensions 中获取 MCP 服务器配置
        Map<String, Object> extensions = this.toolInfo.extensions();
        log.info("Tool extensions: {}", extensions);
        
        if (extensions == null) {
            log.error("Tool extensions is null for tool: {}", this.toolInfo.uniqueName());
            throw new IllegalStateException("Tool extensions is null.");
        }
        
        if (!extensions.containsKey(MCP_SERVER_KEY)) {
            log.error("MCP_SERVER_KEY not found in extensions. Available keys: {}", extensions.keySet());
            throw new IllegalStateException("MCP server configuration not found in tool extensions.");
        }
        
        Map<String, Object> mcpServerConfig = ObjectUtils.cast(extensions.get(MCP_SERVER_KEY));
        String url = notBlank(ObjectUtils.cast(mcpServerConfig.get(MCP_SERVER_URL_KEY)),
                "The MCP server URL cannot be blank.");
        
        // 获取工具的真实名称
        String toolRealName = ObjectUtils.cast(extensions.get(TOOL_REAL_NAME));
        if (toolRealName == null) {
            // 从 uniqueName 中提取真实名称（格式: serverIdentifier_toolName）
            String uniqueName = this.toolInfo.uniqueName();
            int lastUnderscoreIndex = uniqueName.lastIndexOf('_');
            toolRealName = lastUnderscoreIndex > 0 ? uniqueName.substring(lastUnderscoreIndex + 1) : uniqueName;
        }
        
        log.info("Executing MCP tool: toolName={}, uniqueName={}, url={}", toolRealName, this.toolInfo.uniqueName(), url);
        
        // 调用 MCP 服务器
        try (McpClient mcpClient = mcpClientFactory.create(McpUtils.getBaseUrl(url), McpUtils.getSseEndpoint(url))) {
            mcpClient.initialize();
            Object result = mcpClient.callTool(toolRealName, jsonObject);
            log.info("MCP tool executed successfully: toolName={}", toolRealName);
            return result;
        } catch (IOException exception) {
            log.error("Failed to execute MCP tool: toolName={}, url={}", toolRealName, url, exception);
            throw new IllegalStateException("Failed to call MCP server: " + exception.getMessage(), exception);
        }
    }

    @Override
    public String prettyExecute(Object... args) {
        Object result = execute(args);
        return result != null ? result.toString() : "";
    }

    @Override
    public String prettyExecuteWithJson(String jsonArgs) {
        Object result = executeWithJson(jsonArgs);
        return result != null ? result.toString() : "";
    }

    @Override
    public String prettyExecuteWithJsonObject(Map<String, Object> jsonObject) {
        Object result = executeWithJsonObject(jsonObject);
        return result != null ? result.toString() : "";
    }

    @Override
    public String prettyExecute(Tool converter, Object... args) {
        Object result = execute(args);
        if (converter == null || result == null) {
            return result != null ? result.toString() : "";
        }
        // 使用转换器处理结果
        return converter.executeWithJsonObject(Map.of("input", result)).toString();
    }

    @Override
    public String prettyExecuteWithJson(Tool converter, String jsonArgs) {
        Object result = executeWithJson(jsonArgs);
        if (converter == null || result == null) {
            return result != null ? result.toString() : "";
        }
        return converter.executeWithJsonObject(Map.of("input", result)).toString();
    }

    @Override
    public String prettyExecuteWithJsonObject(Tool converter, Map<String, Object> jsonObject) {
        Object result = executeWithJsonObject(jsonObject);
        if (converter == null || result == null) {
            return result != null ? result.toString() : "";
        }
        return converter.executeWithJsonObject(Map.of("input", result)).toString();
    }
}

