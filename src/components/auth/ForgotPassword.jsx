import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../services/api';
import './Auth.scss';

const ForgotPassword = () => {
  const [login, setLogin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (!login) {
      setError('Логинді енгізіңіз');
      return;
    }
    
    try {
      setLoading(true);
      await forgotPassword({ login });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Парольды қалпына келтіру сұрауында қате пайда болды'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>QazaqCode</h2>
        <h3>Парольды қалпына келтіру</h3>
        {error && <div className="auth-error">{error}</div>}
        {success ? (
          <div className="auth-success">
            <p>
              Парольды қалпына келтіру нұсқаулары сіздің поштаңызға жіберілді.
              Пожалуйста, поштаны тексеріңіз және көрсетілген қадамдарды орындаңыз.
            </p>
            <div className="auth-links">
              <Link to="/login">Кіру бетіне оралу</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="login">Логин</label>
              <input
                type="text"
                id="login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Логиніңізді енгізіңіз"
                required
              />
            </div>
            <button 
              type="submit" 
              className="auth-button" 
              disabled={loading}
            >
              {loading ? 'Жіберілуде...' : 'Парольды қалпына келтіру'}
            </button>
          </form>
        )}
        {!success && (
          <div className="auth-links">
            <Link to="/login">Кіру бетіне оралу</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;