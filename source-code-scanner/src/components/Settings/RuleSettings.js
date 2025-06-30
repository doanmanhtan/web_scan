import React, { useState, useEffect, useCallback } from 'react';
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
  Grid,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Code as CodeIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Description as DescriptionIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  BugReport as BugIcon,
  Security as SecurityIcon,
  Speed as PerformanceIcon,
  Style as StyleIcon,
  Memory as MemoryIcon,
  CheckCircle as CheckIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
} from '@mui/icons-material';
import { 
  getRules, 
  createRule, 
  updateRule, 
  deleteRule, 
  getRulesByCategory,
  getRuleStats,
  importRules,
  exportRules,
  getRuleTemplates,
  createRuleFromTemplate
} from '../../services/ruleService';
import { useSnackbar } from 'notistack';
import RuleDetailView from './RuleDetailView';

const RuleSettings = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    description: '',
    path: '',
    category: 'security',
    scanner: 'semgrep',
    severity: 'medium',
    enabled: true,
    content: ''
  });

  // Detail view state
  const [selectedRuleId, setSelectedRuleId] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);
  
  // Filter and search state
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedScanner, setSelectedScanner] = useState('all');
  
  // Stats state
  const [ruleStats, setRuleStats] = useState(null);
  
  // Template state
  const [templates, setTemplates] = useState([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  
  const { enqueueSnackbar } = useSnackbar();

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching rules from API...');
      const response = await getRules();
      console.log('API Response:', response);
      
      // Xử lý response dựa trên cấu trúc thực tế từ backend
      let rulesData = [];
      if (response) {
        if (Array.isArray(response)) {
          rulesData = response;
        } else if (response.data && Array.isArray(response.data)) {
          rulesData = response.data;
        } else if (response.rules && Array.isArray(response.rules)) {
          rulesData = response.rules;
        } else {
          console.warn('Unexpected response structure:', response);
          rulesData = [];
        }
      }
      
      setRules(rulesData);
      console.log('Rules loaded:', rulesData.length);
      
    } catch (err) {
      console.error('Error fetching rules:', err);
      setError(`Failed to load rules: ${err.message}`);
      enqueueSnackbar(`Failed to fetch rules: ${err.message}`, { variant: 'error' });
      setRules([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  const calculateStats = useCallback(() => {
    const stats = {
      total: rules.length,
      enabled: rules.filter(r => r.enabled).length,
      security: rules.filter(r => r.category === 'security').length,
      custom: rules.filter(r => r.isCustom || r.custom).length
    };
    setRuleStats(stats);
  }, [rules]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  useEffect(() => {
    if (rules.length >= 0) {
      calculateStats();
    }
  }, [rules, calculateStats]);

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

  const handleRuleToggle = async (ruleId) => {
    try {
      const ruleToUpdate = rules.find(rule => rule.id === ruleId);
      if (!ruleToUpdate) return;

      const updatedRule = { ...ruleToUpdate, enabled: !ruleToUpdate.enabled };
      
      // Update on server
      await updateRule(ruleId, updatedRule);
      
      // Update local state
      setRules(rules.map(rule => 
        rule.id === ruleId ? updatedRule : rule
      ));
      
      enqueueSnackbar(
        `Rule ${updatedRule.enabled ? 'enabled' : 'disabled'} successfully`, 
        { variant: 'success' }
      );
    } catch (err) {
      console.error('Error toggling rule:', err);
      enqueueSnackbar(`Failed to toggle rule: ${err.message}`, { variant: 'error' });
    }
  };

  const handleOpenAddDialog = () => {
    setDialogType('add');
    setNewRule({
      name: '',
      description: '',
      path: '',
      category: 'security',
      scanner: 'semgrep',
      severity: 'medium',
      enabled: true,
      content: ''
    });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (rule) => {
    setDialogType('edit');
    setEditRule(rule);
    setNewRule({
      name: rule.name || '',
      description: rule.description || '',
      path: rule.path || '',
      category: rule.category || 'security',
      scanner: rule.scanner || 'semgrep',
      severity: rule.severity || 'medium',
      enabled: rule.enabled !== undefined ? rule.enabled : true,
      content: rule.content || ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditRule(null);
  };

  const handleNewRuleChange = (event) => {
    const { name, value, checked } = event.target;
    setNewRule(prev => ({
      ...prev,
      [name]: name === 'enabled' ? checked : value
    }));
  };

  const handleSaveRule = async () => {
    try {
      if (!newRule.name.trim()) {
        enqueueSnackbar('Rule name is required', { variant: 'error' });
        return;
      }

      if (dialogType === 'add') {
        const createdRule = await createRule(newRule);
        console.log('Rule created:', createdRule);
        enqueueSnackbar('Rule created successfully', { variant: 'success' });
      } else {
        const updatedRule = await updateRule(editRule.id, newRule);
        console.log('Rule updated:', updatedRule);
        enqueueSnackbar('Rule updated successfully', { variant: 'success' });
      }
      
      await fetchRules(); // Refresh the list
      setOpenDialog(false);
    } catch (err) {
      console.error('Error saving rule:', err);
      enqueueSnackbar(`Failed to save rule: ${err.message}`, { variant: 'error' });
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) {
      return;
    }

    try {
      await deleteRule(ruleId);
      enqueueSnackbar('Rule deleted successfully', { variant: 'success' });
      await fetchRules(); // Refresh the list
    } catch (err) {
      console.error('Error deleting rule:', err);
      enqueueSnackbar(`Failed to delete rule: ${err.message}`, { variant: 'error' });
    }
  };

  const handleViewRule = (ruleId) => {
    setSelectedRuleId(ruleId);
    setShowDetailView(true);
  };

  const handleCloseDetailView = () => {
    setShowDetailView(false);
    setSelectedRuleId(null);
  };

  const handleImportRules = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          let importedRules = [];
          
          if (file.name.endsWith('.json')) {
            importedRules = JSON.parse(content);
          } else if (file.name.endsWith('.yml') || file.name.endsWith('.yaml')) {
            enqueueSnackbar('YAML import not supported yet. Please use JSON format.', { variant: 'warning' });
            return;
          }
          
          if (Array.isArray(importedRules)) {
            // Show preview dialog or directly add rules
            enqueueSnackbar(`Found ${importedRules.length} rules to import`, { variant: 'info' });
            // Here you would typically show a preview dialog
            // For now, just show the count
          } else {
            enqueueSnackbar('Invalid file format. Expected an array of rules.', { variant: 'error' });
          }
        } catch (err) {
          enqueueSnackbar('Failed to parse file: ' + err.message, { variant: 'error' });
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    event.target.value = '';
  };

  const handleExportRules = () => {
    try {
      const rulesData = JSON.stringify(rules, null, 2);
      const blob = new Blob([rulesData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rules_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('Rules exported successfully', { variant: 'success' });
    } catch (err) {
      console.error('Error exporting rules:', err);
      enqueueSnackbar(`Failed to export rules: ${err.message}`, { variant: 'error' });
    }
  };

  const handleCreateFromTemplate = async (templateId) => {
    // Since templates API is not available, show a message
    enqueueSnackbar('Template feature not available. Please create rules manually.', { variant: 'info' });
    setTemplateDialogOpen(false);
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'security':
        return 'error';
      case 'memory':
        return 'warning';
      case 'performance':
        return 'info';
      case 'quality':
        return 'success';
      case 'standard':
      case 'style':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'security':
        return <SecurityIcon />;
      case 'performance':
        return <PerformanceIcon />;
      case 'style':
        return <StyleIcon />;
      case 'memory':
        return <MemoryIcon />;
      default:
        return <BugIcon />;
    }
  };

  const filteredRules = rules.filter(rule => {
    if (!rule) return false;
    
    const matchesSearch = rule.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         false;
    const matchesCategory = selectedCategory === 'all' || rule.category === selectedCategory;
    const matchesScanner = selectedScanner === 'all' || rule.scanner === selectedScanner;
    return matchesSearch && matchesCategory && matchesScanner;
  });

  const categories = ['all', 'security', 'performance', 'style', 'memory', 'quality'];
  const scanners = ['all', 'semgrep', 'snyk', 'clangtidy', 'cppcheck'];

  if (showDetailView && selectedRuleId) {
    return (
      <RuleDetailView 
        ruleId={selectedRuleId}
        onClose={handleCloseDetailView}
        onUpdate={fetchRules}
      />
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Rules Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Manage your scan rules and custom rule configurations.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Statistics Cards */}
      {ruleStats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Rules
                </Typography>
                <Typography variant="h4">
                  {ruleStats.total || rules.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Enabled Rules
                </Typography>
                <Typography variant="h4">
                  {ruleStats.enabled || rules.filter(r => r.enabled).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Security Rules
                </Typography>
                <Typography variant="h4">
                  {ruleStats.security || rules.filter(r => r.category === 'security').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Custom Rules
                </Typography>
                <Typography variant="h4">
                  {ruleStats.custom || rules.filter(r => r.isCustom || r.custom).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
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
            <CardHeader 
              title="Custom Rules"
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    startIcon={<AddIcon />}
                    variant="contained"
                    size="small"
                    onClick={handleOpenAddDialog}
                  >
                    Add Rule
                  </Button>
                  <Button
                    startIcon={<ImportIcon />}
                    variant="outlined"
                    size="small"
                    component="label"
                    title="Import rules from file"
                  >
                    Import
                    <input
                      type="file"
                      hidden
                      accept=".json,.yaml,.yml"
                      onChange={handleImportRules}
                    />
                  </Button>
                  <Button
                    startIcon={<ExportIcon />}
                    variant="outlined"
                    size="small"
                    onClick={handleExportRules}
                    disabled={rules.length === 0}
                    title="Export current rules to JSON file"
                  >
                    Export
                  </Button>
                </Box>
              }
            />
            <Divider />
            
            {/* Search and Filter */}
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                placeholder="Search rules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <MenuItem key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Scanner</InputLabel>
                  <Select
                    value={selectedScanner}
                    label="Scanner"
                    onChange={(e) => setSelectedScanner(e.target.value)}
                  >
                    {scanners.map(scanner => (
                      <MenuItem key={scanner} value={scanner}>
                        {scanner === 'all' ? 'All Scanners' : scanner}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            
            {loading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Loading rules...</Typography>
              </Box>
            ) : (
              <List>
                {filteredRules.map((rule, index) => (
                  <React.Fragment key={rule.id || index}>
                    <ListItem>
                      <ListItemIcon>
                        {getCategoryIcon(rule.category)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {rule.name || 'Unnamed Rule'}
                            <Chip 
                              label={rule.category || 'unknown'} 
                              size="small" 
                              color={getCategoryColor(rule.category)}
                              sx={{ ml: 1 }}
                            />
                            {rule.severity && (
                              <Chip 
                                label={rule.severity} 
                                size="small" 
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={rule.description || rule.path || 'No description'}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          edge="end"
                          checked={rule.enabled || false}
                          onChange={() => handleRuleToggle(rule.id)}
                        />
                        <Tooltip title="View Details">
                          <IconButton edge="end" onClick={() => handleViewRule(rule.id)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Rule">
                          <IconButton edge="end" onClick={() => handleOpenEditDialog(rule)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Rule">
                          <IconButton edge="end" onClick={() => handleDeleteRule(rule.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredRules.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
                {filteredRules.length === 0 && !loading && (
                  <ListItem>
                    <ListItemText
                      primary="No rules found"
                      secondary={searchTerm || selectedCategory !== 'all' || selectedScanner !== 'all' 
                        ? "Try adjusting your search or filters" 
                        : "Click 'Add Rule' to create a new rule"}
                    />
                  </ListItem>
                )}
              </List>
            )}
          </Paper>
          
          <Alert severity="info" icon={<DescriptionIcon />}>
            Custom rules allow you to define specific patterns to look for in your code. Rules are written in YAML format.
          </Alert>
        </Grid>
      </Grid>
      
      {/* Add/Edit Rule Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
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
            label="Description"
            name="description"
            value={newRule.description || ''}
            onChange={handleNewRuleChange}
            margin="normal"
            multiline
            rows={3}
          />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={newRule.category}
                  label="Category"
                  onChange={handleNewRuleChange}
                >
                  <MenuItem value="security">Security</MenuItem>
                  <MenuItem value="performance">Performance</MenuItem>
                  <MenuItem value="style">Style</MenuItem>
                  <MenuItem value="memory">Memory</MenuItem>
                  <MenuItem value="quality">Quality</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Scanner</InputLabel>
                <Select
                  name="scanner"
                  value={newRule.scanner || 'semgrep'}
                  label="Scanner"
                  onChange={handleNewRuleChange}
                >
                  <MenuItem value="semgrep">Semgrep</MenuItem>
                  <MenuItem value="snyk">Snyk</MenuItem>
                  <MenuItem value="clangtidy">Clang-tidy</MenuItem>
                  <MenuItem value="cppcheck">Cppcheck</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Severity</InputLabel>
            <Select
              name="severity"
              value={newRule.severity || 'medium'}
              label="Severity"
              onChange={handleNewRuleChange}
            >
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Rule Content"
            name="content"
            value={newRule.content || ''}
            onChange={handleNewRuleChange}
            margin="normal"
            multiline
            minRows={6}
            helperText="Paste your rule YAML/JSON content here"
          />
          <FormControlLabel
            control={
              <Switch
                name="enabled"
                checked={newRule.enabled}
                onChange={handleNewRuleChange}
              />
            }
            label="Enable rule"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveRule} 
            variant="contained" 
            color="primary"
            startIcon={<SaveIcon />}
            disabled={!newRule.name?.trim()}
          >
            {dialogType === 'add' ? 'Add Rule' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Dialog - Hidden since API not available */}
      {false && (
        <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)}>
          <DialogTitle>Create Rule from Template</DialogTitle>
          <DialogContent>
            <List>
              {templates.map((template) => (
                <ListItem 
                  key={template.id} 
                  button 
                  onClick={() => handleCreateFromTemplate(template.id)}
                >
                  <ListItemIcon>
                    {getCategoryIcon(template.category)}
                  </ListItemIcon>
                  <ListItemText
                    primary={template.name}
                    secondary={template.description}
                  />
                </ListItem>
              ))}
              {templates.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No templates available"
                    secondary="Templates will be loaded from the server"
                  />
                </ListItem>
              )}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTemplateDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default RuleSettings;