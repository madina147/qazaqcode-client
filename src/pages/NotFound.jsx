import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/NotFound.scss';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>404</h1>
        <div className="glitch-wrapper">
          <div className="glitch" data-text={t('notFound.pageNotFound')}>
            {t('notFound.pageNotFound', 'Page Not Found')}
          </div>
        </div>
        
        <p>{t('notFound.message', 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.')}</p>
        
        <div className="not-found-actions">
          <Link to="/" className="home-button">
            {t('notFound.returnHome', 'Return to Home')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 