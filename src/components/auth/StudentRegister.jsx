import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './Auth.scss';

const StudentRegister = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    grade: '7',
    gradeLetter: 'A',
    login: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const { registerStudentUser, loading } = useAuth();

  const grades = [7, 8, 9, 10, 11];
  const gradeLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (
      !formData.firstName || 
      !formData.lastName || 
      !formData.grade || 
      !formData.gradeLetter || 
      !formData.login || 
      !formData.password
    ) {
      setError('Барлық міндетті өрістерді толтырыңыз');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Парольдер сәйкес келмейді');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Пароль кемінде 6 символдан тұруы керек');
      return;
    }
    
    const result = await registerStudentUser({
      firstName: formData.firstName,
      lastName: formData.lastName,
      middleName: formData.middleName,
      grade: formData.grade,
      gradeLetter: formData.gradeLetter,
      login: formData.login,
      password: formData.password,
    });
    
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>QazaqCode</h2>
        <h3>Оқушының тіркелуі</h3>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="lastName">Тегі*</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Тегіңізді енгізіңіз"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="firstName">Аты*</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Атыңызды енгізіңіз"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="middleName">Әкесінің аты</label>
            <input
              type="text"
              id="middleName"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              placeholder="Әкесінің атын енгізіңіз (егер бар болса)"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="grade">Сынып*</label>
              <select
                id="grade"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                required
              >
                {grades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="gradeLetter">Сыныптың әрпі*</label>
              <select
                id="gradeLetter"
                name="gradeLetter"
                value={formData.gradeLetter}
                onChange={handleChange}
                required
              >
                {gradeLetters.map((letter) => (
                  <option key={letter} value={letter}>
                    {letter}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="login">Логин*</label>
            <input
              type="text"
              id="login"
              name="login"
              value={formData.login}
              onChange={handleChange}
              placeholder="Логин жасаңыз"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Пароль*</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Пароль жасаңыз"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Парольді растау*</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Парольді растаңыз"
              required
            />
          </div>
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading ? 'Тіркелу...' : 'Тіркелу'}
          </button>
        </form>
        <div className="auth-links">
          <p style={{color: 'gray'}}>Есептік жазбаңыз бар ма? <Link to="/login">Кіру</Link></p>
        </div>
      </div>
    </div>
  );
};

export default StudentRegister;