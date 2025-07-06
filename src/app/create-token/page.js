'use client';
import '../components/header.css';
import Header from '../components/header';
import './style.css';
import { useState } from 'react';
import { connectWallet } from '@/wallet-connect/wallet-connect';

export default function CreateTokenPage() {
  const [tokenName, setTokenName] = useState('');
  const [ticker, setTicker] = useState('');
  const [userAddress, setUserAddress] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!userAddress) {
      connectWallet((address) => setUserAddress(address));
      return;
    }

    if (!tokenName || !ticker) {
      alert('Please fill in both fields.');
      return;
    }

    alert(`Token Created:\nName: ${tokenName}\nTicker: ${ticker}`);
  };

  const handleInputClick = () => {
    if (!userAddress) {
      connectWallet((address) => setUserAddress(address));
    }
  };

  return (
    <>
      <Header onAddressChange={setUserAddress} />
      <div className="page">
        <div className="card">
          <h1>Create New Token</h1>
          <p className="subtext">
            Teiko Tokens discourage dumps by making sure that all created tokens are backed by trading fee revenue locked in smart contracts on-chain.
            Each Teiko Token is <span className="green">backed by trading fee revenue</span>, which incentivizes token holders to <span className="blue">HODL</span> and not <span className="red">DUMP</span>.
          </p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="name">Token Name</label>
            <input
              id="name"
              placeholder="Enter name"
              value={tokenName}
              onClick={handleInputClick}
              onChange={(e) => {
                if (userAddress) setTokenName(e.target.value);
              }}
            />

            <label htmlFor="ticker">Ticker</label>
            <input
              id="ticker"
              placeholder="i.e. TEKO"
              value={ticker}
              onClick={handleInputClick}
              onChange={(e) => {
                if (userAddress) setTicker(e.target.value);
              }}
            />

            <button type="submit">Create Token</button>
          </form>
        </div>
      </div>
    </>
  );
}
