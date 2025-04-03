import React from 'react';
import { Todo as TodoType } from '../services/supabase';

interface TodoProps {
  todo: TodoType;
  onToggle: (id: number) => void;
  onToggleRecurring: (id: number) => void;
  onDelete: (id: number) => void;
}

export const Todo: React.FC<TodoProps> = ({ todo, onToggle, onToggleRecurring, onDelete }) => {
  return (
    <div className="todo-item">
      <input
        type="checkbox"
        className="todo-checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span className={`todo-title ${todo.completed ? 'completed' : ''}`}>
        {todo.title}
      </span>
      <div className="todo-actions">
        <button
          className={`recurring-button ${todo.recurring ? 'active' : ''}`}
          onClick={() => onToggleRecurring(todo.id)}
          title={todo.recurring ? "Remove from recurring" : "Make recurring"}
        >
          {todo.recurring ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          )}
        </button>
        <button
          className="delete-button"
          onClick={() => onDelete(todo.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}; 