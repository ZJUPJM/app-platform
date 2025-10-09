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
import { setSpaClassName } from '@/shared/utils/common';
import { isChatRunning } from '@/shared/utils/chat';
import { uploadChatFile, voiceToText } from '@/shared/http/aipp';
import { useTranslation } from 'react-i18next';
import { cloneDeep } from 'lodash';
import Recommends from './components/recommends';
import EditorBtnHome from './components/editor-btn-home';
import EditorSelect from './components/editor-selet';
import FileList from './components/file-list';
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
 * @param setListCurrentList 更新聊天会话消息列表
 * @param checkMutipleInput 校验多输入是否必填
 * @param setChatFileList 多模态设置文件列表
 * @param checkFileSuccess 多模态校验文件是否都上传成功
 * @constructor
 */

const AudioBtn = forwardRef((props, ref) => {
  const [active, setActive] = useState(props.active || false);
  useImperativeHandle(ref, () => {
    return {
      active,
      setActive,
    };
  });

  return <>{active ? <AudioActiveIcon className='active-audio-btn' /> : <AudioIcon />}</>;

});

const SendEditor = (props) => {
  const {
    onSend,
    onStop,
    onClear,
    chatType,
    filterRef,
    showStop,
    stopLoading,
    setEditorShow,
    setListCurrentList,
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
  const chatRunning = useAppSelector((state) => state.chatCommonStore.chatRunning);
  const loginStatus = useAppSelector((state) => state.chatCommonStore.loginStatus);
  const showMulti = useAppSelector((state) => state.commonStore.historySwitch);
  const chatList = useAppSelector((state) => state.chatCommonStore.chatList);
  const editorRef = useRef<any>(null);
  const promptMapRef = useRef<any>([]);
  const recommondRef = useRef<any>(null);
  const isAlreadySent = useRef<any>(false);
  const isAutoSend = useRef<any>(false);
  const recommondListRef = useRef<any>([]);
  const isHomepage = location.hash.includes('home');
  const recording = useRef(false);
  const audioBtnRef = useRef<any>(null);
  const audioDomRef = useRef<any>(null);
  const appId = useAppSelector((state) => state.appStore.appId);
  const tenantId = useAppSelector((state) => state.appStore.tenantId);
  // 编辑器change事件
  function messageChange() {
    const editorDom = document.getElementById('ctrl-promet');
    let chatContent = editorDom.innerText;
    setTextLenth(chatContent.length);
    setShowClear(() => {
      return editorRef.current.innerText.length > 0
    });
  }
  // 清除内容
  function clearContent() {
    editorRef.current.innerText = '';
    setShowClear(false);
  }
  // 快捷发送
  function messageKeyDown(e) {
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
  function setFilterHtml(prompt, promptMap, strXss) {
    const editorDom = document.getElementById('ctrl-promet');
    if (prompt.trim().length > 0) {
      strXss ? editorDom.innerHTML = prompt : editorDom.innerText = prompt;
      setTextLenth(editorDom.innerText.length);
      setShowClear(true);
    }
    if (promptMap.length) {
      promptMapRef.current = promptMap;
      document.body.addEventListener('click', bindEvents);
    }
  }
  // 绑定下拉事件
  function bindEvents(event) {
    let target = event.target;
    if (target.classList.contains('chat-focus')) {
      let filterType = target.dataset.type;
      let selectItem = promptMapRef.current.filter(item => item.var === filterType)[0];
      selectItem.options = selectItem.options.filter(item => item.trim().length > 0);
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
  // 更新文件
  function updateFileList(paramFileList, autoSend) {
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
      (window as any).HZRecorder.get((rec) => {
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
          const textNode = document.createTextNode(res.data.trim());
          editorDom.appendChild(textNode);
          setTextLenth(editorDom.innerText.length);
          setShowClear(true);
        }
      }
    }
  }

  function handleEditorClick(e) {
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
  const resetEditorHeight = (list) => {
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
        !showMask && <div className='recommends-inner' style={{ top: `-${recommondTop}px` }} ref={recommondRef}>
          <Recommends resetEditorHeight={resetEditorHeight} onSend={onSend} />
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
          setListCurrentList={setListCurrentList}
          updateUserContext={props.updateUserContext}
        />
        <div className='editor-input' id='drop'>
          <div
            className='chat-promet-editor'
            id='ctrl-promet'
            ref={editorRef}
            contentEditable={true}
            onInput={messageChange}
            onKeyDown={messageKeyDown}
            placeholder={showMask ? '' : t('askTip')}
          />
          <div className='send-icon' onClick={sendMessage}>
            {showMask ? <span></span> :
              <Tooltip
                title={showClear ? <span style={{ color: '#4d4d4d' }}>{t('send')}</span> : ''}
                color='#ffffff'>
                <div className={`send-btn ${showClear ? 'active-btn' : ''}`}></div>
              </Tooltip>
            }
          </div>
          <Tooltip title={<span style={{ color: '#4d4d4d' }}>{t('recordTip')}</span>} color='white'>
            <div
              className='audio-icon'
              ref={audioDomRef}
              onClick={onRecord}
              >
              <AudioBtn ref={audioBtnRef} />
            </div>
          </Tooltip>
          {showClear && <div className='send-icon clear-icon' onClick={clearContent}><DeleteContentIcon /></div>}
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
    </div>
  )}</>
};

export default SendEditor;
