/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { oauthLogout, oauthLogin } from '@/shared/http/aipp';
import './index.scss';

/**
 * 用户登入登出按钮组件
 *
 * @return {JSX.Element}
 * @constructor
 */
const UserAuthButton: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  // 退出登录处理
  const handleLogout = async () => {
    setLoading(true);
    try {
      await oauthLogout();
      localStorage.removeItem('__account_name__');
      localStorage.removeItem('currentUser');
      await oauthLogin();
    } catch (error) {
      console.error('登出失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-auth-button">
      <Button
        type="primary"
        loading={loading}
        onClick={handleLogout}
        className="auth-btn"
      >
        {t('logout')}
      </Button>
    </div>
  );
};

export default UserAuthButton;
