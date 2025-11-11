import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

// --- 1. Import MUI Components ---
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  CircularProgress, 
  Alert,
  Divider
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';

const ProfilePage = () => {
  const { user, setUser, setCsrfToken, csrfToken, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();

  useEffect(() => {
    let isMounted = true; 
    const fetchUserData = async () => {
      try {
        const res = await axiosPrivate.get('/api/user/me');
        if (isMounted) {
          setUser(res.data); 
          setCsrfToken(res.data.csrfToken);
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
        logout(); 
        navigate('/'); 
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (!user) {
      fetchUserData();
    } else {
      setLoading(false);
    }

    return () => { isMounted = false; };
  }, [user, setUser, setCsrfToken, logout, navigate, axiosPrivate]);

  const handleLogout = async () => {
    try {
      await axiosPrivate.post('/auth/logout', 
        {},
        { headers: { 'CSRF-Token': csrfToken } }
      );
      logout();
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Failed to log out.');
    }
  };

  // --- 2. Render Logic with MUI ---
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Error: {error}</Alert>;
  }

  if (user) {
    return (
      <Card sx={{ maxWidth: 500, margin: 'auto', mt: 4 }}>
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom>
            Welcome, {user.name}!
          </Typography>
          <Typography sx={{ mb: 1.5 }} color="text.secondary">
            {user.email}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ mr: 1 }}>
              Your Role:
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {user.role}
            </Typography>
          </Box>
        </CardContent>
        <CardActions sx={{ padding: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          {/* Account Settings Button */}
          <Button
            variant="outlined"
            color="primary"
            startIcon={<SettingsIcon />}
            component={RouterLink}
            to="/settings"
            fullWidth
          >
            Account Settings
          </Button>

          {/* Admin Tools Button */}
          {user.role === 'admin' && (
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<AdminPanelSettingsIcon />}
              component={RouterLink}
              to="/admin"
              fullWidth
            >
              Admin Dashboard
            </Button>
          )}

          {/* Logout Button */}
          <Button 
            variant="contained" 
            color="error" 
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            fullWidth
          >
            Logout
          </Button>
        </CardActions>
      </Card>
    );
  }

  return <p>Please log in.</p>;
};

export default ProfilePage;