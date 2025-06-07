import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from 'notistack';

const ChangePassword = () => {
  const { changePassword } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return setError('New passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ currentPassword: formData.currentPassword, newPassword: formData.newPassword }),
      });
      if (response.ok) {
        enqueueSnackbar('Password changed successfully', { variant: 'success' });
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setError('Failed to change password');
        enqueueSnackbar('Failed to change password', { variant: 'error' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
      enqueueSnackbar('Failed to change password', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Change Password
        </Typography>
        <Paper elevation={3} sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              name="currentPassword"
              label="Current Password"
              type="password"
              value={formData.currentPassword}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="newPassword"
              label="New Password"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              helperText="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Change Password'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ChangePassword; 