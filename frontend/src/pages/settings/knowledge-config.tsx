/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Table, Space, Modal, message, Select, Switch, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, StarFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import './knowledge-config.scss';

interface KnowledgeConfig {
  id?: string;
  platform: string;
  apiKey: string;
  isDefault?: boolean;
}

const KnowledgeConfigComponent: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeConfig[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState<KnowledgeConfig | null>(null);

  // TODO: Replace with actual API calls
  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  const loadKnowledgeBases = async () => {
    // TODO: Implement API call to load knowledge bases
  };

  const showAddModal = () => {
    setEditingKnowledge(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (record: KnowledgeConfig) => {
    setEditingKnowledge(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingKnowledge) {
        // TODO: Update existing knowledge base via API
        message.success(t('saveConfigSuccess'));
      } else {
        // TODO: Create new knowledge base via API
        message.success(t('saveConfigSuccess'));
      }

      setIsModalVisible(false);
      loadKnowledgeBases();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDelete = (record: KnowledgeConfig) => {
    Modal.confirm({
      title: t('deleteKnowledgeTips'),
      onOk: async () => {
        // TODO: Delete knowledge base via API
        message.success(t('deleteSuccess'));
        loadKnowledgeBases();
      },
    });
  };

  const columns: ColumnsType<KnowledgeConfig> = [
    {
      title: t('platform'),
      dataIndex: 'platform',
      key: 'platform',
      width: '30%',
      render: (text: string, record: KnowledgeConfig) => (
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
      width: '40%',
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#8c8c8c' }}>
          {text ? '••••••••' + text.slice(-4) : ''}
        </span>
      ),
    },
    {
      title: t('operate'),
      key: 'action',
      width: '30%',
      render: (_: any, record: KnowledgeConfig) => (
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
    <div className="knowledge-config">
      <Card
        bordered={false}
        className="knowledge-config-card"
        bodyStyle={{ padding: 0 }}
      >
        <div className="knowledge-config-header">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showAddModal}
            size="large"
          >
            {t('addKnowledge')}
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={knowledgeBases}
          rowKey="id"
          pagination={false}
          locale={{
            emptyText: (
              <div style={{ padding: '60px 0' }}>
                <div style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 8 }}>
                  {t('noData')}
                </div>
                <div style={{ fontSize: 13, color: '#bfbfbf' }}>
                  {t('addKnowledge')}
                </div>
              </div>
            ),
          }}
        />

        <Modal
          title={editingKnowledge ? t('edit') : t('addKnowledge')}
          open={isModalVisible}
          onOk={handleOk}
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{ platform: '百度千帆知识库', isDefault: false }}
          >
            <Form.Item
              name="platform"
              label={t('platform')}
              rules={[{ required: true, message: t('pleaseSelect') }]}
            >
              <Select placeholder={t('pleaseSelect')}>
                <Select.Option value="百度千帆知识库">百度千帆知识库</Select.Option>
                <Select.Option value="阿里云知识库">阿里云知识库</Select.Option>
                <Select.Option value="腾讯云知识库">腾讯云知识库</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="apiKey"
              label={t('apiKey')}
              rules={[{ required: true, message: t('apiKeyRequired') }]}
            >
              <Input.Password placeholder={t('plsEnter') + ' API Key'} />
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

export default KnowledgeConfigComponent;
