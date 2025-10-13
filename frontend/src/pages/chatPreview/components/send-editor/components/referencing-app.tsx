/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useEffect, useRef, useState } from 'react';
import { Input, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/store/hook';
import { queryAppsApi } from '@/shared/http/apps';
import { convertImgPath } from '@/common/util';
import { useTranslation } from 'react-i18next';
import knowledgeBase from '@/assets/images/knowledge/knowledge-base.png';
import '../styles/referencing-app.scss';

interface ReferencingAppProps {
  atItemClick: (item: any) => void;
  atClick: () => void;
  searchKey: string;
  setSearchKey: (value: string) => void;
}

const ReferencingApp = (props: ReferencingAppProps) => {
  const { t } = useTranslation();
  const { atItemClick, atClick, searchKey, setSearchKey } = props;
  const [appArr, setAppArr] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const tenantId = useAppSelector((state) => state.appStore.tenantId);
  const pageNo = useRef(1);
  const atRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<'at-below' | 'at-above'>('at-below');
  const [topStyle, setTopStyle] = useState<number | undefined>(undefined);

  // 应用点击回调
  const itemClick = (item: any) => {
    atItemClick(item);
  }

  // 拿取应用列表
  const getAppList = async () => {
    setTableLoading(true);
    try {
      const params = {
        pageNum: pageNo.current,
        pageSize: 3,
        includeTags: 'App',
        name: searchKey,
        excludeTags: 'BUILTIN'
      }
      const res: any = await queryAppsApi(tenantId, params);
      if (res.code === 0) {
        const { data } = res as any;
        setAppArr(data as any[]);
      }
    } finally {
      setTableLoading(false);
    }
  }
  useEffect(() => {
    getAppList();
  }, [searchKey]);

  // 本地动态定位：根据 editor 在视口中的位置决定在其上/下方
  useEffect(() => {
    const updatePlacement = () => {
      const panelEl = atRef.current as unknown as HTMLElement | null;
      if (!panelEl) return;
      const containerEl = panelEl.parentElement as HTMLElement | null; // send-editor-container
      if (!containerEl) return;
      // 优先以输入栏容器作为定位锚点，找不到再回退到 editor-inner
      const inputEl = containerEl.querySelector('.editor-input') as HTMLElement | null;
      const editorEl = (inputEl || containerEl.querySelector('.editor-inner')) as HTMLElement | null;
      if (!editorEl) return;

      const containerRect = containerEl.getBoundingClientRect();
      const editorRect = editorEl.getBoundingClientRect();
      const panelHeight = panelEl.offsetHeight || 170;
      const gap = 8; // 弹窗与输入框间距

      const spaceBelow = window.innerHeight - editorRect.bottom;
      const placeBelow = spaceBelow >= panelHeight + gap;

      const top = placeBelow
        ? (editorRect.bottom - containerRect.top + gap)
        : (editorRect.top - containerRect.top - panelHeight - gap);

      setPlacement(placeBelow ? 'at-below' : 'at-above');
      setTopStyle(top);
    };

    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, []);
  return <>{(
    <div
      ref={atRef}
      className={`at-content ${placement}`}
      style={{ top: topStyle }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className='at-head'>
        <div className='at-app-search'>
          <Input
            value={searchKey}
            prefix={<SearchOutlined />}
            allowClear
            placeholder={t('search')}
            maxLength={20}
            showCount
            onChange={(e) => { setSearchKey(e.target.value) }}
          />
        </div>
      </div>
      <Spin spinning={tableLoading}>
        <div className='at-content-inner'>
          {
            appArr.map((item, index) => {
              return (
                <ListItem key={index} item={item} itemClick={itemClick} icon={item.icon} />
              )
            })
          }
        </div>
      </Spin>
    </div>
  )}</>
};

interface ListItemProps {
  itemClick: (item: any) => void;
  item: any;
  icon?: string;
}

const ListItem = (props: ListItemProps) => {
  const { itemClick, item, icon } = props;
  const [imgPath, setImgPath] = useState('');
  useEffect(() => {
    if (icon) {
      convertImgPath(icon).then(res => {
        setImgPath(res as string);
      });
    }
  }, [icon])
  return (
  <div className='at-list-item'  onClick={() => itemClick(item)}>
      <div className='left'>
        <span>
          {imgPath ? <img src={imgPath} /> : <img src={knowledgeBase} />}
        </span>
        <span className='name'>{item.name}</span>
        <span className='description'>{item.description}</span>
      </div>
    </div>
  )
}

export default ReferencingApp;
