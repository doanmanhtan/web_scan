import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Divider,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Switch,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  FolderOpen as FolderIcon,
  Code as CodeIcon,
  Settings as SettingsIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';

// Components
import FileUploader from '../components/Scanner/FileUploader';
import ScanOptions from '../components/Scanner/ScanOptions';
import ScanResults from '../components/Scanner/ScanResults';

const steps = ['Select Files', 'Configure Scan', 'Start Scan'];

function ScannerPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [files, setFiles] = useState([]);
  const [scanType, setScanType] = useState('all');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedTools, setSelectedTools] = useState(['semgrep', 'snyk', 'clangtidy']);
  
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleFileUpload = (newFiles) => {
    setFiles([...files, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleScanTypeChange = (event) => {
    setScanType(event.target.value);
  };

  const handleToolSelection = (tool) => {
    if (selectedTools.includes(tool)) {
      setSelectedTools(selectedTools.filter(t => t !== tool));
    } else {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  const handleStartScan = () => {
    setIsScanning(true);
    // Simulate progress
    const timer = setInterval(() => {
      setScanProgress((prevProgress) => {
        const newProgress = prevProgress + 10;
        if (newProgress >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsScanning(false);
            handleNext();
          }, 1000);
          return 100;
        }
        return newProgress;
      });
    }, 800);
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Files or Directories to Scan
            </Typography>
            <Paper sx={{ p: 3, mb: 3 }}>
              <FileUploader onFileUpload={handleFileUpload} />
              
              {files.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Selected Files/Directories ({files.length})
                  </Typography>
                  <List>
                    {files.map((file, index) => (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveFile(index)}>
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemIcon>
                          {file.isDirectory ? <FolderIcon /> : <FileIcon />}
                        </ListItemIcon>
                        <ListItemText
                          primary={file.name}
                          secondary={file.path}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Paper>
            <Alert severity="info">
              Supported file types: C/C++ source files (.c, .cpp, .h, .hpp)
            </Alert>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure Scan Options
            </Typography>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Scan Type</InputLabel>
                    <Select
                      value={scanType}
                      label="Scan Type"
                      onChange={handleScanTypeChange}
                    >
                      <MenuItem value="all">Full Scan (All Rules)</MenuItem>
                      <MenuItem value="security">Security Vulnerabilities</MenuItem>
                      <MenuItem value="style">Style Issues</MenuItem>
                      <MenuItem value="performance">Performance Issues</MenuItem>
                      <MenuItem value="custom">Custom Rule Set</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Rule Directory"
                    defaultValue="./rules"
                    helperText="Directory containing custom rule definitions"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Select Analysis Tools
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {['semgrep', 'snyk', 'clangtidy'].map((tool) => (
                      <Chip
                        key={tool}
                        label={tool}
                        onClick={() => handleToolSelection(tool)}
                        color={selectedTools.includes(tool) ? "primary" : "default"}
                        variant={selectedTools.includes(tool) ? "filled" : "outlined"}
                        icon={<CodeIcon />}
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Include warnings"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Generate detailed report"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );
      case 2:
        return isScanning ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <CircularProgress variant="determinate" value={scanProgress} size={80} thickness={4} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Scanning... {scanProgress}%
            </Typography>
            <Typography color="text.secondary">
              Analyzing files with {selectedTools.join(', ')}
            </Typography>
            <Button 
              variant="outlined" 
              color="secondary" 
              startIcon={<PauseIcon />} 
              sx={{ mt: 3 }}
            >
              Pause Scan
            </Button>
          </Box>
        ) : (
          <ScanResults />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Source Code Scanner
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => {
          const stepProps = {};
          const labelProps = {};
          return (
            <Step key={label} {...stepProps}>
              <StepLabel {...labelProps}>{label}</StepLabel>
            </Step>
          );
        })}
      </Stepper>
      
      <Box sx={{ mt: 2, mb: 4 }}>
        {getStepContent(activeStep)}
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
        <Button
          color="inherit"
          disabled={activeStep === 0 || (activeStep === 2 && isScanning)}
          onClick={handleBack}
          sx={{ mr: 1 }}
        >
          Back
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        
        {activeStep === steps.length - 1 ? (
          isScanning ? null : (
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<SaveIcon />}
            >
              Save Report
            </Button>
          )
        ) : (
          <>
            {activeStep === 1 && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleStartScan}
                startIcon={<StartIcon />}
                disabled={files.length === 0}
              >
                Start Scan
              </Button>
            )}
            {activeStep === 0 && (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={files.length === 0}
              >
                Next
              </Button>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}

export default ScannerPage;