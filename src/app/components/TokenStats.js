'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

export default function TokenStats() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">{t('token_statistics')}</h2>
      <p>{t('token_stats_placeholder')}</p>
    </div>
  );
}
