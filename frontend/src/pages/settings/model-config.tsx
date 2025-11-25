/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Table, Space, Modal, message, Select, Tag, Switch, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, StarFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import { getUserModels, addUserModel, deleteUserModel, switchDefaultModel } from '@/shared/http/modelConfig';
import { useAppSelector } from '@/store/hook';
import './model-config.scss';

interface ModelConfig {
  id?: string;
  modelId?: string;
  modelName: string;
  apiKey: string;
  baseUrl: string;
  modelType: string;
  isDefault?: boolean;
  type?: string;
}

const ModelConfigComponent: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
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
        }));
        setModels(formattedModels);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const showAddModal = () => {
    setEditingModel(null);
    setIsModalVisible(true);
    // 需要在 Modal 打开后才能设置字段值
    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({ modelType: 'chat_completions', isDefault: false });
    }, 0);
  };

  const showEditModal = (record: ModelConfig) => {
    setEditingModel(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    if (!tenantId) return;
    try {
      const values = await form.validateFields();

      if (editingModel) {
        // 编辑模式：由于后端没有更新接口，先删除再添加
        // 注意：这不是最佳实践，但可以工作
        message.info('编辑功能暂未实现');
      } else {
        // 创建新模型
        const requestData = {
          modelName: values.modelName,
          apiKey: values.apiKey,
          baseUrl: values.baseUrl,
          type: values.modelType || 'chat_completions',
          isDefault: values.isDefault || false,
        };
        await addUserModel(tenantId, requestData);
        message.success(t('modelSaveSuccess'));
      }

      setIsModalVisible(false);
      loadModels();
    } catch (error) {
      console.error('Validation failed:', error);
    }
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
    if (!tenantId) return;
    try {
      await switchDefaultModel(tenantId, record.modelId!);
      message.success(t('modelSaveSuccess'));
      loadModels();
    } catch (error) {
      console.error('Switch default failed:', error);
    }
  };

  const columns: ColumnsType<ModelConfig> = [
    {
      title: t('modelName'),
      dataIndex: 'modelName',
      key: 'modelName',
      width: '25%',
      render: (text: string, record: ModelConfig) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{text}</span>
          {record.isDefault && <StarFilled style={{ color: '#faad14', fontSize: 14 }} />}
        </Space>
      ),
    },
    {
      title: t('apiKey'),
      dataIndex: 'apiKey',
      key: 'apiKey',
      width: '20%',
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#8c8c8c' }}>
          {text ? '••••••••' + text.slice(-4) : ''}
        </span>
      ),
    },
    {
      title: t('baseUrl'),
      dataIndex: 'baseUrl',
      key: 'baseUrl',
      width: '30%',
      ellipsis: true,
      render: (text: string) => (
        <span style={{ fontSize: 13, color: '#595959' }}>{text}</span>
      ),
    },
    {
      title: t('modelType'),
      dataIndex: 'modelType',
      key: 'modelType',
      width: '15%',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: t('operate'),
      key: 'action',
      width: '10%',
      render: (_: any, record: ModelConfig) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
          >
            {t('edit')}
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            disabled={record.isDefault}
          >
            {t('delete')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="model-config">
      <Card
        bordered={false}
        className="model-config-card"
        bodyStyle={{ padding: 0 }}
      >
        <div className="model-config-header">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showAddModal}
            size="large"
          >
            {t('addModel')}
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={models}
          rowKey="id"
          pagination={false}
          loading={loading}
          locale={{
            emptyText: (
              <div style={{ padding: '60px 0' }}>
                <div style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 8 }}>
                  {t('noModelsConfigured')}
                </div>
                <div style={{ fontSize: 13, color: '#bfbfbf' }}>
                  {t('addFirstModel')}
                </div>
              </div>
            ),
          }}
        />

      <Modal
        title={editingModel ? t('editModel') : t('addModel')}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ modelType: 'chat_completions' }}
        >
          <Form.Item
            name="modelName"
            label={t('modelName')}
            rules={[{ required: true, message: t('modelNameRequired') }]}
          >
            <Input placeholder={t('plsEnterName')} />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label={t('apiKey')}
            rules={[{ required: true, message: t('apiKeyRequired') }]}
          >
            <Input.Password placeholder={t('plsEnter') + ' API Key'} />
          </Form.Item>

          <Form.Item
            name="baseUrl"
            label={t('baseUrl')}
            rules={[
              { required: true, message: t('baseUrlRequired') },
              { type: 'url', message: t('plsEnterValidUrl') }
            ]}
          >
            <Input placeholder={t('plsEnter') + ' Base URL'} />
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
            name="isDefault"
            label={t('setAsDefault')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
      </Card>
    </div>
  );
};

export default ModelConfigComponent;
