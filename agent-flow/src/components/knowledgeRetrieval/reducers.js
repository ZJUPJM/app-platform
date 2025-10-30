/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {structToConfig, toConfigType, updateConfigValueByObject, updateInput} from '@/components/util/JadeConfigUtils.js';
import {v4 as uuidv4} from 'uuid';
import {DATA_TYPES, DEFAULT_KNOWLEDGE_REPO_GROUP_STRUCT, DEFAULT_KNOWLEDGE_RETRIEVAL_NODE_KNOWLEDGE_CONFIG_ID, FROM_TYPE} from '@/common/Consts.js';

/**
 * updateInputParams 事件处理器.
 *
 * @return {{}} 处理器对象.
 * @constructor
 */
export const UpdateInputParamReducer = () => {
  const self = {};
  self.type = 'updateInputParams';

  /**
   * 处理方法.
   *
   * @param config 配置数据.
   * @param action 事件对象.
   * @return {*} 处理之后的数据.
   */
  self.reduce = (config, action) => {
    const newConfig = {...config};
    newConfig.inputParams = updateInput(newConfig.inputParams, action.id, action.changes);
    return newConfig;
  };

  return self;
};

/**
 * updateOption 事件处理器.
 *
 * @return {{}} 处理器对象.
 * @constructor
 */
export const UpdateOptionReducer = () => {
  const self = {};
  self.type = 'updateOption';

  /**
   * 处理方法.
   *
   * @param config 配置数据.
   * @param action 事件对象.
   * @return {*} 处理之后的数据.
   */
  self.reduce = (config, action) => {
    const newConfig = {...config};
    newConfig.inputParams = newConfig.inputParams.map(ip => {
      if (ip.name === 'option') {
        const newOption = {...ip};
        if (newOption.value.length > 0) {
          updateConfigValueByObject(newOption, action.option);
        } else {
          newOption.value = structToConfig(action.option);
        }
        return newOption;
      } else {
        return ip;
      }
    });
    return newConfig;
  };

  return self;
};

export const KnowledgeFlatReducer = () => {
  const self = {};
  self.type = 'updateKnowledgeFlat';

  self.reduce = (config, action) => {
    const newConfig = { ...config };

    // 🟡 1. 如果传了 groupId → 更新它，且变更时清空 knowledgeRepos
    if (action.groupId !== undefined) {
      updateGroupId(newConfig, action.groupId);
    }

    // 🟡 2. 如果传了 knowledgeConfigId → 更新它
    if (action.knowledgeConfigId !== undefined) {
      updateKnowledgeConfigId(newConfig, action.knowledgeConfigId);
    }

    // 🟡 3. 如果传了 knowledgeRepos → 转换并设置
    if (action.knowledgeRepos !== undefined) {
      updateKnowledgeRepos(newConfig, action.knowledgeRepos);
    }

    return newConfig;
  };

  // =============== 内部方法：专注当前业务 ===============

  const updateGroupId = (config, newGroupId) => {
    const option = getOptionParam(config);
    let groupId = findParamInOption(option, 'groupId');

    if (!groupId) {
      groupId = JSON.parse(JSON.stringify(DEFAULT_KNOWLEDGE_REPO_GROUP_STRUCT));
      option.value.push(groupId);
    }

    // 🧹 联动：groupId 变更 → 清空 knowledgeRepos
    if (groupId.value !== newGroupId) {
      clearKnowledgeRepos(config);
    }

    groupId.value = newGroupId;
  };

  const updateKnowledgeConfigId = (config, newConfigId) => {
    const option = getOptionParam(config);
    let knowledgeConfigId = findParamInOption(option, 'knowledgeConfigId');

    if (!knowledgeConfigId) {
      knowledgeConfigId = JSON.parse(JSON.stringify(DEFAULT_KNOWLEDGE_RETRIEVAL_NODE_KNOWLEDGE_CONFIG_ID));
      option.value.push(knowledgeConfigId);
    }

    knowledgeConfigId.value = newConfigId;
  };

  const updateKnowledgeRepos = (config, repos) => {
    const knowledgeRepos = config.inputParams.find(ip => ip.name === 'knowledgeRepos');
    if (!knowledgeRepos) return;

    knowledgeRepos.value = repos.map(v => ({
      id: uuidv4(),
      type: DATA_TYPES.OBJECT,
      from: FROM_TYPE.EXPAND,
      value: Object.keys(v).map(k => ({
        id: uuidv4(),
        from: FROM_TYPE.INPUT,
        name: k,
        type: toConfigType(v[k]),
        value: v[k],
      })),
    }));
  };

  const clearKnowledgeRepos = (config) => {
    const knowledgeRepos = config.inputParams.find(ip => ip.name === 'knowledgeRepos');
    if (knowledgeRepos) {
      knowledgeRepos.value = [];
    }
  };

  const getOptionParam = (config) => {
    return config.inputParams.find(ip => ip.name === 'option');
  };

  const findParamInOption = (option, paramName) => {
    return option?.value?.find(v => v.name === paramName);
  };

  return self;
};

/**
 * updateKnowledge 事件处理器.
 *
 * @return {{}} 处理器对象.
 * @constructor
 */
export const UpdateKnowledgeReducer = () => {
  const self = {};
  self.type = 'updateKnowledge';

  /**
   * 处理方法.
   *
   * @param config 配置数据.
   * @param action 事件对象.
   * @return {*} 处理之后的数据.
   */
  self.reduce = (config, action) => {
    const newConfig = {...config};
    newConfig.inputParams = newConfig.inputParams.map(ip => {
      if (ip.name === 'knowledgeRepos') {
        const knowledgeRepos = {...ip};
        updateKnowledgeRepos(knowledgeRepos, action);
        return knowledgeRepos;
      } else {
        return ip;
      }
    });
    return newConfig;
  };

  const updateKnowledgeRepos = (knowledgeRepos, action) => {
    // 转换为jadeConfig格式.
    const newItems = action.value.map(v => {
      return {
        id: uuidv4(),
        type: DATA_TYPES.OBJECT,
        from: FROM_TYPE.EXPAND,
        value: Object.keys(v).map(k => ({
          id: uuidv4(),
          from: FROM_TYPE.INPUT,
          name: k,
          type: toConfigType(v[k]),
          value: v[k],
        })),
      };
    });

    knowledgeRepos.value = [...newItems];
  };

  return self;
};

/**
 * updateGroupIdAndConfigId 事件处理器.
 *
 * @return {{}} 处理器对象.
 * @constructor
 */
export const UpdateGroupIdAndConfigIdReducer = () => {
  const self = {};
  self.type = 'updateGroupIdAndConfigId';

  /**
   * 处理方法.
   *
   * @param config 配置数据.
   * @param action 事件对象.
   * @return {*} 处理之后的数据.
   */
  self.reduce = (config, action) => {
    const newConfig = {...config};
    const option = newConfig.inputParams.find(ip => ip.name === 'option');
    let groupId = option.value.find(v => v.name === 'groupId');
    if (!groupId) {
      groupId = JSON.parse(JSON.stringify(DEFAULT_KNOWLEDGE_REPO_GROUP_STRUCT));
      option.value.push(groupId);
    }

    if (groupId.value !== action.value) {
      clearKnowledgeRepos(newConfig);
    }

    groupId.value = action.value;

    let knowledgeConfigId = option.value.find(v => v.name === 'knowledgeConfigId');
    if (!knowledgeConfigId) {
      knowledgeConfigId = JSON.parse(JSON.stringify(DEFAULT_KNOWLEDGE_RETRIEVAL_NODE_KNOWLEDGE_CONFIG_ID));
      option.value.push(knowledgeConfigId);
    }
    knowledgeConfigId.value = action.knowledgeConfigId;

    return newConfig;
  };

  const clearKnowledgeRepos = (config) => {
    const knowledgeRepos = config.inputParams.find(ip => ip.name === 'knowledgeRepos');
    knowledgeRepos.value = [];
  };

  return self;
};

/**
 * changeRerankParam 事件处理器.
 * 修改为每次更新都创建全新的对象引用
 */
export const ChangeRerankParamReducer = () => {
  const self = {};
  self.type = 'changeRerankParam';

  self.reduce = (config, action) => {
    return {
      ...config,
      inputParams: config.inputParams.map(ip => {
        if (ip.name !== 'option') {
          return {...ip};
        }
        return {
          ...ip,
          value: ip.value.map(v => {
            if (v.name !== 'rerankParam') {
              return {...v};
            }
            return {
              ...v,
              value: v.value.map(param => {
                if (param.name !== action.name) {
                  return {...param};
                }
                return {
                  ...param,
                  value: action.value,
                };
              })
            };
          })
        };
      })
    };
  };

  return self;
};

/**
 * changeAccessInfo 事件处理器.
 *
 * @return {{}} 处理器对象.
 * @constructor
 */
export const ChangeAccessInfoReducer = () => {
  const self = {};
  self.type = 'changeAccessInfo';

  const _updateAccessInfoValue = (accessInfoValue, serviceName, tag) => {
    if (accessInfoValue.name === 'serviceName') {
      return {...accessInfoValue, value: serviceName};
    } else if (accessInfoValue.name === 'tag') {
      return {...accessInfoValue, value: tag};
    }
    return accessInfoValue;
  };

  /**
   * 处理方法.
   *
   * @param config 配置数据.
   * @param action 事件对象.
   * @return {*} 处理之后的数据.
   */
  self.reduce = (config, action) => {
    return {
      ...config,
      inputParams: config.inputParams.map(ip => {
        if (ip.name !== 'option') {
          return {...ip};
        }
        return {
          ...ip,
          value: ip.value.map(v => {
            if (v.name !== 'rerankParam') {
              return {...v};
            }
            return {
              ...v,
              value: v.value.map(item => {
                return item.name === 'accessInfo' ? {
                  ...item,
                  value: item.value.map(accessInfoValue => _updateAccessInfoValue(accessInfoValue, action.serviceName, action.tag)),
                } : item;
              })
            };
          })
        };
      })
    };
  };

  return self;
};