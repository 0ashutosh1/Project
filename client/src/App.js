import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Import our pages
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage'; // <-- 1. IMPORT THE NEW PAGE

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <nav>
          <ul>
            <li><Link to="/">Home (Login)</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            {/* We'll add a conditional admin link on the profile page */}
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} /> {/* <-- 2. ADD THE NEW ROUTE */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;