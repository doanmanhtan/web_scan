import React, { useState } from 'react';
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
} from '@mui/icons-material';

// Mock data for rules
const mockRules = [
  { id: 1, name: 'Buffer Overflow', category: 'security', tool: 'semgrep', enabled: true },
  { id: 2, name: 'Memory Leak', category: 'security', tool: 'clangtidy', enabled: true },
  { id: 3, name: 'Use After Free', category: 'security', tool: 'snyk', enabled: true },
  { id: 4, name: 'Integer Overflow', category: 'security', tool: 'clangtidy', enabled: true },
  { id: 5, name: 'Format String Vulnerability', category: 'security', tool: 'semgrep', enabled: true },
  { id: 6, name: 'Unused Variable', category: 'style', tool: 'clangtidy', enabled: false },
  { id: 7, name: 'Unreachable Code', category: 'style', tool: 'semgrep', enabled: false },
  { id: 8, name: 'Magic Number', category: 'style', tool: 'clangtidy', enabled: false },
  { id: 9, name: 'Inefficient Algorithm', category: 'performance', tool: 'semgrep', enabled: true },
  { id: 10, name: 'Expensive Copy', category: 'performance', tool: 'clangtidy', enabled: true },
];

const ScanOptions = ({ onScanTypeChange, onToolSelection, selectedTools, scanType = 'all' }) => {
  const [ruleDirectory, setRuleDirectory] = useState('./rules');
  const [includeWarnings, setIncludeWarnings] = useState(true);
  const [generateReport, setGenerateReport] = useState(true);
  const [selectedRules, setSelectedRules] = useState(mockRules.filter(rule => rule.enabled).map(rule => rule.id));
  const [expandedCategory, setExpandedCategory] = useState('security');

  const handleScanTypeChange = (event) => {
    const newScanType = event.target.value;
    
    // Update selected rules based on scan type
    if (newScanType === 'all') {
      setSelectedRules(mockRules.map(rule => rule.id));
    } else if (newScanType === 'security') {
      setSelectedRules(mockRules.filter(rule => rule.category === 'security').map(rule => rule.id));
    } else if (newScanType === 'style') {
      setSelectedRules(mockRules.filter(rule => rule.category === 'style').map(rule => rule.id));
    } else if (newScanType === 'performance') {
      setSelectedRules(mockRules.filter(rule => rule.category === 'performance').map(rule => rule.id));
    } else if (newScanType === 'custom') {
      // Keep current selection for custom
    }
    
    // Notify parent component
    if (onScanTypeChange) {
      onScanTypeChange(event);
    }
  };

  const handleToolSelection = (tool) => {
    if (onToolSelection) {
      onToolSelection(tool);
    }
  };

  const handleRuleToggle = (ruleId) => {
    setSelectedRules(prevSelectedRules => {
      if (prevSelectedRules.includes(ruleId)) {
        return prevSelectedRules.filter(id => id !== ruleId);
      } else {
        return [...prevSelectedRules, ruleId];
      }
    });
  };

  const handleCategoryExpand = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const countRulesByCategory = (category) => {
    return mockRules.filter(rule => rule.category === category).length;
  };

  const countSelectedRulesByCategory = (category) => {
    return mockRules
      .filter(rule => rule.category === category && selectedRules.includes(rule.id))
      .length;
  };

  return (
    <Box>
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
            value={ruleDirectory}
            onChange={(e) => setRuleDirectory(e.target.value)}
            helperText="Directory containing custom rule definitions"
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Select Analysis Tools
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['semgrep', 'snyk', 'clangtidy','cppcheck','clangStaticAnalyzer'].map((tool) => (
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
            control={
              <Switch 
                checked={includeWarnings} 
                onChange={(e) => setIncludeWarnings(e.target.checked)} 
              />
            }
            label="Include warnings"
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch 
                checked={generateReport} 
                onChange={(e) => setGenerateReport(e.target.checked)} 
              />
            }
            label="Generate detailed report"
          />
        </Grid>
        
        {scanType === 'custom' && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Custom Rule Selection
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select the specific rules you want to include in your scan.
              </Typography>
              
              {['security', 'style', 'performance'].map((category) => (
                <Accordion 
                  key={category}
                  expanded={expandedCategory === category}
                  onChange={() => handleCategoryExpand(category)}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                      <Typography sx={{ textTransform: 'capitalize' }}>{category}</Typography>
                      <Chip 
                        size="small" 
                        label={`${countSelectedRulesByCategory(category)}/${countRulesByCategory(category)}`} 
                        color={countSelectedRulesByCategory(category) > 0 ? "primary" : "default"}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {mockRules
                        .filter(rule => rule.category === category)
                        .map((rule) => (
                          <ListItem key={rule.id}>
                            <ListItemIcon>
                              {selectedRules.includes(rule.id) ? 
                                <CheckCircleIcon color="primary" /> : 
                                <BugIcon color="disabled" />
                              }
                            </ListItemIcon>
                            <ListItemText 
                              primary={rule.name} 
                              secondary={`Tool: ${rule.tool}`} 
                            />
                            <ListItemSecondaryAction>
                              <Switch
                                edge="end"
                                checked={selectedRules.includes(rule.id)}
                                onChange={() => handleRuleToggle(rule.id)}
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="outlined" 
                  startIcon={<SaveIcon />}
                >
                  Save Rule Set
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<SettingsIcon />}
                >
                  Advanced Options
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ScanOptions;