'use client';

import { useState, useEffect } from 'react';

export default function TestSbtcBalance() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [address, setAddress] = useState('');

  const testBalance = async () => {
    if (!address) {
      setError('Please enter an address');
      return;
    }

    setLoading(true);
    setError(null);
    setBalance(null);

    try {
      const url = `/api/mainnet-user-sats-balance?principal=${encodeURIComponent(address)}&lastTx=baseline`;
      console.log('Testing sBTC balance API:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (response.ok) {
        setBalance(data);
      } else {
        setError(`API Error: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Test error:', err);
      setError(`Network Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>sBTC Balance Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px' }}>
          Enter Stacks Address (SP or SM):
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="SP3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4"
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
      </div>
      
      <button
        onClick={testBalance}
        disabled={loading || !address}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test sBTC Balance'}
      </button>
      
      {error && (
        <div style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {balance && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb',
          borderRadius: '4px'
        }}>
          <h3>sBTC Balance Result:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>
            {JSON.stringify(balance, null, 2)}
          </pre>
          
          <div style={{ marginTop: '10px' }}>
            <strong>Balance:</strong> {balance.balance?.toLocaleString() || '0'} sats
          </div>
          <div>
            <strong>Source:</strong> {balance.source || 'unknown'}
          </div>
          <div>
            <strong>Network:</strong> {balance.network || 'unknown'}
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h3>Test Instructions:</h3>
        <ol>
          <li>Enter a valid Stacks mainnet address (starts with SP or SM)</li>
          <li>Click "Test sBTC Balance"</li>
          <li>Check the console for detailed logs</li>
          <li>Review the API response below</li>
        </ol>
        
        <h4>Example Addresses:</h4>
        <ul>
          <li>Mainnet: SP3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4</li>
          <li>Testnet: ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4</li>
        </ul>
      </div>
    </div>
  );
}
