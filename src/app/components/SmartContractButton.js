'use client';

import { useState } from 'react';

export default function SmartContractButton({ 
  onClick, 
  style = {}, 
  className = '', 
  children = '📋 Smart Contract Addresses' 
}) {
  return (
    <button
      onClick={onClick}
      className={className}
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style // Allow style overrides
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
      {children}
    </button>
  );
}
