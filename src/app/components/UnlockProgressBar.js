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
export default function UnlockProgressBar({ 
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

  // Fetch threshold from smart contract via API
  useEffect(() => {
    const fetchThreshold = async () => {
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
        
        const response = await fetch(`/api/get-threshold?dexInfo=${encodeURIComponent(dexInfo)}&tokenInfo=${encodeURIComponent(tokenInfo || '')}`);
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
        console.error('Failed to fetch threshold:', error);
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

  console.log('🔍 Threshold calculation debug:', {
    contractThreshold,
    currentLiquidity,
    minimumRevenueThreshold,
    isUsingContractThreshold: contractThreshold > 0
  });

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
            color: '#fff', 
            fontWeight: '600', 
            marginBottom: '12px',
            textAlign: 'center',
            width: '50%'
          }}>
            Progress to Unlock {tokenSymbol}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px' }}>
            <div style={{
              width: '50%',
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
            
            {/* Lock/Unlock Emoji - Next to Progress Bar */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              {currentRevenue >= minimumRevenueThreshold ? '🔓' : '🔒'}
            </div>
          </div>
          <div style={{
            fontSize: '12px',
            color: '#ffa500',
            textAlign: 'center',
            marginTop: '8px',
            width: '50%',
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
            marginTop: '4px',
            width: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}>
            Min Threshold Needed to Unlock: {loadingThreshold ? 'Loading...' : minimumRevenueThreshold.toLocaleString()}
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
          {/* Debug info - remove this later */}
          <div style={{
            fontSize: '10px',
            color: '#ccc',
            textAlign: 'center',
            marginTop: '4px',
            width: '50%'
          }}>
            Debug: tokenId={tokenId}, dexInfo={dexInfo}, tokenInfo={tokenInfo}
          </div>
          {/* DUMMY DATA indicator */}
          <div style={{
            fontSize: '10px',
            color: '#ff6b6b',
            textAlign: 'center',
            marginTop: '2px',
            width: '50%',
            fontWeight: 'bold'
          }}>
            {loadingThreshold ? 'LOADING...' : 'REAL BLOCKCHAIN DATA'}
          </div>
        </div>
      </div>
      
      {/* Bottom Text with Mas Sats Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginTop: '12px',
        padding: '8px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '6px'
      }}>
        <span style={{ fontSize: '12px', color: '#ccc' }}>
          Minimum revenue needed to unlock
        </span>
        <img 
          src="/icons/sats1.svg" 
          alt="Mas Sats" 
          style={{ 
            width: '16px', 
            height: '16px',
            filter: 'brightness(0) invert(1)'
          }} 
        />
        <span style={{ fontSize: '12px', color: '#ccc' }}>
          mas sats
        </span>
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
              background: '#f97316', 
              color: '#fff', 
              border: '1px solid #ea580c', 
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(249, 115, 22, 0.2)',
              width: '220px',
              height: '40px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#ea580c';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 8px rgba(249, 115, 22, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#f97316';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(249, 115, 22, 0.2)';
            }}
          >
            📋 Smart Contract Addresses
          </button>
          
          <button
            onClick={onClaimRevenue}
            style={{
              background: '#f97316', 
              color: '#fff', 
              border: '1px solid #ea580c', 
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(249, 115, 22, 0.2)',
              width: '220px',
              height: '40px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#ea580c';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 8px rgba(249, 115, 22, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#f97316';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(249, 115, 22, 0.2)';
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
              🔒 Lock/Unlock Tokens
            </LockUnlockButton>
          )}
        </div>
      )}
    </div>
  );
} 