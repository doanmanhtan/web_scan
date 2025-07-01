import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Code as CodeIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  PlayArrow as TestIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  Visibility as ViewIcon,
  BugReport as BugIcon,
  Security as SecurityIcon,
  Speed as PerformanceIcon,
  Style as StyleIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  getRuleById,
  updateRule,
  deleteRule,
  testRule,
  validateRule,
  exportRules,
} from '../../services/ruleService';
import { useSnackbar } from 'notistack';

const RuleDetailView = ({ ruleId, onClose, onUpdate }) => {
  const [rule, setRule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testCode, setTestCode] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (ruleId) {
      fetchRuleDetails();
    }
  }, [ruleId]);

  const fetchRuleDetails = async () => {
    try {
      setLoading(true);
      const ruleData = await getRuleById(ruleId);
      setRule(ruleData.data || ruleData);
      setEditData(ruleData.data || ruleData);
      setError(null);
    } catch (err) {
      setError(err.message);
      enqueueSnackbar('Failed to fetch rule details', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(rule);
  };

  const handleSave = async () => {
    try {
      await updateRule(ruleId, editData);
      setRule(editData);
      setIsEditing(false);
      enqueueSnackbar('Rule updated successfully', { variant: 'success' });
      if (onUpdate) onUpdate();
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await deleteRule(ruleId);
        enqueueSnackbar('Rule deleted successfully', { variant: 'success' });
        if (onClose) onClose();
      } catch (err) {
        enqueueSnackbar(err.message, { variant: 'error' });
      }
    }
  };

  const handleToggleStatus = async () => {
    try {
      const updatedRule = { ...rule, enabled: !rule.enabled };
      await updateRule(ruleId, updatedRule);
      setRule(updatedRule);
      enqueueSnackbar(`Rule ${updatedRule.enabled ? 'enabled' : 'disabled'} successfully`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    }
  };

  const handleTestRule = async () => {
    if (!testCode.trim()) {
      enqueueSnackbar('Please enter sample code to test', { variant: 'warning' });
      return;
    }

    try {
      setTesting(true);
      const results = await testRule(ruleId, testCode);
      setTestResults(results);
      enqueueSnackbar('Rule test completed', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setTesting(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportRules('json');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rule_${ruleId}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('Rule exported successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'security':
        return <SecurityIcon />;
      case 'performance':
        return <PerformanceIcon />;
      case 'style':
        return <StyleIcon />;
      default:
        return <BugIcon />;
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

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading rule details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!rule) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Rule not found
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getCategoryIcon(rule.category)}
            <Typography variant="h5">{rule.name}</Typography>
            <Chip 
              label={rule.category} 
              color="primary" 
              size="small" 
            />
            <Chip 
              label={rule.severity || 'medium'} 
              color={getSeverityColor(rule.severity)} 
              size="small" 
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={rule.enabled}
                  onChange={handleToggleStatus}
                  color="primary"
                />
              }
              label={rule.enabled ? 'Enabled' : 'Disabled'}
            />
            <Button
              startIcon={<TestIcon />}
              variant="outlined"
              onClick={() => setTestDialogOpen(true)}
            >
              Test Rule
            </Button>
            <Button
              startIcon={<ExportIcon />}
              variant="outlined"
              onClick={handleExport}
            >
              Export
            </Button>
            {isEditing ? (
              <>
                <Button
                  startIcon={<SaveIcon />}
                  variant="contained"
                  onClick={handleSave}
                >
                  Save
                </Button>
                <Button
                  startIcon={<CancelIcon />}
                  variant="outlined"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  startIcon={<EditIcon />}
                  variant="outlined"
                  onClick={handleEdit}
                >
                  Edit
                </Button>
                <Button
                  startIcon={<DeleteIcon />}
                  variant="outlined"
                  color="error"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </>
            )}
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          {rule.description || 'No description available'}
        </Typography>
      </Paper>

      {/* Content Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Details" />
          <Tab label="Content" />
          <Tab label="Metadata" />
          <Tab label="Usage" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Rule Name"
                  value={isEditing ? editData.name : rule.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  disabled={!isEditing}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={isEditing ? editData.description : rule.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  disabled={!isEditing}
                  multiline
                  rows={3}
                  margin="normal"
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={isEditing ? editData.category : rule.category}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                    disabled={!isEditing}
                    label="Category"
                  >
                    <MenuItem value="security">Security</MenuItem>
                    <MenuItem value="performance">Performance</MenuItem>
                    <MenuItem value="style">Style</MenuItem>
                    <MenuItem value="memory">Memory</MenuItem>
                    <MenuItem value="quality">Quality</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={isEditing ? editData.severity : rule.severity}
                    onChange={(e) => setEditData({ ...editData, severity: e.target.value })}
                    disabled={!isEditing}
                    label="Severity"
                  >
                    <MenuItem value="critical">Critical</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Scanner/Tool"
                  value={isEditing ? editData.scanner : rule.scanner}
                  onChange={(e) => setEditData({ ...editData, scanner: e.target.value })}
                  disabled={!isEditing}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Rule Path"
                  value={isEditing ? editData.path : rule.path}
                  onChange={(e) => setEditData({ ...editData, path: e.target.value })}
                  disabled={!isEditing}
                  margin="normal"
                />
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Rule Content
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={15}
                value={isEditing ? editData.content : rule.content}
                onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                disabled={!isEditing}
                variant="outlined"
                sx={{ fontFamily: 'monospace' }}
              />
              {isEditing && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={async () => {
                      try {
                        const validation = await validateRule(editData.content);
                        enqueueSnackbar('Rule content is valid', { variant: 'success' });
                      } catch (err) {
                        enqueueSnackbar(err.message, { variant: 'error' });
                      }
                    }}
                  >
                    Validate Content
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Rule Information" />
                  <CardContent>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Created" 
                          secondary={rule.createdAt ? new Date(rule.createdAt).toLocaleDateString() : 'N/A'} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Last Modified" 
                          secondary={rule.updatedAt ? new Date(rule.updatedAt).toLocaleDateString() : 'N/A'} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Author" 
                          secondary={rule.author || 'Unknown'} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Version" 
                          secondary={rule.version || '1.0'} 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Statistics" />
                  <CardContent>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Times Used" 
                          secondary={rule.usageCount || 0} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Success Rate" 
                          secondary={`${rule.successRate || 0}%`} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Last Used" 
                          secondary={rule.lastUsed ? new Date(rule.lastUsed).toLocaleDateString() : 'Never'} 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Usage Examples
              </Typography>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>How to use this rule</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" paragraph>
                    This rule is designed to detect {rule.category} issues in your code.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Scanner:</strong> {rule.scanner}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Severity:</strong> {rule.severity}
                  </Typography>
                  {rule.examples && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Examples:
                      </Typography>
                      <pre style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
                        {rule.examples}
                      </pre>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Test Rule Dialog */}
      <Dialog 
        open={testDialogOpen} 
        onClose={() => setTestDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Test Rule: {rule.name}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Sample Code"
            multiline
            rows={10}
            value={testCode}
            onChange={(e) => setTestCode(e.target.value)}
            placeholder="Enter sample code to test this rule..."
            margin="normal"
            sx={{ fontFamily: 'monospace' }}
          />
          {testResults && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Test Results
              </Typography>
              <Alert severity={testResults.success ? 'success' : 'error'}>
                {testResults.message}
              </Alert>
              {testResults.matches && testResults.matches.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Matches found:
                  </Typography>
                  <List dense>
                    {testResults.matches.map((match, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <BugIcon color="error" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={`Line ${match.line}: ${match.message}`}
                          secondary={match.code}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
          <Button 
            onClick={handleTestRule} 
            variant="contained"
            disabled={testing}
          >
            {testing ? 'Testing...' : 'Test Rule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RuleDetailView; 