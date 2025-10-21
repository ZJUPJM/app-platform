/*---------------------------------------------------------------------------------------------*
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Button, Layout, Menu, Row, Col, Card, Space } from 'antd';
import type { MenuProps } from 'antd';
import { Link, useHistory } from 'react-router-dom';
import AidoIcon from '../../assets/images/aido-icon.png';

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
  const history = useHistory();
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
            <img src="https://modelengine-ai.net/assets/logo.302a9865.png" alt="Brand Logo" className="brand-img" />
            <img src={AidoIcon} alt="AiDo" className="logo-img" />
          </div>
          {/* 顶部右侧操作：GitHub / Documentation / Get Started */}
          <div className="top-actions">
            <a className="link-action" href="https://github.com/ModelEngine-Group/app-platform" target="_blank" rel="noreferrer">
              <svg className="icon-svg" viewBox="0 0 16 16" aria-hidden="true">
                <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.11 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.91.08 2.11.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              <span>GitHub</span>
            </a>
            <a className="link-action" href="https://github.com/ModelEngine-Group/app-platform#readme" target="_blank" rel="noreferrer">
              <span className="icon docs" aria-hidden="true"></span>
              <span>Documentation</span>
            </a>
            <Button type="primary" className="btn-get-started" onClick={() => history.push('/home')}>
              <span className="icon bolt" aria-hidden="true"></span>
              Get Started
            </Button>
          </div>
        </div>
      </Header>
      <Content className="welcome-content">
        <div className="hero">
          <h1 className="hero-title">Build AI Applications <span className="hero-em">Your Way</span></h1>
          <p className="hero-sub">Create intelligent applications with natural language, visual workflows, or code. Debug, monitor, and evaluate with powerful built-in tools.</p>
          <div className="hero-cta">
            <Button type="primary" size="large" className="btn-start" onClick={() => history.push('/home')}>
              <span className="icon bolt" aria-hidden="true"></span>
              Start Building
            </Button>
            <a href="https://github.com/ModelEngine-Group/app-platform#readme" target="_blank" rel="noreferrer">
              <Button size="large" className="btn-docs">View Docs</Button>
            </a>
          </div>
        </div>

        <div className="sections">
          <h2 className="section-title">Three Ways to Create</h2>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card bordered={false} className="card-dark">
                <div className="card-icon chat">
                  <svg className="h-12 w-12 text-primary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                </div>
                <div className="card-title">Natural Language</div>
                <div className="card-sub">NL2Agent</div>
                <div className="card-desc">Describe your application in plain language and let AI transform your ideas into working applications instantly.</div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card bordered={false} className="card-dark">
                <div className="card-icon workflow">
                  <svg className="h-12 w-12 text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.5" stroke-width="1.5"></circle><circle cx="18" cy="6" r="2.5" stroke-width="1.5"></circle><circle cx="18" cy="18" r="2.5" stroke-width="1.5"></circle><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.5 11l6.5-4M8.5 13l6.5 4"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 7.5l1.5-.5 .5 1.5M14 16.5l1.5.5.5-1.5"></path></svg>
                </div>
                <div className="card-title">Visual Workflow</div>
                <div className="card-sub">Low-Code Builder</div>
                <div className="card-desc">Drag and drop components to design AI workflows visually. Perfect for rapid prototyping and iteration.</div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card bordered={false} className="card-dark">
                <div className="card-icon code">
                  <svg className="h-12 w-12 text-accent mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                </div>
                <div className="card-title">Code Framework</div>
                <div className="card-sub">FEL Programming</div>
                <div className="card-desc">Full programmatic control with our powerful framework. Build complex AI applications with complete flexibility.</div>
              </Card>
            </Col>
          </Row>

          <h2 className="section-title mt">Powerful Features</h2>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card bordered={false} className="card-dark">
                <div className="card-title">Debug & Monitor</div>
                <div className="card-desc">Real-time debugging and monitoring tools to track application performance and behavior.</div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card bordered={false} className="card-dark">
                <div className="card-title">Knowledge Base</div>
                <div className="card-desc">Connect your own knowledge bases and enterprise data sources seamlessly.</div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card bordered={false} className="card-dark">
                <div className="card-title">Evaluation Tools</div>
                <div className="card-desc">Comprehensive evaluation framework to measure and improve application quality.</div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card bordered={false} className="card-dark">
                <div className="card-title">Custom Interactions</div>
                <div className="card-desc">Design custom interaction patterns beyond traditional chat interfaces.</div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card bordered={false} className="card-dark">
                <div className="card-title">External Models</div>
                <div className="card-desc">Integrate with any external large language model provider for maximum flexibility.</div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card bordered={false} className="card-dark">
                <div className="card-title">Workflow Orchestration</div>
                <div className="card-desc">Orchestrate complex AI workflows with ease using our visual builder.</div>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
};

export default WelcomePage;