import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Switch,
  FormControlLabel,
  Snackbar,
  CircularProgress,
  Divider,
  Chip,
  Paper,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Save as SaveIcon,
  RestoreFromTrash as ResetIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import {
  getScannerPaths,
  updateScannerPaths,
  testScannerConnection,
  getAllScannerConfigs,
  resetScannerConfigs,
} from '../../services/settingsService';

const ToolSettings = () => {
  const [toolConfigs, setToolConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Load configurations on component mount
  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const configs = await getAllScannerConfigs();
      setToolConfigs(configs);
    } catch (error) {
      console.error('Error loading configurations:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load scanner configurations',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePathChange = (scanner, value) => {
    setToolConfigs(prev => ({
      ...prev,
      [scanner]: {
        ...prev[scanner],
        path: value
      }
    }));
    
    // Reset test result when path changes
    setTestResults(prev => ({
      ...prev,
      [scanner]: null
    }));
  };

  const handleEnabledChange = (scanner, enabled) => {
    setToolConfigs(prev => ({
      ...prev,
      [scanner]: {
        ...prev[scanner],
        enabled
      }
    }));
  };

  const handleTimeoutChange = (scanner, value) => {
    setToolConfigs(prev => ({
      ...prev,
      [scanner]: {
        ...prev[scanner],
        timeoutMs: parseInt(value) * 1000 // Convert seconds to milliseconds
      }
    }));
  };

  const testConnection = async (scanner) => {
    try {
      setTestResults(prev => ({ ...prev, [scanner]: { loading: true } }));
      
      // Get current path for this scanner
      const currentPath = toolConfigs[scanner]?.path;
      
      // Test connection with current path
      const result = await testScannerConnection(scanner, currentPath);
      
      setTestResults(prev => ({
        ...prev,
        [scanner]: {
          loading: false,
          success: result.success,
          message: result.message
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [scanner]: {
          loading: false,
          success: false,
          message: error.message
        }
      }));
    }
  };

  const saveConfigurations = async () => {
    try {
      setSaving(true);
      
      // Prepare updates for all fields
      const updates = {};
      Object.entries(toolConfigs).forEach(([scanner, config]) => {
        updates[scanner] = {
          path: config.path,
          enabled: config.enabled,
          timeoutMs: config.timeoutMs
        };
      });
      
      await updateScannerPaths(updates);
      
      setSnackbar({
        open: true,
        message: 'Scanner configurations saved successfully',
        severity: 'success'
      });
      
      // Reload configurations to get any server-side updates
      await loadConfigurations();
    } catch (error) {
      console.error('Error saving configurations:', error);
      setSnackbar({
        open: true,
        message: `Failed to save configurations: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    try {
      setSaving(true);
      await resetScannerConfigs();
      await loadConfigurations();
      
      setSnackbar({
        open: true,
        message: 'Configurations reset to defaults',
        severity: 'info'
      });
      
      // Clear test results
      setTestResults({});
    } catch (error) {
      console.error('Error resetting configurations:', error);
      setSnackbar({
        open: true,
        message: `Failed to reset configurations: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const renderTestResultIcon = (result) => {
    if (!result) return null;
    
    if (result.loading) {
      return <CircularProgress size={20} />;
    }
    
    if (result.success) {
      return <CheckIcon color="success" />;
    }
    
    return <ErrorIcon color="error" />;
  };

  const renderTestResultAlert = (scanner) => {
    const result = testResults[scanner];
    if (!result || result.loading) return null;
    
    return (
      <Alert 
        severity={result.success ? 'success' : 'error'} 
        sx={{ 
          mt: 2,
          borderRadius: 2,
          '& .MuiAlert-icon': {
            alignItems: 'center'
          }
        }}
      >
        {result.message}
      </Alert>
    );
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary">
          Loading scanner configurations...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%' }}>
      {/* Action Buttons */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={4}
        flexWrap="wrap"
        gap={2}
      >
        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<ResetIcon />}
            onClick={resetToDefaults}
            disabled={saving}
            sx={{ 
              px: 3,
              py: 1.5,
              borderRadius: 2,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2
              }
            }}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveConfigurations}
            disabled={saving}
            sx={{ 
              px: 4,
              py: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
              }
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
        
        <Chip 
          icon={<SettingsIcon />}
          label={`${Object.keys(toolConfigs).length} Tools Configured`}
          variant="outlined"
          sx={{ 
            borderColor: 'primary.main',
            color: 'primary.main',
            fontWeight: 500
          }}
        />
      </Box>

      {/* Tools Grid */}
      <Grid container spacing={4}>
        {Object.entries(toolConfigs).map(([scanner, config]) => (
          <Grid item xs={12} lg={6} key={scanner}>
            <Card 
              elevation={0}
              sx={{ 
                height: '100%',
                border: '2px solid',
                borderColor: config.enabled ? 'primary.light' : 'grey.200',
                borderRadius: 3,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  borderColor: config.enabled ? 'primary.main' : 'grey.300'
                },
                background: config.enabled 
                  ? 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)'
                  : 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)'
              }}
            >
              <CardHeader 
                title={
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography 
                      variant="h5" 
                      component="h3"
                      fontWeight="bold"
                      color={config.enabled ? 'primary.main' : 'text.secondary'}
                    >
                      {scanner.charAt(0).toUpperCase() + scanner.slice(1)}
                    </Typography>
                    <Chip 
                      label={config.enabled ? 'Active' : 'Inactive'}
                      size="small"
                      color={config.enabled ? 'success' : 'default'}
                      variant={config.enabled ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                }
                subheader={
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {config.description || `${scanner} Scanner`}
                  </Typography>
                }
                action={
                  <Box display="flex" alignItems="center" gap={1}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.enabled}
                          onChange={(e) => handleEnabledChange(scanner, e.target.checked)}
                          size="medium"
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: 'primary.main',
                              '&:hover': {
                                backgroundColor: 'rgba(102, 126, 234, 0.08)'
                              }
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: 'primary.main'
                            }
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" fontWeight={500}>
                          Enabled
                        </Typography>
                      }
                    />
                    <IconButton 
                      aria-label="test connection"
                      onClick={() => testConnection(scanner)}
                      disabled={!config.enabled}
                      sx={{
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(102, 126, 234, 0.2)'
                        },
                        '&:disabled': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      {renderTestResultIcon(testResults[scanner]) || <RefreshIcon />}
                    </IconButton>
                  </Box>
                }
                sx={{
                  pb: 1,
                  '& .MuiCardHeader-action': {
                    alignSelf: 'center'
                  }
                }}
              />
              
              <CardContent sx={{ pt: 0 }}>
                <Box sx={{ mb: 3 }}>
                  <TextField 
                    fullWidth 
                    label={`Path to ${scanner.charAt(0).toUpperCase() + scanner.slice(1)}`}
                    variant="outlined"
                    value={config.path}
                    onChange={(e) => handlePathChange(scanner, e.target.value)}
                    helperText={`Specify the full path to the ${scanner} executable`}
                    disabled={!config.enabled}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.light'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'primary.main'
                      }
                    }}
                  />
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Timeout (seconds)"
                    variant="outlined"
                    type="number"
                    value={Math.floor(config.timeoutMs / 1000)}
                    onChange={(e) => handleTimeoutChange(scanner, e.target.value)}
                    helperText="Maximum execution time in seconds"
                    disabled={!config.enabled}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.light'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'primary.main'
                      }
                    }}
                  />
                </Box>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Button 
                    variant="outlined" 
                    size="medium"
                    onClick={() => testConnection(scanner)}
                    disabled={!config.enabled}
                    startIcon={renderTestResultIcon(testResults[scanner]) || <RefreshIcon />}
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        backgroundColor: 'rgba(102, 126, 234, 0.04)'
                      }
                    }}
                  >
                    Test Connection
                  </Button>
                  
                  {testResults[scanner] && !testResults[scanner].loading && (
                    <Chip
                      icon={testResults[scanner].success ? <CheckIcon /> : <ErrorIcon />}
                      label={testResults[scanner].success ? 'Connected' : 'Failed'}
                      color={testResults[scanner].success ? 'success' : 'error'}
                      variant="filled"
                      sx={{ fontWeight: 500 }}
                    />
                  )}
                </Box>
                
                {renderTestResultAlert(scanner)}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-icon': {
              alignItems: 'center'
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ToolSettings;