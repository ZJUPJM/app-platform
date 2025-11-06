/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useState } from 'react';
import {
  Button,
  Input,
  Modal,
  Form,
  message,
  Steps,
  Alert,
  Space,
  InputNumber,
  Switch,
  Select,
  Tooltip,
  Spin,
  Card, Row, Col, Tag,
} from 'antd';
import { 
  PlusOutlined, 
  LinkOutlined, 
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';
import { TENANT_ID } from '../../chatPreview/components/send-editor/common/config';
import { testMCPServiceConnection, addManualMCPService } from '@/shared/http/mcp';

interface ModaManualConfigProps {
  onServiceAdd?: (service: any) => void;
}

const ModaManualConfig: React.FC<ModaManualConfigProps> = ({ onServiceAdd }) => {
  const { t } = useTranslation();
  const tenantId = useAppSelector((state) => state.appStore.tenantId) || TENANT_ID;
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);


  const steps = [
    {
      title: '输入服务信息',
      description: '手动输入魔搭社区MCP服务信息'
    },
    {
      title: '配置参数',
      description: '设置服务的连接参数和配置选项'
    },
    {
      title: '测试连接',
      description: '验证服务连接和配置是否正确'
    },
    {
      title: '完成导入',
      description: '确认并导入MCP服务'
    }
  ];

  const handleStart = () => {
    setIsModalVisible(true);
    setCurrentStep(0);
    form.resetFields();
    setTestResult(null);
  };

  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        // 验证第一步
        await form.validateFields(['name', 'endpoint']);
      } else if (currentStep === 1) {
        // 验证第二步
        await form.validateFields();
      } else if (currentStep === 2) {
        // 测试连接
        await handleTestConnection();
        return; // 测试完成后不自动进入下一步
      }
      
      setCurrentStep(currentStep + 1);
    } catch (error) {
      message.error('请完善必填信息');
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleTestConnection = async () => {
    try {
      setLoading(true);
      const values = form.getFieldsValue(true); // 获取所有字段值，包括其他步骤的
      
      console.log('Form values:', values); // 调试日志
      
      // 构建测试连接的请求体（使用 camelCase）
      const requestBody = {
        name: values.name || 'Test MCP Server',
        mcpServerUrl: values.endpoint,
        serverIdentifier: values.name ? values.name.replace(/\s+/g, '_').toLowerCase() : 'test_server',
        headers: values.headers || {},
        config: {
          sseReadTimeout: values.sseReadTimeout || 300,
          timeout: values.timeout || 30
        }
      };
      
      console.log('Test connection request body:', requestBody); // 调试日志
      
      const apiResult: any = await testMCPServiceConnection(tenantId, requestBody);
      const isSuccess = apiResult?.code === 200;
      setTestResult({
        success: isSuccess,
        message: isSuccess ? '连接测试成功' : (apiResult?.msg || '连接测试失败'),
        details: apiResult?.data?.tools ? `发现 ${apiResult.data.tools.length} 个可用工具` : (isSuccess ? '服务连接正常，配置参数有效' : '无法连接到指定端点，请检查URL和配置参数')
      });
      
      if (isSuccess) {
        message.success('连接测试成功');
        setCurrentStep(currentStep + 1); // 测试成功后自动进入下一步
      } else {
        message.error(apiResult?.msg || '连接测试失败');
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: '连接测试异常',
        details: (error as any)?.message || '测试过程中发生错误'
      });
      message.error('连接测试异常');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    try {
      setLoading(true);
      const values = form.getFieldsValue(true); // 获取所有字段值
      
      console.log('Form values:', values); // 调试日志
      
      // 构建创建 MCP 插件的请求体（使用 camelCase）
      const requestBody = {
        name: values.name,
        mcpServerUrl: values.endpoint,
        serverIdentifier: values.name ? values.name.replace(/\s+/g, '_').toLowerCase() : 'mcp_server',
        headers: values.headers || {},
        config: {
          sseReadTimeout: values.sseReadTimeout || 300,
          timeout: values.timeout || 30
        }
      };
      
      console.log('Create MCP request body:', requestBody); // 调试日志
      
      const result = await addManualMCPService(tenantId, requestBody);

      if (onServiceAdd && result?.data) {
        onServiceAdd({
          id: result.data.id,
          name: values.name,
          description: values.description,
          endpoint: values.endpoint,
          config: {
            sse_read_timeout: values.sseReadTimeout || 300,
            timeout: values.timeout || 30
          },
          source: 'mcp',
          status: 'active',
          createTime: new Date().toLocaleString()
        });
      }

      message.success('MCP服务导入成功');
      setIsModalVisible(false);
      setCurrentStep(0);
      form.resetFields();
    } catch (error) {
      message.error('导入MCP服务失败: ' + ((error as any)?.message || ''));
    } finally {
      setLoading(false);
    }
  };


  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <Alert
              message="魔搭社区MCP广场服务配置"
              description="请手动输入魔搭社区MCP广场 (https://modelscope.cn/mcp) 上的服务信息进行配置导入。"
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <Form form={form} layout="vertical">
              <Form.Item
                name="name"
                label="服务名称"
                rules={[{ required: true, message: '请输入服务名称' }]}
              >
                <Input placeholder="请输入MCP服务名称" />
              </Form.Item>
              
              <Form.Item
                name="endpoint"
                label="服务端点 URL"
                rules={[
                  { required: true, message: '请输入服务端点' },
                  { type: 'url', message: '请输入有效的URL地址' }
                ]}
                tooltip="MCP 服务器的完整 URL 地址，例如: https://mcp.api-inference.modelscope.net/xxx/sse"
              >
                <Input placeholder="https://mcp.api-inference.modelscope.net/xxx/sse" />
              </Form.Item>
            </Form>
          </div>
        );

      case 1:
        return (
          <div>
            <Alert
              message="服务配置参数"
              description="配置 MCP 服务的连接参数，包括认证信息和超时设置。"
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <Form form={form} layout="vertical">
              <Form.Item
                name={['headers', 'Authorization']}
                label={
                  <span>
                    Authorization Header &nbsp;
                    <Tooltip title="用于 MCP 服务器认证，例如: Bearer your-token">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </span>
                }
              >
                <Input placeholder="Bearer your-token" />
              </Form.Item>
              
              <Form.Item
                name="sseReadTimeout"
                label={
                  <span>
                    SSE 读取超时时间(秒) &nbsp;
                    <Tooltip title="Server-Sent Events 长连接的读取超时时间">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </span>
                }
                initialValue={300}
              >
                <InputNumber min={30} max={600} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="timeout"
                label={
                  <span>
                    普通请求超时时间(秒) &nbsp;
                    <Tooltip title="普通 HTTP 请求的超时时间">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </span>
                }
                initialValue={30}
              >
                <InputNumber min={5} max={120} style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          </div>
        );

      case 2:
        return (
          <div>
            <Alert
              message="连接测试"
              description="测试与MCP服务的连接，验证配置参数是否正确。"
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Button
                type="primary"
                size="large"
                icon={<LinkOutlined />}
                onClick={handleTestConnection}
                loading={loading}
              >
                测试连接
              </Button>
            </div>
            
            {testResult && (
              <Alert
                message={testResult.message}
                description={testResult.details}
                type={testResult.success ? 'success' : 'error'}
                icon={testResult.success ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                showIcon
              />
            )}
          </div>
        );

      case 3:
        const values = form.getFieldsValue();
        return (
          <div>
            <Alert
              message="确认导入"
              description="请确认以下服务信息，确认无误后点击完成导入。"
              type="success"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <Card>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div><strong>服务名称：</strong>{values.name}</div>
                </Col>
                <Col span={12}>
                  <div><strong>服务标识：</strong>{values.name ? values.name.replace(/\s+/g, '_').toLowerCase() : 'mcp_server'}</div>
                </Col>
                <Col span={24}>
                  <div><strong>服务端点：</strong>{values.endpoint}</div>
                </Col>
                <Col span={12}>
                  <div><strong>SSE 超时：</strong>{values.sseReadTimeout || 300} 秒</div>
                </Col>
                <Col span={12}>
                  <div><strong>请求超时：</strong>{values.timeout || 30} 秒</div>
                </Col>
                {values.headers?.Authorization && (
                  <Col span={24}>
                    <div><strong>认证信息：</strong>
                      <Tag color="green">已配置</Tag>
                    </div>
                  </Col>
                )}
                {testResult?.success && testResult.details && (
                  <Col span={24}>
                    <Alert
                      message="测试结果"
                      description={testResult.details}
                      type="success"
                      showIcon
                    />
                  </Col>
                )}
              </Row>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }}>
            <SettingOutlined />
          </div>
          <h3 style={{ marginBottom: '8px' }}>手动配置魔搭社区MCP服务</h3>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            从<a href="https://modelscope.cn/mcp" target="_blank">魔搭社区MCP广场 (https://modelscope.cn/mcp)</a> 手动配置导入MCP服务
          </p>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleStart}>
            开始配置
          </Button>
        </div>
      </Card>

      <Modal
        title="魔搭社区MCP服务配置向导"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Steps current={currentStep} items={steps} style={{ marginBottom: '24px' }} />
        
        <div style={{ minHeight: '400px' }}>
          {renderStepContent()}
        </div>
        
        <div style={{ textAlign: 'right', marginTop: '24px' }}>
          <Space>
            {currentStep > 0 && (
              <Button onClick={handlePrev}>
                上一步
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button type="primary" onClick={handleNext} loading={loading}>
                下一步
              </Button>
            ) : (
              <Button type="primary" onClick={handleFinish} loading={loading}>
                完成导入
              </Button>
            )}
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default ModaManualConfig;
