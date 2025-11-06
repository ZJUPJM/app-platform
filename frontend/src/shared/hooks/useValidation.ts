/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { setValidateInfo } from '@/store/appInfo/appInfo';
import { createGraphOperator } from '@fit-elsa/agent-flow';
import { get } from 'lodash';
import { getCheckList } from '@/shared/http/aipp';
import { 
  convertFrontendValidationErrors, 
  extractFrontendErrors,
  mergeNodesByNodeId,
  flattenNodesToItems,
} from '@/shared/utils/validation';

/**
 * 配置校验 Hook
 * 统一管理前后端校验逻辑
 */
export const useValidation = (tenantId: string, _logPrefix: string = 'Validation') => {
  const dispatch = useAppDispatch();
  const appValidateInfo = useAppSelector((state) => state.appStore.validateInfo);
  const appInfo = useAppSelector((state) => state.appStore.appInfo);

  const checkValidity = useCallback(async (data: any, isWorkFlow?: boolean) => {
    if (!data?.flowGraph?.appearance) {
      return;
    }

    try {
      // 后端可用性检查（节点结构）- 临时禁用后端校验
      // const graphOperator = createGraphOperator(JSON.stringify(data.flowGraph.appearance));
      // const formValidate = graphOperator.getFormsToValidateInfo();
      // const res: any = await getCheckList(tenantId, formValidate);
      let backendNodes: any[] = []; // 不触发后端校验，只使用前端校验

      // 是否为工作流模式
      const isWorkFlowMode = isWorkFlow ?? (get(data, 'configFormProperties[0].name') === 'workflow');

      // 配置页场景保留已有前端错误
      const currentValidateInfo = appValidateInfo || [];
      const existingFrontendErrors = extractFrontendErrors(currentValidateInfo);

      // 前端必填项校验 → 节点结构
      let frontendNodes: any[] = [];
      if ((window as any).agent) {
        try {
          await (window as any).agent.validate();
        } catch (frontendErrors) {
          if (Array.isArray(frontendErrors)) {
            frontendNodes = convertFrontendValidationErrors(frontendErrors, (window as any).agent);
          }
        }
      } else if (existingFrontendErrors.length > 0) {
        frontendNodes = existingFrontendErrors as any[];
      }

      // 节点级合并（不去重）
      let mergedNodes = mergeNodesByNodeId(backendNodes, frontendNodes);

      // 非工作流：展平
      let validateList: any[];
      if (!isWorkFlowMode) {
        validateList = flattenNodesToItems(mergedNodes);
      } else {
        validateList = mergedNodes;
      }
      
      dispatch(setValidateInfo(validateList));
      return validateList;
    } catch (error) {
      throw error;
    }
  }, [tenantId, dispatch, appValidateInfo, appInfo]);

  return { checkValidity };
};

