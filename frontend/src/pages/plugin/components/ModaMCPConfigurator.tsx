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
  Spin,
  Tabs,
  Select,
  Switch,
  InputNumber,
  Divider,
  Checkbox,
  Row,
  Col,
  Alert
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  SettingOutlined, 
  DownloadOutlined,
  UploadOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';
import { TENANT_ID } from '../../chatPreview/components/send-editor/common/config';

interface ModaMCPService {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  category: string;
  version: string;
  author: string;
  tags: string[];
  configurable: boolean;
  configSchema?: any;
  defaultConfig?: any;
  documentation?: string;
  examples?: any[];
  status: 'available' | 'installed' | 'configured';
}

interface ServiceConfig {
  [key: string]: any;
}

interface ModaMCPConfiguratorProps {
  onServiceImport?: (services: ModaMCPService[]) => void;
  onServiceConfigure?: (service: ModaMCPService, config: ServiceConfig) => void;
}

const ModaMCPConfigurator: React.FC<ModaMCPConfiguratorProps> = ({ 
  onServiceImport, 
  onServiceConfigure 
}) => {
  const { t } = useTranslation();
  const tenantId = useAppSelector((state) => state.appStore.tenantId) || TENANT_ID;
  
  const [services, setServices] = useState<ModaMCPService[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [currentService, setCurrentService] = useState<ModaMCPService | null>(null);
  const [configForm] = Form.useForm();
  const [batchConfigForm] = Form.useForm();

  // 模拟从魔搭社区获取的完整服务列表
  const mockModaServices: ModaMCPService[] = [
    // AI模型服务
    {
      id: 'moda-text-gen',
      name: 'ModelScope Text Generation',
      description: '魔搭社区文本生成模型MCP服务，支持多种大语言模型',
      endpoint: 'https://mcp.modelscope.cn/text-generation',
      category: 'AI模型',
      version: '2.1.0',
      author: 'ModelScope Team',
      tags: ['文本生成', 'LLM', 'GPT'],
      configurable: true,
      configSchema: {
        model: { type: 'select', options: ['qwen', 'baichuan', 'chatglm'], required: true },
        temperature: { type: 'number', min: 0, max: 2, default: 0.7 },
        maxTokens: { type: 'number', min: 1, max: 4096, default: 2048 },
        stream: { type: 'boolean', default: true }
      },
      defaultConfig: {
        model: 'qwen',
        temperature: 0.7,
        maxTokens: 2048,
        stream: true
      },
      documentation: 'https://modelscope.cn/docs/text-generation',
      examples: [
        { name: '基础文本生成', prompt: '请帮我写一首诗' },
        { name: '代码生成', prompt: '用Python写一个快速排序算法' }
      ],
      status: 'available'
    },
    {
      id: 'moda-image-gen',
      name: 'ModelScope Image Generation',
      description: '魔搭社区图像生成模型MCP服务，支持文生图、图生图',
      endpoint: 'https://mcp.modelscope.cn/image-generation',
      category: 'AI模型',
      version: '1.8.3',
      author: 'ModelScope Team',
      tags: ['图像生成', 'AIGC', 'Diffusion'],
      configurable: true,
      configSchema: {
        model: { type: 'select', options: ['stable-diffusion', 'dall-e', 'midjourney'], required: true },
        width: { type: 'number', min: 256, max: 1024, default: 512 },
        height: { type: 'number', min: 256, max: 1024, default: 512 },
        steps: { type: 'number', min: 10, max: 100, default: 20 },
        guidance: { type: 'number', min: 1, max: 20, default: 7.5 }
      },
      defaultConfig: {
        model: 'stable-diffusion',
        width: 512,
        height: 512,
        steps: 20,
        guidance: 7.5
      },
      documentation: 'https://modelscope.cn/docs/image-generation',
      examples: [
        { name: '文生图', prompt: '一只可爱的小猫在花园里玩耍' },
        { name: '图生图', prompt: '将这张图片转换为油画风格' }
      ],
      status: 'available'
    },
    {
      id: 'moda-speech-rec',
      name: 'ModelScope Speech Recognition',
      description: '魔搭社区语音识别模型MCP服务，支持多语言语音转文字',
      endpoint: 'https://mcp.modelscope.cn/speech-recognition',
      category: 'AI模型',
      version: '1.5.7',
      author: 'ModelScope Team',
      tags: ['语音识别', 'ASR', '多语言'],
      configurable: true,
      configSchema: {
        language: { type: 'select', options: ['zh', 'en', 'auto'], required: true },
        model: { type: 'select', options: ['whisper', 'wav2vec2'], required: true },
        sampleRate: { type: 'number', min: 8000, max: 48000, default: 16000 },
        format: { type: 'select', options: ['wav', 'mp3', 'flac'], default: 'wav' }
      },
      defaultConfig: {
        language: 'auto',
        model: 'whisper',
        sampleRate: 16000,
        format: 'wav'
      },
      documentation: 'https://modelscope.cn/docs/speech-recognition',
      examples: [
        { name: '中文语音识别', prompt: '上传中文语音文件进行识别' },
        { name: '英文语音识别', prompt: '上传英文语音文件进行识别' }
      ],
      status: 'available'
    },
    {
      id: 'moda-cv',
      name: 'ModelScope Computer Vision',
      description: '魔搭社区计算机视觉模型MCP服务，支持图像分类、检测、分割',
      endpoint: 'https://mcp.modelscope.cn/computer-vision',
      category: 'AI模型',
      version: '2.3.1',
      author: 'ModelScope Team',
      tags: ['计算机视觉', '图像识别', '目标检测'],
      configurable: true,
      configSchema: {
        task: { type: 'select', options: ['classification', 'detection', 'segmentation'], required: true },
        model: { type: 'select', options: ['resnet', 'yolo', 'mask-rcnn'], required: true },
        confidence: { type: 'number', min: 0, max: 1, default: 0.5 },
        nms: { type: 'boolean', default: true }
      },
      defaultConfig: {
        task: 'classification',
        model: 'resnet',
        confidence: 0.5,
        nms: true
      },
      documentation: 'https://modelscope.cn/docs/computer-vision',
      examples: [
        { name: '图像分类', prompt: '识别图片中的物体类别' },
        { name: '目标检测', prompt: '检测图片中的所有物体' }
      ],
      status: 'available'
    },
    {
      id: 'moda-nlp',
      name: 'ModelScope NLP Processing',
      description: '魔搭社区自然语言处理模型MCP服务，支持文本分析、情感分析',
      endpoint: 'https://mcp.modelscope.cn/nlp-processing',
      category: 'AI模型',
      version: '1.9.2',
      author: 'ModelScope Team',
      tags: ['NLP', '文本分析', '情感分析'],
      configurable: true,
      configSchema: {
        task: { type: 'select', options: ['sentiment', 'ner', 'classification'], required: true },
        model: { type: 'select', options: ['bert', 'roberta', 'albert'], required: true },
        language: { type: 'select', options: ['zh', 'en'], default: 'zh' }
      },
      defaultConfig: {
        task: 'sentiment',
        model: 'bert',
        language: 'zh'
      },
      documentation: 'https://modelscope.cn/docs/nlp-processing',
      examples: [
        { name: '情感分析', prompt: '分析这段文本的情感倾向' },
        { name: '命名实体识别', prompt: '识别文本中的人名、地名等实体' }
      ],
      status: 'available'
    },
    
    // 数据服务
    {
      id: 'moda-dataset',
      name: 'ModelScope Dataset Access',
      description: '魔搭社区数据集访问MCP服务，提供海量开源数据集',
      endpoint: 'https://mcp.modelscope.cn/dataset-access',
      category: '数据服务',
      version: '1.4.5',
      author: 'ModelScope Team',
      tags: ['数据集', '开源', '机器学习'],
      configurable: true,
      configSchema: {
        datasetType: { type: 'select', options: ['image', 'text', 'audio', 'video'], required: true },
        format: { type: 'select', options: ['json', 'csv', 'parquet'], default: 'json' },
        batchSize: { type: 'number', min: 1, max: 1000, default: 32 },
        shuffle: { type: 'boolean', default: true }
      },
      defaultConfig: {
        datasetType: 'image',
        format: 'json',
        batchSize: 32,
        shuffle: true
      },
      documentation: 'https://modelscope.cn/docs/dataset-access',
      examples: [
        { name: '图像数据集', prompt: '加载CIFAR-10图像数据集' },
        { name: '文本数据集', prompt: '加载IMDB电影评论数据集' }
      ],
      status: 'available'
    },
    {
      id: 'moda-data-proc',
      name: 'ModelScope Data Processing',
      description: '魔搭社区数据处理MCP服务，支持数据清洗、预处理',
      endpoint: 'https://mcp.modelscope.cn/data-processing',
      category: '数据服务',
      version: '1.2.8',
      author: 'ModelScope Team',
      tags: ['数据处理', '清洗', '预处理'],
      configurable: true,
      configSchema: {
        operation: { type: 'select', options: ['clean', 'normalize', 'augment'], required: true },
        method: { type: 'select', options: ['standard', 'minmax', 'robust'], default: 'standard' },
        removeOutliers: { type: 'boolean', default: true },
        fillMissing: { type: 'select', options: ['mean', 'median', 'mode'], default: 'mean' }
      },
      defaultConfig: {
        operation: 'clean',
        method: 'standard',
        removeOutliers: true,
        fillMissing: 'mean'
      },
      documentation: 'https://modelscope.cn/docs/data-processing',
      examples: [
        { name: '数据清洗', prompt: '清洗包含缺失值和异常值的数据' },
        { name: '数据标准化', prompt: '对数据进行标准化处理' }
      ],
      status: 'available'
    },
    {
      id: 'moda-model-hub',
      name: 'ModelScope Model Hub',
      description: '魔搭社区模型中心MCP服务，提供模型搜索、下载、管理',
      endpoint: 'https://mcp.modelscope.cn/model-hub',
      category: '数据服务',
      version: '2.0.1',
      author: 'ModelScope Team',
      tags: ['模型中心', '模型管理', '模型搜索'],
      configurable: true,
      configSchema: {
        searchType: { type: 'select', options: ['name', 'tag', 'author'], required: true },
        sortBy: { type: 'select', options: ['popularity', 'recent', 'rating'], default: 'popularity' },
        limit: { type: 'number', min: 1, max: 100, default: 20 },
        includePrivate: { type: 'boolean', default: false }
      },
      defaultConfig: {
        searchType: 'name',
        sortBy: 'popularity',
        limit: 20,
        includePrivate: false
      },
      documentation: 'https://modelscope.cn/docs/model-hub',
      examples: [
        { name: '搜索模型', prompt: '搜索文本生成相关的模型' },
        { name: '下载模型', prompt: '下载指定的预训练模型' }
      ],
      status: 'available'
    },
    
    // 开发工具
    {
      id: 'moda-training',
      name: 'ModelScope Training Pipeline',
      description: '魔搭社区训练流水线MCP服务，支持模型训练、微调',
      endpoint: 'https://mcp.modelscope.cn/training-pipeline',
      category: '开发工具',
      version: '1.7.3',
      author: 'ModelScope Team',
      tags: ['模型训练', '微调', '流水线'],
      configurable: true,
      configSchema: {
        task: { type: 'select', options: ['train', 'finetune', 'evaluate'], required: true },
        framework: { type: 'select', options: ['pytorch', 'tensorflow', 'paddle'], required: true },
        epochs: { type: 'number', min: 1, max: 1000, default: 10 },
        batchSize: { type: 'number', min: 1, max: 256, default: 32 },
        learningRate: { type: 'number', min: 0.0001, max: 1, default: 0.001 },
        optimizer: { type: 'select', options: ['adam', 'sgd', 'adamw'], default: 'adam' }
      },
      defaultConfig: {
        task: 'train',
        framework: 'pytorch',
        epochs: 10,
        batchSize: 32,
        learningRate: 0.001,
        optimizer: 'adam'
      },
      documentation: 'https://modelscope.cn/docs/training-pipeline',
      examples: [
        { name: '模型训练', prompt: '训练一个新的深度学习模型' },
        { name: '模型微调', prompt: '在预训练模型基础上进行微调' }
      ],
      status: 'available'
    },
    {
      id: 'moda-eval',
      name: 'ModelScope Evaluation',
      description: '魔搭社区模型评估MCP服务，支持多种评估指标',
      endpoint: 'https://mcp.modelscope.cn/evaluation',
      category: '开发工具',
      version: '1.3.6',
      author: 'ModelScope Team',
      tags: ['模型评估', '指标', '测试'],
      configurable: true,
      configSchema: {
        metrics: { type: 'checkbox', options: ['accuracy', 'precision', 'recall', 'f1'], required: true },
        dataset: { type: 'select', options: ['test', 'validation', 'custom'], required: true },
        crossValidation: { type: 'boolean', default: false },
        kFold: { type: 'number', min: 2, max: 10, default: 5 }
      },
      defaultConfig: {
        metrics: ['accuracy', 'f1'],
        dataset: 'test',
        crossValidation: false,
        kFold: 5
      },
      documentation: 'https://modelscope.cn/docs/evaluation',
      examples: [
        { name: '模型评估', prompt: '评估模型在测试集上的性能' },
        { name: '交叉验证', prompt: '使用交叉验证评估模型稳定性' }
      ],
      status: 'available'
    },
    {
      id: 'moda-deploy',
      name: 'ModelScope Deployment',
      description: '魔搭社区模型部署MCP服务，支持云端部署、边缘部署',
      endpoint: 'https://mcp.modelscope.cn/deployment',
      category: '开发工具',
      version: '1.6.4',
      author: 'ModelScope Team',
      tags: ['模型部署', '云端', '边缘计算'],
      configurable: true,
      configSchema: {
        platform: { type: 'select', options: ['cloud', 'edge', 'mobile'], required: true },
        instance: { type: 'select', options: ['cpu', 'gpu', 'tpu'], required: true },
        replicas: { type: 'number', min: 1, max: 10, default: 1 },
        autoScale: { type: 'boolean', default: true },
        maxReplicas: { type: 'number', min: 1, max: 100, default: 10 }
      },
      defaultConfig: {
        platform: 'cloud',
        instance: 'gpu',
        replicas: 1,
        autoScale: true,
        maxReplicas: 10
      },
      documentation: 'https://modelscope.cn/docs/deployment',
      examples: [
        { name: '云端部署', prompt: '将模型部署到云端服务器' },
        { name: '边缘部署', prompt: '将模型部署到边缘设备' }
      ],
      status: 'available'
    }
  ];

  useEffect(() => {
    loadModaServices();
  }, []);

  const loadModaServices = async () => {
    setLoading(true);
    try {
      // TODO: 调用实际API获取魔搭社区所有服务
      // const response = await getModaMCPServices();
      // setServices(response.data);
      
      // 使用模拟数据
      setTimeout(() => {
        setServices(mockModaServices);
        setLoading(false);
      }, 1000);
    } catch (error) {
      message.error('获取魔搭社区服务失败');
      setLoading(false);
    }
  };

  const handleServiceSelect = (serviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedServices(prev => [...prev, serviceId]);
    } else {
      setSelectedServices(prev => prev.filter(id => id !== serviceId));
    }
  };

  const handleBatchImport = async () => {
    if (selectedServices.length === 0) {
      message.warning('请选择要导入的服务');
      return;
    }

    try {
      setLoading(true);
      const servicesToImport = services.filter(service => 
        selectedServices.includes(service.id)
      );
      
      // TODO: 调用实际API批量导入服务
      // await batchImportModaServices(tenantId, servicesToImport);
      
      message.success(`成功导入 ${servicesToImport.length} 个服务`);
      setSelectedServices([]);
      
      if (onServiceImport) {
        onServiceImport(servicesToImport);
      }
    } catch (error) {
      message.error('批量导入服务失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureService = (service: ModaMCPService) => {
    setCurrentService(service);
    configForm.setFieldsValue(service.defaultConfig);
    setIsConfigModalVisible(true);
  };

  const handleConfigSubmit = async (values: any) => {
    if (!currentService) return;

    try {
      setLoading(true);
      // TODO: 调用实际API配置服务
      // await configureModaService(tenantId, currentService.id, values);
      
      message.success('服务配置成功');
      setIsConfigModalVisible(false);
      
      if (onServiceConfigure) {
        onServiceConfigure(currentService, values);
      }
    } catch (error) {
      message.error('服务配置失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'available':
        return <Tag color="blue">可用</Tag>;
      case 'installed':
        return <Tag color="green">已安装</Tag>;
      case 'configured':
        return <Tag color="orange">已配置</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const renderConfigField = (key: string, schema: any) => {
    const { type, options, min, max, default: defaultValue, required } = schema;

    switch (type) {
      case 'select':
        return (
          <Select
            placeholder={`请选择${key}`}
            options={options.map((opt: string) => ({ label: opt, value: opt }))}
          />
        );
      case 'number':
        return (
          <InputNumber
            min={min}
            max={max}
            placeholder={`请输入${key}`}
            style={{ width: '100%' }}
          />
        );
      case 'boolean':
        return <Switch />;
      case 'checkbox':
        return (
          <Checkbox.Group
            options={options.map((opt: string) => ({ label: opt, value: opt }))}
          />
        );
      default:
        return <Input placeholder={`请输入${key}`} />;
    }
  };

  const columns = [
    {
      title: '选择',
      key: 'select',
      width: 60,
      render: (_, record: ModaMCPService) => (
        <Checkbox
          checked={selectedServices.includes(record.id)}
          onChange={(e) => handleServiceSelect(record.id, e.target.checked)}
        />
      ),
    },
    {
      title: '服务名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ModaMCPService) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.description}</div>
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: ModaMCPService) => (
        <Space>
          <Tooltip title="配置服务">
            <Button
              type="link"
              icon={<SettingOutlined />}
              onClick={() => handleConfigureService(record)}
              disabled={!record.configurable}
            >
              配置
            </Button>
          </Tooltip>
          <Tooltip title="查看文档">
            <Button
              type="link"
              icon={<LinkOutlined />}
              onClick={() => window.open(record.documentation, '_blank')}
            >
              文档
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 获取所有分类
  const categories = ['all', ...Array.from(new Set(services.map(service => service.category)))];
  
  // 筛选服务
  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchText.toLowerCase()) ||
                         service.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>魔搭社区MCP服务配置</h3>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>
            配置和导入魔搭社区的所有MCP服务，支持批量操作和个性化配置
          </p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadModaServices}>
            刷新
          </Button>
          <Button 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={handleBatchImport}
            disabled={selectedServices.length === 0}
          >
            批量导入 ({selectedServices.length})
          </Button>
        </Space>
      </div>

      <Alert
        message="魔搭社区MCP服务"
        description="这里展示了魔搭社区提供的所有MCP服务。您可以选择单个或多个服务进行配置和导入。每个服务都支持个性化配置，包括模型参数、处理选项等。"
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
      />

      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Input
            placeholder="搜索服务名称、描述或标签..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            style={{ width: 150 }}
          >
            <Select.Option value="all">全部分类</Select.Option>
            {categories.filter(cat => cat !== 'all').map(category => (
              <Select.Option key={category} value={category}>{category}</Select.Option>
            ))}
          </Select>
          <div style={{ marginLeft: 'auto', color: '#666' }}>
            共 {filteredServices.length} 个服务
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredServices}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个服务`,
          }}
        />
      </Card>

      {/* 服务配置模态框 */}
      <Modal
        title={`配置服务: ${currentService?.name}`}
        open={isConfigModalVisible}
        onCancel={() => setIsConfigModalVisible(false)}
        footer={null}
        width={800}
      >
        {currentService && (
          <div>
            <Alert
              message="服务配置"
              description={currentService.description}
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <Form
              form={configForm}
              layout="vertical"
              onFinish={handleConfigSubmit}
            >
              {Object.entries(currentService.configSchema || {}).map(([key, schema]: [string, any]) => (
                <Form.Item
                  key={key}
                  name={key}
                  label={key}
                  rules={[{ required: schema.required, message: `请输入${key}` }]}
                >
                  {renderConfigField(key, schema)}
                </Form.Item>
              ))}

              {currentService.examples && currentService.examples.length > 0 && (
                <>
                  <Divider>使用示例</Divider>
                  <div style={{ marginBottom: '16px' }}>
                    {currentService.examples.map((example, index) => (
                      <Card key={index} size="small" style={{ marginBottom: '8px' }}>
                        <div style={{ fontWeight: 500, marginBottom: '4px' }}>{example.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{example.prompt}</div>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setIsConfigModalVisible(false)}>
                    取消
                  </Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    保存配置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ModaMCPConfigurator;
