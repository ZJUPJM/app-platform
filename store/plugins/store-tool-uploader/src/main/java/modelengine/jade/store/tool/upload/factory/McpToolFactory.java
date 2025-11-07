/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.jade.store.tool.upload.factory;

import static modelengine.fitframework.inspection.Validation.notNull;

import modelengine.fel.tool.Tool;
import modelengine.fel.tool.ToolFactory;
import modelengine.fel.tool.mcp.client.McpClientFactory;
import modelengine.fitframework.annotation.Component;
import modelengine.fitframework.inspection.Nonnull;
import modelengine.fitframework.log.Logger;

/**
 * 表示 {@link ToolFactory} 的 MCP 实现。
 *
 * @author Generated
 * @since 2025-10-24
 */
@Component
public class McpToolFactory implements ToolFactory {
    private static final Logger log = Logger.get(McpToolFactory.class);
    
    private final McpClientFactory mcpClientFactory;

    /**
     * 构造 MCP 工具工厂实例。
     *
     * @param mcpClientFactory 表示 MCP 客户端工厂的 {@link McpClientFactory}。
     */
    public McpToolFactory(McpClientFactory mcpClientFactory) {
        this.mcpClientFactory = notNull(mcpClientFactory, "The MCP client factory cannot be null.");
    }

    @Nonnull
    @Override
    public String type() {
        return "MCP";
    }

    @Override
    public Tool create(Tool.Info toolInfo, Tool.Metadata metadata) {
        log.info("Creating MCP tool: uniqueName={}", toolInfo.uniqueName());
        return new McpTool(this.mcpClientFactory, toolInfo, metadata);
    }
}

