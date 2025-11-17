import React, { useState, useEffect } from 'react';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

// --- 1. Import MUI Components ---
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  Container
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PeopleIcon from '@mui/icons-material/People';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SearchIcon from '@mui/icons-material/Search';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import FacebookIcon from '@mui/icons-material/Facebook';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const axiosPrivate = useAxiosPrivate();

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const res = await axiosPrivate.get('/api/admin/users');
        setUsers(res.data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllUsers();
  }, [axiosPrivate]);

  // --- 2. Calculate Statistics ---
  const totalUsers = users.length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const googleUsers = users.filter(u => u.providers?.googleId).length;
  const githubUsers = users.filter(u => u.providers?.githubId).length;
  const facebookUsers = users.filter(u => u.providers?.facebookId).length;
  const recentUsers = users.filter(u => {
    const diff = Date.now() - new Date(u.createdAt).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000; // Last 7 days
  }).length;

  // --- 3. Filter Users ---
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- 4. Helper Function for Provider Icons ---
  const getProviderIcons = (providers) => {
    const icons = [];
    if (providers?.googleId) icons.push(<GoogleIcon key="google" sx={{ fontSize: 18, color: '#4285F4' }} />);
    if (providers?.githubId) icons.push(<GitHubIcon key="github" sx={{ fontSize: 18, color: '#333' }} />);
    if (providers?.facebookId) icons.push(<FacebookIcon key="facebook" sx={{ fontSize: 18, color: '#1877F2' }} />);
    return icons;
  };

  // --- 5. Render Logic with MUI ---
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" variant="filled">Access Denied: {error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="700" gutterBottom>
          <AdminPanelSettingsIcon sx={{ fontSize: 40, verticalAlign: 'middle', mr: 1, color: 'primary.main' }} />
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage users, monitor activity, and view system statistics
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4" fontWeight="700">
                    {totalUsers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                    Total Users
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 50, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4" fontWeight="700">
                    {adminUsers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                    Administrators
                  </Typography>
                </Box>
                <VerifiedUserIcon sx={{ fontSize: 50, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4" fontWeight="700">
                    {recentUsers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                    New (7 days)
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 50, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4" fontWeight="700">
                    {googleUsers + githubUsers + facebookUsers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                    OAuth Linked
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, flexDirection: 'column' }}>
                  <GoogleIcon sx={{ fontSize: 20, opacity: 0.8 }} />
                  <GitHubIcon sx={{ fontSize: 20, opacity: 0.8 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Bar */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          variant="outlined"
          size="small"
        />
      </Paper>

      {/* Users Table */}
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6" fontWeight="600">
            User Directory ({filteredUsers.length})
          </Typography>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell><strong>User</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell align="center"><strong>Role</strong></TableCell>
                <TableCell align="center"><strong>Providers</strong></TableCell>
                <TableCell><strong>Joined</strong></TableCell>
                <TableCell><strong>Last Login</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No users found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow
                    key={user._id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={user.avatar}
                          alt={user.name}
                          sx={{ 
                            width: 40, 
                            height: 40,
                            bgcolor: user.role === 'admin' ? 'secondary.main' : 'primary.main'
                          }}
                        >
                          {user.role === 'admin' ? <AdminPanelSettingsIcon /> : <PersonIcon />}
                        </Avatar>
                        <Typography variant="body2" fontWeight="500">
                          {user.name || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={user.role.toUpperCase()}
                        size="small"
                        color={user.role === 'admin' ? 'secondary' : 'default'}
                        sx={{ fontWeight: '600', minWidth: 70 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        {getProviderIcons(user.providers)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'Never'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Provider Statistics */}
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <GoogleIcon sx={{ fontSize: 40, color: '#4285F4', mb: 1 }} />
            <Typography variant="h5" fontWeight="600">{googleUsers}</Typography>
            <Typography variant="body2" color="text.secondary">Google Accounts</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <GitHubIcon sx={{ fontSize: 40, color: '#333', mb: 1 }} />
            <Typography variant="h5" fontWeight="600">{githubUsers}</Typography>
            <Typography variant="body2" color="text.secondary">GitHub Accounts</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <FacebookIcon sx={{ fontSize: 40, color: '#1877F2', mb: 1 }} />
            <Typography variant="h5" fontWeight="600">{facebookUsers}</Typography>
            <Typography variant="body2" color="text.secondary">Facebook Accounts</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminPage;