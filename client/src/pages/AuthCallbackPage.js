import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallbackPage = () => {
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // ... (All your existing logic for params, state, verifier is the same)
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const state = params.get('state');
        const verifier = localStorage.getItem('pkce_code_verifier');
        const savedState = sessionStorage.getItem('oauth_state');
        const savedNonce = sessionStorage.getItem('oauth_nonce');
        
        // Clear storage *after* validation
        if (!state || !savedState || state !== savedState) {
          localStorage.removeItem('pkce_code_verifier');
          sessionStorage.removeItem('oauth_state');
          sessionStorage.removeItem('oauth_nonce');
          throw new Error('Invalid state. Login CSRF attack suspected.');
        }

        // Now we can clear them
        localStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('oauth_state');
        
        if (!code || !verifier) {
          throw new Error('Missing code or verifier.');
        }

        const res = await fetch('http://localhost:5000/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code, verifier: verifier, nonce: savedNonce }),
          credentials: 'include'
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Login failed on server.');
        }

        const data = await res.json();
        login(data.accessToken); 
        
        // --- THIS IS THE NEW PART ---
        
        // 1. Check if we saved a location *before* logging in
        const targetLocation = sessionStorage.getItem('preLoginLocation');
        
        // 2. Clear that item so we don't use it again
        sessionStorage.removeItem('preLoginLocation');

        // 3. Navigate to the target location, or default to /profile
        navigate(targetLocation || '/profile');
        
        // --- END NEW PART ---

      } catch (err) {
        console.error(err);
        setError(err.message);
        // Clean up on error
        localStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('preLoginLocation');
        sessionStorage.removeItem('oauth_nonce');
      }
    };

    if (!location.search.includes('processed')) {
      handleAuthCallback();
      // Add a dummy param to prevent re-run
      navigate(location.pathname + location.search + '&processed=true', { replace: true });
    }

  }, [location, navigate, login]);

  // ... (Your JSX render logic is the same)
  if (error) {
    return (
      <div>
        <h2>Authentication Failed</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => navigate('/')}>Go to Login</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Authenticating...</h2>
      <p>Please wait while we log you in.</p>
    </div>
  );
};

export default AuthCallbackPage;