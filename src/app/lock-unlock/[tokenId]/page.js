'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../components/header';
import TransactionToast from '../../components/TransactionToast';
import { handleLockUnlockTransaction } from '../../utils/lockUnlockLogic';
import { getUserTokenBalance, getTokenStatsData } from '../../utils/fetchTokenData';
import './lock-unlock-page.css';

export default function LockUnlockPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const tokenId = params.tokenId;
  
  // State variables
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('lock'); // 'lock' or 'unlock'
  const [amount, setAmount] = useState('');
  const [userLockedTokens, setUserLockedTokens] = useState(0);
  const [userTokenBalance, setUserTokenBalance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toast, setToast] = useState({ message: '', txId: '', visible: false, status: 'pending' });
  
  // Progress bar data
  const [revenue, setRevenue] = useState('--');
  const [liquidity, setLiquidity] = useState('--');
  const [threshold, setThreshold] = useState('--');
  
  // Calculate if unlock is available
  const canUnlock = threshold !== '--' && revenue !== '--' && parseFloat(revenue.replace(/,/g, '')) >= parseFloat(threshold.replace(/,/g, ''));

  // Get connected wallet address
  const getConnectedWalletAddress = () => {
    console.log('🔍 Checking for wallet connection...');
    
    // Check localStorage for connected address (same as header component)
    if (typeof window !== 'undefined') {
      const connectedAddress = localStorage.getItem('connectedAddress');
      console.log('🔍 Connected address from localStorage:', connectedAddress);
      
      if (connectedAddress) {
        return connectedAddress;
      }
    }
    
    // Fallback to LeatherProvider if available
    if (typeof window !== 'undefined' && window.LeatherProvider) {
      const address = window.LeatherProvider.selectedAddress;
      console.log('🔍 Found address from LeatherProvider:', address);
      return address;
    }
    
    console.log('❌ No wallet connection found');
    return null;
  };

  // Fetch threshold data from smart contract
  const fetchThreshold = async (tokenData) => {
    try {
      console.log('🔍 Fetching threshold via API for dexInfo:', tokenData.dexInfo);
      const response = await fetch(`/api/get-threshold?dexInfo=${encodeURIComponent(tokenData.dexInfo)}&tokenInfo=${encodeURIComponent(tokenData.tokenInfo || '')}`);
      const data = await response.json();
      
      console.log('🔍 API response:', data);
      
      if (data.threshold !== undefined && data.threshold >= 0) {
        console.log('✅ Using threshold from API:', data.threshold);
        setThreshold(data.threshold.toLocaleString());
      } else {
        console.log('❌ No valid threshold from API, using fallback');
        setThreshold('--');
      }
    } catch (error) {
      console.error('Failed to fetch threshold:', error);
      setThreshold('--');
    }
  };

  // Fetch token stats data for progress bar
  const fetchTokenStats = async (tokenData) => {
    try {
      const statsData = await getTokenStatsData(tokenData);
      setRevenue(statsData.revenue.toLocaleString());
      setLiquidity(statsData.liquidity.toLocaleString());
      console.log('🔍 Token stats updated:', statsData);
    } catch (error) {
      console.error('Error fetching token stats:', error);
      setRevenue('--');
      setLiquidity('--');
    }
  };

  // Fetch user's current locked tokens and token balance
  const fetchUserData = async (tokenData) => {
    const userAddress = getConnectedWalletAddress();
    if (!userAddress || userAddress === 'Not Connected') {
      setError('Please connect your wallet first');
      return;
    }

    try {
      // Fetch user's locked tokens using the same logic as revenue flow
      console.log('🔍 Fetching user locked balance for:', userAddress);
      const lockedResponse = await fetch(`/api/test-locked-balance?address=${userAddress}&tokenId=${tokenId}`);
      
      if (!lockedResponse.ok) {
        console.error('❌ User locked balance API error:', lockedResponse.status, lockedResponse.statusText);
        setUserLockedTokens(0);
      } else {
        const lockedData = await lockedResponse.json();
        console.log('🔍 User locked balance response:', lockedData);
        setUserLockedTokens(lockedData.lockedTokens || 0);
      }

      // Fetch user's token balance using the same logic as BuySellBox
      console.log('🔍 Fetching user token balance...');
      const tokenBalance = await getUserTokenBalance();
      console.log('🔍 User token balance:', tokenBalance);
      setUserTokenBalance(tokenBalance);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to fetch user data');
    }
  };

  // Load token data
  useEffect(() => {
    const loadTokenData = async () => {
      try {
        const response = await fetch('/api/get-token-cards');
        const result = await response.json();
        
        if (result.tokenCards) {
          const token = result.tokenCards.find(t => t.id.toString() === tokenId);
          if (token) {
            setTokenData(token);
            // Fetch user data, token stats, and threshold
            await Promise.all([
              fetchUserData(token),
              fetchTokenStats(token),
              fetchThreshold(token)
            ]);
          } else {
            setError('Token not found');
          }
        }
      } catch (error) {
        console.error('Error loading token data:', error);
        setError('Failed to load token data');
      } finally {
        setLoading(false);
      }
    };

    if (tokenId) {
      loadTokenData();
    }
  }, [tokenId]);

  // Handle lock/unlock action
  const handleAction = async () => {
    console.log('🔍 handleAction called with action:', action, 'amount:', amount);
    
    const userAddress = getConnectedWalletAddress();
    console.log('🔍 User address:', userAddress);
    
    if (!userAddress) {
      console.log('❌ No wallet connected');
      setError('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      console.log('❌ Invalid amount:', amount);
      setError('Please enter a valid amount');
      return;
    }

    console.log('✅ Starting transaction...');
    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      console.log(`${action}ing ${amount} tokens for user ${userAddress}`);
      
      // Call the smart contract function
      const result = await handleLockUnlockTransaction(
        action,
        amount,
        tokenData.dexInfo,
        setError,
        setToast
      );
      
      console.log('🔍 Transaction result:', result);
      
      if (result) {
        setSuccess(`Successfully ${action}ed ${amount} tokens!`);
        
        // Refresh user data
        await fetchUserData(tokenData);
        
        // Clear amount
        setAmount('');
      }
      
    } catch (error) {
      console.error(`Error ${action}ing tokens:`, error);
      setError(`Failed to ${action} tokens: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Handle toast close
  const handleCloseToast = () => {
    setToast({ message: '', txId: '', visible: false, status: 'pending' });
  };

  // Navigate to trading page
  const handleGoToTrading = () => {
    router.push(`/trade/${tokenId}`);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="lock-unlock-page">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading token data...</p>
          </div>
        </main>
      </>
    );
  }

  if (!tokenData) {
    return (
      <>
        <Header />
        <main className="lock-unlock-page">
          <div className="error-container">
            <p>Token not found</p>
            <button onClick={handleBack} className="back-button">Go Back</button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="lock-unlock-page">
        <div className="container">
          <div className="header-section">
            <button onClick={handleBack} className="back-button">
              ← Back
            </button>
            <h1>Lock/Unlock {tokenData.symbol} Tokens</h1>
          </div>

          <div className="token-info">
            <h2>{tokenData.symbol} Token</h2>
            <div className="contract-details">
              <p><strong>DEX Contract:</strong> {tokenData.dexInfo}</p>
              <p><strong>Token Contract:</strong> {tokenData.tokenInfo}</p>
              <p><strong>Your Wallet:</strong> {getConnectedWalletAddress()}</p>
            </div>
          </div>

          {/* Simple Progress to Unlock Info */}
          <div style={{
            background: '#1c2d4e',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            color: '#eee',
            fontFamily: 'Arial, sans-serif'
          }}>
            <div style={{
              fontSize: '14px', 
              color: '#fff', 
              fontWeight: '600', 
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              Progress to Unlock {tokenData.symbol}
            </div>
            
            {/* Visual Progress Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{
                width: '200px',
                height: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'relative'
              }}>
                                 <div style={{
                   width: `${threshold === '--' || revenue === '--' ? 0 : Math.min(100, Math.max(0, (parseFloat(revenue.replace(/,/g, '')) / parseFloat(threshold.replace(/,/g, ''))) * 100))}%`,
                   height: '100%',
                   background: 'linear-gradient(90deg, #ffa500, #ff8c00)',
                   borderRadius: '10px',
                   transition: 'width 0.3s ease'
                 }}></div>
              </div>
              
              {/* Lock/Unlock Emoji */}
                             <div style={{ 
                 display: 'flex', 
                 alignItems: 'center', 
                 justifyContent: 'center',
                 fontSize: '1.5rem'
               }}>
                 {threshold === '--' || revenue === '--' ? '🔒' : (parseFloat(revenue.replace(/,/g, '')) >= parseFloat(threshold.replace(/,/g, '')) ? '🔓' : '🔒')}
               </div>
            </div>
            
            <div style={{
              fontSize: '12px',
              color: '#ffa500',
              textAlign: 'center',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}>
              Current Revenue Available to Claim: {revenue}
              <img 
                src="/icons/sats1.svg" 
                alt="Sats Lightning" 
                style={{ 
                  width: '12px', 
                  height: '12px',
                  filter: 'brightness(0) invert(1)'
                }} 
              />
            </div>
            
                         <div style={{
               fontSize: '12px',
               color: '#ffa500',
               textAlign: 'center',
               marginBottom: '4px',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: '4px'
             }}>
               Min Threshold Needed to Unlock: {threshold === '--' ? 'Loading...' : threshold}
               <img 
                 src="/icons/sats1.svg" 
                 alt="Sats Lightning" 
                 style={{ 
                   width: '12px', 
                   height: '12px',
                   filter: 'brightness(0) invert(1)'
                 }} 
               />
             </div>
            
            <div style={{
              fontSize: '10px',
              color: '#ff6b6b',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              REAL BLOCKCHAIN DATA
            </div>
          </div>

          <div className="user-stats">
            <div className="stat-card">
              <h3>Your Locked Tokens</h3>
              <p className="stat-value">{userLockedTokens.toLocaleString(undefined, { maximumFractionDigits: 8 })}</p>
            </div>
            <div className="stat-card">
              <h3>Your Token Balance</h3>
              <p className="stat-value">{userTokenBalance.toLocaleString(undefined, { maximumFractionDigits: 8 })}</p>
            </div>
          </div>

                     <div className="action-section">
             <div className="action-tabs">
               <button 
                 className={`tab ${action === 'lock' ? 'active' : ''}`}
                 onClick={() => setAction('lock')}
               >
                 🔒 Lock Tokens
               </button>
               <button 
                 className={`tab ${action === 'unlock' ? 'active' : ''} ${!canUnlock ? 'disabled' : ''}`}
                 onClick={() => canUnlock && setAction('unlock')}
                 disabled={!canUnlock}
                 style={{
                   opacity: canUnlock ? 1 : 0.5,
                   cursor: canUnlock ? 'pointer' : 'not-allowed'
                 }}
               >
                 🔓 Unlock Tokens
               </button>
             </div>

                         <div className="action-form">
               {/* Warning message when unlock is not available */}
               {action === 'unlock' && !canUnlock && (
                 <div style={{
                   background: '#2d3748',
                   border: '1px solid #e53e3e',
                   borderRadius: '8px',
                   padding: '16px',
                   marginBottom: '16px',
                   color: '#fff'
                 }}>
                   <div style={{
                     display: 'flex',
                     alignItems: 'center',
                     gap: '8px',
                     marginBottom: '12px',
                     color: '#e53e3e',
                     fontWeight: 'bold'
                   }}>
                     ⚠️ Unlock Not Available
                   </div>
                   <p style={{ marginBottom: '12px', fontSize: '14px' }}>
                     Trading fees need to reach the minimum threshold before you can unlock tokens.
                   </p>
                   <div style={{ fontSize: '13px', color: '#a0aec0', marginBottom: '16px' }}>
                     <p><strong>Current Revenue:</strong> {revenue} sats</p>
                     <p><strong>Required Threshold:</strong> {threshold} sats</p>
                     <p><strong>Shortfall:</strong> {threshold !== '--' && revenue !== '--' ? (parseFloat(threshold.replace(/,/g, '')) - parseFloat(revenue.replace(/,/g, ''))).toLocaleString() : '--'} sats</p>
                   </div>
                   <div style={{
                     background: '#1a202c',
                     borderRadius: '6px',
                     padding: '12px',
                     marginBottom: '16px'
                   }}>
                     <p style={{ fontSize: '13px', marginBottom: '8px', color: '#fbbf24' }}>
                       <strong>💡 How to increase trading fees:</strong>
                     </p>
                     <ul style={{ fontSize: '12px', color: '#a0aec0', margin: 0, paddingLeft: '16px' }}>
                       <li>Trade more tokens to generate fees</li>
                       <li>Encourage others to trade on this token</li>
                       <li>Wait for more trading activity</li>
                     </ul>
                   </div>
                   <button
                     onClick={handleGoToTrading}
                     style={{
                       background: '#f97316',
                       color: '#fff',
                       border: 'none',
                       borderRadius: '6px',
                       padding: '10px 20px',
                       fontSize: '14px',
                       cursor: 'pointer',
                       fontWeight: '600',
                       width: '100%'
                     }}
                     onMouseEnter={(e) => e.target.style.background = '#ea580c'}
                     onMouseLeave={(e) => e.target.style.background = '#f97316'}
                   >
                     🚀 Go to Trading Page
                   </button>
                 </div>
               )}

               <div className="input-group">
                 <label htmlFor="amount">Amount to {action}:</label>
                 <input
                   type="number"
                   id="amount"
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   placeholder={`Enter amount to ${action}`}
                   min="0"
                   step="0.00000001"
                   disabled={isProcessing || (action === 'unlock' && !canUnlock)}
                 />
               </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              {success && (
                <div className="success-message">
                  {success}
                </div>
              )}

                             <button
                 onClick={() => {
                   console.log('🔍 Button clicked!');
                   handleAction();
                 }}
                 disabled={isProcessing || !amount || parseFloat(amount) <= 0 || (action === 'unlock' && !canUnlock)}
                 className={`action-button ${isProcessing ? 'processing' : ''} ${action === 'unlock' && !canUnlock ? 'disabled' : ''}`}
                 style={{
                   opacity: (action === 'unlock' && !canUnlock) ? 0.5 : 1,
                   cursor: (action === 'unlock' && !canUnlock) ? 'not-allowed' : 'pointer'
                 }}
               >
                {isProcessing ? (
                  <>
                    <div className="spinner"></div>
                    {action === 'lock' ? 'Locking...' : 'Unlocking...'}
                  </>
                ) : (
                  `${action === 'lock' ? 'Lock' : 'Unlock'} Tokens`
                )}
              </button>
            </div>
          </div>

          <div className="info-section">
            <h3>About Locking/Unlocking</h3>
            <div className="info-cards">
              <div className="info-card">
                <h4>🔒 Locking Tokens</h4>
                <p>Locking tokens makes you eligible to claim revenue. The more tokens you lock, the higher your chance of becoming the majority holder.</p>
              </div>
              <div className="info-card">
                <h4>🔓 Unlocking Tokens</h4>
                <p>Unlocking tokens removes them from the revenue pool. You can only unlock tokens that you previously locked.</p>
              </div>
              <div className="info-card">
                <h4>👑 Majority Holder</h4>
                <p>The address with the most locked tokens becomes the majority holder and can claim all accumulated revenue.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Toast */}
        {toast.visible && (
          <TransactionToast
            message={toast.message}
            txId={toast.txId}
            status={toast.status}
            onClose={handleCloseToast}
          />
        )}
      </main>
    </>
  );
} 