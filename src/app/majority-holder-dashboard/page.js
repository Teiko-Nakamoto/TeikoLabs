'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/header';
import Footer from '../components/footer';
import Link from 'next/link';
import './dashboard.css';

export default function MajorityHolderDashboard() {
  const { t } = useTranslation();
  const [connectedAddress, setConnectedAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');
  const [revenueData, setRevenueData] = useState([]);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [airdropType, setAirdropType] = useState('');
  const [airdropAmount, setAirdropAmount] = useState('');
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [recipients, setRecipients] = useState([{ to: '' }]);
  const [allowMode, setAllowMode] = useState(true);
  const [isCallingFunction, setIsCallingFunction] = useState(false);
  const [globalAmount, setGlobalAmount] = useState('');
  const [bulkAddresses, setBulkAddresses] = useState('');
  const [revenueSummary, setRevenueSummary] = useState({
    totalRevenue: 0,
    avgDailyRevenue: 0,
    maxDailyRevenue: 0,
    daysTracked: 0
  });

  const dashboardData = {
    currentMajorityHolder: {
      address: 'SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B',
      lockedHoldings: 210000,
      percentageOfSupply: 1.0
    },
    masBalance: {
      sats: 1250000000,
      usd: 750000,
      btc: 12.5
    }
  };

  useEffect(() => {
    const address = localStorage.getItem('connectedAddress');
    if (address) {
      setConnectedAddress(address);
    }

    const handleStorageChange = () => {
      const newAddress = localStorage.getItem('connectedAddress');
      setConnectedAddress(newAddress || '');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    setLoadingRevenue(true);
    try {
      const response = await fetch('/api/get-daily-revenue');
      const data = await response.json();
      setRevenueData(data.data || []);
      setRevenueSummary(data.summary || {
        totalRevenue: 0,
        avgDailyRevenue: 0,
        maxDailyRevenue: 0,
        daysTracked: 0
      });
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      setRevenueData([]);
      setRevenueSummary({
        totalRevenue: 0,
        avgDailyRevenue: 0,
        maxDailyRevenue: 0,
        daysTracked: 0
      });
    } finally {
      setLoadingRevenue(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(connectedAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address');
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="dashboard-container">
      <Header />
      
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-right">
              <div className="wallet-info">
                <div className="wallet-address">
                  <span className="address-label">Connected:</span>
                  <span className="address-value">{formatAddress(connectedAddress)}</span>
                  <button 
                    className="copy-button"
                    onClick={copyToClipboard}
                    title="Copy address"
                  >
                    {copied ? '✓' : '📋'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
            >
              Current Majority Holder
            </button>
            
            <Link href="/mas/swap" className="tab-link">
              <button className="tab-button">
                Swap
              </button>
            </Link>
            
            {/* Airdrop - Only visible to admin users */}
            {(connectedAddress === 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4' || connectedAddress === 'SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B') && (
              <button
                onClick={() => setActiveTab('airdrop')}
                className={`tab-button ${activeTab === 'airdrop' ? 'active' : ''}`}
              >
                Airdrop
              </button>
            )}
            

          </div>

          {/* Tab Content */}
          {activeTab === 'analytics' && (
            <div className="analytics-content">
              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon">👑</div>
                    <span className="stat-title">Current CEO</span>
                    <span className="stat-info">ⓘ</span>
                  </div>
                  <p className="stat-value address-value">
                    {dashboardData.currentMajorityHolder.address}
                  </p>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon">🔒</div>
                    <span className="stat-title">Total Tokens Locked</span>
                    <span className="stat-info">ⓘ</span>
                  </div>
                  <p className="stat-value">
                    {dashboardData.currentMajorityHolder.lockedHoldings.toLocaleString()}
                  </p>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon">📊</div>
                    <span className="stat-title">Total Supply Locked</span>
                    <span className="stat-info">ⓘ</span>
                  </div>
                  <p className="stat-value">
                    {dashboardData.currentMajorityHolder.percentageOfSupply}%
                  </p>
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="chart-container">
                <div className="chart-header">
                  <h3 className="chart-title">Profit Growth Over Time</h3>
                  <button className="chart-filter">All ▼</button>
                </div>
                
                <div className="chart-area">
                  {loadingRevenue ? (
                    <div className="chart-loading">
                      <div className="loading-icon">⏳</div>
                      <p>Loading revenue data...</p>
                    </div>
                  ) : revenueData && revenueData.length > 0 ? (
                    <div className="chart-bars-container">
                      <svg className="chart-bars" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
                        {/* Y-axis grid lines and labels */}
                        {(() => {
                          const maxRevenue = Math.max(...revenueData.map(d => d.revenue_sats));
                          const yMax = Math.ceil(maxRevenue / 300) * 300;
                          const ticks = [];
                          for (let i = 0; i <= yMax; i += 300) {
                            const y = 250 - (i / yMax) * 200;
                            ticks.push({ value: i, y: y });
                          }
                          return ticks.map((tick, index) => (
                            <g key={index}>
                              <line 
                                x1="60" y1={tick.y} x2="380" y2={tick.y} 
                                stroke="#e5e7eb" strokeWidth="1"
                              />
                              <text x="50" y={tick.y + 4} textAnchor="end" fontSize="10" fill="#6b7280">
                                {tick.value}
                              </text>
                            </g>
                          ));
                        })()}
                        
                        {/* Chart bars */}
                        {revenueData.map((data, index) => {
                          const barHeight = (data.revenue_sats / Math.max(...revenueData.map(d => d.revenue_sats))) * 200;
                          const x = 80 + (index * 40);
                          const y = 250 - barHeight;
                          
                          return (
                            <g key={index}>
                              <rect
                                x={x}
                                y={y}
                                width="30"
                                height={barHeight}
                                fill="#3b82f6"
                                rx="2"
                              />
                              <text
                                x={x + 15}
                                y="270"
                                textAnchor="middle"
                                fontSize="8"
                                fill="#6b7280"
                              >
                                {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  ) : (
                    <div className="chart-empty">
                      <p>No revenue data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Revenue Summary */}
              <div className="revenue-summary">
                <h3>Revenue Summary</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Total Revenue</span>
                    <span className="summary-value">{revenueSummary.totalRevenue.toLocaleString()} sats</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Average Daily</span>
                    <span className="summary-value">{revenueSummary.avgDailyRevenue.toLocaleString()} sats</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Max Daily</span>
                    <span className="summary-value">{revenueSummary.maxDailyRevenue.toLocaleString()} sats</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Days Tracked</span>
                    <span className="summary-value">{revenueSummary.daysTracked}</span>
                  </div>
                </div>
              </div>
            </div>
          )}



          {activeTab === 'airdrop' && (
            <>
              {/* Admin access check */}
              {(connectedAddress === 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4' || connectedAddress === 'SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B') ? (
                <div className="airdrop-content">
                  <div className="airdrop-header">
                    <h2>🎁 Airdrop</h2>
                    <p>Select your airdrop option below</p>
                  </div>

                  <div className="airdrop-selection">
                    <div className="airdrop-dropdown-container">
                      <label className="airdrop-label">Select Airdrop Type:</label>
                      <div className="airdrop-options">
                        <div 
                          className={`airdrop-option ${airdropType === 'mas-sats' ? 'selected' : ''}`}
                          onClick={() => setAirdropType('mas-sats')}
                        >
                          <img src="/icons/mas_sats.png" alt="MAS Sats" className="mas-sats-logo" />
                          <span>MAS Sats</span>
                        </div>
                        <div 
                          className={`airdrop-option ${airdropType === 'request' ? 'selected' : ''}`}
                          onClick={() => setAirdropType('request')}
                        >
                          <span>Add Your Coin</span>
                        </div>
                      </div>
                    </div>

                    {airdropType === 'mas-sats' && (
                      <div className="mas-sats-section">
                        <h3>send-many (public function)</h3>

                        <div className="global-amount-section">
                          <h4>Amount (for all recipients)</h4>
                          <div className="field-group">
                            <input
                              type="number"
                              placeholder="Enter amount in sats"
                              value={globalAmount}
                              onChange={(e) => setGlobalAmount(e.target.value)}
                              className="global-amount-input"
                            />
                          </div>
                        </div>

                        <div className="bulk-addresses-section">
                          <h4>Bulk Address Import</h4>
                          <div className="field-group">
                            <label>Paste wallet addresses (one per line or comma-separated)</label>
                            <textarea
                              placeholder="SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B&#10;SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQYH0ADK&#10;SP3K1BC1PHC9JEG074KVR5VP9ZT6B2HB9A9RE5GVP"
                              value={bulkAddresses}
                              onChange={(e) => setBulkAddresses(e.target.value)}
                              className="bulk-addresses-input"
                              rows="4"
                            />
                            <button
                              className="process-addresses-button"
                              onClick={() => {
                                if (bulkAddresses.trim()) {
                                  // Split by newlines and commas, then clean up
                                  const addresses = bulkAddresses
                                    .split(/[\n,]/)
                                    .map(addr => addr.trim())
                                    .filter(addr => addr.length > 0);
                                  
                                  // Create recipient entries for each address
                                  const newRecipients = addresses.map(addr => ({
                                    to: addr
                                  }));
                                  
                                  setRecipients(newRecipients);
                                  setBulkAddresses('');
                                }
                              }}
                            >
                              Process Addresses
                            </button>
                          </div>
                        </div>

                        <div className="recipients-section">
                          <h4>Recipients ({recipients.length})</h4>
                          {recipients.map((recipient, index) => (
                            <div key={index} className="recipient-entry">
                              <div className="recipient-header">
                                <span>recipients.{index}</span>
                                {recipients.length > 1 && (
                                  <button
                                    className="remove-recipient"
                                    onClick={() => {
                                      const newRecipients = recipients.filter((_, i) => i !== index);
                                      setRecipients(newRecipients);
                                    }}
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                              
                              <div className="recipient-fields">
                                <div className="field-group">
                                  <label>recipients.{index}: to</label>
                                  <input
                                    type="text"
                                    placeholder="principal"
                                    value={recipient.to}
                                    onChange={(e) => {
                                      const newRecipients = [...recipients];
                                      newRecipients[index].to = e.target.value;
                                      setRecipients(newRecipients);
                                    }}
                                    className="recipient-input"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <button
                            className="add-recipient-button"
                            onClick={() => setRecipients([...recipients, { to: '' }])}
                          >
                            + Add individual recipient
                          </button>
                        </div>

                        <button 
                          className="call-function-button"
                          onClick={() => {
                            setIsCallingFunction(true);
                            // Here you would integrate with the actual contract call
                            const recipientsWithAmount = recipients.map(recipient => ({
                              ...recipient,
                              amount: globalAmount
                            }));
                            
                            console.log('Calling send-many function with:', {
                              contractAddress: 'SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B.mas-sats',
                              recipients: recipientsWithAmount,
                              allowMode: true,
                              globalAmount
                            });
                            setTimeout(() => setIsCallingFunction(false), 2000);
                          }}
                          disabled={isCallingFunction}
                        >
                          {isCallingFunction ? 'Calling function...' : 'Call function'}
                        </button>
                      </div>
                    )}

                    {airdropType === 'request' && (
                      <div className="request-section">
                        <h3>Add Your Coin</h3>
                        <p className="request-description">
                          Free of charge for 21+ MAS sats holders. Please email us with your token ID and project socials.
                        </p>
                        <button 
                          className="contact-support-button"
                          onClick={() => setShowSupportModal(true)}
                        >
                          Contact Support
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Support Modal */}
                  {showSupportModal && (
                    <div className="modal-overlay" onClick={() => setShowSupportModal(false)}>
                      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                          <h3>Token Listing Request</h3>
                          <button 
                            className="modal-close"
                            onClick={() => setShowSupportModal(false)}
                          >
                            ×
                          </button>
                        </div>
                        <div className="modal-body">
                          <p>To submit your token for listing consideration, please provide the following information:</p>
                          
                          <div className="requirements-section">
                            <h4>Required Information:</h4>
                            <ul>
                              <li><strong>Token ID:</strong> Your project's unique token identifier</li>
                              <li><strong>Project Documentation:</strong> Whitepaper, roadmap, or project overview</li>
                              <li><strong>Social Media Presence:</strong> Official Twitter, Telegram, Discord, or website links</li>
                            </ul>
                          </div>
                          
                          <div className="email-info">
                            <h4>Submit Your Request</h4>
                            <p>Please send all required information to:</p>
                            <div className="email-address">
                              <strong>teikonakamoto@tutamail.com</strong>
                            </div>
                          </div>
                          
                          <div className="eligibility-note">
                            <p><strong>Eligibility:</strong> This service is complimentary for verified holders of 21,000+ MAS sats.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="access-denied">
                  <h2>🔒 Access Denied</h2>
                  <p>You need admin privileges to access the airdrop functionality.</p>
                </div>
              )}
            </>
          )}


        </div>
      </main>
    </div>
  );
}
