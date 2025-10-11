/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Spin, Tooltip } from 'antd';
import { AudioIcon, AudioActiveIcon, DeleteContentIcon } from '@/assets/icon';
import { Message } from '@/shared/utils/message';
import { messagePaste } from './utils';
import { deepClone } from '../../utils/chat-process';
import { useAppSelector, useAppDispatch } from '@/store/hook';
import { setUseMemory } from '@/store/common/common';
import { setSpaClassName, findConfigValue } from '@/shared/utils/common';
import { isChatRunning } from '@/shared/utils/chat';
import { uploadChatFile, voiceToText } from '@/shared/http/aipp';
import { useTranslation } from 'react-i18next';
import { cloneDeep } from 'lodash';
import Recommends from './components/recommends';
import EditorBtnHome from './components/editor-btn-home';
import EditorSelect from './components/editor-selet';
import FileList from './components/file-list';
import ConversationConfiguration from './components/conversation-configuration';
import ReferencingApp from './components/referencing-app';
import stopImg from '@/assets/images/ai/stop.png';
import '@/shared/utils/rendos';
import '../../styles/send-editor.scss';

/**
 * 应用聊天输入框组件
 *
 * @return {JSX.Element}
 * @param onSend 发送消息方法
 * @param onStop 终止会话方法
 * @param onClear 清空聊天记录方法
 * @param filterRef 设置当前会话列表list
 * @param showStop 是否显示终止会话按钮
 * @param stopLoading 终止会话按钮loading
 * @param setEditorShow 是否消息消息列表多选框
 * @param checkMutipleInput 校验多输入是否必填
 * @param setChatFileList 多模态设置文件列表
 * @param checkFileSuccess 多模态校验文件是否都上传成功
 * @constructor
 */

const AudioBtn = forwardRef((props: any, ref: any) => {
  const [active, setActive] = useState(props.active || false);
  useImperativeHandle(ref, () => {
    return {
      active,
      setActive,
    };
  });

  return <>{active ? <AudioActiveIcon className='active-audio-btn' /> : <AudioIcon />}</>;

});

const SendEditor = (props: any) => {
  const {
    onSend,
    onStop,
    onClear,
    chatType,
    filterRef,
    showStop,
    stopLoading,
    setEditorShow,
    checkMutipleInput,
    setChatFileList,
    checkFileSuccess,
    display
  } = props;
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [selectItem, setSelectItem] = useState({});
  const [selectDom, setSelectDom] = useState();
  const [showSelect, setShowSelect] = useState(false);
  const [showClear, setShowClear] = useState(false);
  const [showMask, setShowMask] = useState(false);
  const [recommondTop, setRecommondTop] = useState(0);
  const [textLenth, setTextLenth] = useState(0);
  const [openHistory, setOpenHistory] = useState(false);
  const [positionConfig, setPositionConfig] = useState({});
  const [fileList, setFileList] = useState([]);
  const [openUploadModal, setOpenUploadModal] = useState(() => null);
  const [multiFileConfig, setMultiFileConfig] = useState<any>({});
  const [thinkActive, setThinkActive] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [showAt, setShowAt] = useState(false);
  const [searchKey, setSearchKey] = useState('');
  const chatRunning = useAppSelector((state) => state.chatCommonStore.chatRunning);
  const loginStatus = useAppSelector((state) => state.chatCommonStore.loginStatus);
  const showMulti = useAppSelector((state) => state.commonStore.historySwitch);
  const chatList = useAppSelector((state) => state.chatCommonStore.chatList);
  const appInfo = useAppSelector((state) => state.appStore.appInfo);
  const editorRef = useRef<any>(null);
  const promptMapRef = useRef<any>([]);
  const recommondRef = useRef<any>(null);
  const isAlreadySent = useRef<any>(false);
  const isAutoSend = useRef<any>(false);
  const recommondListRef = useRef<any>([]);
  const isHomepage = location.hash.includes('home');
  const enableVoiceInput = false;
  const recording = useRef(false);
  const audioBtnRef = useRef<any>(null);
  const audioDomRef = useRef<any>(null);
  const appId = useAppSelector((state) => state.appStore.appId);
  const tenantId = useAppSelector((state) => state.appStore.tenantId);
  // 编辑器change事件
  function messageChange() {
    const editorDom = document.getElementById('ctrl-promet');
    let chatContent = editorDom?.innerText || '';
    setTextLenth(chatContent.length);
    setShowClear(() => {
      return editorRef.current.innerText.length > 0
    });
    
    // 检测@输入
    if (chatContent.startsWith('@')) {
      const contentAfterAt = chatContent.slice(1);
      setSearchKey(contentAfterAt ? contentAfterAt : '');
      setShowAt(true);
    } else {
      setShowAt(false);
    }
  }
  // 清除内容
  function clearContent() {
    editorRef.current.innerText = '';
    setShowClear(false);
  }
  // 快捷发送
  function messageKeyDown(e: any) {
    if (e.ctrlKey && e.keyCode === 13) {
      e.preventDefault();
      document.execCommand('insertLineBreak');
    } else if (e.keyCode === 13) {
      e.preventDefault();
      sendMessage();
    }
  }
  // 发送消息
  function sendMessage() {
    if (isChatRunning()) {
      Message({ type: 'warning', content: t('tryLater') });
      return;
    }
    if (!checkMutipleInput() || !checkFileSuccess()) {
      return;
    }
    let chatContent = document.getElementById('ctrl-promet')?.innerText;
    if (chatContent?.trim()) {
      if (fileList.length) {
        clearFileList();
      }
      onSend(chatContent);
      editorRef.current.innerText = '';
      setShowClear(false);
    }
  }
  // 清空上传文件列表
  function clearFileList() {
    isAlreadySent.current = true;
    setFileList([]);
  };
  // 设置灵感大全下拉
  function setFilterHtml(prompt: any, promptMap: any, strXss: any) {
    const editorDom = document.getElementById('ctrl-promet');
    if (prompt.trim().length > 0) {
      strXss ? editorDom!.innerHTML = prompt : editorDom!.innerText = prompt;
      setTextLenth(editorDom!.innerText.length);
      setShowClear(true);
    }
    if (promptMap.length) {
      promptMapRef.current = promptMap;
      document.body.addEventListener('click', bindEvents);
    }
  }
  // 绑定下拉事件
  function bindEvents(event: any) {
    let target = event.target;
    if (target.classList.contains('chat-focus')) {
      let filterType = target.dataset.type;
      let selectItem = promptMapRef.current.filter((item: any) => item.var === filterType)[0];
      selectItem.options = selectItem.options.filter((item: any) => item.trim().length > 0);
      selectItem.options = Array.from(new Set(selectItem.options));
      setPositionConfig(event.target.getBoundingClientRect());
      setSelectItem(deepClone(selectItem));
      setSelectDom(event.target);
      setShowSelect(true);
    } else {
      setShowSelect(false);
    }
  }
  useEffect(() => {
    return () => {
      document.body.removeEventListener('click', bindEvents);
    }
  }, []);

  // 点击外部区域关闭@选择框
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (showAt && !event.target.closest('.at-content')) {
        setShowAt(false);
      }
    };
    
    if (showAt) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showAt]);
  // 更新文件
  function updateFileList(paramFileList: any, autoSend: any) {
    if (isAlreadySent.current) {
      isAlreadySent.current = false;
    }
    isAutoSend.current = autoSend;
    setFileList(paramFileList);
  }
  useImperativeHandle(filterRef, () => {
    return {
      setFilterHtml: setFilterHtml,
      clearFileList,
    };
  });

  let recorderInstanceId = 0; // 添加实例ID
  // 语音实时转文字
  let recorderHome = useRef<any>(null);
  let intervalData = useRef<any>(null);
  // 点击语音按钮
  const onRecord = async () => {
    if (isChatRunning()) {
      return;
    }
    if (!recording.current) {
      recorderInstanceId++; // 每次创建新实例时递增
      (window as any).HZRecorder.get((rec: any) => {
        recorderHome.current = rec;
        // 为 recorderHome 添加唯一标识
        recorderHome.current._instanceId = recorderInstanceId;
        recorderHome.current._createdAt = Date.now();
        console.log(`${new Date().toISOString()} 🎤 Recorder START - ID: ${recorderHome.current._instanceId}`);
        recorderHome.current.start();
        recording.current = true;
        audioBtnRef.current.setActive(true);
        intervalData.current = setInterval(() => {
          console.log(`${new Date().toISOString()} 🔄 Interval - Current Recorder ID: ${recorderHome.current?._instanceId || 'null'}`);
          uploadFile();
        }, 5000);
      });
    } else {
      console.log(`${new Date().toISOString()} 🛑 Recorder STOP - ID: ${recorderHome.current?._instanceId || 'null'}`);
      recording.current = false;
      recorderHome.current.stop();
      audioBtnRef.current.setActive(false);
      clearInterval(intervalData.current);
      uploadFile();
    }
  }

  async function uploadFile() {
    console.log(`${new Date().toISOString()} 📤 UploadFile - Recorder ID: ${recorderHome.current?._instanceId || 'null'}`);
    let newBlob = recorderHome.current?.getBlob();
    if (!newBlob) {
      console.log(`${new Date().toISOString()} ❌ No blob available - stopping recording. Recorder ID: ${recorderHome.current?._instanceId || 'null'}`);
      recording.current = false;
      recorderHome.current.stop();
      audioBtnRef.current.setActive(false);
      clearInterval(intervalData.current);
      return;
    }
    console.log(`${new Date().toISOString()} start to upload file. Recorder ID: ${recorderHome.current?._instanceId || 'null'}`);
    const fileOfBlob = new File([newBlob], new Date().getTime() + '.wav', {
      type: 'audio/wav',
    })
    const formData = new FormData();
    formData.append('file', fileOfBlob);
    let headers = {
      'attachment-filename': encodeURI(fileOfBlob.name || ''),
    };
    if (fileOfBlob.size) {
      const result: any = await uploadChatFile(tenantId, appId, formData, headers);
      if (result.data) {
        let res: any = await voiceToText(tenantId, `${result.data.file_path}`, fileOfBlob.name);
        if (res.data && res.data.trim().length) {
          const editorDom = document.getElementById('ctrl-promet');
          if (editorDom) {
            const textNode = document.createTextNode(res.data.trim());
            editorDom.appendChild(textNode);
            setTextLenth(editorDom.innerText.length);
            setShowClear(true);
          }
        }
      }
    }
  }

  function handleEditorClick(e: any) {
    if (!audioDomRef.current?.contains(e.target)) {
      recording.current
    }
  }

  useEffect(() => {
    return () => {
      recording.current = false;
      recorderHome.current?.stop();
      audioBtnRef.current?.setActive(false);
      intervalData.current && clearInterval(intervalData.current);
    }
  }, []);

  useEffect(() => {
    if (showMulti) {
      dispatch(setUseMemory(true));
    } else {
      dispatch(setUseMemory(false));
    }
  }, [showMulti]);
  useEffect(() => {
    if (!loginStatus) {
      setShowMask(true);
    }
  }, [loginStatus]);
  // 监听猜你想问size变化
  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      entries.forEach(entry => {
        if (recommondListRef.current.length) {
          recommondRef.current && resetEditorHeight(recommondListRef.current);
        }
      });
    });
    if (recommondRef.current) {
      ro.observe(recommondRef.current);
    }
    return () => {
      if (recommondRef.current) {
        ro.unobserve(recommondRef.current);
        ro.disconnect();
      }
    };
  }, []);

  // 动态设置聊天信息列表高度
  const resetEditorHeight = (list: any) => {
    // 在主页时不执行任何操作，避免影响布局
    if (isHomepage) {
      return;
    }
    let listChatDom: any = document.getElementById('chat-list-dom');
    let top = recommondRef.current.scrollHeight + editorRef.current.scrollHeight;
    if (list.length > 0) {
      setRecommondTop(top - 140);
      listChatDom.style.marginBottom = `${top - 120}px`;
      recommondListRef.current = list;
    } else {
      setRecommondTop(0);
      listChatDom.style.marginBottom = '50px';
    }
  }
  const loginClick = () => {
    let url = `${window.location.origin}/SSOSvr/login`;
    window.open(url)
  }

  useEffect(() => {
    if (!isAlreadySent.current) {
      setChatFileList(cloneDeep(fileList), isAutoSend.current);
    }
  }, [fileList]);

  // 设置多模态配置
  useEffect(() => {
    setMultiFileConfig(findConfigValue(appInfo, 'multimodal') || {});
  }, [appInfo]);

  // 深度思考按钮点击事件
  const handleThinkClick = () => {
    if (isChatRunning()) {
      Message({ type: 'warning', content: t('tryLater') });
      return;
    }
    const newThinkActive = !thinkActive;
    setThinkActive(newThinkActive);

    // 更新user_context
    if (props.updateUserContext) {
      const currentContext = props.updateUserContext() || {};
      props.updateUserContext({
        ...currentContext,
        think: newThinkActive
      });
    }
  };

  // 联网搜索按钮点击事件
  const handleSearchClick = () => {
    if (isChatRunning()) {
      Message({ type: 'warning', content: t('tryLater') });
      return;
    }
    const newSearchActive = !searchActive;
    setSearchActive(newSearchActive);

    // 更新user_context
    if (props.updateUserContext) {
      const currentContext = props.updateUserContext() || {};
      props.updateUserContext({
        ...currentContext,
        search: newSearchActive
      });
    }
  };

  // @应用选择回调
  const handleAtItemClick = (item: any) => {
    // 这里可以处理@应用选择的逻辑
    // 例如：更新编辑器内容，设置选中的应用等
    const editorDom = document.getElementById('ctrl-promet');
    if (editorDom) {
      editorDom.innerText = `@${item.name} `;
      setShowAt(false);
      setTextLenth(editorDom.innerText.length);
      setShowClear(true);
    }
  };

  // 显示更多应用
  const handleShowMoreApps = () => {
    setShowAt(false);
    // 这里可以打开应用选择抽屉
  };
  return <>{(
    <div className={`${setSpaClassName('send-editor-container')} ${isHomepage && !chatList.length ? 'send-editor-home' : ''}`}
         style={{display: display ? 'block' : 'none'}}>
      {
        showMask && <div className='send-editor-mask'>
          <div className='mask-inner'>
            <span>{t('please')}<span className='mask-link' onClick={loginClick}>{t('login')}</span>{t('startAsk')}</span>
          </div>
        </div>
      }
      {(chatRunning && showStop) &&
        <div className='editor-stop' onClick={onStop}>
          <Spin spinning={stopLoading} size='small'>
            <img src={stopImg} alt='' />
            <span>{t('stopResponding')}</span>
          </Spin>
        </div>
      }
      {
        !isHomepage && <div className='recommends-inner' style={{ top: `-${recommondTop}px` }} ref={recommondRef}>
          <Recommends resetEditorHeight={resetEditorHeight} onSend={onSend} isHomepage={isHomepage} />
        </div>
      }
      <div className='editor-inner' >
        {
          fileList?.length > 0 && <div className='input-file-list'>
            <div style={{ borderBottom: '1px dashed #E6E6E6' }}>
              <FileList fileList={fileList} updateFileList={updateFileList}></FileList>
            </div>
          </div>
        }

        {/* 隐藏的 EditorBtnHome 组件，仅用于设置上传功能 */}
        <div style={{ display: 'none' }}>
          <EditorBtnHome
            display={display}
            setOpenHistory={setOpenHistory}
            clear={onClear}
            fileList={fileList}
            fileCallBack={updateFileList}
            editorRef={editorRef}
            chatType={chatType}
            showMask={showMask}
            setEditorShow={setEditorShow}
            updateUserContext={props.updateUserContext}
            setExternalUploadOpener={setOpenUploadModal}
          />
        </div>

        {/* 用户输入栏 - 包含所有按钮 */}
        <div className='editor-input' id='drop'>
          {/* 输入框区域 */}
          <div className='input-area'>
            <div
              className='chat-promet-editor'
              id='ctrl-promet'
              ref={editorRef}
              contentEditable={true}
              onInput={messageChange}
              onKeyDown={messageKeyDown}
              data-placeholder={showMask ? '' : t('askTip')}
            />
            {showClear && <div className='send-icon clear-icon' onClick={clearContent}><DeleteContentIcon /></div>}
          </div>

          {/* 底部按钮行 - 在输入框内部 */}
          <div className='editor-bottom-actions'>
            {/* 左侧按钮组：思考、搜索、对话配置 */}
            <div className='left-actions'>
              {/* 思考按钮 */}
              <div
                className={`action-btn think-btn ${thinkActive ? 'active' : ''}`}
                onClick={handleThinkClick}
                style={{ cursor: 'pointer' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 14.019a2.02 2.02 0 1 0 0-4.04 2.02 2.02 0 0 0 0 4.04"></path>
                  <path fill="currentColor" fillRule="evenodd" d="M2.059 6.209c-.14-.932-.098-2.259.897-3.253.994-.995 2.321-1.037 3.253-.897.98.147 2.02.556 3.026 1.084.878.46 1.81 1.052 2.765 1.753a22 22 0 0 1 2.765-1.753c1.007-.527 2.046-.937 3.026-1.084.932-.14 2.259-.097 3.253.897s1.037 2.321.897 3.253c-.147.98-.557 2.02-1.084 3.026-.46.878-1.052 1.81-1.753 2.765a22 22 0 0 1 1.753 2.765c.527 1.007.937 2.046 1.084 3.026.14.932.098 2.259-.897 3.253-.994.994-2.321 1.037-3.253.897-.98-.147-2.02-.557-3.026-1.084A22 22 0 0 1 12 19.104a22 22 0 0 1-2.766 1.754c-1.006.527-2.045.936-3.025 1.083-.932.14-2.259.098-3.253-.897-.995-.994-1.037-2.321-.897-3.253.147-.98.556-2.02 1.084-3.026A22 22 0 0 1 4.896 12a22 22 0 0 1-1.753-2.766C2.616 8.228 2.206 7.19 2.059 6.21m2.325-1.825c.892-.892 3.238-.1 5.969 1.816-.724.613-1.45 1.28-2.161 1.992a36 36 0 0 0-1.992 2.16c-1.916-2.73-2.708-5.076-1.816-5.968M9.62 9.62A33 33 0 0 0 7.455 12a33 33 0 0 0 2.165 2.38A33 33 0 0 0 12 16.545a33 33 0 0 0 2.38-2.165A33 33 0 0 0 12 7.455 33 33 0 0 0 9.62 9.62m-5.236 9.996c-.892-.892-.1-3.238 1.816-5.969.613.724 1.28 1.449 1.992 2.16.712.713 1.437 1.38 2.161 1.993-2.73 1.916-5.077 2.708-5.97 1.816m15.232 0c-.892.892-3.238.1-5.969-1.816a36 36 0 0 0 2.16-1.992 36 36 0 0 0 1.993-2.161c1.916 2.73 2.708 5.077 1.816 5.969M15.808 8.192a36 36 0 0 1 1.992 2.16c1.915-2.73 2.708-5.076 1.816-5.968s-3.238-.1-5.969 1.816c.724.613 1.45 1.28 2.161 1.992" clipRule="evenodd"></path>
                </svg>
                <span>{t('deepThink')}</span>
              </div>
              
              {/* 搜索按钮 */}
              <div
                className={`action-btn search-btn ${searchActive ? 'active' : ''}`}
                onClick={handleSearchClick}
                style={{ cursor: 'pointer' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M7.00003 0.150452C10.7832 0.150452 13.8496 3.21691 13.8496 7.00006C13.8496 10.7832 10.7832 13.8497 7.00003 13.8497C3.21688 13.8497 0.150421 10.7832 0.150421 7.00006C0.150421 3.21691 3.21688 0.150452 7.00003 0.150452ZM5.37796 7.59967C5.4267 9.0321 5.64754 10.2966 5.97366 11.2198C6.15996 11.7471 6.36946 12.1302 6.57327 12.3702C6.77751 12.6106 6.92343 12.6505 7.00003 12.6505C7.07663 12.6505 7.22255 12.6106 7.42679 12.3702C7.6306 12.1302 7.8401 11.7471 8.0264 11.2198C8.35252 10.2966 8.57336 9.0321 8.6221 7.59967H5.37796ZM1.38187 7.59967C1.61456 9.80498 3.11593 11.6305 5.14261 12.336C5.03268 12.1129 4.93227 11.8725 4.8428 11.6192C4.46342 10.5452 4.22775 9.13994 4.17874 7.59967H1.38187ZM9.82132 7.59967C9.77232 9.13994 9.53664 10.5452 9.15726 11.6192C9.06774 11.8726 8.96648 12.1127 8.85648 12.336C10.8836 11.6307 12.3855 9.8053 12.6182 7.59967H9.82132ZM7.00003 1.34967C6.92343 1.34967 6.77751 1.38955 6.57327 1.62994C6.36946 1.86994 6.15996 2.25297 5.97366 2.78033C5.64754 3.70357 5.4267 4.96802 5.37796 6.40045H8.6221C8.57336 4.96802 8.35252 3.70357 8.0264 2.78033C7.8401 2.25297 7.6306 1.86994 7.42679 1.62994C7.22255 1.38955 7.07663 1.34967 7.00003 1.34967ZM8.85648 1.66315C8.96663 1.88662 9.06763 2.12721 9.15726 2.38092C9.53664 3.45494 9.77232 4.86018 9.82132 6.40045H12.6182C12.3855 4.19471 10.8837 2.36834 8.85648 1.66315ZM5.14261 1.66315C3.11578 2.36856 1.61457 4.19503 1.38187 6.40045H4.17874C4.22775 4.86018 4.46342 3.45494 4.8428 2.38092C4.93237 2.12736 5.03253 1.88651 5.14261 1.66315Z" fill="currentColor"></path>
                </svg>
                <span>{t('webSearch')}</span>
              </div>

              {/* 对话配置按钮 */}
              <ConversationConfiguration
                appInfo={useAppSelector((state) => state.appStore.appInfo)}
                display={display}
                updateUserContext={props.updateUserContext}
                chatRunning={chatRunning}
                isChatRunning={isChatRunning}
              />
            </div>

            {/* 右侧按钮组：上传、发送 */}
            <div className='right-actions'>
              {/* 上传按钮 */}
              {typeof openUploadModal === 'function' && multiFileConfig.useMultimodal && (
                <div className='action-btn upload-btn' onClick={() => {
                  const uploadFn = openUploadModal as (() => void);
                  uploadFn();
                }}>
                  <img src="/src/assets/images/ai/upload_icon.svg" alt="上传" width="16" height="16" />
                </div>
              )}

              {/* 发送按钮 */}
              <div
                className={`action-btn send-btn ${showClear ? 'active' : ''} ${!showClear ? 'disabled' : ''}`}
                onClick={showClear ? sendMessage : undefined}
                style={{ cursor: showClear ? 'pointer' : 'default' }}
              >
                {showMask ? <span></span> :
                  <Tooltip
                    title={showClear ? <span style={{ color: '#4d4d4d' }}>{t('send')}</span> : ''}
                    color='#ffffff'>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2L8 12M8 2L4 6M8 2L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Tooltip>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='chat-tips'>{t('accuracyNotice')}</div>
      {showSelect && (
        <EditorSelect
          chatSelectDom={selectDom}
          chatSelectItem={selectItem}
          positionConfig={positionConfig}
          clearMove={() => setShowSelect(false)} />
      )}
      {showAt && (
        <ReferencingApp
          atItemClick={handleAtItemClick}
          atClick={handleShowMoreApps}
          searchKey={searchKey}
          setSearchKey={setSearchKey}
        />
      )}
    </div>
  )}</>
};

export default SendEditor;
