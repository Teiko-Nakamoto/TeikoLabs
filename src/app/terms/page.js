'use client';
import './terms.css';

export default function TermsPage() {
  return (
    <div className="terms-container">
      <div className="terms-content">
        <h1>⚠️ TERMS OF SERVICE & RISK DISCLAIMER</h1>
        
        <div className="critical-warning">
          <h2>🚨 BY ACCESSING OR USING TEIKO LABS, YOU AUTOMATICALLY AGREE TO THESE TERMS AND ACKNOWLEDGE ALL RISKS</h2>
        </div>

        <div className="last-updated">
          Last Updated: {new Date().toLocaleDateString()}
        </div>

        <section className="terms-section disclaimer-section">
          <h2>🚨 COMPLETE DISCLAIMER OF LIABILITY</h2>
          <p className="bold-warning">
            <strong>TEIKO LABS ACCEPTS ABSOLUTELY NO RESPONSIBILITY OR LIABILITY FOR:</strong>
          </p>
          <ul className="liability-list">
            <li><strong>Financial Losses:</strong> Any loss of funds, sBTC, treasury ownership tokens, or digital assets</li>
            <li><strong>Project Failures:</strong> Failed crowdfunding projects, abandoned developments, or project scams</li>
            <li><strong>Treasury Ownership Risks:</strong> Loss of majority holder status, locked ownership tokens, or inability to claim trading fees</li>
            <li><strong>Smart Contract Risks:</strong> Bugs, exploits, or vulnerabilities in Clarity smart contracts</li>
            <li><strong>sBTC/Stacks Risks:</strong> Issues with sBTC peg, Stacks blockchain failures, or network congestion</li>
            <li><strong>Market Manipulation:</strong> Price manipulation, wash trading, or coordinated attacks</li>
            <li><strong>Wallet Security:</strong> Loss of private keys, wallet hacks, or unauthorized transactions</li>
            <li><strong>Technical Failures:</strong> Platform downtime, transaction failures, or data loss</li>
            <li><strong>Regulatory Actions:</strong> Legal or regulatory consequences in any jurisdiction, including fines, penalties, or criminal prosecution</li>
            <li><strong>Tax Liabilities:</strong> Any tax obligations, penalties, or legal consequences arising from your activities</li>
            <li><strong>Compliance Failures:</strong> Consequences of failing to comply with your country's laws and regulations</li>
          </ul>
          <p className="risk-emphasis">
            <strong>YOU USE TEIKO LABS ENTIRELY AT YOUR OWN RISK!</strong>
          </p>
        </section>

        <section className="terms-section">
          <h2>⚠️ CRITICAL RISK WARNINGS</h2>
          
          <div className="risk-category">
            <h3>🎲 Experimental Bitcoin Layer 2 Technology</h3>
            <p>sBTC and Stacks blockchain technology are experimental and may contain unknown vulnerabilities that could result in total loss of funds.</p>
          </div>

          <div className="risk-category">
            <h3>💸 Total Loss Possible</h3>
            <p>You may lose 100% of any funds, sBTC, or treasury ownership tokens you interact with on this platform. Treasury ownership competition means you could lose majority holder status at any time.</p>
          </div>

          <div className="risk-category">
            <h3>🔒 Ownership Token Lock Risk</h3>
            <p>Treasury ownership tokens may become permanently locked based on platform mechanics. Unlocking requires specific revenue thresholds that may never be met.</p>
          </div>

          <div className="risk-category">
            <h3>🚫 No Project Verification</h3>
            <p>Teiko Labs does not verify, audit, or endorse any crowdfunding projects on the platform. Project creators may abandon projects or misuse funds.</p>
          </div>

          <div className="risk-category">
            <h3>⚖️ No Investment Advice</h3>
            <p>Nothing on this platform constitutes financial, investment, legal, or tax advice. All project funding decisions are yours alone.</p>
          </div>

          <div className="risk-category">
            <h3>🏛️ Regulatory Compliance Required</h3>
            <p>You must comply with ALL laws in your country regarding cryptocurrency, securities, crowdfunding, and DeFi activities. Some jurisdictions prohibit or restrict these activities. Penalties may include fines, asset seizure, or criminal prosecution.</p>
          </div>
        </section>

        <section className="terms-section">
          <h2>1. PLATFORM DESCRIPTION</h2>
          <p>
            <strong>Teiko Labs</strong> is a Bitcoin-powered crowdfunding platform where users can:
          </p>
          <ul>
            <li>Create crowdfunding projects with 21 million units of treasury ownership</li>
            <li>Trade treasury ownership tokens using sBTC on Stacks blockchain</li>
            <li>Compete to become majority holders to claim 1.5% trading fees from every transaction</li>
            <li>Lock ownership tokens to secure majority holder status</li>
            <li>Participate in decentralized project funding and profit distribution</li>
          </ul>
          <p>
            <strong>IMPORTANT:</strong> Teiko Labs is purely a technology platform. We do not control project outcomes, smart contract execution, or fund custody.
          </p>
        </section>

        <section className="terms-section">
          <h2>2. USER RESPONSIBILITIES & REQUIREMENTS</h2>
          <ul>
            <li><strong>Age Requirement:</strong> You must be at least 18 years old to use Teiko Labs</li>
            <li><strong>Legal Capacity:</strong> You must have legal capacity to enter into contracts in your jurisdiction</li>
            <li><strong>Wallet Security:</strong> You are solely responsible for your wallet security, private keys, and seed phrases</li>
            <li><strong>Due Diligence:</strong> You must research all projects before funding (#DYOR - Do Your Own Research)</li>
            <li><strong>Legal Compliance:</strong> You must comply with ALL applicable laws and regulations in your country, state, province, and local jurisdiction, including but not limited to securities laws, tax obligations, anti-money laundering (AML) requirements, and know-your-customer (KYC) regulations</li>
            <li><strong>Jurisdictional Responsibility:</strong> You are solely responsible for determining whether your use of Teiko Labs is legal in your jurisdiction. We do not provide legal advice regarding compliance</li>
            <li><strong>Prohibited Jurisdictions:</strong> You must not use the platform if cryptocurrency trading, crowdfunding, or DeFi activities are prohibited in your jurisdiction</li>
            <li><strong>Tax Obligations:</strong> You are responsible for reporting and paying all taxes on your activities, including capital gains, income from trading fees, and any other tax liabilities in your country</li>
            <li><strong>Anti-Fraud:</strong> You must not engage in market manipulation, wash trading, or fraudulent activities</li>
            <li><strong>Project Verification:</strong> You acknowledge that project creators may be anonymous and unverified</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>3. SPECIFIC PLATFORM RISKS</h2>
          
          <div className="risk-category">
            <h3>🏛️ Treasury Ownership Competition</h3>
            <p>Multiple users compete for majority holder status. You may lose majority status and trading fee rights to other users at any time without warning.</p>
          </div>

          <div className="risk-category">
            <h3>🔐 Token Locking Mechanism</h3>
            <p>Locked ownership tokens cannot be unlocked until specific revenue thresholds are met. These thresholds may never be reached, permanently locking your tokens.</p>
          </div>

          <div className="risk-category">
            <h3>💰 1.5% Trading Fee Structure</h3>
            <p>Trading fees are not guaranteed. Low trading volume means minimal fees. Platform mechanics may change fee distribution at any time.</p>
          </div>

          <div className="risk-category">
            <h3>📊 21 Million Token Supply</h3>
            <p>Fixed supply may create artificial scarcity or dilution effects. Early buyers may have unfair advantages over later participants.</p>
          </div>

          <div className="risk-category">
            <h3>🎯 Crowdfunding Project Risks</h3>
            <p>Projects may fail, be abandoned, or be fraudulent. Project creators may disappear with funds. No guarantees exist for project completion or success.</p>
          </div>
        </section>

        <section className="terms-section risk-section">
          <h2>⚠️ 4. RISK DISCLAIMER</h2>
          <div className="risk-warning">
            <h3>IMPORTANT: PLEASE READ CAREFULLY</h3>
            <p>
              <strong>TRADING CRYPTOCURRENCY AND DIGITAL ASSETS INVOLVES SUBSTANTIAL RISK OF LOSS AND IS NOT SUITABLE FOR ALL INVESTORS.</strong>
            </p>
          </div>
          
          <h4>Financial Risks:</h4>
          <ul>
            <li><strong>Total Loss of Funds:</strong> You may lose all money invested in treasury ownership tokens</li>
            <li><strong>Market Volatility:</strong> Token prices can fluctuate dramatically and unpredictably</li>
            <li><strong>No Guaranteed Returns:</strong> Trading fees and profits are not guaranteed</li>
            <li><strong>Majority Holder Competition:</strong> Other users may outbid you for majority holder status</li>
            <li><strong>Locked Funds:</strong> Ownership tokens may become locked based on platform mechanics</li>
          </ul>

          <h4>Technical Risks:</h4>
          <ul>
            <li><strong>Smart Contract Risk:</strong> Bugs or vulnerabilities in Clarity smart contracts may cause loss of funds</li>
            <li><strong>Blockchain Risk:</strong> Issues with Stacks blockchain or sBTC peg may affect functionality</li>
            <li><strong>Platform Downtime:</strong> Technical issues may prevent access to funds or trading</li>
            <li><strong>Wallet Security:</strong> Loss of private keys results in permanent loss of funds</li>
          </ul>

          <h4>Regulatory Risks:</h4>
          <ul>
            <li><strong>Uncertain Legal Status:</strong> Regulatory treatment of digital assets may change</li>
            <li><strong>Compliance Requirements:</strong> You may be subject to tax or reporting obligations</li>
            <li><strong>Jurisdictional Restrictions:</strong> Use may be prohibited in certain jurisdictions</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>5. NO INVESTMENT ADVICE</h2>
          <p>
            Nothing on this Platform constitutes investment, financial, trading, or other advice. All content is for informational purposes only. You should consult with qualified professionals before making any investment decisions.
          </p>
        </section>

        <section className="terms-section">
          <h2>6. PLATFORM DISCLAIMERS</h2>
          <ul>
            <li>The Platform is provided "as is" without warranties of any kind</li>
            <li>We do not guarantee Platform availability, functionality, or security</li>
            <li>We are not responsible for user-generated content or project outcomes</li>
            <li>We do not custody funds or control smart contract operations</li>
            <li>Third-party integrations (wallets, explorers) are used at your own risk</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>7. LIMITATION OF LIABILITY</h2>
          <p>
            <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM, INCLUDING BUT NOT LIMITED TO LOSS OF FUNDS, PROFITS, OR DATA.</strong>
          </p>
        </section>

        <section className="terms-section">
          <h2>8. PROHIBITED ACTIVITIES</h2>
          <ul>
            <li>Market manipulation or wash trading</li>
            <li>Creating fraudulent or misleading projects</li>
            <li>Attempting to exploit smart contract vulnerabilities</li>
            <li>Using the Platform for money laundering or illegal activities</li>
            <li>Violating intellectual property rights</li>
            <li>Interfering with Platform operations or other users</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>9. MODIFICATIONS AND TERMINATION</h2>
          <p>
            We reserve the right to modify these terms, update the Platform, or terminate services at any time without notice. Continued use after modifications constitutes acceptance of updated terms.
          </p>
        </section>

        <section className="terms-section">
          <h2>10. GOVERNING LAW</h2>
          <p>
            These terms are governed by applicable law. Any disputes shall be resolved through binding arbitration where permitted by law.
          </p>
        </section>

        <section className="terms-section acknowledgment">
          <h2>11. ACKNOWLEDGMENT</h2>
          <div className="acknowledgment-box">
            <p>
              <strong>BY USING THIS PLATFORM, YOU ACKNOWLEDGE THAT:</strong>
            </p>
            <ul>
              <li>You have read and understood these Terms of Service and Risk Disclaimer</li>
              <li>You understand the substantial risks involved in cryptocurrency trading</li>
              <li>You are using the Platform at your own risk and responsibility</li>
              <li>You may lose all funds invested in treasury ownership tokens</li>
              <li>No returns or profits are guaranteed</li>
              <li>You are responsible for compliance with applicable laws</li>
            </ul>
          </div>
        </section>

        <div className="contact-section">
          <h2>Contact</h2>
          <p>
            For questions about these terms, please contact us through our official channels.
          </p>
        </div>
      </div>
    </div>
  );
}


export default function TermsPage() {
  return (
    <div className="terms-container">
      <div className="terms-content">
        <h1>⚠️ TERMS OF SERVICE & RISK DISCLAIMER</h1>
        
        <div className="critical-warning">
          <h2>🚨 BY ACCESSING OR USING TEIKO LABS, YOU AUTOMATICALLY AGREE TO THESE TERMS AND ACKNOWLEDGE ALL RISKS</h2>
        </div>

        <div className="last-updated">
          Last Updated: {new Date().toLocaleDateString()}
        </div>

        <section className="terms-section disclaimer-section">
          <h2>🚨 COMPLETE DISCLAIMER OF LIABILITY</h2>
          <p className="bold-warning">
            <strong>TEIKO LABS ACCEPTS ABSOLUTELY NO RESPONSIBILITY OR LIABILITY FOR:</strong>
          </p>
          <ul className="liability-list">
            <li><strong>Financial Losses:</strong> Any loss of funds, sBTC, treasury ownership tokens, or digital assets</li>
            <li><strong>Project Failures:</strong> Failed crowdfunding projects, abandoned developments, or project scams</li>
            <li><strong>Treasury Ownership Risks:</strong> Loss of majority holder status, locked ownership tokens, or inability to claim trading fees</li>
            <li><strong>Smart Contract Risks:</strong> Bugs, exploits, or vulnerabilities in Clarity smart contracts</li>
            <li><strong>sBTC/Stacks Risks:</strong> Issues with sBTC peg, Stacks blockchain failures, or network congestion</li>
            <li><strong>Market Manipulation:</strong> Price manipulation, wash trading, or coordinated attacks</li>
            <li><strong>Wallet Security:</strong> Loss of private keys, wallet hacks, or unauthorized transactions</li>
            <li><strong>Technical Failures:</strong> Platform downtime, transaction failures, or data loss</li>
            <li><strong>Regulatory Actions:</strong> Legal or regulatory consequences in any jurisdiction, including fines, penalties, or criminal prosecution</li>
            <li><strong>Tax Liabilities:</strong> Any tax obligations, penalties, or legal consequences arising from your activities</li>
            <li><strong>Compliance Failures:</strong> Consequences of failing to comply with your country's laws and regulations</li>
          </ul>
          <p className="risk-emphasis">
            <strong>YOU USE TEIKO LABS ENTIRELY AT YOUR OWN RISK!</strong>
          </p>
        </section>

        <section className="terms-section">
          <h2>⚠️ CRITICAL RISK WARNINGS</h2>
          
          <div className="risk-category">
            <h3>🎲 Experimental Bitcoin Layer 2 Technology</h3>
            <p>sBTC and Stacks blockchain technology are experimental and may contain unknown vulnerabilities that could result in total loss of funds.</p>
          </div>

          <div className="risk-category">
            <h3>💸 Total Loss Possible</h3>
            <p>You may lose 100% of any funds, sBTC, or treasury ownership tokens you interact with on this platform. Treasury ownership competition means you could lose majority holder status at any time.</p>
          </div>

          <div className="risk-category">
            <h3>🔒 Ownership Token Lock Risk</h3>
            <p>Treasury ownership tokens may become permanently locked based on platform mechanics. Unlocking requires specific revenue thresholds that may never be met.</p>
          </div>

          <div className="risk-category">
            <h3>🚫 No Project Verification</h3>
            <p>Teiko Labs does not verify, audit, or endorse any crowdfunding projects on the platform. Project creators may abandon projects or misuse funds.</p>
          </div>

          <div className="risk-category">
            <h3>⚖️ No Investment Advice</h3>
            <p>Nothing on this platform constitutes financial, investment, legal, or tax advice. All project funding decisions are yours alone.</p>
          </div>

          <div className="risk-category">
            <h3>🏛️ Regulatory Compliance Required</h3>
            <p>You must comply with ALL laws in your country regarding cryptocurrency, securities, crowdfunding, and DeFi activities. Some jurisdictions prohibit or restrict these activities. Penalties may include fines, asset seizure, or criminal prosecution.</p>
          </div>
        </section>

        <section className="terms-section">
          <h2>1. PLATFORM DESCRIPTION</h2>
          <p>
            <strong>Teiko Labs</strong> is a Bitcoin-powered crowdfunding platform where users can:
          </p>
          <ul>
            <li>Create crowdfunding projects with 21 million units of treasury ownership</li>
            <li>Trade treasury ownership tokens using sBTC on Stacks blockchain</li>
            <li>Compete to become majority holders to claim 1.5% trading fees from every transaction</li>
            <li>Lock ownership tokens to secure majority holder status</li>
            <li>Participate in decentralized project funding and profit distribution</li>
          </ul>
          <p>
            <strong>IMPORTANT:</strong> Teiko Labs is purely a technology platform. We do not control project outcomes, smart contract execution, or fund custody.
          </p>
        </section>

        <section className="terms-section">
          <h2>2. USER RESPONSIBILITIES & REQUIREMENTS</h2>
          <ul>
            <li><strong>Age Requirement:</strong> You must be at least 18 years old to use Teiko Labs</li>
            <li><strong>Legal Capacity:</strong> You must have legal capacity to enter into contracts in your jurisdiction</li>
            <li><strong>Wallet Security:</strong> You are solely responsible for your wallet security, private keys, and seed phrases</li>
            <li><strong>Due Diligence:</strong> You must research all projects before funding (#DYOR - Do Your Own Research)</li>
            <li><strong>Legal Compliance:</strong> You must comply with ALL applicable laws and regulations in your country, state, province, and local jurisdiction, including but not limited to securities laws, tax obligations, anti-money laundering (AML) requirements, and know-your-customer (KYC) regulations</li>
            <li><strong>Jurisdictional Responsibility:</strong> You are solely responsible for determining whether your use of Teiko Labs is legal in your jurisdiction. We do not provide legal advice regarding compliance</li>
            <li><strong>Prohibited Jurisdictions:</strong> You must not use the platform if cryptocurrency trading, crowdfunding, or DeFi activities are prohibited in your jurisdiction</li>
            <li><strong>Tax Obligations:</strong> You are responsible for reporting and paying all taxes on your activities, including capital gains, income from trading fees, and any other tax liabilities in your country</li>
            <li><strong>Anti-Fraud:</strong> You must not engage in market manipulation, wash trading, or fraudulent activities</li>
            <li><strong>Project Verification:</strong> You acknowledge that project creators may be anonymous and unverified</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>3. SPECIFIC PLATFORM RISKS</h2>
          
          <div className="risk-category">
            <h3>🏛️ Treasury Ownership Competition</h3>
            <p>Multiple users compete for majority holder status. You may lose majority status and trading fee rights to other users at any time without warning.</p>
          </div>

          <div className="risk-category">
            <h3>🔐 Token Locking Mechanism</h3>
            <p>Locked ownership tokens cannot be unlocked until specific revenue thresholds are met. These thresholds may never be reached, permanently locking your tokens.</p>
          </div>

          <div className="risk-category">
            <h3>💰 1.5% Trading Fee Structure</h3>
            <p>Trading fees are not guaranteed. Low trading volume means minimal fees. Platform mechanics may change fee distribution at any time.</p>
          </div>

          <div className="risk-category">
            <h3>📊 21 Million Token Supply</h3>
            <p>Fixed supply may create artificial scarcity or dilution effects. Early buyers may have unfair advantages over later participants.</p>
          </div>

          <div className="risk-category">
            <h3>🎯 Crowdfunding Project Risks</h3>
            <p>Projects may fail, be abandoned, or be fraudulent. Project creators may disappear with funds. No guarantees exist for project completion or success.</p>
          </div>
        </section>

        <section className="terms-section risk-section">
          <h2>⚠️ 4. RISK DISCLAIMER</h2>
          <div className="risk-warning">
            <h3>IMPORTANT: PLEASE READ CAREFULLY</h3>
            <p>
              <strong>TRADING CRYPTOCURRENCY AND DIGITAL ASSETS INVOLVES SUBSTANTIAL RISK OF LOSS AND IS NOT SUITABLE FOR ALL INVESTORS.</strong>
            </p>
          </div>
          
          <h4>Financial Risks:</h4>
          <ul>
            <li><strong>Total Loss of Funds:</strong> You may lose all money invested in treasury ownership tokens</li>
            <li><strong>Market Volatility:</strong> Token prices can fluctuate dramatically and unpredictably</li>
            <li><strong>No Guaranteed Returns:</strong> Trading fees and profits are not guaranteed</li>
            <li><strong>Majority Holder Competition:</strong> Other users may outbid you for majority holder status</li>
            <li><strong>Locked Funds:</strong> Ownership tokens may become locked based on platform mechanics</li>
          </ul>

          <h4>Technical Risks:</h4>
          <ul>
            <li><strong>Smart Contract Risk:</strong> Bugs or vulnerabilities in Clarity smart contracts may cause loss of funds</li>
            <li><strong>Blockchain Risk:</strong> Issues with Stacks blockchain or sBTC peg may affect functionality</li>
            <li><strong>Platform Downtime:</strong> Technical issues may prevent access to funds or trading</li>
            <li><strong>Wallet Security:</strong> Loss of private keys results in permanent loss of funds</li>
          </ul>

          <h4>Regulatory Risks:</h4>
          <ul>
            <li><strong>Uncertain Legal Status:</strong> Regulatory treatment of digital assets may change</li>
            <li><strong>Compliance Requirements:</strong> You may be subject to tax or reporting obligations</li>
            <li><strong>Jurisdictional Restrictions:</strong> Use may be prohibited in certain jurisdictions</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>5. NO INVESTMENT ADVICE</h2>
          <p>
            Nothing on this Platform constitutes investment, financial, trading, or other advice. All content is for informational purposes only. You should consult with qualified professionals before making any investment decisions.
          </p>
        </section>

        <section className="terms-section">
          <h2>6. PLATFORM DISCLAIMERS</h2>
          <ul>
            <li>The Platform is provided "as is" without warranties of any kind</li>
            <li>We do not guarantee Platform availability, functionality, or security</li>
            <li>We are not responsible for user-generated content or project outcomes</li>
            <li>We do not custody funds or control smart contract operations</li>
            <li>Third-party integrations (wallets, explorers) are used at your own risk</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>7. LIMITATION OF LIABILITY</h2>
          <p>
            <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM, INCLUDING BUT NOT LIMITED TO LOSS OF FUNDS, PROFITS, OR DATA.</strong>
          </p>
        </section>

        <section className="terms-section">
          <h2>8. PROHIBITED ACTIVITIES</h2>
          <ul>
            <li>Market manipulation or wash trading</li>
            <li>Creating fraudulent or misleading projects</li>
            <li>Attempting to exploit smart contract vulnerabilities</li>
            <li>Using the Platform for money laundering or illegal activities</li>
            <li>Violating intellectual property rights</li>
            <li>Interfering with Platform operations or other users</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>9. MODIFICATIONS AND TERMINATION</h2>
          <p>
            We reserve the right to modify these terms, update the Platform, or terminate services at any time without notice. Continued use after modifications constitutes acceptance of updated terms.
          </p>
        </section>

        <section className="terms-section">
          <h2>10. GOVERNING LAW</h2>
          <p>
            These terms are governed by applicable law. Any disputes shall be resolved through binding arbitration where permitted by law.
          </p>
        </section>

        <section className="terms-section acknowledgment">
          <h2>11. ACKNOWLEDGMENT</h2>
          <div className="acknowledgment-box">
            <p>
              <strong>BY USING THIS PLATFORM, YOU ACKNOWLEDGE THAT:</strong>
            </p>
            <ul>
              <li>You have read and understood these Terms of Service and Risk Disclaimer</li>
              <li>You understand the substantial risks involved in cryptocurrency trading</li>
              <li>You are using the Platform at your own risk and responsibility</li>
              <li>You may lose all funds invested in treasury ownership tokens</li>
              <li>No returns or profits are guaranteed</li>
              <li>You are responsible for compliance with applicable laws</li>
            </ul>
          </div>
        </section>

        <div className="contact-section">
          <h2>Contact</h2>
          <p>
            For questions about these terms, please contact us through our official channels.
          </p>
        </div>
      </div>
    </div>
  );
}
