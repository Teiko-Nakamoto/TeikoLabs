'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../components/header';
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

  // Get connected wallet address
  const getConnectedWalletAddress = () => {
    if (typeof window !== 'undefined' && window.LeatherProvider) {
      return window.LeatherProvider.selectedAddress;
    }
    return null;
  };

  // Fetch user's current locked tokens and token balance
  const fetchUserData = async () => {
    const userAddress = getConnectedWalletAddress();
    if (!userAddress) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      // Fetch user's locked tokens
      const lockedResponse = await fetch(`/api/test-locked-balance?address=${userAddress}&tokenId=${tokenId}`);
      const lockedData = await lockedResponse.json();
      
      if (lockedData.success) {
        setUserLockedTokens(lockedData.lockedTokens);
      }

      // TODO: Fetch user's token balance (you'll need to create this API)
      // const balanceResponse = await fetch(`/api/get-user-token-balance?address=${userAddress}&tokenId=${tokenId}`);
      // const balanceData = await balanceResponse.json();
      // setUserTokenBalance(balanceData.balance || 0);
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
            await fetchUserData();
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
    const userAddress = getConnectedWalletAddress();
    if (!userAddress) {
      setError('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      // TODO: Implement actual lock/unlock transaction
      // This would call the smart contract functions
      console.log(`${action}ing ${amount} tokens for user ${userAddress}`);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(`Successfully ${action}ed ${amount} tokens!`);
      
      // Refresh user data
      await fetchUserData();
      
      // Clear amount
      setAmount('');
      
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
            <p>Contract: {tokenData.dexInfo}</p>
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
                className={`tab ${action === 'unlock' ? 'active' : ''}`}
                onClick={() => setAction('unlock')}
              >
                🔓 Unlock Tokens
              </button>
            </div>

            <div className="action-form">
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
                  disabled={isProcessing}
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
                onClick={handleAction}
                disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                className={`action-button ${isProcessing ? 'processing' : ''}`}
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
      </main>
    </>
  );
} 