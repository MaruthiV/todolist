import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Todo = {
  id: number;
  user_id: string;
  title: string;
  completed: boolean;
  recurring: boolean;
  created_at: string;
  updated_at: string;
};

export const resetRecurringTodos = async (userId: string) => {
  const { error } = await supabase
    .from('todos')
    .update({ completed: false })
    .eq('user_id', userId)
    .eq('recurring', true);

  if (error) {
    console.error('Error resetting recurring todos:', error);
    throw error;
  }
}; 