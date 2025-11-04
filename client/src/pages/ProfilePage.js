import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- 1. Import useNavigate

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // <-- 2. Initialize the hook

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/user/me', {
          method: 'GET',
          credentials: 'include' 
        });

        if (!res.ok) {
          throw new Error('Not authorized. Please log in again.');
        }

        const data = await res.json();
        setUser(data); 
        
      } catch (err) {
        console.error(err);
        setError(err.message);
        // If we're not authorized, automatically redirect to login
        navigate('/'); 
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]); // <-- 3. Add navigate as a dependency

  // --- 4. Create the new logout function ---
  const handleLogout = async () => {
    try {
      const res = await fetch('http://localhost:5000/auth/logout', {
        method: 'POST',
        credentials: 'include' // Must send cookies to clear them
      });

      if (res.ok) {
        // If logout was successful, redirect to login page
        navigate('/');
      } else {
        throw new Error('Logout failed');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to log out.');
    }
  };

  // --- (Render logic) ---
  if (loading) {
    return <p>Loading your information...</p>;
  }

  if (error) {
    // We don't need to show an error, we'll just be redirected
    return null;
  }

  if (user) {
    return (
      <div>
        <h2>Welcome, {user.name}!</h2>
        <p>You are logged in with the email: {user.email}</p>
        <p>(This information came from your secure backend!)</p>
        
        {/* --- 5. Add the logout button --- */}
        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    );
  }

  return null; // We'll be redirected if no user/error
};

export default ProfilePage;