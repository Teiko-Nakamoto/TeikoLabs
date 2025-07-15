'use client';
import './HowItWorks.css';

const HowItWorks = ({ onClose }) => {
  return (
    <div className="how-it-works-overlay" onClick={onClose}>
      <div className="how-it-works-popup" onClick={(e) => e.stopPropagation()}>
        <h2>How It Works</h2>
        <p>This is where you&apos;ll explain how your DEX functions, bonding curves, etc.</p>

        <button onClick={onClose} className="close-btn">Close</button>
      </div>
    </div>
  );
};

export default HowItWorks;
