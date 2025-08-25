'use client';

import React from 'react';

const HorizontalRevenueDisplay = ({ revenueData = [] }) => {
  // Default sample data if none provided
  const defaultData = [
    { amount: '18.3K', date: 'Aug 19' },
    { amount: '19.5K', date: 'Aug 20' },
    { amount: '19.6K', date: 'Aug 20' },
    { amount: '21.0K', date: 'Aug 21' },
    { amount: '22.9K', date: 'Aug 21' },
    { amount: '23.6K', date: 'Aug 22' },
    { amount: '23.8K', date: 'Aug 23' }
  ];

  const data = revenueData.length > 0 ? revenueData : defaultData;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,165,0,0.1) 100%)',
      borderRadius: '15px',
      padding: '20px',
      border: '1px solid rgba(255,215,0,0.3)',
      boxShadow: '0 8px 25px rgba(255,215,0,0.2)',
      marginBottom: '20px'
    }}>
      <h3 style={{
        color: '#FFD700',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        marginBottom: '15px',
        textAlign: 'center',
        textShadow: '0 0 10px rgba(255,215,0,0.3)'
      }}>
        Revenue Timeline
      </h3>
      
      {/* Simple horizontal list */}
      <div style={{
        padding: '15px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {data.map((item, index) => (
            <div key={index} style={{
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFD700',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}>
              {item.amount} - {item.date}
            </div>
          ))}
        </div>
      </div>
      
      {/* Summary Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        marginTop: '20px',
        padding: '15px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '5px' }}>
            Current Revenue:
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#FFD700' }}>
            23,753 sats
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '5px' }}>
            Peak Revenue:
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#FFD700' }}>
            23,753 sats
          </div>
        </div>
      </div>
    </div>
  );
};

export default HorizontalRevenueDisplay;
