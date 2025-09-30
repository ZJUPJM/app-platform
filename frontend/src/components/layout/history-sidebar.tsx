/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useEffect, useRef, useState } from 'react';
import { Dropdown, Tooltip, Modal, Spin, Empty } from 'antd';
import type { MenuProps } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import {
  EllipsisOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { clearChatHistory, getChatList, queryFeedback } from '@/shared/http/chat';
import { getChatRecentLog, getAppInfo } from '@/shared/http/aipp';
import { formatLocalDate } from '@/common/dataUtil';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { isChatRunning } from '@/shared/utils/chat';
import { setChatList, setChatRunning, setChatId, setOpenStar, setAtChatId } from '@/store/chatStore/chatStore';
import { setAtAppInfo, setAtAppId } from '@/store/appInfo/appInfo';
import { updateChatId } from "@/shared/utils/common";
import { historyChatProcess } from '@/pages/chatPreview/utils/chat-process';
import { useTranslation } from 'react-i18next';
import * as dayjs from 'dayjs'
import { Message } from '@/shared/utils/message';
import './history-sidebar.scss';

/**
 * 历史记录侧边栏组件
 *
 * @return {JSX.Element}
 * @param setListCurrentList 设置当前会话列表
 * @constructor
 */
interface HistorySidebarProps {
  setListCurrentList: any;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ setListCurrentList }) => {
  const { t } = useTranslation();
  const currentChat = useRef<any>(null);
  const dispatch = useAppDispatch();
  const appId = useAppSelector((state) => state.appStore.appId);
  const aippId = useAppSelector((state) => state.appStore.aippId);
  const appVersion = useAppSelector((state) => state.appStore.appVersion);
  const tenantId = useAppSelector((state) => state.appStore.tenantId);
  const chatId = useAppSelector((state) => state.chatCommonStore.chatId);
  const openStar = useAppSelector((state) => state.chatCommonStore.openStar);
  const inspirationOpen = useAppSelector((state) => state.chatCommonStore.inspirationOpen);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [deleteChatId, setDeleteChatId] = useState<string | null>(null);

  const refreshList = async () => {
    try {
      setLoading(true);
      const requestBody = {
        aipp_id: aippId,
        aipp_version: appVersion,
        offset: 0,
        limit: 1000, // 加载更多数据
        app_state: 'active'
      };
      const chatRes:any = await getChatList(tenantId, requestBody);
      let timeTag = [false, false, false];
      chatRes?.data?.results.forEach((item: any, idx: number) => {
        const uTime = dayjs.default(new Date(item?.update_time_timestamp));
        const cTime = dayjs.default(new Date(item?.current_time_timestamp));
        if (!timeTag[0] && uTime.isSame(cTime, 'day')) {
          timeTag[0] = true;
          item.categoryTag = 'today';
        } else if (!timeTag[1] && uTime.isSame(cTime, 'month') && !uTime.isSame(cTime, 'day')) {
          timeTag[1] = true;
          item.categoryTag = 'thisMonth';
        } else if (!timeTag[2] && uTime.isBefore(cTime, 'month')) {
          timeTag[2] = true;
          item.categoryTag = 'older';
        }
      });
      setData(chatRes?.data?.results || []);
    } finally {
      setLoading(false);
    }
  }

  // 删除单个对话
  const deleteSingleChat = async (chatIdToDelete: string) => {
    let params = {
      'chat_id': chatIdToDelete
    }
    if (isChatRunning() && (chatId === chatIdToDelete)) {
      Message({ type: 'warning', content: t('tryLater') });
      return;
    }
    setLoading(true);
    try {
      await clearChatHistory(tenantId, appId, params);
      let storageParams:any =  { 
        deleteAppId: appId, 
        deleteChatId: chatIdToDelete,
        type: 'deleteChat',
      }
      if (chatId === chatIdToDelete) {
        dispatch(setChatId(null));
        dispatch(setChatList([]));
        storageParams.refreshChat = true;
      }
      localStorage.setItem('storageMessage', JSON.stringify(storageParams));
      refreshList();
    } catch {
      setLoading(false);
    }
  }
  // 处理删除按钮点击
  const handleDeleteClick = (e: React.MouseEvent, chatIdToDelete: string) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发对话选择
    setDeleteChatId(chatIdToDelete);
    setDeleteOpen(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (deleteChatId) {
      await deleteSingleChat(deleteChatId);
      setDeleteOpen(false);
      setDeleteChatId(null);
    }
  };

  // 继续聊天
  const continueChat = async (chat_id: string, dimensionId = '') => {
    if (isChatRunning()) {
      Message({ type: 'warning', content: t('tryLater') })
      return;
    }
    dispatch(setChatRunning(false));
    dispatch(setChatList([]));
    setLoading(true);
    try {
      const chatListRes = await getChatRecentLog(tenantId, chat_id, appId);
      let chatItem = historyChatProcess(chatListRes);
      let chatArr = await Promise.all(chatItem.map(async (item) => {
        if (item.type === 'receive' && item?.instanceId) {
          const res: any = await queryFeedback(item.instanceId);
          item.feedbackStatus = res?.usrFeedback ?? -1
        }
        return item;
      }));
      setListCurrentList(chatArr);
      await dispatch(setChatList(chatArr));
      dispatch(setChatId(chat_id));
      updateChatId(chat_id, appId);
    } finally {
      setLoading(false);
    }
  }
  const removeTagContent = (content: string) => {
    if (!content) return '';
    return content.replace(/^[\s\S]*?<\/think>/, '');
  }


  useEffect(() => {
    if (appId && aippId) {
      refreshList();
    }
  }, [appId, aippId]);

  return (
    <div className="history-sidebar">
      <div className="history-sidebar-header">
        <div className="history-sidebar-title">
          <span>{t('historyChat')}</span>
        </div>
      </div>
      
      <div className="history-sidebar-content">
        <Spin spinning={loading}>
          {data.length > 0 && <div className='history-wrapper'>
            {data?.map((item:any) => (
              <div 
                className={`history-item ${chatId === item?.chat_id ? 'active' : ''}`} 
                key={item?.chat_id} 
                onClick={() => { 
                  currentChat.current = item; 
                  continueChat(item?.chat_id);
                }}
              >
                <div className='history-item-title'>{item?.chat_name}</div>
                <div 
                  className="history-item-delete"
                  onClick={(e) => handleDeleteClick(e, item?.chat_id)}
                >
                  <DeleteOutlined />
                </div>
              </div>
            ))}
          </div>
          }
          {data.length === 0 && <div
            className='history-wrapper flex-box'>
            <Empty description={t('noData')} />
          </div>}
        </Spin>
      </div>
      
      
      <Modal
        title={t('alert')}
        open={isDeleteOpen}
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteChatId(null);
        }}
      >
        <p>确认是否删除此条记录？</p>
      </Modal>
    </div>
  );
};

export default HistorySidebar;
