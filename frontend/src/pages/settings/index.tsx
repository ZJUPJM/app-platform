/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useEffect, useState } from 'react';
import { Tabs } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import ModelConfig from './model-config';
import KnowledgeConfig from './knowledge-config';
import './style.scss';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('provider');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    const tab = params.get('tab');

    if (action === 'showSettings') {
      setVisible(true);
      if (tab) {
        setActiveTab(tab);
      }
    } else {
      setVisible(false);
    }
  }, [location.search]);

  const handleClose = () => {
    const params = new URLSearchParams(location.search);
    params.delete('action');
    params.delete('tab');

    const newSearch = params.toString();
    const newPath = location.pathname + (newSearch ? `?${newSearch}` : '');

    history.push(newPath);
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    const params = new URLSearchParams(location.search);
    params.set('tab', key);
    history.push(`${location.pathname}?${params.toString()}`);
  };

  const tabItems = [
    {
      key: 'provider',
      label: t('modelConfig'),
      children: <ModelConfig />,
    },
    {
      key: 'knowledge',
      label: t('knowledgeConfig'),
      children: <KnowledgeConfig />,
    },
  ];

  if (!visible) return null;

  return (
    <div className="settings-fullscreen-overlay">
      <div className="settings-container">
        <div className="settings-header">
          <h1 className="settings-title">{t('settings')}</h1>
          <button className="settings-close-btn" onClick={handleClose}>
            <CloseOutlined />
          </button>
        </div>
        <div className="settings-content">
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={tabItems}
            className="settings-tabs"
            size="large"
            tabPosition="left"
          />
        </div>
      </div>
    </div>
  );
};

export default Settings;
