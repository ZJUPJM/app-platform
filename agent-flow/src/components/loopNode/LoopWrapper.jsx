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