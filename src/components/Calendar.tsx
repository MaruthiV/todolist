import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Calendar.css';

interface CompletionData {
  date: string;
  completed_count: number;
  total_count: number;
}

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [completionData, setCompletionData] = useState<CompletionData[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCompletionData();
      setupRealtimeSubscription();
    }

    // Cleanup subscription on unmount
    return () => {
      if (user) {
        cleanupSubscription();
      }
    };
  }, [user, currentDate]);

  const setupRealtimeSubscription = () => {
    if (!user) return;

    // Subscribe to changes in the todo_completions table
    const subscription = supabase
      .channel('completions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todo_completions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Completion change received!', payload);
          handleRealtimeChange(payload);
        }
      )
      .subscribe();

    // Store subscription for cleanup
    return subscription;
  };

  const cleanupSubscription = () => {
    supabase.channel('completions_changes').unsubscribe();
  };

  const handleRealtimeChange = (payload: any) => {
    switch (payload.eventType) {
      case 'INSERT':
        setCompletionData(current => [...current, payload.new]);
        break;
      case 'UPDATE':
        setCompletionData(current =>
          current.map(data =>
            data.date === payload.new.date ? payload.new : data
          )
        );
        break;
      case 'DELETE':
        setCompletionData(current =>
          current.filter(data => data.date !== payload.old.date)
        );
        break;
    }
  };

  const fetchCompletionData = async () => {
    if (!user) return;

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('todo_completions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startOfMonth.toISOString())
      .lte('date', endOfMonth.toISOString());

    if (error) {
      console.error('Error fetching completion data:', error);
      return;
    }

    // Group data by date
    const groupedData = data.reduce((acc: { [key: string]: CompletionData }, curr) => {
      const date = curr.date.split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          completed_count: 0,
          total_count: 0,
        };
      }
      acc[date].completed_count += curr.completed_count;
      acc[date].total_count += curr.total_count;
      return acc;
    }, {});

    setCompletionData(Object.values(groupedData));
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getCompletionRate = (date: string) => {
    const data = completionData.find(d => d.date === date);
    if (!data) return 0;
    return data.total_count > 0 ? (data.completed_count / data.total_count) * 100 : 0;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateString = date.toISOString().split('T')[0];
      const completionRate = getCompletionRate(dateString);

      days.push(
        <div key={day} className="calendar-day">
          <span className="day-number">{day}</span>
          <div 
            className="completion-bar"
            style={{ 
              height: `${completionRate}%`,
              backgroundColor: completionRate === 0 ? '#e9ecef' : 
                             completionRate < 50 ? '#ffc107' : 
                             completionRate < 100 ? '#17a2b8' : '#28a745'
            }}
          />
        </div>
      );
    }

    return days;
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button onClick={previousMonth}>&lt;</button>
        <h2>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        <button onClick={nextMonth}>&gt;</button>
      </div>
      <div className="calendar-weekdays">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>
      <div className="calendar-grid">
        {renderCalendarDays()}
      </div>
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#e9ecef' }}></div>
          <span>No todos</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ffc107' }}></div>
          <span>0-50%</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#17a2b8' }}></div>
          <span>51-99%</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#28a745' }}></div>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}; 