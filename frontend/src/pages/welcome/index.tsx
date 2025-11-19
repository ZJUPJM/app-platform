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
            <img src="https://modelengine-ai.net/assets/logo.302a9865.png" alt="品牌标识" className="brand-img" />
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
              <span>文档</span>
            </a>
            <Button type="primary" className="btn-get-started" onClick={() => history.push('/home')}>
              <span className="icon bolt" aria-hidden="true"></span>
              立即体验
            </Button>
          </div>
        </div>
      </Header>
      <Content className="welcome-content">
        <div className="hero">
          <h1 className="hero-title">按你的方式构建 <span className="hero-em">AI 应用</span></h1>
          <p className="hero-sub">使用自然语言、可视化流程或代码快速打造智能体和AI应用，并借助内置工具完成调试、部署、监控与评测等端到端生命周期管理</p>
          <div className="hero-cta">
            <Button type="primary" size="large" className="btn-start" onClick={() => history.push('/home')}>
              <span className="icon bolt" aria-hidden="true"></span>
              开始构建
            </Button>
            <a href="https://github.com/ModelEngine-Group/app-platform#readme" target="_blank" rel="noreferrer">
              <Button size="large" className="btn-docs">查看文档</Button>
            </a>
          </div>
        </div>

        <div className="sections">
          <h2 className="section-title">三种创建方式</h2>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card bordered={false} className="card-dark">
                <div className="card-icon chat">
                  <svg className="h-12 w-12 text-primary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                </div>
                <div className="card-title">自然语言</div>
                <div className="card-sub">NL2Agent</div>
                <div className="card-desc">适用于动态变化、开放性强的任务场景，能够自主规划、多步决策并调用外部工具完成目标。</div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card bordered={false} className="card-dark">
                <div className="card-icon workflow">
                  <svg className="h-12 w-12 text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.5" stroke-width="1.5"></circle><circle cx="18" cy="6" r="2.5" stroke-width="1.5"></circle><circle cx="18" cy="18" r="2.5" stroke-width="1.5"></circle><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.5 11l6.5-4M8.5 13l6.5 4"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 7.5l1.5-.5 .5 1.5M14 16.5l1.5.5.5-1.5"></path></svg>
                </div>
                <div className="card-title">可视化流程</div>
                <div className="card-sub">低代码构建器</div>
                <div className="card-desc">适用于标准化、确定性强的业务流程，对步骤可控性、可复现性与合规性要求高的场景。</div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card bordered={false} className="card-dark">
                <div className="card-icon code">
                  <svg className="h-12 w-12 text-accent mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                </div>
                <div className="card-title">代码框架</div>
                <div className="card-sub">FEL 编程</div>
                <div className="card-desc">适合用于多步骤、复杂任务处理，以及已验证市场可行、正准备走向生产化的应用场景，特别是在需要高性能与高可靠性的任务编排场景。</div>
              </Card>
            </Col>
          </Row>

          <h2 className="section-title mt">核心能力</h2>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card bordered={false} className="card-dark">
                <div className="card-title">调试与监控</div>
                <div className="card-desc">提供实时调试与监控工具，用于追踪应用性能和行为，方便快速定位解决问题。</div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card bordered={false} className="card-dark">
                <div className="card-title">知识库</div>
                <div className="card-desc">提供内置的 ModelEngine 向量化知识库，同时支持接入三方知识库，如百度千帆知识库，也可以无缝接入用户自定义的知识库等。</div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card bordered={false} className="card-dark">
                <div className="card-title">评测体系</div>
                <div className="card-desc">提供全面的评价体系，用于衡量应用效果并指导持续迭代，提升应用质量与用户体验。</div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card bordered={false} className="card-dark">
                <div className="card-title">自定义交互</div>
                <div className="card-desc">突破传统聊天界面限制，支持将表单输入、数据图表等UI组件灵活嵌入对话流中。构建面向任务的操作界面，实现真正以用户为中心的交互体验。</div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card bordered={false} className="card-dark">
                <div className="card-title">外部模型</div>
                <div className="card-desc">内置主流大模型适配层，亦可通过标准化 API 连接私有模型与第三方推理服务。实现灵活的模型选择与切换。</div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card bordered={false} className="card-dark">
                <div className="card-title">流程编排</div>
                <div className="card-desc">通过拖拽式可视化编辑器，轻松编排设计复杂的人工智能工作流。</div>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
};

export default WelcomePage;