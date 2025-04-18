import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import '../styles/MainLayout.scss';

/**
 * Main layout component for authenticated pages.
 * Includes common elements like header, main content area, and potentially footer.
 * Uses Outlet from react-router to render child routes.
 */
const MainLayout = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate layout loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="main-layout">
      <Header />
      
      <main className="main-content-area">
        <div className="container">
          <Outlet />
        </div>
      </main>
      
      <footer className="main-footer">
        <div className="container">
          <p>© {new Date().getFullYear()} QazaqCode | All rights reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout; 