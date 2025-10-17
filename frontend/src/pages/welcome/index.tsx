/*---------------------------------------------------------------------------------------------*
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Button, Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './index.less';

const { Header, Content } = Layout;

/**
 * 欢迎页面组件
 *
 * @return {JSX.Element}
 * @constructor
 */
const WelcomePage: React.FC = () => {
  const { t } = useTranslation();

  // 导航菜单项
  const menuItems: MenuProps['items'] = [
    {
      key: 'explore',
      label: (
        <Link to="/app">{t('explore')}</Link>
      ),
    },
    {
      key: 'dev-platform',
      label: (
        <Link to="/app-develop">{t('devPlatform')}</Link>
      ),
    },
    {
      key: 'docs',
      label: (
        <a href="#" target="_blank" rel="noopener noreferrer">{t('docs')}</a>
      ),
    },
  ];

  return (
    <Layout className="welcome-layout">
      <Header className="welcome-header">
        <div className="welcome-header-content">
          <div className="welcome-logo">
            <span className="logo-text">Aipp</span>
          </div>
          <Menu 
            mode="horizontal" 
            items={menuItems} 
            className="welcome-menu"
          />
          <div className="welcome-header-actions">
            <Button 
              type="text" 
              className="login-button"
            >
              {t('login')}
            </Button>
            <Button 
              type="primary" 
              className="try-now-button header-try-now"
            >
              {t('tryNow')}
            </Button>
          </div>
        </div>
      </Header>
      <Content className="welcome-content">
        <div className="welcome-main">
          <div className="welcome-text-section">
            <h1 className="welcome-title">{t('yourAiAppFactory')}</h1>
            <p className="welcome-subtitle">{t('connectAiWithEase')}</p>
            <p className="welcome-subtitle">{t('buildLimitlessPossibilities')}</p>
            <Button 
              type="primary" 
              size="large" 
              className="try-now-button main-try-now"
            >
              {t('tryNow')}
            </Button>
          </div>
          <div className="welcome-preview-section">
            <div className="app-preview">
              <div className="preview-header">
                <span className="app-name">Aipp</span>
                <div className="preview-actions">
                  <span className="preview-dot"></span>
                  <span className="preview-dot"></span>
                  <span className="preview-dot"></span>
                </div>
              </div>
              <div className="preview-content">
                <div className="ai-flow-diagram">
                  {/* AI流程示意图 - 这里使用简单的div和样式表示 */}
                  <div className="flow-node node-1">
                    <span className="node-label">Link</span>
                  </div>
                  <div className="flow-node node-2">
                    <span className="node-label">Agent</span>
                  </div>
                  <div className="flow-node node-3">
                    <span className="node-label">Knowledge</span>
                  </div>
                  <div className="flow-node node-4">
                    <span className="node-label">Tool</span>
                  </div>
                  <div className="flow-connection"></div>
                  <div className="flow-center"></div>
                </div>
                <div className="chat-preview">
                  <div className="chat-header">
                    <span className="chat-title">Live Preview</span>
                  </div>
                  <div className="chat-messages">
                    <div className="message user-message">
                      <span className="message-text">I need help with...</span>
                    </div>
                    <div className="message bot-message">
                      <span className="message-text">I'm analyzing your request...</span>
                    </div>
                  </div>
                </div>
                <div className="stats-preview">
                  <div className="stats-header">
                    <span className="stats-title">Knowledge Results Example</span>
                  </div>
                  <div className="stats-chart">
                    {/* 简单的图表表示 */}
                    <div className="chart-bar"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default WelcomePage;