import React, { useState, useEffect } from 'react';

const ProfilePage = () => {
  // We'll store the user's data in 'state'
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // This 'useEffect' hook runs once when the component first loads
  useEffect(() => {
    
    // Define the async function to fetch data
    const fetchUserData = async () => {
      try {
        // --- THIS IS THE CRITICAL PART ---
        // We're calling our backend's '/api/user/me' route
        const res = await fetch('http://localhost:5000/api/user/me', {
          method: 'GET',
          // 'credentials: "include"' tells the browser to send cookies
          // (like our 'token' cookie) with this request
          credentials: 'include' 
        });
        // --- END CRITICAL PART ---

        if (!res.ok) {
          // If the server response is not good (e.g., 401 Unauthorized)
          throw new Error('Not authorized. Please log in again.');
        }

        const data = await res.json();
        setUser(data); // Save the user data { id, name, email }
        
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false); // We're done loading
      }
    };

    fetchUserData();
  }, []); // The empty array [] means this effect runs only once

  // --- Render different content based on our state ---
  
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
        <p>(This information came from your secure backend!)</p>
      </div>
    );
  }

  // Fallback in case something unexpected happens
  return <p>Something went wrong. Please try refreshing.</p>;
};

export default ProfilePage;