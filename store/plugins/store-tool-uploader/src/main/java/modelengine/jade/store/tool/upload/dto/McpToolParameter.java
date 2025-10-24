/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.jade.store.tool.upload.dto;

import java.util.List;
import java.util.Map;

/**
 * 表示 MCP 工具参数。
 *
 * @author Generated
 * @since 2025-10-24
 */
public class McpToolParameter {
    private String name;
    private Map<String, String> label;
    private String placeholder;
    private String scope;
    private Object autoGenerate;
    private String template;
    private Boolean required;
    private Object defaultValue;
    private Number min;
    private Number max;
    private Integer precision;
    private List<Object> options;
    private String type;
    private Map<String, String> humanDescription;
    private String form;
    private String llmDescription;

    /**
     * 获取参数名称。
     *
     * @return 表示参数名称的 {@link String}。
     */
    public String getName() {
        return name;
    }

    /**
     * 设置参数名称。
     *
     * @param name 表示参数名称的 {@link String}。
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * 获取参数标签（多语言）。
     *
     * @return 表示标签的 {@link Map}{@code <}{@link String}{@code , }{@link String}{@code >}。
     */
    public Map<String, String> getLabel() {
        return label;
    }

    /**
     * 设置参数标签（多语言）。
     *
     * @param label 表示标签的 {@link Map}{@code <}{@link String}{@code , }{@link String}{@code >}。
     */
    public void setLabel(Map<String, String> label) {
        this.label = label;
    }

    /**
     * 获取占位符。
     *
     * @return 表示占位符的 {@link String}。
     */
    public String getPlaceholder() {
        return placeholder;
    }

    /**
     * 设置占位符。
     *
     * @param placeholder 表示占位符的 {@link String}。
     */
    public void setPlaceholder(String placeholder) {
        this.placeholder = placeholder;
    }

    /**
     * 获取作用域。
     *
     * @return 表示作用域的 {@link String}。
     */
    public String getScope() {
        return scope;
    }

    /**
     * 设置作用域。
     *
     * @param scope 表示作用域的 {@link String}。
     */
    public void setScope(String scope) {
        this.scope = scope;
    }

    /**
     * 获取自动生成标记。
     *
     * @return 表示自动生成标记的 {@link Object}。
     */
    public Object getAutoGenerate() {
        return autoGenerate;
    }

    /**
     * 设置自动生成标记。
     *
     * @param autoGenerate 表示自动生成标记的 {@link Object}。
     */
    public void setAutoGenerate(Object autoGenerate) {
        this.autoGenerate = autoGenerate;
    }

    /**
     * 获取模板。
     *
     * @return 表示模板的 {@link String}。
     */
    public String getTemplate() {
        return template;
    }

    /**
     * 设置模板。
     *
     * @param template 表示模板的 {@link String}。
     */
    public void setTemplate(String template) {
        this.template = template;
    }

    /**
     * 获取是否必填。
     *
     * @return 表示是否必填的 {@link Boolean}。
     */
    public Boolean getRequired() {
        return required;
    }

    /**
     * 设置是否必填。
     *
     * @param required 表示是否必填的 {@link Boolean}。
     */
    public void setRequired(Boolean required) {
        this.required = required;
    }

    /**
     * 获取默认值。
     *
     * @return 表示默认值的 {@link Object}。
     */
    public Object getDefaultValue() {
        return defaultValue;
    }

    /**
     * 设置默认值。
     *
     * @param defaultValue 表示默认值的 {@link Object}。
     */
    public void setDefaultValue(Object defaultValue) {
        this.defaultValue = defaultValue;
    }

    /**
     * 获取最小值。
     *
     * @return 表示最小值的 {@link Number}。
     */
    public Number getMin() {
        return min;
    }

    /**
     * 设置最小值。
     *
     * @param min 表示最小值的 {@link Number}。
     */
    public void setMin(Number min) {
        this.min = min;
    }

    /**
     * 获取最大值。
     *
     * @return 表示最大值的 {@link Number}。
     */
    public Number getMax() {
        return max;
    }

    /**
     * 设置最大值。
     *
     * @param max 表示最大值的 {@link Number}。
     */
    public void setMax(Number max) {
        this.max = max;
    }

    /**
     * 获取精度。
     *
     * @return 表示精度的 {@link Integer}。
     */
    public Integer getPrecision() {
        return precision;
    }

    /**
     * 设置精度。
     *
     * @param precision 表示精度的 {@link Integer}。
     */
    public void setPrecision(Integer precision) {
        this.precision = precision;
    }

    /**
     * 获取可选值列表。
     *
     * @return 表示可选值列表的 {@link List}{@code <}{@link Object}{@code >}。
     */
    public List<Object> getOptions() {
        return options;
    }

    /**
     * 设置可选值列表。
     *
     * @param options 表示可选值列表的 {@link List}{@code <}{@link Object}{@code >}。
     */
    public void setOptions(List<Object> options) {
        this.options = options;
    }

    /**
     * 获取参数类型。
     *
     * @return 表示类型的 {@link String}。
     */
    public String getType() {
        return type;
    }

    /**
     * 设置参数类型。
     *
     * @param type 表示类型的 {@link String}。
     */
    public void setType(String type) {
        this.type = type;
    }

    /**
     * 获取人类可读描述（多语言）。
     *
     * @return 表示描述的 {@link Map}{@code <}{@link String}{@code , }{@link String}{@code >}。
     */
    public Map<String, String> getHumanDescription() {
        return humanDescription;
    }

    /**
     * 设置人类可读描述（多语言）。
     *
     * @param humanDescription 表示描述的 {@link Map}{@code <}{@link String}{@code , }{@link String}{@code >}。
     */
    public void setHumanDescription(Map<String, String> humanDescription) {
        this.humanDescription = humanDescription;
    }

    /**
     * 获取表单类型。
     *
     * @return 表示表单类型的 {@link String}。
     */
    public String getForm() {
        return form;
    }

    /**
     * 设置表单类型。
     *
     * @param form 表示表单类型的 {@link String}。
     */
    public void setForm(String form) {
        this.form = form;
    }

    /**
     * 获取 LLM 描述。
     *
     * @return 表示 LLM 描述的 {@link String}。
     */
    public String getLlmDescription() {
        return llmDescription;
    }

    /**
     * 设置 LLM 描述。
     *
     * @param llmDescription 表示 LLM 描述的 {@link String}。
     */
    public void setLlmDescription(String llmDescription) {
        this.llmDescription = llmDescription;
    }
}

