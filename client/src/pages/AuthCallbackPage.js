import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <-- 1. Import useAuth

const AuthCallbackPage = () => {
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth(); // <-- 2. Get the login function from context

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // --- 1. Get code and *state* from the URL ---
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const state = params.get('state'); // <-- NEW

        // --- 2. Get verifier and *state* from storage ---
        const verifier = localStorage.getItem('pkce_code_verifier');
        const savedState = sessionStorage.getItem('oauth_state'); // <-- NEW

        // --- 3. Clean up storage *immediately* ---
        localStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('oauth_state');

        // --- 4. VALIDATE THE STATE (CRITICAL!) ---
        if (!state || !savedState || state !== savedState) {
          throw new Error('Invalid state. Login CSRF attack suspected.');
        }
        // --- END VALIDATION ---

        if (!code) {
          throw new Error('No authorization code provided.');
        }
        if (!verifier) {
          throw new Error('No PKCE verifier found.');
        }

        // --- 5. Send to backend (this part is the same) ---
        const res = await fetch('http://localhost:5000/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: code, verifier: verifier }),
          credentials: 'include'
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Login failed on server.');
        }

        // --- 3. THIS IS THE NEW PART ---
        const data = await res.json();
        
        // Call the context 'login' function with the new token
        login(data.accessToken); 
        // --- END NEW PART ---

        // --- 6. Login was successful! ---
        navigate('/profile');

      } catch (err) {
        console.error(err);
        setError(err.message);
        // Clean up just in case
        localStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('oauth_state');
      }
    };

    // We only want this to run *once*
    // This check prevents the double-run from React.StrictMode
    if (!location.search.includes('processed')) {
      handleAuthCallback();
      // Add a dummy param to prevent re-run
      navigate(location.pathname + location.search + '&processed=true', { replace: true });
    }

  }, [location, navigate]);

  // ... (your JSX is the same)
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