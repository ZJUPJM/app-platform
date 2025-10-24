/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useState, useEffect, useRef } from 'react';
import { Tabs, Input, Tag, Button, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Pagination from '@/components/pagination/index';
import PluginCard from '@/components/plugin-card';
import WorkflowCard from '@/components/plugin-card/workFlowCard';
import { getPlugins, getPluginWaterFlow } from '@/shared/http/plugin';
import { Icons } from '@/components/icons';
import { PluginCardTypeE, sourceTabs } from './helper';
import { debounce, queryAppCategories } from '@/shared/utils/common';
import { Message } from '@/shared/utils/message';
import UploadToolDrawer from './upload/uploadTool';
import EmptyItem from '@/components/empty/empty-item';
import MCPServiceManager from './components/MCPServiceManager';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';
import { useHistory } from 'react-router-dom';
import CreateWorkfowDrawer from './upload/createWorkflow';
import EditModal from '@/pages/components/edit-modal';
import CreateImg from '@/assets/images/ai/create.png';
import TemplateImg from '@/assets/images/ai/create2.png';
import ImportImg from '@/assets/images/ai/import.png';
import './styles/market.scss';

const MarketItems = ({ reload, readOnly, hideHeader = false, keyword, externalUploadTrigger, externalWorkflowTrigger, selectedSource: selectedSourceProp, onChangeSelected, onDeploy }: { reload: any, readOnly: boolean, hideHeader?: boolean, keyword?: string, externalUploadTrigger?: number, externalWorkflowTrigger?: number, selectedSource?: string, onChangeSelected?: (key: string) => void, onDeploy?: () => void }) => {
  const { t } = useTranslation();
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [name, setName] = useState('');
  const [selectedSource, setSelectedSource] = useState(selectedSourceProp || sourceTabs?.[0]?.key);
  const [pluginData, setPluginData] = useState([]);
  const [isOpenPlugin, setIsOpenPlugin] = useState(0);
  const [loading, setLoading] = useState(false);
  const tenantId = useAppSelector((state) => state.appStore.tenantId);
  const isAutoOpen = useAppSelector((state) => state.commonStore.isAutoOpen);
  const history = useHistory().push;
  const [openCreateDrawer, setOpenCreateDrawer] = useState(0);
  const currentUser = localStorage.getItem('currentUser') || '';
  const modalRef = useRef<any>();
  const [modalInfo, setModalInfo] = useState({});
  const [tabs, setTabs] = useState([]);

  useEffect(() => {
    if (selectedSourceProp && selectedSourceProp !== selectedSource) {
      setSelectedSource(selectedSourceProp);
    }
  }, [selectedSourceProp]);

  useEffect(() => {
    if (selectedSource === 'WATERFLOW') {
      getWaterFlowList();
      return
    }
    getPluginList();
  }, [selectedSource, name, pageNum, pageSize, reload]);

  // 外部搜索关键字联动
  useEffect(() => {
    if (typeof keyword === 'string' && keyword !== name) {
      setPageNum(1);
      setName(keyword);
    }
  }, [keyword]);

  // 获取插件列表
  const getPluginList = () => {
    let regex = /&/g;
    let result = name.match(regex);
    if (result && result.length) {
      setPluginData([]);
      setTotal(0);
      return;
    }
    let params: any = {
      name,
      pageNum: pageNum,
      pageSize
    }
    if (selectedSource === 'ALL') {
      // 全部：不设置任何筛选条件，显示所有插件
    } else if (selectedSource === 'APP') {
      params.excludeTags = selectedSource;
    } else if (selectedSource === 'MINE') {
      params.creator = currentUser;
      params.isBuiltin = true;
    } else if (selectedSource === 'CUSTOM') {
      // 自定义插件：在全部基础上过滤掉Http和MCP
      params.excludeTags = 'HTTP';
    } else {
      params.includeTags = selectedSource;
    }
    setLoading(true);
    const excludeTags = selectedSource === 'CUSTOM' ? 'excludeTags=HTTP&excludeTags=MCP' : '';
    getPlugins(params, excludeTags).then(({ data, total }) => {
      setTotal(total);
      setPluginData(data || []);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };
  // 获取工具列表
  const getWaterFlowList = () => {
    getPluginWaterFlow(tenantId, {
      offset: (pageNum - 1) * pageSize,
      limit: pageSize,
      type: 'waterFlow',
      name,
    }).then(({ data }) => {
      const { results, range } = data;
      const list = results || [];
      list.forEach(item => {
        item.mapType = 'waterFlow';
      })
      setTotal(range.total || 0);
      setPluginData(list);
    }).catch(() => {
      setTotal(0);
      setPluginData([]);
    });
  }
  // 分页
  const selectPage = (curPage: number, curPageSize: number) => {
    if (pageNum !== curPage) {
      setPageNum(curPage);
    }
    if (pageSize !== curPageSize) {
      setPageSize(curPageSize);
    }
  };
  // 名称搜索
  const filterByName = (value: string) => {
    if (value !== name) {
      setPageNum(1);
      setName(value);
    }
  };
  const handleSearch = debounce(filterByName, 1000);
  // 下拉

  useEffect(() => {
    if (isAutoOpen) {
      setIsOpenPlugin(Date.now());
    }
  }, [isAutoOpen]);

  // 外部触发上传抽屉
  useEffect(() => {
    if (externalUploadTrigger) {
      setIsOpenPlugin(externalUploadTrigger);
    }
  }, [externalUploadTrigger]);

  // 初始化获取应用分类
  useEffect(() => {
    const fetchTab = async () => {
      const newTab = await queryAppCategories(tenantId, false);
      setTabs(newTab);
    };
    fetchTab();
  }, []);

  // tabs切换回调
  const tabsOnChange = (key:string) =>{
    onChangeSelected ? onChangeSelected(key) : setSelectedSource(key);
    setPageNum(1);
  }

  // 创建Http工具
  const createHttpTool = () => {
    history({ pathname: '/http' });
  };

  // 创建MCP工具
  const createMCPTool = () => {
    // 切换到MCP标签页
    tabsOnChange('MCP');
  };

  // 创建自定义插件
  const createCustomPlugin = () => {
    setIsOpenPlugin(Date.now());
  };

  // 创建工具流
  const createWorkflow = () => {
    setModalInfo(() => {
      modalRef.current.showModal();
      return {
        name: '',
        attributes: {
          description: '',
          icon: '',
          app_type: tabs?.[1]?.key,
        },
      };
    });
  };

  // 应用添加成功回调
  function addAippCallBack(appId: string, aippId: string, appCategory?: string) {
    if (appCategory && appCategory === 'workflow') {
      history({
        pathname: `/app-develop/${tenantId}/add-flow/${appId}`,
        search: '?type=workFlow',
      });
      return;
    }
  }

  // 部署插件
  const deployPlugins = () => {
    if (onDeploy) {
      onDeploy();
    } else {
      Message({ type: 'info', content: '部署功能未配置' });
    }
  };
  
  return (
    <div className='aui-block market-block'>
      {!hideHeader && (
        <div className='market-search'>
          <Input
            showCount
            maxLength={20}
            placeholder={t('search')}
            className='market-input'
            onChange={(e) => handleSearch(e.target.value)}
            prefix={<Icons.search color={'rgb(230, 230, 230)'} />}
            defaultValue={name}
          />
        </div>
      )}
      <UploadToolDrawer openSignal={isOpenPlugin} refreshPluginList={getPluginList} />
      {!hideHeader && (
        <Tabs
          items={sourceTabs}
          activeKey={selectedSource}
          onChange={(key: string) => tabsOnChange(key)}
          style={{ width: '100%', textAlign: 'center', display: 'none'}}
          centered={true}
        />
      )}
      <Spin spinning={loading}>
        {/* 统一的卡片列表管理 */}
        {selectedSource === 'MCP' ? (
          /* MCP标签页 - 使用MCPServiceManager组件 */
          <MCPServiceManager />
        ) : (selectedSource === 'HTTP' || selectedSource === 'CUSTOM' || selectedSource === 'WATERFLOW') ? (
          <>
            {/* 操作栏 - 只在自定义插件时显示部署按钮 */}
            {selectedSource === 'CUSTOM' && !readOnly && (
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <Button type='primary' onClick={deployPlugins}>{t('deploying')}</Button>
              </div>
            )}
            
            {/* 统一的卡片列表 */}
            <div className='market-card' >
              {/* 添加按钮弱卡片形式 - 整张卡片可点击 */}
              {!readOnly && (
                <div 
                  className='card_box card_box_add create-card' 
                  onClick={
                    selectedSource === 'HTTP' ? createHttpTool : 
                    selectedSource === 'CUSTOM' ? createCustomPlugin : 
                    createWorkflow
                  }
                >
                  <div className='create-plus'>+</div>
                  <div className='create-text'>
                    {selectedSource === 'HTTP' ? '添加Http工具' : 
                     selectedSource === 'CUSTOM' ? '添加自定义插件' : 
                     '创建工具流'}
                  </div>
                </div>
              )}
              
              {pluginData && pluginData.length > 0 && pluginData.map((card: any) => (
                card.mapType === 'waterFlow' ?
                  <WorkflowCard key={card.uniqueName} pluginData={card} type='plugin' getWaterFlowList={getWaterFlowList} /> :
                  <PluginCard
                    key={card.pluginId}
                    getPluginList={getPluginList}
                    pluginData={card}
                    cardType={PluginCardTypeE.MARKET}
                    pluginId={card.pluginId}
                    readOnly={readOnly}
                    pluginRoot={true}
                    showTestButton={false} // 不显示测试按钮
                  />
              ))}
            </div>
            {(!pluginData || pluginData.length === 0) && readOnly && (
              <div className='market-empty'>
                <EmptyItem />
              </div>
            )}
            <div className='market-page'>
              <Pagination
                total={total}
                current={pageNum}
                onChange={selectPage}
                pageSizeOptions={[8, 16, 32, 60]}
                pageSize={pageSize} />
            </div>
          </>
        ) : (
          <>
            {/* 全部Tab页 - 保持原有的卡片展示 */}
            <div className='market-card' >
              {pluginData && pluginData.length > 0 && pluginData.map((card: any) => (
                card.mapType === 'waterFlow' ?
                  <WorkflowCard key={card.uniqueName} pluginData={card} type='plugin' getWaterFlowList={getWaterFlowList} /> :
                  <PluginCard
                    key={card.pluginId}
                    getPluginList={getPluginList}
                    pluginData={card}
                    cardType={PluginCardTypeE.MARKET}
                    pluginId={card.pluginId}
                    readOnly={readOnly}
                    pluginRoot={true}
                  />
              ))}
            </div>
            {(!pluginData || pluginData.length === 0) && readOnly && (
              <div className='market-empty'>
                <EmptyItem />
              </div>
            )}
            <div className='market-page'>
              <Pagination
                total={total}
                current={pageNum}
                onChange={selectPage}
                pageSizeOptions={[8, 16, 32, 60]}
                pageSize={pageSize} />
            </div>
          </>
        )}
      </Spin>
      <CreateWorkfowDrawer openSignal={openCreateDrawer} />
      <EditModal
        type='add'
        modalRef={modalRef}
        appInfo={modalInfo}
        addAippCallBack={addAippCallBack}
        fixedWorkflow={true}
      />
    </div>
  );
};
export default MarketItems;
