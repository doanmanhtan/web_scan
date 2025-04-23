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
  Alert,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

// Contexts
import { useScan } from '../contexts/ScanContext';

// Components
import FileUploader from '../components/Scanner/FileUploader';
import FileList from '../components/Scanner/FileList';
import ScanOptions from '../components/Scanner/ScanOptions';
import ScanResults from '../components/Scanner/ScanResults';
import ProgressIndicator from '../components/Scanner/ProgressIndicator';

const steps = ['Select Files', 'Configure Scan', 'Start Scan'];

function ScannerPage() {
  const [activeStep, setActiveStep] = useState(0);
  
  const { 
    files, 
    isScanning, 
    progress, 
    currentFile,
    addFiles, 
    removeFile, 
    scanType,
    selectedTools,
    setScanType,
    setSelectedTools,
    startScan,
    pauseScan,
    stopScan,
    issuesFound
  } = useScan();

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleFileUpload = (newFiles) => {
    addFiles(newFiles);
  };

  const handleRemoveFile = (index) => {
    removeFile(index);
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
    startScan();
    // Có thể sử dụng timeout hoặc promise để đợi quét hoàn tất
    const timer = setTimeout(() => {
      handleNext();
      clearTimeout(timer);
    }, 8000); // Giả lập quét hoàn tất sau 8 giây
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
                  <FileList files={files} onRemoveFile={handleRemoveFile} />
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
            <ScanOptions 
              onScanTypeChange={handleScanTypeChange}
              onToolSelection={handleToolSelection}
              selectedTools={selectedTools}
              scanType={scanType}
            />
          </Box>
        );
      case 2:
        return (
          <Box>
            <ProgressIndicator 
              isScanning={isScanning} 
              progress={progress} 
              currentFile={currentFile}
              issuesFound={issuesFound}
              onPause={pauseScan}
              onStop={stopScan}
            />
            
            {!isScanning && progress === 100 && (
              <ScanResults />
            )}
          </Box>
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