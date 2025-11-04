import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthCallbackPage = () => {
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // This effect runs once when the page loads
    const handleAuthCallback = async () => {
      try {
        // --- 1. Get the 'code' from the URL (e.g., ?code=...&scope=...) ---
        const params = new URLSearchParams(location.search);
        const code = params.get('code');

        // --- 2. Get the 'verifier' from localStorage ---
        const verifier = localStorage.getItem('pkce_code_verifier');

        if (!code) {
          throw new Error('No authorization code provided.');
        }
        if (!verifier) {
          throw new Error('No PKCE verifier found.');
        }

        // --- 3. Send both to our *new* backend endpoint ---
        // We will create this 'POST /auth/google' endpoint next
        const res = await fetch('http://localhost:5000/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: code, verifier: verifier }),
          credentials: 'include' // IMPORTANT: This sends/receives cookies
        });

        // --- 4. Clean up the verifier ---
        localStorage.removeItem('pkce_code_verifier');

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Login failed on server.');
        }

        // --- 5. Login was successful! Server set the cookie. ---
        // Redirect to the profile page
        navigate('/profile');

      } catch (err) {
        console.error(err);
        setError(err.message);
        localStorage.removeItem('pkce_code_verifier'); // Clean up on error
      }
    };

    handleAuthCallback();

  }, [location, navigate]); // Dependencies for the useEffect hook

  // --- Render logic ---
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