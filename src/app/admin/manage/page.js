'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../../components/header';
import './manage-tokens.css';
import { supabase } from '../../utils/supabaseClient';

export default function ManageTokensPage() {
  const { t } = useTranslation();
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
      setMessage(`❗ ${t('enter_token_dex_id')}`);
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
        setMessage(`✅ ${t('token_added_successfully')}`);
        setTokenId('');
        setDexId('');
        setTokenName('');
        setTokenSymbol('');
        setRevenueLocked('');
        setLiquidityHeld('');
        setShowPopup(false);
        await fetchTokens();
      } else {
        setMessage(`❌ ${t('error')}: ${result.error || t('unknown_error')}`);
      }
    } catch (err) {
      console.error('❌ Submission error:', err);
      setMessage(`❌ ${t('network_error')}`);
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
    const confirm = window.confirm(t('confirm_delete_tokens', { count: selectedRows.length }));
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('tokens')
        .delete()
        .in('id', selectedRows);

      if (error) {
        console.error('❌ Bulk delete failed:', error);
        alert(t('error_deleting_tokens'));
      } else {
        setSelectedRows([]);
        setDeleteMode(false);
        await fetchTokens();
      }
    } catch (err) {
      console.error('❌ Deletion error:', err);
      alert(t('unexpected_error_deleting'));
    }
  };

  return (
    <>
      <Header />
      <main className="manage-tokens-page">
        <div className="manage-tokens-header">
          <h1 className="manage-tokens-title">📋 {t('manage_all_tokens')}</h1>
          <div className="button-group">
            <button className="add-button" onClick={() => setShowPopup(true)}>➕ {t('add_token')}</button>
            <button className="delete-mode-button" onClick={toggleDeleteMode}>
              {deleteMode ? `❌ ${t('cancel_delete_mode')}` : `🗑 ${t('delete_mode')}`}
            </button>
            {deleteMode && selectedRows.length > 0 && (
              <button className="delete-selected-button" onClick={handleDeleteSelected}>
                {t('delete_selected')} ({selectedRows.length})
              </button>
            )}
          </div>
        </div>

        <table className="token-table">
          <thead>
            <tr>
              {deleteMode && <th>{t('select')}</th>}
              <th>{t('token_id')}</th>
              <th>{t('dex_id')}</th>
              <th>{t('network')}</th>
              <th>{t('token_name')}</th>
              <th>{t('token_symbol')}</th>
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
              <h3>{t('add_new_token')}</h3>

              <input
                type="text"
                placeholder={t('token_id')}
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
              />
              <input
                type="text"
                placeholder={t('dex_id')}
                value={dexId}
                onChange={(e) => setDexId(e.target.value)}
              />
              <input
                type="text"
                placeholder={t('token_name_optional')}
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
              />
              <input
                type="text"
                placeholder={t('token_symbol_optional')}
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
              />
              <input
                type="text"
                placeholder={t('current_revenue_locked_optional')}
                value={revenueLocked}
                onChange={(e) => setRevenueLocked(e.target.value)}
              />
              <input
                type="text"
                placeholder={t('current_liquidity_held_optional')}
                value={liquidityHeld}
                onChange={(e) => setLiquidityHeld(e.target.value)}
              />
              <label htmlFor="network-select">{t('select_network')}:</label>
              <select
                id="network-select"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
              >
                <option value="mainnet">{t('mainnet')}</option>
                <option value="testnet">{t('testnet')}</option>
              </select>

              {message && <p className="popup-message">{message}</p>}

              <div className="popup-actions">
                <button onClick={handleAddToken} disabled={loading}>
                  {loading ? t('adding') : t('confirm')}
                </button>
                <button onClick={() => setShowPopup(false)}>{t('cancel')}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
