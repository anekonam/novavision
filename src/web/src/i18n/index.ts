import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en-GB/common.json';
import enAuth from './locales/en-GB/auth.json';
import deCommon from './locales/de-DE/common.json';
import deAuth from './locales/de-DE/auth.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'en-GB': { common: enCommon, auth: enAuth },
      'de-DE': { common: deCommon, auth: deAuth },
    },
    fallbackLng: 'en-GB',
    defaultNS: 'common',
    ns: ['common', 'auth'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'novavision-language',
    },
  });

export default i18n;
