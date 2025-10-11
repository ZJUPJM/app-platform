/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useEffect, useState, useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, InputNumber, Input, Switch, Popover, Empty, Select } from 'antd';
import { isInputEmpty, getConfiguration } from '@/shared/utils/common';
import { AippContext } from '@/pages/aippIndex/context';
import { useAppSelector } from '@/store/hook';
import { setSpaClassName } from '@/shared/utils/common';
import CloseImg from '@/assets/images/close_btn.svg';
import '../styles/configuration.scss';


/**
 * 多输入对话配置弹框组件
 *
 * @param appInfo 应用详情.
 * @param updateUserContext 更新userContext字段方法.
 * @param chatRunning 是否在对话中.
 * @param isChatRunning 在对话中进行提示操作.
 * @param display 是否显示.
 * @return {JSX.Element}
 * @constructor
 */
const ConversationConfiguration = ({ appInfo, updateUserContext, chatRunning, isChatRunning, display }) => {
  const { t } = useTranslation();
  const atAppInfo = useAppSelector((state) => state.appStore.atAppInfo);
  const [open, setOpen] = useState(false);
  const [configAppInfo, setConfigAppInfo] = useState({});
  const [form] = Form.useForm();
  const [configurationList, setConfigurationList] = useState([]);
  const preConfigurationList = useRef([]);
  const { showElsa } = useContext(AippContext);

  // 更新值
  const updateData = () => {
    updateUserContext(form.getFieldsValue());
  };

  const handleNumberChange = (value, isInteger, name) => {
    if (isNaN(value)) {
      form.setFieldValue(name, null);
    } else if (value === '') {
      form.setFieldValue(name, null);
    } else {
      let inputNumber = isInteger ? value : Number(value).toFixed(2);
      if (isInteger) {
        if (value > 999999999) {
          inputNumber = 999999999;
        } else if (value < -999999999) {
          inputNumber = -999999999;
        }
      } else {
        if (value > 999999999.99) {
          inputNumber = 999999999.99;
        } else if (value < -999999999.99) {
          inputNumber = -999999999.99;
        }
      }
      form.setFieldValue(name, Number(inputNumber));
    }
    updateData();
  };

  const handleOpen = (e) => {
    if (e.detail.openInput) {
      setOpen(true);
    }
  };

  useEffect(() => {
    window.addEventListener("mutipleInputRequied", handleOpen);
    return () => {
      window.removeEventListener("mutipleInputRequied", handleOpen);
    }
  }, []);

  // 根据类型获取输入类型
  const getConfigurationItem = ({ name, type, appearance = {}, value}) => {
    const displayType = appearance?.displayType;

    // 优先使用 displayType 分支渲染
    switch (displayType) {
      case 'textInput':
        return (
          <Input
            style={{ width: 400 }}
            maxLength={appearance.maxLength || undefined}
            showCount
            value={value}
            onChange={updateData}
          />
        );
      case 'numberInput':
        return (
          <InputNumber
            style={{ width: 150 }}
            controls
            step={0.01}
            precision={2}
            min={appearance.minValue ?? undefined}
            max={appearance.maxValue ?? undefined}
            value={value}
            onChange={(e) => handleNumberChange(e, false, name)}
          />
        );
      case 'switch':
        return <Switch onChange={updateData} checked={!!value}/>;
      case 'dropdown':
        return (
          <Select
            style={{ width: 200 }}
            allowClear={true}
            value={value}
            onChange={updateData}
          >
            {(appearance.options || []).map((opt, idx) => (
              <Select.Option key={`${opt}-${idx}`} value={opt}>
                {opt}
              </Select.Option>
            ))}
          </Select>
        );
        case 'multiselect':
          return (
            <Select
              style={{ width: 200 }}
              allowClear={true}
              value={value}
              onChange={updateData}
              mode="multiple"
              showArrow={true}
              showSearch={false}
            >
              {(appearance.options || []).map((opt, idx) => (
                <Select.Option key={`${opt}-${idx}`} value={opt}>
                  {opt}
                </Select.Option>
              ))}
            </Select>
          );
    }

    // 如果没有 appearance.displayType，退回旧逻辑
    switch (type) {
      case 'String':
        return (
          <Input
            style={{ width: 400 }}
            maxLength={500}
            showCount
            onChange={updateData}
          />
        );
      case 'Number':
        return (
          <InputNumber
            style={{ width: 150 }}
            controls
            keyboard
            step={0.01}
            precision={2}
            min={-999999999.99}
            max={999999999.99}
            onChange={(e) => handleNumberChange(e, false, name)}
          />
        );
      case 'Integer':
        return (
          <InputNumber
            style={{ width: 150 }}
            keyboard
            parser={(value) => value.replace(/[^\d-]/g, '')}
            formatter={(value) => (value === '0' ? '0' : `${Math.floor(value) || ''}`)}
            min={-999999999}
            max={999999999}
            onChange={(e) => handleNumberChange(e, true, name)}
          />
        );
      case 'Boolean':
        return <Switch onChange={updateData} />;
      default:
        return <Input style={{ width: 400 }} onChange={updateData} />;
    }
  };

  // 给表单赋初始值
  useEffect(() => {
    if (configurationList?.length) {
      configurationList.forEach(item => {
        const preItem = preConfigurationList.current.find(it => it.name === item.name);
        const isChangeType = preItem?.type !== item.type;
        if (item.type === 'Boolean') {
          form.setFieldValue(item.name, isChangeType ? false : (form.getFieldValue(item.name) || false));
        } else {
          form.setFieldValue(item.name, isChangeType ? null : ((isInputEmpty(form.getFieldValue(item.name)) ? null : form.getFieldValue(item.name))));
        }
      })
      updateData();
    }
    preConfigurationList.current = configurationList;
  }, [configurationList]);

  useEffect(() => {
    if (open) {
      setConfigurationList(getConfiguration(configAppInfo));
      if (isChatRunning()) {
        setOpen(false);
      }
    }
  }, [open]);

  useEffect(() => {
    if (chatRunning) {
      setOpen(false);
    }
  }, [chatRunning]);

  useEffect(() => {
    setOpen(false);
    setConfigAppInfo(atAppInfo || appInfo || {});
  }, [atAppInfo, appInfo]);

  useEffect(() => {
    const configuration = getConfiguration(configAppInfo);
    setConfigurationList(configuration);
    setOpen(configuration?.length > 0);
  }, [configAppInfo]);

  useEffect(() => {
    if (showElsa) {
      setOpen(false);
    }
  }, [showElsa]);

  useEffect(() => {
    if (configurationList?.length) {
      configurationList.forEach(item => {
        const preItem = preConfigurationList.current.find(it => it.name === item.name);
        const isChangeType = preItem?.type !== item.type;

        // 若已有值，保持不变，否则设置为默认值
        const existingValue = form.getFieldValue(item.name);
        const defaultValue = item.value ?? null;

        if (item.type === 'Boolean') {
          form.setFieldValue(item.name, isChangeType ? false : (existingValue ?? defaultValue ?? false));
        } else {
          const isEmpty = isInputEmpty(existingValue); // 你已有此函数
          form.setFieldValue(item.name, isChangeType ? null : (isEmpty ? defaultValue : existingValue));
        }
      });
      updateData();
    }
    preConfigurationList.current = configurationList;
  }, [configurationList]);


  const content = (
    <>
      <div className='configuration-header'>
        <span className='configuration-title'>{t('conversationConfiguration')}</span>
        <img src={CloseImg} alt="" onClick={() => setOpen(false)} />
      </div>
      <div className='configuration-content'>
        {
          configurationList?.length > 0 ? <Form form={form} autoComplete='off'>
            {
              configurationList.map(config =>
                <Form.Item
                  key={config.id}
                  name={config.name}
                  label={config.displayName || ' '}
                  className={config.isRequired ? 'is-required' : ''}>
                  {getConfigurationItem({...config, value: form.getFieldValue(config.value)})}
                </Form.Item>
              )
            }
          </Form> : <Empty description={t('noData')}></Empty>
        }
      </div>
    </>
  );

  // 定义需要隐藏配置按钮的应用ID列表
  const hiddenConfigAppIds: string[] = [
    // 在这里添加需要隐藏配置按钮的应用ID
    // 'app-id-1',
    '4ef2c47cfd6b4b61b7f6f19ad92b1421',
  ];

  // 判断当前应用是否需要隐藏配置按钮
  const shouldHideConfigButton = hiddenConfigAppIds.includes((configAppInfo as any)?.id);

  return <>
    {
      configurationList.length > 0 && !shouldHideConfigButton &&
      <Popover
        placement="topLeft"
        arrowPointAtCenter
        open={display ? open : false}
        trigger={'click'}
        content={content}
        color='#fff'
        overlayClassName={setSpaClassName('configuration-tooltip')}
      >
        <div className="action-btn config-btn" onClick={() => setOpen(!open)}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 2.5C8.41421 2.5 8.75 2.16421 8.75 1.75C8.75 1.33579 8.41421 1 8 1C7.58579 1 7.25 1.33579 7.25 1.75C7.25 2.16421 7.58579 2.5 8 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 9C8.41421 9 8.75 8.66421 8.75 8.25C8.75 7.83579 8.41421 7.5 8 7.5C7.58579 7.5 7.25 7.83579 7.25 8.25C7.25 8.66421 7.58579 9 8 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 15.5C8.41421 15.5 8.75 15.1642 8.75 14.75C8.75 14.3358 8.41421 14 8 14C7.58579 14 7.25 14.3358 7.25 14.75C7.25 15.1642 7.58579 15.5 8 15.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{t('conversationConfig')}</span>
        </div>
      </Popover>
    }
  </>
};

export default ConversationConfiguration;
