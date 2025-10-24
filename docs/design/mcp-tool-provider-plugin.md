# MCP 工具提供者插件设计文档

## 1. 概述

本文档描述了在 AppPlatform 的 app-builder plugins 中新增一个支持 MCP (Model Context Protocol) 工具配置的插件的设计方案。该插件将提供一个 REST API 接口，允许用户通过提供 MCP 服务器的 URL 来动态获取和注册一系列工具。

## 2. 背景与需求

### 2.1 背景

Model Context Protocol (MCP) 是一个开放协议，用于在 AI 应用和外部工具/数据源之间建立标准化的通信。当前 AppPlatform 已经支持多种工具提供者（如 FIT、HTTP），但尚未支持通过 MCP 协议动态发现和集成外部工具。

### 2.2 需求

- 支持通过 MCP 服务器 URL 动态发现可用工具
- 提供标准的 REST API 接口供前端或其他服务调用
- 将 MCP 工具转换为 AppPlatform 内部的工具表示
- 支持 MCP 工具的生命周期管理（注册、卸载、调用）
- 确保安全性和可靠性

## 3. 目标

1. **易用性**：提供简单的 API 接口，用户只需提供 MCP 服务器 URL 即可获取工具列表
2. **标准化**：遵循 MCP 协议标准，确保与各种 MCP 服务器的兼容性
3. **可扩展性**：设计灵活的架构，便于后续功能扩展
4. **可靠性**：提供错误处理、超时控制、连接管理等机制
5. **安全性**：支持认证授权，防止恶意 URL 访问

## 4. 整体设计

### 4.1 插件架构

```
aipp-mcp-tool-provider/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── modelengine/
│   │   │       └── fit/
│   │   │           └── jade/
│   │   │               └── aipp/
│   │   │                   └── mcp/
│   │   │                       ├── controller/
│   │   │                       │   └── McpProviderController.java      # REST 控制器
│   │   │                       ├── service/
│   │   │                       │   ├── McpProviderService.java         # MCP 插件管理服务接口
│   │   │                       │   ├── McpProviderServiceImpl.java     # 服务实现
│   │   │                       │   ├── McpToolService.java             # MCP 工具管理服务接口
│   │   │                       │   ├── McpToolServiceImpl.java         # 工具服务实现
│   │   │                       │   └── McpSyncService.java             # 工具同步服务
│   │   │                       ├── factory/
│   │   │                       │   └── McpToolFactory.java             # MCP 工具工厂
│   │   │                       ├── client/
│   │   │                       │   ├── McpClient.java                  # MCP 客户端接口
│   │   │                       │   ├── McpClientImpl.java              # MCP 客户端实现
│   │   │                       │   └── McpClientFactory.java           # MCP 客户端工厂
│   │   │                       ├── repository/
│   │   │                       │   ├── McpProviderRepository.java      # MCP 插件数据访问接口
│   │   │                       │   ├── McpToolRepository.java          # 工具数据访问接口
│   │   │                       │   └── McpExecutionLogRepository.java  # 执行日志数据访问接口
│   │   │                       ├── model/
│   │   │                       │   ├── dto/
│   │   │                       │   │   ├── McpProviderCreateRequest.java
│   │   │                       │   │   ├── McpProviderUpdateRequest.java
│   │   │                       │   │   ├── McpProviderResponse.java
│   │   │                       │   │   ├── McpProviderListResponse.java
│   │   │                       │   │   ├── McpToolResponse.java
│   │   │                       │   │   ├── McpSyncResponse.java
│   │   │                       │   │   └── McpTestConnectionRequest.java
│   │   │                       │   ├── entity/
│   │   │                       │   │   ├── McpProvider.java            # MCP 插件实体
│   │   │                       │   │   ├── McpTool.java                # 工具实体
│   │   │                       │   │   └── McpExecutionLog.java        # 执行日志实体
│   │   │                       │   ├── vo/
│   │   │                       │   │   ├── McpServerInfo.java          # MCP 服务器信息
│   │   │                       │   │   ├── McpAuthConfig.java          # 认证配置
│   │   │                       │   │   └── McpProviderConfig.java      # 插件配置
│   │   │                       │   └── enums/
│   │   │                       │       ├── McpProviderStatus.java      # 插件状态枚举
│   │   │                       │       ├── McpAuthType.java            # 认证类型枚举
│   │   │                       │       └── McpSyncStatus.java          # 同步状态枚举
│   │   │                       ├── converter/
│   │   │                       │   ├── McpProviderConverter.java       # 插件转换器
│   │   │                       │   └── McpToolConverter.java           # 工具转换器
│   │   │                       ├── validator/
│   │   │                       │   ├── McpUrlValidator.java            # URL 验证器
│   │   │                       │   └── McpConfigValidator.java         # 配置验证器
│   │   │                       ├── security/
│   │   │                       │   ├── McpAuthHandler.java             # 认证处理器
│   │   │                       │   └── McpEncryptionService.java       # 加密服务
│   │   │                       ├── scheduler/
│   │   │                       │   └── McpSyncScheduler.java           # 定时同步任务
│   │   │                       └── exception/
│   │   │                           ├── McpException.java               # 自定义异常基类
│   │   │                           ├── McpConnectionException.java     # 连接异常
│   │   │                           ├── McpAuthException.java           # 认证异常
│   │   │                           └── McpValidationException.java     # 验证异常
│   │   └── resources/
│   │       ├── application.yml                                         # 配置文件
│   │       ├── tools.json                                              # 工具元数据
│   │       └── sql/
│   │           ├── schema/
│   │           │   ├── mcp_provider.sql                               # mcp_provider 表
│   │           │   ├── mcp_tool.sql                                   # mcp_tool 表
│   │           │   └── mcp_tool_execution_log.sql                     # 执行日志表
│   │           └── data/
│   │               └── mcp_tool_provider_init.sql                     # 初始化数据
│   └── test/
│       └── java/
│           └── modelengine/
│               └── fit/
│                   └── jade/
│                       └── aipp/
│                           └── mcp/
│                               ├── service/
│                               │   ├── McpProviderServiceTest.java
│                               │   └── McpToolServiceTest.java
│                               ├── client/
│                               │   └── McpClientTest.java
│                               ├── converter/
│                               │   └── McpToolConverterTest.java
│                               └── controller/
│                                   └── McpProviderControllerTest.java
└── pom.xml
```

### 4.2 核心组件

#### 4.2.1 McpProviderController
REST API 控制器，提供 MCP 插件管理的 HTTP 接口，包括创建、更新、删除、查询、同步等操作。

**主要职责**：
- 接收和验证 HTTP 请求
- 调用服务层处理业务逻辑
- 返回统一格式的响应结果
- 处理异常并返回友好的错误信息

#### 4.2.2 McpProviderService
MCP 插件管理服务，负责 MCP 插件的完整生命周期管理。

**主要职责**：
- 创建、更新、删除 MCP 插件配置
- 查询插件列表和详情
- 管理插件状态和启用/禁用
- 协调 MCP 客户端和工具同步服务
- 处理工作空间和用户权限隔离

#### 4.2.3 McpToolService
MCP 工具管理服务，负责管理从 MCP 服务器发现的工具。

**主要职责**：
- 工具的注册和注销
- 工具信息的查询和更新
- 工具与 AppPlatform 工具仓库的集成
- 工具启用/禁用管理

#### 4.2.4 McpSyncService
工具同步服务，负责从 MCP 服务器同步工具列表。

**主要职责**：
- 连接 MCP 服务器获取工具列表
- 对比本地和远程工具差异
- 执行工具的增量更新（新增、删除、更新）
- 记录同步状态和日志
- 处理同步失败和重试

#### 4.2.5 McpClient
MCP 协议客户端，负责与 MCP 服务器的底层通信。

**主要职责**：
- 实现 MCP 协议的通信逻辑
- 处理连接管理（HTTP/WebSocket）
- 处理认证和授权
- 发现和调用工具
- 处理超时和错误

#### 4.2.6 McpToolFactory
实现 `ToolFactory` 接口，用于创建可在 AppPlatform 中执行的 MCP 工具实例。

**主要职责**：
- 创建 MCP 工具的执行器
- 管理工具实例的生命周期
- 提供工具类型标识（"MCP"）
- 与 ToolFactoryRepository 集成

#### 4.2.7 McpProviderConverter & McpToolConverter
转换器，负责在不同数据模型之间进行转换。

**主要职责**：
- Entity 与 DTO 之间的转换
- MCP 协议格式与 AppPlatform 格式的转换
- JSON Schema 的转换和验证

#### 4.2.8 McpUrlValidator & McpConfigValidator
验证器，负责安全性和有效性验证。

**主要职责**：
- 验证 URL 是否在白名单中
- 验证 URL 格式和可达性
- 验证配置参数的有效性
- 防止 SSRF 攻击

#### 4.2.9 McpAuthHandler & McpEncryptionService
安全组件，负责认证和加密。

**主要职责**：
- 处理多种认证方式（Bearer/Basic/ApiKey）
- 加密和解密敏感信息
- 管理认证令牌
- 验证认证有效性

#### 4.2.10 McpSyncScheduler
定时任务调度器，负责自动同步工具列表。

**主要职责**：
- 定期扫描需要同步的 MCP 插件
- 根据配置的同步间隔执行同步
- 处理同步任务的并发控制
- 记录同步结果和日志

#### 4.2.11 Repository 层
数据访问层，负责与数据库交互。

**主要职责**：
- McpProviderRepository: MCP 插件的 CRUD 操作
- McpToolRepository: 工具的 CRUD 操作
- McpExecutionLogRepository: 执行日志的记录和查询

## 5. API 设计

### 5.1 创建 MCP 插件

**接口路径**: `POST /api/workspaces/current/tool-providers/mcp`

**接口描述**: 创建一个新的 MCP 工具提供者插件，并自动发现和注册该 MCP 服务器提供的所有工具。

**请求参数**:
```json
{
  "name": "My MCP Server",
  "mcp_server_url": "https://example.com/mcp",
  "server_dentifier": "mcp_12306",
  "headers": {
    "Authorization": "Bearer token"
  },
  "config": {
    "sse_read_timeout": 300,
    "timeout": 30
  }
}
```

**请求参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| name | String | 是 | MCP 插件名称，用于识别和显示 |
| mcp_server_url | String | 是 | MCP 服务器的 URL 地址（完整的 HTTP/HTTPS URL） |
| server_dentifier | String | 是 | MCP 服务器的唯一标识符，用于区分不同的 MCP 服务器实例 |
| headers | Object | 否 | 请求头信息，用于 MCP 服务器认证和自定义配置 |
| headers.Authorization | String | 否 | 认证信息，如 "Bearer token" 或 "Basic xxx" |
| headers.* | String | 否 | 其他自定义请求头 |
| config | Object | 否 | MCP 连接配置 |
| config.sse_read_timeout | Integer | 否 | SSE（Server-Sent Events）读取超时时间（秒），默认 300 |
| config.timeout | Integer | 否 | 普通 HTTP 请求超时时间（秒），默认 30 |

**响应结果**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "mcp_provider_123456",
    "name": "My MCP Server",
    "mcp_server_url": "https://example.com/mcp",
    "server_dentifier": "mcp_12306",
    "status": "active",
    "server_info": {
      "name": "Example MCP Server",
      "version": "1.0.0",
      "protocol_version": "2024-11-05"
    },
    "tool_count": 5,
    "tools": [
      {
        "name": "search",
        "description": "Search for information"
      }
    ],
    "config": {
      "sse_read_timeout": 300,
      "timeout": 30
    },
    "created_at": "2025-10-22T10:00:00Z",
    "updated_at": "2025-10-22T10:00:00Z"
  }
}
```

**响应参数说明**:
| 参数 | 类型 | 说明 |
|-----|------|------|
| code | Integer | 响应状态码，200 表示成功 |
| message | String | 响应消息 |
| data.id | String | MCP 插件唯一标识 |
| data.name | String | MCP 插件名称 |
| data.mcp_server_url | String | MCP 服务器 URL |
| data.server_dentifier | String | MCP 服务器标识符 |
| data.status | String | 状态（active/inactive/error） |
| data.server_info | Object | MCP 服务器信息 |
| data.server_info.name | String | 服务器名称 |
| data.server_info.version | String | 服务器版本 |
| data.server_info.protocol_version | String | MCP 协议版本 |
| data.tool_count | Integer | 已发现的工具数量 |
| data.tools | Array | 工具列表概览 |
| data.tools[].name | String | 工具名称 |
| data.tools[].description | String | 工具描述 |
| data.config | Object | 连接配置信息 |
| data.config.sse_read_timeout | Integer | SSE 读取超时（秒） |
| data.config.timeout | Integer | 普通请求超时（秒） |
| data.created_at | String | 创建时间（ISO 8601 格式） |
| data.updated_at | String | 更新时间（ISO 8601 格式） |

### 5.2 更新 MCP 插件

**接口路径**: `PUT /api/workspaces/current/tool-providers/mcp/{provider_id}`

**接口描述**: 更新已存在的 MCP 工具提供者插件配置，可选择是否重新同步工具列表。

**请求参数**:
```json
{
  "name": "My MCP Server",
  "mcp_server_url": "https://example.com/mcp",
  "server_dentifier": "mcp_12306",
  "headers": {
    "Authorization": "Bearer token"
  },
  "config": {
    "sse_read_timeout": 300,
    "timeout": 30
  }
}
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| provider_id | String | 是 | MCP 插件 ID |

**请求参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| name | String | 否 | MCP 插件名称 |
| mcp_server_url | String | 否 | MCP 服务器 URL |
| server_dentifier | String | 否 | MCP 服务器标识符 |
| headers | Object | 否 | 请求头信息，用于认证和自定义配置 |
| headers.Authorization | String | 否 | 认证信息 |
| headers.* | String | 否 | 其他自定义请求头 |
| config | Object | 否 | MCP 连接配置 |
| config.sse_read_timeout | Integer | 否 | SSE 读取超时时间（秒） |
| config.timeout | Integer | 否 | 普通请求超时时间（秒） |

**响应结果**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "mcp_provider_123456",
    "name": "My MCP Server",
    "mcp_server_url": "https://example.com/mcp/v2",
    "server_dentifier": "mcp_12306",
    "status": "active",
    "server_info": {
      "name": "Example MCP Server",
      "version": "2.0.0",
      "protocol_version": "2024-11-05"
    },
    "tool_count": 8,
    "config": {
      "sse_read_timeout": 300,
      "timeout": 30
    },
    "updated_at": "2025-10-22T11:00:00Z"
  }
}
```

**响应参数说明**:
| 参数 | 类型 | 说明 |
|-----|------|------|
| code | Integer | 响应状态码，200 表示成功 |
| message | String | 响应消息 |
| data.id | String | MCP 插件唯一标识 |
| data.name | String | MCP 插件名称 |
| data.mcp_server_url | String | MCP 服务器 URL |
| data.server_dentifier | String | MCP 服务器标识符 |
| data.status | String | 状态（active/inactive/error） |
| data.server_info | Object | MCP 服务器信息 |
| data.tool_count | Integer | 工具数量 |
| data.config | Object | 连接配置信息 |
| data.updated_at | String | 更新时间（ISO 8601 格式） |

### 5.3 删除 MCP 插件

**接口路径**: `DELETE /api/workspaces/current/tool-providers/mcp/{id}`

**接口描述**: 删除指定的 MCP 工具提供者插件，同时注销该插件注册的所有工具。

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| id | String | 是 | MCP 插件 ID |

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| force | Boolean | 否 | 是否强制删除，默认 false |

**响应结果**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "mcp_provider_123456",
    "name": "My MCP Server",
    "deleted": true,
    "unregisteredToolCount": 8,
    "deletedAt": "2025-10-22T12:00:00Z"
  }
}
```

**响应参数说明**:
| 参数 | 类型 | 说明 |
|-----|------|------|
| code | Integer | 响应状态码，200 表示成功 |
| message | String | 响应消息 |
| data.id | String | 已删除的 MCP 插件 ID |
| data.name | String | 插件名称 |
| data.deleted | Boolean | 是否删除成功 |
| data.unregisteredToolCount | Integer | 注销的工具数量 |
| data.deletedAt | String | 删除时间 |

### 5.4 获取当前用户的所有 MCP 插件

**接口路径**: `GET /api/workspaces/current/tool-providers/mcp`

**接口描述**: 获取当前用户工作空间下的所有 MCP 工具提供者插件列表。

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| page | Integer | 否 | 页码，从 1 开始，默认 1 |
| pageSize | Integer | 否 | 每页数量，默认 20 |
| status | String | 否 | 状态过滤（active/inactive/error） |
| enabled | Boolean | 否 | 是否启用过滤 |
| keyword | String | 否 | 关键词搜索（匹配名称和描述） |
| sortBy | String | 否 | 排序字段（createdAt/updatedAt/name），默认 createdAt |
| sortOrder | String | 否 | 排序方向（asc/desc），默认 desc |

**响应结果**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "e21f889f-81d0-46b0-a358-30fc583c1389",
        "author": "Dify",
        "name": "Fetch",
        "plugin_id": "",
        "plugin_unique_identifier": "",
        "description": {
          "zh_Hans": "通过 MCP 协议连接的 Fetch 工具提供者",
          "en_US": "Fetch tool provider connected via MCP protocol",
          "pt_BR": "Provedor de ferramenta Fetch conectado via protocolo MCP",
          "ja_JP": "MCP プロトコル経由で接続された Fetch ツールプロバイダー"
        },
        "label": {
          "zh_Hans": "Fetch",
          "en_US": "Fetch",
          "pt_BR": "Fetch",
          "ja_JP": "Fetch"
        },
        "type": "mcp",
        "team_credentials": {},
        "is_team_authorization": true,
        "allow_delete": true,
        "tools": [
          {
            "author": "Dify",
            "name": "fetch",
            "label": {
              "en_US": "fetch",
              "zh_Hans": "fetch",
              "pt_BR": "fetch",
              "ja_JP": "fetch"
            },
            "description": {
              "en_US": "Fetches a URL from the internet and optionally extracts its contents as markdown.",
              "zh_Hans": "从互联网获取 URL 并可选择将其内容提取为 markdown 格式。",
              "pt_BR": "Busca uma URL da internet e opcionalmente extrai seu conteúdo como markdown.",
              "ja_JP": "インターネットから URL を取得し、オプションでその内容を markdown として抽出します。"
            },
            "parameters": [
              {
                "name": "url",
                "label": {
                  "en_US": "url",
                  "zh_Hans": "url",
                  "pt_BR": "url",
                  "ja_JP": "url"
                },
                "placeholder": null,
                "scope": null,
                "auto_generate": null,
                "template": null,
                "required": true,
                "default": null,
                "min": null,
                "max": null,
                "precision": null,
                "options": [],
                "type": "string",
                "human_description": {
                  "en_US": "URL to fetch",
                  "zh_Hans": "要获取的 URL",
                  "pt_BR": "URL para buscar",
                  "ja_JP": "取得する URL"
                },
                "form": "llm",
                "llm_description": "URL to fetch"
              }
            ],
            "labels": [],
            "output_schema": {}
          }
        ],
        "labels": [],
        "server_url": "https://mcp.api-inference.modelscope.net/******",
        "updated_at": 1729641182,
        "server_identifier": "fetch_model_scope",
        "timeout": 30,
        "sse_read_timeout": 300
      },
      {
        "id": "f32a990a-92e1-57c1-b469-41gd694d2490",
        "author": "User",
        "name": "Search Tools",
        "plugin_id": "",
        "plugin_unique_identifier": "",
        "description": {
          "zh_Hans": "搜索工具集合",
          "en_US": "Collection of search tools",
          "pt_BR": "Coleção de ferramentas de pesquisa",
          "ja_JP": "検索ツールのコレクション"
        },
        "label": {
          "zh_Hans": "搜索工具",
          "en_US": "Search Tools",
          "pt_BR": "Ferramentas de Pesquisa",
          "ja_JP": "検索ツール"
        },
        "type": "mcp",
        "team_credentials": {},
        "is_team_authorization": true,
        "allow_delete": true,
        "tools": [
          {
            "author": "User",
            "name": "search",
            "label": {
              "en_US": "search",
              "zh_Hans": "搜索",
              "pt_BR": "pesquisar",
              "ja_JP": "検索"
            },
            "description": {
              "en_US": "Search for information",
              "zh_Hans": "搜索信息",
              "pt_BR": "Pesquisar informações",
              "ja_JP": "情報を検索"
            },
            "parameters": [
              {
                "name": "query",
                "label": {
                  "en_US": "query",
                  "zh_Hans": "查询",
                  "pt_BR": "consulta",
                  "ja_JP": "クエリ"
                },
                "placeholder": null,
                "scope": null,
                "auto_generate": null,
                "template": null,
                "required": true,
                "default": null,
                "min": null,
                "max": null,
                "precision": null,
                "options": [],
                "type": "string",
                "human_description": {
                  "en_US": "Search query",
                  "zh_Hans": "搜索查询",
                  "pt_BR": "Consulta de pesquisa",
                  "ja_JP": "検索クエリ"
                },
                "form": "llm",
                "llm_description": "Search query"
              }
            ],
            "labels": [],
            "output_schema": {}
          }
        ],
        "labels": [],
        "server_url": "https://another.com/mcp",
        "updated_at": 1729637582,
        "server_identifier": "search_tools",
        "timeout": 30,
        "sse_read_timeout": 300
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 2,
      "total_pages": 1
    }
  }
}
```

**响应参数说明**:
| 参数 | 类型 | 说明 |
|-----|------|------|
| code | Integer | 响应状态码，200 表示成功 |
| message | String | 响应消息 |
| data.items | Array | MCP 插件列表 |
| data.items[].id | String | 插件唯一标识（UUID） |
| data.items[].author | String | 创建者/作者名称 |
| data.items[].name | String | 插件名称 |
| data.items[].plugin_id | String | 插件 ID（预留字段） |
| data.items[].plugin_unique_identifier | String | 插件唯一标识符（预留字段） |
| data.items[].description | Object | 插件描述（多语言） |
| data.items[].description.zh_Hans | String | 简体中文描述 |
| data.items[].description.en_US | String | 英文描述 |
| data.items[].description.pt_BR | String | 巴西葡萄牙语描述 |
| data.items[].description.ja_JP | String | 日文描述 |
| data.items[].label | Object | 插件标签（多语言） |
| data.items[].label.zh_Hans | String | 简体中文标签 |
| data.items[].label.en_US | String | 英文标签 |
| data.items[].label.pt_BR | String | 巴西葡萄牙语标签 |
| data.items[].label.ja_JP | String | 日文标签 |
| data.items[].type | String | 工具提供者类型，固定为 "mcp" |
| data.items[].team_credentials | Object | 团队凭证配置 |
| data.items[].is_team_authorization | Boolean | 是否为团队授权 |
| data.items[].allow_delete | Boolean | 是否允许删除 |
| data.items[].tools | Array | 工具列表 |
| data.items[].tools[].author | String | 工具作者 |
| data.items[].tools[].name | String | 工具名称 |
| data.items[].tools[].label | Object | 工具标签（多语言） |
| data.items[].tools[].description | Object | 工具描述（多语言） |
| data.items[].tools[].parameters | Array | 工具参数列表 |
| data.items[].tools[].parameters[].name | String | 参数名称 |
| data.items[].tools[].parameters[].label | Object | 参数标签（多语言） |
| data.items[].tools[].parameters[].type | String | 参数类型（string/number/boolean/object/array） |
| data.items[].tools[].parameters[].required | Boolean | 是否必填 |
| data.items[].tools[].parameters[].default | Any | 默认值 |
| data.items[].tools[].parameters[].human_description | Object | 参数的人类可读描述（多语言） |
| data.items[].tools[].parameters[].llm_description | String | 参数的 LLM 描述 |
| data.items[].tools[].parameters[].form | String | 表单类型（llm/form） |
| data.items[].tools[].parameters[].min | Number | 最小值（数值类型） |
| data.items[].tools[].parameters[].max | Number | 最大值（数值类型） |
| data.items[].tools[].parameters[].options | Array | 可选值列表 |
| data.items[].tools[].labels | Array | 工具标签 |
| data.items[].tools[].output_schema | Object | 输出结构定义 |
| data.items[].labels | Array | 插件标签 |
| data.items[].server_url | String | MCP 服务器 URL |
| data.items[].updated_at | Integer | 更新时间（Unix 时间戳） |
| data.items[].server_identifier | String | MCP 服务器标识符 |
| data.items[].timeout | Integer | 普通请求超时时间（秒） |
| data.items[].sse_read_timeout | Integer | SSE 读取超时时间（秒） |
| data.pagination | Object | 分页信息 |
| data.pagination.page | Integer | 当前页码 |
| data.pagination.page_size | Integer | 每页数量 |
| data.pagination.total | Integer | 总记录数 |
| data.pagination.total_pages | Integer | 总页数 |

### 5.5 获取指定 MCP 插件详情

**接口路径**: `GET /api/workspaces/current/tool-providers/mcp/{id}`

**接口描述**: 获取指定 MCP 工具提供者插件的详细信息，包括所有已注册的工具列表。

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| id | String | 是 | MCP 插件 ID |

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| includeTools | Boolean | 否 | 是否包含工具列表，默认 true |

**响应结果**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "mcp_provider_123456",
    "name": "My MCP Server",
    "mcp_server_url": "https://example.com/mcp",
    "server_dentifier": "mcp_12306",
    "status": "active",
    "server_info": {
      "name": "Example MCP Server",
      "version": "1.0.0",
      "protocol_version": "2024-11-05"
    },
    "headers": {
      "Authorization": "Bearer ***"
    },
    "config": {
      "sse_read_timeout": 300,
      "timeout": 30
    },
    "tools": [
      {
        "id": "mcp_tool_001",
        "name": "search",
        "description": "Search for information",
        "input_schema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "Search query"
            }
          },
          "required": ["query"]
        }
      },
      {
        "id": "mcp_tool_002",
        "name": "translate",
        "description": "Translate text",
        "input_schema": {
          "type": "object",
          "properties": {
            "text": {
              "type": "string",
              "description": "Text to translate"
            },
            "target_lang": {
              "type": "string",
              "description": "Target language"
            }
          },
          "required": ["text", "target_lang"]
        }
      }
    ],
    "tool_count": 5,
    "last_sync_at": "2025-10-22T10:30:00Z",
    "last_sync_status": "success",
    "created_at": "2025-10-22T10:00:00Z",
    "updated_at": "2025-10-22T10:00:00Z"
  }
}
```

### 5.6 手动同步 MCP 插件工具

**接口路径**: `POST /api/workspaces/current/tool-providers/mcp/{id}/sync`

**接口描述**: 手动触发 MCP 插件的工具同步，重新从 MCP 服务器获取工具列表并更新注册信息。

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| id | String | 是 | MCP 插件 ID |

**响应结果**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "mcp_provider_123456",
    "sync_status": "success",
    "tool_count": 5,
    "added_tools": 2,
    "removed_tools": 0,
    "updated_tools": 1,
    "sync_at": "2025-10-22T11:00:00Z"
  }
}
```

**响应参数说明**:
| 参数 | 类型 | 说明 |
|-----|------|------|
| code | Integer | 响应状态码，200 表示成功 |
| message | String | 响应消息 |
| data.id | String | MCP 插件 ID |
| data.sync_status | String | 同步状态（success/failed） |
| data.tool_count | Integer | 当前工具总数 |
| data.added_tools | Integer | 新增工具数量 |
| data.removed_tools | Integer | 移除工具数量 |
| data.updated_tools | Integer | 更新工具数量 |
| data.sync_at | String | 同步时间 |

### 5.7 测试 MCP 连接

**接口路径**: `POST /api/workspaces/current/tool-providers/mcp/test-connection`

**接口描述**: 在创建或更新 MCP 插件前，测试与 MCP 服务器的连接是否正常。

**请求参数**:
```json
{
  "mcp_server_url": "https://example.com/mcp",
  "headers": {
    "Authorization": "Bearer test-token"
  },
  "config": {
    "timeout": 10
  }
}
```

**请求参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| mcp_server_url | String | 是 | MCP 服务器 URL |
| headers | Object | 否 | 请求头信息 |
| headers.Authorization | String | 否 | 认证信息 |
| config | Object | 否 | 配置信息 |
| config.timeout | Integer | 否 | 测试超时时间（秒），默认 10 |

**响应结果**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "connected": true,
    "server_info": {
      "name": "Example MCP Server",
      "version": "1.0.0",
      "protocol_version": "2024-11-05"
    },
    "available_tool_count": 5,
    "response_time": 250,
    "tested_at": "2025-10-22T11:00:00Z"
  }
}
```

**响应参数说明**:
| 参数 | 类型 | 说明 |
|-----|------|------|
| code | Integer | 响应状态码，200 表示成功 |
| message | String | 响应消息 |
| data.connected | Boolean | 是否连接成功 |
| data.server_info | Object | MCP 服务器信息 |
| data.server_info.name | String | 服务器名称 |
| data.server_info.version | String | 服务器版本 |
| data.server_info.protocol_version | String | MCP 协议版本 |
| data.available_tool_count | Integer | 可用工具数量 |
| data.response_time | Integer | 响应时间（毫秒） |
| data.tested_at | String | 测试时间 |

## 6. 数据模型

### 6.1 数据库表设计

#### mcp_provider

存储 MCP 工具提供者插件信息（对应用户创建的 MCP 插件配置）。

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | VARCHAR(64) | PRIMARY KEY | MCP 插件 ID |
| workspace_id | VARCHAR(64) | NOT NULL | 工作空间 ID |
| name | VARCHAR(128) | NOT NULL | MCP 插件名称 |
| mcp_server_url | VARCHAR(512) | NOT NULL | MCP 服务器 URL |
| description | TEXT | | 插件描述 |
| namespace | VARCHAR(64) | | 工具命名空间 |
| server_name | VARCHAR(128) | | MCP 服务器名称 |
| server_version | VARCHAR(64) | | MCP 服务器版本 |
| server_description | TEXT | | MCP 服务器描述 |
| protocol_version | VARCHAR(32) | | MCP 协议版本 |
| auth_type | VARCHAR(32) | | 认证类型（bearer/basic/apikey） |
| auth_config | TEXT | | 认证配置（加密存储，JSON） |
| config | TEXT | | 插件配置（JSON） |
| status | VARCHAR(32) | NOT NULL DEFAULT 'inactive' | 状态（active/inactive/error） |
| enabled | BOOLEAN | NOT NULL DEFAULT true | 是否启用 |
| last_sync_at | TIMESTAMP | | 最后同步时间 |
| last_sync_status | VARCHAR(32) | | 最后同步状态（success/failed） |
| last_sync_message | TEXT | | 最后同步消息 |
| tool_count | INTEGER | DEFAULT 0 | 工具数量 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| created_by | VARCHAR(128) | NOT NULL | 创建人 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |
| updated_by | VARCHAR(128) | | 更新人 |
| deleted | BOOLEAN | NOT NULL DEFAULT false | 是否已删除（软删除） |
| deleted_at | TIMESTAMP | | 删除时间 |
| deleted_by | VARCHAR(128) | | 删除人 |

**索引设计**:
- PRIMARY KEY: `id`
- INDEX: `idx_workspace_id` (workspace_id)
- INDEX: `idx_created_by` (created_by)
- INDEX: `idx_status` (status)
- UNIQUE INDEX: `uk_workspace_name` (workspace_id, name) WHERE deleted = false

#### mcp_tool

存储从 MCP 服务器发现的工具信息。

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | VARCHAR(64) | PRIMARY KEY | 工具 ID |
| provider_id | VARCHAR(64) | NOT NULL, FOREIGN KEY | 关联的 MCP 插件 ID |
| workspace_id | VARCHAR(64) | NOT NULL | 工作空间 ID |
| tool_name | VARCHAR(128) | NOT NULL | 工具名称 |
| unique_name | VARCHAR(256) | NOT NULL | 工具唯一标识 |
| description | TEXT | | 工具描述 |
| input_schema | TEXT | | 输入参数 Schema（JSON） |
| output_schema | TEXT | | 输出结果 Schema（JSON） |
| namespace | VARCHAR(64) | | 命名空间 |
| registered | BOOLEAN | NOT NULL DEFAULT false | 是否已注册到工具仓库 |
| registered_tool_id | VARCHAR(64) | | 工具仓库中的工具 ID |
| enabled | BOOLEAN | NOT NULL DEFAULT true | 是否启用 |
| metadata | TEXT | | 其他元数据（JSON） |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |
| deleted | BOOLEAN | NOT NULL DEFAULT false | 是否已删除（软删除） |
| deleted_at | TIMESTAMP | | 删除时间 |

**索引设计**:
- PRIMARY KEY: `id`
- INDEX: `idx_provider_id` (provider_id)
- INDEX: `idx_workspace_id` (workspace_id)
- UNIQUE INDEX: `uk_unique_name` (unique_name) WHERE deleted = false
- INDEX: `idx_registered` (registered)

#### mcp_tool_execution_log

存储 MCP 工具的执行日志（可选，用于监控和调试）。

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | VARCHAR(64) | PRIMARY KEY | 日志 ID |
| provider_id | VARCHAR(64) | NOT NULL | MCP 插件 ID |
| tool_id | VARCHAR(64) | NOT NULL | 工具 ID |
| workspace_id | VARCHAR(64) | NOT NULL | 工作空间 ID |
| user_id | VARCHAR(128) | NOT NULL | 执行用户 |
| request_params | TEXT | | 请求参数（JSON） |
| response_result | TEXT | | 响应结果（JSON） |
| execution_time | INTEGER | | 执行时间（毫秒） |
| status | VARCHAR(32) | NOT NULL | 执行状态（success/failed） |
| error_message | TEXT | | 错误信息 |
| created_at | TIMESTAMP | NOT NULL | 执行时间 |

**索引设计**:
- PRIMARY KEY: `id`
- INDEX: `idx_provider_id` (provider_id)
- INDEX: `idx_tool_id` (tool_id)
- INDEX: `idx_workspace_id` (workspace_id)
- INDEX: `idx_user_id` (user_id)
- INDEX: `idx_created_at` (created_at)

## 7. 技术选型

### 7.1 MCP 协议实现

- **MCP SDK**: 使用官方或社区提供的 MCP Java SDK
- **HTTP 客户端**: 使用 FIT 框架提供的 `HttpClient` 组件
- **WebSocket 支持**: 对于需要长连接的 MCP 服务器，使用 Java WebSocket API

### 7.2 依赖管理

主要依赖包括：
- `fit-api`: FIT 框架核心 API
- `fit-http-client`: HTTP 客户端
- `tool-service`: 工具服务接口
- `mcp-sdk`: MCP 协议 SDK（待确认具体实现）
- `jackson`: JSON 序列化/反序列化

## 8. 安全性设计

### 8.1 URL 白名单

配置允许访问的 MCP 服务器 URL 白名单，防止 SSRF 攻击。

```yaml
mcp:
  security:
    url-whitelist:
      - "https://trusted-mcp-server.com/*"
      - "https://another-trusted.com/*"
    url-blacklist:
      - "http://localhost/*"
      - "http://127.0.0.1/*"
      - "http://192.168.*"
```

### 8.2 认证授权

- 支持多种认证方式（Bearer Token、API Key、Basic Auth）
- 敏感信息加密存储
- 支持用户级别的访问控制

### 8.3 请求限流

- 对 MCP 服务器的请求进行限流控制
- 支持配置每个服务器的并发请求数和请求频率

## 9. 错误处理

### 9.1 错误码定义

| 错误码 | 说明 |
|-------|------|
| 40001 | 无效的 MCP 服务器 URL |
| 40002 | MCP 服务器连接失败 |
| 40003 | MCP 服务器认证失败 |
| 40004 | 工具不存在 |
| 40005 | 工具参数验证失败 |
| 40006 | 工具执行超时 |
| 40007 | URL 不在白名单中 |
| 50001 | MCP 服务器内部错误 |

### 9.2 异常处理策略

- 网络异常：重试机制，最多重试 3 次
- 超时异常：可配置的超时时间
- 协议异常：记录详细日志，返回友好错误信息

## 10. 配置管理

### 10.1 application.yml 配置示例

```yaml
fit:
  beans:
    packages:
      - 'modelengine.fit.jade.aipp.mcp'

mcp:
  # 客户端配置
  client:
    connect-timeout: 10000
    read-timeout: 30000
    max-connections: 100
    retry:
      enabled: true
      max-attempts: 3
      backoff-interval: 1000
  
  # 安全配置
  security:
    enabled: true
    url-validation:
      enabled: true
      whitelist:
        - "https://*.mcp-server.com/*"
      blacklist:
        - "http://localhost/*"
        - "http://127.0.0.1/*"
        - "http://192.168.*"
  
  # 工具注册配置
  tool:
    auto-register: false
    default-namespace: "mcp"
    sync-interval: 300000  # 5 分钟同步一次
```

## 11. 实现计划

### 11.1 第一阶段：项目搭建和基础设施（1 周）

**目标**：完成项目结构和基础设施搭建

- [ ] 创建插件项目结构（`aipp-mcp-tool-provider`）
- [ ] 配置 `pom.xml` 依赖管理
- [ ] 创建数据库表结构（`mcp_provider`, `mcp_tool`, `mcp_tool_execution_log`）
- [ ] 定义核心数据模型（Entity、DTO、VO、Enums）
- [ ] 实现 Repository 层接口
- [ ] 配置 `application.yml`
- [ ] 编写 `tools.json` 元数据

**交付物**：
- 可编译的项目骨架
- 数据库表结构 SQL 脚本
- 基础配置文件

### 11.2 第二阶段：MCP 客户端实现（2 周）

**目标**：实现 MCP 协议客户端和基础通信功能

- [ ] 研究和集成 MCP SDK
- [ ] 实现 `McpClient` 接口和基础实现
- [ ] 实现 `McpClientFactory` 连接池管理
- [ ] 实现多种认证方式（Bearer/Basic/ApiKey）
- [ ] 实现 MCP 服务器信息获取
- [ ] 实现工具列表发现
- [ ] 实现工具调用功能
- [ ] 处理超时和异常
- [ ] 编写单元测试

**交付物**：
- 完整的 MCP 客户端组件
- 单元测试覆盖率 > 80%

### 11.3 第三阶段：核心业务逻辑实现（2 周）

**目标**：实现 MCP 插件和工具管理的核心业务逻辑

- [ ] 实现 `McpProviderService` 插件管理服务
  - [ ] 创建 MCP 插件
  - [ ] 更新 MCP 插件
  - [ ] 删除 MCP 插件
  - [ ] 查询插件列表和详情
- [ ] 实现 `McpToolService` 工具管理服务
  - [ ] 工具的注册和注销
  - [ ] 工具信息查询
  - [ ] 工具状态管理
- [ ] 实现 `McpSyncService` 同步服务
  - [ ] 手动同步工具列表
  - [ ] 增量更新逻辑
  - [ ] 同步状态记录
- [ ] 实现数据转换器（`McpProviderConverter`, `McpToolConverter`）
- [ ] 实现工作空间和用户权限隔离
- [ ] 编写服务层单元测试

**交付物**：
- 完整的服务层实现
- 单元测试覆盖率 > 80%

### 11.4 第四阶段：REST API 实现（1 周）

**目标**：实现完整的 REST API 接口

- [ ] 实现 `McpProviderController`
  - [ ] POST `/api/workspaces/current/tool-providers/mcp` - 创建插件
  - [ ] PUT `/api/workspaces/current/tool-providers/mcp/{id}` - 更新插件
  - [ ] DELETE `/api/workspaces/current/tool-providers/mcp/{id}` - 删除插件
  - [ ] GET `/api/workspaces/current/tool-providers/mcp` - 查询插件列表
  - [ ] GET `/api/workspaces/current/tool-providers/mcp/{id}` - 查询插件详情
  - [ ] POST `/api/workspaces/current/tool-providers/mcp/{id}/sync` - 手动同步
  - [ ] POST `/api/workspaces/current/tool-providers/mcp/test-connection` - 测试连接
- [ ] 实现统一响应格式
- [ ] 实现统一异常处理
- [ ] 实现请求参数验证
- [ ] 编写 API 集成测试

**交付物**：
- 完整的 REST API
- API 集成测试
- Postman 测试集合

### 11.5 第五阶段：安全性和可靠性增强（1.5 周）

**目标**：增强系统安全性和可靠性

- [ ] 实现 URL 安全验证
  - [ ] `McpUrlValidator` URL 格式验证
  - [ ] URL 白名单/黑名单机制
  - [ ] 防 SSRF 攻击
- [ ] 实现认证和加密
  - [ ] `McpAuthHandler` 认证处理
  - [ ] `McpEncryptionService` 敏感信息加密
  - [ ] 认证令牌管理
- [ ] 实现配置验证
  - [ ] `McpConfigValidator` 配置参数验证
  - [ ] 参数合法性检查
- [ ] 实现错误处理和重试
  - [ ] 自定义异常体系
  - [ ] 连接重试机制
  - [ ] 降级策略
- [ ] 实现请求限流
  - [ ] 单个 MCP 服务器限流
  - [ ] 全局并发控制
- [ ] 添加详细日志和监控
  - [ ] 关键操作日志
  - [ ] 性能监控埋点
  - [ ] 执行日志记录

**交付物**：
- 完善的安全机制
- 错误处理和重试机制
- 详细的日志输出

### 11.6 第六阶段：工具集成和高级功能（1.5 周）

**目标**：与 AppPlatform 工具系统深度集成

- [ ] 实现 `McpToolFactory` 工具工厂
  - [ ] 实现 `ToolFactory` 接口
  - [ ] 创建 MCP 工具实例
  - [ ] 工具执行逻辑
- [ ] 与 `ToolFactoryRepository` 集成
  - [ ] 注册 MCP 工具工厂
  - [ ] 工具发现和匹配
- [ ] 与 `ToolRepository` 集成
  - [ ] 工具元数据同步
  - [ ] 工具定义注册
- [ ] 实现自动同步调度器
  - [ ] `McpSyncScheduler` 定时任务
  - [ ] 同步任务调度
  - [ ] 并发控制
- [ ] 工具执行日志记录
  - [ ] 记录执行历史
  - [ ] 性能统计

**交付物**：
- 完整的工具集成
- 定时同步功能
- 执行日志功能

### 11.7 第七阶段：测试和优化（1 周）

**目标**：全面测试和性能优化

- [ ] 补充单元测试
  - [ ] 确保核心模块覆盖率 > 85%
  - [ ] 边界条件测试
  - [ ] 异常场景测试
- [ ] 集成测试
  - [ ] 端到端 API 测试
  - [ ] 与真实 MCP 服务器集成测试
  - [ ] 数据库操作测试
- [ ] 性能测试
  - [ ] 并发创建插件测试
  - [ ] 大量工具同步测试
  - [ ] 长时间运行稳定性测试
  - [ ] 内存泄漏检测
- [ ] 性能优化
  - [ ] 连接池优化
  - [ ] 缓存机制
  - [ ] SQL 查询优化
  - [ ] 异步处理优化
- [ ] 安全测试
  - [ ] SSRF 攻击测试
  - [ ] SQL 注入测试
  - [ ] 权限隔离测试

**交付物**：
- 完整的测试报告
- 性能测试报告
- 优化后的代码

### 11.8 第八阶段：文档和发布（0.5 周）

**目标**：完善文档并准备发布

- [ ] 编写用户使用文档
  - [ ] 功能介绍
  - [ ] 使用指南
  - [ ] 配置说明
  - [ ] 常见问题
- [ ] 编写 API 文档
  - [ ] 接口说明
  - [ ] 请求/响应示例
  - [ ] 错误码说明
- [ ] 编写开发者文档
  - [ ] 架构说明
  - [ ] 代码结构
  - [ ] 扩展指南
- [ ] 准备发布
  - [ ] Code Review
  - [ ] 代码重构
  - [ ] 版本标记
  - [ ] 发布说明

**交付物**：
- 完整的使用文档
- API 文档
- 可发布的版本

### 总计时间：约 10 周

**里程碑**：
- M1（2周后）：完成项目搭建和 MCP 客户端实现
- M2（4周后）：完成核心业务逻辑和 REST API
- M3（7周后）：完成安全增强和工具集成
- M4（10周后）：完成测试优化和文档，正式发布

## 12. 测试计划

### 12.1 单元测试

- MCP 客户端测试
- 工具转换器测试
- URL 验证器测试
- 服务层测试

### 12.2 集成测试

- 端到端 API 测试
- 与实际 MCP 服务器的集成测试
- 数据库操作测试

### 12.3 性能测试

- 并发请求测试
- 大量工具注册测试
- 长时间运行稳定性测试

## 13. 风险和挑战

### 13.1 技术风险

| 风险 | 影响 | 应对措施 |
|-----|------|---------|
| MCP 协议标准变更 | 高 | 关注 MCP 协议更新，保持 SDK 版本同步 |
| MCP 服务器不稳定 | 中 | 实现健壮的错误处理和重试机制 |
| 性能瓶颈 | 中 | 实现连接池、缓存机制 |
| 安全漏洞 | 高 | 严格的 URL 验证、认证授权机制 |

### 13.2 业务风险

| 风险 | 影响 | 应对措施 |
|-----|------|---------|
| 用户配置错误的 URL | 低 | 提供友好的错误提示和配置向导 |
| MCP 服务器返回大量工具 | 中 | 实现分页机制，支持工具过滤 |
| 工具执行时间过长 | 中 | 支持异步执行，提供执行状态查询 |

## 14. 未来规划

### 14.1 功能扩展

- 支持 MCP 服务器的健康检查和监控
- 支持工具的版本管理
- 支持工具的批量操作
- 提供可视化的 MCP 工具管理界面
- 支持 MCP 工具的缓存机制

### 14.2 性能优化

- 实现工具元数据的本地缓存
- 支持 MCP 连接的复用
- 优化大量工具的注册性能

### 14.3 生态建设

- 提供 MCP 服务器示例
- 建立 MCP 工具市场
- 提供 MCP 工具开发 SDK

## 15. 参考资料

- [Model Context Protocol 官方文档](https://modelcontextprotocol.io/)
- [FIT 框架文档](https://github.com/ModelEngine-Group/fit-framework)
- [AppPlatform 插件开发指导](../Java插件开发指导.md)
- [JSON Schema 规范](https://json-schema.org/)

## 16. 变更记录

| 版本 | 日期 | 作者 | 变更说明 |
|-----|------|------|---------|
| 1.0 | 2025-10-22 | - | 初始版本 |

