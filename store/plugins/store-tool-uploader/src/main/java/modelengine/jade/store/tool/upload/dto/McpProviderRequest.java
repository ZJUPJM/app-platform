/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.jade.store.tool.upload.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

/**
 * 表示 MCP 工具提供者的请求参数。
 *
 * @author Generated
 * @since 2025-10-24
 */
public class McpProviderRequest {
    @JsonProperty("name")
    private String name;
    
    @JsonProperty("mcp_server_url")
    private String mcpServerUrl;
    
    @JsonProperty("server_identifier")
    private String serverIdentifier;
    
    @JsonProperty("headers")
    private Map<String, String> headers;
    
    @JsonProperty("config")
    private McpConfig config;

    /**
     * 获取 MCP 插件名称。
     *
     * @return 表示插件名称的 {@link String}。
     */
    public String getName() {
        return name;
    }

    /**
     * 设置 MCP 插件名称。
     *
     * @param name 表示插件名称的 {@link String}。
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * 获取 MCP 服务器 URL。
     *
     * @return 表示服务器 URL 的 {@link String}。
     */
    public String getMcpServerUrl() {
        return mcpServerUrl;
    }

    /**
     * 设置 MCP 服务器 URL。
     *
     * @param mcpServerUrl 表示服务器 URL 的 {@link String}。
     */
    public void setMcpServerUrl(String mcpServerUrl) {
        this.mcpServerUrl = mcpServerUrl;
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
     * 获取请求头配置。
     *
     * @return 表示请求头配置的 {@link Map}{@code <}{@link String}{@code , }{@link String}{@code >}。
     */
    public Map<String, String> getHeaders() {
        return headers;
    }

    /**
     * 设置请求头配置。
     *
     * @param headers 表示请求头配置的 {@link Map}{@code <}{@link String}{@code , }{@link String}{@code >}。
     */
    public void setHeaders(Map<String, String> headers) {
        this.headers = headers;
    }

    /**
     * 获取 MCP 配置信息。
     *
     * @return 表示配置信息的 {@link McpConfig}。
     */
    public McpConfig getConfig() {
        return config;
    }

    /**
     * 设置 MCP 配置信息。
     *
     * @param config 表示配置信息的 {@link McpConfig}。
     */
    public void setConfig(McpConfig config) {
        this.config = config;
    }

    /**
     * 表示 MCP 配置。
     */
    public static class McpConfig {
        @JsonProperty("sse_read_timeout")
        private Integer sseReadTimeout;
        
        @JsonProperty("timeout")
        private Integer timeout;

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
    }
}

