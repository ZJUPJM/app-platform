/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useContext, useState } from 'react';
import { Modal, Input } from 'antd';
import { toClipboard } from '@/shared/utils/common';
import { CopyIcon, DeleteIcon, LikeIcon, UnlikeIcon, LikeSelectIcon, UnlikeSelectIcon } from '@/assets/icon';
import { ChatContext } from '../../../aippIndex/context';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';
import { Message } from '@/shared/utils/message';
import { feedbacksRq, updateFeedback, deleteFeedback } from '@/shared/http/chat';
import {
  guestModeFeedbacksRq,
  guestModeUpdateFeedback,
  guestModeDeleteFeedback,
} from '@/shared/http/guest';
import './styles/action-buttons.scss';

interface ActionButtonsProps {
  content: string;
  formConfig?: any;
  instanceId?: string;
  feedbackStatus?: number;
  refreshFeedbackStatus?: (instanceId: string) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  content,
  formConfig = {},
  instanceId,
  feedbackStatus,
  refreshFeedbackStatus
}) => {
  const { t } = useTranslation();
  const { setShareClass } = useContext(ChatContext);
  const chatList = useAppSelector((state) => state.chatCommonStore.chatList);
  const chatRunning = useAppSelector((state) => state.chatCommonStore.chatRunning);
  const isGuest = useAppSelector((state) => state.appStore.isGuest);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [textValue, setTextValue] = useState('');

  // 检验是否正在对话中
  const isChatRunning = () => {
    let hasRunning = chatList.filter((item: any) => item.status === 'RUNNING')[0];
    if (chatRunning || hasRunning) {
      Message({ type: 'warning', content: t('tryLater') });
      return true;
    }
    return false;
  }

  // 复制功能
  const handleCopy = () => {
    content && toClipboard(content);
  }

  // 删除功能
  const handleDelete = () => {
    if (isChatRunning()) { return; }
    setShareClass('delete');
  }

  // 点赞功能
  const handleLike = async () => {
    if (!instanceId || !refreshFeedbackStatus) return;
    
    if (feedbackStatus === -1 || feedbackStatus === undefined) {
      let params = { userFeedback: '0', userFeedbackText: '', instanceId: instanceId };
      isGuest ? await guestModeFeedbacksRq(params) : await feedbacksRq(params);
    } else if (feedbackStatus === 0) {
      isGuest ? await guestModeDeleteFeedback(instanceId) : await deleteFeedback(instanceId);
    } else {
      let data = { userFeedback: '0', userFeedbackText: '' };
      isGuest ? await guestModeUpdateFeedback(instanceId, data) : await updateFeedback(instanceId, data);
    }
    refreshFeedbackStatus(instanceId);
  }

  // 点踩功能
  const handleUnlike = () => {
    if (!instanceId || !refreshFeedbackStatus) return;
    
    setTextValue('');
    if (feedbackStatus !== 1) {
      setIsModalOpen(true);
    } else {
      handleUnlikeConfirm();
    }
  }

  const handleUnlikeConfirm = async () => {
    if (!instanceId || !refreshFeedbackStatus) return;
    
    if (feedbackStatus === -1 || feedbackStatus === undefined) {
      let params = { userFeedback: '1', userFeedbackText: textValue, instanceId: instanceId };
      isGuest ? await guestModeFeedbacksRq(params) : await feedbacksRq(params);
    } else if (feedbackStatus === 1) {
      isGuest ? await guestModeDeleteFeedback(instanceId) : await deleteFeedback(instanceId);
    } else {
      let data = { userFeedback: '1', userFeedbackText: textValue };
      isGuest
        ? await guestModeUpdateFeedback(instanceId, data)
        : await updateFeedback(instanceId, data);
    }
    refreshFeedbackStatus(instanceId);
  }

  const handleModalOk = async () => {
    setIsModalOpen(false);
    handleUnlikeConfirm();
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  const handleTextChange = (e: any) => {
    setTextValue(e.target.value);
  };

  return (
    <>
      <div className='action-buttons'>
        {/* 复制按钮 */}
        <div className='action-btn' title={t('copy')} onClick={handleCopy}>
          <CopyIcon />
        </div>

        {/* 删除按钮 - 根据formConfig条件显示 */}
        {formConfig.formName !== 'questionClar' && (
          <div className='action-btn' title={t('delete')} onClick={handleDelete}>
            <DeleteIcon />
          </div>
        )}

        {/* 点赞按钮 */}
        {feedbackStatus !== 0 && (
          <div className='action-btn' title={t('like')} onClick={handleLike}>
            <LikeIcon />
          </div>
        )}
        {feedbackStatus === 0 && (
          <div className='action-btn action-btn-active' title={t('like')} onClick={handleLike}>
            <LikeSelectIcon />
          </div>
        )}

        {/* 点踩按钮 */}
        {feedbackStatus !== 1 && (
          <div className='action-btn' title={t('unLike')} onClick={handleUnlike}>
            <UnlikeIcon />
          </div>
        )}
        {feedbackStatus === 1 && (
          <div className='action-btn action-btn-active' title={t('unLike')} onClick={handleUnlike}>
            <UnlikeSelectIcon />
          </div>
        )}
      </div>

      {/* 点踩反馈弹窗 */}
      <Modal
        title={t('feedback')}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        centered
      >
        <Input.TextArea
          rows={4}
          placeholder={t('plsEnter')}
          value={textValue}
          onChange={handleTextChange}
        />
      </Modal>
    </>
  );
};

export default ActionButtons;
