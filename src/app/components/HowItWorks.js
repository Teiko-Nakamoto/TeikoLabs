'use client';
import { useTranslation } from 'react-i18next';
import './HowItWorks.css';

const HowItWorks = ({ onClose }) => {
  const { t } = useTranslation();
  
  const handleLearnMore = () => {
    window.open('https://themasnetwork.com', '_blank', 'noopener,noreferrer');
  };
  
  return (
    <div className="how-it-works-overlay" onClick={onClose}>
      <div className="how-it-works-popup" onClick={(e) => e.stopPropagation()}>
        <div className="how-it-works-header">
          <h2>How It Works</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="how-it-works-content">
                     {/* Introduction Section */}
           <div className="intro-section">
             <div className="intro-header">
               <h3>Introducing</h3>
               <img 
                 src="/icons/The Mas Network.svg" 
                 alt="MAS Sats" 
                 className="intro-image"
               />
             </div>
            <p className="intro-subtitle">Market Activated Satoshis</p>
            <p className="intro-description">
              <img src="/icons/The Mas Network.svg" alt="MAS Sats" className="step-title-icon" /> are a revolutionary token that combines the security of Bitcoin with dynamic market mechanics. 
              Users compete to become the majority holder and claim trading revenue while the token price increases 
              through market competition.
            </p>
          </div>
          
          <div className="step-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                                 <h3>Grow Your Ownership</h3>
                <div className="step-images">
                  <div className="image-combo">
                    <img src="/icons/sats1.svg" alt="sBTC" className="step-icon" />
                    <span>+</span>
                    <img src="/icons/The Mas Network.svg" alt="MAS Sats" className="step-icon" />
                  </div>
                </div>
                                 <p>Accumulate <img src="/icons/The Mas Network.svg" alt="MAS Sats" className="step-title-icon" /> holdings in order to compete for majority holder status.</p>
              </div>
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                                 <h3>Claim Majority Holder Status</h3>
                <div className="step-images">
                  <img src="/icons/The Mas Network.svg" alt="MAS Sats" className="step-icon" />
                </div>
                <p>Once you become the majority holder, lock your <img src="/icons/The Mas Network.svg" alt="MAS Sats" className="step-title-icon" /> to secure your majority holder status and become eligible to claim trading revenue from the protocol.</p>
              </div>
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Claim Revenue or Sell for Profit</h3>
                <div className="step-images">
                  <img src="/icons/The Mas Network.svg" alt="MAS Sats" className="step-icon" />
                </div>
                <p>As the majority holder, claim swap revenue from trading fees. Alternatively, sell your <img src="/icons/The Mas Network.svg" alt="MAS Sats" className="step-title-icon" /> for profit as the price increases from users competing to become the majority holder.</p>
              </div>
            </div>
            
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Drive the Next Demand Cycle</h3>
                <div className="step-images">
                  <img src="/icons/The Mas Network.svg" alt="MAS Sats" className="step-icon" />
                </div>
                <p>Once revenue has been withdrawn, if the remaining revenue falls below the threshold, all users who locked <img src="/icons/The Mas Network.svg" alt="MAS Sats" className="step-title-icon" /> are locked in until trading revenue recovers. This creates a powerful incentive for the next demand cycle, ensuring continuous market activity and value creation.</p>
              </div>
            </div>
          </div>
          
          <div className="learn-more-section">
            <button onClick={handleLearnMore} className="learn-more-btn">
              Learn More
            </button>
            <p className="learn-more-text">Visit themasnetwork.com for detailed documentation and community resources</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
