/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025-2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 --------------------------------------------------------------------------------------------*/

import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import './UserSwitcher.scss';

const MOCK_USERS = [
  { value: 'Jade', label: 'Jade (系统默认)' },
  { value: 'Alice', label: 'Alice (测试用户1)' },
  { value: 'Bob', label: 'Bob (测试用户2)' },
  { value: 'Charlie', label: 'Charlie (测试用户3)' },
  { value: 'system', label: 'System (系统用户)' },
];

const UserSwitcher: React.FC = () => {
  const [currentUser, setCurrentUser] = useState('Jade');

  useEffect(() => {
    // 从 cookie 中读取当前用户名
    const username = document.cookie
      .split('; ')
      .find(row => row.startsWith('username='))
      ?.split('=')[1] || 'Jade';
    setCurrentUser(username);
  }, []);

  const handleUserChange = (value: string) => {
    // 设置 cookie 并刷新页面
    document.cookie = `username=${value}; path=/; max-age=86400`;

    // 清空用户名缓存，确保页面刷新后重新获取
    localStorage.removeItem('apiUsername');

    setCurrentUser(value);
    window.location.reload();
  };

  // 注释掉生产环境判断，允许在所有环境显示（方便测试多用户）
  // if (process.env.NODE_ENV === 'production') {
  //   return null;
  // }

  return (
    <div className="user-switcher">
      <UserOutlined style={{ marginRight: 8 }} />
      <span style={{ marginRight: 8 }}>当前用户:</span>
      <Select
        value={currentUser}
        onChange={handleUserChange}
        options={MOCK_USERS}
        style={{ width: 200 }}
      />
    </div>
  );
};

export default UserSwitcher;
