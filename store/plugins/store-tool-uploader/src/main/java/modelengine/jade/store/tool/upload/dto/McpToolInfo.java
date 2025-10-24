/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.jade.store.tool.upload.dto;

import java.util.List;
import java.util.Map;

/**
 * 表示 MCP 工具信息。
 *
 * @author Generated
 * @since 2025-10-24
 */
public class McpToolInfo {
    private String author;
    private String name;
    private Map<String, String> label;
    private Map<String, String> description;
    private List<McpToolParameter> parameters;
    private List<String> labels;
    private Map<String, Object> outputSchema;

    /**
     * 获取工具作者。
     *
     * @return 表示作者的 {@link String}。
     */
    public String getAuthor() {
        return author;
    }

    /**
     * 设置工具作者。
     *
     * @param author 表示作者的 {@link String}。
     */
    public void setAuthor(String author) {
        this.author = author;
    }

    /**
     * 获取工具名称。
     *
     * @return 表示名称的 {@link String}。
     */
    public String getName() {
        return name;
    }

    /**
     * 设置工具名称。
     *
     * @param name 表示名称的 {@link String}。
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * 获取工具标签（多语言）。
     *
     * @return 表示标签的 {@link Map}{@code <}{@link String}{@code , }{@link String}{@code >}。
     */
    public Map<String, String> getLabel() {
        return label;
    }

    /**
     * 设置工具标签（多语言）。
     *
     * @param label 表示标签的 {@link Map}{@code <}{@link String}{@code , }{@link String}{@code >}。
     */
    public void setLabel(Map<String, String> label) {
        this.label = label;
    }

    /**
     * 获取工具描述（多语言）。
     *
     * @return 表示描述的 {@link Map}{@code <}{@link String}{@code , }{@link String}{@code >}。
     */
    public Map<String, String> getDescription() {
        return description;
    }

    /**
     * 设置工具描述（多语言）。
     *
     * @param description 表示描述的 {@link Map}{@code <}{@link String}{@code , }{@link String}{@code >}。
     */
    public void setDescription(Map<String, String> description) {
        this.description = description;
    }

    /**
     * 获取工具参数列表。
     *
     * @return 表示参数列表的 {@link List}{@code <}{@link McpToolParameter}{@code >}。
     */
    public List<McpToolParameter> getParameters() {
        return parameters;
    }

    /**
     * 设置工具参数列表。
     *
     * @param parameters 表示参数列表的 {@link List}{@code <}{@link McpToolParameter}{@code >}。
     */
    public void setParameters(List<McpToolParameter> parameters) {
        this.parameters = parameters;
    }

    /**
     * 获取工具标签列表。
     *
     * @return 表示标签列表的 {@link List}{@code <}{@link String}{@code >}。
     */
    public List<String> getLabels() {
        return labels;
    }

    /**
     * 设置工具标签列表。
     *
     * @param labels 表示标签列表的 {@link List}{@code <}{@link String}{@code >}。
     */
    public void setLabels(List<String> labels) {
        this.labels = labels;
    }

    /**
     * 获取输出结构定义。
     *
     * @return 表示输出结构的 {@link Map}{@code <}{@link String}{@code , }{@link Object}{@code >}。
     */
    public Map<String, Object> getOutputSchema() {
        return outputSchema;
    }

    /**
     * 设置输出结构定义。
     *
     * @param outputSchema 表示输出结构的 {@link Map}{@code <}{@link String}{@code , }{@link Object}{@code >}。
     */
    public void setOutputSchema(Map<String, Object> outputSchema) {
        this.outputSchema = outputSchema;
    }
}

