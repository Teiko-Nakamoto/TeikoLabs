'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import './LearnAboutHowTo.css';

const LearnAboutHowTo = ({ onClose }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('funding'); // 'funding' or 'profit'
  
  return (
    <div className="learn-about-overlay" onClick={onClose}>
      <div className="learn-about-popup" onClick={(e) => e.stopPropagation()}>
        <div className="learn-about-header">
          <h2>Learn How To</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        {/* Toggle Buttons */}
        <div className="toggle-container">
          <button 
            className={`toggle-btn ${activeTab === 'funding' ? 'active' : ''}`}
            onClick={() => setActiveTab('funding')}
          >
            💰 Get Project Funding
          </button>
          <button 
            className={`toggle-btn ${activeTab === 'profit' ? 'active' : ''}`}
            onClick={() => setActiveTab('profit')}
          >
            📈 Generate Profit from Funding Projects
          </button>
        </div>
        
        <div className="learn-about-content">
          {activeTab === 'funding' && (
            <div className="funding-section">
              <div className="section-header">
                <h3>💰 How to Get Project Funding</h3>
                <p className="section-subtitle">Launch your Project and raise capital through the community using Bitcoin</p>
              </div>
              
              <div className="step-container">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Create Your Project</h4>
                    <p>Use our platform to launch your project publicly on the blockchain.</p>
                  </div>
                </div>
                
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Grow Project Treasury Ownership</h4>
                    <p>Each project has 21 million units of ownership anyone can buy<br/>(Trades made using <a href="https://www.stacks.co/faq/what-is-sbtc" target="_blank" rel="noopener noreferrer" style={{color: '#fbbf24', textDecoration: 'underline'}}>sBTC</a> on Stacks blockchain)</p>
                  </div>
                </div>
                
                {/* Choice Split */}
                <div className="choice-section">
                  <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h4>How To Profit</h4>
                    </div>
                  </div>
                  
                  <h4 className="choice-title">Choose Your Strategy:</h4>
                  
                  <div className="choice-container">
                    <div className="choice-option">
                      <div className="choice-number">A</div>
                      <div className="choice-content">
                        <h5>Earn From Trading Fees</h5>
                        <p>Whoever locks away the most ownership of the project can claim trading fee profit from every transaction.</p>
                      </div>
                    </div>
                    
                    <div className="choice-divider">OR</div>
                    
                    <div className="choice-option">
                      <div className="choice-number">B</div>
                      <div className="choice-content">
                        <h5>Sell Ownership For Profit</h5>
                        <p>Sell ownership of project treasury for profit, leaving trading fees for anyone else to claim.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'profit' && (
            <div className="profit-section">
              <div className="section-header">
                <h3>📈 How to Generate Profit from Funding Projects</h3>
                <p className="section-subtitle">Buy ownership in project treasuries and compete to earn trading fees</p>
              </div>
              
              <div className="step-container">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>How Projects Make Money</h4>
                    <p>Each project charges a 1.5% fee for every trade of its treasury<br/>(Max Treasury Supply: 21 Million)</p>
                  </div>
                </div>
                
                {/* Choice Split */}
                <div className="choice-section">
                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h4>How To Profit</h4>
                    </div>
                  </div>
                  <h4 className="choice-title">Choose Your Strategy:</h4>
                  <div className="choice-container">
                    <div className="choice-option">
                      <div className="choice-number">A</div>
                      <div className="choice-content">
                        <h5>Earn From Trading Fees</h5>
                        <p>Whoever locks away the most ownership of the project can claim trading fee profit from every transaction.</p>
                      </div>
                    </div>
                    
                    <div className="choice-divider">OR</div>
                    
                    <div className="choice-option">
                      <div className="choice-number">B</div>
                      <div className="choice-content">
                        <h5>Sell Ownership For Profit</h5>
                        <p>Sell ownership of project treasury for profit, leaving trading fees for anyone else to claim.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="learn-more-section">
            {activeTab === 'funding' ? (
              <Link href="/create-project" className="create-project-btn">
                🚀 Create Project
              </Link>
            ) : (
              <Link href="/?tab=all" className="create-project-btn">
                📈 View Projects
              </Link>
            )}
            
            <div className="terms-link-section">
              <Link href="/terms" className="terms-link">
                📋 Terms of Service & Risk Disclaimer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnAboutHowTo;

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import './LearnAboutHowTo.css';

const LearnAboutHowTo = ({ onClose }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('funding'); // 'funding' or 'profit'
  
  return (
    <div className="learn-about-overlay" onClick={onClose}>
      <div className="learn-about-popup" onClick={(e) => e.stopPropagation()}>
        <div className="learn-about-header">
          <h2>Learn How To</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        {/* Toggle Buttons */}
        <div className="toggle-container">
          <button 
            className={`toggle-btn ${activeTab === 'funding' ? 'active' : ''}`}
            onClick={() => setActiveTab('funding')}
          >
            💰 Get Project Funding
          </button>
          <button 
            className={`toggle-btn ${activeTab === 'profit' ? 'active' : ''}`}
            onClick={() => setActiveTab('profit')}
          >
            📈 Generate Profit from Funding Projects
          </button>
        </div>
        
        <div className="learn-about-content">
          {activeTab === 'funding' && (
            <div className="funding-section">
              <div className="section-header">
                <h3>💰 How to Get Project Funding</h3>
                <p className="section-subtitle">Launch your Project and raise capital through the community using Bitcoin</p>
              </div>
              
              <div className="step-container">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Create Your Project</h4>
                    <p>Use our platform to launch your project publicly on the blockchain.</p>
                  </div>
                </div>
                
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Grow Project Treasury Ownership</h4>
                    <p>Each project has 21 million units of ownership anyone can buy<br/>(Trades made using <a href="https://www.stacks.co/faq/what-is-sbtc" target="_blank" rel="noopener noreferrer" style={{color: '#fbbf24', textDecoration: 'underline'}}>sBTC</a> on Stacks blockchain)</p>
                  </div>
                </div>
                
                {/* Choice Split */}
                <div className="choice-section">
                  <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h4>How To Profit</h4>
                    </div>
                  </div>
                  
                  <h4 className="choice-title">Choose Your Strategy:</h4>
                  
                  <div className="choice-container">
                    <div className="choice-option">
                      <div className="choice-number">A</div>
                      <div className="choice-content">
                        <h5>Earn From Trading Fees</h5>
                        <p>Whoever locks away the most ownership of the project can claim trading fee profit from every transaction.</p>
                      </div>
                    </div>
                    
                    <div className="choice-divider">OR</div>
                    
                    <div className="choice-option">
                      <div className="choice-number">B</div>
                      <div className="choice-content">
                        <h5>Sell Ownership For Profit</h5>
                        <p>Sell ownership of project treasury for profit, leaving trading fees for anyone else to claim.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'profit' && (
            <div className="profit-section">
              <div className="section-header">
                <h3>📈 How to Generate Profit from Funding Projects</h3>
                <p className="section-subtitle">Buy ownership in project treasuries and compete to earn trading fees</p>
              </div>
              
              <div className="step-container">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>How Projects Make Money</h4>
                    <p>Each project charges a 1.5% fee for every trade of its treasury<br/>(Max Treasury Supply: 21 Million)</p>
                  </div>
                </div>
                
                {/* Choice Split */}
                <div className="choice-section">
                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h4>How To Profit</h4>
                    </div>
                  </div>
                  <h4 className="choice-title">Choose Your Strategy:</h4>
                  <div className="choice-container">
                    <div className="choice-option">
                      <div className="choice-number">A</div>
                      <div className="choice-content">
                        <h5>Earn From Trading Fees</h5>
                        <p>Whoever locks away the most ownership of the project can claim trading fee profit from every transaction.</p>
                      </div>
                    </div>
                    
                    <div className="choice-divider">OR</div>
                    
                    <div className="choice-option">
                      <div className="choice-number">B</div>
                      <div className="choice-content">
                        <h5>Sell Ownership For Profit</h5>
                        <p>Sell ownership of project treasury for profit, leaving trading fees for anyone else to claim.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="learn-more-section">
            {activeTab === 'funding' ? (
              <Link href="/create-project" className="create-project-btn">
                🚀 Create Project
              </Link>
            ) : (
              <Link href="/?tab=all" className="create-project-btn">
                📈 View Projects
              </Link>
            )}
            
            <div className="terms-link-section">
              <Link href="/terms" className="terms-link">
                📋 Terms of Service & Risk Disclaimer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnAboutHowTo;
