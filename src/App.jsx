import { useState, useEffect } from 'react';
import './App.css';
import CateringInvoiceGenerator from './InvoiceGenerator';
import LoginPage from './LoginPage';

function App() {
  const [authState, setAuthState] = useState('checking');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Create an abort controller with a manual timeout fallback
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch('/api/auth/me', {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((res) => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then((data) => {
        setUserEmail(data.email);
        setAuthState('authenticated');
      })
      .catch(() => {
        clearTimeout(timeoutId);
        setAuthState('unauthenticated');
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const handleLogin = (email) => {
    setUserEmail(email);
    setAuthState('authenticated');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // Ignore network errors on logout
    }
    setUserEmail('');
    setAuthState('unauthenticated');
  };

  // Loading state — light background matching the app theme
  if (authState === 'checking') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 36,
            height: 36,
            border: '3px solid #e2e8f0',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto',
          }} />
          <p style={{
            color: '#94a3b8',
            fontSize: 14,
            marginTop: 14,
            fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
          }}>
            Checking session...
          </p>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <CateringInvoiceGenerator userEmail={userEmail} onLogout={handleLogout} />;
}

export default App;
