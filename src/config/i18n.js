import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// импортируем переводы напрямую (в реальном проекте их обычно загружают с сервера)
import kzTranslation from '../locales/kz.json';
import ruTranslation from '../locales/ru.json';
import enTranslation from '../locales/en.json';

const resources = {
  kz: { translation: kzTranslation },
  ru: { translation: ruTranslation },
  en: { translation: enTranslation }
};

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(HttpBackend)
  .init({
    resources,
    lng: 'kz', // язык по умолчанию - казахский
    fallbackLng: 'kz', // если перевод не найден, использовать казахский
    supportedLngs: ['kz', 'ru', 'en'], // поддерживаемые языки
    interpolation: {
      escapeValue: false, // не экранировать HTML
    },
    detection: {
      order: ['localStorage', 'cookie', 'navigator'], // порядок поиска языка
      caches: ['localStorage', 'cookie'], // где хранить выбранный язык
    },
    react: {
      useSuspense: true, // использовать React Suspense
    },
    backend: {
      // указываем путь к файлам переводов (в реальном проекте - путь к API)
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    }
  });

export default i18n;
