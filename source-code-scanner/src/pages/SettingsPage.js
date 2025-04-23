import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  FormGroup,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Alert,
  Tabs,
  Tab,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Code as CodeIcon,
  Storage as StorageIcon,
  Notifications as NotificationsIcon,
  Lock as LockIcon,
  Save as SaveIcon,
  HelpOutline as HelpIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const SettingsPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    semgrepPath: '/usr/local/bin/semgrep',
    snykPath: '/usr/bin/snyk',
    clangtidyPath: '/usr/bin/clang-tidy',
    rulesDirectory: '/path/to/rules',
    outputDirectory: '/path/to/output',
    enableNotifications: true,
    enableAutoScan: false,
    scanOnSave: true,
    maxThreads: 4,
    defaultSeverity: 'medium',
    timeout: 300,
  });

  const [customRules, setCustomRules] = useState([
    { id: 1, name: 'Custom Security Rule 1', path: '/rules/security/custom1.yaml', enabled: true },
    { id: 2, name: 'Memory Check Rule', path: '/rules/memory/mem_check.yaml', enabled: true },
    { id: 3, name: 'Performance Rule Suite', path: '/rules/performance/perf_suite.yaml', enabled: false },
  ]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFormChange = (event) => {
    const { name, value, checked } = event.target;
    const newValue = event.target.type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue,
    });
  };

  const handleSaveSettings = () => {
    // In a real application, this would save settings to backend
    console.log('Saving settings:', formData);
    // Show success message
  };

  const handleRuleToggle = (ruleId) => {
    setCustomRules(customRules.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const handleAddRule = () => {
    // This would open a dialog to add a new rule
    console.log('Add new rule');
  };

  const testToolConnection = (tool) => {
    // This would test the connection to the selected tool
    console.log(`Testing connection to ${tool}`);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable" 
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<CodeIcon />} label="Tools" iconPosition="start" />
          <Tab icon={<SecurityIcon />} label="Rules" iconPosition="start" />
          <Tab icon={<StorageIcon />} label="Storage" iconPosition="start" />
          <Tab icon={<NotificationsIcon />} label="Notifications" iconPosition="start" />
          <Tab icon={<LockIcon />} label="Security" iconPosition="start" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Analysis Tools Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure the paths to your installed tools. Make sure the paths are correct and the tools are properly installed.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardHeader 
                      title="Semgrep" 
                      subheader="Static Analysis Tool"
                      action={
                        <IconButton 
                          aria-label="test connection"
                          onClick={() => testToolConnection('semgrep')}
                        >
                          <RefreshIcon />
                        </IconButton>
                      }
                    />
                    <CardContent>
                      <TextField 
                        fullWidth 
                        label="Path to Semgrep" 
                        variant="outlined"
                        name="semgrepPath"
                        value={formData.semgrepPath}
                        onChange={handleFormChange}
                        helperText="Specify the full path to the semgrep executable"
                        sx={{ mb: 2 }}
                      />
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => testToolConnection('semgrep')}
                      >
                        Test Connection
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card variant="outlined">
                    <CardHeader 
                      title="Snyk" 
                      subheader="Vulnerability Scanner"
                      action={
                        <IconButton 
                          aria-label="test connection"
                          onClick={() => testToolConnection('snyk')}
                        >
                          <RefreshIcon />
                        </IconButton>
                      }
                    />
                    <CardContent>
                      <TextField 
                        fullWidth 
                        label="Path to Snyk" 
                        variant="outlined"
                        name="snykPath"
                        value={formData.snykPath}
                        onChange={handleFormChange}
                        helperText="Specify the full path to the snyk executable"
                        sx={{ mb: 2 }}
                      />
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => testToolConnection('snyk')}
                      >
                        Test Connection
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardHeader 
                      title="ClangTidy" 
                      subheader="C/C++ Linter"
                      action={
                        <IconButton 
                          aria-label="test connection"
                          onClick={() => testToolConnection('clangtidy')}
                        >
                          <RefreshIcon />
                        </IconButton>
                      }
                    />
                    <CardContent>
                      <TextField 
                        fullWidth 
                        label="Path to ClangTidy" 
                        variant="outlined"
                        name="clangtidyPath"
                        value={formData.clangtidyPath}
                        onChange={handleFormChange}
                        helperText="Specify the full path to the clang-tidy executable"
                        sx={{ mb: 2 }}
                      />
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => testToolConnection('clangtidy')}
                      >
                        Test Connection
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card variant="outlined">
                    <CardHeader 
                      title="Performance Settings" 
                      subheader="Configure scan performance"
                    />
                    <CardContent>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Maximum Threads</InputLabel>
                        <Select
                          name="maxThreads"
                          value={formData.maxThreads}
                          label="Maximum Threads"
                          onChange={handleFormChange}
                        >
                          <MenuItem value={1}>1 (Minimum)</MenuItem>
                          <MenuItem value={2}>2</MenuItem>
                          <MenuItem value={4}>4</MenuItem>
                          <MenuItem value={8}>8</MenuItem>
                          <MenuItem value={16}>16 (Maximum)</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <TextField 
                        fullWidth 
                        label="Scan Timeout (seconds)" 
                        variant="outlined"
                        name="timeout"
                        type="number"
                        value={formData.timeout}
                        onChange={handleFormChange}
                        helperText="Maximum time in seconds for a scan to complete"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {tabValue === 1 && (
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
                    name="rulesDirectory"
                    value={formData.rulesDirectory}
                    onChange={handleFormChange}
                    helperText="Directory containing custom rule definitions"
                    sx={{ mb: 3 }}
                  />
                  
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Default Severity</InputLabel>
                    <Select
                      name="defaultSeverity"
                      value={formData.defaultSeverity}
                      label="Default Severity"
                      onChange={handleFormChange}
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
                          checked={formData.scanOnSave} 
                          onChange={handleFormChange}
                          name="scanOnSave"
                        />
                      } 
                      label="Scan files on save" 
                    />
                    <FormControlLabel 
                      control={
                        <Switch 
                          checked={formData.enableAutoScan} 
                          onChange={handleFormChange}
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
                        onClick={handleAddRule}
                      >
                        Add Rule
                      </Button>
                    </Box>
                    <Divider />
                    <List>
                      {customRules.map((rule) => (
                        <React.Fragment key={rule.id}>
                          <ListItem
                            secondaryAction={
                              <Box>
                                <Switch
                                  edge="end"
                                  checked={rule.enabled}
                                  onChange={() => handleRuleToggle(rule.id)}
                                />
                                <IconButton edge="end" aria-label="edit">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton edge="end" aria-label="delete">
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            }
                          >
                            <ListItemIcon>
                              <CodeIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={rule.name}
                              secondary={rule.path}
                            />
                          </ListItem>
                          {customRules.indexOf(rule) < customRules.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Paper>
                  
                  <Alert severity="info">
                    Custom rules allow you to define specific patterns to look for in your code. Rules are written in YAML format.
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Storage Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure where scan results and reports are stored.
              </Typography>
              
              <TextField 
                fullWidth 
                label="Output Directory" 
                variant="outlined"
                name="outputDirectory"
                value={formData.outputDirectory}
                onChange={handleFormChange}
                helperText="Directory where scan results and reports will be saved"
                sx={{ mb: 3 }}
              />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Report Format</InputLabel>
                    <Select
                      defaultValue="json"
                    >
                      <MenuItem value="json">JSON</MenuItem>
                      <MenuItem value="html">HTML</MenuItem>
                      <MenuItem value="pdf">PDF</MenuItem>
                      <MenuItem value="csv">CSV</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Log Level</InputLabel>
                    <Select
                      defaultValue="info"
                    >
                      <MenuItem value="error">Error</MenuItem>
                      <MenuItem value="warning">Warning</MenuItem>
                      <MenuItem value="info">Info</MenuItem>
                      <MenuItem value="debug">Debug</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Data Retention
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Keep scan reports for</InputLabel>
                  <Select
                    defaultValue={90}
                  >
                    <MenuItem value={30}>30 days</MenuItem>
                    <MenuItem value={60}>60 days</MenuItem>
                    <MenuItem value={90}>90 days</MenuItem>
                    <MenuItem value={180}>180 days</MenuItem>
                    <MenuItem value={365}>1 year</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="outlined">Clear All Reports</Button>
              </Box>
            </Box>
          )}
          
          {tabValue === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Notification Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure how and when you receive notifications about scans and vulnerabilities.
              </Typography>
              
              <FormGroup sx={{ mb: 3 }}>
                <FormControlLabel 
                  control={
                    <Switch 
                      checked={formData.enableNotifications} 
                      onChange={handleFormChange}
                      name="enableNotifications"
                    />
                  } 
                  label="Enable notifications" 
                />
              </FormGroup>
              
              <Typography variant="subtitle1" gutterBottom>
                Notification Triggers
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel 
                    control={<Switch defaultChecked />} 
                    label="When scan completes" 
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel 
                    control={<Switch defaultChecked />} 
                    label="When critical vulnerabilities found" 
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel 
                    control={<Switch />} 
                    label="When high vulnerabilities found" 
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel 
                    control={<Switch />} 
                    label="Daily summary" 
                  />
                </Grid>
              </Grid>
              
              <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>
                Notification Methods
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel 
                    control={<Switch defaultChecked />} 
                    label="Browser notifications" 
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel 
                    control={<Switch />} 
                    label="Email notifications" 
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <TextField 
                  fullWidth 
                  label="Email Address" 
                  variant="outlined"
                  placeholder="Enter email for notifications"
                  helperText="Email for receiving notifications (optional)"
                />
              </Box>
            </Box>
          )}
          
          {tabValue === 4 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Security Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure security settings for the application.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Authentication
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Authentication Method</InputLabel>
                    <Select
                      defaultValue="local"
                    >
                      <MenuItem value="local">Local Authentication</MenuItem>
                      <MenuItem value="ldap">LDAP</MenuItem>
                      <MenuItem value="oauth">OAuth 2.0</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControlLabel 
                    control={<Switch defaultChecked />} 
                    label="Require login for all operations" 
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    API Access
                  </Typography>
                  <FormControlLabel 
                    control={<Switch defaultChecked />} 
                    label="Enable API access" 
                  />
                  <Box sx={{ mt: 2 }}>
                    <Button variant="outlined" color="primary">
                      Manage API Keys
                    </Button>
                  </Box>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Sensitive Data
              </Typography>
              <FormControlLabel 
                control={<Switch defaultChecked />} 
                label="Redact sensitive information in reports" 
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This will hide sensitive information such as file paths, usernames, and API keys in generated reports.
              </Typography>
            </Box>
          )}
        </Box>
        
        <Divider />
        
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
          >
            Save Settings
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default SettingsPage;