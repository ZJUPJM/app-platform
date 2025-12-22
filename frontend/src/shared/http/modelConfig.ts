/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { get, post, put, del } from "./http";
import serviceConfig from './httpConfig';
const { AIPP_URL } = serviceConfig;

/**
 * 获取用户模型列表
 */
export const getUserModels = (tenantId: string) => {
  return new Promise((resolve, reject) => {
    get(`${AIPP_URL}/${tenantId}/models`).then((res) => {
      resolve(res);
    }, (error) => {
      reject(error);
    });
  });
};

/**
 * 添加用户模型
 */
export const addUserModel = (tenantId: string, data: {
  modelName: string;
  apiKey: string;
  baseUrl: string;
  type: string;
  isDefault?: boolean;
}) => {
  return new Promise((resolve, reject) => {
    post(`${AIPP_URL}/${tenantId}/models`, data).then((res) => {
      resolve(res);
    }, (error) => {
      reject(error);
    });
  });
};

/**
 * 删除用户模型
 */
export const deleteUserModel = (tenantId: string, modelId: string) => {
  return new Promise((resolve, reject) => {
    del(`${AIPP_URL}/${tenantId}/models/${modelId}`).then((res) => {
      resolve(res);
    }, (error) => {
      reject(error);
    });
  });
};

/**
 * 切换默认模型
 */
export const switchDefaultModel = (tenantId: string, modelId: string) => {
  return new Promise((resolve, reject) => {
    put(`${AIPP_URL}/${tenantId}/models/${modelId}/default`).then((res) => {
      resolve(res);
    }, (error) => {
      reject(error);
    });
  });
};

/**
 * 更新用户模型
 */
export const updateUserModel = (tenantId: string, modelId: string, data: {
  modelName: string;
  apiKey: string;
  baseUrl: string;
  type: string;
}) => {
  return new Promise((resolve, reject) => {
    put(`${AIPP_URL}/${tenantId}/models/${modelId}`, data).then((res) => {
      resolve(res);
    }, (error) => {
      reject(error);
    });
  });
};

/**
 * 获取系统模型列表 (user_id='system')
 */
export const getSystemModels = (tenantId: string) => {
  return new Promise((resolve, reject) => {
    get(`${AIPP_URL}/${tenantId}/models-system`).then((res) => {
      resolve(res);
    }, (error) => {
      reject(error);
    });
  });
};

/**
 * 添加系统模型
 */
export const addSystemModel = (tenantId: string, data: {
  modelName: string;
  apiKey: string;
  baseUrl: string;
  type: string;
}) => {
  return new Promise((resolve, reject) => {
    post(`${AIPP_URL}/${tenantId}/models-system`, data).then((res) => {
      resolve(res);
    }, (error) => {
      reject(error);
    });
  });
};

/**
 * 删除系统模型
 */
export const deleteSystemModel = (tenantId: string, modelId: string) => {
  return new Promise((resolve, reject) => {
    del(`${AIPP_URL}/${tenantId}/models-system/${modelId}`).then((res) => {
      resolve(res);
    }, (error) => {
      reject(error);
    });
  });
};

/**
 * 切换系统默认模型
 */
export const switchSystemDefaultModel = (tenantId: string, modelId: string) => {
  return new Promise((resolve, reject) => {
    put(`${AIPP_URL}/${tenantId}/models-system/${modelId}/default`).then((res) => {
      resolve(res);
    }, (error) => {
      reject(error);
    });
  });
};

/**
 * 更新系统模型
 */
export const updateSystemModel = (tenantId: string, modelId: string, data: {
  modelName: string;
  apiKey: string;
  baseUrl: string;
  type: string;
}) => {
  return new Promise((resolve, reject) => {
    put(`${AIPP_URL}/${tenantId}/models-system/${modelId}`, data).then((res) => {
      resolve(res);
    }, (error) => {
      reject(error);
    });
  });
};

// ==================== 系统模型可见性配置相关 API ====================

/**
 * 获取系统模型对普通用户的可见性配置
 */
export const getSystemModelVisibility = (tenantId: string) => {
  return new Promise((resolve, reject) => {
    get(`${AIPP_URL}/${tenantId}/models/system-model-visibility`).then((res) => {
      resolve(res);
    }, (error) => {
      reject(error);
    });
  });
};

/**
 * 设置系统模型对普通用户的可见性配置
 */
export const setSystemModelVisibility = (tenantId: string, visible: boolean) => {
  return new Promise((resolve, reject) => {
    post(`${AIPP_URL}/${tenantId}/models/system-model-visibility`, { visible }).then((res) => {
      resolve(res);
    }, (error) => {
      reject(error);
    });
  });
};
