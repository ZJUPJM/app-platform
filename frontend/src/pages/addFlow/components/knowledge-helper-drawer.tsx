/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useState, useImperativeHandle } from 'react';
import { Drawer } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import LoginImg from '@/assets/images/knowledge/help/login.jpg';
import CreateApiKeyImg from '@/assets/images/knowledge/help/create_api_key.jpg';
import GetNewApiKeyImg from '@/assets/images/knowledge/help/get_new_api_key.jpg';
import GetVerificationCodeImg from '@/assets/images/knowledge/help/get_verification_code.jpg';
import IndexImg from '@/assets/images/knowledge/help/index.jpg';
import ApiKeyListImg from '@/assets/images/knowledge/help/api_key_list.jpg';

/**
 * API文档
 *
 * @param drawerOpen 抽屉是否打开.
 * @param url apiUrl.
 * @param setDrawerOpen 抽屉是否打开的方法.
 * @return {JSX.Element}
 * @constructor
 */
const KnowledgeHelperDrawer = ({ helpRef }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  useImperativeHandle(helpRef, () => {
    return { openHelp: () => setOpen(true) };
  });

  return (
    <Drawer
      title={t('help')}
      className='intelligent-form'
      maskClosable={false}
      closable={false}
      open={open}
      width={700}
      extra={
        <CloseOutlined
          onClick={() => {
            setOpen(false);
          }}
        />
      }
    >
      <div className='help-item'>
        <div className='help-title'>如何获取百度千帆知识库的 API Key </div>
        <div className='help-content'>
          <p className='help-p-title'>1. 访问千帆知识库官网：</p>
          <p style={{marginBottom: 0}}>首先进入<a href="https://console.bce.baidu.com/ai_apaas/dialogHome" target="_blank">千帆知识库官方网址</a>。若您是首次访问该网址，页面将会跳转至 <span style={{fontWeight: 'bold'}}>登录</span> 页面，详情可参照下图所示。</p>
          <div className='help-img-container'>
            <img src={LoginImg} style={{width: '100%'}} />
          </div>
          <p></p>
          <p className='help-p-title'>2. 完成登录及二次验证：</p>
          <p style={{marginBottom: 0}}>在登录页面，输入您的手机号和验证码。成功登录后，系统将引导您进入百度智能云的登录保护环节，此时需要您再次对相关信息予以验证，具体验证界面可参考下图展示内容。</p>
          <div className='help-img-container'>
            <img src={GetVerificationCodeImg} style={{width: '100%'}} />
          </div>
          <p></p>
          <p  className='help-p-title'>3. 进入千帆知识库官网首页：</p>
          <p style={{marginBottom: 0}}>待信息验证成功后，页面将自动跳转至百度千帆知识库的官网首页，如以下示意图所示。</p>
          <div className='help-img-container'>
            <img src={IndexImg} style={{width: '100%'}} />
          </div>
          <p></p>
          <p  className='help-p-title'>4. 查看 API Key 相关信息：</p>
          <p>进入官网首页后，在页面左侧的侧边栏中，找到 <span style={{fontWeight: 'bold'}}>“API Key”</span> 一栏并点击进入，在此页面您能够查看 API Key 的相关信息。需要注意的是，若您是首次进入该页面，API Key 栏显示为空，此时则需要您手动进行创建，详情可参考下图。</p>
          <div className='help-img-container'>
            <img src={ApiKeyListImg} style={{width: '100%'}} />
          </div>
          <p></p>
          <p  className='help-p-title'>5. 进入创建页面并配置信息：</p>
          <p>点击 <span style={{fontWeight: 'bold'}}>“创建 API Key”</span> 按钮，页面将跳转至创建页面。在该页面中，您可按照要求填入相应的名称，并在  <span style={{fontWeight: 'bold'}}>“权限配置”</span> 一栏，选择 <span style={{fontWeight: 'bold'}}>“全部产品权限”</span> 选项，相关操作界面可参照下图内容。</p>
          <div className='help-img-container'>
            <img src={CreateApiKeyImg} style={{width: '100%'}} />
          </div>
          <p></p>
          <p className='help-p-title'>6. 完成创建并复制 API Key：</p>
          <p>完成上述信息填写及配置后，点击 <span style={{fontWeight: 'bold'}}>“确定”</span> 按钮，即可成功创建 API Key。创建成功后，相应的 API Key 将会显示在页面上，您只需点击 <span style={{fontWeight: 'bold'}}>“复制”</span> 按钮，便可轻松复制已创建好的 API Key，具体操作界面可参考下图示例。</p>
          <div className='help-img-container'>
            <img src={GetNewApiKeyImg} style={{width: '100%'}} />
          </div>
        </div>
      </div>
    </Drawer>
  )
}
export default KnowledgeHelperDrawer;
