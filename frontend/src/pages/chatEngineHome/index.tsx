/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useEffect, useState } from 'react';
import { Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import CommonChat from '../chatPreview/chatComminPage';
import InfoModal from './components/InfoModal';
import { getAppInfo } from '@/shared/http/aipp';
import { getUserModels } from '@/shared/http/modelConfig';
import { useAppDispatch } from '@/store/hook';
import { setHistorySwitch, setIsDebug } from '@/store/common/common';
import { setAppId, setAippId, setAppInfo } from '@/store/appInfo/appInfo';
import { HOME_APP_ID, TENANT_ID } from '../chatPreview/components/send-editor/common/config';
import { findConfigValue } from '@/shared/utils/common';
import { useHistory, useLocation } from 'react-router-dom';
import './index.scss'

const ChatRunning = () => {
  const dispatch = useAppDispatch();
  const history = useHistory();
  const location = useLocation();
  const [hasModels, setHasModels] = useState<boolean>(true);
  const [isCheckingModels, setIsCheckingModels] = useState<boolean>(true);

  // 检查系统是否有模型
  const checkModels = async () => {
    try {
      setIsCheckingModels(true);
      const res: any = await getUserModels(TENANT_ID);
      if (res.code === 0) {
        setHasModels(res.data && res.data.length > 0);
      } else {
        setHasModels(false);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      setHasModels(false);
    } finally {
      setIsCheckingModels(false);
    }
  };

  // 打开模型配置页面
  const handleOpenModelConfig = () => {
    const params = new URLSearchParams(location.search);
    params.set('action', 'showSettings');
    params.set('tab', 'provider');
    history.push(`${location.pathname}?${params.toString()}`);
  };

  const getAppDetails= async ()=>{
    const res = await getAppInfo(TENANT_ID, HOME_APP_ID);
    if (res.code === 0) {
      const appInfo = res.data;
      appInfo.notShowHistory = false;
      dispatch(setAppInfo(appInfo));
      dispatch(setAippId(appInfo.aippId));
      dispatch(setAppId(appInfo.id));
      const memoryItem = findConfigValue(appInfo, 'memory');
      dispatch(setHistorySwitch(memoryItem?.type !==  'NotUseMemory'));
    }
  }

  useEffect(()=>{
    getAppDetails();
    dispatch(setIsDebug(false));
    checkModels();

    // 监听模型刷新事件
    const handleRefreshModels = () => {
      checkModels();
    };
    window.addEventListener('refreshModels', handleRefreshModels);

    return () => {
      dispatch(setAppInfo({}));
      dispatch(setAippId(''));
      dispatch(setAppId(''));
      window.removeEventListener('refreshModels', handleRefreshModels);
    }
  },[]);

  // 判断是否应该显示提示条：只在纯 /home 路径时显示，有 settings 参数时不显示
  const shouldShowAlert = !isCheckingModels && !hasModels && !location.search;

  return (
    <div className='chat-engine-container'>
      {/* {shouldShowAlert && (
        <div className='model-config-notification'>
          <div className='notification-card'>
            <div className='notification-icon'>
              <SettingOutlined />
            </div>
            <div className='notification-content'>
              <div className='notification-title'>系统模型尚未配置</div>
              <div className='notification-description'>首页对话功能暂不可用，请先配置模型</div>
            </div>
            <Button
              type="primary"
              size="middle"
              icon={<SettingOutlined />}
              onClick={handleOpenModelConfig}
              className='notification-button'
            >
              立即配置
            </Button>
          </div>
        </div>
      )} */}
      <CommonChat />
      <InfoModal />
    </div>
);
  }


export default ChatRunning;
