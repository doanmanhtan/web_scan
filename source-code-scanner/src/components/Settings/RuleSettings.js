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
  Pagination,
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

const shortenPath = (fullPath) => {
  if (!fullPath) return '';
  // Lấy 2 phần cuối của path
  const parts = fullPath.split('/');
  if (parts.length <= 2) return fullPath;
  return '.../' + parts.slice(-3).join('/');
};

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

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); // Số rule mỗi trang

  const paginatedRules = rules.filter(rule => {
    if (!rule) return false;
    
    const matchesSearch = rule.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         false;
    const matchesCategory = selectedCategory === 'all' || rule.category === selectedCategory;
    const matchesScanner = selectedScanner === 'all' || rule.scanner === selectedScanner;
    return matchesSearch && matchesCategory && matchesScanner;
  }).slice((page - 1) * rowsPerPage, page * rowsPerPage);

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

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategory, selectedScanner, rowsPerPage]);

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

  const handleImportRules = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        await importRules(file); // Gọi API backend
        enqueueSnackbar('Rules imported successfully', { variant: 'success' });
        await fetchRules(); // Cập nhật lại danh sách rules
      } catch (err) {
        enqueueSnackbar('Failed to import rules: ' + err.message, { variant: 'error' });
      }
    }
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

  // const categories = ['all', 'security', 'performance', 'style', 'memory', 'quality'];
  const categories = ['all'];

  // const scanners = ['all', 'semgrep', 'snyk', 'clangtidy', 'cppcheck','cppcheckCustom', 'ClclangStaticAnalyzeran'];
  const scanners = ['all', 'semgrep','cppcheckCustom'];

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
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Statistics Cards */}
      {ruleStats && (
        <Box display="flex" gap={3} sx={{ mb: 4 }}>
          {/* Total Rules Card - Left Sidebar - 20% width */}
          <Box flex="0 0 20%">
            <Card 
              elevation={0}
              sx={{ 
                height: '100%',
                border: 'none',
                borderRadius: '16px 16px 0 0',
                background: '#ffffff',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 20px rgba(33, 150, 243, 0.15)'
                }
              }}
            >
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Typography 
                  color="textSecondary" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 2, 
                    fontSize: '1rem',
                    color: '#1976d2'
                  }}
                >
                  Total Rules
                </Typography>
                <Typography 
                  variant="h2" 
                  color="primary.main" 
                  fontWeight="bold" 
                  sx={{ 
                    mb: 2,
                    fontSize: '2.5rem',
                    color: '#1976d2'
                  }}
                >
                  {ruleStats.total || rules.length}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#1976d2',
                    fontSize: '0.875rem',
                    opacity: 0.8
                  }}
                >
                  Rules available for scanning
                </Typography>
              </CardContent>
            </Card>
          </Box>
          
          {/* Custom Rules Section - Main Content - 80% width */}
          <Box flex="0 0 80%">
            <Paper 
              elevation={0}
              sx={{ 
                p: 2,
                height: '100%',
                border: 'none',
                borderRadius: 2,
                background: '#ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center">
                  <CodeIcon sx={{ fontSize: 24, mr: 2, color: '#1976d2' }} />
                  <Typography variant="h5" fontWeight="bold" sx={{ color: '#1976d2' }}>
                    Custom Rules
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    startIcon={<AddIcon />}
                    variant="contained"
                    size="small"
                    onClick={handleOpenAddDialog}
                    sx={{
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)',
                      color: 'white',
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 2,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #8e24aa 0%, #5e35b1 100%)'
                      }
                    }}
                  >
                    Add Rule
                  </Button>
                  <Button
                    startIcon={<ImportIcon />}
                    variant="contained"
                    size="small"
                    component="label"
                    title="Import rules from file"
                    sx={{
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)',
                      color: 'white',
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 2,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #8e24aa 0%, #5e35b1 100%)'
                      }
                    }}
                  >
                    Import
                    <input
                      type="file"
                      hidden
                      accept=".json,.yaml,.yml"
                      onChange={handleImportRules}
                    />
                  </Button>
                </Box>
              </Box>
              
              {/* Search and Filter */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  placeholder="Search rules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: '#757575' }} />,
                    sx: {
                      borderRadius: 2,
                      backgroundColor: '#fafafa',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e0e0e0'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2',
                        borderWidth: 2
                      }
                    }
                  }}
                />
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ color: '#757575' }}>Category</InputLabel>
                    <Select
                      value={selectedCategory}
                      label="Category"
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      sx={{
                        borderRadius: 2,
                        backgroundColor: '#fafafa',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e0e0e0'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1976d2'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1976d2',
                          borderWidth: 2
                        }
                      }}
                    >
                      {categories.map(cat => (
                        <MenuItem key={cat} value={cat}>
                          {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ color: '#757575' }}>Scanner</InputLabel>
                    <Select
                      value={selectedScanner}
                      label="Scanner"
                      onChange={(e) => setSelectedScanner(e.target.value)}
                      sx={{
                        borderRadius: 2,
                        backgroundColor: '#fafafa',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e0e0e0'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1976d2'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1976d2',
                          borderWidth: 2
                        }
                      }}
                    >
                      {scanners.map(scanner => (
                        <MenuItem key={scanner} value={scanner}>
                          {scanner === 'all' ? 'All Scanners' : scanner}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <Button
                    startIcon={<ExportIcon />}
                    variant="outlined"
                    size="small"
                    onClick={handleExportRules}
                    disabled={rules.length === 0}
                    title="Export current rules to JSON file"
                    sx={{
                      borderRadius: 2,
                      borderColor: '#1976d2',
                      color: '#1976d2',
                      borderWidth: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        borderColor: '#1565c0',
                        backgroundColor: 'rgba(25, 118, 210, 0.04)'
                      }
                    }}
                  >
                    Export
                  </Button>
                </Box>
              </Box>
              
              {/* Rules List */}
              {loading ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }}>Loading rules...</Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                  <List sx={{ p: 0 }}>
                    {paginatedRules.map((rule, index) => (
                      <React.Fragment key={rule.id || index}>
                        <ListItem sx={{ px: 0, py: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            {getCategoryIcon(rule.category)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
                                <Typography variant="body1" fontWeight={500} sx={{ mr: 1, color: '#212121' }}>
                                  {rule.name || 'Unnamed Rule'}
                                </Typography>
                                <Chip 
                                  label={rule.category || 'unknown'} 
                                  size="small" 
                                  color={getCategoryColor(rule.category)}
                                  sx={{ 
                                    mr: 1,
                                    backgroundColor: '#f5f5f5',
                                    color: '#757575',
                                    fontSize: '0.75rem'
                                  }}
                                />
                                {rule.severity && (
                                  <Chip 
                                    label={rule.severity} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{
                                      fontSize: '0.75rem',
                                      borderColor: '#e0e0e0',
                                      color: '#757575'
                                    }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" sx={{ color: '#757575', fontSize: '0.875rem' }}>
                                {rule.description || shortenPath(rule.path) || 'No description'}
                              </Typography>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              edge="end"
                              checked={rule.enabled || false}
                              onChange={() => handleRuleToggle(rule.id)}
                              sx={{
                                mr: 1,
                                '& .MuiSwitch-switchBase': {
                                  color: '#e0e0e0'
                                },
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: '#1976d2'
                                }
                              }}
                            />
                            <Tooltip title="View Details">
                              <IconButton edge="end" onClick={() => handleViewRule(rule.id)} sx={{ mr: 0.5 }}>
                                <ViewIcon fontSize="small" sx={{ color: '#757575' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Rule">
                              <IconButton edge="end" onClick={() => handleOpenEditDialog(rule)} sx={{ mr: 0.5 }}>
                                <EditIcon fontSize="small" sx={{ color: '#757575' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Rule">
                              <IconButton edge="end" onClick={() => handleDeleteRule(rule.id)}>
                                <DeleteIcon fontSize="small" sx={{ color: '#757575' }} />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < paginatedRules.length - 1 && <Divider variant="inset" component="li" sx={{ ml: 6 }} />}
                      </React.Fragment>
                    ))}
                    {paginatedRules.length === 0 && !loading && (
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
                </Box>
              )}
              
              {/* Pagination and Rows Control */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, pt: 2, borderTop: '1px solid', borderColor: '#e0e0e0' }}>
                <Pagination
                  count={Math.ceil(rules.length / rowsPerPage)}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                  color="primary"
                  size="small"
                  sx={{
                    '& .MuiPaginationItem-root.Mui-selected': {
                      backgroundColor: '#1976d2',
                      color: 'white'
                    }
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel sx={{ color: '#757575' }}>Rows</InputLabel>
                  <Select
                    value={rowsPerPage}
                    label="Rows"
                    onChange={e => setRowsPerPage(Number(e.target.value))}
                    sx={{
                      borderRadius: 2,
                      backgroundColor: '#fafafa',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e0e0e0'
                      }
                    }}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}
      
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
                  value={newRule.category || 'security'}
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
                checked={newRule.enabled !== undefined ? newRule.enabled : true}
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