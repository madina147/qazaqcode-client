import { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import { getAvailableStudents, getAllStudents, authHeader } from '../../services/api';
import './GroupStyles.scss';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AddStudentModal = ({ onClose, onSubmit, groupId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [students, setStudents] = useState([]);
  
  useEffect(() => {
    const fetchAvailableStudents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get students not in this group
        const response = await getAvailableStudents(groupId);
        setAvailableStudents(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching available students:', err);
        setError(err.response?.data?.message || 'Оқушылар тізімін жүктеу кезінде қате пайда болды');
        setLoading(false);
      }
    };
    
    const fetchStudents = async () => {
      try {
        const response = await getAllStudents();
        setStudents(response.data);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Оқушылар тізімін жүктеу кезінде қате пайда болды');
      }
    };
    
    fetchAvailableStudents();
    fetchStudents();
  }, [groupId]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      setError('Оқушыны таңдаңыз');
      return;
    }
    
    const student = availableStudents.find(s => s._id === selectedStudent);
    if (!student) {
      setError('Оқушы табылмады');
      return;
    }
    
    onSubmit(student);
  };
  
  const handleStudentSelect = (e) => {
    setSelectedStudent(e.target.value);
  };
  
  return (
    <div className="create-group-container">
      <h1>Жаңа топ құру</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <form className="create-group-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="student">Оқушыны таңдаңыз</label>
          <select
            id="student"
            name="student"
            value={selectedStudent}
            onChange={handleStudentSelect}
          >
            <option value="">-- Таңдаңыз --</option>
            {students.map(student => (
              <option key={student._id} value={student._id}>
                {student.firstName} {student.lastName} - {student.email}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-actions">
          <Link to="/dashboard/teacher" className="btn">
            Бас тарту
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Жасалуда...' : 'Топты құру'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStudentModal; 