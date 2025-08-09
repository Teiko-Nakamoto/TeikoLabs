'use client';

import React, { useState, useEffect } from 'react';

/**
 * UnlockProgressBar Component
 * 
 * A reusable component that shows progress towards the minimum revenue threshold 
 * needed to unlock mas sats for any token.
 * 
 * @param {Object} props
 * @param {string} props.tokenSymbol - The token symbol (e.g., 'BTC', 'ETH')
 * @param {string} props.revenue - Current revenue amount (formatted string with commas)
 * @param {string} props.liquidity - Current liquidity amount (formatted string with commas)
 * @param {boolean} props.showButtons - Whether to show action buttons (default: true)
 * @param {Function} props.onShowContracts - Callback for showing contract addresses
 * @param {Function} props.onClaimRevenue - Callback for claiming revenue
 * @param {string} props.tokenId - The token ID for lock/unlock functionality
 * @param {Component} props.LockUnlockButton - The LockUnlockButton component to use
 * 
 * @example
 * // Basic usage
 * <UnlockProgressBar
 *   tokenSymbol="BTC"
 *   revenue="1,000,000"
 *   liquidity="2,000,000"
 *   onShowContracts={() => setShowContracts(true)}
 *   onClaimRevenue={handleClaimRevenue}
 *   tokenId="1"
 *   LockUnlockButton={LockUnlockButton}
 * />
 * 
 * // Without buttons
 * <UnlockProgressBar
 *   tokenSymbol="ETH"
 *   revenue="500,000"
 *   liquidity="1,000,000"
 *   showButtons={false}
 * />
 */
const UnlockProgressBar = React.memo(function UnlockProgressBar({ 
  tokenSymbol = 'TOKEN', 
  revenue = '0', 
  liquidity = '0',
  showButtons = true,
  onShowContracts,
  onClaimRevenue,
  tokenId,
  LockUnlockButton,
  dexInfo,
  tokenInfo
}) {
  const [contractThreshold, setContractThreshold] = useState(0);
  const [loadingThreshold, setLoadingThreshold] = useState(true);
  const [showComingSoonPopup, setShowComingSoonPopup] = useState(false);

  // Fetch threshold from smart contract via API
  useEffect(() => {
    const fetchThreshold = async () => {
      // Check if wallet is connected (optional check for better UX)
      if (typeof window !== 'undefined') {
        const connectedAddress = localStorage.getItem('connectedAddress');
        if (!connectedAddress) {
          console.log('⚠️ No wallet connected, using fallback threshold');
          const currentLiquidity = parseFloat(liquidity.replace(/,/g, '')) || 0;
          setContractThreshold(Math.floor(currentLiquidity / 2) + 1);
          setLoadingThreshold(false);
          return;
        }
      }

      if (!dexInfo) {
        console.log('No dexInfo provided, using fallback threshold');
        const currentLiquidity = parseFloat(liquidity.replace(/,/g, '')) || 0;
        setContractThreshold(Math.floor(currentLiquidity / 2) + 1);
        setLoadingThreshold(false);
        return;
      }

      try {
        setLoadingThreshold(true);
        
        console.log('🔍 Fetching threshold via API for dexInfo:', dexInfo);
        console.log('🔍 Full dexInfo:', dexInfo);
        console.log('🔍 Full tokenInfo:', tokenInfo);
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await fetch(
          `/api/get-threshold?dexInfo=${encodeURIComponent(dexInfo)}&tokenInfo=${encodeURIComponent(tokenInfo || '')}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        const data = await response.json();
        
        console.log('🔍 API response:', data);
        
        if (data.threshold !== undefined && data.threshold >= 0) {
          console.log('✅ Using threshold from API:', data.threshold);
          setContractThreshold(data.threshold);
        } else {
          console.log('❌ No valid threshold from API, using fallback');
          // Fallback to calculated threshold
          const currentLiquidity = parseFloat(liquidity.replace(/,/g, '')) || 0;
          setContractThreshold(Math.floor(currentLiquidity / 2) + 1);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('⏰ Threshold fetch timed out, using fallback');
        } else {
          console.error('Failed to fetch threshold:', error);
        }
        // Fallback to calculated threshold
        const currentLiquidity = parseFloat(liquidity.replace(/,/g, '')) || 0;
        setContractThreshold(Math.floor(currentLiquidity / 2) + 1);
      } finally {
        setLoadingThreshold(false);
      }
    };

    fetchThreshold();
  }, [dexInfo, tokenInfo, liquidity]);

  // Calculate progress towards minimum revenue threshold
  const currentRevenue = parseFloat(revenue.replace(/,/g, '')) || 0;
  const currentLiquidity = parseFloat(liquidity.replace(/,/g, '')) || 0;
  const minimumRevenueThreshold = contractThreshold || Math.floor(currentLiquidity / 2) + 1;
  const progressPercentage = Math.min(100, Math.max(0, (currentRevenue / minimumRevenueThreshold) * 100));

  // Only log threshold calculation when values actually change
  useEffect(() => {
    console.log('🔍 Threshold calculation debug:', {
      contractThreshold,
      currentLiquidity,
      minimumRevenueThreshold,
      isUsingContractThreshold: contractThreshold > 0
    });
  }, [contractThreshold, currentLiquidity, minimumRevenueThreshold]);

  return (
    <div style={{
      background: '#1c2d4e',
      borderRadius: '12px',
      padding: '16px',
      width: '100%',
      color: '#eee',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: '#3776c6',
        borderRadius: '8px',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        {/* Token Display Box - Left Side */}
        <div style={{ 
          background: 'linear-gradient(to bottom, #001c34, #002b57)',
          padding: '2rem',
          borderRadius: '8px',
          border: '2px solid orange',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '150px',
          height: '140px',
          flexShrink: 0
        }}>
          <span style={{
            fontSize: '1.6rem',
            fontWeight: 'bold',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem'
          }}>
            <span style={{ color: '#ffa500', fontWeight: 'bold' }}>₿</span> {tokenSymbol}
          </span>
        </div>
        
        {/* Progress Bar Area - Middle */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ 
            fontSize: '14px', 
            color: '#ffa500', 
            fontWeight: '600', 
            marginBottom: '12px',
            textAlign: 'center',
            width: '92%'
          }}>
            Progress to Unlock
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{
              width: '92%',
              height: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative'
            }}>
              <div style={{
                width: `${progressPercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ffa500, #ff8c00)',
                borderRadius: '10px',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            
            {/* Lock/Unlock Emoji with Threshold Info below */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}>
              <div style={{ 
                fontSize: '1.5rem'
              }}>
                {currentRevenue >= minimumRevenueThreshold ? '🔓' : '🔒'}
              </div>
              
              {/* Threshold Info stacked under emoji */}
              <div style={{
                fontSize: '9px',
                color: '#ffa500',
                textAlign: 'center'
              }}>
                {currentRevenue >= minimumRevenueThreshold ? (
                  <>
                    <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Maintain:</div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      justifyContent: 'center'
                    }}>
                      {loadingThreshold ? 'Loading...' : minimumRevenueThreshold.toLocaleString()}
                      <img 
                        src="/icons/sats1.svg" 
                        alt="Sats" 
                        style={{ 
                          width: '14px', 
                          height: '14px'
                        }} 
                      />
                      <img 
                        src="/icons/Vector.svg" 
                        alt="Vector" 
                        style={{ 
                          width: '14px', 
                          height: '14px'
                        }} 
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>Min Needed</div>
                    <div>to Unlock:</div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      justifyContent: 'center'
                    }}>
                      {loadingThreshold ? 'Loading...' : minimumRevenueThreshold.toLocaleString()}
                      <img 
                        src="/icons/sats1.svg" 
                        alt="Sats" 
                        style={{ 
                          width: '14px', 
                          height: '14px'
                        }} 
                      />
                      <img 
                        src="/icons/Vector.svg" 
                        alt="Vector" 
                        style={{ 
                          width: '14px', 
                          height: '14px'
                        }} 
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Current Profit centered between progress bar ends */}
          <div style={{
            fontSize: '14px',
            color: '#ffa500',
            textAlign: 'center',
            marginTop: '8px',
            width: '92%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontWeight: 'bold'
          }}>
            Current Profit Available to Claim: {revenue}
            <img 
              src="/icons/sats1.svg" 
              alt="Sats" 
              style={{ 
                width: '16px', 
                height: '16px'
              }} 
            />
            <img 
              src="/icons/Vector.svg" 
              alt="Vector" 
              style={{ 
                width: '16px', 
                height: '16px'
              }} 
            />
          </div>


        </div>
      </div>
      


      {/* Action Buttons Section - Optional */}
      {showButtons && (
        <div style={{
          background: '#1c2d4e',
          borderRadius: '12px',
          padding: '16px',
          width: '100%',
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginTop: '12px'
        }}>
          <button
            onClick={onShowContracts}
            style={{
              background: '#3b82f6', 
              color: '#fff', 
              border: '1px solid #2563eb', 
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
              width: '220px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#2563eb';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#3b82f6';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
            }}
          >
            📋 Smart Contract Addresses
          </button>
          
          <button
            onClick={() => setShowComingSoonPopup(true)}
            style={{
              background: '#3b82f6', 
              color: '#fff', 
              border: '1px solid #2563eb', 
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
              width: '220px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#2563eb';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#3b82f6';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
            }}
          >
            💰 Claim Revenue
          </button>
          
          {/* Lock/Unlock Tokens Button */}
          {LockUnlockButton && (
            <LockUnlockButton 
              tokenId={tokenId}
              className="lock-unlock-button"
            >
              🔒 Lock/Unlock <img 
                src="/icons/The Mas Network.svg" 
                alt="MAS Sats" 
                style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginLeft: '4px' }}
              />
            </LockUnlockButton>
          )}
        </div>
      )}

      {/* Coming Soon Popup */}
      {showComingSoonPopup && (
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
            maxWidth: '400px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              fontSize: '60px',
              marginBottom: '20px'
            }}>
              🚧
            </div>
            <h2 style={{
              color: '#fbbf24',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px',
              fontFamily: 'Arial, sans-serif'
            }}>
              Coming Soon!
            </h2>
            <p style={{
              color: '#ccc',
              fontSize: '16px',
              lineHeight: '1.5',
              marginBottom: '24px',
              fontFamily: 'Arial, sans-serif'
            }}>
              Claim Revenue feature is currently under development. Stay tuned for updates!
            </p>
            <button
              onClick={() => setShowComingSoonPopup(false)}
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
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default UnlockProgressBar;