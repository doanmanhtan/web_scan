import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from 'notistack';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    role: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setUsers(data);
    } catch (err) {
      setError(err.message);
      enqueueSnackbar('Failed to fetch users', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditFormData({
      role: user.role,
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      const response = await fetch(`/api/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(editFormData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, role: editFormData.role } : u)));
      enqueueSnackbar('User role updated successfully', { variant: 'success' });
      setEditDialogOpen(false);
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to update user role', { variant: 'error' });
    }
  };

  const handleToggleActive = async (user) => {
    try {
      const response = await fetch(`/api/users/${user.id}/toggle-active`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setUsers(users.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)));
      enqueueSnackbar(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`, {
        variant: 'success',
      });
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to toggle user status', { variant: 'error' });
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user ${user.username}?`)) return;

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      setUsers(users.filter((u) => u.id !== user.id));
      enqueueSnackbar('User deleted successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to delete user', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          User Management
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={user.role === 'admin' ? 'error' : 'primary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      color={user.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleEditClick(user)}
                      disabled={user.id === currentUser.id}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleToggleActive(user)}
                      disabled={user.id === currentUser.id}
                    >
                      {user.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(user)}
                      disabled={user.id === currentUser.id}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
          <DialogTitle>Edit User Role</DialogTitle>
          <DialogContent>
            <TextField
              select
              fullWidth
              label="Role"
              value={editFormData.role}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
              sx={{ mt: 2 }}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit} variant="contained">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default UserManagement; 