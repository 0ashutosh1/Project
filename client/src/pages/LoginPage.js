import React from 'react';
import { createPkceChallenge, generateState, generateNonce } from '../pkceHelper';

// --- 1. Import MUI components ---
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import FacebookIcon from '@mui/icons-material/Facebook'; // <-- 1. IMPORT FB ICON

const LoginPage = () => {
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const GITHUB_CLIENT_ID = process.env.REACT_APP_GITHUB_CLIENT_ID;
  const FACEBOOK_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID;
  const REDIRECT_URI = 'http://localhost:3000/auth/callback';

  // --- 2. Google Login Handler (Unchanged) ---
  const handleGoogleLogin = async () => {
    try {
      const { verifier, challenge } = await createPkceChallenge();
      const state = generateState();
      const nonce = generateNonce();

      localStorage.setItem('pkce_code_verifier', verifier);
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_nonce', nonce);
      sessionStorage.setItem('oauth_provider', 'google'); // <-- Set provider

      const SCOPE = 'profile email';
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(SCOPE)}` +
        `&code_challenge=${challenge}` +
        `&code_challenge_method=S256` +
        `&state=${state}` +
        `&nonce=${nonce}` +
        `&access_type=offline` +
        `&prompt=consent`;
      window.location.href = authUrl;
    } catch (err) {
      console.error('Error during Google login', err);
    }
  };

  // --- 3. GitHub Login Handler (Unchanged) ---
  const handleGitHubLogin = async () => {
    try {
      const state = generateState();
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_provider', 'github'); // <-- Set provider

      const SCOPE = 'read:user user:email';
      const authUrl = `https://github.com/login/oauth/authorize?` +
        `client_id=${GITHUB_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPE)}` +
        `&state=${state}`;
      
      window.location.href = authUrl;
    } catch (err) {
      console.error('Error during GitHub login', err);
    }
  };

  // --- 4. Facebook Login Handler ---
  const handleFacebookLogin = async () => {
    try {
      const state = generateState();
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_provider', 'facebook');

      const SCOPE = 'email public_profile';
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${FACEBOOK_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPE)}` +
        `&state=${state}` +
        `&response_type=code`;
      
      window.location.href = authUrl;
    } catch (err) {
      console.error('Error during Facebook login', err);
    }
  };

  // --- 5. Update JSX to match the screenshot ---
  return (
    <Container 
      component="main" 
      maxWidth="xs" 
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start', // Aligns to the top
        mt: 8, // Margin-top to push it down
      }}
    >
      <Paper 
        elevation={3} // The shadow effect
        sx={{
          padding: 4, // 32px padding
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center', // Center text and items
          width: '100%',
          borderRadius: 2, // Softer corners
          backgroundColor: '#ffffff', // Explicitly white
        }}
      >
        <Typography component="h1" variant="h5" sx={{ fontWeight: 600, color: '#000' }}>
          OAuth2.0 Login
        </Typography>
        <Typography component="p" variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Sign in to continue
        </Typography>

        <Box sx={{ mt: 3, width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Google Button */}
          <Button
            fullWidth
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            sx={{
              textTransform: 'uppercase', // Match screenshot
              fontWeight: 600,
              padding: '10px',
              backgroundColor: '#1976D2', // MUI default blue
            }}
          >
            Continue with Google
          </Button>

          {/* GitHub Button */}
          <Button
            fullWidth
            variant="contained"
            startIcon={<GitHubIcon />}
            onClick={handleGitHubLogin}
            sx={{ 
              textTransform: 'uppercase', // Match screenshot
              fontWeight: 600,
              padding: '10px',
              backgroundColor: '#333', // GitHub black
              color: '#fff',
              '&:hover': {
                backgroundColor: '#555',
              }
            }}
          >
            Continue with GitHub
          </Button>
          
          {/* Facebook Button */}
          <Button
            fullWidth
            variant="contained"
            startIcon={<FacebookIcon />}
            onClick={handleFacebookLogin}
            sx={{
              textTransform: 'uppercase',
              fontWeight: 600,
              padding: '10px',
              backgroundColor: '#1877F2',
              '&:hover': {
                backgroundColor: '#166eeb',
              }
            }}
          >
            Continue with Facebook
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;