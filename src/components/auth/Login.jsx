import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './Auth.scss';

const Login = () => {
  const [formData, setFormData] = useState({
    login: '',
    password: '',
  });
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.login || !formData.password) {
      setError('Барлық өрістерді толтырыңыз');
      return;
    }
    
    const result = await login(formData.login, formData.password);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>QazaqCode</h2>
        <h3>Жүйеге кіру</h3>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="login">Логин</label>
            <input
              type="text"
              id="login"
              name="login"
              value={formData.login}
              onChange={handleChange}
              placeholder="Логиніңізді енгізіңіз"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Парольді енгізіңіз"
              required
            />
          </div>
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading ? 'Жүктелуде...' : 'Кіру'}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/forgot-password">Парольді ұмыттыңыз ба?</Link>
          <div className="auth-register-links">
            <p>Аккаунтыңыз жоқ па?</p>
            <div>
              <Link to="/register/student">Оқушы ретінде тіркелу</Link> | 
              <Link to="/register/teacher">Мұғалім ретінде тіркелу</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;