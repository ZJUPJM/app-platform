/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { memo } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const ThinkBtn = memo(({ finished, time }) => {
  const { t } = useTranslation();
  const transTime = (milliseconds: number | '') => {
    if (!milliseconds) {
      return '';
    }
    if (milliseconds < 1000) return `（${t('timeUse')}${(milliseconds / 1000).toFixed(2)}${t('second')}）`;
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);

    seconds %= 60;
    minutes %= 60;
    let text = `（${t('timeUse')}`;
    if (hours > 0) {
      text += hours + t('hour');
    }
    if (minutes > 0) {
      text += minutes + t('minute');
    }
    if (seconds > 0) {
      text += seconds + t('second');
    }
    text += '）';
    return text;
  };

  return (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 14.019a2.02 2.02 0 1 0 0-4.04 2.02 2.02 0 0 0 0 4.04"></path>
        <path fill="currentColor" fillRule="evenodd" d="M2.059 6.209c-.14-.932-.098-2.259.897-3.253.994-.995 2.321-1.037 3.253-.897.98.147 2.02.556 3.026 1.084.878.46 1.81 1.052 2.765 1.753a22 22 0 0 1 2.765-1.753c1.007-.527 2.046-.937 3.026-1.084.932-.14 2.259-.097 3.253.897s1.037 2.321.897 3.253c-.147.98-.557 2.02-1.084 3.026-.46.878-1.052 1.81-1.753 2.765a22 22 0 0 1 1.753 2.765c.527 1.007.937 2.046 1.084 3.026.14.932.098 2.259-.897 3.253-.994.994-2.321 1.037-3.253.897-.98-.147-2.02-.557-3.026-1.084A22 22 0 0 1 12 19.104a22 22 0 0 1-2.766 1.754c-1.006.527-2.045.936-3.025 1.083-.932.14-2.259.098-3.253-.897-.995-.994-1.037-2.321-.897-3.253.147-.98.556-2.02 1.084-3.026A22 22 0 0 1 4.896 12a22 22 0 0 1-1.753-2.766C2.616 8.228 2.206 7.19 2.059 6.21m2.325-1.825c.892-.892 3.238-.1 5.969 1.816-.724.613-1.45 1.28-2.161 1.992a36 36 0 0 0-1.992 2.16c-1.916-2.73-2.708-5.076-1.816-5.968M9.62 9.62A33 33 0 0 0 7.455 12a33 33 0 0 0 2.165 2.38A33 33 0 0 0 12 16.545a33 33 0 0 0 2.38-2.165A33 33 0 0 0 16.545 12a33 33 0 0 0-2.165-2.38A33 33 0 0 0 12 7.455 33 33 0 0 0 9.62 9.62m-5.236 9.996c-.892-.892-.1-3.238 1.816-5.969.613.724 1.28 1.449 1.992 2.16.712.713 1.437 1.38 2.161 1.993-2.73 1.916-5.077 2.708-5.97 1.816m15.232 0c-.892.892-3.238.1-5.969-1.816a36 36 0 0 0 2.16-1.992 36 36 0 0 0 1.993-2.161c1.916 2.73 2.708 5.077 1.816 5.969M15.808 8.192a36 36 0 0 1 1.992 2.16c1.915-2.73 2.708-5.076 1.816-5.968s-3.238-.1-5.969 1.816c.724.613 1.45 1.28 2.161 1.992" clipRule="evenodd"></path>
      </svg>
      { finished ? <span>{t('deepThinkFinished')}{transTime(time)}</span> : <span>{t('deepThink')}</span> }
      {!finished && <LoadingOutlined />}
    </>
  );
});

export default ThinkBtn;
