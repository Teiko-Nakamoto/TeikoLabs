'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../components/header';
import LockUnlockButton from '../../components/LockUnlockButton';
import './revenue-page.css';

export default function RevenuePage() {
  const params = useParams();
  const tokenId = params.tokenId;
  
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [userWallet, setUserWallet] = useState(null);
  const [isMajorityHolder, setIsMajorityHolder] = useState(false);

  const [claimAmount, setClaimAmount] = useState(() => {
    // Load saved claim amount from localStorage on component mount
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`revenue-claim-amount-${tokenId}`) || '';
    }
    return '';
  });
  const [isClaiming, setIsClaiming] = useState(false);
  const [revenueData, setRevenueData] = useState({
    totalRevenue: '2,500,000',
    availableToClaim: '1,250,000',
    userLockedTokens: '0',
    totalLockedTokens: '0',
    majorityThreshold: '0',
    tradingFees: '500,000',
    claimHistory: []
  });

  // Load saved step from localStorage on component mount
  useEffect(() => {
    const savedStep = localStorage.getItem(`revenue-step-${tokenId}`);
    if (savedStep) {
      const stepNumber = parseInt(savedStep, 10);
      if (stepNumber >= 1 && stepNumber <= 4) {
        setCurrentStep(stepNumber);
      }
    }
  }, [tokenId]);

  // Save current step to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`revenue-step-${tokenId}`, currentStep.toString());
  }, [currentStep, tokenId]);

  // Save claim amount to localStorage whenever it changes
  useEffect(() => {
    if (claimAmount) {
      localStorage.setItem(`revenue-claim-amount-${tokenId}`, claimAmount);
    }
  }, [claimAmount, tokenId]);

  // Function to clear saved step from localStorage
  const clearSavedStep = () => {
    localStorage.removeItem(`revenue-step-${tokenId}`);
    localStorage.removeItem(`revenue-claim-amount-${tokenId}`);
  };

  // Function to get connected wallet address
  const getConnectedWalletAddress = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('connectedAddress') || 'Not Connected';
    }
    return 'Not Connected';
  };

  // Function to fetch user's locked balance
  const fetchUserLockedBalance = async (userAddress) => {
    if (!userAddress || userAddress === 'Not Connected') {
      return 0;
    }
    
    try {
      console.log('🔍 Fetching user locked balance for:', userAddress);
      const response = await fetch(`/api/test-locked-balance?address=${userAddress}&tokenId=${tokenId}`);
      
      if (!response.ok) {
        console.error('❌ User locked balance API error:', response.status, response.statusText);
        return 0;
      }
      
      const data = await response.json();
      console.log('🔍 User locked balance response:', data);
      
      return data.lockedTokens || 0;
    } catch (error) {
      console.error('❌ Error fetching user locked balance:', error);
      return 0;
    }
  };

  // Function to fetch majority holder data and user data
  const fetchMajorityHolderData = async () => {
    try {
      console.log('🔍 Fetching majority holder data...');
      const response = await fetch(`/api/get-majority-holder?tokenId=${tokenId}&refresh=true`);
      
      if (!response.ok) {
        console.error('❌ Majority holder API error:', response.status, response.statusText);
        return;
      }
      
      const data = await response.json();
      console.log('🔍 Raw majority holder API response:', data);
      
      if (data.address && data.address !== 'Unknown') {
        // Get user's wallet address
        const userAddress = getConnectedWalletAddress();
        
        // Fetch user's locked balance
        const userLockedTokens = await fetchUserLockedBalance(userAddress);
        
        // Check if user is the majority holder
        const isUserMajorityHolder = userAddress === data.address;
        
        setRevenueData(prev => ({
          ...prev,
          majorityHolderAddress: data.address,
          majorityHolderLockedTokens: data.lockedTokens ? data.lockedTokens.toLocaleString() : '0',
          totalLockedTokens: data.totalLockedTokens ? data.totalLockedTokens.toLocaleString() : '0',
          majorityThreshold: data.majorityThreshold ? data.majorityThreshold.toLocaleString() : '0',
          userLockedTokens: userLockedTokens.toLocaleString(),
          isUserMajorityHolder: isUserMajorityHolder
        }));
        
        setIsMajorityHolder(isUserMajorityHolder);
        console.log('✅ Updated majority holder data:', data);
        console.log('✅ User locked tokens:', userLockedTokens);
        console.log('✅ Is user majority holder:', isUserMajorityHolder);
      } else {
        console.log('⚠️ No valid majority holder data received');
        console.log('⚠️ Address:', data.address);
        console.log('⚠️ Locked tokens:', data.lockedTokens);
      }
    } catch (error) {
      console.error('❌ Error fetching majority holder data:', error);
    }
  };

  // Fetch majority holder data when component mounts
  useEffect(() => {
    fetchMajorityHolderData();
  }, []);

  // Use data passed from trade page to avoid duplicate API calls
  useEffect(() => {
    const loadData = () => {
      try {
        // Check if revenue data was passed via URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const passedData = urlParams.get('data');
        
        if (passedData) {
          // Use ALL data passed from the trade page (no API calls needed)
          const dataFromTrade = JSON.parse(decodeURIComponent(passedData));
          
          // Set token data from passed data
          setTokenData(dataFromTrade.tokenData);
          
          // Set revenue data from passed data (convert numbers to formatted strings for display)
          setRevenueData({
            totalRevenue: dataFromTrade.totalRevenue.toLocaleString(),
            availableToClaim: dataFromTrade.availableToClaim.toLocaleString(),
            userLockedTokens: dataFromTrade.userLockedTokens.toLocaleString(),
            totalLockedTokens: dataFromTrade.totalLockedTokens.toLocaleString(),
            majorityThreshold: dataFromTrade.majorityThreshold.toLocaleString(),
            tradingFees: dataFromTrade.tradingFees.toLocaleString(),
            claimHistory: [],
            // Initialize majority holder fields (will be updated by fetchMajorityHolderData)
            majorityHolderAddress: 'Loading...',
            majorityHolderLockedTokens: '0'
          });
          
          // Check if user is majority holder (will be updated when wallet is connected)
          setIsMajorityHolder(false);
          
          console.log('💰 Using ALL data from trade page (no API calls):', dataFromTrade);
        } else {
          // Only fallback if no data was passed (shouldn't happen in normal flow)
          console.warn('⚠️ No data passed from trade page, falling back to API calls');
          fetchFallbackData();
        }
      } catch (error) {
        console.error('Error loading passed data:', error);
        fetchFallbackData();
      } finally {
        setLoading(false);
      }
    };

    if (tokenId) {
      loadData();
    }
  }, [tokenId]);

  // Fallback function only used if no data is passed
  const fetchFallbackData = async () => {
    try {
      const response = await fetch('/api/get-token-cards');
      const result = await response.json();
      
      if (result.tokenCards) {
        const token = result.tokenCards.find(t => t.id.toString() === tokenId);
        if (token) {
          setTokenData(token);
          await fetchRealRevenueData(token);
        }
      }
    } catch (error) {
      console.error('Error in fallback data fetch:', error);
    }
  };

  // Fetch real revenue data from smart contract and API
  const fetchRealRevenueData = async (token) => {
    try {
      console.log('🔍 Fetching real revenue data for token:', token.id);
      
      // Fetch total locked tokens
      const totalLockedResponse = await fetch('/api/total-locked-tokens');
      const totalLockedData = await totalLockedResponse.json();
      const totalLockedTokens = totalLockedData.balance || 0;
      
      // For now, use a placeholder for user's locked tokens since we need wallet connection
      // In a real implementation, this would fetch from the smart contract with user's address
      const userLockedTokens = 0; // Will be updated when wallet is connected
      
      // Calculate majority threshold (50% + 1)
      const majorityThreshold = Math.floor(totalLockedTokens / 2) + 1;
      
      // Check if user is majority holder
      const isMajority = userLockedTokens > majorityThreshold;
      setIsMajorityHolder(isMajority);
      
      // Fetch current price data which includes volume information
      const priceResponse = await fetch('/api/current-price');
      const priceData = await priceResponse.json();
      
      // Fetch actual accumulated fees from smart contract
      let totalRevenue = 0;
      
      try {
        // Fetch accumulated fees from the smart contract
        const feesResponse = await fetch('/api/get-accumulated-fees');
        const feesData = await feesResponse.json();
        
        if (feesData.fees) {
          totalRevenue = parseInt(feesData.fees);
        }
        
        console.log('💰 Smart contract fees response:', feesData);
        console.log('💰 Parsed total revenue:', totalRevenue);
        
      } catch (error) {
        console.error('Error fetching fees from smart contract:', error);
        // Fallback calculation if smart contract call fails
        const tradingVolume = priceData.volume || 1000000;
        const feeRate = 0.003;
        totalRevenue = Math.floor(tradingVolume * feeRate);
        console.log('💰 Using fallback calculation:', totalRevenue);
      }
      
      // Fetch majority holder information
      let majorityHolderData = null;
      try {
        const majorityResponse = await fetch(`/api/get-majority-holder?tokenId=${token.id}`);
        majorityHolderData = await majorityResponse.json();
        console.log('👑 Majority holder data:', majorityHolderData);
      } catch (error) {
        console.error('Error fetching majority holder:', error);
        // Use fallback data if API fails
        majorityHolderData = {
          address: 'ST1ABC...XYZ (Unknown)',
          lockedTokens: totalLockedTokens,
          totalLockedTokens: totalLockedTokens,
          majorityThreshold: majorityThreshold,
          percentage: 50.1
        };
      }
      
      const availableToClaim = totalRevenue; // Show total revenue available
      
      setRevenueData({
        totalRevenue: totalRevenue.toLocaleString(),
        availableToClaim: availableToClaim.toLocaleString(),
        userLockedTokens: userLockedTokens.toLocaleString(),
        totalLockedTokens: totalLockedTokens.toLocaleString(),
        majorityThreshold: majorityThreshold.toLocaleString(),
        tradingFees: Math.floor(totalRevenue * 0.1).toLocaleString(), // 10% of total as recent fees
        claimHistory: [],
        // Add majority holder data
        majorityHolderAddress: majorityHolderData.address,
        majorityHolderLockedTokens: majorityHolderData.lockedTokens.toLocaleString(),
        majorityHolderPercentage: majorityHolderData.percentage.toFixed(1)
      });
      
      console.log('✅ Real revenue data loaded:', {
        totalLockedTokens,
        userLockedTokens,
        majorityThreshold,
        isMajority,
        totalRevenue,
        availableToClaim
      });
      
    } catch (error) {
      console.error('❌ Error fetching real revenue data:', error);
      
      // Fallback to zero values if API calls fail
      setRevenueData({
        totalRevenue: '0',
        availableToClaim: '0',
        userLockedTokens: '0',
        totalLockedTokens: '0',
        majorityThreshold: '1',
        tradingFees: '0',
        claimHistory: [],
        majorityHolderAddress: 'ST1ABC...XYZ (Unknown)',
        majorityHolderLockedTokens: '0',
        majorityHolderPercentage: '0.0'
      });
      setIsMajorityHolder(false);
    }
  };

  const handleClaimRevenue = async () => {
    if (!claimAmount || parseFloat(claimAmount) <= 0) {
      alert('Please enter a valid amount to claim');
      return;
    }

    const availableAmount = parseFloat(revenueData.availableToClaim.replace(/,/g, ''));
    const requestedAmount = parseFloat(claimAmount);

    if (requestedAmount > availableAmount) {
      alert(`You can only claim up to ${revenueData.availableToClaim} sats`);
      return;
    }

    setIsClaiming(true);
    let formattedTxId = '';

    try {
      console.log('💰 Claiming revenue for token:', tokenId, 'Amount:', claimAmount);
      
      // Import required functions
      const { request } = await import('@stacks/connect');
      const { uintCV } = await import('@stacks/transactions');
      
      // Get token data for contract address
      const [dexAddress, dexName] = tokenData.dexInfo.split('.');
      
      console.log('🚀 Calling withdraw-fees contract function:', {
        contract: `${dexAddress}.${dexName}`,
        functionName: 'withdraw-fees',
        functionArgs: [uintCV(requestedAmount)],
        network: 'testnet'
      });

      const response = await request('stx_callContract', {
        contract: `${dexAddress}.${dexName}`,
        functionName: 'withdraw-fees',
        functionArgs: [uintCV(requestedAmount)],
        postConditionMode: 'allow',
        postConditions: [],
        network: 'testnet',
      });
      
      console.log('✅ Withdraw-fees request completed, response:', response);

      const { txid: txId } = response;
      formattedTxId = `0x${txId}`;

      console.log('View transaction:', `https://explorer.hiro.so/txid/${formattedTxId}?chain=testnet`);

      // Show success toast
      alert(`✅ Revenue claim submitted! Transaction ID: ${formattedTxId}`);
      
      // Store transaction ID and claim amount for step 4
      localStorage.setItem('lastClaimTxId', formattedTxId);
      localStorage.setItem('lastClaimAmount', claimAmount);
      
      // Proceed to step 4 (completion)
      setCurrentStep(4);
    } catch (error) {
      console.error('❌ Error claiming revenue:', error);
      alert(`Failed to claim revenue: ${error.message}`);
    } finally {
      setIsClaiming(false);
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };



  if (loading) {
    return (
      <>
        <Header />
        <main className="revenue-page">
          <div style={{ textAlign: 'center', padding: '3rem', color: 'white' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #374151', 
              borderTop: '4px solid #fbbf24', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite', 
              margin: '0 auto 1rem' 
            }}></div>
            <p>Loading revenue data...</p>
          </div>
        </main>
      </>
    );
  }

  if (!tokenData) {
    return (
      <>
        <Header />
        <main className="revenue-page">
          <div style={{ textAlign: 'center', padding: '3rem', color: 'white' }}>
            <p>Token not found</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="revenue-page">
        <div className="revenue-container">
          {/* Header Section */}
          <div className="revenue-header">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-start', 
              marginBottom: '1rem'
            }}>
              <button 
                onClick={() => {
                  clearSavedStep();
                  window.history.back();
                }}
                style={{
                  background: '#4a5568',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
              >
                ← Back to Trading
              </button>
            </div>
            
            <div className="token-info">
              <h1>💰 Revenue Claiming Process</h1>
              <p className="token-name">{tokenData.name || 'Token'}</p>
              <p className="token-symbol">{tokenData.symbol || 'SYMBOL'}</p>
            </div>
            
            {/* Available Revenue Display - Centered */}
            <div className="revenue-display" style={{ textAlign: 'center', margin: '1rem 0' }}>
              <div className="revenue-amount-large">
                <span className="amount">
                  {revenueData.availableToClaim} 
                  <img src="/icons/sats1.svg" alt="sats" style={{ width: '24px', height: '24px', verticalAlign: 'middle', marginLeft: '8px', marginRight: '4px' }} />
                  <img src="/icons/Vector.svg" alt="lightning" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} />
                </span>
                <span className="description">Available for claiming</span>
              </div>
            </div>
          </div>

          {/* Step Progress Indicator */}
          <div className="step-progress">
            <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Revenue Info & Requirements</div>
            </div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Majority Holder Review</div>
            </div>
            <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Claim Revenue</div>
            </div>
            <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
              <div className="step-number">4</div>
              <div className="step-label">Complete</div>
            </div>
          </div>

          {/* Step Content */}
          <div className="step-content">
                        {currentStep === 1 && (
              <div className="step-panel">
                <div className="step-header">
                  <h2>Revenue Information & Requirements</h2>
                  <p>Learn how revenue is generated and what you need to claim it</p>
                </div>
                
                <div className="info-content">

                  {/* How Revenue is Generated */}
                  <div className="info-section">
                    <h3>💱 How Revenue is Generated</h3>
                    <div className="revenue-explanation">
                      <div className="explanation-item">
                        <div className="explanation-icon">💱</div>
                        <div className="explanation-content">
                          <h4>Trading Fees</h4>
                          <p>Every trade on this token generates a small fee that accumulates as revenue</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Claiming Requirements */}
                  <div className="info-section">
                    <h3>🔒 Requirements to Claim Revenue</h3>
                    <div className="requirements-list">
                      <div className="requirement-item">
                        <div className="requirement-icon">👑</div>
                        <div className="requirement-content">
                          <h4>Majority Holder Status</h4>
                          <p>You must be the holder with the <strong>most locked tokens</strong> in the DEX smart contract to claim revenue.</p>
                        </div>
                      </div>
                    </div>
                  </div>


                  
                  <div className="step-actions">
                    <button onClick={nextStep} className="next-button">
                      Continue to Step 2 →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="step-panel">
                <div className="step-header">
                  <h2>Step 2: Majority Holder Review</h2>
                  <p>Review who currently holds the majority of locked tokens</p>
                </div>
                
                <div className="majority-holder-review">
                  {/* Main card container */}
                  <div style={{
                    background: '#1c2d4e',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                    wordWrap: 'break-word',
                    wordBreak: 'break-all'
                  }}>
                    {/* Side by side comparison container */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '20px'
                    }}>
                      {/* Current Majority Holder Info */}
                      <div className="majority-section">
                        <h3>👑 Current Majority Holder</h3>
                        <div className="holder-info">
                                                  <div className="info-row" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>
                          <span className="label">Holder Address:</span>
                          <span className="value" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>{revenueData.majorityHolderAddress || 'ST1ABC...XYZ (Loading...)'}</span>
                        </div>
                          <div className="info-row">
                            <span className="label">Locked Tokens:</span>
                            <span className="value">{revenueData.majorityHolderLockedTokens || '0'} tokens</span>
                          </div>
                        </div>
                      </div>

                      {/* Your Position */}
                      <div className="your-position-section">
                        <h3>📊 Your Current Position</h3>
                        <div className="position-info">
                          <div className="info-row" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>
                            <span className="label">Your Wallet Address:</span>
                            <span className="value" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>{getConnectedWalletAddress()}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Your Locked Tokens:</span>
                            <span className="value">{revenueData.userLockedTokens || '0'} tokens</span>
                          </div>
                          {revenueData.isUserMajorityHolder ? (
                            <div className="info-row">
                              <span className="label">Status:</span>
                              <span className="value status-majority">✅ You are the Majority Holder!</span>
                            </div>
                          ) : (
                            <>
                              <div className="info-row">
                                <span className="label">Tokens Needed to Lock:</span>
                                <span className="value">
                                  {(() => {
                                    const majorityHolderTokens = parseFloat(revenueData.majorityHolderLockedTokens?.replace(/,/g, '') || '0');
                                    const userTokens = parseFloat(revenueData.userLockedTokens?.replace(/,/g, '') || '0');
                                    const tokensNeeded = Math.max(0, majorityHolderTokens - userTokens + 0.00000001);
                                    return tokensNeeded.toLocaleString(undefined, { maximumFractionDigits: 8 });
                                  })()} tokens
                                </span>
                              </div>
                              <div className="info-row">
                                <span className="label">Majority Status:</span>
                                <span className="value status-not-majority">❌ Not Majority Holder</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>



                  {/* Action Required or Ready to Claim */}
                  {revenueData.isUserMajorityHolder ? (
                    <div className="action-required">
                      <div className="success-box">
                        <h4>🎉 Ready to Claim Revenue!</h4>
                        <p>You are the majority holder and can claim the available revenue.</p>
                        <p><strong>Your locked tokens: {revenueData.userLockedTokens} tokens</strong></p>
                        
                        {/* Optional Lock/Unlock Tokens Section */}
                        <div className="optional-lock-section">
                          <h5>🔒 Optional: Manage Your Locked Tokens</h5>
                          <p>You can lock or unlock additional tokens to maintain your majority status. This is completely optional - you can proceed to claim revenue now.</p>
                          <LockUnlockButton 
                            tokenId={tokenId}
                            className="lock-unlock-button"
                          >
                            🔒 Lock/Unlock Tokens
                          </LockUnlockButton>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="action-required">
                      <div className="warning-box">
                        <h4>⚠️ Action Required</h4>
                        <p>To claim revenue, you must become the majority holder by locking more tokens than the current holder.</p>
                        <p><strong>Current majority holder has: {revenueData.majorityHolderLockedTokens} tokens</strong></p>
                        <p><strong>You need to lock: {revenueData.majorityThreshold} tokens or more</strong></p>
                        
                        {/* Lock Tokens Button for Non-Majority Holders */}
                        <div className="lock-section">
                          <LockUnlockButton 
                            tokenId={tokenId}
                            className="lock-button"
                          >
                            🔒 Lock Tokens to Become Majority Holder
                          </LockUnlockButton>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="step-actions">
                    <button onClick={prevStep} className="back-button">
                      ← Back to Step 1
                    </button>
                    <button onClick={nextStep} className="next-button" disabled={!revenueData.isUserMajorityHolder}>
                      {revenueData.isUserMajorityHolder ? 'Continue to Claim Revenue' : 'Continue to Claim (Requires Majority Status)'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="step-panel">
                <div className="step-header">
                  <h2>Step 3: Claim Revenue</h2>
                  <p>Enter the amount of revenue you want to claim</p>
                </div>
                
                <div className="claim-revenue-section">
                  <div className="revenue-summary">
                    <h3>💰 Available Revenue</h3>
                    <div className="available-amount">
                      <span className="amount">{revenueData.availableToClaim}</span>
                      <span className="unit">
                        <img src="/icons/sats1.svg" alt="sats" style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '2px' }} />
                        <img src="/icons/Vector.svg" alt="lightning" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />
                      </span>
                    </div>
                    <p className="summary-text">You can claim up to the full available amount</p>
                  </div>
                  
                  <div className="claim-form">
                    <div className="form-group">
                      <label htmlFor="claimAmount">Amount to Claim</label>
                      <input
                        type="number"
                        id="claimAmount"
                        value={claimAmount}
                        onChange={(e) => setClaimAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="0"
                        max={revenueData.availableToClaim.replace(/,/g, '')}
                        step="1"
                        className="claim-input"
                      />
                      <div className="input-actions">
                        <button 
                          onClick={() => setClaimAmount(revenueData.availableToClaim.replace(/,/g, ''))}
                          className="max-button"
                        >
                          Max
                        </button>
                        <button 
                          onClick={() => setClaimAmount('')}
                          className="clear-button"
                        >
                          Clear
                        </button>
                      </div>
                      
                      {/* Percentage-based withdrawal options */}
                      <div className="percentage-options">
                        <label className="percentage-label">Quick Withdrawal Options:</label>
                        <div className="percentage-buttons">
                          {[10, 15, 21, 50, 100].map((percentage) => {
                            const availableAmount = parseFloat(revenueData.availableToClaim.replace(/,/g, '') || '0');
                            const percentageAmount = Math.floor((availableAmount * percentage) / 100);
                            return (
                              <button
                                key={percentage}
                                onClick={() => setClaimAmount(percentageAmount.toString())}
                                className="percentage-button"
                                style={{
                                  background: '#374151',
                                  color: '#fff',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  padding: '12px 16px',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  fontWeight: 'normal',
                                  minWidth: '120px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = '#f97316';
                                  e.target.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = '#374151';
                                  e.target.style.transform = 'translateY(0)';
                                }}
                              >
                                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{percentage}%</span>
                                <span style={{ fontSize: '10px', opacity: '0.9', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                  {percentageAmount.toLocaleString()}
                                  <img src="/icons/sats1.svg" alt="sats" style={{ width: '10px', height: '10px', verticalAlign: 'middle' }} />
                                  <img src="/icons/Vector.svg" alt="lightning" style={{ width: '10px', height: '10px', verticalAlign: 'middle' }} />
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="claim-preview">
                      <h4>Claim Preview</h4>
                      <div className="preview-item">
                        <span className="label">Amount to Claim:</span>
                        <span className="value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {claimAmount || '0'}
                          <img src="/icons/sats1.svg" alt="sats" style={{ width: '14px', height: '14px', verticalAlign: 'middle' }} />
                          <img src="/icons/Vector.svg" alt="lightning" style={{ width: '14px', height: '14px', verticalAlign: 'middle' }} />
                        </span>
                      </div>
                      <div className="preview-item">
                        <span className="label">Remaining After Claim:</span>
                        <span className="value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {claimAmount ? 
                            (parseFloat(revenueData.availableToClaim.replace(/,/g, '')) - parseFloat(claimAmount)).toLocaleString() : 
                            revenueData.availableToClaim
                          }
                          <img src="/icons/sats1.svg" alt="sats" style={{ width: '14px', height: '14px', verticalAlign: 'middle' }} />
                          <img src="/icons/Vector.svg" alt="lightning" style={{ width: '14px', height: '14px', verticalAlign: 'middle' }} />
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="step-actions">
                    <button onClick={prevStep} className="back-button">
                      ← Back to Step 2
                    </button>
                    <button 
                      onClick={handleClaimRevenue}
                      className="claim-button"
                      disabled={!claimAmount || parseFloat(claimAmount) <= 0 || isClaiming}
                    >
                      {isClaiming ? 'Claiming...' : 'Claim Revenue'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="step-panel">
                <div className="step-header">
                  <h2>Step 4: Claim Complete!</h2>
                  <p>Your revenue has been successfully claimed</p>
                </div>
                
                <div className="success-message">
                  <div className="success-icon">🎉</div>
                  <h3>Revenue Claimed Successfully!</h3>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                    Your {localStorage.getItem('lastClaimAmount') || claimAmount || '0'}
                    <img src="/icons/sats1.svg" alt="sats" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />
                    <img src="/icons/Vector.svg" alt="lightning" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />
                    have been transferred to your wallet.
                  </p>
                  
                  <div className="transaction-details">
                    <div className="detail-item">
                      <span className="label">Transaction ID:</span>
                      <span className="value" style={{ 
                        wordBreak: 'break-all', 
                        overflowWrap: 'break-word',
                        maxWidth: '100%',
                        display: 'block'
                      }}>
                        {localStorage.getItem('lastClaimTxId') ? (
                          <a 
                            href={`https://explorer.hiro.so/txid/${localStorage.getItem('lastClaimTxId')}?chain=testnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                              color: '#3b82f6', 
                              textDecoration: 'underline',
                              wordBreak: 'break-all',
                              overflowWrap: 'break-word'
                            }}
                          >
                            {localStorage.getItem('lastClaimTxId')}
                          </a>
                        ) : (
                          '0xABC123...XYZ789'
                        )}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Claimed Amount:</span>
                      <span className="value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {localStorage.getItem('lastClaimAmount') || claimAmount || '0'}
                        <img src="/icons/sats1.svg" alt="sats" style={{ width: '14px', height: '14px', verticalAlign: 'middle' }} />
                        <img src="/icons/Vector.svg" alt="lightning" style={{ width: '14px', height: '14px', verticalAlign: 'middle' }} />
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Claim Date:</span>
                      <span className="value">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="step-actions">
                    <button onClick={() => {
                      clearSavedStep();
                      window.history.back();
                    }} className="back-button">
                      ← Back to Trading
                    </button>
                    <button onClick={() => {
                      clearSavedStep();
                      setCurrentStep(1);
                    }} className="next-button">
                      Claim More Revenue
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>


        </div>
      </main>
    </>
  );
} 