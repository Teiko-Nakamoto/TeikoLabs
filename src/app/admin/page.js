'use client';

import Link from 'next/link';
import Header from '../components/header';
import './admin-dashboard.css';

export default function AdminPage() {
  return (
    <>
      <Header />
      <main className="admin-page">
        <h1 className="admin-title">🛠 Admin Dashboard</h1>
        <div className="admin-grid">
          <Link href="/admin/manage" className="admin-card">
            Manage All Tokens
          </Link>
          <Link href="/admin/stats" className="admin-card">
            View Statistics
          </Link>
        </div>
      </main>
    </>
  );
}
