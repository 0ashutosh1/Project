import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <-- 1. Get auth context
import useAxiosPrivate from '../hooks/useAxiosPrivate'; // <-- 2. Get smart hook

const ProfilePage = () => {
  // --- 3. Get global state and functions ---
  const { user, setUser, setCsrfToken, csrfToken, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate(); // <-- 4. Initialize the hook

  useEffect(() => {
    // We'll use this to prevent a flicker on refresh
    let isMounted = true; 

    const fetchUserData = async () => {
      try {
        // --- 5. Use the smart axios instance ---
        const res = await axiosPrivate.get('/api/user/me');

        if (isMounted) {
          // --- 6. Save user and CSRF to global context ---
          setUser(res.data); 
          setCsrfToken(res.data.csrfToken);
        }
        
      } catch (err) {
        console.error(err);
        setError(err.message);
        logout(); // Log out if we can't get user data
        navigate('/'); 
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Fetch data only if we don't have a user in context yet
    if (!user) {
      fetchUserData();
    } else {
      setLoading(false);
    }

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [user, setUser, setCsrfToken, logout, navigate, axiosPrivate]); // Dependencies

  const handleLogout = async () => {
    try {
      // --- 7. Use axiosPrivate for logout ---
      await axiosPrivate.post('/auth/logout', 
        {}, // No data to send
        { // Config
          headers: {
            'CSRF-Token': csrfToken // Send the CSRF token from context
          }
        }
      );
      
      logout(); // Clear global state
      navigate('/'); // Redirect to login
      
    } catch (err) {
      console.error(err);
      alert('Failed to log out.');
    }
  };

  // --- Render Logic ---
  if (loading) {
    return <p>Loading your information...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (user) {
    return (
      <div>
        <h2>Welcome, {user.name}!</h2>
        <p>You are logged in with the email: {user.email}</p>
        <p><strong>Your Role: {user.role}</strong></p>

        {user.role === 'admin' && (
          <div style={{ marginTop: '20px', padding: '10px', border: '2px solid blue' }}>
            <h3>Admin Tools</h3>
            <Link to="/admin">Go to Admin Dashboard</Link>
          </div>
        )}
        
        <button onClick={handleLogout} style={{ marginTop: '20px' }}>
          Logout
        </button>
      </div>
    );
  }

  return <p>Please log in.</p>; // Fallback
};

export default ProfilePage;