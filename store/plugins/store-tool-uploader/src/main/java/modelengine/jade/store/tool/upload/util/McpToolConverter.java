/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.jade.store.tool.upload.util;

import modelengine.fel.tool.mcp.entity.Tool;
import modelengine.jade.store.tool.upload.dto.McpToolInfo;
import modelengine.jade.store.tool.upload.dto.McpToolParameter;
import modelengine.fitframework.util.MapBuilder;
import modelengine.fitframework.util.ObjectUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * MCP 工具转换器，用于将 MCP 工具转换为响应格式。
 *
 * @author Generated
 * @since 2025-10-24
 */
public final class McpToolConverter {

    private McpToolConverter() {
        // 工具类，禁止实例化
    }

    /**
     * 将 MCP Tool 转换为 McpToolInfo。
     *
     * @param tool 表示 MCP 工具的 {@link Tool}。
     * @param author 表示作者的 {@link String}。
     * @return 表示工具信息的 {@link McpToolInfo}。
     */
    public static McpToolInfo convertToToolInfo(Tool tool, String author) {
        McpToolInfo toolInfo = new McpToolInfo();
        toolInfo.setAuthor(author);
        toolInfo.setName(tool.getName());
        toolInfo.setLabel(buildMultiLangMap(tool.getName()));
        toolInfo.setDescription(buildMultiLangMap(tool.getDescription()));
        toolInfo.setParameters(convertParameters(tool.getInputSchema()));
        toolInfo.setLabels(Collections.emptyList());
        toolInfo.setOutputSchema(Collections.emptyMap());
        return toolInfo;
    }

    /**
     * 将输入 Schema 转换为参数列表。
     *
     * @param inputSchema 表示输入 Schema 的 {@link Map}{@code <}{@link String}{@code , }{@link Object}{@code >}。
     * @return 表示参数列表的 {@link List}{@code <}{@link McpToolParameter}{@code >}。
     */
    private static List<McpToolParameter> convertParameters(Map<String, Object> inputSchema) {
        if (inputSchema == null || !inputSchema.containsKey("properties")) {
            return Collections.emptyList();
        }

        Map<String, Object> properties = ObjectUtils.cast(inputSchema.get("properties"));
        List<String> required = ObjectUtils.cast(inputSchema.getOrDefault("required", new ArrayList<>()));

        return properties.entrySet().stream()
                .map(entry -> convertParameter(entry.getKey(), ObjectUtils.cast(entry.getValue()), required))
                .collect(Collectors.toList());
    }

    /**
     * 转换单个参数。
     *
     * @param name 表示参数名的 {@link String}。
     * @param propSchema 表示属性 Schema 的 {@link Map}{@code <}{@link String}{@code , }{@link Object}{@code >}。
     * @param required 表示必填字段列表的 {@link List}{@code <}{@link String}{@code >}。
     * @return 表示参数的 {@link McpToolParameter}。
     */
    private static McpToolParameter convertParameter(String name, Map<String, Object> propSchema, List<String> required) {
        McpToolParameter param = new McpToolParameter();
        param.setName(name);
        param.setLabel(buildMultiLangMap(name));
        param.setType(ObjectUtils.cast(propSchema.getOrDefault("type", "string")));
        param.setRequired(required.contains(name));
        param.setDefaultValue(propSchema.get("default"));
        
        String description = ObjectUtils.cast(propSchema.get("description"));
        if (description != null) {
            param.setHumanDescription(buildMultiLangMap(description));
            param.setLlmDescription(description);
        }
        
        param.setPlaceholder(null);
        param.setScope(null);
        param.setAutoGenerate(null);
        param.setTemplate(null);
        param.setMin(null);
        param.setMax(null);
        param.setPrecision(null);
        param.setOptions(Collections.emptyList());
        param.setForm("llm");
        
        return param;
    }

    /**
     * 构建多语言 Map。
     *
     * @param text 表示文本的 {@link String}。
     * @return 表示多语言 Map 的 {@link Map}{@code <}{@link String}{@code , }{@link String}{@code >}。
     */
    private static Map<String, String> buildMultiLangMap(String text) {
        return MapBuilder.<String, String>get()
                .put("en_US", text)
                .put("zh_Hans", text)
                .put("pt_BR", text)
                .put("ja_JP", text)
                .build();
    }
}

