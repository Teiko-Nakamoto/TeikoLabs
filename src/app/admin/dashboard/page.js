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
  const [showAccessManagement, setShowAccessManagement] = useState(false);
  const [accessSettings, setAccessSettings] = useState({
    createProject: true,
    tradePage: false,
    lockUnlock: true,
    claimRevenue: true,
    tokenTrading: {
      featured: false,
      practice: false
    }
  });
  
  // Admin wallet addresses (comma-separated)
  const ADMIN_ADDRESSES = process.env.NEXT_PUBLIC_ADMIN_ADDRESSES?.split(',') || ['ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4'];
  
  // Load access settings from server
  useEffect(() => {
    const loadAccessSettings = async () => {
      try {
        const response = await fetch('/api/access-settings');
        const data = await response.json();
        if (data.success) {
          setAccessSettings(data.settings);
        }
      } catch (error) {
        console.error('Failed to load access settings:', error);
      }
    };
    loadAccessSettings();
  }, []);

  // Save access settings to server
  const saveAccessSettings = async (newSettings) => {
    try {
      const response = await fetch('/api/access-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: newSettings }),
      });
      
      const data = await response.json();
      if (data.success) {
        setAccessSettings(newSettings);
        console.log('Access settings saved successfully');
        
        // Notify other components about the change
        localStorage.setItem('accessSettingsChanged', Date.now().toString());
        window.dispatchEvent(new CustomEvent('accessSettingsUpdated'));
      } else {
        console.error('Failed to save access settings:', data.error);
      }
    } catch (error) {
      console.error('Error saving access settings:', error);
    }
  };

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
                <button 
                  className="admin-action-button"
                  onClick={() => setShowAccessManagement(true)}
                >
                  🔧 Manage Access
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

      {/* Access Management Popup */}
      {showAccessManagement && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1a1a2e',
            border: '2px solid #fbbf24',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px'
            }}>
              <h2 style={{
                color: '#fbbf24',
                fontSize: '24px',
                fontWeight: 'bold',
                margin: 0,
                fontFamily: 'Arial, sans-serif'
              }}>
                🔧 Manage Access
              </h2>
              <button
                onClick={() => setShowAccessManagement(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ccc',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px'
                }}
              >
                ×
              </button>
            </div>

            <p style={{
              color: '#ccc',
              fontSize: '16px',
              marginBottom: '30px',
              lineHeight: '1.5'
            }}>
              Control which features show "Coming Soon" popups to users. Toggle these settings to enable or disable access to features.
            </p>

            <div style={{ marginBottom: '30px' }}>
              {/* Create Project Setting */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div>
                  <h4 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '16px' }}>
                    🏗️ Create Project
                  </h4>
                  <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>
                    Homepage "Create Project" button
                  </p>
                </div>
                <label style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '60px',
                  height: '34px'
                }}>
                  <input
                    type="checkbox"
                    checked={accessSettings.createProject}
                    onChange={(e) => saveAccessSettings({
                      ...accessSettings,
                      createProject: e.target.checked
                    })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: accessSettings.createProject ? '#fbbf24' : '#ccc',
                    transition: '.4s',
                    borderRadius: '34px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '26px',
                      width: '26px',
                      left: accessSettings.createProject ? '30px' : '4px',
                      bottom: '4px',
                      backgroundColor: 'white',
                      transition: '.4s',
                      borderRadius: '50%'
                    }}></span>
                  </span>
                </label>
              </div>

              {/* Lock/Unlock Setting */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div>
                  <h4 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '16px' }}>
                    🔒 Lock/Unlock Tokens
                  </h4>
                  <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>
                    Trade page Lock/Unlock button
                  </p>
                </div>
                <label style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '60px',
                  height: '34px'
                }}>
                  <input
                    type="checkbox"
                    checked={accessSettings.lockUnlock}
                    onChange={(e) => saveAccessSettings({
                      ...accessSettings,
                      lockUnlock: e.target.checked
                    })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: accessSettings.lockUnlock ? '#fbbf24' : '#ccc',
                    transition: '.4s',
                    borderRadius: '34px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '26px',
                      width: '26px',
                      left: accessSettings.lockUnlock ? '30px' : '4px',
                      bottom: '4px',
                      backgroundColor: 'white',
                      transition: '.4s',
                      borderRadius: '50%'
                    }}></span>
                  </span>
                </label>
              </div>

              {/* Claim Revenue Setting */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div>
                  <h4 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '16px' }}>
                    💰 Claim Revenue
                  </h4>
                  <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>
                    Trade page Claim Revenue button
                  </p>
                </div>
                <label style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '60px',
                  height: '34px'
                }}>
                  <input
                    type="checkbox"
                    checked={accessSettings.claimRevenue}
                    onChange={(e) => saveAccessSettings({
                      ...accessSettings,
                      claimRevenue: e.target.checked
                    })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: accessSettings.claimRevenue ? '#fbbf24' : '#ccc',
                    transition: '.4s',
                    borderRadius: '34px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '26px',
                      width: '26px',
                      left: accessSettings.claimRevenue ? '30px' : '4px',
                      bottom: '4px',
                      backgroundColor: 'white',
                      transition: '.4s',
                      borderRadius: '50%'
                    }}></span>
                  </span>
                </label>
              </div>

              {/* Token Trading Controls Section */}
              <div style={{
                marginTop: '30px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h3 style={{
                  color: '#fbbf24',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  fontFamily: 'Arial, sans-serif'
                }}>
                  🎯 Token Trading Controls
                </h3>
                <p style={{
                  color: '#ccc',
                  fontSize: '14px',
                  marginBottom: '20px',
                  fontStyle: 'italic'
                }}>
                  Control token card access by category. When enabled, shows "Feature being updated" popup.
                </p>

                {/* Featured Tokens Control */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div>
                    <h4 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '16px' }}>
                      🚀 Featured Tokens
                    </h4>
                    <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>
                      Mainnet featured token cards
                    </p>
                  </div>
                  <label style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '60px',
                    height: '34px'
                  }}>
                    <input
                      type="checkbox"
                      checked={accessSettings.tokenTrading?.featured || false}
                      onChange={(e) => saveAccessSettings({
                        ...accessSettings,
                        tokenTrading: {
                          ...(accessSettings.tokenTrading || {}),
                          featured: e.target.checked
                        }
                      })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: accessSettings.tokenTrading?.featured ? '#fbbf24' : '#ccc',
                      transition: '.4s',
                      borderRadius: '34px'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '26px',
                        width: '26px',
                        left: accessSettings.tokenTrading?.featured ? '30px' : '4px',
                        bottom: '4px',
                        backgroundColor: 'white',
                        transition: '.4s',
                        borderRadius: '50%'
                      }}></span>
                    </span>
                  </label>
                </div>

                {/* Practice Trading Control */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div>
                    <h4 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '16px' }}>
                      🧪 Practice Trading
                    </h4>
                    <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>
                      Testnet practice token cards
                    </p>
                  </div>
                  <label style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '60px',
                    height: '34px'
                  }}>
                    <input
                      type="checkbox"
                      checked={accessSettings.tokenTrading?.practice || false}
                      onChange={(e) => saveAccessSettings({
                        ...accessSettings,
                        tokenTrading: {
                          ...(accessSettings.tokenTrading || {}),
                          practice: e.target.checked
                        }
                      })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: accessSettings.tokenTrading?.practice ? '#fbbf24' : '#ccc',
                      transition: '.4s',
                      borderRadius: '34px'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '26px',
                        width: '26px',
                        left: accessSettings.tokenTrading?.practice ? '30px' : '4px',
                        bottom: '4px',
                        backgroundColor: 'white',
                        transition: '.4s',
                        borderRadius: '50%'
                      }}></span>
                    </span>
                  </label>
                </div>


              </div>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(255, 187, 36, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 187, 36, 0.3)',
              marginBottom: '20px'
            }}>
              <p style={{
                color: '#fbbf24',
                margin: 0,
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                ℹ️ Note: When enabled (yellow), features show "Coming Soon" popups. When disabled (gray), features work normally.
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowAccessManagement(false)}
                style={{
                  backgroundColor: '#fbbf24',
                  color: '#1a1a2e',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f59e0b';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#fbbf24';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 