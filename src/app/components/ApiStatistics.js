'use client';

import React, { useState, useEffect } from 'react';
import { getCacheStatistics } from '../utils/cacheLogger';

const ApiStatistics = ({ onClose }) => {
  const [realTimeStats, setRealTimeStats] = useState([]);
  const [showRealTime, setShowRealTime] = useState(false);

  // Update real-time stats every 2 seconds
  useEffect(() => {
    if (!showRealTime) return;
    
    const updateStats = () => {
      const stats = getCacheStatistics();
      setRealTimeStats(stats);
    };
    
    updateStats(); // Initial load
    const interval = setInterval(updateStats, 2000);
    
    return () => clearInterval(interval);
  }, [showRealTime]);
  
  // Actual API statistics data from your project
  const apiStats = [
    {
      page: "Home Page",
      functions: [
        {
          name: "get-sbtc-fee-pool",
          cacheTime: "30 seconds"
        },
        {
          name: "get-token-balance", 
          cacheTime: "45 seconds"
        },
        {
          name: "get-total-locked",
          cacheTime: "60 seconds"
        }
      ]
    },
    {
      page: "Token Swap Page",
      functions: [
        {
          name: "get-sbtc-balance",
          cacheTime: "15 seconds"
        },
        {
          name: "get-token-balance",
          cacheTime: "20 seconds"
        },
        {
          name: "get-current-price",
          cacheTime: "10 seconds"
        }
      ]

    {
      page: "Revenue Page",
      functions: [
        {
          name: "get-sbtc-fee-pool",
          cacheTime: "50 seconds"
        },
        {
          name: "get-majority-holder",
          cacheTime: "90 seconds"
        }
      ]
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1c2d4e 0%, #2d4a7c 100%)',
        borderRadius: '20px',
        padding: '2rem',
        color: '#fff',
        width: '90%',
        maxWidth: '1000px',
        maxHeight: '80vh',
        overflowY: 'auto',
        border: '2px solid #60a5fa',
        boxShadow: '0 20px 60px rgba(28, 45, 78, 0.5)',
        position: 'relative'
      }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          borderBottom: '2px solid #60a5fa',
          paddingBottom: '1rem'
        }}>
          <h2 style={{
            color: '#fca311',
            fontSize: '2rem',
            fontWeight: 'bold',
            margin: 0
          }}>
            📊 API Statistics
          </h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowRealTime(!showRealTime)}
              style={{
                background: showRealTime ? '#a3e635' : 'rgba(163, 230, 53, 0.2)',
                border: '2px solid #a3e635',
                color: showRealTime ? '#000' : '#a3e635',
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                transition: 'all 0.3s ease',
                fontWeight: 'bold'
              }}
              onMouseEnter={(e) => {
                if (!showRealTime) {
                  e.target.style.background = '#a3e635';
                  e.target.style.color = '#000';
                }
              }}
              onMouseLeave={(e) => {
                if (!showRealTime) {
                  e.target.style.background = 'rgba(163, 230, 53, 0.2)';
                  e.target.style.color = '#a3e635';
                }
              }}
            >
              📊 Real-Time Monitor
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '2rem',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '50%',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(252, 163, 17, 0.2)';
                e.target.style.color = '#fca311';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none';
                e.target.style.color = '#fff';
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* API Statistics Table */}
        <div style={{
          overflowX: 'auto'
        }}>
          {apiStats.map((pageData, pageIndex) => (
            <div key={pageIndex} style={{
              marginBottom: '2rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {/* Page Title */}
              <h3 style={{
                color: '#60a5fa',
                fontSize: '1.3rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                borderBottom: '1px solid #60a5fa',
                paddingBottom: '0.5rem'
              }}>
                {pageData.page}
              </h3>

              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr',
                gap: '1rem',
                marginBottom: '0.5rem',
                padding: '0.75rem',
                background: 'rgba(96, 165, 250, 0.1)',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                color: '#fca311'
              }}>
                <div>Smart Contract Function</div>
                <div>Cache Duration (Real Call Frequency)</div>
              </div>

              {/* Table Rows */}
              {pageData.functions.map((func, funcIndex) => (
                <div key={funcIndex} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.5fr',
                  gap: '1rem',
                  padding: '0.75rem',
                  background: funcIndex % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  borderLeft: '3px solid #60a5fa',
                  marginLeft: '0.5rem'
                }}>
                  <div style={{
                    fontFamily: 'monospace',
                    color: '#a3e635',
                    fontWeight: '500'
                  }}>
                    {func.name}
                  </div>
                  <div style={{ color: '#34d399', fontWeight: 'bold' }}>
                    {func.cacheTime}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Real-Time Cache Monitor */}
        {showRealTime && (
          <div style={{
            marginTop: '2rem',
            background: 'rgba(163, 230, 53, 0.1)',
            borderRadius: '15px',
            border: '2px solid #a3e635',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#a3e635',
              color: '#000',
              padding: '1rem',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              📊 Real-Time Cache Activity (Last 24 Hours)
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                Updates every 2 seconds
              </div>
            </div>
            
            <div style={{ padding: '1rem' }}>
              {realTimeStats.length === 0 ? (
                <div style={{
                  color: '#a3e635',
                  textAlign: 'center',
                  padding: '2rem',
                  fontStyle: 'italic'
                }}>
                  🔄 No cache activity detected yet. Visit different pages to see real-time statistics!
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  gap: '1rem',
                  fontSize: '0.9rem'
                }}>
                  {/* Header */}
                  <div style={{ color: '#a3e635', fontWeight: 'bold' }}>Function</div>
                  <div style={{ color: '#a3e635', fontWeight: 'bold' }}>Cache Hits</div>
                  <div style={{ color: '#a3e635', fontWeight: 'bold' }}>Cache Misses</div>
                  <div style={{ color: '#a3e635', fontWeight: 'bold' }}>Blockchain Calls</div>
                  <div style={{ color: '#a3e635', fontWeight: 'bold' }}>Hit Rate</div>
                  
                  {/* Data Rows */}
                  {realTimeStats.map((stat, index) => (
                    <React.Fragment key={index}>
                      <div style={{ 
                        color: '#fff', 
                        fontFamily: 'monospace',
                        padding: '0.5rem 0',
                        borderTop: index > 0 ? '1px solid rgba(163, 230, 53, 0.2)' : 'none'
                      }}>
                        {stat.functionName}
                      </div>
                      <div style={{ 
                        color: '#34d399', 
                        fontWeight: 'bold',
                        padding: '0.5rem 0',
                        borderTop: index > 0 ? '1px solid rgba(163, 230, 53, 0.2)' : 'none'
                      }}>
                        🟢 {stat.hits}
                      </div>
                      <div style={{ 
                        color: '#ef4444', 
                        fontWeight: 'bold',
                        padding: '0.5rem 0',
                        borderTop: index > 0 ? '1px solid rgba(163, 230, 53, 0.2)' : 'none'
                      }}>
                        🔴 {stat.misses}
                      </div>
                      <div style={{ 
                        color: '#60a5fa', 
                        fontWeight: 'bold',
                        padding: '0.5rem 0',
                        borderTop: index > 0 ? '1px solid rgba(163, 230, 53, 0.2)' : 'none'
                      }}>
                        🔵 {stat.calls}
                      </div>
                      <div style={{ 
                        color: stat.hitRate > 70 ? '#34d399' : stat.hitRate > 40 ? '#fbbf24' : '#ef4444',
                        fontWeight: 'bold',
                        padding: '0.5rem 0',
                        borderTop: index > 0 ? '1px solid rgba(163, 230, 53, 0.2)' : 'none'
                      }}>
                        {stat.hitRate.toFixed(1)}%
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}
              
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'rgba(163, 230, 53, 0.1)',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#a3e635'
              }}>
                💡 <strong>Live Tracking:</strong> Open your browser console to see detailed cache activity logs with user IDs and timestamps!
              </div>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'rgba(252, 163, 17, 0.1)',
          borderRadius: '10px',
          border: '1px solid #fca311',
          fontSize: '0.85rem',
          color: '#fbbf24'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
            📋 Performance Notes:
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li>Cache times help reduce blockchain calls and improve performance</li>
            <li>Shorter intervals on trading pages for real-time price updates</li>
            <li>Longer intervals on admin pages for better efficiency</li>
            <li>Statistics are updated in real-time based on actual usage</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default ApiStatistics;
