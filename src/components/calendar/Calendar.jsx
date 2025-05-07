import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './Calendar.scss';

const Calendar = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'assignment', // assignment, test, lesson, other
  });

  // Mock data - in a real app, this would come from an API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      const generatedEvents = [];
      const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
      
      for (let day = 1; day <= daysInCurrentMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay(); // 0 - воскресенье, 6 - суббота
        
        // Пропускаем выходные (суббота и воскресенье)
        if (dayOfWeek === 6 || dayOfWeek === 0) {
          // Добавляем событие выходного дня
          generatedEvents.push({
            id: `${day}-rest`,
            title: 'Демалыс күні',
            description: 'Студенттерге демалыс күні',
            date: new Date(year, month, day),
            time: '00:00',
            type: 'other'
          });
          continue;
        }
        
        // Определяем тему урока в зависимости от дня недели
        let lessonTitle = '';
        let lessonDescription = '';
        
        switch (dayOfWeek) {
          case 1: // Понедельник
            lessonTitle = 'Python: Деректер түрлері';
            lessonDescription = 'Сандар, жолдар, тізімдер, сөздіктер';
            break;
          case 2: // Вторник
            lessonTitle = 'Python: Шартты операторлар';
            lessonDescription = 'if-else, логикалық операторлар';
            break;
          case 3: // Среда
            lessonTitle = 'Python: Циклдар';
            lessonDescription = 'for, while, итерациялар';
            break;
          case 4: // Четверг
            lessonTitle = 'Python: Функциялар';
            lessonDescription = 'Функцияларды анықтау, параметрлер, қайтарылатын мәндер';
            break;
          case 5: // Пятница
            lessonTitle = 'Python: Практика';
            lessonDescription = 'Есептерді шешу, материалды бекіту';
            break;
          default:
            break;
        }
        
        // Добавляем основной урок
        generatedEvents.push({
          id: day,
          title: lessonTitle,
          description: lessonDescription,
          date: new Date(year, month, day - 1),
          time: '14:00',
          type: 'lesson'
        });
        
        // Добавляем тапсырма по понедельникам и средам
        if (dayOfWeek === 1 || dayOfWeek === 3) {
          generatedEvents.push({
            id: `${day}-task`,
            title: 'Тапсырма',
            description: 'Практикалық тапсырмалар',
            date: new Date(year, month, day - 1),
            time: '15:30',
            type: 'assignment'
          });
        }
        
        // Добавляем тесты по вторникам и четвергам
        if (dayOfWeek === 2) {
          generatedEvents.push({
            id: `${day}-test`,
            title: 'Программалау тесті',
            description: 'Өткен материалдар бойынша білімді тексеру',
            date: new Date(year, month, day),
            time: '16:00',
            type: 'test'
          });
        }
        
        if (dayOfWeek === 4) {
          generatedEvents.push({
            id: `${day}-test2`,
            title: 'Тест 2',
            description: 'Екінші тест',
            date: new Date(year, month, day - 1),
            time: '16:30',
            type: 'test'
          });
        }
        
        // Добавляем домашние задания по понедельникам и четвергам
        if (dayOfWeek === 1 || dayOfWeek === 4) {
          generatedEvents.push({
            id: `${day}-assignment`,
            title: 'Үй тапсырмасы',
            description: 'Материалды бекітуге арналған практикалық тапсырмалар',
            date: new Date(year, month, day - 1),
            time: '18:00',
            type: 'assignment'
          });
        }
        
        // Добавляем консультации по средам
        if (dayOfWeek === 3) {
          generatedEvents.push({
            id: `${day}-other`,
            title: 'Кеңес беру',
            description: 'Күрделі тақырыптар бойынша қосымша кеңес беру',
            date: new Date(year, month, day - 1),
            time: '17:30',
            type: 'other'
          });
        }
      }
      
      setEvents(generatedEvents);
      setLoading(false);
    }, 800);
  }, [currentDate]);

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatMonth = (date) => {
    return new Intl.DateTimeFormat('kk-KZ', { month: 'long', year: 'numeric' }).format(date);
  };

  const getMonthDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const firstDay = firstDayOfMonth(currentDate);
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add the days of the month
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    
    return days;
  };

  const getDayEvents = (day) => {
    if (!day) return [];
    
    return events.filter(event => {
      const eventDay = event.date.getDate();
      return eventDay === day;
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    if (!day) return;
    
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
  };

  const handleNewEventChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewEventSubmit = (e) => {
    e.preventDefault();
    
    // In a real app, you would call an API to save the event
    const newEventObject = {
      id: events.length + 1,
      ...newEvent,
      date: selectedDate
    };
    
    setEvents(prev => [...prev, newEventObject]);
    setShowEventForm(false);
    setNewEvent({
      title: '',
      description: '',
      date: '',
      time: '',
      type: 'assignment'
    });
  };

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'assignment':
        return '📝';
      case 'test':
        return '📊';
      case 'lesson':
        return '📚';
      default:
        return '📌';
    }
  };

  const getEventTypeClass = (type) => {
    switch (type) {
      case 'assignment':
        return 'event-assignment';
      case 'test':
        return 'event-test';
      case 'lesson':
        return 'event-lesson';
      default:
        return 'event-other';
    }
  };

  return (
    <div className="qazaq-calendar">
      <div className="calendar-container">
        <Link to="/" className="back-link">
          Басты бетке оралу
        </Link>
        
        <div className="calendar-header">
          <h1 style={{fontSize: '2rem'}}>Академиялық күнтізбе</h1>
          <p className="calendar-subtitle" style={{fontSize: '1.2rem'}}>Сабақтар, тапсырмалар және тесттер жоспары</p>
        </div>
        
        <div className="calendar-controls">
          <div className="month-navigation">
            <button onClick={handlePrevMonth} className="month-nav-button prev" style={{fontSize: '1.1rem'}}>
              <span className="arrow">←</span> Алдыңғы ай
            </button>
            <h2 className="current-month" style={{fontSize: '1.5rem'}}>{formatMonth(currentDate)}</h2>
            <button onClick={handleNextMonth} className="month-nav-button next" style={{fontSize: '1.1rem'}}>
              Келесі ай <span className="arrow">→</span>
            </button>
          </div>
          
          <div className="view-legend">
            <div className="legend-item">
              <span className="legend-dot assignment"></span>
              <span style={{fontSize: '1.1rem'}}>Тапсырма</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot test"></span>
              <span style={{fontSize: '1.1rem'}}>Тест</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot lesson"></span>
              <span style={{fontSize: '1.1rem'}}>Сабақ</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot other"></span>
              <span style={{fontSize: '1.1rem'}}>Басқа</span>
            </div>
          </div>
        </div>
        
        <div className="calendar-grid">
          <div className="weekdays">
            <div className="weekday" style={{fontSize: '1.2rem'}}>Дү</div>
            <div className="weekday" style={{fontSize: '1.2rem'}}>Се</div>
            <div className="weekday" style={{fontSize: '1.2rem'}}>Ср</div>
            <div className="weekday" style={{fontSize: '1.2rem'}}>Бе</div>
            <div className="weekday" style={{fontSize: '1.2rem'}}>Жұ</div>
            <div className="weekday" style={{fontSize: '1.2rem'}}>Се</div>
            <div className="weekday" style={{fontSize: '1.2rem'}}>Же</div>
          </div>
          
          <div className="days">
            {loading ? (
              <div className="calendar-loading">
                <div className="loading-spinner"></div>
                <p style={{fontSize: '1.2rem'}}>Күнтізбе жүктелуде...</p>
              </div>
            ) : (
              getMonthDays().map((day, index) => {
                const dayEvents = getDayEvents(day);
                const isToday = day === new Date().getDate() && 
                               currentDate.getMonth() === new Date().getMonth() && 
                               currentDate.getFullYear() === new Date().getFullYear();
                
                const isSelected = selectedDate && 
                                  day === selectedDate.getDate() && 
                                  currentDate.getMonth() === selectedDate.getMonth() && 
                                  currentDate.getFullYear() === selectedDate.getFullYear();
                
                // Определяем типы событий для этого дня
                const hasLesson = dayEvents.some(event => event.type === 'lesson');
                const hasTest = dayEvents.some(event => event.type === 'test');
                const hasAssignment = dayEvents.some(event => event.type === 'assignment');
                const hasOther = dayEvents.some(event => event.type === 'other');
                
                return (
                  <div 
                    key={index} 
                    className={`day ${!day ? 'empty' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}
                    onClick={() => handleDateClick(day)}
                  >
                    {day && (
                      <>
                        <div className="day-number" style={{fontSize: '1.3rem'}}>{day}</div>
                        <div className="day-events">
                          {hasLesson && (
                            <div className="event-indicator event-lesson">
                              <span className="event-dot"></span>
                              <span className="event-title-mini" style={{fontSize: '1.1rem'}}>Сабақ</span>
                            </div>
                          )}
                          {hasTest && (
                            <div className="event-indicator event-test">
                              <span className="event-dot"></span>
                              <span className="event-title-mini" style={{fontSize: '1.1rem'}}>Тест</span>
                            </div>
                          )}
                          {hasAssignment && (
                            <div className="event-indicator event-assignment">
                              <span className="event-dot"></span>
                              <span className="event-title-mini" style={{fontSize: '1.1rem'}}>Тапсырма</span>
                            </div>
                          )}
                          {hasOther && (
                            <div className="event-indicator event-other">
                              <span className="event-dot"></span>
                              <span className="event-title-mini">Басқа</span>
                            </div>
                          )}
                          {dayEvents.length > 2 && (
                            <div className="more-events">+{dayEvents.length - 2}</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {selectedDate && (
          <div className="day-details">
            <div className="day-details-header">
              <h3>
                {new Intl.DateTimeFormat('kk-KZ', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric',
                  weekday: 'long'
                }).format(selectedDate)}
              </h3>
              
              {user?.role === 'teacher' && (
                <button 
                  className="add-event-button"
                  onClick={() => setShowEventForm(!showEventForm)}
                >
                  {showEventForm ? 'Болдырмау' : 'Жаңа оқиға қосу'}
                </button>
              )}
            </div>
            
            {showEventForm && (
              <form className="event-form" onSubmit={handleNewEventSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="title">Тақырыбы</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={newEvent.title}
                      onChange={handleNewEventChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="type">Түрі</label>
                    <select
                      id="type"
                      name="type"
                      value={newEvent.type}
                      onChange={handleNewEventChange}
                    >
                      <option value="assignment">Тапсырма</option>
                      <option value="test">Тест</option>
                      <option value="lesson">Сабақ</option>
                      <option value="other">Басқа</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="time">Уақыты</label>
                    <input
                      type="time"
                      id="time"
                      name="time"
                      value={newEvent.time}
                      onChange={handleNewEventChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Сипаттама</label>
                  <textarea
                    id="description"
                    name="description"
                    value={newEvent.description}
                    onChange={handleNewEventChange}
                    rows={3}
                  ></textarea>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="cancel-button" onClick={() => setShowEventForm(false)}>
                    Болдырмау
                  </button>
                  <button type="submit" className="save-button">
                    Сақтау
                  </button>
                </div>
              </form>
            )}
            
            <div className="events-list">
              {getDayEvents(selectedDate.getDate()).length > 0 ? (
                getDayEvents(selectedDate.getDate()).map((event, index) => (
                  <div key={index} className={`event-card ${getEventTypeClass(event.type)}`}>
                    <div className="event-time">{event.time}</div>
                    <div className="event-content">
                      <div className="event-title">
                        <span className="event-icon">{getEventTypeIcon(event.type)}</span>
                        {event.title}
                      </div>
                      <div className="event-description">{event.description}</div>
                    </div>
                    {user?.role === 'teacher' && (
                      <button className="delete-event">×</button>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-events">
                  <p>Бұл күнге жоспарланған оқиғалар жоқ</p>
                  {user?.role === 'teacher' && !showEventForm && (
                    <button 
                      className="add-event-inline"
                      onClick={() => setShowEventForm(true)}
                    >
                      + Жаңа оқиға қосу
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;