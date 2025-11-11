import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Avatar
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { useAuth } from '../context/AuthContext';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { generateState, generateNonce, createPkceChallenge } from '../pkceHelper';

const AccountSettingsPage = () => {
  const [providers, setProviders] = useState({
    google: false,
    github: false,
    facebook: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { user } = useAuth();
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const GITHUB_CLIENT_ID = process.env.REACT_APP_GITHUB_CLIENT_ID;
  const FACEBOOK_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID;
  const REDIRECT_URI = 'http://localhost:3000/auth/callback';

  useEffect(() => {
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await axiosPrivate.get('/api/user/providers');
      setProviders(response.data.providers);
      setError(null);
    } catch (err) {
      console.error('Error fetching providers:', err);
      setError('Failed to load account information');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkProvider = async (provider) => {
    try {
      const state = generateState();
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_provider', provider);
      sessionStorage.setItem('oauth_action', 'link'); // Indicate this is a linking action

      let authUrl;

      if (provider === 'google') {
        const { verifier, challenge } = await createPkceChallenge();
        const nonce = generateNonce();
        localStorage.setItem('pkce_code_verifier', verifier);
        sessionStorage.setItem('oauth_nonce', nonce);

        const SCOPE = 'profile email';
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${GOOGLE_CLIENT_ID}` +
          `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
          `&response_type=code` +
          `&scope=${encodeURIComponent(SCOPE)}` +
          `&code_challenge=${challenge}` +
          `&code_challenge_method=S256` +
          `&state=${state}` +
          `&nonce=${nonce}`;
      } else if (provider === 'github') {
        const SCOPE = 'read:user user:email';
        authUrl = `https://github.com/login/oauth/authorize?` +
          `client_id=${GITHUB_CLIENT_ID}` +
          `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
          `&scope=${encodeURIComponent(SCOPE)}` +
          `&state=${state}`;
      } else if (provider === 'facebook') {
        const SCOPE = 'email public_profile';
        authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
          `client_id=${FACEBOOK_APP_ID}` +
          `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
          `&scope=${encodeURIComponent(SCOPE)}` +
          `&state=${state}` +
          `&response_type=code`;
      }

      window.location.href = authUrl;
    } catch (err) {
      console.error('Error initiating provider link:', err);
      setError(`Failed to link ${provider} account`);
    }
  };

  const handleUnlinkProvider = async (provider) => {
    if (!window.confirm(`Are you sure you want to unlink your ${provider} account?`)) {
      return;
    }

    try {
      await axiosPrivate.delete(`/api/user/unlink/${provider}`);
      setSuccess(`${provider} account unlinked successfully`);
      fetchProviders();
    } catch (err) {
      console.error('Error unlinking provider:', err);
      setError(err.response?.data?.message || `Failed to unlink ${provider} account`);
    }
  };

  const providerConfig = {
    google: {
      name: 'Google',
      icon: <GoogleIcon sx={{ fontSize: 40 }} />,
      color: '#4285F4'
    },
    github: {
      name: 'GitHub',
      icon: <GitHubIcon sx={{ fontSize: 40 }} />,
      color: '#333'
    },
    facebook: {
      name: 'Facebook',
      icon: <FacebookIcon sx={{ fontSize: 40 }} />,
      color: '#1877F2'
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Account Settings
        </Typography>
        
        <Divider sx={{ my: 3 }} />

        {/* User Profile Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Profile Information
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
            <Avatar 
              src={user?.avatar} 
              alt={user?.name}
              sx={{ width: 80, height: 80 }}
            />
            <Box>
              <Typography variant="h6">{user?.name}</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
              <Chip 
                label={user?.role?.toUpperCase()} 
                size="small" 
                color={user?.role === 'admin' ? 'error' : 'primary'} 
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Linked Accounts Section */}
        <Typography variant="h6" gutterBottom>
          Linked Accounts
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Connect or disconnect your social accounts to log in
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Object.entries(providerConfig).map(([key, config]) => (
            <Card key={key} variant="outlined">
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ color: config.color }}>
                  {config.icon}
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">{config.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {providers[key] ? 'Connected' : 'Not connected'}
                  </Typography>
                </Box>
                {providers[key] ? (
                  <Chip label="Linked" color="success" icon={<LinkIcon />} />
                ) : (
                  <Chip label="Not Linked" variant="outlined" />
                )}
              </CardContent>
              <CardActions>
                {providers[key] ? (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<LinkOffIcon />}
                    onClick={() => handleUnlinkProvider(key)}
                  >
                    Unlink
                  </Button>
                ) : (
                  <Button
                    size="small"
                    color="primary"
                    startIcon={<LinkIcon />}
                    onClick={() => handleLinkProvider(key)}
                  >
                    Link Account
                  </Button>
                )}
              </CardActions>
            </Card>
          ))}
        </Box>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button variant="outlined" onClick={() => navigate('/profile')}>
            Back to Profile
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AccountSettingsPage;
