'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function TokenStats({ revenue, liquidity, remainingSupply, dexInfo, tokenInfo }) {
  const { t } = useTranslation();
  const [majorityHolderAddress, setMajorityHolderAddress] = useState('Loading...');
  const [totalOwnershipLocked, setTotalOwnershipLocked] = useState('--');
  const [totalOwnershipInTreasury, setTotalOwnershipInTreasury] = useState('--');
  const [remainingSupplyToBuy, setRemainingSupplyToBuy] = useState('--');

  // Fetch majority holder address from smart contract
  useEffect(() => {
    const fetchMajorityHolder = async () => {
      if (!dexInfo) {
        setMajorityHolderAddress('None');
        return;
      }

      try {
        console.log('🔍 Fetching majority holder address from smart contract...');
        // Get tokenId from the current URL or use a fallback
        const pathParts = window.location.pathname.split('/');
        const tokenId = pathParts[pathParts.length - 1] || '1';
        const response = await fetch(`/api/get-majority-holder?tokenId=${tokenId}&refresh=true`);
        const data = await response.json();
        
        console.log('👑 Majority holder API response:', data);
        
        if (data.success && data.hasMajorityHolder && data.address) {
          setMajorityHolderAddress(data.address);
        } else {
          setMajorityHolderAddress('None');
        }
      } catch (error) {
        console.error('❌ Failed to fetch majority holder address:', error);
        setMajorityHolderAddress('None');
      }
    };

    fetchMajorityHolder();
    
    // Fetch total ownership locked and treasury data
    const fetchOwnershipData = async () => {
      if (!dexInfo) return;
      
      try {
        console.log('🔍 Fetching ownership data for:', dexInfo);
        
        // Fetch total ownership locked
        const lockedResponse = await fetch(`/api/read-contract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractAddress: dexInfo.split('.')[0],
            contractName: dexInfo.split('.')[1],
            functionName: 'get-total-locked',
            functionArgs: []
          })
        });
        
        let lockedValue = 0;
        let treasuryValue = 0;
        
        if (lockedResponse.ok) {
          const lockedData = await lockedResponse.json();
          console.log('🔍 Locked data response:', lockedData);
          if (lockedData.success && lockedData.result) {
            // Parse the Clarity value properly
            if (lockedData.result.value !== undefined) {
              lockedValue = parseInt(lockedData.result.value) || 0;
            } else if (typeof lockedData.result === 'number') {
              lockedValue = lockedData.result;
            } else if (typeof lockedData.result === 'string') {
              lockedValue = parseInt(lockedData.result) || 0;
            }
            // Remove 8 decimal places (remove last 8 digits)
            const lockedValueAdjusted = Math.floor(lockedValue / 100000000);
            setTotalOwnershipLocked(lockedValueAdjusted.toLocaleString());
          }
        }
        
        // Fetch total ownership in treasury
        const treasuryResponse = await fetch(`/api/read-contract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractAddress: dexInfo.split('.')[0],
            contractName: dexInfo.split('.')[1],
            functionName: 'get-token-balance',
            functionArgs: []
          })
        });
        
        if (treasuryResponse.ok) {
          const treasuryData = await treasuryResponse.json();
          console.log('🔍 Treasury data response:', treasuryData);
          if (treasuryData.success && treasuryData.result) {
            // Parse the Clarity value properly
            if (treasuryData.result.value !== undefined) {
              treasuryValue = parseInt(treasuryData.result.value) || 0;
            } else if (typeof treasuryData.result === 'number') {
              treasuryValue = treasuryData.result;
            } else if (typeof treasuryData.result === 'string') {
              treasuryValue = parseInt(treasuryData.result) || 0;
            }
            // Remove 8 decimal places (remove last 8 digits)
            const treasuryValueAdjusted = Math.floor(treasuryValue / 100000000);
            setTotalOwnershipInTreasury(treasuryValueAdjusted.toLocaleString());
          }
        }
        
        // Calculate remaining supply: (Treasury - Locked) / 100000000 (remove 8 decimal places)
        const remainingSupply = Math.max(0, Math.floor((treasuryValue - lockedValue) / 100000000));
        setRemainingSupplyToBuy(remainingSupply.toLocaleString());
        console.log('🧮 Calculated remaining supply:', {
          treasury: treasuryValue,
          locked: lockedValue,
          treasuryAdjusted: Math.floor(treasuryValue / 100000000),
          lockedAdjusted: Math.floor(lockedValue / 100000000),
          calculation: `(${treasuryValue} - ${lockedValue}) / 100000000`,
          result: remainingSupply
        });
        
      } catch (error) {
        console.error('❌ Failed to fetch ownership data:', error);
        setTotalOwnershipLocked('--');
        setTotalOwnershipInTreasury('--');
      }
    };
    
    fetchOwnershipData();
  }, [dexInfo, tokenInfo]);
  
  return (
    <div style={{
      background: '#1c2d4e',
      borderRadius: '12px',
      padding: '16px',
      color: '#eee',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '16px',
        color: '#fff',
        textAlign: 'center'
      }}>
        {t('token_statistics')}
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Current Majority Holder Address */}
        <div style={{ 
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '6px' }}>
            {t('majority_holder')}:
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#fff', 
            fontWeight: '600',
            wordBreak: 'break-all',
            lineHeight: '1.3',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ flex: 1 }}>
              {majorityHolderAddress === 'None' ? (
                majorityHolderAddress
              ) : (
                <a 
                  href={`https://explorer.stacks.co/address/${majorityHolderAddress}?chain=mainnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#60A5FA',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.textDecoration = 'none';
                  }}
                >
                  {majorityHolderAddress}
                </a>
              )}
            </span>
            {majorityHolderAddress !== 'None' && majorityHolderAddress !== 'Loading...' && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(majorityHolderAddress);
                  // Optional: Add a brief visual feedback
                  const button = event.target;
                  const originalText = button.textContent;
                  button.textContent = 'Copied!';
                  button.style.backgroundColor = '#10B981';
                  setTimeout(() => {
                    button.textContent = originalText;
                    button.style.backgroundColor = '#374151';
                  }, 1000);
                }}
                style={{
                  background: '#374151',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#4B5563';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#374151';
                }}
              >
                Copy
              </button>
            )}
          </div>
        </div>
        
        {/* Total Value Locked */}
        <div style={{ 
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '6px' }}>
            {t('liquidity_held')}:
          </div>
          <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <img 
              src="/icons/sats1.svg" 
              alt="sats" 
              style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}
            />
            <img 
              src="/icons/Vector.svg" 
              alt="lightning" 
              style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}
            />
            {liquidity || '--'}
          </div>
        </div>
        
        {/* Remaining Supply */}
        <div style={{ 
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '6px' }}>
            Remaining Supply to Buy:
          </div>
          <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <img 
              src="/icons/The Mas Network.svg" 
              alt="MAS Sats" 
              style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}
            />
            {remainingSupplyToBuy}
          </div>
        </div>
        
        {/* Total Ownership Locked */}
        <div style={{ 
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '6px' }}>
            Total Ownership Locked:
          </div>
          <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <img 
              src="/icons/The Mas Network.svg" 
              alt="MAS Sats" 
              style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}
            />
            {totalOwnershipLocked}
          </div>
        </div>
        
        {/* Total Ownership in Treasury */}
        <div style={{ 
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '6px' }}>
            Total Ownership Held in Treasury:
          </div>
          <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <img 
              src="/icons/The Mas Network.svg" 
              alt="MAS Sats" 
              style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}
            />
            {totalOwnershipInTreasury}
          </div>
        </div>
      </div>
    </div>
  );
}
