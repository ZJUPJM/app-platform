/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Modal, message, Select, Card, List, Space, Tag, Badge, Alert, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ApiOutlined, LinkOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getUserModels, addUserModel, deleteUserModel, switchDefaultModel, updateUserModel } from '@/shared/http/modelConfig';
import { useAppSelector } from '@/store/hook';
import './model-config.scss';
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

const ModelConfigComponent: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider | null>(null);
  const [loading, setLoading] = useState(false);
  const tenantId = useAppSelector((state) => state.appStore.tenantId);

  useEffect(() => {
    if (tenantId) {
      loadModels();
    }
  }, [tenantId]);

  const loadModels = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const response: any = await getUserModels(tenantId);
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
      console.error('Failed to load models:', error);
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
        isDefault: false,
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

          await updateUserModel(tenantId, editingModel.modelId!, requestData);

          // 如果用户勾选了设为默认（仅针对非默认模型）
          if (values.isDefault && !editingModel.isDefault) {
            await switchDefaultModel(tenantId, editingModel.modelId!);
          }

          message.success(t('modelSaveSuccess'));
        } catch (error) {
          message.error(t('modelSaveFailed'));
          console.error('Edit model failed:', error);
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
        const result: any = await addUserModel(tenantId, requestData);

        // 如果用户勾选了设为默认，在添加成功后调用切换默认接口
        if (values.isDefault && result && result.data) {
          const newModelId = result.data;
          await switchDefaultModel(tenantId, newModelId);
        }

        message.success(t('modelSaveSuccess'));
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
    Modal.confirm({
      title: t('deleteModelConfirm'),
      onOk: async () => {
        try {
          await deleteUserModel(tenantId, record.modelId!);
          message.success(t('modelDeleteSuccess'));
          loadModels();
        } catch (error) {
          console.error('Delete failed:', error);
        }
      },
    });
  };

  const handleSetDefault = async (record: ModelConfig) => {
    if (!tenantId || record.isDefault) return;
    try {
      await switchDefaultModel(tenantId, record.modelId!);
      message.success(t('defaultModelSet'));
      loadModels();
    } catch (error) {
      console.error('Set default failed:', error);
    }
  };

  const getProviderModels = (providerId: string) => {
    return models.filter(m => m.provider === providerId);
  };

  return (
    <div className="model-config-container">
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
                    {typeof provider.logo === 'string' && (provider.logo.startsWith('http') || provider.logo.startsWith('data:')) ? (
                      <img src={provider.logo} alt={provider.name} />
                    ) : typeof provider.logo === 'string' ? (
                      provider.logo
                    ) : (
                      <img src={provider.logo} alt={provider.name} />
                    )}
                  </span>
                  <div className="provider-names">
                    <h3 className="provider-name">{provider.nameCn}</h3>
                    <span className="provider-name-en">{provider.name}</span>
                  </div>
                </div>
                <Badge count={providerModels.length} style={{ backgroundColor: provider.color }} />
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
                添加 {provider.nameCn} 模型
              </Button>
            </Card>
          );
        })}
      </div>

      <Modal
        title={editingModel ? `编辑${selectedProvider?.nameCn}模型` : `添加${selectedProvider?.nameCn}模型`}
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
              <Button onClick={handleCancel}>{t('cancel')}</Button>
              <Button type="primary" onClick={handleOk}>{t('confirm')}</Button>
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
            label={t('modelName')}
            rules={[{ required: true, message: t('modelNameRequired') }]}
          >
            <Input placeholder={t('plsEnter') + ' ' + t('modelName')} />
          </Form.Item>

          <Form.Item
            name="modelType"
            label={t('modelType')}
            rules={[{ required: true, message: t('pleaseSelect') }]}
          >
            <Select placeholder={t('pleaseSelect')}>
              <Select.Option value="chat_completions">chat_completions</Select.Option>
              <Select.Option value="embeddings">embeddings</Select.Option>
              <Select.Option value="rerank">rerank</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="apiKey"
            label="API Key"
            rules={[{ required: true, message: t('apiKeyRequired') }]}
          >
            <Input.Password placeholder={t('plsEnter') + ' API Key'} />
          </Form.Item>

          {editingModel && editingModel.isDefault ? (
            <Form.Item label={t('setAsDefault')}>
              <Alert
                message={t('defaultModelHint')}
                type="info"
                showIcon
              />
            </Form.Item>
          ) : (
            <Form.Item
              name="isDefault"
              label={t('setAsDefault')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default ModelConfigComponent;
