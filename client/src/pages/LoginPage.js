import React from 'react';

const LoginPage = () => {
  // This is the function that will call our backend
  const handleGoogleLogin = () => {
    // This URL is the one we created in our server's index.js
    window.location.href = 'http://localhost:5000/auth/google';
  };

  return (
    <div>
      <h2>Login to Project</h2>
      <button onClick={handleGoogleLogin}>
        Continue with Google
      </button>
    </div>
  );
};

export default LoginPage;