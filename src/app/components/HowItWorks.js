'use client';
import { useTranslation } from 'react-i18next';
import './HowItWorks.css';

const HowItWorks = ({ onClose }) => {
  const { t } = useTranslation();
  
  return (
    <div className="how-it-works-overlay" onClick={onClose}>
      <div className="how-it-works-popup" onClick={(e) => e.stopPropagation()}>
        <h2>{t('how_it_works')}</h2>
        <p>{t('how_it_works_description')}</p>

        <button onClick={onClose} className="close-btn">{t('close')}</button>
      </div>
    </div>
  );
};

export default HowItWorks;
