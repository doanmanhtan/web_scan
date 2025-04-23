import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

const ToolSettings = () => {
  const [toolPaths, setToolPaths] = useState({
    semgrep: '/usr/local/bin/semgrep',
    snyk: '/usr/bin/snyk',
    clangtidy: '/usr/bin/clang-tidy',
  });
  
  const [performance, setPerformance] = useState({
    maxThreads: 4,
    timeout: 300,
  });
  
  const [testResults, setTestResults] = useState({
    semgrep: null,
    snyk: null,
    clangtidy: null,
  });

  const handlePathChange = (event) => {
    const { name, value } = event.target;
    setToolPaths({
      ...toolPaths,
      [name]: value,
    });
    
    // Reset test result when path changes
    setTestResults({
      ...testResults,
      [name]: null,
    });
  };

  const handlePerformanceChange = (event) => {
    const { name, value } = event.target;
    setPerformance({
      ...performance,
      [name]: value,
    });
  };

  const testConnection = (tool) => {
    // Simulate testing connection
    console.log(`Testing connection to ${tool} at path: ${toolPaths[tool]}`);
    
    // In a real application, you would make an API call to the backend
    // to verify the tool's path and whether it's executable
    
    // Simulate a delay for testing
    setTestResults({
      ...testResults,
      [tool]: 'testing',
    });
    
    setTimeout(() => {
      // Simulate random success/failure for demonstration
      const success = Math.random() > 0.3;
      setTestResults({
        ...testResults,
        [tool]: success ? 'success' : 'error',
      });
    }, 1500);
  };

  const renderTestResultIcon = (result) => {
    if (result === 'testing') {
      return <RefreshIcon className="pulse-animation" />;
    } else if (result === 'success') {
      return <CheckIcon color="success" />;
    } else if (result === 'error') {
      return <ErrorIcon color="error" />;
    }
    return null;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Analysis Tools Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure the paths to your installed tools. Make sure the paths are correct and the tools are properly installed.
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardHeader 
              title="Semgrep" 
              subheader="Static Analysis Tool"
              action={
                <IconButton 
                  aria-label="test connection"
                  onClick={() => testConnection('semgrep')}
                >
                  {renderTestResultIcon(testResults.semgrep) || <RefreshIcon />}
                </IconButton>
              }
            />
            <CardContent>
              <TextField 
                fullWidth 
                label="Path to Semgrep" 
                variant="outlined"
                name="semgrep"
                value={toolPaths.semgrep}
                onChange={handlePathChange}
                helperText="Specify the full path to the semgrep executable"
                sx={{ mb: 2 }}
              />
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => testConnection('semgrep')}
                startIcon={renderTestResultIcon(testResults.semgrep) || <RefreshIcon />}
              >
                Test Connection
              </Button>
              
              {testResults.semgrep === 'success' && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Semgrep is installed and working correctly.
                </Alert>
              )}
              
              {testResults.semgrep === 'error' && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Could not connect to Semgrep. Please check the path and ensure the tool is installed.
                </Alert>
              )}
            </CardContent>
          </Card>
          
          <Card variant="outlined">
            <CardHeader 
              title="Snyk" 
              subheader="Vulnerability Scanner"
              action={
                <IconButton 
                  aria-label="test connection"
                  onClick={() => testConnection('snyk')}
                >
                  {renderTestResultIcon(testResults.snyk) || <RefreshIcon />}
                </IconButton>
              }
            />
            <CardContent>
              <TextField 
                fullWidth 
                label="Path to Snyk" 
                variant="outlined"
                name="snyk"
                value={toolPaths.snyk}
                onChange={handlePathChange}
                helperText="Specify the full path to the snyk executable"
                sx={{ mb: 2 }}
              />
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => testConnection('snyk')}
                startIcon={renderTestResultIcon(testResults.snyk) || <RefreshIcon />}
              >
                Test Connection
              </Button>
              
              {testResults.snyk === 'success' && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Snyk is installed and working correctly.
                </Alert>
              )}
              
              {testResults.snyk === 'error' && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Could not connect to Snyk. Please check the path and ensure the tool is installed.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardHeader 
              title="ClangTidy" 
              subheader="C/C++ Linter"
              action={
                <IconButton 
                  aria-label="test connection"
                  onClick={() => testConnection('clangtidy')}
                >
                  {renderTestResultIcon(testResults.clangtidy) || <RefreshIcon />}
                </IconButton>
              }
            />
            <CardContent>
              <TextField 
                fullWidth 
                label="Path to ClangTidy" 
                variant="outlined"
                name="clangtidy"
                value={toolPaths.clangtidy}
                onChange={handlePathChange}
                helperText="Specify the full path to the clang-tidy executable"
                sx={{ mb: 2 }}
              />
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => testConnection('clangtidy')}
                startIcon={renderTestResultIcon(testResults.clangtidy) || <RefreshIcon />}
              >
                Test Connection
              </Button>
              
              {testResults.clangtidy === 'success' && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  ClangTidy is installed and working correctly.
                </Alert>
              )}
              
              {testResults.clangtidy === 'error' && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Could not connect to ClangTidy. Please check the path and ensure the tool is installed.
                </Alert>
              )}
            </CardContent>
          </Card>
          
          <Card variant="outlined">
            <CardHeader 
              title="Performance Settings" 
              subheader="Configure scan performance"
            />
            <CardContent>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Maximum Threads</InputLabel>
                <Select
                  name="maxThreads"
                  value={performance.maxThreads}
                  label="Maximum Threads"
                  onChange={handlePerformanceChange}
                >
                  <MenuItem value={1}>1 (Minimum)</MenuItem>
                  <MenuItem value={2}>2</MenuItem>
                  <MenuItem value={4}>4</MenuItem>
                  <MenuItem value={8}>8</MenuItem>
                  <MenuItem value={16}>16 (Maximum)</MenuItem>
                </Select>
              </FormControl>
              
              <TextField 
                fullWidth 
                label="Scan Timeout (seconds)" 
                variant="outlined"
                name="timeout"
                type="number"
                value={performance.timeout}
                onChange={handlePerformanceChange}
                helperText="Maximum time in seconds for a scan to complete"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ToolSettings;