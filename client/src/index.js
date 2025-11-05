import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext'; // <-- 1. Import

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // We'll put StrictMode back in later if we want
  <AuthProvider> {/* <-- 2. Wrap your App */}
    <App />
  </AuthProvider>
);