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
  Typography, 
  CircularProgress, 
  Alert,
  Avatar,
  Chip,
  Paper,
  Grid,
  Container
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

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
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {/* Hero Section with Gradient Background */}
        <Paper
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 4,
            borderRadius: 3,
            mb: 3,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
              <Avatar
                src={user.avatar}
                alt={user.name}
                sx={{
                  width: 100,
                  height: 100,
                  border: '4px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                }}
              >
                <PersonIcon sx={{ fontSize: 60 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="700" gutterBottom>
                  Welcome back, {user.name}!
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <EmailIcon sx={{ fontSize: 20 }} />
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    {user.email}
                  </Typography>
                </Box>
                <Chip
                  icon={user.role === 'admin' ? <VerifiedUserIcon /> : <PersonIcon />}
                  label={user.role.toUpperCase()}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: '600',
                    backdropFilter: 'blur(10px)'
                  }}
                />
              </Box>
            </Box>
          </Box>
          
          {/* Decorative circles */}
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.1)',
              zIndex: 0
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -30,
              right: 100,
              width: 150,
              height: 150,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.05)',
              zIndex: 0
            }}
          />
        </Paper>

        {/* Account Information Card */}
        <Card elevation={3} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <VerifiedUserIcon sx={{ mr: 1, color: 'secondary.main' }} />
              <Typography variant="h6" fontWeight="600">
                Account Status
              </Typography>
            </Box>
            <Typography variant="h5" color="secondary" fontWeight="700">
              Active
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-US') : 'Just now'}
            </Typography>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SettingsIcon />}
                  component={RouterLink}
                  to="/settings"
                  fullWidth
                  size="large"
                  sx={{
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                  }}
                >
                  Account Settings
                </Button>
              </Grid>

              {user.role === 'admin' && (
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AdminPanelSettingsIcon />}
                    component={RouterLink}
                    to="/admin"
                    fullWidth
                    size="large"
                    sx={{
                      py: 1.5,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(156, 39, 176, 0.4)'
                    }}
                  >
                    Admin Dashboard
                  </Button>
                </Grid>
              )}

              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  fullWidth
                  size="large"
                  sx={{
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: '600',
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      bgcolor: 'error.main',
                      color: 'white'
                    }
                  }}
                >
                  Logout
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return <p>Please log in.</p>;
};

export default ProfilePage;