'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import Header from '../components/header';
import './admin-dashboard.css';

export default function AdminPage() {
  const { t } = useTranslation();
  
  return (
    <>
      <Header />
      <main className="admin-page">
        <h1 className="admin-title">🛠 {t('admin_dashboard')}</h1>
        <div className="admin-grid">
          <Link href="/admin/manage" className="admin-card">
            {t('manage_all_tokens')}
          </Link>
          <Link href="/admin/stats" className="admin-card">
            {t('view_statistics')}
          </Link>
        </div>
      </main>
    </>
  );
}
