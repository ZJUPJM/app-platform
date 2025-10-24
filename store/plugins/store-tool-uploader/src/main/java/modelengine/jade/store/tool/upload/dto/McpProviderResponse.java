/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.jade.store.tool.upload.dto;

import java.util.List;
import java.util.Map;

/**
 * 表示 MCP 工具提供者的响应数据。
 *
 * @author Generated
 * @since 2025-10-24
 */
public class McpProviderResponse {
    private String id;
    private String author;
    private String name;
    private String pluginId;
    private String pluginUniqueIdentifier;
    private Map<String, String> description;
    private Map<String, String> label;
    private String type;
    private Map<String, Object> teamCredentials;
    private Boolean isTeamAuthorization;
    private Boolean allowDelete;
    private List<McpToolInfo> tools;
    private List<String> labels;
    private String serverUrl;
    private Long updatedAt;
    private String serverIdentifier;
    private Integer timeout;
    private Integer sseReadTimeout;

    /**
     * 获取插件唯一标识。
     *
     * @return 表示插件 ID 的 {@link String}。
     */
    public String getId() {
        return id;
    }

    /**
     * 设置插件唯一标识。
     *
     * @param id 表示插件 ID 的 {@link String}。
     */
    public void setId(String id) {
        this.id = id;
    }

    /**
     * 获取作者名称。
     *
     * @return 表示作者名称的 {@link String}。
     */
    public String getAuthor() {
        return author;
    }

    /**
     * 设置作者名称。
     *
     * @param author 表示作者名称的 {@link String}。
     */
    public void setAuthor(String author) {
        this.author = author;
    }

    /**
     * 获取插件名称。
     *
     * @return 表示插件名称的 {@link String}。
     */
    public String getName() {
        return name;
    }

    /**
     * 设置插件名称。
     *
     * @param name 表示插件名称的 {@link String}。
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * 获取插件 ID。
     *
     * @return 表示插件 ID 的 {@link String}。
     */
    public String getPluginId() {
        return pluginId;
    }

    /**
     * 设置插件 ID。
     *
     * @param pluginId 表示插件 ID 的 {@link String}。
     */
    public void setPluginId(String pluginId) {
        this.pluginId = pluginId;
    }

    /**
     * 获取插件唯一标识符。
     *
     * @return 表示插件唯一标识符的 {@link String}。
     */
    public String getPluginUniqueIdentifier() {
        return pluginUniqueIdentifier;
    }

    /**
     * 设置插件唯一标识符。
     *
     * @param pluginUniqueIdentifier 表示插件唯一标识符的 {@link String}。
     */
    public void setPluginUniqueIdentifier(String pluginUniqueIdentifier) {
        this.pluginUniqueIdentifier = pluginUniqueIdentifier;
    }

    /**
     * 获取插件描述（多语言）。
     *
     * @return 表示插件描述的 {@link Map}{@code <}{@link String}{@code , }{@link String}{@code >}。
     */
    public Map<String, String> getDescription() {
        return description;
    }

    /**
     * 设置插件描述（多语言）。
     *
     * @param description 表示插件描述的 {@link Map}{@code <}{@link String}{@code , }{@link String}{@code >}。
     */
    public void setDescription(Map<String, String> description) {
        this.description = description;
    }

    /**
     * 获取插件标签（多语言）。
     *
     * @return 表示插件标签的 {@link Map}{@code <}{@link String}{@code , }{@link String}{@code >}。
     */
    public Map<String, String> getLabel() {
        return label;
    }

    /**
     * 设置插件标签（多语言）。
     *
     * @param label 表示插件标签的 {@link Map}{@code <}{@link String}{@code , }{@link String}{@code >}。
     */
    public void setLabel(Map<String, String> label) {
        this.label = label;
    }

    /**
     * 获取工具提供者类型。
     *
     * @return 表示类型的 {@link String}。
     */
    public String getType() {
        return type;
    }

    /**
     * 设置工具提供者类型。
     *
     * @param type 表示类型的 {@link String}。
     */
    public void setType(String type) {
        this.type = type;
    }

    /**
     * 获取团队凭证配置。
     *
     * @return 表示团队凭证的 {@link Map}{@code <}{@link String}{@code , }{@link Object}{@code >}。
     */
    public Map<String, Object> getTeamCredentials() {
        return teamCredentials;
    }

    /**
     * 设置团队凭证配置。
     *
     * @param teamCredentials 表示团队凭证的 {@link Map}{@code <}{@link String}{@code , }{@link Object}{@code >}。
     */
    public void setTeamCredentials(Map<String, Object> teamCredentials) {
        this.teamCredentials = teamCredentials;
    }

    /**
     * 获取是否为团队授权。
     *
     * @return 表示是否为团队授权的 {@link Boolean}。
     */
    public Boolean getIsTeamAuthorization() {
        return isTeamAuthorization;
    }

    /**
     * 设置是否为团队授权。
     *
     * @param isTeamAuthorization 表示是否为团队授权的 {@link Boolean}。
     */
    public void setIsTeamAuthorization(Boolean isTeamAuthorization) {
        this.isTeamAuthorization = isTeamAuthorization;
    }

    /**
     * 获取是否允许删除。
     *
     * @return 表示是否允许删除的 {@link Boolean}。
     */
    public Boolean getAllowDelete() {
        return allowDelete;
    }

    /**
     * 设置是否允许删除。
     *
     * @param allowDelete 表示是否允许删除的 {@link Boolean}。
     */
    public void setAllowDelete(Boolean allowDelete) {
        this.allowDelete = allowDelete;
    }

    /**
     * 获取工具列表。
     *
     * @return 表示工具列表的 {@link List}{@code <}{@link McpToolInfo}{@code >}。
     */
    public List<McpToolInfo> getTools() {
        return tools;
    }

    /**
     * 设置工具列表。
     *
     * @param tools 表示工具列表的 {@link List}{@code <}{@link McpToolInfo}{@code >}。
     */
    public void setTools(List<McpToolInfo> tools) {
        this.tools = tools;
    }

    /**
     * 获取插件标签列表。
     *
     * @return 表示标签列表的 {@link List}{@code <}{@link String}{@code >}。
     */
    public List<String> getLabels() {
        return labels;
    }

    /**
     * 设置插件标签列表。
     *
     * @param labels 表示标签列表的 {@link List}{@code <}{@link String}{@code >}。
     */
    public void setLabels(List<String> labels) {
        this.labels = labels;
    }

    /**
     * 获取服务器 URL。
     *
     * @return 表示服务器 URL 的 {@link String}。
     */
    public String getServerUrl() {
        return serverUrl;
    }

    /**
     * 设置服务器 URL。
     *
     * @param serverUrl 表示服务器 URL 的 {@link String}。
     */
    public void setServerUrl(String serverUrl) {
        this.serverUrl = serverUrl;
    }

    /**
     * 获取更新时间（Unix 时间戳）。
     *
     * @return 表示更新时间的 {@link Long}。
     */
    public Long getUpdatedAt() {
        return updatedAt;
    }

    /**
     * 设置更新时间（Unix 时间戳）。
     *
     * @param updatedAt 表示更新时间的 {@link Long}。
     */
    public void setUpdatedAt(Long updatedAt) {
        this.updatedAt = updatedAt;
    }

    /**
     * 获取服务器标识符。
     *
     * @return 表示服务器标识符的 {@link String}。
     */
    public String getServerIdentifier() {
        return serverIdentifier;
    }

    /**
     * 设置服务器标识符。
     *
     * @param serverIdentifier 表示服务器标识符的 {@link String}。
     */
    public void setServerIdentifier(String serverIdentifier) {
        this.serverIdentifier = serverIdentifier;
    }

    /**
     * 获取普通请求超时时间（秒）。
     *
     * @return 表示超时时间的 {@link Integer}。
     */
    public Integer getTimeout() {
        return timeout;
    }

    /**
     * 设置普通请求超时时间（秒）。
     *
     * @param timeout 表示超时时间的 {@link Integer}。
     */
    public void setTimeout(Integer timeout) {
        this.timeout = timeout;
    }

    /**
     * 获取 SSE 读取超时时间（秒）。
     *
     * @return 表示超时时间的 {@link Integer}。
     */
    public Integer getSseReadTimeout() {
        return sseReadTimeout;
    }

    /**
     * 设置 SSE 读取超时时间（秒）。
     *
     * @param sseReadTimeout 表示超时时间的 {@link Integer}。
     */
    public void setSseReadTimeout(Integer sseReadTimeout) {
        this.sseReadTimeout = sseReadTimeout;
    }
}

