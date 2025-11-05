import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null); // <-- NEW

  const login = (newAccessToken) => {
    setAccessToken(newAccessToken);
    // We'll fetch the user data *after* login
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
    setCsrfToken(null);
  };

  // New function to update tokens
  const setAccessTokenAndCsrf = (newAccessToken, newCsrfToken) => {
    setAccessToken(newAccessToken);
    setCsrfToken(newCsrfToken);
  };

  const value = {
    accessToken,
    setAccessToken: setAccessTokenAndCsrf, // <-- Point to new function
    user,
    setUser,
    csrfToken,
    setCsrfToken, // <-- NEW
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};