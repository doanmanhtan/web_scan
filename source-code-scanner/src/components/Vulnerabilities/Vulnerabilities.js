import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ErrorOutline as ErrorIcon,
  WarningAmber as WarningIcon,
  InfoOutlined as InfoIcon,
  BugReport as BugIcon,
  Code as CodeIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
  GetApp as DownloadIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Comment as CommentIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const VulnerabilitiesPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [expandedPanel, setExpandedPanel] = useState(false);
  
  // Data states
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  
  // Dialog states
  const [statusDialog, setStatusDialog] = useState({ open: false, vulnerability: null });
  const [commentDialog, setCommentDialog] = useState({ open: false, vulnerability: null });
  const [codeDialog, setCodeDialog] = useState({ open: false, vulnerability: null, code: '' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedVuln, setSelectedVuln] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    severity: 'all',
    type: 'all',
    tool: 'all',
    status: 'all',
  });

  // Form states
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchVulnerabilities();
  }, [page, rowsPerPage, searchTerm, filters]);

  const fetchVulnerabilities = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        limit: rowsPerPage.toString(),
        skip: (page * rowsPerPage).toString(),
      });
      
      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== 'all') {
          params.append(key, value);
        }
      });
      
      let url = '/api/vulnerabilities';
      if (searchTerm.trim()) {
        url = `/api/vulnerabilities/search/${encodeURIComponent(searchTerm)}`;
      }
      
      console.log('Fetching vulnerabilities from:', `${url}?${params}`);
      
      const response = await fetch(`${url}?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch vulnerabilities`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.success) {
        const vulnData = data.data.vulnerabilities || [];
        setVulnerabilities(vulnData);
        setTotal(data.data.pagination?.total || vulnData.length);
        generateStatistics(vulnData);
      } else {
        throw new Error(data.message || 'Failed to load vulnerabilities');
      }
      
    } catch (err) {
      console.error('Error fetching vulnerabilities:', err);
      setError(err.message);
      setVulnerabilities([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const generateStatistics = (vulns) => {
    const stats = {
      severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
      typeCounts: {},
      toolCounts: {},
      statusCounts: {},
    };

    vulns.forEach(vuln => {
      // Severity counts
      if (vuln.severity) {
        stats.severityCounts[vuln.severity] = (stats.severityCounts[vuln.severity] || 0) + 1;
      }
      
      // Type counts
      if (vuln.type) {
        stats.typeCounts[vuln.type] = (stats.typeCounts[vuln.type] || 0) + 1;
      }
      
      // Tool counts  
      if (vuln.tool) {
        stats.toolCounts[vuln.tool] = (stats.toolCounts[vuln.tool] || 0) + 1;
      }
      
      // Status counts
      if (vuln.status) {
        stats.statusCounts[vuln.status] = (stats.statusCounts[vuln.status] || 0) + 1;
      }
    });

    setStatistics(stats);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  const handleFilterChange = (event) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value,
    });
    setPage(0);
  };

  const resetFilters = () => {
    setFilters({
      severity: 'all',
      type: 'all',
      tool: 'all',
      status: 'all',
    });
    setSearchTerm('');
    setPage(0);
  };

  const handleMenuOpen = (event, vulnerability) => {
    setAnchorEl(event.currentTarget);
    setSelectedVuln(vulnerability);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVuln(null);
  };

  const handleUpdateStatus = async () => {
    try {
      const response = await fetch(`/api/vulnerabilities/${statusDialog.vulnerability._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          status: newStatus,
          comment: statusComment.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setStatusDialog({ open: false, vulnerability: null });
      setNewStatus('');
      setStatusComment('');
      fetchVulnerabilities(); // Refresh data
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddComment = async () => {
    try {
      const response = await fetch(`/api/vulnerabilities/${commentDialog.vulnerability._id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          comment: newComment.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      setCommentDialog({ open: false, vulnerability: null });
      setNewComment('');
      fetchVulnerabilities(); // Refresh data
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewCode = async (vulnerability) => {
    try {
      const response = await fetch(`/api/vulnerabilities/${vulnerability._id}/code-snippet?context=5`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch code snippet');
      }

      const data = await response.json();
      setCodeDialog({
        open: true,
        vulnerability,
        code: data.data?.content || 'Code snippet not available',
      });
    } catch (err) {
      setError(`Failed to load code: ${err.message}`);
    }
    handleMenuClose();
  };

  const handleExportCSV = () => {
    try {
      const headers = [
        'Name',
        'Severity',
        'Type',
        'Tool',
        'Status',
        'File',
        'Line',
        'Column',
        'Description',
        'CWE',
        'Created At'
      ];
      
      const rows = vulnerabilities.map(vuln => [
        vuln.name || '',
        vuln.severity || '',
        vuln.type || '',
        vuln.tool || '',
        vuln.status || '',
        vuln.file?.fileName || '',
        vuln.location?.line || '',
        vuln.location?.column || '',
        (vuln.description || '').replace(/"/g, '""'), // Escape quotes
        vuln.cwe || '',
        vuln.createdAt ? new Date(vuln.createdAt).toISOString() : ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vulnerabilities_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export data');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return <ErrorIcon />;
      case 'medium':
        return <WarningIcon />;
      case 'low':
        return <InfoIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'error';
      case 'in_progress': return 'warning';
      case 'fixed': return 'success';
      case 'ignored':
      case 'false_positive': return 'default';
      default: return 'default';
    }
  };

  const COLORS = {
    critical: '#d32f2f',
    high: '#f44336',
    medium: '#ff9800',
    low: '#4caf50',
  };

  const pieChartData = statistics ? 
    Object.entries(statistics.severityCounts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: COLORS[name] || '#666'
      })) : [];

  const typeChartData = statistics ? 
    Object.entries(statistics.typeCounts || {}).map(([name, value]) => ({ name, value })) : [];

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Vulnerabilities Summary</Typography>
          <Box>
            <Button startIcon={<RefreshIcon />} onClick={fetchVulnerabilities} sx={{ mr: 1 }}>
              Refresh
            </Button>
            <Button startIcon={<DownloadIcon />} onClick={handleExportCSV}>
              Export
            </Button>
          </Box>
        </Box>
      </Grid>
      
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Summary by Severity
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(COLORS).map(([severity, color]) => (
                <Grid item xs={6} sm={3} key={severity}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: color, color: 'white' }}>
                    <Typography variant="h3">
                      {statistics?.severityCounts?.[severity] || 0}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                      {severity}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      
      {pieChartData.length > 0 && (
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Vulnerabilities by Severity
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Issues']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      )}
      
      {typeChartData.length > 0 && (
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Issues by Type
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Issues Found" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      )}
      
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Status Breakdown
            </Typography>
            <Grid container spacing={2}>
              {statistics?.statusCounts && Object.entries(statistics.statusCounts).map(([status, count]) => (
                <Grid item xs={6} sm={3} key={status}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" color={getStatusColor(status) + '.main'}>
                      {count}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                      {status.replace('_', ' ')}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderListViewTab = () => (
    <Paper>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="Search vulnerabilities..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ width: { xs: '100%', sm: 300 } }}
        />
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Severity</InputLabel>
            <Select
              name="severity"
              value={filters.severity}
              label="Severity"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={filters.status}
              label="Status"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="fixed">Fixed</MenuItem>
              <MenuItem value="ignored">Ignored</MenuItem>
              <MenuItem value="false_positive">False Positive</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Tool</InputLabel>
            <Select
              name="tool"
              value={filters.tool}
              label="Tool"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="semgrep">Semgrep</MenuItem>
              <MenuItem value="snyk">Snyk</MenuItem>
              <MenuItem value="clangtidy">ClangTidy</MenuItem>
            </Select>
          </FormControl>
          
          <Button 
            variant="outlined" 
            size="small"
            onClick={resetFilters}
          >
            Reset
          </Button>
        </Box>
      </Box>
      
      <Divider />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Severity</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>File</TableCell>
                  <TableCell>Line</TableCell>
                  <TableCell>Tool</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vulnerabilities.map((vuln) => (
                  <TableRow key={vuln._id} hover>
                    <TableCell>
                      <Chip
                        icon={getSeverityIcon(vuln.severity)}
                        label={vuln.severity?.toUpperCase() || 'UNKNOWN'}
                        color={getSeverityColor(vuln.severity)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{vuln.name || 'Unnamed Issue'}</TableCell>
                    <TableCell>{vuln.type || 'Unknown'}</TableCell>
                    <TableCell>{vuln.file?.fileName || 'Unknown file'}</TableCell>
                    <TableCell>
                      {vuln.location?.line || '?'}:{vuln.location?.column || '?'}
                    </TableCell>
                    <TableCell>{vuln.tool || 'Unknown'}</TableCell>
                    <TableCell>
                      <Chip
                        label={vuln.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                        color={getStatusColor(vuln.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, vuln)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {vulnerabilities.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        {error ? 'Error loading vulnerabilities' : 'No vulnerabilities found'}
                      </Typography>
                      {error && (
                        <Button onClick={fetchVulnerabilities} sx={{ mt: 1 }}>
                          Retry
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
    </Paper>
  );

  const renderCodeViewTab = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Code View
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Select "View Code" from the actions menu in the List View to see code snippets for vulnerabilities.
      </Typography>
      
      {vulnerabilities.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Available Vulnerabilities:
          </Typography>
          {vulnerabilities.slice(0, 5).map((vuln) => (
            <Accordion key={vuln._id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Chip
                    icon={getSeverityIcon(vuln.severity)}
                    label={vuln.severity?.toUpperCase()}
                    color={getSeverityColor(vuln.severity)}
                    size="small"
                  />
                  <Typography sx={{ flexGrow: 1 }}>
                    {vuln.name} in {vuln.file?.fileName} (Line {vuln.location?.line})
                  </Typography>
                  <Chip size="small" label={vuln.tool} />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" paragraph>
                  <strong>Description:</strong> {vuln.description || 'No description available'}
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => handleViewCode(vuln)}
                  startIcon={<CodeIcon />}
                >
                  Load Code Snippet
                </Button>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Paper>
  );

  const renderStatisticsTab = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Vulnerability Statistics
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Total Issues: {total}
          </Typography>
          <Typography variant="body2" paragraph>
            Distribution by severity, type, and status across all scanned files.
          </Typography>
          
          {statistics?.toolCounts && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Tool Performance:
              </Typography>
              {Object.entries(statistics.toolCounts).map(([tool, count]) => (
                <Typography key={tool} variant="body2">
                  • {tool}: {count} issues found
                </Typography>
              ))}
            </Box>
          )}
        </Grid>
        
        <Grid item xs={12} md={6}>
          {statistics?.severityCounts && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Risk Assessment:
              </Typography>
              <Typography variant="body2" paragraph>
                Critical + High: {(statistics.severityCounts.critical || 0) + (statistics.severityCounts.high || 0)} issues require immediate attention
              </Typography>
              <Typography variant="body2" paragraph>
                Medium: {statistics.severityCounts.medium || 0} issues should be addressed soon
              </Typography>
              <Typography variant="body2" paragraph>
                Low: {statistics.severityCounts.low || 0} issues can be addressed over time
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Paper>
  );

  if (error && !vulnerabilities.length && !loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Vulnerabilities
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
          <Button onClick={fetchVulnerabilities} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Vulnerabilities
      </Typography>

      {error && vulnerabilities.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" icon={<AssignmentIcon />} iconPosition="start" />
        <Tab label="List View" icon={<BugIcon />} iconPosition="start" />
        <Tab label="Code View" icon={<CodeIcon />} iconPosition="start" />
        <Tab label="Statistics" icon={<DescriptionIcon />} iconPosition="start" />
      </Tabs>

      {tabValue === 0 && renderOverviewTab()}
      {tabValue === 1 && renderListViewTab()}
      {tabValue === 2 && renderCodeViewTab()}
      {tabValue === 3 && renderStatisticsTab()}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          setStatusDialog({ open: true, vulnerability: selectedVuln });
          setNewStatus(selectedVuln?.status || 'open');
          handleMenuClose();
        }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Update Status</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          setCommentDialog({ open: true, vulnerability: selectedVuln });
          handleMenuClose();
        }}>
          <ListItemIcon><CommentIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Add Comment</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleViewCode(selectedVuln)}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View Code</ListItemText>
        </MenuItem>
      </Menu>

      {/* Status Update Dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, vulnerability: null })}>
        <DialogTitle>Update Vulnerability Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              label="Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="fixed">Fixed</MenuItem>
              <MenuItem value="ignored">Ignored</MenuItem>
              <MenuItem value="false_positive">False Positive</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comment (optional)"
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
            placeholder="Add a comment about this status change..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, vulnerability: null })}>
            Cancel
          </Button>
          <Button onClick={handleUpdateStatus} variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={commentDialog.open} onClose={() => setCommentDialog({ open: false, vulnerability: null })}>
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            sx={{ mt: 1 }}
            placeholder="Enter your comment here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialog({ open: false, vulnerability: null })}>
            Cancel
          </Button>
          <Button onClick={handleAddComment} variant="contained" disabled={!newComment.trim()}>
            Add Comment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Code Dialog */}
      <Dialog 
        open={codeDialog.open} 
        onClose={() => setCodeDialog({ open: false, vulnerability: null, code: '' })} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          Code Snippet - {codeDialog.vulnerability?.file?.fileName} 
          {codeDialog.vulnerability?.location?.line && ` (Line ${codeDialog.vulnerability.location.line})`}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              p: 2,
              backgroundColor: '#f5f5f5',
              fontFamily: 'monospace',
              borderRadius: 1,
              overflowX: 'auto',
              maxHeight: 400,
              overflow: 'auto',
              fontSize: '0.875rem',
              lineHeight: 1.5,
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {codeDialog.code || 'No code available'}
            </pre>
          </Box>
          
          {codeDialog.vulnerability && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Vulnerability Details:
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Description:</strong> {codeDialog.vulnerability.description || 'No description available'}
              </Typography>
              {codeDialog.vulnerability.cwe && (
                <Typography variant="body2" paragraph>
                  <strong>CWE:</strong> {codeDialog.vulnerability.cwe}
                </Typography>
              )}
              {codeDialog.vulnerability.remediation && (
                <Typography variant="body2" paragraph>
                  <strong>Remediation:</strong> {codeDialog.vulnerability.remediation}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCodeDialog({ open: false, vulnerability: null, code: '' })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VulnerabilitiesPage;