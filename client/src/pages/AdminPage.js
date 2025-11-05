import React, { useState, useEffect } from 'react';
import useAxiosPrivate from '../hooks/useAxiosPrivate'; // <-- 1. Import hook

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const axiosPrivate = useAxiosPrivate(); // <-- 2. Initialize hook

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        // --- 3. Use axiosPrivate ---
        const res = await axiosPrivate.get('/api/admin/users');
        setUsers(res.data); // Data is on res.data with axios

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllUsers();
  }, [axiosPrivate]); // <-- 4. Add dependency

  // --- Render Logic (Same as before) ---
  if (loading) {
    return <p>Loading Admin Dashboard...</p>;
  }

  if (error) {
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