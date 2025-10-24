/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input, Spin, Tabs, Select, Tag } from 'antd';
import { QuestionCircleOutlined, AppstoreOutlined, RobotOutlined, MessageOutlined, TagOutlined, DownOutlined } from '@ant-design/icons';
import { Icons } from '@/components/icons';
import { queryAppsApi, queryToolsApi } from '@/shared/http/apps';
import serviceConfig from '@/shared/http/httpConfig';
import AppCard from '@/components/appCard';
import { debounce, getCookie, setSpaClassName } from '@/shared/utils/common';
import { deleteAppApi } from '@/shared/http/appDev';
import Empty from '@/components/empty/empty-item';
import { TENANT_ID } from '../chatPreview/components/send-editor/common/config';
import { useTranslation } from 'react-i18next';
import './index.scoped.scss';

const Apps: React.FC = () => {
  const tenantId = TENANT_ID;
  const { t } = useTranslation();
  const { APP_URL } = serviceConfig;
  const [appData, setAppData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(40); // 固定一页40个
  const [search, setSearch] = useState('');
  const [listLoading, setListLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [hasTriedLoadMore, setHasTriedLoadMore] = useState(false); // 是否已经尝试过加载更多
  const [activeCategory, setActiveCategory] = useState('agent');
  const [selectedTag, setSelectedTag] = useState('全部标签');
  const [availableTags, setAvailableTags] = useState<string[]>(['全部标签']);
  const [isSearching, setIsSearching] = useState(false); // 搜索状态指示器
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<string | null>(null); // 用于防止重复请求
  const prevSearchRef = useRef<string>('');
  const prevCategoryRef = useRef<string>('agent');


  async function queryApps(isLoadMore = false, forcePage?: number) {
    // 使用传入的page或当前state中的page
    const currentPage = forcePage !== undefined ? forcePage : page;
    
    // 生成请求标识符，防止重复请求
    const requestId = `${currentPage}-${search}-${isLoadMore}`;
    
    // 如果已经有相同的请求在进行中，直接返回
    if (requestRef.current === requestId) {
      console.log('重复请求，跳过:', requestId);
      return;
    }
    
    requestRef.current = requestId;
    console.log('queryApps 被调用:', { isLoadMore, currentPage, pageSize, search, requestId });

    // // 根据分类配置不同的搜索参数
    // const getCategoryParams = (category: string) => {
    //   switch (category) {
    //     case 'agent':
    //       // 智能体：包含APP类型，指定agent分类，排除BUILTIN
    //       return {
    //         includeTags: ['APP'],
    //         excludeTags: ['BUILTIN'],
    //         appCategory: 'agent'
    //       };
    //     case 'chat':
    //       // 聊天助手：包含APP类型，指定chatbot分类，排除BUILTIN
    //       return {
    //         includeTags: ['APP'],
    //         excludeTags: ['BUILTIN'],
    //         appCategory: 'chatbot'
    //       };
    //     default:
    //       return {
    //         includeTags: ['APP'],
    //         excludeTags: ['BUILTIN'],
    //         appCategory: 'agent'
    //       };
    //   }
    // };

    // 获取所有应用（不区分分类）
    const params = {
      pageNum: currentPage,
      pageSize,
      name: search,
      includeTags: 'APP',
      excludeTags: 'BUILTIN'
    };
    
    const apiCall = queryAppsApi;
    const endpoint = `${APP_URL}/store/apps/search`;
    
    // 添加调试信息
    console.log('API请求参数:', {
      endpoint: endpoint,
      params: params
    });
    
    if (isLoadMore) {
      setLoadingMore(true);
      setHasTriedLoadMore(true); // 标记已经尝试过加载更多
    } else {
      setListLoading(true);
    }
    
    try {
      const res: any = await apiCall(tenantId, params);
      console.log('API响应数据:', {
        response: res,
        dataLength: res?.data?.length || 0,
        total: res?.total || 0
      });
      if (res.code === 0) {
        const { data, total } = res;
        
        // 前端二次过滤：排除包含 BUILTIN 标签的应用
        const filteredData = data.filter((item: any) => {
          return !item.tags || !item.tags.includes('BUILTIN');
        });
        
        console.log('过滤前数据量:', data.length, '过滤后数据量:', filteredData.length);
        
        if (isLoadMore) {
          // 累积加载数据
          setAppData(prev => {
            const newData = [...prev, ...filteredData];
            // 如果返回的数据为空，说明没有更多数据了
            if (filteredData.length === 0) {
              setHasMore(false);
            } else {
              // 检查是否还有更多数据
              setHasMore(newData.length < total);
            }
            return newData;
          });
        } else {
          // 重新加载数据
          setAppData([...filteredData]);
          setTotal(total);
          // 如果返回的数据为空或少于pageSize，说明没有更多数据了
          setHasMore(filteredData.length >= pageSize && filteredData.length < total);
        }
      }
    } finally {
      setListLoading(false);
      setLoadingMore(false);
      requestRef.current = null; // 清除请求标识符
    }
  }
  // 加载更多数据
  const loadMore = useCallback(() => {
    console.log('loadMore 被调用:', { loadingMore, hasMore, page });
    if (!loadingMore && hasMore) {
      console.log('设置下一页:', page + 1);
      setPage(prev => prev + 1);
    } else {
      console.log('不满足加载条件:', { loadingMore, hasMore });
    }
  }, [loadingMore, hasMore, page]);

  // 搜索 - 优化防抖处理
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  function onSearchValueChange(newSearchVal: string) {
    if (newSearchVal !== search) {
      setPage(1);
      setSearch(newSearchVal);
      setAppData([]);
      setHasMore(true);
      setHasTriedLoadMore(false);
    }
  }
  
  const handleSearch = useCallback((value: string) => {
    // 清除之前的定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // 如果搜索值为空，立即执行搜索
    if (value.trim() === '') {
      setIsSearching(false);
      onSearchValueChange(value);
      return;
    }
    
    // 显示搜索状态
    setIsSearching(true);
    
    // 设置新的定时器
    searchTimeoutRef.current = setTimeout(() => {
      setIsSearching(false);
      onSearchValueChange(value);
    }, 300); // 减少防抖时间到300ms，提升响应速度
  }, [search]);

  // // 分类切换
  // const handleCategoryChange = useCallback((category: string) => {
  //   if (category !== activeCategory) {
  //     // 使用批量更新避免多次触发useEffect
  //     setPage(1);
  //     setActiveCategory(category);
  //     setAppData([]);
  //     setHasMore(true);
  //     setHasTriedLoadMore(false);
  //     // 切换分类时清空搜索框内容
  //     setSearch('');
  //     setIsSearching(false);
  //     // 清除搜索防抖定时器
  //     if (searchTimeoutRef.current) {
  //       clearTimeout(searchTimeoutRef.current);
  //       searchTimeoutRef.current = null;
  //     }
  //   }
  // }, [activeCategory]);

  // 点击卡片
  function clickCard(item: any, e: any) {
    let id = item.runnables?.APP?.appId;
    let aippId = item.runnables?.APP?.aippId;
    
    let url = `#/app/${tenantId}/chat/${id}`;
    if (aippId) {
      url += `/${aippId}`;
    }

    window.open(url, '_blank');
  }

  // 点击更多操作选项
  function clickMore(type: string, appId: string) {
    if (type === 'delete') {
      deleteApp(appId);
    }
  }
  // 删除
  async function deleteApp(appId: string) {
    const res: any = await deleteAppApi(tenantId, appId);
    if (res.code === 0) {
      // 从当前数据中移除删除的应用
      setAppData(prev => prev.filter(item => item.runnables?.APP?.appId !== appId));
      setTotal(prev => prev - 1);
    }
  }

  // 联机帮助
  const onlineHelp = () => {
    window.open(`${window.parent.location.origin}/help${getCookie('locale').toLocaleLowerCase() === 'en-us' ? '/en' : '/zh'}/application_market.html`, '_blank');
  }

  // 容器内滚动监听
  
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      
      console.log('滚动信息:', {
        scrollTop,
        scrollHeight,
        clientHeight,
        distance: scrollHeight - scrollTop - clientHeight,
        hasMore,
        loadingMore,
        page,
        pageSize
      });
      
      // 当滚动到距离底部100px时触发加载更多
      if (scrollHeight - scrollTop - clientHeight < 100) {
        console.log('触发加载更多');
        loadMore();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  // 数据加载
  useEffect(() => {
    // 添加防抖，避免快速连续的状态更新导致多次请求
    const timeoutId = setTimeout(() => {
      // 检查是否是搜索改变
      const isSearchChanged = search !== prevSearchRef.current;
      // const isCategoryChanged = activeCategory !== prevCategoryRef.current;
      // const isSearchOrCategoryChange = isSearchChanged || isCategoryChanged;

      // 更新ref值
      prevSearchRef.current = search;
      // prevCategoryRef.current = activeCategory;

      if (page === 1 || isSearchChanged) {
        // 重新加载数据，强制使用page=1
        console.log('重新加载数据，使用page=1');
        queryApps(false, 1);
      } else {
        // 加载更多数据
        console.log('加载更多数据，使用page=', page);
        queryApps(true);
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [page, search]);

  // 清理搜索防抖定时器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  return (
    <div className={setSpaClassName('apps_root')}>
      <div className='apps_header'>
        <div className='apps_title'>{t('applicationMarket')}</div>
        <div className='apps_header_right'>
          { process.env.PACKAGE_MODE === 'spa' && <QuestionCircleOutlined onClick={onlineHelp} />}
        </div>
      </div>
      <div className='apps_main_market'>
        <div className='searchAndCategoryArea'>
          {/* 居中：搜索框 */}
          <div className='searchArea'>
            <Input
              className='apps-search-input'
              placeholder={t('search')}
              value={search}
              prefix={
                isSearching ? (
                  <div className="search-loading">
                    <div className="search-spinner"></div>
                  </div>
                ) : (
                  <Icons.search color={'rgb(230, 230, 230)'} />
                )
              }
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
        <div ref={scrollContainerRef} className='scrollable_content'>
          <Spin spinning={listLoading}>
            {appData.length > 0 ?
              <div className='card_list'>
                {appData.map((item: any) => (
                  <div
                    className='card_box'
                    key={item.uniqueName}
                    onClick={(e) => clickCard(item, e)}
                  >
                    <AppCard cardInfo={item} clickMore={clickMore} showOptions={false} />
                  </div>
                ))}
                {loadingMore && (
                  <div className='loading_more'>
                    <Spin size="small" />
                    <span style={{ marginLeft: 8 }}>加载中...</span>
                  </div>
                )}
                {!hasMore && appData.length > 0 && page > 1 && (
                  <div className='no_more_data'>
                    <span>没有更多了</span>
                  </div>
                )}
              </div> :
              <div className='empty-box'>
                <Empty />
              </div>
            }
          </Spin>
        </div>
      </div>
    </div>
  );
};
export default Apps;

