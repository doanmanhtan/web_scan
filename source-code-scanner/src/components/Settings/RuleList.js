import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Button,
  Badge,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Code as CodeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  BugReport as BugIcon,
  Security as SecurityIcon,
  Speed as PerformanceIcon,
  Style as StyleIcon,
  Memory as MemoryIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  getRules,
  getRulesByCategory,
  getRulesByScanner,
  getEnabledRules,
  createRule,
  updateRule,
  deleteRule,
} from '../../services/ruleService';
import { useSnackbar } from 'notistack';
import RuleDetailView from './RuleDetailView';

const RuleList = ({ onRuleSelect, showDetailView = true }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedScanner, setSelectedScanner] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [showEnabledOnly, setShowEnabledOnly] = useState(false);
  
  // Detail view state
  const [selectedRuleId, setSelectedRuleId] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  
  const { enqueueSnackbar } = useSnackbar();

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      let fetchedRules;
      
      if (selectedCategory !== 'all') {
        fetchedRules = await getRulesByCategory(selectedCategory);
      } else if (selectedScanner !== 'all') {
        fetchedRules = await getRulesByScanner(selectedScanner);
      } else if (showEnabledOnly) {
        fetchedRules = await getEnabledRules();
      } else {
        fetchedRules = await getRules();
      }
      
      setRules(Array.isArray(fetchedRules.data) ? fetchedRules.data : fetchedRules);
      setError(null);
    } catch (err) {
      setError(err.message);
      enqueueSnackbar('Failed to fetch rules', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedScanner, showEnabledOnly, enqueueSnackbar]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleToggleStatus = async (ruleId, currentStatus) => {
    try {
      const ruleToUpdate = rules.find(rule => rule.id === ruleId);
      if (!ruleToUpdate) return;

      const updatedRule = { ...ruleToUpdate, enabled: !currentStatus };
      await updateRule(ruleId, updatedRule);
      
      setRules(rules.map(rule => 
        rule.id === ruleId ? updatedRule : rule
      ));
      enqueueSnackbar(`Rule ${updatedRule.enabled ? 'enabled' : 'disabled'} successfully`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await deleteRule(ruleId);
        setRules(rules.filter(rule => rule.id !== ruleId));
        enqueueSnackbar('Rule deleted successfully', { variant: 'success' });
      } catch (err) {
        enqueueSnackbar(err.message, { variant: 'error' });
      }
    }
  };

  const handleViewRule = (ruleId) => {
    if (showDetailView) {
      setSelectedRuleId(ruleId);
      setShowDetail(true);
    } else if (onRuleSelect) {
      onRuleSelect(ruleId);
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedRuleId(null);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
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

  const getCategoryColor = (category) => {
    switch (category) {
      case 'security':
        return 'error';
      case 'performance':
        return 'info';
      case 'style':
        return 'warning';
      case 'memory':
        return 'secondary';
      case 'quality':
        return 'success';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'high':
        return <ErrorIcon color="error" />;
      case 'medium':
        return <WarningIcon color="warning" />;
      case 'low':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="action" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rule.description && rule.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSeverity = selectedSeverity === 'all' || rule.severity === selectedSeverity;
    return matchesSearch && matchesSeverity;
  });

  const categories = ['all', 'security', 'performance', 'style', 'memory', 'quality'];
  const scanners = ['all', 'semgrep', 'snyk', 'clangtidy', 'cppcheck'];
  const severities = ['all', 'critical', 'high', 'medium', 'low'];

  const stats = {
    total: rules.length,
    enabled: rules.filter(r => r.enabled).length,
    security: rules.filter(r => r.category === 'security').length,
    performance: rules.filter(r => r.category === 'performance').length,
    style: rules.filter(r => r.category === 'style').length,
    memory: rules.filter(r => r.category === 'memory').length,
  };

  if (showDetail && selectedRuleId) {
    return (
      <RuleDetailView 
        ruleId={selectedRuleId}
        onClose={handleCloseDetail}
        onUpdate={fetchRules}
      />
    );
  }

  return (
    <Box>
      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Total
              </Typography>
              <Typography variant="h4">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Enabled
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.enabled}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Security
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.security}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Performance
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.performance}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Style
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.style}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Memory
              </Typography>
              <Typography variant="h4" color="secondary.main">
                {stats.memory}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
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
          </Grid>
          <Grid xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
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
          </Grid>
          <Grid xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Severity</InputLabel>
              <Select
                value={selectedSeverity}
                label="Severity"
                onChange={(e) => setSelectedSeverity(e.target.value)}
              >
                {severities.map(sev => (
                  <MenuItem key={sev} value={sev}>
                    {sev === 'all' ? 'All Severities' : sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant={showEnabledOnly ? "contained" : "outlined"}
              onClick={() => setShowEnabledOnly(!showEnabledOnly)}
              startIcon={<CheckIcon />}
            >
              {showEnabledOnly ? 'Show All' : 'Enabled Only'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Rules List */}
      <Paper>
        {loading ? (
          <Box sx={{ p: 2 }}>
            {[...Array(5)].map((_, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Skeleton variant="rectangular" height={60} />
              </Box>
            ))}
          </Box>
        ) : (
          <List>
            {filteredRules.map((rule, index) => (
              <React.Fragment key={rule.id}>
                <ListItem>
                  <ListItemIcon>
                    {getCategoryIcon(rule.category)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">
                          {rule.name}
                        </Typography>
                        <Chip 
                          label={rule.category} 
                          size="small" 
                          color={getCategoryColor(rule.category)}
                        />
                        {rule.severity && (
                          <Chip 
                            label={rule.severity} 
                            size="small" 
                            color={getSeverityColor(rule.severity)}
                            variant="outlined"
                          />
                        )}
                        {rule.scanner && (
                          <Chip 
                            label={rule.scanner} 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {rule.description || 'No description available'}
                        </Typography>
                        {rule.path && (
                          <Typography variant="caption" color="text.secondary">
                            Path: {rule.path}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {rule.severity && getSeverityIcon(rule.severity)}
                      <Switch
                        edge="end"
                        checked={rule.enabled}
                        onChange={() => handleToggleStatus(rule.id, rule.enabled)}
                      />
                      <Tooltip title="View Details">
                        <IconButton edge="end" onClick={() => handleViewRule(rule.id)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Rule">
                        <IconButton edge="end">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Rule">
                        <IconButton edge="end" onClick={() => handleDeleteRule(rule.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredRules.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
            {filteredRules.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No rules found"
                  secondary={
                    searchTerm || selectedCategory !== 'all' || selectedScanner !== 'all' || selectedSeverity !== 'all'
                      ? "Try adjusting your search or filters"
                      : "No rules are currently available"
                  }
                />
              </ListItem>
            )}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default RuleList; 