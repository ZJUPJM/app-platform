/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 校验相关的工具函数
 */

/**
 * 获取节点的 inputParams
 */
const getNodeInputParams = (node: any): any[] | null => {
  if (node.type === 'startNodeStart') {
    return node.flowMeta?.inputParams || null;
  }
  if (node.type === 'endNodeEnd') {
    return node.flowMeta?.callback?.converter?.entity?.inputParams || null;
  }
  return node.flowMeta?.jober?.converter?.entity?.inputParams || null;
};

/**
 * 从参数数组中递归查找字段并返回显示名称
 */
const findFieldName = (params: any[], name: string, id?: string): string | null => {
  for (const param of params) {
    if (!param) continue;
    
    // 匹配字段：按名称或 ID
    if (param.name === name || (id && param.id === id)) {
      // 获取字段显示名称：使用 displayName，如果不存在或为空则使用传入的 name（configName）作为后备
      const fieldName = param.displayName && param.displayName.trim() !== '' 
        ? param.displayName 
        : name || null;
      
      return fieldName;
    }
    
    // 递归查找子级（如果 param.value 是数组）
    if (Array.isArray(param.value) && param.value.length > 0) {
      const found = findFieldName(param.value, name, id);
      if (found) return found;
    }
  }
  return null;
};

/**
 * 从 agent 中查找节点（公共函数，提取重复的节点查找逻辑）
 * @param agent - Elsa agent 实例
 * @param nodeId - 节点 ID
 * @returns 找到的节点，如果未找到则返回 null
 */
const findNodeFromAgent = (agent: any, nodeId: string): any | null => {
  try {
    const allShapes = agent.serialize()?.pages?.[0]?.shapes || [];
    
    // 先精确匹配节点 ID
    let node = allShapes.find((shape: any) => shape.id === nodeId);
    
    // 未找到则在节点配置中反向查找（字段 UUID 归属的父节点）
    if (!node) {
      for (const shape of allShapes) {
        const shapeStr = JSON.stringify(shape);
        if (shapeStr.includes(nodeId)) {
          node = shape;
          break;
        }
      }
    }
    
    return node || null;
  } catch {
    return null;
  }
};

/**
 * 根据配置名称获取字段名称
 * @param configName - 配置项名称
 * @param agent - Elsa agent 实例（可选）
 * @param nodeId - 节点 ID（可选）
 * @param fieldId - 字段 ID（可选，用于查找 prompt.variables.value 中的字段）
 * @returns 字段名称
 */
const getConfigDescription = (configName: string, agent?: any, nodeId?: string, fieldId?: string): string | null => {
  if (!agent || !nodeId) {
    return configName;
  }

  try {
    const node = findNodeFromAgent(agent, nodeId);
    if (!node) return configName;
    
    const inputParams = getNodeInputParams(node);
    if (!Array.isArray(inputParams) || inputParams.length === 0) {
      return configName;
    }
    
    const fieldName = findFieldName(inputParams, configName, fieldId);
    return fieldName || configName;
  } catch {
    return configName;
  }
};

/**
 * 从 agent 获取节点信息
 * @param agent - Elsa agent 实例
 * @param nodeId - 节点 ID
 * @returns 节点信息（名称和类型, 以及最终可用的节点ID）
 */
export const getNodeInfo = (agent: any, nodeId: string) => {
  try {
    const node = findNodeFromAgent(agent, nodeId);

    const nodeName = node?.text || '';

    return {
      name: nodeName || '未命名节点',
      type: node?.type || 'unknown',
      resolvedNodeId: node?.id || nodeId,
    };
  } catch {
    return { name: '未命名节点', type: 'unknown', resolvedNodeId: nodeId };
  }
};

/**
 * 转换前端校验错误为统一的 CheckResult 格式
 * @param frontendErrors - 前端校验错误数组
 * @param agent - Elsa agent 实例
 */
export const convertFrontendValidationErrors = (frontendErrors: any[], agent: any) => {
  const nodeErrorMap = new Map();

  frontendErrors.forEach((formError: any) => {
    formError.errorFields?.forEach((field: any) => {
      const fieldName = field.name[0];

      // 支持两种字段命名："model-jadeate2jv" 或 "name-<uuid>"
      const uuidPattern = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
      const uuidMatch = fieldName.match(uuidPattern);

      let configName: string;
      let originalId: string;

      if (uuidMatch) {
        originalId = uuidMatch[1];
        configName = fieldName.substring(0, fieldName.length - originalId.length - 1);
      } else {
        const lastDashIndex = fieldName.lastIndexOf('-');
        if (lastDashIndex === -1) return;
        configName = fieldName.substring(0, lastDashIndex);
        originalId = fieldName.substring(lastDashIndex + 1);
      }

      const nodeInfo = getNodeInfo(agent, originalId);
      const effectiveNodeId = (nodeInfo as any).resolvedNodeId || originalId;

      if (!nodeErrorMap.has(effectiveNodeId)) {
        nodeErrorMap.set(effectiveNodeId, {
          nodeId: effectiveNodeId,
          name: nodeInfo.name || '未命名节点',
          type: nodeInfo.type || 'unknown',
          isValid: false,
          configChecks: []
        });
      }

      const fieldNameResult = getConfigDescription(configName, agent, effectiveNodeId, originalId);
      
      nodeErrorMap.get(effectiveNodeId).configChecks.push({
        configCheckId: `frontend-${Date.now()}-${Math.random()}`,
        configName: configName,
        fieldName: fieldNameResult,
        errorMessage: field.errors[0] || '字段校验失败',
        source: 'frontend'
      });
    });
  });

  return Array.from(nodeErrorMap.values());
};

/**
 * 节点级合并（不去重）：将同一 nodeId 的后端与前端错误合并到同一节点条目下
 */
export const mergeNodesByNodeId = (backendNodes: any[] = [], frontendNodes: any[] = []) => {
  const allNodes = (backendNodes || []).concat(frontendNodes || []);
  const nodeIdToNode = new Map<string, any>();

  for (const node of allNodes) {
    if (!node) continue;
    const nodeId = node.nodeId;
    if (!nodeIdToNode.has(nodeId)) {
      nodeIdToNode.set(nodeId, {
        nodeId,
        name: node.name || '',
        type: node.type || '',
        isValid: false,
        configChecks: [] as any[]
      });
    }
    const merged = nodeIdToNode.get(nodeId);
    if (!merged.name && node.name) merged.name = node.name;
    if (!merged.type && node.type) merged.type = node.type;
    if (Array.isArray(node.configChecks)) {
      merged.configChecks = merged.configChecks.concat(node.configChecks);
    }
  }

  return Array.from(nodeIdToNode.values());
};

/**
 * 将节点结构展平为扁平条目（非工作流模式使用）
 */
export const flattenNodesToItems = (nodes: any[] = []) => {
  const items: any[] = [];
  for (const node of nodes) {
    const checks = node?.configChecks || [];
    for (const c of checks) {
      items.push({
        type: node.type,
        configName: c.configName,
        fieldName: c.fieldName,
        description: c.description, // 保留向后兼容
        errorMessage: c.errorMessage,
        source: c.source,
        serviceName: c.serviceName,
        tag: c.tag,
        configCheckId: c.configCheckId,
      });
    }
  }
  return items;
};

/**
 * 分离前端错误
 */
export const extractFrontendErrors = (validateList: any[]) => {
  return (validateList || []).filter((item: any) => 
    item.configChecks?.some((check: any) => check.source === 'frontend')
  );
};
