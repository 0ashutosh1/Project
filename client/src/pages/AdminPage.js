import React, { useState, useEffect } from 'react';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/users', {
          method: 'GET',
          credentials: 'include' // Must send the cookie
        });

        if (!res.ok) {
          // If we get a 401 (Not Auth'd) or 403 (Not Admin), throw an error
          const errorData = await res.json();
          throw new Error(errorData.message || 'You do not have permission.');
        }

        const data = await res.json();
        setUsers(data); // Save the array of users

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllUsers();
  }, []); // Runs once on page load

  // --- Render Logic ---
  if (loading) {
    return <p>Loading Admin Dashboard...</p>;
  }

  if (error) {
    // This will show "Not authorized as an admin" if a normal user gets here
    return <h2>Access Denied: {error}</h2>;
  }

  return (
    <div>
      <h2>Admin Dashboard (User List)</h2>
      <p>This page is only visible to admins.</p>
      <hr />
      {users.map(user => (
        <div key={user._id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
};

export default AdminPage;