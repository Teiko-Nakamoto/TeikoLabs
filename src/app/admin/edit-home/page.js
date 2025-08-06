'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Header from '../../components/header';
import './edit-home.css';
import {
  getRevenueBalance,
  getLiquidityBalance,
  getTokenSymbol,
} from '../../utils/fetchTokenData';

export default function EditHomePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tokenSymbol, setTokenSymbol] = useState('--');
  const [revenue, setRevenue] = useState('--');
  const [liquidity, setLiquidity] = useState('--');
  const [tokenCards, setTokenCards] = useState([]);

  // Store original data for cancel functionality
  const [originalTokenCards, setOriginalTokenCards] = useState([]);
  const [defaultTab, setDefaultTab] = useState('featured');
  const [originalDefaultTab, setOriginalDefaultTab] = useState('featured');
  const [filterView, setFilterView] = useState('all'); // For filtering: 'all', 'featured', 'practice'
  
  // Track which rows are being checked
  const [checkingRows, setCheckingRows] = useState(new Set());
  
  // Preview tab state
  const [previewActiveTab, setPreviewActiveTab] = useState('featured');
  
  // Admin wallet address
  const ADMIN_ADDRESS = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';
  
  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const isAuthenticated = localStorage.getItem('adminAuthenticated');
      const signature = localStorage.getItem('adminSignature');
      const connectedAddress = localStorage.getItem('connectedAddress');
      
      if (!isAuthenticated || !signature || connectedAddress !== ADMIN_ADDRESS) {
        // Not authenticated or wrong wallet, redirect to login
        router.push('/admin');
        return;
      }
      
      // Check if authentication is still valid (24 hours)
      const authTime = localStorage.getItem('adminAuthTime');
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
      
      setIsAuthenticated(true);
      setIsLoading(false);
      
      // Load current home content
      loadHomeContent();
    };
    
    checkAuth();
  }, [router]);

  const loadHomeContent = async () => {
    // Load current home screen content from blockchain
    console.log('🔄 Fetching fresh data for edit page...');
    const symbol = await getTokenSymbol();
    const rev = await getRevenueBalance();
    const liq = await getLiquidityBalance();

    setTokenSymbol(symbol ? symbol.toUpperCase() : '--');
    setRevenue(rev !== null ? rev.toLocaleString() : '--');
    setLiquidity(liq !== null ? liq.toLocaleString() : '--');

    // Load token cards from database
    try {
      const response = await fetch('/api/get-token-cards');
      const result = await response.json();
      
      if (result.tokenCards && result.tokenCards.length > 0) {
        console.log('📋 Loaded token cards from database:', result.tokenCards);
        setTokenCards(result.tokenCards);
      } else {
        console.log('📋 No token cards found in database, using empty array');
        setTokenCards([]);
      }

      // Load default tab setting
      if (result.defaultTab) {
        console.log('📋 Loaded default tab from database:', result.defaultTab);
        setDefaultTab(result.defaultTab);
      }
    } catch (error) {
      console.error('❌ Error loading token cards:', error);
      setTokenCards([]);
    }
  };

  const handleEdit = () => {
    // Store current state as original for cancel functionality
    setOriginalTokenCards([...tokenCards]);
    setOriginalDefaultTab(defaultTab);
    setIsEditing(true);
  };



  const handleSave = async () => {
    try {
      console.log('💾 Saving token cards and default tab to database:', { tokenCards, defaultTab });
      
      // Save token cards and default tab to database
      const response = await fetch('/api/save-token-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenCards, defaultTab }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Token cards and default tab saved successfully');
        alert('Home screen content saved successfully!');
        setIsEditing(false);
      } else {
        console.error('❌ API returned error:', result);
        throw new Error(result.error || 'Failed to save token cards');
      }
    } catch (error) {
      console.error('❌ Error saving token cards:', error);
      alert(`Error saving home content: ${error.message}. Please check the console for more details.`);
    }
  };

  // Function to check contracts for a specific row
  const checkContractsForRow = async (cardId) => {
    const card = tokenCards.find(c => c.id === cardId);
    if (!card) return;

    if (!card.dexInfo?.trim() || !card.tokenInfo?.trim()) {
      alert('Please enter both DEX and Token contract addresses first');
      return;
    }

    setCheckingRows(prev => new Set(prev).add(cardId));

    try {
      console.log('🔍 Checking contracts for card:', cardId, {
        dexContract: card.dexInfo,
        tokenContract: card.tokenInfo,
        tabType: card.tabType
      });

      // Parse contract addresses
      const dexParts = card.dexInfo.split('.');
      const tokenParts = card.tokenInfo.split('.');
      
      if (dexParts.length !== 2 || tokenParts.length !== 2) {
        throw new Error('Invalid contract address format. Use: address.contract-name');
      }

      const dexAddress = dexParts[0];
      const dexName = dexParts[1];
      const tokenAddress = tokenParts[0];
      const tokenName = tokenParts[1];

      console.log('🔍 Parsed contracts:', {
        dexAddress,
        dexName,
        tokenAddress,
        tokenName
      });

      // Import the blockchain functions
      const { fetchCallReadOnlyFunction } = await import('@stacks/transactions');
      const { STACKS_TESTNET, STACKS_MAINNET } = await import('@stacks/network');

      // Determine network based on tab type
      const network = card.tabType === 'practice' ? STACKS_TESTNET : STACKS_MAINNET;
      console.log('🔍 Using network:', card.tabType === 'practice' ? 'TESTNET' : 'MAINNET');

      // Fetch token symbol from token contract - using same pattern as fetchTokenData.js
      let symbol = '';
      try {
        console.log('🔍 Fetching token symbol from contract...');
        console.log('🔍 Using for symbol fetch:', {
          contractAddress: dexAddress,
          contractName: tokenName,
          functionName: 'get-symbol',
          network: card.tabType === 'practice' ? 'TESTNET' : 'MAINNET'
        });
        const symbolResult = await fetchCallReadOnlyFunction({
          contractAddress: dexAddress, // Use DEX address like fetchTokenData.js
          contractName: tokenName, // Use token contract name (e.g., 'dear-cyan')
          functionName: 'get-symbol',
          functionArgs: [],
          network: network,
          senderAddress: dexAddress, // Use DEX address as sender
        });
        
        const symbolValue = symbolResult?.value?.value;
        console.log('🔍 Raw token symbol result:', symbolResult);
        console.log('🔍 Token symbol value:', symbolValue);
        
        symbol = typeof symbolValue === 'string' ? symbolValue.toLowerCase() : '';
        console.log('🔍 Final token symbol:', symbol);
      } catch (symbolError) {
        console.error('❌ Failed to fetch token symbol:', symbolError);
        console.error('❌ Symbol fetch error details:', {
          contractAddress: dexAddress,
          contractName: tokenName,
          error: symbolError.message
        });
        symbol = '';
      }

      // Fetch revenue from DEX contract - try multiple function names
      let revenue = '';
      const revenueFunctions = ['get-sbtc-fee-pool', 'get-fee-pool', 'get-revenue', 'get-total-fees', 'get-sbtc-balance'];
      
      for (const funcName of revenueFunctions) {
        try {
          console.log(`🔍 Trying to get revenue with function: ${funcName}`);
          const revenueResult = await fetchCallReadOnlyFunction({
            contractAddress: dexAddress,
            contractName: dexName,
            functionName: funcName,
            functionArgs: [],
            network: network,
            senderAddress: dexAddress,
          });
          
          const rawValue = revenueResult?.value?.value || revenueResult?.value || null;
          console.log(`🔍 Raw revenue result for ${funcName}:`, revenueResult);
          console.log(`🔍 Raw revenue value for ${funcName}:`, rawValue, typeof rawValue);
          
          // Handle string or number conversion - same as fetchTokenData.js
          let satsValue = 0;
          if (rawValue) {
            if (typeof rawValue === 'string') {
              satsValue = parseInt(rawValue);
            } else {
              satsValue = Number(rawValue);
            }
          }
          
          if (satsValue > 0) {
            revenue = satsValue.toString();
            console.log(`✅ Found revenue "${revenue}" from function ${funcName}`);
            break;
          }
        } catch (revenueError) {
          console.log(`❌ Function ${funcName} failed:`, revenueError.message);
        }
      }

      if (!revenue) {
        console.error('❌ Could not fetch revenue from any function');
        revenue = '0';
      }

      // Fetch liquidity from DEX contract - try multiple function names
      let liquidity = '';
      const liquidityFunctions = ['get-sbtc-balance', 'get-liquidity', 'get-total-liquidity', 'get-sats-liquidity'];
      
      for (const funcName of liquidityFunctions) {
        try {
          console.log(`🔍 Trying to get liquidity with function: ${funcName}`);
          const liquidityResult = await fetchCallReadOnlyFunction({
            contractAddress: dexAddress,
            contractName: dexName,
            functionName: funcName,
            functionArgs: [],
            network: network,
            senderAddress: dexAddress,
          });
          
          const rawValue = liquidityResult?.value?.value || liquidityResult?.value || null;
          console.log(`🔍 Raw liquidity result for ${funcName}:`, liquidityResult);
          console.log(`🔍 Raw liquidity value for ${funcName}:`, rawValue, typeof rawValue);
          
          // Handle string or number conversion - same as fetchTokenData.js
          let satsValue = 0;
          if (rawValue) {
            if (typeof rawValue === 'string') {
              satsValue = parseInt(rawValue);
            } else {
              satsValue = Number(rawValue);
            }
          }
          
          if (satsValue > 0) {
            liquidity = satsValue.toString();
            console.log(`✅ Found liquidity "${liquidity}" from function ${funcName}`);
            break;
          }
        } catch (liquidityError) {
          console.log(`❌ Function ${funcName} failed:`, liquidityError.message);
        }
      }

      if (!liquidity) {
        console.error('❌ Could not fetch liquidity from any function');
        liquidity = '0';
      }

      console.log('🔍 Final results:', { symbol, revenue, liquidity });

      // Validate that we got meaningful data
      const isValid = symbol && symbol !== '' && revenue && parseInt(revenue) > 0 && liquidity && parseInt(liquidity) > 0;

      if (isValid) {
        setTokenCards(prev => prev.map(c => {
          if (c.id === cardId) {
            return {
              ...c,
              symbol: symbol.toUpperCase(), // Cache the symbol since it doesn't change
              revenue: revenue, // Show the fetched revenue in the table
              liquidity: liquidity, // Show the fetched liquidity in the table
              isComingSoon: false // Since it has valid contracts, make it active
            };
          }
          return c;
        }));
        alert(`✅ Contract validation successful!\nSymbol: ${symbol.toUpperCase()}\nRevenue: ${revenue} sats\nLiquidity: ${liquidity} sats\n\nData has been updated in the table. Click "Save Changes" to persist to database.`);
      } else {
        alert(`❌ Contract validation failed.\nSymbol: ${symbol || 'Not found'}\nRevenue: ${revenue} sats\nLiquidity: ${liquidity} sats\n\nPlease check your contract addresses and ensure they have valid data.\n\nCheck the browser console for detailed error information.`);
      }
    } catch (error) {
      console.error('❌ Error checking contracts:', error);
      alert(`Error checking contracts: ${error.message}\n\nCheck the browser console for detailed error information.`);
    } finally {
      setCheckingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    }
  };

  const addTokenCard = () => {
    const newId = tokenCards.length > 0 ? Math.max(...tokenCards.map(card => card.id), 0) + 1 : 1;
    const newCard = {
      id: newId,
      isComingSoon: true, // Default is coming soon until contracts are validated
      tabType: 'featured',
      isHidden: false, // Default is visible
      dexInfo: '',
      tokenInfo: '',
      symbol: '',
      revenue: '',
      liquidity: '' // Add liquidity field
    };
    
    setTokenCards(prev => [...prev, newCard]);
  };

  const handleCancel = () => {
    // Restore original data
    setTokenCards([...originalTokenCards]);
    setDefaultTab(originalDefaultTab);
    setIsEditing(false);
  };

  const removeTokenCard = (id) => {
    setTokenCards(prev => prev.filter(card => card.id !== id));
  };

  const updateTokenCard = (id, field, value) => {
    setTokenCards(prev => prev.map(card => {
      if (card.id === id) {
        const updatedCard = { ...card, [field]: value };
        
        // Check if both DEX and Token contracts are filled to determine if it should be active
        if (field === 'dexInfo' || field === 'tokenInfo') {
          const hasDexContract = updatedCard.dexInfo && updatedCard.dexInfo.trim() !== '';
          const hasTokenContract = updatedCard.tokenInfo && updatedCard.tokenInfo.trim() !== '';
         
          if (hasDexContract && hasTokenContract) {
            // Both contracts are filled, but keep as coming soon until validated
            updatedCard.isComingSoon = true;
          } else {
            // Missing contracts, keep as coming soon
            updatedCard.isComingSoon = true;
          }
        }
        
        return updatedCard;
      }
      return card;
    }));
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="edit-home-page">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading edit home screen...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="edit-home-page">
        {/* Admin Controls */}
        <div className="admin-controls">
          <button onClick={() => router.push('/admin/dashboard')} className="back-button">
            ← Back to Dashboard
          </button>
          {isEditing ? (
            <div className="edit-controls">
              <button onClick={handleSave} className="save-button">
                💾 Save Changes
              </button>
              <button onClick={handleCancel} className="cancel-button">
                ❌ Cancel Changes
              </button>
            </div>
          ) : (
            <button onClick={handleEdit} className="edit-button">
              ✏️ Edit Home Screen
            </button>
          )}
        </div>

        {/* Token Management Interface - Only when editing */}
        {isEditing && (
          <div className="token-management-interface">
            <div className="management-header">
              <h2>📧 Token Management</h2>
              <p>Manage all tokens and their tab assignments</p>
            </div>

            {/* Default Tab Selection */}
            <div className="default-tab-section">
              <h3>🎯 Default Tab Selection</h3>
              <p>Choose which tab users will see first when they visit the home page:</p>
              <div className="default-tab-controls">
                <label className="default-tab-option">
                  <input
                    type="radio"
                    name="defaultTab"
                    value="featured"
                    checked={defaultTab === 'featured'}
                    onChange={(e) => setDefaultTab(e.target.value)}
                  />
                  <span className="radio-label">
                    <strong>Featured (Mainnet)</strong> - Real tokens with real value
                  </span>
                </label>
                <label className="default-tab-option">
                  <input
                    type="radio"
                    name="defaultTab"
                    value="practice"
                    checked={defaultTab === 'practice'}
                    onChange={(e) => setDefaultTab(e.target.value)}
                  />
                  <span className="radio-label">
                    <strong>Practice Trading (Testnet)</strong> - Test tokens for learning
                  </span>
                </label>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="filter-controls">
              <span>Filter by tab:</span>
              <button 
                onClick={() => setFilterView('all')} 
                className={`filter-button ${filterView === 'all' ? 'active' : ''}`}
              >
                All ({tokenCards.length})
              </button>
              <button 
                onClick={() => setFilterView('featured')} 
                className={`filter-button ${filterView === 'featured' ? 'active' : ''}`}
              >
                Featured (Mainnet) ({tokenCards.filter(card => card.tabType === 'featured').length})
              </button>
              <button 
                onClick={() => setFilterView('practice')} 
                className={`filter-button ${filterView === 'practice' ? 'active' : ''}`}
              >
                Practice (Testnet) ({tokenCards.filter(card => card.tabType === 'practice').length})
              </button>
              <button 
                onClick={() => setFilterView('hidden')} 
                className={`filter-button ${filterView === 'hidden' ? 'active' : ''}`}
              >
                Hidden ({tokenCards.filter(card => card.isHidden).length})
              </button>
            </div>

            {/* Add Token Button */}
            <div className="add-token-section">
              <button onClick={addTokenCard} className="add-token-button">
                ➕ Add New Token
              </button>
            </div>

            {/* Token List Table */}
            <div className="token-list-container">
              <table className="token-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Status</th>
                    <th>Hidden</th>
                    <th>Tab Assignment</th>
                    <th>DEX Contract</th>
                    <th>Token Contract</th>
                    <th>Token Symbol</th>
                    <th>Revenue Locked</th>
                    <th>Liquidity Held</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tokenCards
                    .filter(card => {
                      if (filterView === 'all') return true;
                      if (filterView === 'hidden') return card.isHidden;
                      return card.tabType === filterView;
                    })
                    .map((card) => (
                    <tr key={card.id} className="token-row">
                      <td className="token-id">{card.id}</td>
                      <td className="token-status">
                        <span className={`status-badge ${card.isComingSoon ? 'coming-soon' : 'active'}`}>
                          {card.isComingSoon ? '🚧 Coming Soon' : '✅ Active'}
                        </span>
                      </td>
                      <td className="token-hidden">
                        <label className="hidden-toggle">
                          <input
                            type="checkbox"
                            checked={card.isHidden || false}
                            onChange={(e) => updateTokenCard(card.id, 'isHidden', e.target.checked)}
                            className="hidden-checkbox"
                          />
                          <span className="toggle-label">
                            {card.isHidden ? '👁️ Hidden' : '👁️ Visible'}
                          </span>
                        </label>
                      </td>
                      <td className="token-tab">
                        <select
                          value={card.tabType || 'featured'}
                          onChange={(e) => updateTokenCard(card.id, 'tabType', e.target.value)}
                          className="tab-select"
                        >
                          <option value="featured">🏠 Featured (Mainnet)</option>
                          <option value="practice">💼 Practice (Testnet)</option>
                        </select>
                      </td>
                      <td className="token-dex">
                        <input
                          type="text"
                          value={card.dexInfo || ''}
                          onChange={(e) => updateTokenCard(card.id, 'dexInfo', e.target.value)}
                          placeholder="Enter DEX contract address"
                          className="contract-input"
                        />
                      </td>
                      <td className="token-contract">
                        <input
                          type="text"
                          value={card.tokenInfo || ''}
                          onChange={(e) => updateTokenCard(card.id, 'tokenInfo', e.target.value)}
                          placeholder="Enter token contract address"
                          className="contract-input"
                        />
                      </td>
                      <td className="token-symbol">
                        {card.symbol || '--'}
                      </td>
                      <td className="token-revenue">
                        {card.revenue ? `${card.revenue} sats` : '--'}
                      </td>
                      <td className="token-liquidity">
                        {card.liquidity ? `${card.liquidity} sats` : '--'}
                      </td>
                      <td className="token-actions">
                        <button 
                          onClick={() => checkContractsForRow(card.id)}
                          disabled={checkingRows.has(card.id)}
                          className="check-contracts-button"
                          title="Check Contracts"
                        >
                          {checkingRows.has(card.id) ? '🔍 Checking...' : '🔍 Check'}
                        </button>
                        <button 
                          onClick={() => removeTokenCard(card.id)} 
                          className="remove-button"
                          title="Remove Token"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {tokenCards.filter(card => {
                if (filterView === 'all') return true;
                if (filterView === 'hidden') return card.isHidden;
                return card.tabType === filterView;
              }).length === 0 && (
                <div className="empty-state">
                  <p>
                    {filterView === 'hidden' 
                      ? 'No hidden tokens found.' 
                      : filterView === 'all'
                      ? 'No tokens found. Click "Add New Token" to get started.'
                      : `No tokens found in ${filterView} tab.`
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Home Page Preview - Always visible */}
        <div className="preview-section">
          <h3>👁️ Live Preview</h3>
          <p>This is how your home page will look to users:</p>
          
          <div className="home-preview">
            <div className="page-header-centered">
              <h1 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '12px',
                color: '#fbbf24',
                fontWeight: 'bold',
                fontSize: '2rem',
                fontFamily: 'Arial, sans-serif'
              }}>
                <img 
                  src="/icons/The Mas Network.svg" 
                  alt="MAS Sats" 
                  style={{ width: '60px', height: '60px' }} 
                />
                <span style={{ color: '#fbbf24' }}>Trade on Bitcoin Layer 3</span>
              </h1>
            </div>

            <div className="top-controls">
              <div className="tab-toggle">
                <button 
                  className={previewActiveTab === 'featured' ? 'active' : ''} 
                  onClick={() => setPreviewActiveTab('featured')}
                >
                  Featured
                </button>
                <button 
                  className={previewActiveTab === 'practice' ? 'active' : ''} 
                  onClick={() => setPreviewActiveTab('practice')}
                >
                  Practice Trading
                </button>
              </div>
            </div>

            <div className="token-grid">
              {tokenCards.filter(card => card.tabType === previewActiveTab && !card.isHidden).map((card) => {
                if (card.isComingSoon) {
                  return (
                    <div key={`coming-soon-${card.id}`} className="token-card coming-soon">
                      <div className="token-card-box">
                        <span className="token-symbol">🚧 {t('coming_soon')}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={`token-${card.id}`} className="token-card-wrapper">
                    <div className="token-card">
                      <div className="token-card-box">
                        <span className="token-symbol">
                          <span className="btc-symbol">₿</span> {card.symbol || tokenSymbol}
                        </span>
                      </div>

                      <div className="token-card-meta">
                        <p>
                          <span className="label">{t('revenue_locked')}:</span>{' '}
                          <span className="value sats">
                            <img src="/icons/sats1.svg" alt="sats" style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '2px' }} />
                            <img src="/icons/Vector.svg" alt="lightning" style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '4px' }} />
                            {card.revenue ? `${card.revenue} sats` : 'Real-time data'}
                          </span>
                        </p>
                        <p>
                          <span className="label">{t('liquidity_held')}:</span>{' '}
                          <span className="value sats">
                            <img src="/icons/sats1.svg" alt="sats" style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '2px' }} />
                            <img src="/icons/Vector.svg" alt="lightning" style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '4px' }} />
                            {card.liquidity ? `${card.liquidity} sats` : 'Real-time data'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {tokenCards.filter(card => card.tabType === previewActiveTab && !card.isHidden).length === 0 && (
                <div className="empty-preview">
                  <p>No visible tokens assigned to {previewActiveTab === 'featured' ? 'Featured' : 'Practice Trading'} tab</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 