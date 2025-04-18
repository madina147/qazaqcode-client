import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import useAuth from '../../hooks/useAuth';
import './Layout.scss';
import '../../../modern-style.css'; // Импортируем новые стили
import '../header-styles/GlassHeader.css'; // Импортируем стили стеклянного хедера

const Header = () => {
  const { user, logout, isTeacher } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  // Функция для получения инициалов пользователя
  const getUserInitials = () => {
    if (!user) return '';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`;
  };

  return (
    <header className="main-header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">
            <span className="logo-text">QazaqCode</span>
          </Link>
        </div>
        
        {user && (
          <>
            <nav className={`main-nav ${isMenuOpen ? 'active' : ''}`}>
              <ul>
                <li>
                  <Link 
                    to={isTeacher ? "/dashboard/teacher" : "/dashboard/student"} 
                    onClick={closeMenu}
                    className={window.location.pathname.includes('/dashboard') ? 'active' : ''}
                  >
                    Профиль
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/ratings" 
                    onClick={closeMenu}
                    className={window.location.pathname.includes('/ratings') ? 'active' : ''}
                  >
                    Рейтинг
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/all-groups" 
                    onClick={closeMenu}
                    className={window.location.pathname.includes('/groups') ? 'active' : ''}
                  >
                    Топтар
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/tasks" 
                    onClick={closeMenu}
                    className={window.location.pathname.includes('/tasks') ? 'active' : ''}
                  >
                    Тапсырмалар
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/chat" 
                    onClick={closeMenu}
                    className={window.location.pathname.includes('/chat') ? 'active' : ''}
                  >
                    Чат
                  </Link>
                </li>
                <li className="mobile-only">
                  <button onClick={handleLogout} className="logout-button">
                    Шығу
                  </button>
                </li>
              </ul>
            </nav>
            
            <div className="user-actions">
              <div className="user-name">
                <div className="avatar">
                  {getUserInitials()}
                </div>
                <span>{user.firstName} {user.lastName}</span>
              </div>
              <button onClick={handleLogout} className="logout-button desktop-only">
                Шығу
              </button>
            </div>
            
            <button 
              className={`mobile-menu-toggle ${isMenuOpen ? 'active' : ''}`} 
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;