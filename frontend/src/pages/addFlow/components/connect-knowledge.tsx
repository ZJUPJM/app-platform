/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, {useEffect, useImperativeHandle, useRef, useState} from 'react';
import {Modal, Typography} from 'antd';
import {useTranslation} from 'react-i18next';
import {useHistory} from 'react-router-dom';
import {useAppDispatch, useAppSelector} from '@/store/hook';
import {setIsAutoOpen} from '@/store/common/common';
import {
  addKnowledgeConfig,
  getConnectKnowledgeList,
  getKnowLedgeConfig,
  getKnowledgeConfigId,
  updateKnowledgeConfig,
} from '@/shared/http/knowledge';
import BookIcon from '@/assets/images/ai/connect-knowledge.png';
import '../styles/connect-knowledge.scss'
import KnowledgeHelperDrawer from "./knowledge-helper-drawer";
import store from "@/store/store";
import {setKnowledgeConfig} from "@/store/chatStore/chatStore";
import {Message} from "@/shared/utils/message";

/**
 * 连接知识库弹框
 *
 * @param modelRef 当前组件ref.
 * @param groupId 父组件组件groupId.
 * @param updateKnowledgeConfig 更新父组件配置的方法.
 * @return {JSX.Element}
 * @constructor
 */

const ConnectKnowledge = ({ modelRef, groupId, updateKnowledgeOption}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useHistory().push;
  const [open, setOpen] = useState(false);
  const [connectList, setConnectList] = useState([]);
  const [chosenId, setChosenId] = useState(groupId);
  const [knowledgeConfigId, setKnowledgeConfigId] = useState('');
  const helpRef = useRef();
  const apiKeyRef = useRef<HTMLTextAreaElement>(null);
  const knowledgeConfig =  useAppSelector((state) => state.chatCommonStore.knowledgeConfig);

  useImperativeHandle(modelRef, () => {
    return { openModal: () => setOpen(true) };
  });

  // 确定
  const confirm = () => {
    setOpen(false);
    const apiKey = apiKeyRef.current?.value || '';
    if (!apiKey.trim()) {
      return;
    }
    const updateConfig = store.getState().chatCommonStore.knowledgeConfig;
    if (updateConfig) {
      updateConfig.apiKey = apiKey;
      updateKnowledgeConfig(updateConfig);
      store.dispatch(setKnowledgeConfig(updateConfig));
      updateKnowledgeOption(updateConfig.groupId, updateConfig.knowledgeConfigId);
      Message({type: 'success', content: t('updateKnowledgeConfigSucceeded')});
    } else if (connectList && connectList.length != 0) {
      const firstItem = connectList[0];
      const newConfig = {
        name: firstItem.name || '',
        groupId: firstItem.groupId || '',
        apiKey: apiKey,
        isDefault: true,
      };
      addKnowledgeConfig(newConfig).then((res) => {
        if (res.code === 0) {
          store.dispatch(setKnowledgeConfig(res.data));
          updateKnowledgeOption(firstItem.groupId, res.data.knowledgeConfigId);
          Message({type: 'success', content: t('updateKnowledgeConfigSucceeded')});
        } else {
          Message({type: 'error', content: t('updateKnowledgeConfigFailed')});
        }
      })
    }
  };

  // 获取知识库列表
  const getConnectList = async () => {
    try {
      const res = await getConnectKnowledgeList();
      if (res.code === 0 && res.data) {
        setConnectList(res.data);
      }
    } catch (error) { }
  };

  // 跳转到上传插件页面
  const goPluginPage = () => {
    dispatch(setIsAutoOpen(true));
    navigate(`/plugin`);
  };

  // 选择知识库集回调
  const onClickKnowledgeSet = async (groupId: String) => {
    setChosenId(groupId);
    const res = await getKnowledgeConfigId(groupId);
    if (res.code === 0) {
      setKnowledgeConfigId(res.data);
    }
  }

  useEffect(() => {
    if (open) {
      getConnectList();
      setChosenId(groupId);
    }
  }, [open]);

  useEffect(() => {
    dispatch(setIsAutoOpen(false));
  }, []);

  function openKnowledgeHelper() {
    helpRef.current?.openHelp();
  }

  useEffect(() => {
    const fetchData = async () => {
      const res = await getKnowLedgeConfig();
      if (res.code !== 0) {
         return;
      }
      store.dispatch(setKnowledgeConfig(res.data));
    };
    fetchData();
    return () => {};
  }, []);

  useEffect(() => {
    if (!apiKeyRef.current) {
      return;
    }
    const latestConfig = store.getState().chatCommonStore.knowledgeConfig;
    if (latestConfig) {
      apiKeyRef.current.value = latestConfig.apiKey || '';
    }
  }, [apiKeyRef.current]);

  return <>
    <Modal
      title={t('connect') + t('knowledgeBase')}
      open={open}
      width={550}
      className='connect-knowledge'
      onOk={confirm}
      onCancel={() => setOpen(false)}
    >
      <div className='connect-list'>
        {
          connectList.map(item =>
            <div className={`knowledge-item`}>
              <div className='knowledge-title' style={{ display: 'flex', alignItems: 'center' }}>
                <img src={BookIcon} alt="" style={{ marginRight: 8 }} />
                {item.name}
                <Typography.Link onClick={openKnowledgeHelper} className='use-help'
                                 style={{ marginLeft: 'auto' }} >
                  {t('help')}
                </Typography.Link>
              </div>
              <div className='knowledge-desc'
                   title={`${item.description}`}>{item.description}
              </div>
            </div>
          )
        }
      </div>
      <div class="connect-api-key-header">
         API Key
      </div>
      <textarea class="connect-api-key-input" ref={apiKeyRef}>
      </textarea>
      <KnowledgeHelperDrawer
        helpRef={helpRef}
      />
    </Modal>
  </>
};

export default ConnectKnowledge;
