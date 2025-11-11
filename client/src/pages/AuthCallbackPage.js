import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { axiosPublic } from '../api/axios'; // <-- Import axiosPublic
import useAxiosPrivate from '../hooks/useAxiosPrivate'; // <-- Import useAxiosPrivate
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress, 
  Box 
} from '@mui/material'; // <-- Import MUI components for error state

const AuthCallbackPage = () => {
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const axiosPrivate = useAxiosPrivate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // --- 1. Get params from URL ---
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const state = params.get('state');

        // --- 2. Get params from storage ---
        const provider = sessionStorage.getItem('oauth_provider');
        const verifier = localStorage.getItem('pkce_code_verifier');
        const savedState = sessionStorage.getItem('oauth_state');
        const savedNonce = sessionStorage.getItem('oauth_nonce');
        const action = sessionStorage.getItem('oauth_action'); // 'login' or 'link'

        // --- 3. State validation (Always do this) ---
        if (!state || !savedState || state !== savedState) {
          throw new Error('Invalid state. Login CSRF attack suspected.');
        }
        
        // --- 4. Clean up storage ---
        localStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_nonce');
        sessionStorage.removeItem('oauth_provider');
        sessionStorage.removeItem('oauth_action');

        if (!code) {
          throw new Error('No authorization code provided.');
        }

        let res;
        
        // Check if this is a linking action
        if (action === 'link') {
          // Call the link endpoint instead
          if (provider === 'google') {
            if (!verifier || !savedNonce) {
              throw new Error('Missing PKCE verifier or nonce for Google linking.');
            }
            res = await axiosPrivate.post(`/api/user/link/${provider}`, {
              code: code,
              verifier: verifier,
              nonce: savedNonce
            });
          } else {
            res = await axiosPrivate.post(`/api/user/link/${provider}`, {
              code: code
            });
          }
          // Redirect to settings page after linking
          navigate('/settings');
          return;
        }

        // --- 5. Call the correct backend route based on provider (login flow) ---
        if (provider === 'google') {
          if (!verifier || !savedNonce) {
            throw new Error('Missing PKCE verifier or nonce for Google login.');
          }
          res = await axiosPublic.post('/auth/google', {
            code: code, 
            verifier: verifier, 
            nonce: savedNonce
          });
        } else if (provider === 'github') {
          res = await axiosPublic.post('/auth/github', {
            code: code
          });
        } else if (provider === 'facebook') {
          res = await axiosPublic.post('/auth/facebook', {
            code: code
          });
        } else {
          throw new Error('Unknown authentication provider.');
        }
        // --- End Provider Logic ---

        const data = res.data;
        login(data.accessToken); 
        
        // --- Redirect-back logic (Unchanged) ---
        const targetLocation = sessionStorage.getItem('preLoginLocation');
        sessionStorage.removeItem('preLoginLocation');
        navigate(targetLocation || '/profile');
        
      } catch (err) {
        console.error(err);
        // Handle specific error from GitHub
        if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError(err.message);
        }
        // Clean up on error
        localStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_nonce');
        sessionStorage.removeItem('oauth_provider');
        sessionStorage.removeItem('oauth_action');
        sessionStorage.removeItem('preLoginLocation');
      }
    };

    if (!location.search.includes('processed')) {
      handleAuthCallback();
      navigate(location.pathname + location.search + '&processed=true', { replace: true });
    }

  }, [location, navigate, login, axiosPrivate]);

  // --- Updated JSX with MUI styles ---
  if (error) {
    return (
      <Container maxWidth="xs" sx={{ mt: 5, textAlign: 'center' }}>
        <Paper elevation={3} sx={{ padding: 3 }}>
          <Typography variant="h5" color="error">Authentication Failed</Typography>
          <Typography sx={{ mt: 2 }}>{error}</Typography>
          <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
            Go to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 5 }}>
      <CircularProgress />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Authenticating...
      </Typography>
      <Typography>Please wait while we log you in.</Typography>
    </Box>
  );
};

export default AuthCallbackPage;