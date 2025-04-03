import { useState } from 'react';
import { TodoList } from './components/TodoList';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './styles/Todo.css';
import './styles/Auth.css';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="auth-page">
        {isRegistering ? (
          <>
            <Register />
            <p className="auth-switch">
              Already have an account?{' '}
              <button onClick={() => setIsRegistering(false)}>Login</button>
            </p>
          </>
        ) : (
          <>
            <Login />
            <p className="auth-switch">
              Don't have an account?{' '}
              <button onClick={() => setIsRegistering(true)}>Register</button>
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Daily Todo List</h1>
      </header>
      <main>
        <TodoList />
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
