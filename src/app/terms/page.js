'use client';
import './terms.css';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import Header from '../components/header';

export default function TermsPage() {
  const { t } = useTranslation();
  
  return (
    <>
      <Header />
      <div className="terms-container">
      <div className="terms-content">
        <h1>📋 {t('terms_of_service_risk_disclosure')}</h1>
        
        <div className="critical-warning">
          <h2>📝 {t('terms_agreement_notice')}</h2>
        </div>

        <div className="last-updated">
          {t('last_updated')}: {new Date().toLocaleDateString()}
        </div>

        <section className="terms-section disclaimer-section">
          <h2>📋 {t('complete_disclaimer_liability')}</h2>
          <p className="bold-warning">
            <strong>{t('teiko_labs_no_responsibility')}</strong>
          </p>
          <ul className="liability-list">
            <li><strong>{t('financial_losses')}:</strong> {t('financial_losses_desc')}</li>
            <li><strong>{t('project_failures')}:</strong> {t('project_failures_desc')}</li>
            <li><strong>{t('treasury_ownership_risks')}:</strong> {t('treasury_ownership_risks_desc')}</li>
            <li><strong>{t('smart_contract_risks')}:</strong> {t('smart_contract_risks_desc')}</li>
            <li><strong>{t('sbtc_stacks_risks')}:</strong> {t('sbtc_stacks_risks_desc')}</li>
            <li><strong>{t('market_manipulation')}:</strong> {t('market_manipulation_desc')}</li>
            <li><strong>{t('wallet_security')}:</strong> {t('wallet_security_desc')}</li>
            <li><strong>{t('technical_failures')}:</strong> {t('technical_failures_desc')}</li>
            <li><strong>{t('regulatory_actions')}:</strong> {t('regulatory_actions_desc')}</li>
            <li><strong>{t('tax_liabilities')}:</strong> {t('tax_liabilities_desc')}</li>
            <li><strong>{t('compliance_failures')}:</strong> {t('compliance_failures_desc')}</li>
          </ul>
          <p className="risk-emphasis">
            <strong>{t('use_at_own_risk')}</strong>
          </p>
        </section>

        <section className="terms-section">
          <h2>⚠️ {t('important_risk_information')}</h2>
          
          <div className="risk-category">
            <h3>🔬 {t('experimental_technology')}</h3>
            <p>{t('experimental_technology_desc')}</p>
          </div>

          <div className="risk-category">
            <h3>💰 {t('potential_loss_funds')}</h3>
            <p>{t('potential_loss_funds_desc')}</p>
          </div>

          <div className="risk-category">
            <h3>🔐 {t('token_locking_mechanism')}</h3>
            <p>{t('token_locking_mechanism_desc')}</p>
          </div>

          <div className="risk-category">
            <h3>📋 {t('no_project_verification')}</h3>
            <p>{t('no_project_verification_desc')}</p>
          </div>

          <div className="risk-category">
            <h3>📚 {t('no_investment_advice')}</h3>
            <p>{t('no_investment_advice_desc')}</p>
          </div>

          <div className="risk-category">
            <h3>⚖️ {t('regulatory_compliance')}</h3>
            <p>{t('regulatory_compliance_desc')}</p>
          </div>
        </section>

        <section className="terms-section">
          <h2>1. {t('platform_description_title')}</h2>
          <p>
            <strong>{t('teiko_labs')}</strong> {t('platform_description_intro')}
          </p>
          <ul>
            <li>{t('platform_feature_1')}</li>
            <li>{t('platform_feature_2')}</li>
            <li>{t('platform_feature_3')}</li>
            <li>{t('platform_feature_4')}</li>
            <li>{t('platform_feature_5')}</li>
          </ul>
          <p>
            <strong>{t('important')}:</strong> {t('platform_disclaimer')}
          </p>
        </section>

        <section className="terms-section">
          <h2>2. {t('user_responsibilities_title')}</h2>
          <ul>
            <li><strong>{t('age_requirement')}:</strong> {t('age_requirement_desc')}</li>
            <li><strong>{t('legal_capacity')}:</strong> {t('legal_capacity_desc')}</li>
            <li><strong>{t('wallet_security_responsibility')}:</strong> {t('wallet_security_responsibility_desc')}</li>
            <li><strong>{t('due_diligence')}:</strong> {t('due_diligence_desc')}</li>
            <li><strong>{t('legal_compliance_responsibility')}:</strong> {t('legal_compliance_responsibility_desc')}</li>
            <li><strong>{t('jurisdictional_responsibility')}:</strong> {t('jurisdictional_responsibility_desc')}</li>
            <li><strong>{t('prohibited_jurisdictions')}:</strong> {t('prohibited_jurisdictions_desc')}</li>
            <li><strong>{t('tax_obligations')}:</strong> {t('tax_obligations_desc')}</li>
            <li><strong>{t('anti_fraud')}:</strong> {t('anti_fraud_desc')}</li>
            <li><strong>{t('project_verification')}:</strong> {t('project_verification_desc')}</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>3. {t('specific_platform_risks_title')}</h2>
          
          <div className="risk-category">
            <h3>🏆 {t('treasury_ownership_competition')}</h3>
            <p>{t('treasury_ownership_competition_desc')}</p>
          </div>

          <div className="risk-category">
            <h3>🔐 {t('token_locking_mechanism_risk')}</h3>
            <p>{t('token_locking_mechanism_risk_desc')}</p>
          </div>

          <div className="risk-category">
            <h3>💰 {t('trading_fee_structure')}</h3>
            <p>{t('trading_fee_structure_desc')}</p>
          </div>

          <div className="risk-category">
            <h3>📊 {t('fixed_token_supply')}</h3>
            <p>{t('fixed_token_supply_desc')}</p>
          </div>

          <div className="risk-category">
            <h3>📈 {t('crowdfunding_project_risks')}</h3>
            <p>{t('crowdfunding_project_risks_desc')}</p>
          </div>
        </section>

        <section className="terms-section risk-section">
          <h2>⚠️ 4. {t('risk_disclaimer_title')}</h2>
          <div className="risk-warning">
            <h3>{t('important_read_carefully')}</h3>
            <p>
              <strong>{t('cryptocurrency_trading_risk')}</strong>
            </p>
          </div>
          
          <h4>{t('financial_risks')}:</h4>
          <ul>
            <li><strong>{t('total_loss_funds')}:</strong> {t('total_loss_funds_desc')}</li>
            <li><strong>{t('market_volatility')}:</strong> {t('market_volatility_desc')}</li>
            <li><strong>{t('no_guaranteed_returns')}:</strong> {t('no_guaranteed_returns_desc')}</li>
            <li><strong>{t('majority_holder_competition')}:</strong> {t('majority_holder_competition_desc')}</li>
            <li><strong>{t('locked_funds')}:</strong> {t('locked_funds_desc')}</li>
          </ul>

          <h4>{t('technical_risks')}:</h4>
          <ul>
            <li><strong>{t('smart_contract_risk')}:</strong> {t('smart_contract_risk_desc')}</li>
            <li><strong>{t('blockchain_risk')}:</strong> {t('blockchain_risk_desc')}</li>
            <li><strong>{t('platform_downtime')}:</strong> {t('platform_downtime_desc')}</li>
            <li><strong>{t('wallet_security_risk')}:</strong> {t('wallet_security_risk_desc')}</li>
          </ul>

          <h4>{t('regulatory_risks')}:</h4>
          <ul>
            <li><strong>{t('uncertain_legal_status')}:</strong> {t('uncertain_legal_status_desc')}</li>
            <li><strong>{t('compliance_requirements')}:</strong> {t('compliance_requirements_desc')}</li>
            <li><strong>{t('jurisdictional_restrictions')}:</strong> {t('jurisdictional_restrictions_desc')}</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>5. {t('no_investment_advice_title')}</h2>
          <p>
            {t('no_investment_advice_desc')}
          </p>
        </section>

        <section className="terms-section">
          <h2>6. {t('platform_disclaimers_title')}</h2>
          <ul>
            <li>{t('platform_disclaimer_1')}</li>
            <li>{t('platform_disclaimer_2')}</li>
            <li>{t('platform_disclaimer_3')}</li>
            <li>{t('platform_disclaimer_4')}</li>
            <li>{t('platform_disclaimer_5')}</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>7. {t('limitation_liability_title')}</h2>
          <p>
            <strong>{t('limitation_liability_desc')}</strong>
          </p>
        </section>

        <section className="terms-section">
          <h2>8. {t('prohibited_activities_title')}</h2>
          <ul>
            <li>{t('prohibited_activity_1')}</li>
            <li>{t('prohibited_activity_2')}</li>
            <li>{t('prohibited_activity_3')}</li>
            <li>{t('prohibited_activity_4')}</li>
            <li>{t('prohibited_activity_5')}</li>
            <li>{t('prohibited_activity_6')}</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>9. {t('modifications_termination_title')}</h2>
          <p>
            {t('modifications_termination_desc')}
          </p>
        </section>

        <section className="terms-section">
          <h2>10. {t('governing_law_title')}</h2>
          <p>
            {t('governing_law_desc')}
          </p>
        </section>

        <section className="terms-section acknowledgment">
          <h2>11. {t('acknowledgment_title')}</h2>
          <div className="acknowledgment-box">
            <p>
              <strong>{t('acknowledgment_intro')}</strong>
            </p>
            <ul>
              <li>{t('acknowledgment_1')}</li>
              <li>{t('acknowledgment_2')}</li>
              <li>{t('acknowledgment_3')}</li>
              <li>{t('acknowledgment_4')}</li>
              <li>{t('acknowledgment_5')}</li>
              <li>{t('acknowledgment_6')}</li>
            </ul>
          </div>
        </section>

        <div className="contact-section">
          <h2>{t('contact')}</h2>
          <p>
            {t('contact_desc')}
          </p>
        </div>
      </div>
      </div>
    </>
  );
}
