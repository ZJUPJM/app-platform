/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { get, post, put, del } from './http';

const MCP_URL = '/api/jober/plugins/mcp';

// MCP服务接口
export interface MCPService {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  status: 'connected' | 'disconnected' | 'testing';
  lastTestTime?: string;
  createTime: string;
  source: 'moda' | 'custom';
  config?: any;
}

// 创建MCP服务
export function createMCPService(tenantId: string, data: {
  name: string;
  description: string;
  endpoint: string;
  config?: any;
}) {
  return post(`${MCP_URL}/services`, {
    tenantId,
    ...data
  });
}

// 获取MCP服务列表
export function getMCPServices(tenantId: string, params?: {
  pageNum?: number;
  pageSize?: number;
  name?: string;
  status?: string;
  source?: string;
}) {
  // 调用后端接口：GET /api/jober/plugins/mcp
  return get(`${MCP_URL}`, {
    ...params
  });
}

// 获取单个MCP服务详情
export function getMCPService(tenantId: string, serviceId: string) {
  // 调用后端接口：GET /api/jober/plugins/mcp/{providerId}
  return get(`${MCP_URL}/${serviceId}`);
}

// 更新MCP服务
export function updateMCPService(tenantId: string, serviceId: string, data: Partial<MCPService>) {
  // 调用后端接口：PUT /api/jober/plugins/mcp/{providerId}
  return put(`${MCP_URL}/${serviceId}`, data);
}

// 删除MCP服务
export function deleteMCPService(tenantId: string, serviceId: string) {
  // 调用后端接口：DELETE /api/jober/plugins/mcp/{providerId}
  return del(`${MCP_URL}/${serviceId}`);
}

// 测试MCP服务连接
export function testMCPConnection(tenantId: string, serviceId: string) {
  return post(`${MCP_URL}/services/${serviceId}/test`, {
    tenantId
  });
}

// 获取魔搭社区MCP服务列表
// 参考: https://modelscope.cn/mcp
export function getModaMCPServices(params?: {
  category?: string;
  search?: string;
  pageNum?: number;
  pageSize?: number;
  tags?: string[];
  author?: string;
}) {
  return get(`${MCP_URL}/moda/services`, params);
}

// 获取魔搭社区MCP服务分类列表
export function getModaMCPServiceCategories() {
  return get(`${MCP_URL}/moda/categories`);
}

// 导入魔搭社区MCP服务
export function importModaMCPService(tenantId: string, serviceData: {
  name: string;
  description: string;
  endpoint: string;
  category: string;
}) {
  return post(`${MCP_URL}/moda/import`, {
    tenantId,
    ...serviceData
  });
}

// 批量导入魔搭社区MCP服务
export function batchImportModaServices(tenantId: string, services: any[]) {
  return post(`${MCP_URL}/moda/batch-import`, {
    tenantId,
    services
  });
}

// 配置魔搭社区MCP服务
export function configureModaService(tenantId: string, serviceId: string, config: any) {
  return post(`${MCP_URL}/moda/configure`, {
    tenantId,
    serviceId,
    config
  });
}

// 获取魔搭社区MCP服务配置模板
export function getModaServiceConfigTemplate(serviceId: string) {
  return get(`${MCP_URL}/moda/config-template/${serviceId}`);
}

// 获取魔搭社区MCP服务使用示例
export function getModaServiceExamples(serviceId: string) {
  return get(`${MCP_URL}/moda/examples/${serviceId}`);
}

// 手动配置添加MCP服务
export function addManualMCPService(tenantId: string, serviceData: any) {
  // 调用后端接口：POST /api/jober/plugins/mcp
  return post(`${MCP_URL}`, serviceData);
}

// 测试MCP服务连接
export function testMCPServiceConnection(tenantId: string, requestBody: any) {
  // 调用后端接口：POST /api/jober/plugins/mcp/test-connection
  // 添加 skipErrorHandler 配置，跳过全局错误处理
  return post(`${MCP_URL}/test-connection`, requestBody, { skipErrorHandler: true } as any);
}

// 获取MCP服务配置模板
export function getMCPServiceConfigTemplate(serviceType: string) {
  return get(`${MCP_URL}/services/config-template/${serviceType}`);
}

// 获取MCP服务能力列表
export function getMCPServiceCapabilities(tenantId: string, serviceId: string) {
  return get(`${MCP_URL}/services/${serviceId}/capabilities`, {
    tenantId
  });
}

// 调用MCP服务
export function callMCPService(tenantId: string, serviceId: string, method: string, params?: any) {
  return post(`${MCP_URL}/services/${serviceId}/call`, {
    tenantId,
    method,
    params
  });
}
