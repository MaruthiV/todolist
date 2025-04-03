import React, { useState, useEffect } from 'react';
import { supabase, Todo as TodoType } from '../services/supabase';
import { Todo } from './Todo';
import { Calendar } from './Calendar';
import { useAuth } from '../contexts/AuthContext';
import { useMidnightReset } from '../hooks/useMidnightReset';

type ViewMode = 'list' | 'calendar';

export const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<TodoType[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [error, setError] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  
  // Initialize midnight reset hook
  useMidnightReset();

  useEffect(() => {
    if (user) {
      console.log('User authenticated, fetching todos...');
      fetchTodos();
      setupRealtimeSubscription();
    }

    // Cleanup subscription on unmount
    return () => {
      if (user) {
        cleanupSubscription();
      }
    };
  }, [user]);

  const setupRealtimeSubscription = () => {
    if (!user) return;

    console.log('Setting up real-time subscription...');
    // Subscribe to changes in the todos table
    const subscription = supabase
      .channel('todos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Change received!', payload);
          handleRealtimeChange(payload);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Store subscription for cleanup
    return subscription;
  };

  const cleanupSubscription = () => {
    console.log('Cleaning up subscription...');
    supabase.channel('todos_changes').unsubscribe();
  };

  const handleRealtimeChange = (payload: any) => {
    console.log('Handling real-time change:', payload);
    switch (payload.eventType) {
      case 'INSERT':
        setTodos(current => [...current, payload.new]);
        break;
      case 'UPDATE':
        setTodos(current =>
          current.map(todo =>
            todo.id === payload.new.id ? payload.new : todo
          )
        );
        break;
      case 'DELETE':
        setTodos(current =>
          current.filter(todo => todo.id !== payload.old.id)
        );
        break;
    }
  };

  const fetchTodos = async () => {
    if (!user) return;

    try {
      console.log('Fetching todos for user:', user.id);
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching todos:', error);
        setError(error.message);
      } else {
        console.log('Fetched todos:', data);
        setTodos(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching todos:', err);
      setError('An unexpected error occurred');
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim() || !user) return;

    try {
      console.log('Adding new todo:', newTodoTitle);
      const { data, error } = await supabase
        .from('todos')
        .insert([
          {
            title: newTodoTitle.trim(),
            completed: false,
            recurring: true,
            user_id: user.id as string,
          },
        ])
        .select();

      if (error) {
        console.error('Error adding todo:', error);
        setError(error.message);
      } else if (data) {
        console.log('Todo added successfully:', data);
        setTodos(current => [...current, data[0]]);
        setNewTodoTitle('');
      }
    } catch (err) {
      console.error('Unexpected error adding todo:', err);
      setError('An unexpected error occurred');
    }
  };

  const toggleTodo = async (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      console.log('Toggling todo:', id);
      const { error } = await supabase
        .from('todos')
        .update({ completed: !todo.completed })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error toggling todo:', error);
        setError(error.message);
      } else {
        setTodos(current =>
          current.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
          )
        );
      }
    } catch (err) {
      console.error('Unexpected error toggling todo:', err);
      setError('An unexpected error occurred');
    }
  };

  const toggleRecurring = async (id: number, recurring: boolean) => {
    try {
      console.log('Toggling recurring for todo:', id);
      const { error } = await supabase
        .from('todos')
        .update({ recurring })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error toggling recurring:', error);
        setError(error.message);
      } else {
        setTodos(current =>
          current.map(t =>
            t.id === id ? { ...t, recurring } : t
          )
        );
      }
    } catch (err) {
      console.error('Unexpected error toggling recurring:', err);
      setError('An unexpected error occurred');
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      console.log('Deleting todo:', id);
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error deleting todo:', error);
        setError(error.message);
      } else {
        setTodos(current => current.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('Unexpected error deleting todo:', err);
      setError('An unexpected error occurred');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="todo-list">
      <div className="todo-header">
        <h2>Your Todos</h2>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={`view-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              className={`view-toggle-button ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </button>
          </div>
          <button onClick={signOut} className="sign-out-button">
            Sign Out
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {viewMode === 'list' ? (
        <>
          <form onSubmit={addTodo} className="add-todo-form">
            <input
              type="text"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              placeholder="Add a new todo"
              className="add-todo-input"
            />
            <button type="submit" className="add-todo-button">
              Add Todo
            </button>
          </form>

          <div className="todos-container">
            {todos.map(todo => (
              <Todo
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onToggleRecurring={(id) => toggleRecurring(id, !todo.recurring)}
              />
            ))}
          </div>
        </>
      ) : (
        <Calendar />
      )}
    </div>
  );
}; 