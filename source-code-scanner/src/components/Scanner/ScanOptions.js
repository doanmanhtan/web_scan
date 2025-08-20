import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Chip,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  BugReport as BugIcon,
  DriveFileRenameOutline as NameIcon,
} from '@mui/icons-material';

const ScanOptions = ({ 
  onScanTypeChange, 
  onToolSelection, 
  selectedTools = [],
  scanType = 'all',
  scanName = '',
  onScanNameChange
}) => {
  const [ruleDirectory, setRuleDirectory] = useState('./rules');
  const [includeWarnings, setIncludeWarnings] = useState(true);
  const [generateReport, setGenerateReport] = useState(true);
  
  // Define all available tools
  const availableTools = ['semgrep', 'snyk', 'clangtidy', 'cppcheck', 'clangStaticAnalyzer', 'cppcheckCustom'];
  
  // Auto-select missing tools on component mount
  useEffect(() => {
    const missingTools = availableTools.filter(tool => !selectedTools.includes(tool));
    
    if (missingTools.length > 0 && onToolSelection) {
      console.log('Auto-selecting missing tools:', missingTools);
      missingTools.forEach(tool => {
        onToolSelection(tool);
      });
    }
  }, []); // Only run once on mount

  const handleScanTypeChange = (event) => {
    if (onScanTypeChange) {
      onScanTypeChange(event);
    }
  };

  const handleToolSelection = (tool) => {
    if (onToolSelection) {
      onToolSelection(tool);
    }
  };

  // Hàm tạo tên mặc định
  const generateDefaultName = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    return `Security Scan ${date} ${time}`;
  };

  // Hàm xử lý khi người dùng thay đổi tên scan
  const handleScanNameChange = (event) => {
    if (onScanNameChange) {
      onScanNameChange(event.target.value);
    }
  };

  const handleSelectAll = () => {
    availableTools.forEach(tool => {
      if (!selectedTools.includes(tool)) {
        handleToolSelection(tool);
      }
    });
  };

  const handleClearAll = () => {
    selectedTools.forEach(tool => {
      handleToolSelection(tool);
    });
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Trường Scan Name */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Scan Name"
            value={scanName}
            onChange={handleScanNameChange}
            placeholder={generateDefaultName()}
            helperText={`If left empty, will use: "${generateDefaultName()}"`}
            variant="outlined"
            InputProps={{
              startAdornment: <NameIcon sx={{ mr: 1, color: 'action.active' }} />,
            }}
            sx={{ mb: 2 }}
          />
        </Grid>


        {/* Tool Selection */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Select Analysis Tools
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {availableTools.map((tool) => (
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
      </Grid>
    </Box>
  );
};

export default ScanOptions;