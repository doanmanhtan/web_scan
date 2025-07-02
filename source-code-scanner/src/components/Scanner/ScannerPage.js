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
import { useScan } from '../../contexts/ScanContext';

// Components
import FileUploader from './FileUploader';
import FileList from './FileList';
import ScanOptions from './ScanOptions';
import ScanResults from './ScanResults';
import ProgressIndicator from './ProgressIndicator';

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
    issuesFound,
    results,
    scanError,
    scan,
    setScan,
    // ✅ THÊM CÁC PROPS CHO SCAN NAME
    scanName,
    setScanName,
    generateDefaultScanName,
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

  // ✅ THÊM HANDLER CHO SCAN NAME
  const handleScanNameChange = (name) => {
    setScanName(name);
  };

  const handleStartScan = async () => {
    // ✅ Start scan and automatically move to results when complete
    await startScan();
    
    // ✅ Move to next step immediately to show progress
    handleNext();
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
              // ✅ THÊM PROPS CHO SCAN NAME
              scanName={scanName}
              onScanNameChange={handleScanNameChange}
            />
            
            {/* ✅ HIỂN THỊ PREVIEW TÊN SCAN */}
            <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Scan Preview:
              </Typography>
              <Typography variant="body2">
                <strong>Name:</strong> {scanName.trim() || generateDefaultScanName()}
              </Typography>
              <Typography variant="body2">
                <strong>Type:</strong> {scanType}
              </Typography>
              <Typography variant="body2">
                <strong>Tools:</strong> {selectedTools.join(', ')}
              </Typography>
              <Typography variant="body2">
                <strong>Files:</strong> {files.length} selected
              </Typography>
            </Paper>
          </Box>
        );
      case 2:
        return (
          <Box>
            {/* ✅ Show scan error if any */}
            {scanError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {scanError}
              </Alert>
            )}
            
            {/* ✅ HIỂN THỊ THÔNG TIN SCAN ĐANG CHẠY */}
            {isScanning && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="h6" gutterBottom>
                  Running Scan: {scanName.trim() || generateDefaultScanName()}
                </Typography>
                <Typography variant="body2">
                  Status: {currentFile}
                </Typography>
              </Paper>
            )}
            
            {/* ✅ Show progress while scanning */}
            <ProgressIndicator 
              isScanning={isScanning} 
              progress={progress} 
              currentFile={currentFile}
              issuesFound={issuesFound}
              onPause={pauseScan}
              onStop={stopScan}
            />
            
            {/* ✅ Show results when scan is complete */}
            {!isScanning && progress === 100 && (
              <Box sx={{ mt: 3 }}>
                {/* ✅ THÊM THÔNG TIN SCAN HOÀN THÀNH */}
                <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <Typography variant="h6" gutterBottom>
                    ✅ Scan Completed: {scanName.trim() || generateDefaultScanName()}
                  </Typography>
                </Paper>
                
                {/* ✅ Pass all necessary props to ScanResults */}
                <ScanResults 
                  results={results} 
                  issuesFound={issuesFound}
                  currentFile={currentFile}
                  scanId={scan?._id || scan?.scanId}
                />
              </Box>
            )}
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  console.log('scan object:', scan);
  console.log('scanName from context:', scanName);

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
          !isScanning && (
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
                disabled={files.length === 0 || selectedTools.length === 0}
              >
                Start Scan: {scanName.trim() || generateDefaultScanName()}
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