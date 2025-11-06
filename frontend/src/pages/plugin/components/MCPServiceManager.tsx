/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  Modal, 
  Form, 
  message, 
  Table, 
  Tag, 
  Space, 
  Popconfirm,
  Tooltip,
  Spin
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  LinkOutlined, 
  DeleteOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';
import { 
  getMCPServices, 
  getMCPService,
  testMCPServiceConnection, 
  deleteMCPService 
} from '@/shared/http/mcp';
import { TENANT_ID } from '../../chatPreview/components/send-editor/common/config';
import ModaManualConfig from './ModaManualConfig';

interface MCPService {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  status: 'connected' | 'disconnected' | 'testing';
  lastTestTime?: string;
  createTime: string;
  source: 'moda' | 'custom';
}

interface MCPServiceManagerProps {
  onServiceSelect?: (service: MCPService) => void;
}

const MCPServiceManager: React.FC<MCPServiceManagerProps> = ({ onServiceSelect }) => {
  const { t } = useTranslation();
  const tenantId = useAppSelector((state) => state.appStore.tenantId) || TENANT_ID;
  
  const [services, setServices] = useState<MCPService[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [testingServices, setTestingServices] = useState<Set<string>>(new Set());

  // 删除本地模拟数据，改为真实接口


  useEffect(() => {
    loadServices();
  }, []);


  const loadServices = async () => {
    setLoading(true);
    try {
      const response: any = await getMCPServices(tenantId);
      console.log('MCP services raw response:', response); // 调试日志
      console.log('response.data:', response?.data); // 调试日志
      console.log('response.data type:', typeof response?.data); // 调试日志
      
      // 根据实际响应结构提取数据数组
      // 后端返回结构: { data: { items: [...], pagination: {...} }, code: 0 }
      let dataArray = [];
      
      if (Array.isArray(response?.data?.items)) {
        // response.data.items 是数组（后端实际结构）
        dataArray = response.data.items;
      } else if (Array.isArray(response?.data?.data)) {
        // response.data.data 是数组
        dataArray = response.data.data;
      } else if (Array.isArray(response?.data)) {
        // response.data 是数组
        dataArray = response.data;
      } else if (Array.isArray(response)) {
        // response 本身是数组
        dataArray = response;
      } else {
        console.error('Unexpected response structure:', response);
        dataArray = [];
      }
      
      console.log('Extracted data array:', dataArray); // 调试日志
      
      // 转换后端数据格式为前端期望的格式
      const transformedServices = dataArray.map((item: any) => ({
        id: item.pluginId,
        name: item.pluginName,
        description: item.extension?.description || item.pluginName,
        endpoint: item.extension?.serverUrl || '',
        status: item.deployStatus === 'RELEASED' ? 'connected' : 'disconnected',
        lastTestTime: item.modifier ? new Date().toLocaleString() : undefined,
        createTime: new Date().toLocaleString(),
        source: 'moda'
      }));
      
      console.log('Transformed services:', transformedServices); // 调试日志
      setServices(transformedServices);
    } catch (error) {
      console.error('Failed to load MCP services:', error);
      message.error('加载MCP服务失败');
    } finally {
      setLoading(false);
    }
  };


  // 处理手动配置服务导入
  const handleManualServiceAdd = async (service: any) => {
    message.success(`MCP服务 ${service.name} 添加成功`);
    // 重新加载服务列表以获取最新数据
    await loadServices();
  };

  const handleTestConnection = async (service: MCPService) => {
    setTestingServices(prev => new Set(prev).add(service.id));
    try {
      // 先获取服务详情以获取完整配置
      const serviceDetail: any = await getMCPService(tenantId, service.id);
      const extension = serviceDetail?.data?.extension || {};
      
      // 构建测试请求体
      const requestBody = {
        name: service.name,
        mcpServerUrl: service.endpoint,
        serverIdentifier: extension.serverIdentifier || service.name.replace(/\s+/g, '_').toLowerCase(),
        headers: extension.headers || {},
        config: extension.config || {
          sseReadTimeout: 300,
          timeout: 30
        }
      };
      
      // 调用测试连接接口
      const result: any = await testMCPServiceConnection(tenantId, requestBody);
      const hasTools = result?.data?.tools && result.data.tools.length > 0;
      const isSuccess = hasTools || result?.code === 200 || result?.code === 0;
      
      setServices(prev => prev.map(s => 
        s.id === service.id 
          ? { 
              ...s, 
              status: isSuccess ? 'connected' : 'disconnected',
              lastTestTime: new Date().toLocaleString()
            }
          : s
      ));
      
      if (isSuccess) {
        message.success(`连接测试成功${hasTools ? `，发现 ${result.data.tools.length} 个可用工具` : ''}`);
      } else {
        message.error('连接测试失败');
      }
    } catch (error) {
      setServices(prev => prev.map(s => 
        s.id === service.id 
          ? { ...s, status: 'disconnected', lastTestTime: new Date().toLocaleString() }
          : s
      ));
      message.error('连接测试失败');
    } finally {
      setTestingServices(prev => {
        const newSet = new Set(prev);
        newSet.delete(service.id);
        return newSet;
      });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await deleteMCPService(tenantId, serviceId);
      setServices(prev => prev.filter(s => s.id !== serviceId));
      message.success('MCP服务删除成功');
    } catch (error) {
      message.error('删除MCP服务失败');
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'connected':
        return <Tag color="green" icon={<CheckCircleOutlined />}>已连接</Tag>;
      case 'disconnected':
        return <Tag color="red" icon={<CloseCircleOutlined />}>未连接</Tag>;
      case 'testing':
        return <Tag color="blue" icon={<ReloadOutlined spin />}>测试中</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const columns = [
    {
      title: '服务名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: MCPService) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: '4px' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.description}</div>
        </div>
      ),
    },
    {
      title: '端点地址',
      dataIndex: 'endpoint',
      key: 'endpoint',
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{text}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {status === 'connected' ? (
            <>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <span style={{ color: '#52c41a' }}>已连接</span>
            </>
          ) : (
            <>
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
              <span style={{ color: '#ff4d4f' }}>未连接</span>
            </>
          )}
        </div>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => (
        <Tag color="default" style={{ backgroundColor: '#f5f5f5', color: '#666', border: 'none' }}>
          {source === 'moda' ? '魔搭社区' : '自定义'}
        </Tag>
      ),
    },
    {
      title: '最后测试时间',
      dataIndex: 'lastTestTime',
      key: 'lastTestTime',
      render: (time: string) => (
        <span style={{ fontSize: '12px', color: '#666' }}>{time || '未测试'}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: MCPService) => (
        <Space size="small">
          <Button
            type="link"
            icon={<LinkOutlined />}
            onClick={() => handleTestConnection(record)}
            loading={testingServices.has(record.id)}
            style={{ padding: '0', height: 'auto' }}
          >
            测试
          </Button>
          <Popconfirm
            title="确定要删除这个MCP服务吗？"
            onConfirm={() => handleDeleteService(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
              style={{ padding: '0', height: 'auto' }}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchText.toLowerCase()) ||
    service.description.toLowerCase().includes(searchText.toLowerCase())
  );

  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);

  const handleAddModaService = () => {
    setIsConfigModalVisible(true);
  };

  return (
    <div>

      {/* 添加服务按钮 */}
      <div style={{ marginBottom: '16px' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddModaService}>
          添加魔搭社区服务
        </Button>
      </div>

      {/* 服务列表表格 */}
      <div style={{ background: '#fff', borderRadius: '8px'}}>
        <Table
          columns={columns}
          dataSource={filteredServices}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: false,
            showTotal: (total) => `共${total}个服务`,
            size: 'small'
          }}
        />
      </div>

      {/* 魔搭社区服务配置模态框 */}
      <Modal
        title="配置魔搭社区MCP服务"
        open={isConfigModalVisible}
        onCancel={() => setIsConfigModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <ModaManualConfig
          onServiceAdd={(service) => {
            handleManualServiceAdd(service);
            setIsConfigModalVisible(false);
          }}
        />
      </Modal>

      <style jsx>{`
        .selected-service {
          border-color: #1890ff !important;
          background-color: #f0f8ff;
        }
      `}</style>
    </div>
  );
};

export default MCPServiceManager;
