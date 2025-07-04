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
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { InsertDriveFile as InsertDriveFileIcon } from '@mui/icons-material';

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
  const [deleteDialog, setDeleteDialog] = useState({ open: false, vulnerability: null });
  
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
        let vulnData = data.data.vulnerabilities || [];
        // Sort by createdAt descending (newest first)
        vulnData = vulnData.slice().sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
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
      // Show loading state
      setCodeDialog({
        open: true,
        vulnerability,
        code: 'Loading code snippet...',
      });

      // Get the vulnerability ID
      const vulnId = vulnerability._id || vulnerability.id;
      if (!vulnId) {
        throw new Error('Vulnerability ID not found');
      }

      console.log('🔍 Fetching code snippet for vulnerability:', vulnId);

      // Method 1: Try dedicated code snippet endpoint
      let response;
      let codeContent = '';
      try {
        response = await fetch(`/api/vulnerabilities/${vulnId}/code-snippet?context=5`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.data?.snippet && Array.isArray(data.data.snippet)) {
            codeContent = data.data.snippet.map(line => 
              typeof line.content === 'string'
                ? line.content
                : (typeof line.content === 'object' ? JSON.stringify(line.content) : String(line.content))
            ).join('\n');
            setCodeDialog({
              open: true,
              vulnerability,
              code: codeContent,
              snippet: data.data.snippet,
              lineNumber: data.data.lineNumber,
            });
            return;
          }
        } else {
          console.log('❌ Dedicated endpoint failed:', response.status);
        }
      } catch (err) {
        console.log('❌ Dedicated endpoint error:', err.message);
      }

      // Method 2: If no dedicated endpoint, try to get from scan files
      if (!codeContent) {
        try {
          // Get vulnerability details first
          const vulnResponse = await fetch(`/api/vulnerabilities/${vulnId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });
          if (vulnResponse.ok) {
            const vulnData = await vulnResponse.json();
            const vuln = vulnData.data || vulnData;
            // Extract file info
            const fileName = typeof vuln.file === 'object' 
              ? (vuln.file.fileName || vuln.file.name)
              : vuln.file;
            const lineNumber = typeof vuln.location === 'object'
              ? vuln.location.line
              : vuln.line;
            if (fileName && lineNumber) {
              // Try to get the file content from scan
              const scanId = vuln.scanId || vuln.scan;
              if (scanId) {
                const fileResponse = await fetch(`/api/scans/${scanId}/files/${encodeURIComponent(fileName)}?line=${lineNumber}&context=5`, {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                  },
                });
                if (fileResponse.ok) {
                  const fileData = await fileResponse.json();
                  codeContent = fileData.data?.content || fileData.content || '';
                  console.log('✅ Got code from scan files');
                }
              }
            }
          }
        } catch (err) {
          console.log('❌ Scan files method error:', err.message);
        }
      }

      // Nếu không lấy được code từ backend, hiển thị lỗi
      if (!codeContent) {
        codeContent = 'Không tìm thấy code snippet cho lỗ hổng này.\nVui lòng kiểm tra lại backend hoặc dữ liệu scan.';
      }

      // Update dialog with actual code
      setCodeDialog({
        open: true,
        vulnerability,
        code: codeContent,
      });
    } catch (error) {
      console.error('❌ Error loading code snippet:', error);
      setCodeDialog({
        open: true,
        vulnerability,
        code: `Error loading code snippet: ${error.message}\n\nPlease check:\n1. File exists in scan results\n2. Backend API is accessible\n3. Vulnerability has valid file/line information`,
      });
      setError(`Failed to load code: ${error.message}`);
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
              <MenuItem value="cppcheck">Cppcheck</MenuItem>
              <MenuItem value="cpplint">clangStaticAnalyzer</MenuItem>
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
                  <TableCell>Scan Name</TableCell>
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
                        style={{ pointerEvents: 'none' }}
                      />
                    </TableCell>
                    <TableCell>
                      {/* FIX: Safe string rendering */}
                      {vuln.name || vuln.title || 'Unnamed Issue'}
                    </TableCell>
                    <TableCell>
                      {vuln.type || vuln.vulnerabilityType || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {vuln.scanName || vuln.scan_name || vuln.scan?.name || vuln.scanId || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {/* FIX: Handle file object properly */}
                      {typeof vuln.file === 'object' && vuln.file 
                        ? (vuln.file.fileName || vuln.file.name || 'Unknown file')
                        : (vuln.file || 'Unknown file')
                      }
                    </TableCell>
                    <TableCell>
                      {/* FIX: Handle location object properly */}
                      {typeof vuln.location === 'object' && vuln.location
                        ? `${vuln.location.line || '?'}:${vuln.location.column || '?'}`
                        : `${vuln.line || '?'}:${vuln.column || '?'}`
                      }
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={vuln.tool || 'Unknown tool'}
                        size="small"
                        style={{ pointerEvents: 'none' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={vuln.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                        color={getStatusColor(vuln.status)}
                        size="small"
                        style={{ pointerEvents: 'none' }}
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
      {vulnerabilities.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Available Vulnerabilities:
          </Typography>
          {vulnerabilities.map((vuln) => (
            <Accordion key={vuln._id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Chip
                    icon={getSeverityIcon(vuln.severity)}
                    label={vuln.severity?.toUpperCase() || 'UNKNOWN'}
                    color={getSeverityColor(vuln.severity)}
                    size="small"
                  />
                  <Typography sx={{ flexGrow: 1 }}>
                    {/* FIX: Convert objects to strings properly */}
                    {vuln.name || vuln.title || 'Unnamed Issue'} in {
                      typeof vuln.file === 'object' && vuln.file 
                        ? (vuln.file.fileName || vuln.file.name || 'Unknown file')
                        : (vuln.file || 'Unknown file')
                    } (Line {
                      typeof vuln.location === 'object' && vuln.location
                        ? (vuln.location.line || '?')
                        : (vuln.line || '?')
                    })
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      size="small" 
                      label={vuln.tool || 'Unknown tool'} 
                    />
                    {/* NEW: Show duplicate count if available */}
                    {vuln.metadata?.detectedBy && new Set(vuln.metadata.detectedBy).size > 1 && (
                      <Chip 
                        size="small" 
                        label={`${[...new Set(vuln.metadata.detectedBy)].length} tools`}
                        color="info"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography component="div" variant="body2" sx={{ mb: 2 }}>
                  <strong>Description:</strong>
                  <span>
                    {
                      typeof vuln.description === 'string'
                        ? (vuln.description.split('[Detected by:')[0].trim())
                        : JSON.stringify(vuln.description)
                    }
                  </span>
                </Typography>
                {vuln.metadata?.detectedBy && new Set(vuln.metadata.detectedBy).size > 1 && (
                  <Typography component="div" variant="body2" sx={{ mb: 2 }}>
                    <strong>Detected by:</strong> {[...new Set(vuln.metadata.detectedBy)].join(', ')}
                    <span> ({[...new Set(vuln.metadata.detectedBy)].length} tools total)</span>
                  </Typography>
                )}
                
                {/* FIX: Additional safe rendering for other fields */}
                {vuln.cwe && (
                  <Typography component="div" variant="body2" sx={{ mb: 2 }}>
                    <strong>CWE:</strong> {
                      typeof vuln.cwe === 'string' 
                        ? vuln.cwe 
                        : JSON.stringify(vuln.cwe)
                    }
                  </Typography>
                )}
                
                {vuln.remediation && (
                  <Typography component="div" variant="body2" sx={{ mb: 2 }}>
                    <strong>Remediation:</strong> {
                      typeof vuln.remediation === 'string' 
                        ? vuln.remediation 
                        : JSON.stringify(vuln.remediation)
                    }
                  </Typography>
                )}
                
                <Button 
                  variant="outlined" 
                  onClick={() => handleViewCode(vuln)}
                  startIcon={<CodeIcon />}
                >
                  Load Code View
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

  const handleDeleteVulnerability = async () => {
    if (!deleteDialog.vulnerability) return;
    try {
      const response = await fetch(`/api/vulnerabilities/${deleteDialog.vulnerability._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete vulnerability');
      }
      setDeleteDialog({ open: false, vulnerability: null });
      fetchVulnerabilities(); // reload danh sách
    } catch (err) {
      setError(err.message);
      setDeleteDialog({ open: false, vulnerability: null });
    }
  };

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
        <MenuItem onClick={() => {
          setDeleteDialog({ open: true, vulnerability: selectedVuln });
          handleMenuClose();
        }}>
          <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
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

      {/* Code View Dialog - FIXED HTML Structure */}
      <Dialog 
        open={codeDialog.open} 
        onClose={() => setCodeDialog({ open: false, vulnerability: null, code: '' })} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CodeIcon color="primary" />
            <Box>
              <Typography variant="h6">
                Code Snippet - {
                  codeDialog.vulnerability?.file && typeof codeDialog.vulnerability.file === 'object'
                    ? (codeDialog.vulnerability.file.fileName || codeDialog.vulnerability.file.name || 'Unknown file')
                    : (codeDialog.vulnerability?.file || 'Unknown file')
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {codeDialog.vulnerability?.location?.line && `Line ${codeDialog.vulnerability.location.line}`}
                {!codeDialog.vulnerability?.location?.line && codeDialog.vulnerability?.line && `Line ${codeDialog.vulnerability.line}`}
                {codeDialog.vulnerability?.location?.column && `, Column ${codeDialog.vulnerability.location.column}`}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {/* Code Display Area */}
          <Paper 
            elevation={1}
            sx={{
              backgroundColor: '#1e1e1e', // Dark theme for code
              color: '#d4d4d4',
              borderRadius: 2,
              overflow: 'hidden',
              mb: 2,
            }}
          >
            {/* File header */}
            <Box sx={{ 
              backgroundColor: '#2d2d30', 
              px: 2, 
              py: 1, 
              borderBottom: '1px solid #3e3e42',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <InsertDriveFileIcon sx={{ fontSize: 16, color: '#569cd6' }} />
              <Typography variant="body2" sx={{ color: '#cccccc', fontFamily: 'monospace' }}>
                {codeDialog.vulnerability?.file && typeof codeDialog.vulnerability.file === 'object'
                  ? (codeDialog.vulnerability.file.fileName || codeDialog.vulnerability.file.name || 'Unknown file')
                  : (codeDialog.vulnerability?.file || 'Unknown file')
                }
              </Typography>
            </Box>
            
            {/* Code content */}
            <Box
              sx={{
                p: 0,
                fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
                fontSize: '14px',
                lineHeight: 1.5,
                overflow: 'auto',
                maxHeight: 400,
                minHeight: 200,
              }}
            >
              {codeDialog.code ? (
                <Box sx={{ position: 'relative' }}>
                  {/* Line numbers and code */}
                  <Box sx={{ display: 'flex' }}>
                    {/* Line numbers column */}
                    <Box sx={{ 
                      backgroundColor: '#252526',
                      color: '#858585',
                      textAlign: 'right',
                      px: 1,
                      py: 2,
                      borderRight: '1px solid #3e3e42',
                      minWidth: 60,
                      userSelect: 'none',
                    }}>
                      {(codeDialog.snippet || codeDialog.code.split('\n')).map((line, idx) => {
                        // Lấy số dòng thực tế nếu có, fallback về index+1
                        const lineNumber = typeof line === 'object' && line.lineNumber ? line.lineNumber : (codeDialog.lineNumber ? codeDialog.lineNumber - Math.floor((codeDialog.snippet || []).length / 2) + idx : idx + 1);
                        return (
                          <div key={idx} style={{ height: '21px', lineHeight: '21px' }}>
                            {lineNumber}
                          </div>
                        );
                      })}
                    </Box>
                    
                    {/* Code column */}
                    <Box sx={{ 
                      flex: 1,
                      py: 2,
                      px: 2,
                      overflow: 'auto',
                    }}>
                      <pre style={{ 
                        margin: 0, 
                        whiteSpace: 'pre',
                        color: '#d4d4d4',
                        backgroundColor: 'transparent',
                      }}>
                        {(codeDialog.snippet || []).map((line, index) => {
                          let displayContent;
                          if (typeof line.content === 'string') {
                            displayContent = line.content;
                          } else if (Array.isArray(line.content)) {
                            displayContent = JSON.stringify(line.content);
                          } else if (typeof line.content === 'object' && line.content !== null) {
                            displayContent = JSON.stringify(line.content);
                          } else {
                            displayContent = String(line.content);
                          }
                          const vulnLine = codeDialog.lineNumber;
                          const isVulnLine = line.lineNumber === vulnLine || line.isHighlighted;
                          return (
                            <div
                              key={index}
                              style={{
                                backgroundColor: isVulnLine ? 'rgba(255, 0, 0, 0.1)' : 'transparent',
                                borderLeft: isVulnLine ? '3px solid #f44336' : '3px solid transparent',
                                paddingLeft: isVulnLine ? '8px' : '11px',
                                minHeight: '21px',
                                lineHeight: '21px',
                              }}
                            >
                              {displayContent}
                              {isVulnLine && (
                                <span style={{
                                  color: '#f44336',
                                  marginLeft: '10px',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  ← Vulnerability detected here
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </pre>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: 200,
                  color: '#858585'
                }}>
                  <Typography>Loading code snippet...</Typography>
                </Box>
              )}
            </Box>
          </Paper>
          
          {/* Vulnerability Details Panel - FIXED */}
          {codeDialog.vulnerability && (
            <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BugIcon color="warning" />
                Vulnerability Details
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Name:</strong> {codeDialog.vulnerability.name || codeDialog.vulnerability.title || 'Unknown'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      <strong>Severity:</strong>
                    </Typography>
                    <Chip 
                      size="small" 
                      label={codeDialog.vulnerability.severity?.toUpperCase() || 'UNKNOWN'}
                      color={getSeverityColor(codeDialog.vulnerability.severity)}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Tool:</strong> {codeDialog.vulnerability.tool || 'Unknown'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Type:</strong> {codeDialog.vulnerability.type || codeDialog.vulnerability.vulnerabilityType || 'Unknown'}
                    </Typography>
                  </Box>
                  
                  {codeDialog.vulnerability.cwe && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>CWE:</strong>{' '}
                        <a 
                          href={`https://cwe.mitre.org/data/definitions/${codeDialog.vulnerability.cwe.replace('CWE-', '')}.html`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#1976d2' }}
                        >
                          {codeDialog.vulnerability.cwe}
                        </a>
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Description:</strong>
                  <span>
                    {
                      typeof codeDialog.vulnerability.description === 'string'
                        ? (codeDialog.vulnerability.description.split('[Detected by:')[0].trim())
                        : JSON.stringify(codeDialog.vulnerability.description)
                    }
                  </span>
                </Typography>
                {codeDialog.vulnerability.metadata?.detectedBy && new Set(codeDialog.vulnerability.metadata.detectedBy).size > 1 && (
                  <Typography component="div" variant="body2" sx={{ mb: 2 }}>
                    <strong>Detected by:</strong> {[...new Set(codeDialog.vulnerability.metadata.detectedBy)].join(', ')}
                    <span> ({[...new Set(codeDialog.vulnerability.metadata.detectedBy)].length} tools total)</span>
                  </Typography>
                )}
              </Box>
              
              {codeDialog.vulnerability.remediation && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Remediation:</strong> {
                      typeof codeDialog.vulnerability.remediation === 'string'
                        ? codeDialog.vulnerability.remediation
                        : JSON.stringify(codeDialog.vulnerability.remediation)
                    }
                  </Typography>
                </Box>
              )}
              
              {/* Comments Section */}
              {codeDialog.vulnerability.comments && Array.isArray(codeDialog.vulnerability.comments) && codeDialog.vulnerability.comments.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Comments:
                  </Typography>
                  {codeDialog.vulnerability.comments.map((comment, index) => {
                    // Extract comment data
                    let commentText = '';
                    let commentDate = '';
                    
                    if (typeof comment === 'string') {
                      commentText = comment;
                    } else if (typeof comment === 'object' && comment !== null) {
                      commentText = comment.text || comment.content || comment.message || JSON.stringify(comment);
                      commentDate = comment.createdAt || comment.date || comment.timestamp;
                    } else {
                      commentText = JSON.stringify(comment);
                    }
                    
                    // Format date
                    let formattedDate = '';
                    if (commentDate) {
                      try {
                        const date = new Date(commentDate);
                        formattedDate = date.toLocaleString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      } catch (e) {
                        formattedDate = commentDate;
                      }
                    }
                    
                    return (
                      <Box key={index} sx={{ 
                        mb: 1, 
                        p: 2, 
                        bgcolor: 'grey.50', 
                        borderRadius: 1,
                        border: '1px solid #e0e0e0'
                      }}>
                        <Typography variant="body2" sx={{ 
                          fontSize: '0.9rem',
                          lineHeight: 1.5,
                          color: 'text.primary'
                        }}>
                          {commentText}
                        </Typography>
                        {formattedDate && (
                          <Typography variant="caption" sx={{ 
                            display: 'block',
                            mt: 1,
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                            textAlign: 'right'
                          }}>
                            {formattedDate}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}
              
              {/* Status Comments */}
              {codeDialog.vulnerability.statusComment && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Status Comment:
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'grey.50', 
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}>
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      color: 'text.primary'
                    }}>
                      {typeof codeDialog.vulnerability.statusComment === 'string' 
                        ? codeDialog.vulnerability.statusComment 
                        : (codeDialog.vulnerability.statusComment.text || JSON.stringify(codeDialog.vulnerability.statusComment))
                      }
                    </Typography>
                    {codeDialog.vulnerability.statusComment && typeof codeDialog.vulnerability.statusComment === 'object' && codeDialog.vulnerability.statusComment.createdAt && (
                      <Typography variant="caption" sx={{ 
                        display: 'block',
                        mt: 1,
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                        textAlign: 'right'
                      }}>
                        📅 {new Date(codeDialog.vulnerability.statusComment.createdAt).toLocaleString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
              
              {/* References */}
              {Array.isArray(codeDialog.vulnerability.references) && codeDialog.vulnerability.references.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    References:
                  </Typography>
                  {codeDialog.vulnerability.references.map((ref, index) => {
                    if (typeof ref === 'string') {
                      // ref là string (URL)
                      return (
                        <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                          • <a href={ref} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>{ref}</a>
                        </Typography>
                      );
                    } else if (typeof ref === 'object' && ref !== null && ref.url) {
                      // ref là object có url
                      return (
                        <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                          • <a href={ref.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>
                              {ref.title || ref.url}
                            </a>
                        </Typography>
                      );
                    } else {
                      // ref là object khác hoặc kiểu khác
                      return (
                        <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                          • {JSON.stringify(ref)}
                        </Typography>
                      );
                    }
                  })}
                </Box>
              )}
            </Paper>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={() => setCodeDialog({ open: false, vulnerability: null, code: '' })}
            variant="outlined"
          >
            Close
          </Button>
          <Button 
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => {
              // Download code snippet
              const blob = new Blob([codeDialog.code], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `vulnerability_${codeDialog.vulnerability?._id}_code.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, vulnerability: null })}>
        <DialogTitle>Delete Vulnerability</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc chắn muốn xóa vulnerability này không?</Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'error.main' }}>
            {deleteDialog.vulnerability?.name || deleteDialog.vulnerability?.title || 'Unnamed Issue'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, vulnerability: null })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteVulnerability} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VulnerabilitiesPage;