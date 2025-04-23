import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import {
  Code as CodeIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

// Mock rules
const initialRules = [
  { id: 1, name: 'Custom Security Rule 1', path: '/rules/security/custom1.yaml', category: 'security', enabled: true },
  { id: 2, name: 'Memory Check Rule', path: '/rules/memory/mem_check.yaml', category: 'memory', enabled: true },
  { id: 3, name: 'Performance Rule Suite', path: '/rules/performance/perf_suite.yaml', category: 'performance', enabled: false },
  { id: 4, name: 'Code Quality Checks', path: '/rules/quality/quality_checks.yaml', category: 'quality', enabled: true },
  { id: 5, name: 'C++ Standard Compliance', path: '/rules/standard/cpp_standard.yaml', category: 'standard', enabled: true },
];

const RuleSettings = () => {
  const [rules, setRules] = useState(initialRules);
  const [ruleDirectory, setRuleDirectory] = useState('/path/to/rules');
  const [defaultSeverity, setDefaultSeverity] = useState('medium');
  const [scanOnSave, setScanOnSave] = useState(true);
  const [enableAutoScan, setEnableAutoScan] = useState(false);
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('add'); // 'add' or 'edit'
  const [editRule, setEditRule] = useState(null);
  const [newRule, setNewRule] = useState({
    name: '',
    path: '',
    category: 'security',
    enabled: true
  });

  const handleDirectoryChange = (event) => {
    setRuleDirectory(event.target.value);
  };

  const handleSeverityChange = (event) => {
    setDefaultSeverity(event.target.value);
  };

  const handleSwitchChange = (event) => {
    const { name, checked } = event.target;
    if (name === 'scanOnSave') {
      setScanOnSave(checked);
    } else if (name === 'enableAutoScan') {
      setEnableAutoScan(checked);
    }
  };

  const handleRuleToggle = (ruleId) => {
    setRules(rules.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const handleOpenAddDialog = () => {
    setDialogType('add');
    setNewRule({
      name: '',
      path: '',
      category: 'security',
      enabled: true
    });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (rule) => {
    setDialogType('edit');
    setEditRule(rule);
    setNewRule({
      name: rule.name,
      path: rule.path,
      category: rule.category,
      enabled: rule.enabled
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleNewRuleChange = (event) => {
    const { name, value, checked } = event.target;
    setNewRule({
      ...newRule,
      [name]: name === 'enabled' ? checked : value
    });
  };

  const handleSaveRule = () => {
    if (dialogType === 'add') {
      // Add new rule with a new ID
      const newId = Math.max(...rules.map(r => r.id), 0) + 1;
      setRules([...rules, { ...newRule, id: newId }]);
    } else {
      // Update existing rule
      setRules(rules.map(rule => 
        rule.id === editRule.id ? { ...rule, ...newRule } : rule
      ));
    }
    setOpenDialog(false);
  };

  const handleDeleteRule = (ruleId) => {
    setRules(rules.filter(rule => rule.id !== ruleId));
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'security':
        return 'error';
      case 'memory':
        return 'warning';
      case 'performance':
        return 'info';
      case 'quality':
        return 'success';
      case 'standard':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Rules Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Manage your scan rules and custom rule configurations.
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField 
            fullWidth 
            label="Rules Directory" 
            variant="outlined"
            value={ruleDirectory}
            onChange={handleDirectoryChange}
            helperText="Directory containing custom rule definitions"
            sx={{ mb: 3 }}
          />
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Default Severity</InputLabel>
            <Select
              value={defaultSeverity}
              label="Default Severity"
              onChange={handleSeverityChange}
            >
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
          
          <FormGroup>
            <FormControlLabel 
              control={
                <Switch 
                  checked={scanOnSave} 
                  onChange={handleSwitchChange}
                  name="scanOnSave"
                />
              } 
              label="Scan files on save" 
            />
            <FormControlLabel 
              control={
                <Switch 
                  checked={enableAutoScan} 
                  onChange={handleSwitchChange}
                  name="enableAutoScan"
                />
              } 
              label="Enable automatic periodic scanning" 
            />
          </FormGroup>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ mb: 2 }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1">
                Custom Rules
              </Typography>
              <Button 
                startIcon={<AddIcon />}
                variant="contained"
                size="small"
                onClick={handleOpenAddDialog}
              >
                Add Rule
              </Button>
            </Box>
            <Divider />
            <List>
              {rules.map((rule) => (
                <React.Fragment key={rule.id}>
                  <ListItem>
                    <ListItemIcon>
                      <CodeIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {rule.name}
                          <Chip 
                            label={rule.category} 
                            size="small" 
                            color={getCategoryColor(rule.category)}
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      }
                      secondary={rule.path}
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        edge="end"
                        checked={rule.enabled}
                        onChange={() => handleRuleToggle(rule.id)}
                      />
                      <IconButton edge="end" aria-label="edit" onClick={() => handleOpenEditDialog(rule)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteRule(rule.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {rules.indexOf(rule) < rules.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
              {rules.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No custom rules defined"
                    secondary="Click 'Add Rule' to create a new rule"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
          
          <Alert severity="info" icon={<DescriptionIcon />}>
            Custom rules allow you to define specific patterns to look for in your code. Rules are written in YAML format.
          </Alert>
        </Grid>
      </Grid>
      
      {/* Add/Edit Rule Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogType === 'add' ? 'Add New Rule' : 'Edit Rule'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Rule Name"
            name="name"
            value={newRule.name}
            onChange={handleNewRuleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Rule Path"
            name="path"
            value={newRule.path}
            onChange={handleNewRuleChange}
            margin="normal"
            required
            helperText="Path to the rule file relative to the rules directory"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={newRule.category}
              label="Category"
              onChange={handleNewRuleChange}
            >
              <MenuItem value="security">Security</MenuItem>
              <MenuItem value="memory">Memory</MenuItem>
              <MenuItem value="performance">Performance</MenuItem>
              <MenuItem value="quality">Code Quality</MenuItem>
              <MenuItem value="standard">Standard Compliance</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                name="enabled"
                checked={newRule.enabled}
                onChange={handleNewRuleChange}
              />
            }
            label="Enabled"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveRule} 
            variant="contained" 
            color="primary"
            startIcon={<SaveIcon />}
            disabled={!newRule.name || !newRule.path}
          >
            {dialogType === 'add' ? 'Add Rule' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RuleSettings;