/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useState, useEffect } from 'react';
import { Drawer, Button, Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { setSpaClassName, getCookie } from '@/shared/utils/common';
import { QuestionCircleOutlined, CloseOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/store/hook';
import { useTranslation } from 'react-i18next';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import MarketItems from './market';
import { Input, Tabs } from 'antd';
import { Icons } from '@/components/icons';
import DeployMent from './deployment';
import { sourceTabs } from './helper';

/**
 * 应用插件页面
 *
 * @return {JSX.Element}
 * @constructor
 */
const Plugin = ({ compactInAppDev = false }: { compactInAppDev?: boolean }) => {
  const { t } = useTranslation();
  const { tab } = useParams<{ tab?: string }>();
  const history = useHistory();
  const location = useLocation();
  const readOnly = useAppSelector((state) => state.chatCommonStore.readOnly);
  const [open, setOpen] = useState(false);
  const [reload, setReload] = useState(false);
  const [searchKey, setSearchKey] = useState('');
  const [uploadSignal, setUploadSignal] = useState(0);
  const [workflowSignal, setWorkflowSignal] = useState(0);
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [statusKey, setStatusKey] = useState('all');
  const [statusLabel, setStatusLabel] = useState(t('all'));

  // 从URL参数初始化选中的tab
  useEffect(() => {
    // 检查是否需要选中工具流 tab（从发布页面跳转回来）
    const toolTab = sessionStorage.getItem('tool-selected-tab');
    if (toolTab === 'WATERFLOW') {
      setSelectedSource('WATERFLOW');
      history.replace('/tools/WATERFLOW');
      sessionStorage.removeItem('tool-selected-tab'); // 清除标记
      return;
    }

    // 从URL参数读取tab
    if (tab) {
      const validTab = sourceTabs.find(item => item.key === tab.toUpperCase());
      if (validTab) {
        setSelectedSource(validTab.key);
      } else {
        // 如果URL参数无效，重定向到ALL
        history.replace('/tools/ALL');
      }
    } else {
      // 如果没有tab参数，默认选中ALL
      setSelectedSource('ALL');
    }
  }, [tab, history, location.pathname]);

  // 下拉菜单选项
  const items = [
    {
      label: t('all'),
      key: 'all',
    },
    {
      label: t('active'),
      key: 'active',
    },
    {
      label: t('inactive'),
      key: 'inactive',
    },
  ];

  // 下拉菜单点击处理
  const clickItem = (e: any) => {
    const { key } = e;
    const label = items.find(item => item.key === key)?.label || t('all');
    setStatusKey(key);
    setStatusLabel(label);
  };

  const onClose = () => {
    setOpen(false);
  };
  const confirm = () => {
    setOpen(false);
    setReload(!reload);
  }
  // 部署时获取列表
  const setDeployOpen = () => {
    setOpen(true);
    setReload(!reload);
  }
  // 联机帮助
  const onlineHelp = () => {
    window.open(`${window.parent.location.origin}/help${getCookie('locale').toLocaleLowerCase() === 'en-us' ? '/en' : '/zh'}/application_plug-in.html`, '_blank');
  }
  return (
    <div className={setSpaClassName('apps_root')}>
      <div className='apps_header'>
        <div className='apps_title'>{t('pluginManagement')}</div>
        <div className='apps_header_right'>
          { process.env.PACKAGE_MODE === 'spa' && <QuestionCircleOutlined onClick={onlineHelp} />}
        </div>
      </div>
      <div className='apps_main'>
        <div className='apps-haeader-content'>
        <div className='tabs'>
          {sourceTabs.map((item) => {
            return (
              <span
                className={selectedSource === item.key ? 'tab-active app-card-tab' : 'app-card-tab'}
                key={item.key}
                onClick={() => {
                  setSelectedSource(item.key);
                  history.push(`/tools/${item.key}`);
                }}>
                {item.label}
              </span>
            )
          })}
        </div>
        </div>
        <div>
          <MarketItems
            reload={reload}
            readOnly={readOnly}
            hideHeader={compactInAppDev}
            keyword={searchKey}
            externalUploadTrigger={uploadSignal}
            externalWorkflowTrigger={workflowSignal}
            selectedSource={selectedSource}
            onChangeSelected={(key: string) => setSelectedSource(key)}
            onDeploy={setDeployOpen}
          />
        </div>
      </div>
      <Drawer
        title={t('pluginDeploying')}
        width={900}
        onClose={onClose}
        closeIcon={false}
        open={open}
        destroyOnClose
        extra={
          <CloseOutlined onClick={() => setOpen(false)} />
        }
        footer={null}
      >
        <DeployMent cancle={() => setOpen(false)} confirm={confirm} />
      </Drawer>
    </div>
  )
}
export default Plugin;
