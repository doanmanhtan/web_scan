import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  CircularProgress,
  Paper,
  Button,
  Grid,
  Chip,
} from '@mui/material';
import {
  Pause as PauseIcon,
  Stop as StopIcon,
  BugReport as BugIcon,
} from '@mui/icons-material';

const ProgressIndicator = ({ 
  isScanning, 
  progress, 
  currentFile,
  issuesFound,
  onPause,
  onStop
}) => {
  if (!isScanning) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CircularProgress 
              variant="determinate" 
              value={progress} 
              size={60} 
              thickness={4} 
              sx={{ mr: 3 }} 
            />
            <Box>
              <Typography variant="h5">
                Scanning... {progress}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {currentFile ? `Analyzing: ${currentFile}` : 'Initializing scan...'}
              </Typography>
            </Box>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 10, borderRadius: 5, mb: 2 }} 
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button 
              variant="outlined" 
              color="secondary" 
              startIcon={<PauseIcon />}
              onClick={onPause}
            >
              Pause
            </Button>
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<StopIcon />}
              onClick={onStop}
            >
              Stop
            </Button>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" gutterBottom>
              Scan Statistics
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Files Analyzed:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {Math.floor(progress / 100 * 42)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Issues Found:</Typography>
              <Typography variant="body2" fontWeight="bold">
                <Chip 
                  size="small" 
                  icon={<BugIcon />} 
                  label={issuesFound || 0} 
                  color={issuesFound > 0 ? "warning" : "default"} 
                />
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Estimated Time:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {progress < 100 ? `${Math.ceil((100 - progress) / 10)} minutes remaining` : 'Complete'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ProgressIndicator;