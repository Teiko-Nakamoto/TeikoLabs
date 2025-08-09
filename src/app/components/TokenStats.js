'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

export default function TokenStats({ revenue, liquidity, remainingSupply }) {
  const { t } = useTranslation();
  
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
        {/* Profit Created */}
        <div style={{ 
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '6px' }}>
            {t('revenue_locked')}:
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
            {revenue || '--'}
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
            {remainingSupply || '--'}
          </div>
        </div>
      </div>
    </div>
  );
}
