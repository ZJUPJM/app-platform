/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {InvokeInput} from '@/components/common/InvokeInput.jsx';
import {InvokeOutput} from '@/components/common/InvokeOutput.jsx';
import {SkillForm} from '@/components/loopNode/SkillForm.jsx';
import {useDataContext, useDispatch, useShapeContext} from '@/components/DefaultRoot.jsx';
import {TOOL_TYPE} from '@/common/Consts.js';
import PropTypes from 'prop-types';
import {useEffect, useRef, useState} from "react";
import httpUtil from "@/components/util/httpUtil.jsx";
import {v4 as uuidv4} from 'uuid';

// 模块级别的 Set，用于跟踪正在创建子流程的节点 ID
const creatingNodes = new Set();

/**
 * 循环节点Wrapper
 *
 * @param shapeStatus 图形状态
 * @returns {JSX.Element} 循环节点Wrapper的DOM
 */
const LoopWrapper = ({shapeStatus}) => {
  const data = useDataContext();
  const dispatch = useDispatch();
  const inputData = data && data.inputParams;
  const args = inputData && inputData.find(value => value.name === 'args').value;
  const radioValue = inputData?.find(value => value.name === 'config')?.value?.loopKeys?.[0] ?? null;
  const toolInfo = inputData && inputData.find(value => value.name === 'toolInfo').value;
  const outputData = data && data.outputParams;
  const isWaterFlow = toolInfo?.tags?.some(tag => tag === TOOL_TYPE.WATER_FLOW)
  const filterArgs = isWaterFlow ? args.find(arg => arg.name === 'inputParams')?.value ?? args : args;
  const filterRadioValue = isWaterFlow && radioValue ? radioValue.replace(/^inputParams\./, '') : radioValue;
  const shape = useShapeContext();
  let config;
  if (!shape || !shape.graph || !shape.graph.configs) {
    // 没关系，继续.
  } else {
    config = shape.graph.configs.find(node => node.node === 'loopNodeState');
  }
  // 添加状态管理 - 改为单个工具对象
  const [currentToolOption, setCurrentToolOption] = useState(null);
  const lastRequestedNameRef = useRef(null);
  const [isCreatingSubflow, setIsCreatingSubflow] = useState(false);
  const hasTriedAutoCreateRef = useRef(false);

  const handlePluginChange = (entity, uniqueName, name, tags, appId, tenantId, version) => {
    dispatch({
      type: 'changePluginByMetaData',
      entity: entity,
      uniqueName: uniqueName,
      pluginName: name,
      tags: tags,
      appId: appId,
      tenantId: tenantId,
      version: version
    });
  };

  const handlePluginDelete = (deletePluginId) => {
    dispatch({
      type: 'deletePlugin', formId: deletePluginId,
    });
  };

  /**
   * 自动创建循环子流程
   */
  const autoCreateSubflow = () => {
    // 使用模块级别的 Set 来防止重复创建
    if (creatingNodes.has(shape.id)) {
      console.log('[LoopNode] Already creating subflow for node:', shape.id);
      return;
    }

    // 立即添加到创建集合中
    creatingNodes.add(shape.id);
    console.log('[LoopNode] Starting subflow creation for node:', shape.id);

    // 立即标记已尝试创建
    hasTriedAutoCreateRef.current = true;
    setIsCreatingSubflow(true);

    // 从 llmNodeState 配置中获取 tenantId
    const llmConfig = shape.graph.configs.find(node => node.node === 'llmNodeState');
    const currentTenantId = llmConfig?.params?.tenantId;

    if (!currentTenantId) {
      console.warn('[LoopNode] Cannot create subflow: tenantId not found');
      creatingNodes.delete(shape.id); // 失败时移除
      setIsCreatingSubflow(false);
      return;
    }

    // 获取 endpoint
    const loopConfig = shape.graph.configs.find(node => node.node === 'loopNodeState');
    const endpoint = loopConfig?.urls?.endpoint || window.location.origin;

    // 根据环境判断 baseUrl
    let baseUrl;
    if (endpoint.includes('/appbuilder')) {
      baseUrl = endpoint;
    } else if (process.env.PACKAGE_MODE === 'spa') {
      baseUrl = `${endpoint}/appbuilder`;
    } else {
      baseUrl = `${endpoint}/api/jober`;
    }

    // 模板 ID
    const LOOP_TEMPLATE_ID = 'df87073b9bc85a48a9b01eccc9afccc3';

    // 调用创建应用 API
    const createUrl = `${baseUrl}/v1/api/${currentTenantId}/app/${LOOP_TEMPLATE_ID}`;
    const createParams = {
      type: 'waterFlow',
      name: `循环子流程_${shape.id.substring(0, 8)}`,
      description: '自动创建的循环子流程',
      app_built_type: 'workflow',
      app_category: 'workflow'
    };

    httpUtil.post(
      createUrl,
      createParams,
      new Map(),
      (responseData) => {
        if (responseData.code === 0 && responseData.data) {
          const newAppId = responseData.data.id;
          console.log('[LoopNode] Subflow created successfully:', newAppId);

          // 获取子流程详情并更新节点
          fetchAndUpdateSubflowParams(currentTenantId, newAppId, baseUrl);
          // 注意：创建成功后不要从 Set 中移除，保持防护
        } else {
          console.error('[LoopNode] Failed to create subflow:', responseData);
          creatingNodes.delete(shape.id); // 失败时移除，允许重试
          setIsCreatingSubflow(false);
        }
      },
      (error) => {
        console.error('[LoopNode] Error creating subflow:', error);
        creatingNodes.delete(shape.id); // 失败时移除，允许重试
        setIsCreatingSubflow(false);
      }
    );
  };

  /**
   * 获取子流程详情并更新节点参数
   */
  const fetchAndUpdateSubflowParams = (currentTenantId, appId, baseUrl) => {
    const detailsUrl = `${baseUrl}/v1/api/${currentTenantId}/app/${appId}`;

    httpUtil.get(
      detailsUrl,
      new Map(),
      (responseData) => {
        if (responseData.code === 0 && responseData.data) {
          const appData = responseData.data;

          // 从 flowGraph 中提取输入输出参数
          const flowGraph = appData.flowGraph?.appearance;
          if (!flowGraph || !flowGraph.nodes) {
            console.warn('[LoopNode] No flowGraph found in subflow');
            setIsCreatingSubflow(false);
            return;
          }

          // 查找开始节点
          const startNode = flowGraph.nodes.find(node => node.type === 'startNodeStart');
          if (!startNode || !startNode.flowMeta?.jober?.converter?.entity?.outputParams) {
            console.warn('[LoopNode] No start node found');
            setIsCreatingSubflow(false);
            return;
          }

          // 获取开始节点的输出参数作为子流程的输入参数
          const startOutputParams = startNode.flowMeta.jober.converter.entity.outputParams || [];

          // 构建 entity（这里简化处理，直接使用开始节点的输出）
          const entity = {};
          entity.inputParams = startOutputParams;

          // 构建输出参数（数组类型）
          const outputParams = {
            id: uuidv4(),
            name: 'result',
            type: 'Array',
            description: '循环输出结果',
            value: [],
          };
          entity.outputParams = [outputParams];

          // 生成 uniqueName
          const uniqueName = `LOOP_SUBFLOW_${appId}`;

          // 更新节点的 toolInfo
          handlePluginChange(
            entity,
            uniqueName,
            appData.name,
            [TOOL_TYPE.WATER_FLOW],
            appId,
            currentTenantId,
            appData.version || '1.0.0'
          );

          setIsCreatingSubflow(false);
        } else {
          console.error('[LoopNode] Failed to fetch subflow details:', responseData);
          setIsCreatingSubflow(false);
        }
      },
      (error) => {
        console.error('[LoopNode] Error fetching subflow details:', error);
        setIsCreatingSubflow(false);
      }
    );
  };

  /**
   * 获取技能详情信息
   */
  const getSkillInfo = () => {
    const uniqueName = toolInfo?.uniqueName;
    if (!uniqueName) {
      setCurrentToolOption(null);
      return;
    }

    if (!config?.urls?.toolListEndpoint) {
      return;
    }

    httpUtil.get(
      `${config.urls.toolListEndpoint}?uniqueNames=${uniqueName}`, 
      new Map(), 
      (jsonData) => {
        processToolData(jsonData.data);
      },
      () => {
        processToolData([]);
      },
    );

    const processToolData = (responseData) => {
      // 循环节点只需要一个工具，取第一个匹配项
      const matchedTool = responseData.find(item => item.uniqueName === uniqueName);
      
      if (matchedTool) {
        setCurrentToolOption({
          id: uuidv4(),
          name: matchedTool.name,
          tags: matchedTool.tags,
          version: matchedTool.version,
          value: matchedTool.uniqueName,
        });
      } else {
        // 若请求返回体中没有该 uniqueName 或请求失败，则从 toolInfo 中获取信息
        setCurrentToolOption(toolInfo ? {
          id: toolInfo.uniqueName,
          name: toolInfo.pluginName || '',
          tags: toolInfo.tags || [],
          version: toolInfo.version || '',
          value: toolInfo.uniqueName,
        } : null);
      }
    };
  };

  useEffect(() => {
    const uniqueName = toolInfo?.uniqueName;
    const endpoint = config?.urls?.toolListEndpoint;

    if (!uniqueName || !endpoint) {
      setCurrentToolOption(null);
      return;
    }

    if (lastRequestedNameRef.current === uniqueName) {
      return;
    }

    lastRequestedNameRef.current = uniqueName;
    getSkillInfo();
  }, [toolInfo?.uniqueName]);

  /**
   * 自动创建子流程的 useEffect
   * 当循环节点被拖出但没有选择工具时，自动创建子流程
   */
  useEffect(() => {
    const uniqueName = toolInfo?.uniqueName;
    const appId = toolInfo?.appId;

    // 如果已经有工具或者已经有 appId，就不再自动创建
    if (uniqueName || appId) {
      return;
    }

    // 确保配置存在
    if (!config?.urls?.toolListEndpoint) {
      return;
    }

    // 如果已经尝试过创建或正在创建，就不再触发
    if (hasTriedAutoCreateRef.current || isCreatingSubflow || creatingNodes.has(shape.id)) {
      return;
    }

    // 自动创建子流程
    autoCreateSubflow();
  }, [toolInfo?.uniqueName, toolInfo?.appId]); // 依赖 uniqueName 和 appId


  /**
   * 组装插件对象。
   */
  const plugin = {
    name: toolInfo?.pluginName ?? undefined,
    id: toolInfo?.uniqueName ?? undefined,
    appId: toolInfo?.appId ?? undefined,
    tenantId: toolInfo?.tenantId ?? undefined,
    version: toolInfo?.version ?? currentToolOption?.version ?? undefined,
  };

  return (<>
    <div>
      {args.length > 0 && <InvokeInput inputData={filterArgs} shapeStatus={shapeStatus} showRadio={true} radioValue={filterRadioValue} radioTitle={'chooseToBeLoopParam'} radioRuleMessage={'loopRadioIsRequired'}/>}
      <SkillForm plugin={plugin} data={outputData} handlePluginChange={handlePluginChange} handlePluginDelete={handlePluginDelete} disabled={shapeStatus.disabled}/>
      {outputData.length > 0 && <InvokeOutput outputData={outputData}/>}
    </div>
  </>);
};

LoopWrapper.propTypes = {
  shapeStatus: PropTypes.object,
};

export default LoopWrapper;