import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
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
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Mock data for vulnerabilities
const mockVulnerabilities = [
  { id: 1, name: 'Buffer Overflow', severity: 'high', type: 'Memory Safety', file: 'main.cpp', line: 42, column: 15, tool: 'semgrep', status: 'open', description: 'Potential buffer overflow vulnerability detected. Missing bounds check before memory access.' },
  { id: 2, name: 'Memory Leak', severity: 'medium', type: 'Memory Safety', file: 'utils.c', line: 87, column: 10, tool: 'clangtidy', status: 'open', description: 'Memory allocated but never freed, causing memory leak.' },
  { id: 3, name: 'Use After Free', severity: 'high', type: 'Memory Safety', file: 'parser.cpp', line: 124, column: 8, tool: 'snyk', status: 'in_progress', description: 'Accessing memory after it has been freed.' },
  { id: 4, name: 'Uninitialized Variable', severity: 'low', type: 'Code Quality', file: 'config.c', line: 32, column: 20, tool: 'semgrep', status: 'open', description: 'Variable may be used before initialization.' },
  { id: 5, name: 'Integer Overflow', severity: 'medium', type: 'Security', file: 'math.cpp', line: 74, column: 12, tool: 'clangtidy', status: 'fixed', description: 'Potential integer overflow when performing arithmetic operation.' },
  { id: 6, name: 'Format String Vulnerability', severity: 'critical', type: 'Security', file: 'logger.c', line: 53, column: 5, tool: 'snyk', status: 'open', description: 'Format string vulnerability that could lead to arbitrary code execution.' },
  { id: 7, name: 'Redundant Code', severity: 'low', type: 'Code Quality', file: 'helpers.cpp', line: 91, column: 3, tool: 'semgrep', status: 'ignored', description: 'Redundant code detected that has no effect.' },
  { id: 8, name: 'NULL Pointer Dereference', severity: 'high', type: 'Memory Safety', file: 'core.cpp', line: 156, column: 12, tool: 'clangtidy', status: 'open', description: 'Dereferencing a NULL pointer can lead to program crash.' },
  { id: 9, name: 'Race Condition', severity: 'high', type: 'Concurrency', file: 'thread.cpp', line: 78, column: 25, tool: 'semgrep', status: 'open', description: 'Potential race condition in multi-threaded code.' },
  { id: 10, name: 'Command Injection', severity: 'critical', type: 'Security', file: 'exec.c', line: 42, column: 8, tool: 'snyk', status: 'in_progress', description: 'Unsanitized user input used in system command execution.' },
  { id: 11, name: 'Inefficient Algorithm', severity: 'low', type: 'Performance', file: 'search.cpp', line: 124, column: 1, tool: 'clangtidy', status: 'open', description: 'Algorithm has unnecessary complexity, could be optimized.' },
  { id: 12, name: 'Insecure Random', severity: 'medium', type: 'Security', file: 'crypto.cpp', line: 56, column: 15, tool: 'semgrep', status: 'open', description: 'Using weak random number generator for security-sensitive operation.' },
];

// Prepare data for charts
const severityCounts = {
  critical: mockVulnerabilities.filter(v => v.severity === 'critical').length,
  high: mockVulnerabilities.filter(v => v.severity === 'high').length,
  medium: mockVulnerabilities.filter(v => v.severity === 'medium').length,
  low: mockVulnerabilities.filter(v => v.severity === 'low').length,
};

const typeCounts = {
  'Memory Safety': mockVulnerabilities.filter(v => v.type === 'Memory Safety').length,
  'Security': mockVulnerabilities.filter(v => v.type === 'Security').length,
  'Code Quality': mockVulnerabilities.filter(v => v.type === 'Code Quality').length,
  'Performance': mockVulnerabilities.filter(v => v.type === 'Performance').length,
  'Concurrency': mockVulnerabilities.filter(v => v.type === 'Concurrency').length,
};

const toolCounts = {
  semgrep: mockVulnerabilities.filter(v => v.tool === 'semgrep').length,
  snyk: mockVulnerabilities.filter(v => v.tool === 'snyk').length,
  clangtidy: mockVulnerabilities.filter(v => v.tool === 'clangtidy').length,
};

const statusCounts = {
  open: mockVulnerabilities.filter(v => v.status === 'open').length,
  in_progress: mockVulnerabilities.filter(v => v.status === 'in_progress').length,
  fixed: mockVulnerabilities.filter(v => v.status === 'fixed').length,
  ignored: mockVulnerabilities.filter(v => v.status === 'ignored').length,
};

const pieChartData = [
  { name: 'Critical', value: severityCounts.critical, color: '#d32f2f' },
  { name: 'High', value: severityCounts.high, color: '#f44336' },
  { name: 'Medium', value: severityCounts.medium, color: '#ff9800' },
  { name: 'Low', value: severityCounts.low, color: '#4caf50' },
];

const typeChartData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
const toolChartData = Object.entries(toolCounts).map(([name, value]) => ({ name, value }));

const getSeverityColor = (severity) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'error';
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'default';
  }
};

const getSeverityIcon = (severity) => {
  switch (severity.toLowerCase()) {
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
    case 'open':
      return 'error';
    case 'in_progress':
      return 'warning';
    case 'fixed':
      return 'success';
    case 'ignored':
      return 'default';
    default:
      return 'default';
  }
};

const VulnerabilitiesPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [expandedPanel, setExpandedPanel] = useState(false);
  const [filters, setFilters] = useState({
    severity: 'all',
    type: 'all',
    tool: 'all',
    status: 'all',
  });

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

  const filteredVulnerabilities = mockVulnerabilities.filter((vuln) => {
    return (
      (searchTerm === '' || 
        vuln.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.file.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filters.severity === 'all' || vuln.severity === filters.severity) &&
      (filters.type === 'all' || vuln.type === filters.type) &&
      (filters.tool === 'all' || vuln.tool === filters.tool) &&
      (filters.status === 'all' || vuln.status === filters.status)
    );
  });

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Vulnerabilities Summary</Typography>
          <Box>
            <Button startIcon={<RefreshIcon />} sx={{ mr: 1 }}>
              Refresh
            </Button>
            <Button startIcon={<DownloadIcon />}>
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
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#d32f2f', color: 'white' }}>
                  <Typography variant="h3">{severityCounts.critical}</Typography>
                  <Typography variant="subtitle2">Critical</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f44336', color: 'white' }}>
                  <Typography variant="h3">{severityCounts.high}</Typography>
                  <Typography variant="subtitle2">High</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#ff9800', color: 'white' }}>
                  <Typography variant="h3">{severityCounts.medium}</Typography>
                  <Typography variant="subtitle2">Medium</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#4caf50', color: 'white' }}>
                  <Typography variant="h3">{severityCounts.low}</Typography>
                  <Typography variant="subtitle2">Low</Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      
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
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Status Breakdown
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h5" color="error.main">{statusCounts.open}</Typography>
                  <Typography variant="subtitle2">Open</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h5" color="warning.main">{statusCounts.in_progress}</Typography>
                  <Typography variant="subtitle2">In Progress</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h5" color="success.main">{statusCounts.fixed}</Typography>
                  <Typography variant="subtitle2">Fixed</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h5" color="text.secondary">{statusCounts.ignored}</Typography>
                  <Typography variant="subtitle2">Ignored</Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Tool Effectiveness
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={toolChartData} layout="vertical" margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Issues Found" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
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
            <InputLabel>Type</InputLabel>
            <Select
              name="type"
              value={filters.type}
              label="Type"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="Memory Safety">Memory Safety</MenuItem>
              <MenuItem value="Security">Security</MenuItem>
              <MenuItem value="Code Quality">Code Quality</MenuItem>
              <MenuItem value="Performance">Performance</MenuItem>
              <MenuItem value="Concurrency">Concurrency</MenuItem>
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
              <MenuItem value="clangtidy">ClangTidy</MenuItem>
              <MenuItem value="snyk">Snyk</MenuItem>
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
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVulnerabilities
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((vuln) => (
                <TableRow key={vuln.id} hover>
                  <TableCell>
                    <Chip
                      icon={getSeverityIcon(vuln.severity)}
                      label={vuln.severity.toUpperCase()}
                      color={getSeverityColor(vuln.severity)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{vuln.name}</TableCell>
                  <TableCell>{vuln.type}</TableCell>
                  <TableCell>{vuln.file}</TableCell>
                  <TableCell>{vuln.line}:{vuln.column}</TableCell>
                  <TableCell>{vuln.tool}</TableCell>
                  <TableCell>
                    <Chip
                      label={vuln.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(vuln.status)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            {filteredVulnerabilities.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No vulnerabilities found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={filteredVulnerabilities.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );

  const renderCodeViewTab = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Code View
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Review the code containing vulnerabilities:
      </Typography>
      
      {filteredVulnerabilities.map((vuln) => (
        <Accordion 
          key={vuln.id}
          expanded={expandedPanel === `panel-${vuln.id}`}
          onChange={handleAccordionChange(`panel-${vuln.id}`)}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Chip
                icon={getSeverityIcon(vuln.severity)}
                label={vuln.severity.toUpperCase()}
                color={getSeverityColor(vuln.severity)}
                size="small"
              />
              <Typography sx={{ flexGrow: 1 }}>
                {vuln.name} in {vuln.file} (Line {vuln.line})
              </Typography>
              <Chip size="small" label={vuln.tool} />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Description:
              </Typography>
              <Typography variant="body2" paragraph>
                {vuln.description}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Affected Code:
              </Typography>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  fontFamily: 'monospace',
                  borderRadius: 1,
                  overflowX: 'auto',
                }}
              >
                <pre style={{ margin: 0 }}>
                  <code>
                    {/* Code sample for each vulnerability type */}
                    {`// Code from ${vuln.file}\n`}
                    {vuln.line > 1 ? `${vuln.line - 1}    // Previous line of code\n` : ''}
                    {`${vuln.line}    `}
                    <span style={{ backgroundColor: '#ffcccc', display: 'inline-block', width: '100%' }}>
                      {vuln.name === 'Buffer Overflow' 
                        ? `strcpy(buffer, input);  // Vulnerable code here`
                        : vuln.name === 'Memory Leak'
                        ? `char* data = malloc(100);  // Memory allocated but never freed`
                        : vuln.name === 'Use After Free'
                        ? `free(ptr); return ptr->value;  // Using freed memory`
                        : vuln.name === 'Command Injection'
                        ? `system(user_input);  // Unsanitized input used in command`
                        : vuln.name === 'Integer Overflow'
                        ? `int result = value1 * value2;  // No overflow check before multiplication`
                        : vuln.name === 'Format String Vulnerability'
                        ? `printf(user_input);  // Format string vulnerability`
                        : vuln.name === 'NULL Pointer Dereference'
                        ? `int value = *ptr;  // No NULL check before dereferencing`
                        : vuln.name === 'Race Condition'
                        ? `shared_counter++;  // No lock around shared resource access`
                        : vuln.name === 'Uninitialized Variable'
                        ? `int value; func(value);  // Value used before initialization`
                        : vuln.name === 'Inefficient Algorithm'
                        ? `for(int i=0; i<n; i++) { for(int j=0; j<n; j++) { /* O(n²) operation */ } }  // Inefficient nested loops`
                        : vuln.name === 'Insecure Random'
                        ? `int key = rand();  // Weak random number generator used for security`
                        : `// Code with ${vuln.name} vulnerability`}
                    </span>
                    {`\n${vuln.line + 1}    // Next line of code`}
                  </code>
                </pre>
              </Box>
              
              <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
                Fix Recommendation:
              </Typography>
              <Typography variant="body2" paragraph>
                {vuln.name === 'Buffer Overflow' 
                  ? 'Use strncpy() instead of strcpy() and ensure the buffer size is respected.'
                  : vuln.name === 'Memory Leak'
                  ? 'Ensure all allocated memory is properly freed when no longer needed.'
                  : vuln.name === 'Use After Free'
                  ? 'Do not access memory after it has been freed. Set pointers to NULL after freeing.'
                  : vuln.name === 'Command Injection'
                  ? 'Sanitize user input before using it in system commands. Use parameter binding when possible.'
                  : vuln.name === 'Integer Overflow'
                  ? 'Check for potential overflow before performing arithmetic operations. Consider using safer integer types.'
                  : vuln.name === 'Format String Vulnerability'
                  ? 'Always use format string literals with proper placeholders. Never pass user input directly as format string.'
                  : vuln.name === 'NULL Pointer Dereference'
                  ? 'Always check pointers for NULL before dereferencing them.'
                  : vuln.name === 'Race Condition'
                  ? 'Use proper synchronization mechanisms (mutexes, locks) when accessing shared resources.'
                  : vuln.name === 'Uninitialized Variable'
                  ? 'Initialize all variables before use. Enable compiler warnings for uninitialized variables.'
                  : vuln.name === 'Inefficient Algorithm'
                  ? 'Optimize algorithm to reduce time complexity. Consider alternative data structures or algorithms.'
                  : vuln.name === 'Insecure Random'
                  ? 'Use cryptographically secure random number generators for security-sensitive operations.'
                  : 'Follow secure coding practices and use proper validation.'}
              </Typography>
              
              <Box
                sx={{
                  p: 2,
                  mt: 1,
                  backgroundColor: '#e8f5e9',
                  fontFamily: 'monospace',
                  borderRadius: 1,
                  overflowX: 'auto',
                }}
              >
                <pre style={{ margin: 0 }}>
                  <code>
                    {vuln.name === 'Buffer Overflow' 
                      ? `// Safe alternative\nstrncpy(buffer, input, sizeof(buffer) - 1);\nbuffer[sizeof(buffer) - 1] = '\\0';  // Ensure null termination`
                      : vuln.name === 'Memory Leak'
                      ? `// Proper memory management\nchar* data = malloc(100);\n// Use data...\nfree(data);  // Free memory when done`
                      : vuln.name === 'Use After Free'
                      ? `// Safe alternative\nfree(ptr);\nptr = NULL;  // Set to NULL after freeing\n// Don't use ptr after this point`
                      : vuln.name === 'Command Injection'
                      ? `// Safe alternative\n// Use prepared statements or parameter binding instead of direct input\nexecl("/bin/echo", "echo", sanitized_input, NULL);`
                      : vuln.name === 'Integer Overflow'
                      ? `// Safe alternative\nif (value1 > INT_MAX / value2) {\n  // Handle potential overflow\n} else {\n  int result = value1 * value2;\n}`
                      : vuln.name === 'Format String Vulnerability'
                      ? `// Safe alternative\nprintf("%s", user_input);  // Use format string with placeholder`
                      : vuln.name === 'NULL Pointer Dereference'
                      ? `// Safe alternative\nif (ptr != NULL) {\n  int value = *ptr;  // Only dereference after NULL check\n} else {\n  // Handle NULL case\n}`
                      : vuln.name === 'Race Condition'
                      ? `// Safe alternative\nmutex_lock(&lock);\nshared_counter++;  // Protected access to shared resource\nmutex_unlock(&lock);`
                      : vuln.name === 'Uninitialized Variable'
                      ? `// Safe alternative\nint value = 0;  // Initialize before use\nfunc(value);`
                      : vuln.name === 'Inefficient Algorithm'
                      ? `// Optimized approach\n// Use a more efficient algorithm or data structure\nHashMap cache;\n// O(n) operation instead of O(n²)`
                      : vuln.name === 'Insecure Random'
                      ? `// Safe alternative\n// Use a cryptographically secure random number generator\n#include <openssl/rand.h>\nunsigned char key[32];\nRAND_bytes(key, sizeof(key));`
                      : `// Fixed code would go here based on the specific issue`}
                  </code>
                </pre>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Paper>
  );
  const renderStatisticsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Vulnerability Statistics
          </Typography>
          <Typography variant="body2" paragraph>
            Detailed statistics and trends about the vulnerabilities found in your codebase.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Total Vulnerabilities: {mockVulnerabilities.length}
              </Typography>
              <Typography variant="body2" paragraph>
                The scan identified a total of {mockVulnerabilities.length} issues across your codebase,
                with various severity levels and types. The most common categories are memory safety issues and security vulnerabilities.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Tool Effectiveness
              </Typography>
              <Typography variant="body2" paragraph>
                Semgrep found {mockVulnerabilities.filter(v => v.tool === 'semgrep').length} issues,
                ClangTidy found {mockVulnerabilities.filter(v => v.tool === 'clangtidy').length} issues,
                and Snyk found {mockVulnerabilities.filter(v => v.tool === 'snyk').length} issues.
              </Typography>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle1" gutterBottom>
              Most Affected Files
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>File</TableCell>
                    <TableCell align="right">Issues</TableCell>
                    <TableCell align="right">Critical</TableCell>
                    <TableCell align="right">High</TableCell>
                    <TableCell align="right">Medium</TableCell>
                    <TableCell align="right">Low</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Group by file and count */}
                  {Object.entries(
                    mockVulnerabilities.reduce((acc, vuln) => {
                      if (!acc[vuln.file]) {
                        acc[vuln.file] = {
                          total: 0,
                          critical: 0,
                          high: 0,
                          medium: 0,
                          low: 0
                        };
                      }
                      acc[vuln.file].total++;
                      acc[vuln.file][vuln.severity]++;
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => b[1].total - a[1].total)
                    .slice(0, 5)
                    .map(([file, counts]) => (
                      <TableRow key={file}>
                        <TableCell>{file}</TableCell>
                        <TableCell align="right">{counts.total}</TableCell>
                        <TableCell align="right">{counts.critical || 0}</TableCell>
                        <TableCell align="right">{counts.high || 0}</TableCell>
                        <TableCell align="right">{counts.medium || 0}</TableCell>
                        <TableCell align="right">{counts.low || 0}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle1" gutterBottom>
              Analysis by Vulnerability Type
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">% of Total</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(typeCounts).map(([type, count]) => (
                    <TableRow key={type}>
                      <TableCell>{type}</TableCell>
                      <TableCell align="right">{count}</TableCell>
                      <TableCell align="right">
                        {((count / mockVulnerabilities.length) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        {type === 'Memory Safety' 
                          ? 'Issues related to memory allocation, deallocation, and access'
                          : type === 'Security' 
                          ? 'Vulnerabilities that may lead to security breaches'
                          : type === 'Code Quality' 
                          ? 'Issues affecting code maintainability and readability'
                          : type === 'Performance' 
                          ? 'Issues that may impact application performance'
                          : type === 'Concurrency' 
                          ? 'Issues related to multi-threading and synchronization'
                          : 'Other issues'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle1" gutterBottom>
              Remediation Recommendations
            </Typography>
            <Typography variant="body2" paragraph>
              Based on the analysis, here are the top recommendations for improving code security:
            </Typography>
            <ol>
              <li>
                <Typography variant="body2" paragraph>
                  <strong>Improve memory management:</strong> Implement proper bounds checking and memory allocation/deallocation practices to address the {typeCounts['Memory Safety']} memory safety issues.
                </Typography>
              </li>
              <li>
                <Typography variant="body2" paragraph>
                  <strong>Enhance input validation:</strong> Add thorough validation for all user inputs to prevent security vulnerabilities like command injection and format string vulnerabilities.
                </Typography>
              </li>
              <li>
                <Typography variant="body2" paragraph>
                  <strong>Implement code reviews:</strong> Add mandatory code reviews focusing on security aspects before merging new code.
                </Typography>
              </li>
              <li>
                <Typography variant="body2" paragraph>
                  <strong>Add automated scanning:</strong> Integrate these static analysis tools into your CI/CD pipeline to catch issues early.
                </Typography>
              </li>
              <li>
                <Typography variant="body2" paragraph>
                  <strong>Developer training:</strong> Provide training on secure coding practices, especially for memory management in C/C++.
                </Typography>
              </li>
            </ol>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Vulnerabilities
      </Typography>

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
    </Box>
  );
};

export default VulnerabilitiesPage;