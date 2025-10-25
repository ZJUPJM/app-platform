/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Button } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { LeftArrowIcon, UploadIcon } from '@/assets/icon';
import { updateAppInfo } from '@/shared/http/aipp';
import { Message } from '@/shared/utils/message';
import { convertImgPath } from '@/common/util';
import { FlowContext, RenderContext } from '@/pages/aippIndex/context';
import EditTitleModal from '@/pages/components/edit-title-modal';
import PublishModal from '@/pages/components/publish-modal';
import TestModal from '@/pages/components/test-modal';
import TestStatus from '@/pages/components/test-status';
import TimeLineDrawer from '@/components/timeLine';
import { useTranslation } from 'react-i18next';
import { setTestStatus, setTestTime } from "@/store/flowTest/flowTest";
import { useAppSelector, useAppDispatch } from "@/store/hook";
import knowledgeImg from '@/assets/images/knowledge/knowledge-base.png';
import editImg from '@/assets/images/ai/edit.png';
import complateImg from '@/assets/images/ai/complate.png';
import publishImg from '@/assets/images/ai/publish.png';
import timeImg from '@/assets/images/ai/time.png';

/**
 * 工具流编排头部信息展示组件
 *
 * @return {JSX.Element}
 * @param handleDebugClick 点击调试回调
 * @param saveTime 自动保存时间
 * @constructor
 */
const AddHeader = (props) => {
  const dispatch = useAppDispatch();
  const history = useHistory();
  const { t } = useTranslation();
  const { handleDebugClick, workFlow, types, saveTime, updateAippCallBack } = props;
  const { appInfo, setFlowInfo } = useContext(FlowContext);
  const { elsaReadOnlyRef } = useContext(RenderContext);
  const [open, setOpen] = useState(false);
  const [imgPath, setImgPath] = useState('');
  const [showVersionTip, setShowVersionTip] = useState(false);
  const { tenantId, appId } = useParams();
  let editRef: any = useRef(null);
  let modalRef: any = useRef(null);
  let testRef: any = useRef(null);
  const testStatus = useAppSelector((state) => state.flowTestStore.testStatus);

  // 获取最新发布版本号
  const getLatestPublishedVersion = () => {
    // 如果有 latest_version 属性，说明有已发布的版本
    if (appInfo.attributes?.latest_version) {
      return appInfo.attributes.latest_version;
    }
    // 如果状态是 active，使用当前版本号
    if (appInfo.state === 'active' && appInfo.version) {
      return appInfo.version;
    }
    return null;
  };

  const latestPublishedVersion = getLatestPublishedVersion();

  // 只读模式状态：根据 graph 请求返回的错误码 90002910 来判断
  const [readOnlyMode, setReadOnlyMode] = useState(false);

  // 监听 elsaReadOnlyRef 的变化
  useEffect(() => {
    // 只对工具流类型启用只读模式检查
    if (types === 'waterFlow' && elsaReadOnlyRef) {
      // 定时检查 elsaReadOnlyRef 的值
      const checkReadOnly = setInterval(() => {
        if (elsaReadOnlyRef.current !== readOnlyMode) {
          setReadOnlyMode(elsaReadOnlyRef.current);
        }
      }, 100);
      
      return () => clearInterval(checkReadOnly);
    }
  }, [types, elsaReadOnlyRef, readOnlyMode]);

  // 处理版本提示框的显示/隐藏
  const toggleVersionTip = () => {
    setShowVersionTip(!showVersionTip);
  };

  // 关闭版本提示框
  const closeVersionTip = () => {
    setShowVersionTip(false);
    // 记录用户已查看过提示
    if (appId) {
      localStorage.setItem(`version_tip_viewed_${appId}`, 'true');
    }
  };

  // 检查是否首次进入已发布工具流详情页
  useEffect(() => {
    if (latestPublishedVersion && appId) {
      const hasViewed = localStorage.getItem(`version_tip_viewed_${appId}`);
      if (!hasViewed) {
        setShowVersionTip(true);
      }
    }
  }, [latestPublishedVersion, appId]);

  // 发布工具流
  const handleUploadFlow = () => {
    if (testStatus !== 'Finished') {
      testRef.current.showModal();
      return;
    }
    modalRef.current.showModal();
  }
  // 编辑工具流
  const handleEditClick = () => {
    editRef.current.showModal();
  }
  // 返回上一页
  const handleBackClick = () => {
    if (testStatus) {
      dispatch(setTestStatus(null));
      dispatch(setTestTime(0));
    }
    // 检查是否是工具流编辑页面
    const isWorkflow = window.location.href.indexOf('type=workFlow') !== -1;
    if (isWorkflow) {
      // 如果是工具流，直接导航到工具流列表页
      history.push('/tools/WATERFLOW');
    } else {
      // 否则使用 goBack
      history.goBack();
    }
  }
  // 保存回调
  function onFlowNameChange(params) {
    appInfo.name = params.name;
    appInfo.attributes.description = params.description;
    updateAppWorkFlow('waterFlow');
  }
  // 创建更新应用
  async function updateAppWorkFlow(optionType = '') {
    const res:any = await updateAppInfo(tenantId, appId, appInfo);
    if (res.code === 0) {
      Message({ type: 'success', content: t('editSuccess') });
      optionType && editRef.current.handleCancel();
      setFlowInfo(JSON.parse(JSON.stringify(appInfo)));
    } else {
      optionType && editRef.current.handleLoading();
    }
  }
  const versionDetail = () => {
    setOpen(true);
  }
  useEffect(() => {
    if (appInfo.attributes?.icon) {
      convertImgPath(appInfo.attributes.icon).then(res => {
        setImgPath(res);
      });
    }
  }, [appInfo]);
  return <>{(
    <div>
      <div className='app-header'>
        <div>
          <div className='logo'>
            { <LeftArrowIcon className='back-icon' onClick={handleBackClick} /> }
            {imgPath ? <img src={imgPath} /> : <img src={knowledgeImg} />}
            <span className='header-text' title={appInfo?.name}>{appInfo?.name}</span>
            {!readOnlyMode && <img className='edit-icon' src={editImg} onClick={handleEditClick} />}
            {latestPublishedVersion && (
              <div className='version-info-group'>
                <span 
                  className={`status-dot ${(appInfo.attributes?.latest_version || appInfo.state === 'active') ? 'active' : 'inactive'}`}
                />
                <span className='version-text'>v{latestPublishedVersion}</span>
                {!readOnlyMode && (
                  <QuestionCircleOutlined 
                    className='version-help-icon' 
                    onClick={toggleVersionTip}
                  />
                )}
              </div>
            )}
            {!latestPublishedVersion && (
              (appInfo.attributes?.latest_version || appInfo.state === 'active') ?
                (
                  <div className='status-tag'>
                    <img src={complateImg} />
                    <span>{t('active')}</span>
                  </div>
                ) :
                (
                  <div className='status-tag'>
                    <img src={publishImg} />
                    <span>{t('inactive')}</span>
                  </div>
                )
            )}
            {saveTime && <span>{t('autoSave')}：{saveTime}</span>}
            <TestStatus />
          </div>
          <div className='header-grid'>
          {
            (appInfo.attributes?.latest_version || appInfo.state === 'active') && !readOnlyMode &&
            <span className='history' onClick={versionDetail}>
              <img src={timeImg} />
            </span>
          }
          <Button
            className='header-btn test-btn'
            onClick={handleDebugClick}
            disabled={testStatus === 'Running'}
          >
            {t('debug')}
          </Button>
          {!readOnlyMode && (
            <Button
              type='primary'
              className='header-btn'
              onClick={handleUploadFlow}
              disabled={testStatus === 'Running'}
            >
              <UploadIcon />{t('publish')}
            </Button>
          )}
          </div>
        </div>
        {showVersionTip && latestPublishedVersion && !readOnlyMode && (
          <div className='version-tip-container'>
            <div className='version-tip-content'>
              <span className='version-tip-close' onClick={closeVersionTip}>×</span>
              <div className='version-tip-text'>
                最新发布版本：<strong>v{latestPublishedVersion}</strong>。修改流程后可继续发布，系统将自动升级版本号。已关联的应用不受影响，如需使用新版本请在应用中手动更新。
              </div>
            </div>
          </div>
        )}
      </div>
      {/* 工具流发布弹窗 */}
      <PublishModal
        modalRef={modalRef}
        appInfo={appInfo}
        publishType={types}
      />
      {/* 工具流发布未调试提示弹窗 */}
      <TestModal
        testRef={testRef}
        handleDebugClick={handleDebugClick}
      />
      {/* 工具流修改基础信息弹窗 */}
      <EditTitleModal
        modalRef={editRef}
        onFlowNameChange={onFlowNameChange}
        appInfo={appInfo}
      />
      {/* 工具流发布历史信息弹窗 */}
      <TimeLineDrawer
        open={open}
        setOpen={setOpen}
        updateAippCallBack ={updateAippCallBack }
        workflow={workFlow} type='waterFlow'
      />
    </div>
  )}</>
};


export default AddHeader;
