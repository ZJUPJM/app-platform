/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Modal, message, Select, Card, List, Space, Tag, Alert, Tooltip, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ApiOutlined, LinkOutlined, QuestionCircleOutlined, WarningOutlined, ArrowLeftOutlined, SettingOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getSystemModels, addSystemModel, deleteSystemModel, switchSystemDefaultModel, updateSystemModel, getSystemModelVisibility, setSystemModelVisibility } from '@/shared/http/modelConfig';
import { useHistory } from 'react-router-dom';
import { useAppSelector } from '@/store/hook';
import './index.scss';
import SiliconFlowLogo from '@/assets/images/providers/siliconflow.svg';
import DeepSeekLogo from '@/assets/images/providers/deepseek.svg';

interface ModelConfig {
  id?: string;
  modelId?: string;
  modelName: string;
  apiKey: string;
  baseUrl: string;
  modelType: string;
  isDefault?: boolean;
  provider?: string;
}

interface ModelProvider {
  id: string;
  name: string;
  nameCn: string;
  logo: string;
  baseUrl: string;
  description: string;
  color: string;
  apiKeyUrl: string;
}

const MODEL_PROVIDERS: ModelProvider[] = [
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    nameCn: '硅基流动',
    logo: SiliconFlowLogo,
    baseUrl: 'https://api.siliconflow.cn/v1',
    description: '硅基流动提供对各种模型（chat_completions、embeddings、rerank）的访问，可通过模型名称、模型类型、API密钥进行配置。',
    color: '#1890ff',
    apiKeyUrl: 'https://cloud.siliconflow.cn/me/account/ak',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    nameCn: '深度求索',
    logo: DeepSeekLogo,
    baseUrl: 'https://api.deepseek.com',
    description: '深度求索提供的模型，可通过模型名称、模型类型、API密钥进行配置。',
    color: '#1890ff',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
  },
];

const SystemModelPage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const [form] = Form.useForm();
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAdvancedConfigVisible, setIsAdvancedConfigVisible] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider | null>(null);
  const [loading, setLoading] = useState(false);
  const [systemModelVisibleToUsers, setSystemModelVisibleToUsers] = useState<boolean>(false);
  const tenantId = useAppSelector((state) => state.appStore.tenantId);

  // 从后端加载可见性配置
  const loadVisibilityConfig = async () => {
    try {
      const response: any = await getSystemModelVisibility(tenantId);
      if (response && response.data) {
        const visible = response.data.visible;
        setSystemModelVisibleToUsers(visible);
        // 同时更新 localStorage 作为缓存
        localStorage.setItem('systemModelVisibleToUsers', String(visible));
      }
    } catch (error) {
      console.error('加载可见性配置失败:', error);
      // 如果后端加载失败，尝试从 localStorage 读取
      const stored = localStorage.getItem('systemModelVisibleToUsers');
      if (stored) {
        setSystemModelVisibleToUsers(stored === 'true');
      }
    }
  };

  // 保存配置到后端和 localStorage
  const saveVisibilityConfig = async (visible: boolean) => {
    setSystemModelVisibleToUsers(visible);
    // 立即更新 localStorage
    localStorage.setItem('systemModelVisibleToUsers', String(visible));

    try {
      // 保存到后端
      await setSystemModelVisibility(tenantId, visible);
      message.success(visible ? '系统模型已设置为对普通用户可见' : '系统模型已设置为对普通用户不可见');

      // 触发事件通知其他组件配置已更改
      window.dispatchEvent(new CustomEvent('systemModelVisibilityChanged', { detail: { visible } }));
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存配置失败，请稍后重试');
    }
  };

  // 显示高级配置弹窗
  const showAdvancedConfig = () => {
    setIsAdvancedConfigVisible(true);
  };

  useEffect(() => {
    if (tenantId) {
      loadModels();
      loadVisibilityConfig();
    }
  }, [tenantId]);

  const loadModels = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const response: any = await getSystemModels(tenantId);
      if (response.data) {
        const formattedModels = response.data.map((item: any) => ({
          id: item.modelId,
          modelId: item.modelId,
          modelName: item.modelName,
          apiKey: item.apiKey || '',
          baseUrl: item.baseUrl,
          modelType: item.type,
          isDefault: item.isDefault === 1,
          provider: getProviderByBaseUrl(item.baseUrl),
        }));
        setModels(formattedModels);
      }
    } catch (error) {
      console.error('Failed to load system models:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProviderByBaseUrl = (baseUrl: string): string => {
    const provider = MODEL_PROVIDERS.find(p => p.baseUrl === baseUrl);
    return provider ? provider.id : 'custom';
  };

  const showAddModal = (provider: ModelProvider) => {
    setSelectedProvider(provider);
    setEditingModel(null);
    setIsModalVisible(true);
    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({
        modelType: 'chat_completions',
        baseUrl: provider.baseUrl,
      });
    }, 0);
  };

  const showEditModal = (record: ModelConfig) => {
    const provider = MODEL_PROVIDERS.find(p => p.id === record.provider);
    setSelectedProvider(provider || null);
    setEditingModel(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    if (!tenantId || !selectedProvider) return;
    try {
      const values = await form.validateFields();

      if (editingModel) {
        // 编辑模式
        try {
          const requestData = {
            modelName: values.modelName,
            apiKey: values.apiKey,
            baseUrl: selectedProvider.baseUrl,
            type: values.modelType || 'chat_completions',
          };

          await updateSystemModel(tenantId, editingModel.modelId!, requestData);
          message.success('系统模型保存成功');
        } catch (error) {
          message.error('系统模型保存失败');
          console.error('Edit system model failed:', error);
          return;
        }
      } else {
        // 创建新模型
        const requestData = {
          modelName: values.modelName,
          apiKey: values.apiKey,
          baseUrl: selectedProvider.baseUrl,
          type: values.modelType || 'chat_completions',
        };
        await addSystemModel(tenantId, requestData);
        message.success('系统模型保存成功');
      }

      setIsModalVisible(false);
      loadModels();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedProvider(null);
    setEditingModel(null);
    form.resetFields();
  };

  const handleDelete = (record: ModelConfig) => {
    if (!tenantId) return;

    // 默认模型不能删除
    if (record.isDefault) {
      message.warning('默认的系统模型不能删除，请先设置其他模型为默认');
      return;
    }

    Modal.confirm({
      title: '确认删除此系统模型？',
      content: '删除后将无法恢复',
      onOk: async () => {
        try {
          await deleteSystemModel(tenantId, record.modelId!);
          message.success('系统模型删除成功');
          loadModels();
        } catch (error) {
          console.error('Delete failed:', error);
          message.error('删除失败');
        }
      },
    });
  };

  const handleSetDefault = async (record: ModelConfig) => {
    if (!tenantId || record.isDefault) return;
    try {
      await switchSystemDefaultModel(tenantId, record.modelId!);
      message.success('已设置为默认系统模型');
      loadModels();
    } catch (error) {
      console.error('Set default failed:', error);
      message.error('设置失败');
    }
  };

  const getProviderModels = (providerId: string) => {
    return models.filter(m => m.provider === providerId);
  };

  const defaultModel = models.find(m => m.isDefault);
  const hasModels = models.length > 0;

  return (
    <div className="system-model-page">
      <div className="system-model-header">
        <div className="header-left">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => history.goBack()}
            className="back-button"
          >
            返回
          </Button>
          <h1 className="page-title">系统模型配置</h1>
        </div>
        <div className="header-right">
          <Tooltip title="配置系统模型在工作流编排中的可见性">
            <Button
              type="default"
              icon={<SettingOutlined />}
              onClick={showAdvancedConfig}
            >
              高级配置
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="system-model-content">
        {/* 当前系统模型信息 */}
        <div className="current-system-model-section">
          {!hasModels ? (
            <Alert
              message="尚未配置系统模型"
              description="系统模型用于智能体名字生成、提示词生成等平台能力。请至少配置一个模型并设置为默认。"
              type="error"
              showIcon
              icon={<WarningOutlined />}
            />
          ) : !defaultModel ? (
            <Alert
              message="尚未设置默认系统模型"
              description="请在下方选择一个模型并点击「设为默认」按钮。"
              type="warning"
              showIcon
              icon={<WarningOutlined />}
            />
          ) : (
            <Alert
              message={
                <div>
                  <strong>当前系统默认模型：</strong>
                  <span style={{ color: '#1890ff', fontWeight: 600, marginLeft: 8 }}>{defaultModel.modelName}</span>
                  <Tag color="blue" style={{ marginLeft: 8 }}>{defaultModel.modelType}</Tag>
                </div>
              }
              description="此模型将用于智能体名字生成、提示词生成等平台能力，对所有用户生效。"
              type="success"
              showIcon
            />
          )}
        </div>

        {/* 模型供应商卡片 */}
        <div className="provider-cards-grid">
          {MODEL_PROVIDERS.map((provider) => {
            const providerModels = getProviderModels(provider.id);
            return (
              <Card
                key={provider.id}
                className="provider-card"
                hoverable
              >
                <div className="provider-header">
                  <div className="provider-info">
                    <span className="provider-logo">
                      <img src={provider.logo} alt={provider.name} />
                    </span>
                    <div className="provider-names">
                      <h3 className="provider-name">{provider.nameCn}</h3>
                      <span className="provider-name-en">{provider.name}</span>
                    </div>
                  </div>
                  <Tag color={provider.color}>{providerModels.length} 个模型</Tag>
                </div>

                <p className="provider-description">{provider.description}</p>

                <div className="provider-models">
                  {providerModels.length > 0 ? (
                    <List
                      size="small"
                      dataSource={providerModels}
                      renderItem={(model) => (
                        <List.Item
                          className="model-item"
                          actions={[
                            !model.isDefault && (
                              <Button
                                type="link"
                                size="small"
                                onClick={() => handleSetDefault(model)}
                                key="set-default"
                              >
                                设为默认
                              </Button>
                            ),
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => showEditModal(model)}
                              key="edit"
                            />,
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDelete(model)}
                              key="delete"
                              disabled={model.isDefault}
                            />,
                          ].filter(Boolean)}
                        >
                          <List.Item.Meta
                            title={
                              <Space>
                                <span>{model.modelName}</span>
                                <Tag color="blue" style={{ fontSize: 12 }}>
                                  {model.modelType}
                                </Tag>
                                {model.isDefault && (
                                  <Tag color="gold" style={{ fontSize: 12 }}>
                                    默认
                                  </Tag>
                                )}
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div className="empty-models">
                      <ApiOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />
                      <p style={{ color: '#8c8c8c', marginTop: 8 }}>暂无模型配置</p>
                    </div>
                  )}
                </div>

                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => showAddModal(provider)}
                  block
                  style={{ marginTop: 16, backgroundColor: provider.color, borderColor: provider.color }}
                >
                  添加 {provider.nameCn} 系统模型
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 添加/编辑模型Modal */}
      <Modal
        title={editingModel ? `编辑${selectedProvider?.nameCn}系统模型` : `添加${selectedProvider?.nameCn}系统模型`}
        open={isModalVisible}
        onCancel={handleCancel}
        width={600}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <a
              href={selectedProvider?.apiKeyUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, color: selectedProvider?.color || '#1890ff' }}
            >
              从 {selectedProvider?.nameCn} 获取 API Key <LinkOutlined style={{ fontSize: 12 }} />
            </a>
            <Space>
              <Button onClick={handleCancel}>取消</Button>
              <Button type="primary" onClick={handleOk}>确定</Button>
            </Space>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="modelName"
            label="模型名称"
            rules={[{ required: true, message: '请输入模型名称' }]}
          >
            <Input placeholder="请输入模型名称，如：Qwen/Qwen2.5-72B-Instruct" />
          </Form.Item>

          <Form.Item
            name="modelType"
            label="模型类型"
            rules={[{ required: true, message: '请选择模型类型' }]}
          >
            <Select placeholder="请选择模型类型">
              <Select.Option value="chat_completions">chat_completions</Select.Option>
              <Select.Option value="embeddings">embeddings</Select.Option>
              <Select.Option value="rerank">rerank</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="apiKey"
            label="API Key"
            rules={[{ required: true, message: '请输入API Key' }]}
          >
            <Input.Password placeholder="请输入 API Key" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 高级配置Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SettingOutlined style={{ color: '#1890ff' }} />
            <span>高级配置</span>
          </div>
        }
        open={isAdvancedConfigVisible}
        onCancel={() => setIsAdvancedConfigVisible(false)}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setIsAdvancedConfigVisible(false)}>
              关闭
            </Button>
          </div>
        }
        width={600}
      >
        <div style={{ padding: '24px 0' }}>
          <Card
            style={{
              borderRadius: 8,
              border: '1px solid #f0f0f0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {systemModelVisibleToUsers ? (
                    <EyeOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                  ) : (
                    <EyeInvisibleOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />
                  )}
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                    系统模型对普通用户编排应用可见
                  </h3>
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#8c8c8c', lineHeight: 1.6 }}>
                  {systemModelVisibleToUsers
                    ? '已开启：普通用户在工作流编排的大模型节点下拉框中可以看到系统模型。'
                    : '已关闭：普通用户在工作流编排的大模型节点下拉框中无法看到系统模型，仅显示个人模型。'}
                </p>
              </div>
              <Switch
                checked={systemModelVisibleToUsers}
                onChange={saveVisibilityConfig}
                checkedChildren="可见"
                unCheckedChildren="隐藏"
                style={{ minWidth: 60 }}
              />
            </div>

            <Alert
              message="配置说明"
              description={
                <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                  <p style={{ marginBottom: 8 }}>
                    <strong>开启时：</strong>普通用户在编排自己的应用时，agent-flow 大模型节点的下拉选择框中会显示系统模型和个人模型。
                  </p>
                  <p style={{ marginBottom: 0 }}>
                    <strong>关闭时：</strong>普通用户在编排自己的应用时，agent-flow 大模型节点的下拉选择框中仅显示个人模型，不显示系统模型。
                  </p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </Card>
        </div>
      </Modal>
    </div>
  );
};

export default SystemModelPage;
