/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.jade.store.tool.upload.factory;

import static modelengine.fitframework.inspection.Validation.notNull;

import modelengine.fel.tool.ToolFactoryRepository;
import modelengine.fitframework.annotation.Component;
import modelengine.fitframework.log.Logger;

/**
 * MCP 工具工厂启动器，用于注册 MCP 工具工厂。
 *
 * @author Generated
 * @since 2025-10-24
 */
@Component
public class McpToolFactoryStarter {
    private static final Logger log = Logger.get(McpToolFactoryStarter.class);

    /**
     * 构造启动器并注册 MCP 工具工厂。
     *
     * @param toolFactoryRepository 表示工具工厂仓库的 {@link ToolFactoryRepository}。
     * @param mcpToolFactory 表示 MCP 工具工厂的 {@link McpToolFactory}。
     */
    public McpToolFactoryStarter(ToolFactoryRepository toolFactoryRepository, McpToolFactory mcpToolFactory) {
        notNull(toolFactoryRepository, "The tool factory repository cannot be null.");
        notNull(mcpToolFactory, "The MCP tool factory cannot be null.");
        
        log.info("Registering MCP tool factory...");
        toolFactoryRepository.register(mcpToolFactory);
        log.info("MCP tool factory registered successfully. Type: {}", mcpToolFactory.type());
    }
}

