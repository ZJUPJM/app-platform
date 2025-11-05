/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.jade.store.tool.upload.service.impl;

import static modelengine.fel.tool.ToolSchema.NAME;
import static modelengine.fitframework.inspection.Validation.notBlank;
import static modelengine.fitframework.inspection.Validation.notNull;

import modelengine.fel.tool.mcp.client.McpClient;
import modelengine.fel.tool.mcp.client.McpClientFactory;
import modelengine.fel.tool.mcp.entity.Tool;
import modelengine.fel.tool.model.transfer.DefinitionData;
import modelengine.fel.tool.model.transfer.DefinitionGroupData;
import modelengine.fel.tool.model.transfer.ToolData;
import modelengine.fel.tool.model.transfer.ToolGroupData;
import modelengine.fit.jade.aipp.domain.division.service.DomainDivisionService;
import modelengine.fitframework.annotation.Component;
import modelengine.fitframework.annotation.Value;
import modelengine.fitframework.log.Logger;
import modelengine.fitframework.util.MapBuilder;
import modelengine.jade.carver.ListResult;
import modelengine.jade.common.exception.ModelEngineException;
import modelengine.jade.store.code.PluginRetCode;
import modelengine.jade.store.entity.query.PluginQuery;
import modelengine.jade.store.entity.transfer.PluginData;
import modelengine.jade.store.entity.transfer.PluginToolData;
import modelengine.jade.store.service.PluginService;
import modelengine.jade.store.service.support.DeployStatus;
import modelengine.jade.store.tool.upload.dto.McpProviderRequest;
import modelengine.jade.store.tool.upload.dto.McpProviderResponse;
import modelengine.jade.store.tool.upload.dto.McpToolInfo;
import modelengine.jade.store.tool.upload.service.McpProviderService;
import modelengine.jade.store.tool.upload.support.processor.PluginProcessor;
import modelengine.jade.store.tool.upload.util.McpToolConverter;
import modelengine.jade.store.tool.upload.util.McpUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * MCP 工具提供者服务实现。
 *
 * @author Generated
 * @since 2025-10-24
 */
@Component
public class McpProviderServiceImpl implements McpProviderService {
    private static final Logger log = Logger.get(McpProviderServiceImpl.class);
    private static final String MCP_TYPE = "mcp";
    private static final String MCP = "MCP";
    private static final String TYPE = "type";
    private static final String DESCRIPTION = "description";
    private static final String PLUGIN_FULL_NAME = "pluginFullName";
    private static final String PLUGIN_NAME = "pluginName";
    private static final String SERVER_IDENTIFIER = "serverIdentifier";
    private static final String SERVER_URL = "serverUrl";
    private static final String HEADERS = "headers";
    private static final String CONFIG = "config";
    
    private final McpClientFactory mcpClientFactory;
    private final PluginService pluginService;
    private final DomainDivisionService domainDivisionService;
    private final boolean isEnableDomainDivision;

    /**
     * 构造 MCP 工具提供者服务实例。
     *
     * @param mcpClientFactory 表示 MCP 客户端工厂的 {@link McpClientFactory}。
     * @param pluginService 表示插件服务的 {@link PluginService}。
     * @param domainDivisionService 表示分域服务的 {@link DomainDivisionService}。
     * @param isEnableDomainDivision 表示是否启用分域的 {@code boolean}。
     */
    public McpProviderServiceImpl(McpClientFactory mcpClientFactory, PluginService pluginService,
            DomainDivisionService domainDivisionService,
            @Value("${domain-division.isEnable}") boolean isEnableDomainDivision) {
        this.mcpClientFactory = notNull(mcpClientFactory, "The MCP client factory cannot be null.");
        this.pluginService = notNull(pluginService, "The plugin service cannot be null.");
        this.domainDivisionService = notNull(domainDivisionService, "The domain division service cannot be null.");
        this.isEnableDomainDivision = isEnableDomainDivision;
    }

    @Override
    public McpProviderResponse createMcpProvider(McpProviderRequest request, String userId) {
        notNull(request, "The request cannot be null.");
        notBlank(request.getName(), "The provider name cannot be blank.");
        notBlank(request.getMcpServerUrl(), "The MCP server URL cannot be blank.");
        notBlank(request.getServerIdentifier(), "The server identifier cannot be blank.");
        notBlank(userId, "The user ID cannot be blank.");

        log.info("Creating MCP provider: name={}, url={}", request.getName(), request.getMcpServerUrl());

        // 从 MCP 服务器获取工具列表
        List<Tool> mcpTools = fetchToolsFromMcpServer(request.getMcpServerUrl());
        
        // 构建 PluginData
        PluginData pluginData = buildMcpPluginData(request, mcpTools, userId);
        
        // 检查插件唯一性并添加到数据库
        checkUniquePluginId(pluginData.getPluginId());
        this.pluginService.addPlugin(pluginData);

        log.info("MCP provider created successfully: pluginId={}, toolCount={}", pluginData.getPluginId(), mcpTools.size());
        
        // 返回响应
        return convertToResponse(pluginData, mcpTools, request);
    }

    @Override
    public McpProviderResponse updateMcpProvider(String providerId, McpProviderRequest request, String userId) {
        notBlank(providerId, "The provider ID cannot be blank.");
        notNull(request, "The request cannot be null.");
        notBlank(userId, "The user ID cannot be blank.");

        log.info("Updating MCP provider: pluginId={}", providerId);

        // 删除旧插件
        this.pluginService.deletePlugin(providerId);
        
        // 创建新插件（使用相同的 pluginId）
        List<Tool> mcpTools = fetchToolsFromMcpServer(request.getMcpServerUrl());
        PluginData pluginData = buildMcpPluginData(request, mcpTools, userId);
        pluginData.setPluginId(providerId); // 保持相同的 pluginId
        
        this.pluginService.addPlugin(pluginData);

        log.info("MCP provider updated successfully: pluginId={}", providerId);
        return convertToResponse(pluginData, mcpTools, request);
    }

    @Override
    public int deleteMcpProvider(String providerId, String userId) {
        notBlank(providerId, "The provider ID cannot be blank.");
        notBlank(userId, "The user ID cannot be blank.");

        PluginData pluginData = this.pluginService.getPlugin(providerId);
        if (pluginData.getPluginId() == null) {
            log.warn("No MCP provider found when try to delete. [pluginId={}]", providerId);
            return 0;
        }

        log.info("Deleting MCP provider: pluginId={}, name={}", providerId, pluginData.getPluginName());
        this.pluginService.deletePlugin(providerId);
        return 1;
    }

    @Override
    public List<McpProviderResponse> listMcpProviders(String userId) {
        notBlank(userId, "The user ID cannot be blank.");

        // 获取所有插件并过滤 MCP 类型
        PluginQuery query = new PluginQuery();
        ListResult<PluginData> result = this.pluginService.getPlugins(query);
        return result.getData().stream()
                .filter(plugin -> plugin.getExtension() != null && MCP_TYPE.equals(plugin.getExtension().get(TYPE)))
                .map(plugin -> convertToResponse(plugin, Collections.emptyList(), null))
                .collect(Collectors.toList());
    }

    @Override
    public McpProviderResponse getMcpProvider(String providerId, String userId) {
        notBlank(providerId, "The provider ID cannot be blank.");
        notBlank(userId, "The user ID cannot be blank.");

        PluginData pluginData = this.pluginService.getPlugin(providerId);
        if (pluginData.getPluginId() == null) {
            throw new ModelEngineException(PluginRetCode.PLUGIN_NOT_EXISTS);
        }

        return convertToResponse(pluginData, Collections.emptyList(), null);
    }

    @Override
    public McpProviderResponse testConnection(McpProviderRequest request) {
        notNull(request, "The request cannot be null.");
        notBlank(request.getMcpServerUrl(), "The MCP server URL cannot be blank.");

        log.info("Testing MCP connection: url={}", request.getMcpServerUrl());
        
        List<Tool> tools = fetchToolsFromMcpServer(request.getMcpServerUrl());
        
        McpProviderResponse response = new McpProviderResponse();
        response.setTools(tools.stream()
                .map(tool -> McpToolConverter.convertToToolInfo(tool, request.getName()))
                .collect(Collectors.toList()));
        return response;
    }

    /**
     * 从 MCP 服务器获取工具列表。
     *
     * @param url 表示 MCP 服务器 URL 的 {@link String}。
     * @return 表示工具列表的 {@link List}{@code <}{@link Tool}{@code >}。
     */
    private List<Tool> fetchToolsFromMcpServer(String url) {
        try (McpClient mcpClient = mcpClientFactory.create(McpUtils.getBaseUrl(url), McpUtils.getSseEndpoint(url))) {
            mcpClient.initialize();
            return mcpClient.getTools();
        } catch (IOException exception) {
            log.error("Failed to fetch tools from MCP server: url={}", url, exception);
            throw new ModelEngineException(PluginRetCode.NO_PLUGIN_FOUND_ERROR, 
                    "Failed to connect to MCP server: " + exception.getMessage());
        }
    }

    /**
     * 构建 MCP 插件数据。
     *
     * @param request 表示请求的 {@link McpProviderRequest}。
     * @param mcpTools 表示 MCP 工具列表的 {@link List}{@code <}{@link Tool}{@code >}。
     * @param userId 表示用户 ID 的 {@link String}。
     * @return 表示插件数据的 {@link PluginData}。
     */
    private PluginData buildMcpPluginData(McpProviderRequest request, List<Tool> mcpTools, String userId) {
        String pluginId = generatePluginId(request.getServerIdentifier());
        String userGroupId = "*";
        if (this.isEnableDomainDivision) {
            userGroupId = this.domainDivisionService.getUserGroupId();
        }

        // 构建 MCP 服务器配置
        Map<String, Object> mcpServerConfig = buildMcpServerConfig(request);

        // 构建定义组和工具组
        List<DefinitionGroupData> defGroups = buildDefinitionGroups(mcpTools, request.getServerIdentifier());
        List<ToolGroupData> toolGroups = buildToolGroups(mcpTools, request.getServerIdentifier(), mcpServerConfig);

        // 构建插件数据
        PluginData pluginData = new PluginData();
        pluginData.setPluginId(pluginId);
        pluginData.setPluginName(request.getName());
        pluginData.setCreator(userId);
        pluginData.setModifier(userId);
        pluginData.setDeployStatus(DeployStatus.RELEASED.name());
        pluginData.setDefinitionGroupDataList(defGroups);
        pluginData.setToolGroupDataList(toolGroups);
        pluginData.setUserGroupId(userGroupId);

        // 构建插件工具数据列表（需要包含完整的字段）
        List<PluginToolData> pluginToolDataList = buildMcpPluginToolDatas(toolGroups, userGroupId, pluginId, userId);
        pluginData.setPluginToolDataList(pluginToolDataList);

        // 设置扩展信息
        Map<String, Object> extension = new HashMap<>();
        extension.put(TYPE, MCP_TYPE);
        extension.put(DESCRIPTION, request.getName());
        extension.put(PLUGIN_FULL_NAME, request.getName());
        extension.put(PLUGIN_NAME, request.getName());
        extension.put(SERVER_IDENTIFIER, request.getServerIdentifier());
        extension.put(SERVER_URL, request.getMcpServerUrl());
        if (request.getHeaders() != null) {
            // 转换为 Map<String, Object>
            Map<String, Object> headersMap = new HashMap<>(request.getHeaders());
            extension.put(HEADERS, headersMap);
        }
        if (request.getConfig() != null) {
            Map<String, Object> configMap = new HashMap<>();
            configMap.put("sseReadTimeout", request.getConfig().getSseReadTimeout());
            configMap.put("timeout", request.getConfig().getTimeout());
            extension.put(CONFIG, configMap);
        }
        pluginData.setExtension(extension);

        return pluginData;
    }

    /**
     * 构建 MCP 插件工具数据列表。
     *
     * @param toolGroupDatas 表示工具组数据的 {@link List}{@code <}{@link ToolGroupData}{@code >}。
     * @param userGroupId 表示用户组 ID 的 {@link String}。
     * @param pluginId 表示插件 ID 的 {@link String}。
     * @param userId 表示用户 ID 的 {@link String}。
     * @return 表示插件工具数据列表的 {@link List}{@code <}{@link PluginToolData}{@code >}。
     */
    private List<PluginToolData> buildMcpPluginToolDatas(List<ToolGroupData> toolGroupDatas, 
            String userGroupId, String pluginId, String userId) {
        return toolGroupDatas.stream()
                .flatMap(toolGroupData -> toolGroupData.getTools().stream())
                .map(toolData -> buildMcpPluginToolData(toolData, userGroupId, pluginId, userId))
                .collect(Collectors.toList());
    }

    /**
     * 构建单个 MCP 插件工具数据。
     *
     * @param toolData 表示工具数据的 {@link ToolData}。
     * @param userGroupId 表示用户组 ID 的 {@link String}。
     * @param pluginId 表示插件 ID 的 {@link String}。
     * @param userId 表示用户 ID 的 {@link String}。
     * @return 表示插件工具数据的 {@link PluginToolData}。
     */
    private PluginToolData buildMcpPluginToolData(ToolData toolData, String userGroupId, 
            String pluginId, String userId) {
        PluginToolData pluginToolData = new PluginToolData();
        
        // 从 ToolData 继承的字段
        pluginToolData.setName(toolData.getName());
        pluginToolData.setUniqueName(toolData.getUniqueName());
        pluginToolData.setDescription(toolData.getDescription());
        pluginToolData.setGroupName(toolData.getGroupName());
        pluginToolData.setDefName(toolData.getDefName());
        pluginToolData.setDefGroupName(toolData.getDefGroupName());
        pluginToolData.setSchema(toolData.getSchema());
        pluginToolData.setRunnables(toolData.getRunnables());
        pluginToolData.setExtensions(toolData.getExtensions());
        pluginToolData.setVersion(toolData.getVersion());
        pluginToolData.setLatest(toolData.getLatest());
        
        // StoreToolData 的字段
        pluginToolData.setCreator(userId);
        pluginToolData.setModifier(userId);
        if (toolData.getExtensions() != null && toolData.getExtensions().get("tags") != null) {
            List<String> tagsList = (List<String>) toolData.getExtensions().get("tags");
            pluginToolData.setTags(tagsList.stream().collect(Collectors.toSet()));
        }
        
        // PluginToolData 的字段
        pluginToolData.setPluginId(pluginId);
        pluginToolData.setUserGroupId(userGroupId);
        
        return pluginToolData;
    }

    /**
     * 构建定义组列表。
     *
     * @param mcpTools 表示 MCP 工具列表的 {@link List}{@code <}{@link Tool}{@code >}。
     * @param serverIdentifier 表示服务器标识符的 {@link String}。
     * @return 表示定义组列表的 {@link List}{@code <}{@link DefinitionGroupData}{@code >}。
     */
    private List<DefinitionGroupData> buildDefinitionGroups(List<Tool> mcpTools, String serverIdentifier) {
        DefinitionGroupData defGroup = new DefinitionGroupData();
        defGroup.setName(serverIdentifier);
        
        List<DefinitionData> definitions = mcpTools.stream().map(tool -> {
            DefinitionData def = new DefinitionData();
            def.setName(tool.getName());
            def.setGroupName(serverIdentifier);  // 设置 groupName
            
            // 构建完整的 schema 结构
            Map<String, Object> schema = new HashMap<>();
            schema.put(NAME, tool.getName());
            schema.put(DESCRIPTION, tool.getDescription() != null ? tool.getDescription() : "");
            
            // 构建 parameters 结构
            Map<String, Object> inputSchema = tool.getInputSchema();
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("type", inputSchema.getOrDefault("type", "object"));
            parameters.put("properties", inputSchema.getOrDefault("properties", new HashMap<>()));
            parameters.put("required", inputSchema.getOrDefault("required", new ArrayList<>()));
            schema.put("parameters", parameters);
            
            // 构建 order
            Map<String, Object> properties = (Map<String, Object>) inputSchema.getOrDefault("properties", new HashMap<>());
            schema.put("order", new ArrayList<>(properties.keySet()));
            
            // 构建 return
            Map<String, Object> returnSchema = new HashMap<>();
            returnSchema.put("type", "string");
            returnSchema.put("convertor", "");
            schema.put("return", returnSchema);
            
            def.setSchema(schema);
            return def;
        }).collect(Collectors.toList());
        
        defGroup.setDefinitions(definitions);
        return Arrays.asList(defGroup);
    }

    /**
     * 构建 MCP 服务器配置。
     *
     * @param request 表示请求的 {@link McpProviderRequest}。
     * @return 表示服务器配置的 {@link Map}{@code <}{@link String}{@code , }{@link Object}{@code >}。
     */
    private Map<String, Object> buildMcpServerConfig(McpProviderRequest request) {
        Map<String, Object> serverConfig = new HashMap<>();
        serverConfig.put("url", request.getMcpServerUrl());
        if (request.getHeaders() != null) {
            serverConfig.put("headers", new HashMap<>(request.getHeaders()));
        }
        if (request.getConfig() != null) {
            serverConfig.put("sseReadTimeout", request.getConfig().getSseReadTimeout());
            serverConfig.put("timeout", request.getConfig().getTimeout());
        }
        return serverConfig;
    }

    /**
     * 构建工具组列表。
     *
     * @param mcpTools 表示 MCP 工具列表的 {@link List}{@code <}{@link Tool}{@code >}。
     * @param serverIdentifier 表示服务器标识符的 {@link String}。
     * @param mcpServerConfig 表示 MCP 服务器配置的 {@link Map}{@code <}{@link String}{@code , }{@link Object}{@code >}。
     * @return 表示工具组列表的 {@link List}{@code <}{@link ToolGroupData}{@code >}。
     */
    private List<ToolGroupData> buildToolGroups(List<Tool> mcpTools, String serverIdentifier, 
            Map<String, Object> mcpServerConfig) {
        ToolGroupData toolGroup = new ToolGroupData();
        toolGroup.setName(serverIdentifier);
        toolGroup.setDefGroupName(serverIdentifier);
        
        List<ToolData> tools = mcpTools.stream().map(tool -> {
            ToolData toolData = new ToolData();
            toolData.setName(tool.getName());
            toolData.setUniqueName(serverIdentifier + "_" + tool.getName());
            toolData.setDescription(tool.getDescription() != null ? tool.getDescription() : "");
            toolData.setDefName(tool.getName());
            toolData.setDefGroupName(serverIdentifier);
            toolData.setGroupName(serverIdentifier);
            
            // 构建完整的 schema 结构（与定义一致）
            Map<String, Object> inputSchema = tool.getInputSchema();
            Map<String, Object> schema = new HashMap<>();
            schema.put(NAME, tool.getName());
            schema.put(DESCRIPTION, tool.getDescription() != null ? tool.getDescription() : "");
            
            // 构建 parameters 结构
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("type", inputSchema.getOrDefault("type", "object"));
            parameters.put("properties", inputSchema.getOrDefault("properties", new HashMap<>()));
            parameters.put("required", inputSchema.getOrDefault("required", Collections.emptyList()));
            schema.put("parameters", parameters);
            
            // 构建 order
            Map<String, Object> properties = (Map<String, Object>) inputSchema.getOrDefault("properties", new HashMap<>());
            schema.put("order", new ArrayList<>(properties.keySet()));
            
            // 构建 return
            Map<String, Object> returnSchema = new HashMap<>();
            returnSchema.put("type", "string");
            returnSchema.put("convertor", "");
            schema.put("return", returnSchema);
            
            toolData.setSchema(schema);
            
            // 设置 extensions - 包含 MCP 服务器配置
            Map<String, Object> extensions = new HashMap<>();
            extensions.put("tags", Arrays.asList(MCP));
            extensions.put("mcpServer", mcpServerConfig);  // ✅ 添加 MCP 服务器配置
            extensions.put("toolRealName", tool.getName());  // ✅ 添加工具真实名称
            toolData.setExtensions(extensions);
            
            // 设置 runnables
            Map<String, Object> runnables = new HashMap<>();
            runnables.put(MCP, "mcp-tool-" + tool.getName());
            toolData.setRunnables(runnables);
            
            return toolData;
        }).collect(Collectors.toList());
        
        toolGroup.setTools(tools);
        return Arrays.asList(toolGroup);
    }

    /**
     * 生成插件 ID。
     *
     * @param input 表示输入字符串的 {@link String}。
     * @return 表示生成的插件 ID 的 {@link String}。
     */
    private String generatePluginId(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return IntStream.range(0, hash.length)
                    .mapToObj(i -> String.format("%02x", hash[i] & 0xFF))
                    .collect(Collectors.joining());
        } catch (NoSuchAlgorithmException e) {
            log.error("Failed to generate pluginId.", e);
            return input.hashCode() + "";
        }
    }

    /**
     * 检查插件唯一性。
     *
     * @param pluginId 表示插件 ID 的 {@link String}。
     */
    private void checkUniquePluginId(String pluginId) {
        PluginData pluginData = this.pluginService.getPlugin(pluginId);
        if (pluginData.getPluginId() == null) {
            return;
        }
        // 如果已有相同插件的状态是已部署或者部署中，插件唯一性校验失败
        if (Objects.equals(pluginData.getDeployStatus(), DeployStatus.DEPLOYED.toString())
                || Objects.equals(pluginData.getDeployStatus(), DeployStatus.DEPLOYING.toString())) {
            throw new ModelEngineException(PluginRetCode.PLUGIN_UNIQUE_CHECK_ERROR);
        }
        // 未部署或者部署失败的相同插件可以被新插件替换
        this.deleteMcpProvider(pluginId, pluginData.getCreator());
    }

    /**
     * 将插件数据转换为响应格式。
     *
     * @param pluginData 表示插件数据的 {@link PluginData}。
     * @param mcpTools 表示 MCP 工具列表的 {@link List}{@code <}{@link Tool}{@code >}。
     * @param request 表示请求的 {@link McpProviderRequest}。
     * @return 表示响应的 {@link McpProviderResponse}。
     */
    private McpProviderResponse convertToResponse(PluginData pluginData, List<Tool> mcpTools, 
            McpProviderRequest request) {
        McpProviderResponse response = new McpProviderResponse();
        response.setId(pluginData.getPluginId());
        response.setAuthor(pluginData.getCreator());
        response.setName(pluginData.getPluginName());
        response.setPluginId("");
        response.setPluginUniqueIdentifier("");
        response.setDescription(buildMultiLangMap(pluginData.getPluginName()));
        response.setLabel(buildMultiLangMap(pluginData.getPluginName()));
        response.setType(MCP_TYPE);
        response.setTeamCredentials(new HashMap<>());
        response.setIsTeamAuthorization(true);
        response.setAllowDelete(true);
        response.setLabels(Collections.emptyList());
        
        // 从扩展信息中获取配置
        Map<String, Object> extension = pluginData.getExtension();
        response.setServerUrl((String) extension.get(SERVER_URL));
        response.setServerIdentifier((String) extension.get(SERVER_IDENTIFIER));
        
        Object configObj = extension.get(CONFIG);
        if (configObj instanceof Map) {
            Map<String, Object> config = (Map<String, Object>) configObj;
            response.setTimeout((Integer) config.get("timeout"));
            response.setSseReadTimeout((Integer) config.get("sseReadTimeout"));
        } else if (request != null && request.getConfig() != null) {
            response.setTimeout(request.getConfig().getTimeout());
            response.setSseReadTimeout(request.getConfig().getSseReadTimeout());
        }
        
        response.setUpdatedAt(System.currentTimeMillis() / 1000);
        
        // 转换工具列表
        List<McpToolInfo> toolInfos = mcpTools.isEmpty() 
            ? pluginData.getToolGroupDataList().stream()
                .flatMap(toolGroup -> toolGroup.getTools().stream())
                .map(toolData -> {
                    McpToolInfo toolInfo = new McpToolInfo();
                    toolInfo.setAuthor(pluginData.getCreator());
                    toolInfo.setName(toolData.getName());
                    toolInfo.setLabel(buildMultiLangMap(toolData.getName()));
                    toolInfo.setDescription(buildMultiLangMap(toolData.getDescription()));
                    toolInfo.setParameters(Collections.emptyList());
                    toolInfo.setLabels(Collections.emptyList());
                    toolInfo.setOutputSchema(Collections.emptyMap());
                    return toolInfo;
                }).collect(Collectors.toList())
            : mcpTools.stream()
                .map(tool -> McpToolConverter.convertToToolInfo(tool, pluginData.getCreator()))
                .collect(Collectors.toList());
        
        response.setTools(toolInfos);
        
        return response;
    }

    /**
     * 构建多语言 Map。
     *
     * @param text 表示文本的 {@link String}。
     * @return 表示多语言 Map 的 {@link Map}{@code <}{@link String}{@code , }{@link String}{@code >}。
     */
    private Map<String, String> buildMultiLangMap(String text) {
        return MapBuilder.<String, String>get()
                .put("en_US", text)
                .put("zh_Hans", text)
                .put("pt_BR", text)
                .put("ja_JP", text)
                .build();
    }
}
