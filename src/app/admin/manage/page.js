'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/header';
import './manage-tokens.css';
import { supabase } from '../../utils/supabaseClient';

export default function ManageTokensPage() {
  const [showPopup, setShowPopup] = useState(false);
  const [tokenId, setTokenId] = useState('');
  const [dexId, setDexId] = useState('');
  const [network, setNetwork] = useState('mainnet');
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [revenueLocked, setRevenueLocked] = useState('');
  const [liquidityHeld, setLiquidityHeld] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [tokens, setTokens] = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  const fetchTokens = async () => {
    const { data, error } = await supabase.from('tokens').select();
    if (!error) setTokens(data || []);
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleAddToken = async () => {
    if (!tokenId || !dexId) {
      setMessage('❗ Please enter both Token ID and DEX ID.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/tokens/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          dexId,
          network,
          tokenName,
          tokenSymbol,
          revenueLocked,
          liquidityHeld
        }),
      });

      const result = await res.json();
      if (res.ok) {
        setMessage('✅ Token added successfully!');
        setTokenId('');
        setDexId('');
        setTokenName('');
        setTokenSymbol('');
        setRevenueLocked('');
        setLiquidityHeld('');
        setShowPopup(false);
        await fetchTokens();
      } else {
        setMessage(`❌ Error: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('❌ Submission error:', err);
      setMessage('❌ Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
    setSelectedRows([]);
  };

  const handleRowSelect = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    const confirm = window.confirm(`Delete ${selectedRows.length} selected token(s)?`);
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('tokens')
        .delete()
        .in('id', selectedRows);

      if (error) {
        console.error('❌ Bulk delete failed:', error);
        alert('Error deleting selected tokens.');
      } else {
        setSelectedRows([]);
        setDeleteMode(false);
        await fetchTokens();
      }
    } catch (err) {
      console.error('❌ Deletion error:', err);
      alert('Unexpected error while deleting.');
    }
  };

  return (
    <>
      <Header />
      <main className="manage-tokens-page">
        <div className="manage-tokens-header">
          <h1 className="manage-tokens-title">📋 Manage All Tokens</h1>
          <div className="button-group">
            <button className="add-button" onClick={() => setShowPopup(true)}>➕ Add Token</button>
            <button className="delete-mode-button" onClick={toggleDeleteMode}>
              {deleteMode ? '❌ Cancel Delete Mode' : '🗑 Delete Mode'}
            </button>
            {deleteMode && selectedRows.length > 0 && (
              <button className="delete-selected-button" onClick={handleDeleteSelected}>
                Delete Selected ({selectedRows.length})
              </button>
            )}
          </div>
        </div>

        <table className="token-table">
          <thead>
            <tr>
              {deleteMode && <th>Select</th>}
              <th>Token ID</th>
              <th>DEX ID</th>
              <th>Network</th>
              <th>Token Name</th>
              <th>Token Symbol</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.id}>
                {deleteMode && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(token.id)}
                      onChange={() => handleRowSelect(token.id)}
                    />
                  </td>
                )}
                <td>{token.token_id}</td>
                <td>{token.dex_id}</td>
                <td>{token.network}</td>
                <td>{token.token_name || '—'}</td>
                <td>{token.token_symbol || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {showPopup && (
          <div className="popup">
            <div className="popup-inner">
              <h3>Add New Token</h3>

              <input
                type="text"
                placeholder="Token ID"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
              />
              <input
                type="text"
                placeholder="DEX ID"
                value={dexId}
                onChange={(e) => setDexId(e.target.value)}
              />
              <input
                type="text"
                placeholder="Token Name (Optional)"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Token Symbol (Optional)"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
              />
              <input
                type="text"
                placeholder="Current Revenue Locked (Optional)"
                value={revenueLocked}
                onChange={(e) => setRevenueLocked(e.target.value)}
              />
              <input
                type="text"
                placeholder="Current Liquidity Held (Optional)"
                value={liquidityHeld}
                onChange={(e) => setLiquidityHeld(e.target.value)}
              />
              <label htmlFor="network-select">Select Network:</label>
              <select
                id="network-select"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
              >
                <option value="mainnet">Mainnet</option>
                <option value="testnet">Testnet</option>
              </select>

              {message && <p className="popup-message">{message}</p>}

              <div className="popup-actions">
                <button onClick={handleAddToken} disabled={loading}>
                  {loading ? 'Adding...' : 'Confirm'}
                </button>
                <button onClick={() => setShowPopup(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
