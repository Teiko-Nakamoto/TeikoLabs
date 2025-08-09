'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Header from '../../components/header';
import ApiStatistics from '../../components/ApiStatistics';
import './admin-dashboard.css';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const [adminData, setAdminData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApiStats, setShowApiStats] = useState(false);
  
  // Admin wallet addresses (comma-separated)
  const ADMIN_ADDRESSES = process.env.NEXT_PUBLIC_ADMIN_ADDRESSES?.split(',') || ['ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4'];
  
  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const isAuthenticated = localStorage.getItem('adminAuthenticated');
      const authTime = localStorage.getItem('adminAuthTime');
      const signature = localStorage.getItem('adminSignature');
      const publicKey = localStorage.getItem('adminPublicKey');
      const challenge = localStorage.getItem('adminChallenge');
      const connectedAddress = localStorage.getItem('connectedAddress');
      
      if (!isAuthenticated || !signature || !ADMIN_ADDRESSES.includes(connectedAddress)) {
        // Not authenticated or wrong wallet, redirect to login
        router.push('/admin');
        return;
      }
      
      // Check if authentication is still valid (24 hours)
      const authTimestamp = new Date(authTime).getTime();
      const now = Date.now();
      const authAge = now - authTimestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (authAge > maxAge) {
        // Authentication expired, clear and redirect
        localStorage.removeItem('adminAuthenticated');
        localStorage.removeItem('adminSignature');
        localStorage.removeItem('adminPublicKey');
        localStorage.removeItem('adminAuthTime');
        localStorage.removeItem('adminChallenge');
        router.push('/admin');
        return;
      }
      
      setAdminData({
        isAuthenticated: true,
        authTime: new Date(authTime).toLocaleString(),
        signature: signature.slice(0, 20) + '...',
        publicKey: publicKey?.slice(0, 20) + '...',
        challenge: challenge,
        connectedAddress
      });
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router]);

  const handleLogout = () => {
    // Clear admin authentication
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminSignature');
    localStorage.removeItem('adminPublicKey');
    localStorage.removeItem('adminAuthTime');
    localStorage.removeItem('adminChallenge');
    
    // Redirect to admin login
    router.push('/admin');
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="admin-dashboard-page">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading admin dashboard...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="admin-dashboard-page">
        <div className="admin-dashboard-container">
          <div className="admin-dashboard-card">
            <div className="admin-dashboard-header">
              <h1>🛠️ Admin Dashboard</h1>
              <p>Welcome to the admin control panel</p>
            </div>

            <div className="admin-status-section">
              <h2>Authentication Status</h2>
              <div className="status-grid">
                <div className="status-item">
                  <span className="status-label">Status:</span>
                  <span className="status-value success">✅ Authenticated</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Wallet:</span>
                  <span className="status-value">{adminData?.connectedAddress}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Authenticated:</span>
                  <span className="status-value">{adminData?.authTime}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Signature:</span>
                  <span className="status-value code">{adminData?.signature}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Public Key:</span>
                  <span className="status-value code">{adminData?.publicKey}</span>
                </div>
              </div>
            </div>

                         <div className="admin-actions-section">
               <h2>Admin Actions</h2>
               <div className="actions-grid">
                 <button 
                   className="admin-action-button primary-action"
                   onClick={() => router.push('/admin/edit-home')}
                 >
                   🏠 Edit Home Screen
                 </button>
                                 <button 
                  className="admin-action-button"
                  onClick={() => setShowApiStats(true)}
                >
                  📊 API Statistics
                </button>
                <button className="admin-action-button">
                  🔧 Manage Tokens
                </button>
                <button 
                  className="admin-action-button"
                  onClick={() => router.push('/admin/api-management')}
                >
                  📋 API Rules
                </button>
                 <button className="admin-action-button">
                   ⚙️ System Settings
                 </button>
               </div>
             </div>

            

            <div className="admin-footer">
              <button onClick={handleLogout} className="logout-button">
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </main>
      
      {/* API Statistics Popup */}
      {showApiStats && (
        <ApiStatistics onClose={() => setShowApiStats(false)} />
      )}
    </>
  );
} 