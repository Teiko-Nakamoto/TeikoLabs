'use client';

import { useTranslation } from 'react-i18next';

export default function ProfilePage() {
  const { t } = useTranslation();
  
  return (
    <div style={{ padding: '2rem' }}>
      <h1>{t('profile_page')}</h1>
      <p>{t('profile_description')}</p>
    </div>
  );
}
