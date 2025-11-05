import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { accessToken } = useAuth(); // Check if we have an access token
  const location = useLocation(); // Get the current URL location

  if (!accessToken) {
    // --- 1. User is NOT logged in ---
    
    // Save the location they were trying to go to.
    // We use 'sessionStorage' so it's temporary.
    // 'replace: true' prevents this "redirect" page from being in the browser history.
    sessionStorage.setItem('preLoginLocation', location.pathname);
    
    // Send them to the login page
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // --- 2. User IS logged in ---
  // Show the page they are allowed to see
  return children;
};

export default ProtectedRoute;