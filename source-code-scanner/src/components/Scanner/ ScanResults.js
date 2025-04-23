import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Grid,
  Divider,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  BugReport as BugIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Code as CodeIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Mock data for demonstration
const mockVulnerabilities = [
  { id: 1, tool: 'semgrep', severity: 'high', type: 'Buffer Overflow', file: 'main.cpp', line: 42, column: 15, description: 'Potential buffer overflow vulnerability detected. Missing bounds check before memory access.' },
  { id: 2, tool: 'clangtidy', severity: 'medium', type: 'Memory Leak', file: 'utils.c', line: 87, column: 10, description: 'Memory allocated but never freed, causing memory leak.' },
  { id: 3, tool: 'snyk', severity: 'high', type: 'Use After Free', file: 'parser.cpp', line: 124, column: 8, description: 'Accessing memory after it has been freed.' },
  { id: 4, tool: 'semgrep', severity: 'low', type: 'Uninitialized Variable', file: 'config.c', line: 32, column: 20, description: 'Variable may be used before initialization.' },
  { id: 5, tool: 'clangtidy', severity: 'medium', type: 'Integer Overflow', file: 'math.cpp', line: 74, column: 12, description: 'Potential integer overflow when performing arithmetic operation.' },
  { id: 6, tool: 'snyk', severity: 'critical', type: 'Format String Vulnerability', file: 'logger.c', line: 53, column: 5, description: 'Format string vulnerability that could lead to arbitrary code execution.' },
  { id: 7, tool: 'semgrep', severity: 'low', type: 'Redundant Code', file: 'helpers.cpp', line: 91, column: 3, description: 'Redundant code detected that has no effect.' },
];

// Prepare data for charts
const severityCounts = {
  critical: mockVulnerabilities.filter(v => v.severity === 'critical').length,
  high: mockVulnerabilities.filter(v => v.severity === 'high').length,
  medium: mockVulnerabilities.filter(v => v.severity === 'medium').length,
  low: mockVulnerabilities.filter(v => v.severity === 'low').length,
};

const toolCounts = {
  semgrep: mockVulnerabilities.filter(v => v.tool === 'semgrep').length,
  snyk: mockVulnerabilities.filter(v => v.tool === 'snyk').length,
  clangtidy: mockVulnerabilities.filter(v => v.tool === 'clangtidy').length,
};

const pieChartData = [
  { name: 'Critical', value: severityCounts.critical, color: '#d32f2f' },
  { name: 'High', value: severityCounts.high, color: '#f44336' },
  { name: 'Medium', value: severityCounts.medium, color: '#ff9800' },
  { name: 'Low', value: severityCounts.low, color: '#4caf50' },
];

const barChartData = [
  { name: 'Semgrep', value: toolCounts.semgrep },
  { name: 'Snyk', value: toolCounts.snyk },
  { name: 'ClangTidy', value: toolCounts.clangtidy },
];

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

const ScanResults = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Scan Completed
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="body1">
              <strong>Scan Date:</strong> {new Date().toLocaleString()}
            </Typography>
            <Typography variant="body1">
              <strong>Files Scanned:</strong> 42
            </Typography>
            <Typography variant="body1">
              <strong>Tools Used:</strong> semgrep, snyk, clangtidy
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button startIcon={<SaveIcon />} variant="outlined">
                Save
              </Button>
              <Button startIcon={<PrintIcon />} variant="outlined">
                Print
              </Button>
              <Button startIcon={<ShareIcon />} variant="outlined">
                Share
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" icon={<AssignmentIcon />} iconPosition="start" />
        <Tab label="Vulnerabilities" icon={<BugIcon />} iconPosition="start" />
        <Tab label="Code View" icon={<CodeIcon />} iconPosition="start" />
        <Tab label="Detailed Report" icon={<DescriptionIcon />} iconPosition="start" />
      </Tabs>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
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
                <Typography variant="h6" gutterBottom>
                  Issues by Tool
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
          
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Summary
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
        </Grid>
      )}
      
      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Severity</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>File</TableCell>
                <TableCell>Line</TableCell>
                <TableCell>Tool</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockVulnerabilities.map((vuln) => (
                <TableRow key={vuln.id} hover>
                  <TableCell>
                    <Chip
                      icon={getSeverityIcon(vuln.severity)}
                      label={vuln.severity.toUpperCase()}
                      color={getSeverityColor(vuln.severity)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{vuln.type}</TableCell>
                  <TableCell>{vuln.file}</TableCell>
                  <TableCell>{vuln.line}:{vuln.column}</TableCell>
                  <TableCell>{vuln.tool}</TableCell>
                  <TableCell>{vuln.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Code View
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Select a vulnerability from the list to view the affected code.
          </Typography>
          
          {mockVulnerabilities.map((vuln) => (
            <Accordion key={vuln.id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ width: '33%', flexShrink: 0 }}>
                  {vuln.file} (Line {vuln.line})
                </Typography>
                <Typography sx={{ color: 'text.secondary' }}>
                  {vuln.type} - {vuln.severity.toUpperCase()}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
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
                    {/* This would be actual code in a real application */}
                    <code>
                      {`// Sample code for ${vuln.file}\n`}
                      {`39  void process_data(char* input, size_t size) {\n`}
                      {`40      char buffer[10];\n`}
                      {`41      // Dangerous operation below\n`}
                      {vuln.line === 42 ? (
                        <span style={{ backgroundColor: '#ffcccc', display: 'block' }}>
                          {`42      strcpy(buffer, input);  // Potential buffer overflow\n`}
                        </span>
                      ) : (
                        `42      strcpy(buffer, input);  // Potential buffer overflow\n`
                      )}
                      {`43      process_buffer(buffer);\n`}
                      {`44  }\n`}
                    </code>
                  </pre>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Fix Recommendation:
                  </Typography>
                  <Typography variant="body2">
                    {vuln.type === 'Buffer Overflow' 
                      ? 'Use strncpy() instead of strcpy() and ensure the buffer size is respected:'
                      : 'Ensure proper memory management and bounds checking:'}
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
                        {vuln.type === 'Buffer Overflow' 
                          ? `strncpy(buffer, input, sizeof(buffer) - 1);\nbuffer[sizeof(buffer) - 1] = '\\0';  // Ensure null termination`
                          : `// Proper implementation would go here based on the specific issue`}
                      </code>
                    </pre>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>
      )}
      
      {tabValue === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Detailed Report
          </Typography>
          <Typography variant="body1" paragraph>
            This detailed report provides a comprehensive analysis of the security issues found in your codebase.
          </Typography>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom>
              Executive Summary
            </Typography>
            <Typography variant="body2" paragraph>
              The scan identified a total of {mockVulnerabilities.length} security issues across your codebase.
              These include {severityCounts.critical} critical, {severityCounts.high} high, {severityCounts.medium} medium, 
              and {severityCounts.low} low severity issues. The most common types of vulnerabilities are buffer overflows, 
              memory leaks, and use-after-free errors, which suggest that memory management is a key area for improvement.
            </Typography>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom>
              Vulnerability Categories
            </Typography>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Memory Safety Issues</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" paragraph>
                  Memory safety issues are a category of vulnerabilities that occur when a program accesses memory 
                  locations in ways that are unintended or insecure. These issues include buffer overflows, 
                  use-after-free errors, and memory leaks.
                </Typography>
                <Typography variant="body2" paragraph>
                  In your codebase, we identified several memory safety issues, primarily in the file handlers 
                  and data processing components.
                </Typography>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Input Validation</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" paragraph>
                  Input validation vulnerabilities occur when a program fails to properly validate or sanitize 
                  user-provided input before using it in sensitive operations.
                </Typography>
                <Typography variant="body2" paragraph>
                  The scan identified some instances where input validation is insufficient, particularly in 
                  file parsing routines.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Remediation Recommendations
            </Typography>
            <Typography variant="body2" paragraph>
              1. Implement proper bounds checking for all buffer operations
            </Typography>
            <Typography variant="body2" paragraph>
              2. Use safer alternatives to dangerous functions (e.g., strncpy instead of strcpy)
            </Typography>
            <Typography variant="body2" paragraph>
              3. Ensure that all memory allocations are properly freed
            </Typography>
            <Typography variant="body2" paragraph>
              4. Add input validation for all user-provided data
            </Typography>
            <Typography variant="body2" paragraph>
              5. Consider using static analysis tools as part of your CI/CD pipeline
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default ScanResults;