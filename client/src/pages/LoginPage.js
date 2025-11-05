import React from 'react';
// --- 1. Import generateState ---
import { createPkceChallenge, generateState, generateNonce } from '../pkceHelper';

const LoginPage = () => {
  const handleGoogleLogin = async () => {
    try {
      // --- 2. Generate both PKCE and state ---
      const { verifier, challenge } = await createPkceChallenge();
      const state = generateState(); 
      const nonce = generateNonce(); 

      // --- 3. Save *both* to storage ---
      // Use sessionStorage so it's cleared when the browser tab closes
      localStorage.setItem('pkce_code_verifier', verifier);
      sessionStorage.setItem('oauth_state', state); 
      sessionStorage.setItem('oauth_nonce', nonce);

      // --- 4. Define Google OAuth 2.0 parameters ---
      const GOOGLE_CLIENT_ID = '432021855969-2fpjhp4j51hto3lkeutbf580mdhn4pv0.apps.googleusercontent.com';
      const REDIRECT_URI = 'http://localhost:3000/auth/callback';
      const SCOPE = 'profile email';

      // --- 5. Manually build the authorization URL (add state) ---
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