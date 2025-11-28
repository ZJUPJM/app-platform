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
