import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../public/locales/en/translation.json';
import de from '../public/locales/de/translation.json';
import es from '../public/locales/es/translation.json';
import zh from '../public/locales/zh/translation.json';
import ja from '../public/locales/ja/translation.json';
import hi from '../public/locales/hi/translation.json';
import pt from '../public/locales/pt/translation.json';
import fr from '../public/locales/fr/translation.json';
import it from '../public/locales/it/translation.json';
import ru from '../public/locales/ru/translation.json';
import ko from '../public/locales/ko/translation.json';
import ar from '../public/locales/ar/translation.json';

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    de: { translation: de },
    es: { translation: es },
    zh: { translation: zh },
    ja: { translation: ja },
    hi: { translation: hi },
    pt: { translation: pt },
    fr: { translation: fr },
    it: { translation: it },
    ru: { translation: ru },
    ko: { translation: ko },
    ar: { translation: ar }
  },
  interpolation: { escapeValue: false }
});

export default i18n; 