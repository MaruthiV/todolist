import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { resetRecurringTodos } from '../services/supabase';

export const useMidnightReset = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkAndReset = async () => {
      const now = new Date();
      const lastReset = localStorage.getItem(`lastReset_${user.id}`);
      
      if (!lastReset) {
        // First time running, set last reset to today
        localStorage.setItem(`lastReset_${user.id}`, now.toDateString());
        return;
      }

      const lastResetDate = new Date(lastReset);
      const isNewDay = now.getDate() !== lastResetDate.getDate() ||
                      now.getMonth() !== lastResetDate.getMonth() ||
                      now.getFullYear() !== lastResetDate.getFullYear();

      if (isNewDay) {
        try {
          await resetRecurringTodos(user.id);
          localStorage.setItem(`lastReset_${user.id}`, now.toDateString());
        } catch (error) {
          console.error('Failed to reset recurring todos:', error);
        }
      }
    };

    // Check immediately
    checkAndReset();

    // Set up interval to check every minute
    const interval = setInterval(checkAndReset, 60000);

    return () => clearInterval(interval);
  }, [user]);
}; 