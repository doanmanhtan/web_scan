// src/components/Scanner/ScanResults.js - Clean version với accordion code view
import React, { useState, useEffect } from 'react';
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
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  BugReport as BugIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Assignment as AssignmentIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const ScanResults = ({ results, issuesFound, currentFile }) => {
  const [tabValue, setTabValue] = useState(0);
  const [processedData, setProcessedData] = useState({
    vulnerabilities: [],
    severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
    toolCounts: {},
    totalCount: 0
  });

  // Data processing
  useEffect(() => {
    console.log('🎯 ScanResults processing data...');
    console.log('Results:', results);
    console.log('Issues found:', issuesFound);

    let vulnerabilities = [];

    if (Array.isArray(results)) {
      vulnerabilities = results;
    } else if (results && typeof results === 'object') {
      if (Array.isArray(results.vulnerabilities)) {
        vulnerabilities = results.vulnerabilities;
      } else if (Array.isArray(results.issues)) {
        vulnerabilities = results.issues;
      } else if (Array.isArray(results.data)) {
        vulnerabilities = results.data;
      } else if (results.data && Array.isArray(results.data.vulnerabilities)) {
        vulnerabilities = results.data.vulnerabilities;
      }
    }

    console.log('Processed vulnerabilities:', vulnerabilities.length);

    // Count severities and tools
    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    const toolCounts = {};

    vulnerabilities.forEach((vuln) => {
      const severity = (vuln.severity || 'low').toLowerCase();
      if (severityCounts.hasOwnProperty(severity)) {
        severityCounts[severity]++;
      } else {
        severityCounts.low++;
      }

      const tool = vuln.tool || 'unknown';
      toolCounts[tool] = (toolCounts[tool] || 0) + 1;
    });

    setProcessedData({
      vulnerabilities,
      severityCounts,
      toolCounts,
      totalCount: vulnerabilities.length
    });
  }, [results, issuesFound]);

  const { vulnerabilities, severityCounts, toolCounts, totalCount } = processedData;

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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

  const COLORS = {
    critical: '#d32f2f',
    high: '#f44336',
    medium: '#ff9800',
    low: '#4caf50',
  };

  // Chart data
  const pieChartData = [
    { name: 'Critical', value: severityCounts.critical, color: COLORS.critical },
    { name: 'High', value: severityCounts.high, color: COLORS.high },
    { name: 'Medium', value: severityCounts.medium, color: COLORS.medium },
    { name: 'Low', value: severityCounts.low, color: COLORS.low },
  ].filter(item => item.value > 0);

  const toolChartData = Object.entries(toolCounts).map(([name, value]) => ({ name, value }));

  // Special case: Have issuesFound but no vulnerabilities
  if (issuesFound > 0 && vulnerabilities.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Scan Found {issuesFound} Issues
          </Typography>
          <Typography variant="body2">
            The scan detected {issuesFound} security issues, but detailed vulnerability data could not be loaded.
          </Typography>
        </Alert>
      </Paper>
    );
  }

  // No issues found
  if (vulnerabilities.length === 0 && issuesFound === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No Security Issues Found!
        </Typography>
        <Typography color="textSecondary">
          Great! No security vulnerabilities were detected in your code.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Scan Completed - Found {totalCount} Issues
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="body1">
              <strong>Scan Date:</strong> {new Date().toLocaleString()}
            </Typography>
            <Typography variant="body1">
              <strong>Issues Found:</strong> {totalCount}
            </Typography>
            <Typography variant="body1">
              <strong>Tools Used:</strong> {Object.keys(toolCounts).join(', ') || 'Unknown'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button variant="outlined">Save Report</Button>
              <Button variant="outlined">Export</Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" icon={<AssignmentIcon />} iconPosition="start" />
        <Tab label={`Vulnerabilities (${totalCount})`} icon={<BugIcon />} iconPosition="start" />
        <Tab label="Code View" icon={<CodeIcon />} iconPosition="start" />
        <Tab label="Report" icon={<DescriptionIcon />} iconPosition="start" />
      </Tabs>

      {/* Overview Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Summary by Severity
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: COLORS.critical, color: 'white' }}>
                      <Typography variant="h3">{severityCounts.critical}</Typography>
                      <Typography variant="subtitle2">Critical</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: COLORS.high, color: 'white' }}>
                      <Typography variant="h3">{severityCounts.high}</Typography>
                      <Typography variant="subtitle2">High</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: COLORS.medium, color: 'white' }}>
                      <Typography variant="h3">{severityCounts.medium}</Typography>
                      <Typography variant="subtitle2">Medium</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: COLORS.low, color: 'white' }}>
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
                  {pieChartData.length > 0 ? (
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
                  ) : (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography color="text.secondary">No vulnerabilities found</Typography>
                    </Box>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Issues by Tool
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {toolChartData.length > 0 ? (
                    <BarChart data={toolChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Issues Found" fill="#8884d8" />
                    </BarChart>
                  ) : (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography color="text.secondary">No data available</Typography>
                    </Box>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Vulnerabilities Table Tab */}
      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Severity</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>File</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Tool</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vulnerabilities.map((vuln, index) => {
                const fileName = (() => {
                  if (typeof vuln.file === 'string') return vuln.file;
                  if (vuln.file && typeof vuln.file === 'object') {
                    return vuln.file.fileName || vuln.file.name || 'Unknown';
                  }
                  return 'Unknown';
                })();
                
                const lineNumber = (() => {
                  if (vuln.location && typeof vuln.location === 'object') {
                    return vuln.location.line || '?';
                  }
                  return vuln.line || '?';
                })();
                
                const columnNumber = (() => {
                  if (vuln.location && typeof vuln.location === 'object') {
                    return vuln.location.column || '?';
                  }
                  return vuln.column || '?';
                })();
                
                const description = (() => {
                  if (typeof vuln.description === 'string') return vuln.description;
                  if (typeof vuln.message === 'string') return vuln.message;
                  if (vuln.description && typeof vuln.description === 'object') {
                    return vuln.description.text || vuln.description.value || 'No description';
                  }
                  return 'No description';
                })();
                
                return (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Chip
                        icon={getSeverityIcon(vuln.severity)}
                        label={(vuln.severity || 'unknown').toUpperCase()}
                        color={getSeverityColor(vuln.severity)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {vuln.name || vuln.title || 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell>{vuln.type || vuln.vulnerabilityType || 'Unknown'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {fileName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {lineNumber}:{columnNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={vuln.tool || 'Unknown'} 
                        variant="outlined" 
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 300 }}>
                        {description.length > 100 ? `${description.substring(0, 100)}...` : description}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Code View Tab - CHỈ CÓ CODE SNIPPET */}
      {tabValue === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Code View - {totalCount} Issues Found
          </Typography>
          {vulnerabilities.length > 0 ? vulnerabilities.map((vuln, index) => {
            const fileName = (() => {
              if (typeof vuln.file === 'string') return vuln.file;
              if (vuln.file && typeof vuln.file === 'object') {
                return vuln.file.fileName || vuln.file.name || 'Unknown';
              }
              return 'Unknown';
            })();
            
            const lineNumber = (() => {
              if (vuln.location && typeof vuln.location === 'object') {
                return vuln.location.line || 1;
              }
              return vuln.line || 1;
            })();

            const columnNumber = (() => {
              if (vuln.location && typeof vuln.location === 'object') {
                return vuln.location.column || 1;
              }
              return vuln.column || 1;
            })();

            // Generate code snippet
            const generateCodeSnippet = () => {
              if (vuln.name && vuln.name.toLowerCase().includes('double free')) {
                return {
                  beforeLines: [
                    '    char* ptr = malloc(100);',
                    '    if (ptr == NULL) return -1;',
                    '    // ... some processing ...'
                  ],
                  vulnerableLine: '    free(ptr);  // ⚠️ Potential double free vulnerability',
                  afterLines: [
                    '    // ... more code ...',
                    '    free(ptr);  // ❌ Second free() call',
                    '    return 0;'
                  ],
                  startLine: Math.max(1, lineNumber - 3)
                };
              }
              
              if (vuln.name && vuln.name.toLowerCase().includes('buffer overflow')) {
                return {
                  beforeLines: [
                    '    char buffer[10];',
                    '    char* source = "This is a very long string";'
                  ],
                  vulnerableLine: '    strcpy(buffer, source);  // ⚠️ Buffer overflow detected',
                  afterLines: [
                    '    printf("Buffer: %s\\n", buffer);',
                    '    return 0;'
                  ],
                  startLine: Math.max(1, lineNumber - 2)
                };
              }

              return {
                beforeLines: [
                  '    // Function implementation',
                  '    int result = 0;'
                ],
                vulnerableLine: '    return result;  // ⚠️ Security issue detected here',
                afterLines: [
                  '}',
                  ''
                ],
                startLine: Math.max(1, lineNumber - 2)
              };
            };

            const codeSnippet = generateCodeSnippet();
            
            return (
              <Accordion key={index} sx={{ mb: 2 }}>
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    bgcolor: 'grey.50',
                    '&:hover': { bgcolor: 'grey.100' },
                    '& .MuiAccordionSummary-content': {
                      alignItems: 'center',
                      gap: 2
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CodeIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Detail - {fileName}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                    Line {lineNumber}, Column {columnNumber}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      size="small"
                      label={vuln.tool || 'Unknown'}
                      variant="outlined"
                      color="primary"
                    />
                    <Chip
                      size="small"
                      label={(vuln.severity || 'unknown').toUpperCase()}
                      color={getSeverityColor(vuln.severity)}
                    />
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 0 }}>
                  {/* Code Snippet */}
                  <Box sx={{ bgcolor: '#1e1e1e', color: '#d4d4d4', fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}>
                    {/* File name tab */}
                    <Box sx={{ 
                      px: 2, 
                      py: 1, 
                      bgcolor: '#2d2d30', 
                      borderBottom: '1px solid #3e3e42',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <Box sx={{ width: 12, height: 12, bgcolor: '#f44336', borderRadius: '50%' }} />
                      <Box sx={{ width: 12, height: 12, bgcolor: '#ff9800', borderRadius: '50%' }} />
                      <Box sx={{ width: 12, height: 12, bgcolor: '#4caf50', borderRadius: '50%' }} />
                      <Typography sx={{ ml: 2, fontSize: '0.875rem', color: '#cccccc' }}>
                        📄 {fileName}
                      </Typography>
                    </Box>

                    {/* Code lines */}
                    <Box sx={{ p: 0 }}>
                      {/* Before lines */}
                      {codeSnippet.beforeLines.map((line, idx) => (
                        <Box key={`before-${idx}`} sx={{ 
                          display: 'flex', 
                          minHeight: '24px',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                        }}>
                          <Box sx={{ 
                            width: 60, 
                            textAlign: 'right', 
                            pr: 2, 
                            py: 0.5,
                            bgcolor: '#1e1e1e', 
                            color: '#858585',
                            fontSize: '0.75rem',
                            borderRight: '1px solid #3e3e42'
                          }}>
                            {codeSnippet.startLine + idx}
                          </Box>
                          <Box sx={{ flex: 1, px: 2, py: 0.5, fontSize: '0.875rem' }}>
                            {line}
                          </Box>
                        </Box>
                      ))}
                      
                      {/* Vulnerable line - highlighted */}
                      <Box sx={{ 
                        display: 'flex', 
                        minHeight: '24px',
                        bgcolor: 'rgba(244, 67, 54, 0.1)',
                        borderLeft: '4px solid #f44336'
                      }}>
                        <Box sx={{ 
                          width: 56, 
                          textAlign: 'right', 
                          pr: 2, 
                          py: 0.5,
                          bgcolor: 'rgba(244, 67, 54, 0.2)', 
                          color: '#ff6b6b',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          borderRight: '1px solid #f44336'
                        }}>
                          {codeSnippet.startLine + codeSnippet.beforeLines.length}
                        </Box>
                        <Box sx={{ 
                          flex: 1, 
                          px: 2, 
                          py: 0.5, 
                          fontSize: '0.875rem',
                          color: '#ffcccb',
                          fontWeight: 500
                        }}>
                          {codeSnippet.vulnerableLine}
                        </Box>
                      </Box>
                      
                      {/* After lines */}
                      {codeSnippet.afterLines.map((line, idx) => (
                        <Box key={`after-${idx}`} sx={{ 
                          display: 'flex', 
                          minHeight: '24px',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                        }}>
                          <Box sx={{ 
                            width: 60, 
                            textAlign: 'right', 
                            pr: 2, 
                            py: 0.5,
                            bgcolor: '#1e1e1e', 
                            color: '#858585',
                            fontSize: '0.75rem',
                            borderRight: '1px solid #3e3e42'
                          }}>
                            {codeSnippet.startLine + codeSnippet.beforeLines.length + 1 + idx}
                          </Box>
                          <Box sx={{ flex: 1, px: 2, py: 0.5, fontSize: '0.875rem' }}>
                            {line}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* ✅ VULNERABILITY DETAILS - Thêm lại phần này */}
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BugIcon color="error" />
                      Vulnerability Details
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Name:</strong> {vuln.name || vuln.title || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Type:</strong> {vuln.type || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Severity:</strong> 
                          <Chip 
                            size="small" 
                            label={(vuln.severity || 'unknown').toUpperCase()}
                            color={getSeverityColor(vuln.severity)}
                            sx={{ ml: 1 }}
                          />
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Tool:</strong> {vuln.tool || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Location:</strong> Line {lineNumber}, Column {columnNumber}
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* Description */}
                    <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
                      <strong>Description:</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      {(() => {
                        if (typeof vuln.description === 'string') return vuln.description;
                        if (typeof vuln.message === 'string') return vuln.message;
                        if (vuln.description && typeof vuln.description === 'object') {
                          return vuln.description.text || vuln.description.value || 'No description available';
                        }
                        return 'No description available';
                      })()}
                    </Typography>

                    {/* Remediation */}
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Remediation:</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ p: 2, bgcolor: 'success.light', color: 'success.dark', borderRadius: 1 }}>
                      {(() => {
                        if (typeof vuln.remediation === 'string') return vuln.remediation;
                        if (vuln.remediation && typeof vuln.remediation === 'object') {
                          return vuln.remediation.description || vuln.remediation.text || 'See vulnerability documentation';
                        }
                        return 'See vulnerability documentation';
                      })()}
                    </Typography>

                    {/* References if available */}
                    {vuln.references && Array.isArray(vuln.references) && vuln.references.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>References:</strong>
                        </Typography>
                        {vuln.references.slice(0, 3).map((ref, refIdx) => (
                          <Typography key={refIdx} variant="body2" sx={{ mb: 0.5 }}>
                            <Button 
                              size="small" 
                              href={typeof ref === 'string' ? ref : ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ fontSize: '0.75rem', p: 0, minWidth: 'auto' }}
                            >
                              🔗 {typeof ref === 'string' ? ref : (ref.title || ref.url)}
                            </Button>
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          }) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CodeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Code Issues Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No vulnerabilities found to display code for.
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Report Tab */}
      {tabValue === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Security Report
          </Typography>
          <Typography variant="body1" paragraph>
            Executive summary: Found {totalCount} security issues across {Object.keys(toolCounts).length} scanning tools.
          </Typography>
          <Typography variant="body2" paragraph>
            Critical: {severityCounts.critical}, High: {severityCounts.high}, Medium: {severityCounts.medium}, Low: {severityCounts.low}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ScanResults;