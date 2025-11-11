import React from 'react';
import { BrowserRouter, Routes, Route, Link as RouterLink } from 'react-router-dom';

// --- 1. Import MUI Components ---
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import { useAuth } from './context/AuthContext'; // To conditionally show links

// --- Import Pages & Components ---
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { accessToken } = useAuth(); // Check if user is logged in

  return (
    <BrowserRouter>
      {/* --- 2. Add the MUI AppBar --- */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              OAuth 2.0
            </RouterLink>
          </Typography>
          
          {/* --- 3. Conditionally show links --- */}
          {accessToken ? (
            <>
              <Button color="inherit" component={RouterLink} to="/profile">
                Profile
              </Button>
              {/* We'll add the Admin link back in the ProfilePage */}
            </>
          ) : (
            <Button color="inherit" component={RouterLink} to="/">
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* --- 4. Add a main content container --- */}
      <Container component="main" sx={{ mt: 4, mb: 4 }}>
        <Box>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* Protected Routes */}
            <Route 
              path="/profile" 
              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} 
            />
            <Route 
              path="/admin" 
              element={<ProtectedRoute><AdminPage /></ProtectedRoute>} 
            />
            <Route 
              path="/settings" 
              element={<ProtectedRoute><AccountSettingsPage /></ProtectedRoute>} 
            />
          </Routes>
        </Box>
      </Container>
    </BrowserRouter>
  );
}

export default App;