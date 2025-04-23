import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Divider,
  IconButton,
  TextField,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Folder as FolderIcon,
  Code as CodeIcon,
} from '@mui/icons-material';

const FileUploader = ({ onFileUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const directoryInputRef = useRef(null);
  const [manualPath, setManualPath] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const uploadedFiles = Array.from(e.dataTransfer.files).map(file => ({
        name: file.name,
        path: file.path || URL.createObjectURL(file),
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        isDirectory: file.isDirectory || false,
        file: file
      }));
      
      onFileUpload(uploadedFiles);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const uploadedFiles = Array.from(e.target.files).map(file => ({
        name: file.name,
        path: file.path || URL.createObjectURL(file),
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        isDirectory: false,
        file: file
      }));
      
      onFileUpload(uploadedFiles);
      e.target.value = null; // Reset input
    }
  };

  const handleDirectoryInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // In real implementation, handling directories requires some additional work
      // This is a simplified version
      const directory = {
        name: e.target.files[0].webkitRelativePath.split('/')[0],
        path: e.target.files[0].webkitRelativePath.split('/')[0],
        files: Array.from(e.target.files),
        isDirectory: true,
      };
      
      onFileUpload([directory]);
      e.target.value = null; // Reset input
    }
  };

  const handleManualPathSubmit = () => {
    if (manualPath.trim()) {
      // In a real application, you would validate if this is a valid path
      // Here we'll just create a mock directory object
      const pathParts = manualPath.split('/');
      const directoryName = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2] || manualPath;
      
      onFileUpload([{
        name: directoryName,
        path: manualPath,
        isDirectory: true,
      }]);
      
      setManualPath('');
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              border: '2px dashed',
              borderColor: dragActive ? 'primary.main' : 'divider',
              backgroundColor: dragActive ? 'rgba(33, 150, 243, 0.04)' : 'background.paper',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: 'primary.light',
                backgroundColor: 'rgba(33, 150, 243, 0.04)',
              },
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileInput}
              accept=".c,.cpp,.h,.hpp"
            />
            <input
              ref={directoryInputRef}
              type="file"
              webkitdirectory="true"
              directory="true"
              style={{ display: 'none' }}
              onChange={handleDirectoryInput}
            />
            
            <UploadIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drag and drop files here
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Or click to select files manually
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Supported formats: .c, .cpp, .h, .hpp
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            Or select a directory
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<FolderIcon />}
              onClick={() => directoryInputRef.current.click()}
            >
              Select Directory
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<CodeIcon />}
              onClick={() => fileInputRef.current.click()}
            >
              Select Files
            </Button>
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            Enter directory path manually
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Enter a directory path, e.g., /path/to/source"
              value={manualPath}
              onChange={(e) => setManualPath(e.target.value)}
              variant="outlined"
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleManualPathSubmit}
              disabled={!manualPath.trim()}
            >
              Add
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FileUploader;