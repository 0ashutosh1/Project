import React from 'react';
import { createPkceChallenge } from '../pkceHelper'; // <-- 1. Import helper

const LoginPage = () => {
  const handleGoogleLogin = async () => {
    try {
      // --- 2. Generate PKCE codes ---
      const { verifier, challenge } = await createPkceChallenge();

      // --- 3. Save the verifier in localStorage ---
      localStorage.setItem('pkce_code_verifier', verifier);

      // --- 4. Define Google OAuth 2.0 parameters ---
      const GOOGLE_CLIENT_ID = '432021855969-2fpjhp4j51hto3lkeutbf580mdhn4pv0.apps.googleusercontent.com'; // <-- PASTE YOUR CLIENT ID HERE
      
      // IMPORTANT: This redirect_uri must be *exactly* what's in your
      // Google Console, and it points to a *new client-side page*
      const REDIRECT_URI = 'http://localhost:3000/auth/callback';
      
      const SCOPE = 'profile email';
      
      // --- 5. Manually build the authorization URL ---
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(SCOPE)}` +
        `&code_challenge=${challenge}` +
        `&code_challenge_method=S256` +
        `&access_type=offline` +
        `&prompt=consent`; // 'consent' makes it show the login screen every time (good for testing)

      // --- 6. Redirect the user ---
      window.location.href = authUrl;

    } catch (err) {
      console.error('Error during Google login', err);
    }
  };

  return (
    <div>
      <h2>Login to Nimbus (PKCE Flow)</h2>
      <button onClick={handleGoogleLogin}>
        Continue with Google
      </button>
    </div>
  );
};

export default LoginPage;