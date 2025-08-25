'use client';

import React, { useState, useEffect } from 'react';

/**
 * WhaleAccessProgressBar Component
 * 
 * An independent progress bar component specifically for the whale access popup
 * that tracks progress towards the minimum revenue threshold needed to unlock mas sats.
 * This component is completely separate from the main UnlockProgressBar to ensure
 * independent state management.
 * 
 * @param {Object} props
 * @param {string} props.tokenSymbol - The token symbol (e.g., 'BTC', 'ETH')
 * @param {string} props.revenue - Current revenue amount (formatted string with commas)
 * @param {string} props.liquidity - Current liquidity amount (formatted string with commas)
 * @param {string} props.tokenId - The token ID for lock/unlock functionality
 * @param {string} props.dexInfo - The DEX contract info (format: "address.contract-name")
 * @param {string} props.tokenInfo - The token contract info (format: "address.contract-name")
 * 
 * @example
 * // Basic usage in whale access popup
 * <WhaleAccessProgressBar
 *   tokenSymbol="BTC"
 *   revenue="1,000,000"
 *   liquidity="2,000,000"
 *   tokenId="1"
 *   dexInfo="ST1234567890ABCDEF.dex-contract"
 *   tokenInfo="ST1234567890ABCDEF.token-contract"
 * />
 */
const WhaleAccessProgressBar = React.memo(function WhaleAccessProgressBar({ 
  tokenSymbol = 'TOKEN', 
  revenue = '0', 
  liquidity = '0',
  tokenId,
  dexInfo,
  tokenInfo
}) {
  const [contractThreshold, setContractThreshold] = useState(0);
  const [loadingThreshold, setLoadingThreshold] = useState(true);

  // Parse revenue to number and ensure it's reasonable (cap at 1 billion to prevent display issues)
  const currentRevenue = typeof revenue === 'string' 
    ? parseFloat(revenue.replace(/,/g, '')) || 0 
    : revenue || 0;
  
  // Cap revenue at 1 billion to prevent display issues
  const cappedRevenue = Math.min(currentRevenue, 1000000000);

  // Calculate minimum revenue threshold (same logic as main component)
  const minimumRevenueThreshold = contractThreshold || 1000000; // Default 1M sats

  // Calculate progress percentage
  const progressPercentage = minimumRevenueThreshold > 0 
    ? Math.min((cappedRevenue / minimumRevenueThreshold) * 100, 100) 
    : 0;
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 WhaleAccessProgressBar: Current state:', {
      contractThreshold,
      currentRevenue,
      minimumRevenueThreshold,
      progressPercentage,
      dexInfo,
      tokenInfo
    });
  }, [contractThreshold, currentRevenue, minimumRevenueThreshold, progressPercentage, dexInfo, tokenInfo]);

  // Fetch contract threshold
  useEffect(() => {
    const fetchThreshold = async () => {
      if (!dexInfo) {
        console.log('🔍 WhaleAccessProgressBar: No dexInfo provided, using fallback threshold');
        const currentLiquidity = typeof liquidity === 'string' 
          ? parseFloat(liquidity.replace(/,/g, '')) || 0 
          : liquidity || 0;
        setContractThreshold(Math.floor(currentLiquidity / 2) + 1);
        setLoadingThreshold(false);
        return;
      }

      try {
        setLoadingThreshold(true);
        console.log('🔍 WhaleAccessProgressBar: Fetching threshold with dexInfo:', dexInfo);
        
        const response = await fetch(`/api/get-threshold?dexInfo=${encodeURIComponent(dexInfo)}`);
        const data = await response.json();
        
        if (data.threshold !== undefined && data.threshold >= 0) {
          console.log('🔍 WhaleAccessProgressBar: Received threshold:', data.threshold);
          setContractThreshold(data.threshold);
        } else {
          console.log('🔍 WhaleAccessProgressBar: Using fallback threshold');
          const currentLiquidity = typeof liquidity === 'string' 
            ? parseFloat(liquidity.replace(/,/g, '')) || 0 
            : liquidity || 0;
          setContractThreshold(Math.floor(currentLiquidity / 2) + 1);
        }
      } catch (error) {
        console.error('🔍 WhaleAccessProgressBar: Error fetching threshold:', error);
        const currentLiquidity = typeof liquidity === 'string' 
          ? parseFloat(liquidity.replace(/,/g, '')) || 0 
          : liquidity || 0;
        setContractThreshold(Math.floor(currentLiquidity / 2) + 1);
      } finally {
        setLoadingThreshold(false);
      }
    };

    fetchThreshold();
  }, [dexInfo, liquidity]);

  return (
    <div style={{
      background: '#1c2d4e',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '20px'
    }}>
      <div style={{ 
        fontSize: '16px', 
        color: '#ffa500', 
        fontWeight: '600', 
        marginBottom: '16px',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px'
      }}>
        Progress to Unlock {tokenSymbol === 'MAS' ? (
          <img 
            src="/icons/The Mas Network.svg" 
            alt="MAS Sats" 
            style={{ 
              width: '20px', 
              height: '20px'
            }} 
          />
        ) : tokenSymbol}
      </div>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          flex: 1,
          height: '24px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          position: 'relative'
        }}>
          <div style={{
            width: `${progressPercentage}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #ffa500, #ff8c00)',
            borderRadius: '12px',
            transition: 'width 0.3s ease'
          }}></div>
        </div>
        
        {/* Lock/Unlock Emoji with Threshold Info */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          minWidth: '80px'
        }}>
          <div style={{ 
            fontSize: '24px'
          }}>
            {currentRevenue >= minimumRevenueThreshold ? '🔓' : '🔒'}
          </div>
          
          <div style={{
            fontSize: '10px',
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
                  {loadingThreshold ? 'Loading...' : (minimumRevenueThreshold || 1500).toLocaleString()}
                  <img 
                    src="/icons/sats1.svg" 
                    alt="Sats" 
                    style={{ 
                      width: '12px', 
                      height: '12px'
                    }} 
                  />
                  <img 
                    src="/icons/Vector.svg" 
                    alt="Vector" 
                    style={{ 
                      width: '12px', 
                      height: '12px'
                    }} 
                  />
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Min Needed:</div>
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
                      width: '12px', 
                      height: '12px'
                    }} 
                  />
                  <img 
                    src="/icons/Vector.svg" 
                    alt="Vector" 
                    style={{ 
                      width: '12px', 
                      height: '12px'
                    }} 
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Smart Contract Information Section */}
      <div style={{
        background: '#1c2d4e',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '16px',
        border: '2px solid #ffa500'
      }}>
        <div style={{
          fontSize: '18px',
          color: '#ffa500',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          🔓 Smart Contract Interaction Guide
        </div>
        
        <div style={{
          fontSize: '14px',
          color: '#ccc',
          lineHeight: '1.6',
          marginBottom: '20px'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#ffa500' }}>Available to Claim:</strong> {cappedRevenue.toLocaleString()} SatsVector
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#ffa500' }}>Smart Contract:</strong> SP1T0V0Y3DNXRVP6HBM75DFWW0199CR0X15PC1D81B.mas-sats-treasury
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#ffa500' }}>Function to Call:</strong> withdraw-fees
          </div>
          
          <div style={{ 
            background: '#374151', 
            padding: '12px', 
            borderRadius: '8px',
            border: '1px solid #4b5563',
            marginTop: '12px'
          }}>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
              <strong>Instructions:</strong>
            </div>
            <ol style={{ 
              fontSize: '12px', 
              color: '#ccc', 
              margin: '0', 
              paddingLeft: '16px',
              lineHeight: '1.4'
            }}>
              <li>Click "Proceed to Smart Contract" below</li>
              <li>In Hiro Explorer, click "Call Function"</li>
              <li>Select "withdraw-fees" function</li>
              <li>Connect your wallet and confirm transaction</li>
              <li>Wait for transaction confirmation</li>
            </ol>
          </div>
        </div>
        
        <button
          onClick={() => {
            const explorerUrl = 'https://explorer.hiro.so/contract/SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B.mas-sats-treasury';
            
            // Open the contract in Hiro Explorer
            window.open(explorerUrl, '_blank');
          }}
          style={{
            backgroundColor: '#ffa500',
            color: '#1a1a2e',
            border: 'none',
            borderRadius: '8px',
            padding: '14px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f59e0b';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#ffa500';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          🔓 Proceed to Smart Contract
        </button>
      </div>

    </div>
  );
});

export default WhaleAccessProgressBar;
