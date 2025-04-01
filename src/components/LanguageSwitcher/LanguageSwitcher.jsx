import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  // Обработчик смены языка
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-switcher">
      <button
        onClick={() => changeLanguage('kz')}
        className={i18n.language === 'kz' ? 'active' : ''}
      >
        {t('language.kz')}
      </button>

      <button
        onClick={() => changeLanguage('ru')}
        className={i18n.language === 'ru' ? 'active' : ''}
      >
        {t('language.ru')}
      </button>

      <button
        onClick={() => changeLanguage('en')}
        className={i18n.language === 'en' ? 'active' : ''}
      >
        {t('language.en')}
      </button>
    </div>
  );
};

export default LanguageSwitcher;
