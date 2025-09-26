/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useState, useEffect, createContext, useContext } from 'react';
import type { MenuProps } from 'antd';
import { Layout, Menu, Avatar } from 'antd';
import { MenuFoldOutlined, UserOutlined } from '@ant-design/icons';
import {
  Route,
  useHistory,
  useLocation,
  Redirect,
  Switch
} from 'react-router-dom';
import {
  routeList,
  flattenRoute,
  getRouteByKey,
  getMenus,
} from '../../router/route';
import { Provider } from 'react-redux';
import { KnowledgeIcons } from '../icons/index';
import AidoIcon from '../../assets/images/aido-icon.png';
import { store } from '@/store';
import { setSpaClassName, updateChatId } from '@/shared/utils/common';
import { getUser, getOmsUser, getRole, getChatPluginList } from '../../pages/helper';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { setChatId, setChatList, setChatRunning, setAtChatId } from '@/store/chatStore/chatStore';
import { setAtAppInfo, setAtAppId } from '@/store/appInfo/appInfo';
import HistorySidebar from './history-sidebar';
import './style.scoped.scss';

const { Content, Sider } = Layout;
type MenuItem = Required<MenuProps>['items'][number];
const items: MenuItem[] = getMenus(routeList);
const flattenRouteList = flattenRoute(routeList);

// 创建Context用于传递setListCurrentList函数
const HistoryContext = createContext<{
  setListCurrentList: (list: any) => void;
}>({
  setListCurrentList: () => {}
});

// 历史记录状态管理组件
const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [listCurrentList, setListCurrentList] = useState<any[]>([]);

  return (
    <HistoryContext.Provider value={{ setListCurrentList }}>
      {children}
    </HistoryContext.Provider>
  );
};

// 使用Context的HistorySidebar组件
const HistorySidebarWithContext: React.FC = () => {
  const { setListCurrentList } = useContext(HistoryContext);
  return <HistorySidebar setListCurrentList={setListCurrentList} />;
};

/**
 * 页面整体布局组件
 *
 * @return {JSX.Element}
 * @constructor
 */
const AppLayout: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [defaultActive, setDefaultActive] = useState<string[]>([])
  const navigate = useHistory().push;
  const location = useLocation();
  const dispatch = useAppDispatch();
  const appId = useAppSelector((state) => state.appStore.appId);

  /**
   * @description 从后往前遍历路由 父子路由，子路由前缀需要是父路由
   * @pathname 当前路径
   * */
  const getCurrentRoute = (pathname: string) => {
    // 如果是新对话页面，不设置选中状态
    if (pathname === '/home') {
      setDefaultActive([]);
      return;
    }

    // 拆开路由
    const pathGroup = pathname.split('/').filter(item => item !== '');
    if (pathGroup?.length) {
      let len = pathGroup?.length - 1;
      while (len >= 0) {
        const key = '/' + pathGroup.slice(0, len + 1).join('/');
        let route = getRouteByKey(flattenRouteList, key);
        if (route && !route?.hidden) {
          setDefaultActive([key]);
          break;
        }
        len--;
      }
    } else {
      setDefaultActive([]);
    }
  }
  const menuClick = (e: any) => {
    // 如果是新对话菜单项，需要清空聊天状态和选中状态
    if (e.key === '/home') {
      // 清空聊天相关的状态
      dispatch(setChatRunning(false));
      dispatch(setChatId(null));
      dispatch(setChatList([]));
      dispatch(setAtAppInfo(null));
      dispatch(setAtChatId(null));
      dispatch(setAtAppId(null));

      // 清空本地存储的聊天ID
      if (appId) {
        updateChatId(null, appId);
      }

      // 设置存储参数用于页面刷新
      const storageParams = {
        deleteAppId: null,
        refreshChat: true,
        key: Date.now().toString(),
        type: 'deleteChat'
      };
      localStorage.setItem('storageMessage', JSON.stringify(storageParams));

      // 清空菜单选中状态
      setDefaultActive([]);
    } else {
      // 其他菜单项保持正常的选中状态
      setDefaultActive([e.key]);
    }
    navigate(e.key);
  };

  const colorBgContainer = '#F0F2F4';
  const setClassName = () => {
    if (location.pathname.includes('home')) {
      return `${setSpaClassName('home-chat')} layout-container`
    } else if (location.pathname.includes('app')) {
      return `${setSpaClassName('home-app')} layout-container`
    }
    return 'layout-container'
  }
  const layoutValidate = () => {
    if (process.env.NODE_ENV !== 'development' && process.env.PACKAGE_MODE !== 'common') {
      return false
    }
    if (location.pathname.includes('/chat/') && !location.pathname.includes('/app/')){
      return false;
    }
    return true;
  }

  // 判断是否显示历史记录侧边栏
  const shouldShowHistorySidebar = () => {
    return location.pathname.includes('/chat/') || location.pathname.includes('/home');
  }
  const isSpaMode = () => {
    return  (process.env.NODE_ENV !== 'development' && process.env.PACKAGE_MODE !== 'common')
  }
  useEffect(() => {
    const { pathname, search } = location;
    const route = getRouteByKey(flattenRouteList, pathname);
    if (pathname.includes('/app-detail/')) {
      setShowMenu(false);
    } else if (!route?.hidden || pathname.includes('/http')) {
      setShowMenu(true);
    } else {
      setShowMenu(false);
    }
    getCurrentRoute(pathname);
    parent?.window?.navigatePath?.('appengine', pathname + search);
  }, [location]);

  useEffect(() => {
    if (process.env.PACKAGE_MODE === 'common') {
    // TODO: 待后端接口归一后调用 getUser()
    } else {
      getOmsUser();
      getRole();
    }
    getChatPluginList();
  }, [])
  return (
    <HistoryProvider>
      <Layout>
        { layoutValidate() && (
          <>
            <Sider
              collapsible
              collapsed={isCollapsed}
              onCollapse={() => setShowMenu(false)}
              trigger={null}
              width={showMenu ? (isCollapsed ? 60 : 280) : 0}
              className={`layout-sider ${isCollapsed ? 'collapsed' : ''}`}
            >
              <div className='layout-sider-header'>
                <div className='layout-sider-content'>
                  <img
                    style={{width: '44px', height: '44px', objectFit: 'contain', cursor: 'pointer'}}
                    src={AidoIcon}
                    alt="Aido Icon"
                    className={`project-icon ${isCollapsed ? 'collapsed' : ''}`}
                    onClick={() => {
                      if (isCollapsed) {
                        setIsCollapsed(false);
                      }
                    }}
                  />
                </div>
                <MenuFoldOutlined
                  className={`collapse-icon ${isCollapsed ? 'collapsed' : ''}`}
                  style={{ color: '#6d6e72' }}
                  onClick={() => {
                    if (isCollapsed) {
                      setIsCollapsed(false);
                    } else {
                      setIsCollapsed(true);
                    }
                  }}
                />
              </div>
              <Menu
                className={`menu ${isCollapsed ? 'collapsed' : ''}`}
                theme='light'
                selectedKeys={defaultActive}
                mode='inline'
                items={items}
                onClick={menuClick}
              />
              {shouldShowHistorySidebar() && (
                <div className='layout-sider-history'>
                  {!isCollapsed && (
                    <HistorySidebarWithContext />
                  )}
                  <div className='layout-sider-user'>
                    <Avatar size={28} icon={<UserOutlined />} />
                    <span className='layout-sider-user-name'>User</span>
                  </div>
                </div>
              )}
            </Sider>
            <div className='layout-sider-folder'>
              <KnowledgeIcons.menuFolder onClick={() => {
                if (isCollapsed) {
                  setIsCollapsed(false);
                } else {
                  setShowMenu(true);
                }
              }} />
            </div>
          </>
        )
      }
        <Layout className={setClassName()}>
          <Provider store={store}>
            <Content style={{ padding: (layoutValidate() || isSpaMode()) ? '0 16px' : '0', background: colorBgContainer }}>
              <Switch>
                {flattenRouteList.map((route) => (
                  <Route
                    exact
                    path={route.key}
                    key={route.key}
                    component={route.component}
                  />
                ))}
                <Route exact path='/' key='/' >
                  <Redirect to='/home' />
                </Route>
              </Switch>
            </Content>
          </Provider>
        </Layout>
      </Layout>
    </HistoryProvider>
  );
};

export { HistoryContext };
export default AppLayout;
