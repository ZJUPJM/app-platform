/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {useDataContext, useDispatch, useShapeContext} from '@/components/DefaultRoot.jsx';
import {ParallelTopBar} from '@/components/parallelNode/ParallelTopBar.jsx';
import {ParallelPluginItem} from '@/components/parallelNode/ParallelPluginItem.jsx';
import {Form} from 'antd';
import {useTranslation} from 'react-i18next';
import PropTypes from 'prop-types';
import {useEffect, useMemo, useRef, useState} from 'react';
import {OUTPUT, OUTPUT_NAME, TOOL_CALLS} from '@/components/parallelNode/consts.js';
import httpUtil from '@/components/util/httpUtil.jsx';
import {v4 as uuidv4} from 'uuid';

/**
 * 并行节点Wrapper
 *
 * @param shapeStatus 图形状态
 * @returns {JSX.Element} 循环节点Wrapper的DOM
 */
const ParallelWrapper = ({shapeStatus}) => {
  const shape = useShapeContext();
  const data = useDataContext();
  const dispatch = useDispatch();
  const {t} = useTranslation();
  
  // 状态管理：存储所有工具的版本信息 Map<uniqueName, toolOption>
  const [toolOptionsMap, setToolOptionsMap] = useState(new Map());
  const lastRequestedNamesRef = useRef(new Set());

  const tools = useMemo(
    () => data?.inputParams?.find(value => value.name === TOOL_CALLS)?.value ?? [],
    [data?.inputParams]
  );
  
  let config;
  if (!shape || !shape.graph || !shape.graph.configs) {
    // 没关系，继续.
  } else {
    config = shape.graph.configs.find(node => node.node === 'parallelNodeState');
  }

  useEffect(() => {
    const output = data?.outputParams?.find(item => item.name === OUTPUT) ?? {};
    shape.page.registerObservable({
      nodeId: shape.id,
      observableId: output.id,
      value: output.name,
      type: output.type,
      parentId: null,
    });
  }, [data?.outputParams]);

  /**
   * 获取工具详情信息
   */
  const getToolsInfo = (uniqueNameList) => {
    if (!uniqueNameList || uniqueNameList.length === 0) {
      return;
    }
    
    if (!config?.urls?.toolListEndpoint) {
      return;
    }

    const urlSuffix = uniqueNameList.map(uniqueName => `uniqueNames=${uniqueName}`).join('&');
    httpUtil.get(
      `${config.urls.toolListEndpoint}?${urlSuffix}`,
      new Map(),
      (jsonData) => {
        processToolData(jsonData.data, uniqueNameList);
      },
      () => {
        processToolData([], uniqueNameList);
      },
    );

    const processToolData = (responseData, requestedNames) => {
      const responseMap = new Map(responseData.map(item => [item.uniqueName, item]));
      const newToolOptionsMap = new Map(toolOptionsMap);

      requestedNames.forEach(uniqueName => {
        if (responseMap.has(uniqueName)) {
          const item = responseMap.get(uniqueName);
          newToolOptionsMap.set(uniqueName, {
            id: uuidv4(),
            name: item.name,
            tags: item.tags,
            version: item.version,
            value: item.uniqueName,
          });
        } else {
          // 如果接口没有返回，从 tools 中获取已有信息作为 fallback
          const toolInfo = tools.find(tool => {
            const toolUniqueName = tool?.value?.find(item => item.name === 'uniqueName')?.value;
            return toolUniqueName === uniqueName;
          });
          
          if (toolInfo) {
            const pluginName = toolInfo?.value?.find(item => item.name === 'pluginName')?.value;
            const version = toolInfo?.value?.find(item => item.name === 'version')?.value;
            const tags = toolInfo?.value?.find(item => item.name === 'tags')?.value;
            
            newToolOptionsMap.set(uniqueName, {
              id: uniqueName,
              name: pluginName || '',
              tags: tags || [],
              version: version || '',
              value: uniqueName,
            });
          }
        }
      });

      setToolOptionsMap(newToolOptionsMap);
    };
  };

  // 监听 tools 变化，获取所有工具的详情
  useEffect(() => {
    const uniqueNameList = tools
      .map(tool => tool?.value?.find(item => item.name === 'uniqueName')?.value)
      .filter(Boolean); // 过滤掉 undefined/null

    if (uniqueNameList.length === 0) {
      setToolOptionsMap(new Map());
      lastRequestedNamesRef.current = new Set();
      return;
    }

    // 检查是否有新的 uniqueName 需要请求
    const newNames = uniqueNameList.filter(name => !lastRequestedNamesRef.current.has(name));
    
    if (newNames.length > 0) {
      // 更新已请求列表
      newNames.forEach(name => lastRequestedNamesRef.current.add(name));
      // 请求新的工具信息
      getToolsInfo(newNames);
    }
  }, [tools]);

  const handlePluginAdd = (entity, uniqueName, name, tags, appId, tenantId, version) => {
    dispatch({
      type: 'addPluginByMetaData',
      entity: entity,
      uniqueName: uniqueName,
      pluginName: name,
      tags: tags,
      appId: appId,
      tenantId: tenantId,
      version: version
    });
  };

  const handlePluginDelete = (deletePluginId, outputName) => {
    dispatch({
      type: 'deletePlugin', id: deletePluginId, outputName: outputName,
    });
  };

  return (<>
    <div>
      <ParallelTopBar handlePluginAdd={handlePluginAdd} disabled={shapeStatus.disabled}/>
      <Form.Item
        name={`form-${shape.id}`}
        rules={[
          {
            validator: () => {
              if (tools.length < 1) {
                return Promise.reject(new Error(t('pluginCannotBeEmpty')));
              }
              return Promise.resolve();
            },
          },
        ]}
        validateTrigger="onBlur"
      >
        {tools.map((tool) => {
          const uniqueName = tool?.value?.find(item => item.name === 'uniqueName')?.value;
          const toolOption = toolOptionsMap.get(uniqueName);
          return (
            <ParallelPluginItem 
              key={tool?.value?.find(item => item.name === OUTPUT_NAME)?.value ?? ''} 
              plugin={tool} 
              toolOption={toolOption}
              handlePluginDelete={handlePluginDelete} 
              shapeStatus={shapeStatus}
            />
          );
        })}
      </Form.Item>
    </div>
  </>);
};

ParallelWrapper.propTypes = {
  shapeStatus: PropTypes.object,
};

export default ParallelWrapper;