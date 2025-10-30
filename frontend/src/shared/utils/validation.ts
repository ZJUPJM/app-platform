/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 校验相关的工具函数
 */

/**
 * 从 agent 获取节点信息
 * @param agent - Elsa agent 实例
 * @param nodeId - 节点 ID
 * @returns 节点信息（名称和类型, 以及最终可用的节点ID）
 */
export const getNodeInfo = (agent: any, nodeId: string) => {
  try {
    const graphData = agent.serialize();
    const allShapes = graphData?.pages?.[0]?.shapes || [];

    // 先直接查找节点 ID
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

    let nodeName = node?.text || '';
    if (!nodeName && node?.type) {
      const typeNameMap: Record<string, string> = {
        'llmNodeState': '大模型',
        'knowledgeRetrievalNodeState': '知识检索',
        'toolInvokeNodeState': '工具调用',
        'huggingFaceNodeState': 'HuggingFace',
        'startNodeState': '开始',
        'endNodeEnd': '结束',
        'manualCheckNodeState': '人工审核',
      };
      nodeName = typeNameMap[node?.type as string] || '未命名节点';
    }

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

      nodeErrorMap.get(effectiveNodeId).configChecks.push({
        configCheckId: `frontend-${Date.now()}-${Math.random()}`,
        configName: configName,
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
