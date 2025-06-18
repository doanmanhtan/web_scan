// import React, { useState } from 'react';
// import {
//   Box,
//   Typography,
//   Paper,
//   Tabs,
//   Tab,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Chip,
//   IconButton,
//   Button,
//   Grid,
//   Divider,
//   Card,
//   CardContent,
//   Accordion,
//   AccordionSummary,
//   AccordionDetails,
// } from '@mui/material';
// import {
//   ExpandMore as ExpandMoreIcon,
//   BugReport as BugIcon,
//   Error as ErrorIcon,
//   Warning as WarningIcon,
//   Info as InfoIcon,
//   Code as CodeIcon,
//   Assignment as AssignmentIcon,
//   Description as DescriptionIcon,
//   Save as SaveIcon,
//   Print as PrintIcon,
//   Share as ShareIcon,
// } from '@mui/icons-material';
// import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// // Mock data for demonstration
// const mockVulnerabilities = [
//   { id: 1, name: 'Buffer Overflow', severity: 'high', type: 'Memory Safety', file: 'main.cpp', line: 42, column: 15, tool: 'semgrep', status: 'open', description: 'Potential buffer overflow vulnerability detected. Missing bounds check before memory access.' },
//   { id: 2, name: 'Memory Leak', severity: 'medium', type: 'Memory Safety', file: 'utils.c', line: 87, column: 10, tool: 'clangtidy', status: 'open', description: 'Memory allocated but never freed, causing memory leak.' },
//   { id: 3, name: 'Use After Free', severity: 'high', type: 'Memory Safety', file: 'parser.cpp', line: 124, column: 8, tool: 'snyk', status: 'in_progress', description: 'Accessing memory after it has been freed.' },
//   { id: 4, name: 'Uninitialized Variable', severity: 'low', type: 'Code Quality', file: 'config.c', line: 32, column: 20, tool: 'semgrep', status: 'open', description: 'Variable may be used before initialization.' },
//   { id: 5, name: 'Integer Overflow', severity: 'medium', type: 'Security', file: 'math.cpp', line: 74, column: 12, tool: 'clangtidy', status: 'fixed', description: 'Potential integer overflow when performing arithmetic operation.' },
//   { id: 6, name: 'Format String Vulnerability', severity: 'critical', type: 'Security', file: 'logger.c', line: 53, column: 5, tool: 'snyk', status: 'open', description: 'Format string vulnerability that could lead to arbitrary code execution.' },
//   { id: 7, name: 'Redundant Code', severity: 'low', type: 'Code Quality', file: 'helpers.cpp', line: 91, column: 3, tool: 'semgrep', status: 'ignored', description: 'Redundant code detected that has no effect.' },
// ];

// // Prepare data for charts
// const severityCounts = {
//   critical: mockVulnerabilities.filter(v => v.severity === 'critical').length,
//   high: mockVulnerabilities.filter(v => v.severity === 'high').length,
//   medium: mockVulnerabilities.filter(v => v.severity === 'medium').length,
//   low: mockVulnerabilities.filter(v => v.severity === 'low').length,
// };

// const toolCounts = {
//   semgrep: mockVulnerabilities.filter(v => v.tool === 'semgrep').length,
//   snyk: mockVulnerabilities.filter(v => v.tool === 'snyk').length,
//   clangtidy: mockVulnerabilities.filter(v => v.tool === 'clangtidy').length,
// };

// const pieChartData = [
//   { name: 'Critical', value: severityCounts.critical, color: '#d32f2f' },
//   { name: 'High', value: severityCounts.high, color: '#f44336' },
//   { name: 'Medium', value: severityCounts.medium, color: '#ff9800' },
//   { name: 'Low', value: severityCounts.low, color: '#4caf50' },
// ];

// const barChartData = [
//   { name: 'Semgrep', value: toolCounts.semgrep },
//   { name: 'Snyk', value: toolCounts.snyk },
//   { name: 'ClangTidy', value: toolCounts.clangtidy },
// ];

// const getSeverityColor = (severity) => {
//   switch (severity.toLowerCase()) {
//     case 'critical':
//       return 'error';
//     case 'high':
//       return 'error';
//     case 'medium':
//       return 'warning';
//     case 'low':
//       return 'success';
//     default:
//       return 'default';
//   }
// };

// const getSeverityIcon = (severity) => {
//   switch (severity.toLowerCase()) {
//     case 'critical':
//     case 'high':
//       return <ErrorIcon />;
//     case 'medium':
//       return <WarningIcon />;
//     case 'low':
//       return <InfoIcon />;
//     default:
//       return <InfoIcon />;
//   }
// };

// const ScanResults = () => {
//   const [tabValue, setTabValue] = useState(0);

//   const handleTabChange = (event, newValue) => {
//     setTabValue(newValue);
//   };

//   return (
//     <Box>
//       <Paper sx={{ p: 3, mb: 4 }}>
//         <Typography variant="h5" gutterBottom>
//           Scan Completed
//         </Typography>
//         <Grid container spacing={3}>
//           <Grid item xs={12} md={6}>
//             <Typography variant="body1">
//               <strong>Scan Date:</strong> {new Date().toLocaleString()}
//             </Typography>
//             <Typography variant="body1">
//               <strong>Files Scanned:</strong> 42
//             </Typography>
//             <Typography variant="body1">
//               <strong>Tools Used:</strong> semgrep, snyk, clangtidy
//             </Typography>
//           </Grid>
//           <Grid item xs={12} md={6}>
//             <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
//               <Button startIcon={<SaveIcon />} variant="outlined">
//                 Save
//               </Button>
//               <Button startIcon={<PrintIcon />} variant="outlined">
//                 Print
//               </Button>
//               <Button startIcon={<ShareIcon />} variant="outlined">
//                 Share
//               </Button>
//             </Box>
//           </Grid>
//         </Grid>
//       </Paper>

//       <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
//         <Tab label="Overview" icon={<AssignmentIcon />} iconPosition="start" />
//         <Tab label="Vulnerabilities" icon={<BugIcon />} iconPosition="start" />
//         <Tab label="Code View" icon={<CodeIcon />} iconPosition="start" />
//         <Tab label="Detailed Report" icon={<DescriptionIcon />} iconPosition="start" />
//       </Tabs>

//       {tabValue === 0 && (
//         <Grid container spacing={3}>
//           <Grid item xs={12} md={6}>
//             <Card sx={{ height: '100%' }}>
//               <CardContent>
//                 <Typography variant="h6" gutterBottom>
//                   Vulnerabilities by Severity
//                 </Typography>
//                 <ResponsiveContainer width="100%" height={300}>
//                   <PieChart>
//                     <Pie
//                       data={pieChartData}
//                       cx="50%"
//                       cy="50%"
//                       outerRadius={100}
//                       fill="#8884d8"
//                       dataKey="value"
//                       label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//                     >
//                       {pieChartData.map((entry, index) => (
//                         <Cell key={`cell-${index}`} fill={entry.color} />
//                       ))}
//                     </Pie>
//                     <Tooltip formatter={(value) => [value, 'Issues']} />
//                     <Legend />
//                   </PieChart>
//                 </ResponsiveContainer>
//               </CardContent>
//             </Card>
//           </Grid>
          
//           <Grid item xs={12} md={6}>
//             <Card sx={{ height: '100%' }}>
//               <CardContent>
//                 <Typography variant="h6" gutterBottom>
//                   Issues by Tool
//                 </Typography>
//                 <ResponsiveContainer width="100%" height={300}>
//                   <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="name" />
//                     <YAxis />
//                     <Tooltip />
//                     <Legend />
//                     <Bar dataKey="value" name="Issues Found" fill="#8884d8" />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </CardContent>
//             </Card>
//           </Grid>
          
//           <Grid item xs={12}>
//             <Card>
//               <CardContent>
//                 <Typography variant="h6" gutterBottom>
//                   Summary
//                 </Typography>
//                 <Grid container spacing={2}>
//                   <Grid item xs={6} sm={3}>
//                     <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#d32f2f', color: 'white' }}>
//                       <Typography variant="h3">{severityCounts.critical}</Typography>
//                       <Typography variant="subtitle2">Critical</Typography>
//                     </Paper>
//                   </Grid>
//                   <Grid item xs={6} sm={3}>
//                     <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f44336', color: 'white' }}>
//                       <Typography variant="h3">{severityCounts.high}</Typography>
//                       <Typography variant="subtitle2">High</Typography>
//                     </Paper>
//                   </Grid>
//                   <Grid item xs={6} sm={3}>
//                     <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#ff9800', color: 'white' }}>
//                       <Typography variant="h3">{severityCounts.medium}</Typography>
//                       <Typography variant="subtitle2">Medium</Typography>
//                     </Paper>
//                   </Grid>
//                   <Grid item xs={6} sm={3}>
//                     <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#4caf50', color: 'white' }}>
//                       <Typography variant="h3">{severityCounts.low}</Typography>
//                       <Typography variant="subtitle2">Low</Typography>
//                     </Paper>
//                   </Grid>
//                 </Grid>
//               </CardContent>
//             </Card>
//           </Grid>
//         </Grid>
//       )}
      
//       {tabValue === 1 && (
//         <TableContainer component={Paper}>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 <TableCell>Severity</TableCell>
//                 <TableCell>Type</TableCell>
//                 <TableCell>File</TableCell>
//                 <TableCell>Line</TableCell>
//                 <TableCell>Tool</TableCell>
//                 <TableCell>Description</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {mockVulnerabilities.map((vuln) => (
//                 <TableRow key={vuln.id} hover>
//                   <TableCell>
//                     <Chip
//                       icon={getSeverityIcon(vuln.severity)}
//                       label={vuln.severity.toUpperCase()}
//                       color={getSeverityColor(vuln.severity)}
//                       size="small"
//                     />
//                   </TableCell>
//                   <TableCell>{vuln.type}</TableCell>
//                   <TableCell>{vuln.file}</TableCell>
//                   <TableCell>{vuln.line}:{vuln.column}</TableCell>
//                   <TableCell>{vuln.tool}</TableCell>
//                   <TableCell>{vuln.description}</TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       )}
      
//       {tabValue === 2 && (
//         <Paper sx={{ p: 3 }}>
//           <Typography variant="h6" gutterBottom>
//             Code View
//           </Typography>
//           <Typography variant="body2" color="text.secondary" paragraph>
//             Select a vulnerability from the list to view the affected code.
//           </Typography>
          
//           {mockVulnerabilities.map((vuln) => (
//             <Accordion key={vuln.id}>
//               <AccordionSummary expandIcon={<ExpandMoreIcon />}>
//                 <Typography sx={{ width: '33%', flexShrink: 0 }}>
//                   {vuln.file} (Line {vuln.line})
//                 </Typography>
//                 <Typography sx={{ color: 'text.secondary' }}>
//                   {vuln.type} - {vuln.severity.toUpperCase()}
//                 </Typography>
//               </AccordionSummary>
//               <AccordionDetails>
//                 <Box
//                   sx={{
//                     p: 2,
//                     backgroundColor: '#f5f5f5',
//                     fontFamily: 'monospace',
//                     borderRadius: 1,
//                     overflowX: 'auto',
//                   }}
//                 >
//                   <pre style={{ margin: 0 }}>
//                     <code>
//                       {/* This would be actual code in a real application */}
//                       {`// Sample code for ${vuln.file}\n`}
//                       {`39  void process_data(char* input, size_t size) {\n`}
//                       {`40      char buffer[10];\n`}
//                       {`41      // Dangerous operation below\n`}
//                       {vuln.line === 42 ? (
//                         <span style={{ backgroundColor: '#ffcccc', display: 'block' }}>
//                           {`42      strcpy(buffer, input);  // Potential buffer overflow\n`}
//                         </span>
//                       ) : (
//                         `42      strcpy(buffer, input);  // Potential buffer overflow\n`
//                       )}
//                       {`43      process_buffer(buffer);\n`}
//                       {`44  }\n`}
//                     </code>
//                   </pre>
//                 </Box>
//                 <Box sx={{ mt: 2 }}>
//                   <Typography variant="subtitle2" gutterBottom>
//                     Fix Recommendation:
//                   </Typography>
//                   <Typography variant="body2">
//                     {vuln.type === 'Buffer Overflow' 
//                       ? 'Use strncpy() instead of strcpy() and ensure the buffer size is respected:'
//                       : 'Ensure proper memory management and bounds checking:'}
//                   </Typography>
//                   <Box
//                     sx={{
//                       p: 2,
//                       mt: 1,
//                       backgroundColor: '#e8f5e9',
//                       fontFamily: 'monospace',
//                       borderRadius: 1,
//                       overflowX: 'auto',
//                     }}
//                   >
//                     <pre style={{ margin: 0 }}>
//                       <code>
//                         {vuln.type === 'Buffer Overflow' 
//                           ? `strncpy(buffer, input, sizeof(buffer) - 1);\nbuffer[sizeof(buffer) - 1] = '\\0';  // Ensure null termination`
//                           : `// Proper implementation would go here based on the specific issue`}
//                       </code>
//                     </pre>
//                   </Box>
//                 </Box>
//               </AccordionDetails>
//             </Accordion>
//           ))}
//         </Paper>
//       )}
      
//       {tabValue === 3 && (
//         <Paper sx={{ p: 3 }}>
//           <Typography variant="h6" gutterBottom>
//             Detailed Report
//           </Typography>
//           <Typography variant="body1" paragraph>
//             This detailed report provides a comprehensive analysis of the security issues found in your codebase.
//           </Typography>
          
//           <Box sx={{ mb: 4 }}>
//             <Typography variant="subtitle1" gutterBottom>
//               Executive Summary
//             </Typography>
//             <Typography variant="body2" paragraph>
//               The scan identified a total of {mockVulnerabilities.length} security issues across your codebase.
//               These include {severityCounts.critical} critical, {severityCounts.high} high, {severityCounts.medium} medium, 
//               and {severityCounts.low} low severity issues. The most common types of vulnerabilities are buffer overflows, 
//               memory leaks, and use-after-free errors, which suggest that memory management is a key area for improvement.
//             </Typography>
//           </Box>
          
//           <Divider sx={{ my: 3 }} />
          
//           <Box sx={{ mb: 4 }}>
//             <Typography variant="subtitle1" gutterBottom>
//               Vulnerability Categories
//             </Typography>
            
//             <Accordion>
//               <AccordionSummary expandIcon={<ExpandMoreIcon />}>
//                 <Typography>Memory Safety Issues</Typography>
//               </AccordionSummary>
//               <AccordionDetails>
//                 <Typography variant="body2" paragraph>
//                   Memory safety issues are a category of vulnerabilities that occur when a program accesses memory 
//                   locations in ways that are unintended or insecure. These issues include buffer overflows, 
//                   use-after-free errors, and memory leaks.
//                 </Typography>
//                 <Typography variant="body2" paragraph>
//                   In your codebase, we identified several memory safety issues, primarily in the file handlers 
//                   and data processing components.
//                 </Typography>
//               </AccordionDetails>
//             </Accordion>
            
//             <Accordion>
//               <AccordionSummary expandIcon={<ExpandMoreIcon />}>
//                 <Typography>Input Validation</Typography>
//               </AccordionSummary>
//               <AccordionDetails>
//                 <Typography variant="body2" paragraph>
//                   Input validation vulnerabilities occur when a program fails to properly validate or sanitize 
//                   user-provided input before using it in sensitive operations.
//                 </Typography>
//                 <Typography variant="body2" paragraph>
//                   The scan identified some instances where input validation is insufficient, particularly in 
//                   file parsing routines.
//                 </Typography>
//               </AccordionDetails>
//             </Accordion>
//           </Box>
          
//           <Divider sx={{ my: 3 }} />
          
//           <Box>
//             <Typography variant="subtitle1" gutterBottom>
//               Remediation Recommendations
//             </Typography>
//             <Typography variant="body2" paragraph>
//               1. Implement proper bounds checking for all buffer operations
//             </Typography>
//             <Typography variant="body2" paragraph>
//               2. Use safer alternatives to dangerous functions (e.g., strncpy instead of strcpy)
//             </Typography>
//             <Typography variant="body2" paragraph>
//               3. Ensure that all memory allocations are properly freed
//             </Typography>
//             <Typography variant="body2" paragraph>
//               4. Add input validation for all user-provided data
//             </Typography>
//             <Typography variant="body2" paragraph>
//               5. Consider using static analysis tools as part of your CI/CD pipeline
//             </Typography>
//           </Box>
//         </Paper>
//       )}
//     </Box>
//   );
// };

// export default ScanResults;


// src/components/Scanner/ScanResults.js - FIXED VERSION
import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Alert,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  BugReport as BugIcon,
  Security as SecurityIcon,
  Code as CodeIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const ScanResults = ({ results, issuesFound, currentFile }) => {
  // Debug logging
  console.log('🎯 ScanResults component received:');
  console.log('  - results:', results?.length || 0, 'items');
  console.log('  - issuesFound:', issuesFound);
  console.log('  - currentFile:', currentFile);

  // Process results to categorize by severity
  const processedResults = useMemo(() => {
    if (!results || !Array.isArray(results) || results.length === 0) {
      return {
        critical: [],
        high: [],
        medium: [],
        low: [],
        counts: { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
      };
    }

    const categorized = { critical: [], high: [], medium: [], low: [] };

    results.forEach((result) => {
      const severity = (result.severity || 'low').toLowerCase();
      
      switch (severity) {
        case 'critical':
        case 'error':
          categorized.critical.push(result);
          break;
        case 'high':
        case 'warning':
          categorized.high.push(result);
          break;
        case 'medium':
        case 'moderate':
          categorized.medium.push(result);
          break;
        case 'low':
        case 'info':
        case 'note':
        default:
          categorized.low.push(result);
          break;
      }
    });

    const counts = {
      critical: categorized.critical.length,
      high: categorized.high.length,
      medium: categorized.medium.length,
      low: categorized.low.length,
      total: results.length
    };

    return { ...categorized, counts };
  }, [results]);

  const { critical, high, medium, low, counts } = processedResults;

  // Colors for charts and UI
  const COLORS = {
    critical: '#f44336',
    high: '#ff9800', 
    medium: '#2196f3',
    low: '#4caf50',
  };

  // Pie chart data
  const pieChartData = [
    { name: 'Critical', value: counts.critical, color: COLORS.critical },
    { name: 'High', value: counts.high, color: COLORS.high },
    { name: 'Medium', value: counts.medium, color: COLORS.medium },
    { name: 'Low', value: counts.low, color: COLORS.low },
  ].filter(item => item.value > 0);

  // If no results, show appropriate message
  if (!results || results.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CheckCircle color="success" sx={{ fontSize: 48, mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No Issues Found
        </Typography>
        <Typography color="textSecondary">
          {issuesFound === 0 
            ? "Great! No security issues were detected in your code."
            : "Scan completed but no detailed results are available."}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <SecurityIcon sx={{ mr: 1 }} />
        Scan Results
      </Typography>

      {/* Summary Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
            {/* FIXED: Use component="div" to avoid <p> containing <div> */}
            <Typography component="div" variant="body2" fontWeight="bold">
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box component="span">Total Issues</Box>
                <Chip 
                  size="small" 
                  icon={<BugIcon />} 
                  label={counts.total} 
                  color="default" 
                />
              </Box>
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
            <Typography component="div" variant="body2" fontWeight="bold">
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box component="span">Critical & High</Box>
                <Chip 
                  size="small" 
                  icon={<ErrorIcon />} 
                  label={counts.critical + counts.high} 
                  sx={{ bgcolor: 'error.dark', color: 'white' }}
                />
              </Box>
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <Typography component="div" variant="body2" fontWeight="bold">
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box component="span">Medium & Low</Box>
                <Chip 
                  size="small" 
                  icon={<InfoIcon />} 
                  label={counts.medium + counts.low} 
                  sx={{ bgcolor: 'warning.dark', color: 'white' }}
                />
              </Box>
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts and Details */}
      <Grid container spacing={3}>
        {/* Pie Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Issues by Severity
            </Typography>
            {pieChartData.length > 0 ? (
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
            ) : (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">No issues to display</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Severity Breakdown */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Severity Breakdown
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <ErrorIcon sx={{ color: COLORS.critical }} />
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography component="div">
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box component="span">Critical Issues</Box>
                        <Chip 
                          size="small" 
                          label={counts.critical} 
                          sx={{ bgcolor: COLORS.critical, color: 'white' }}
                        />
                      </Box>
                    </Typography>
                  }
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <WarningIcon sx={{ color: COLORS.high }} />
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography component="div">
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box component="span">High Issues</Box>
                        <Chip 
                          size="small" 
                          label={counts.high} 
                          sx={{ bgcolor: COLORS.high, color: 'white' }}
                        />
                      </Box>
                    </Typography>
                  }
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <InfoIcon sx={{ color: COLORS.medium }} />
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography component="div">
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box component="span">Medium Issues</Box>
                        <Chip 
                          size="small" 
                          label={counts.medium} 
                          sx={{ bgcolor: COLORS.medium, color: 'white' }}
                        />
                      </Box>
                    </Typography>
                  }
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <InfoIcon sx={{ color: COLORS.low }} />
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography component="div">
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box component="span">Low Issues</Box>
                        <Chip 
                          size="small" 
                          label={counts.low} 
                          sx={{ bgcolor: COLORS.low, color: 'white' }}
                        />
                      </Box>
                    </Typography>
                  }
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Issues List */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Detailed Issues ({counts.total})
              </Typography>
              <IconButton size="small">
                <DownloadIcon />
              </IconButton>
            </Box>
            
            {counts.critical > 0 && (
              <>
                <Typography variant="subtitle1" sx={{ color: COLORS.critical, fontWeight: 'bold', mt: 2 }}>
                  Critical Issues ({counts.critical})
                </Typography>
                <List>
                  {critical.map((issue, index) => (
                    <ListItem key={`critical-${index}`} divider>
                      <ListItemIcon>
                        <ErrorIcon sx={{ color: COLORS.critical }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={issue.name || issue.title || 'Critical Issue'}
                        secondary={
                          <Typography component="div" variant="body2" color="text.secondary">
                            <Box component="span" display="block">
                              {issue.description || issue.message || 'No description available'}
                            </Box>
                            <Box component="span" display="inline-flex" alignItems="center" gap={1} mt={0.5}>
                              {issue.file && (
                                <Chip size="small" label={issue.file.fileName || issue.file} variant="outlined" />
                              )}
                              {issue.tool && (
                                <Chip size="small" label={issue.tool} color="primary" variant="outlined" />
                              )}
                              {issue.location?.line && (
                                <Chip size="small" label={`Line ${issue.location.line}`} variant="outlined" />
                              )}
                            </Box>
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {counts.high > 0 && (
              <>
                <Typography variant="subtitle1" sx={{ color: COLORS.high, fontWeight: 'bold', mt: 2 }}>
                  High Issues ({counts.high})
                </Typography>
                <List>
                  {high.map((issue, index) => (
                    <ListItem key={`high-${index}`} divider>
                      <ListItemIcon>
                        <WarningIcon sx={{ color: COLORS.high }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={issue.name || issue.title || 'High Issue'}
                        secondary={
                          <Typography component="div" variant="body2" color="text.secondary">
                            <Box component="span" display="block">
                              {issue.description || issue.message || 'No description available'}
                            </Box>
                            <Box component="span" display="inline-flex" alignItems="center" gap={1} mt={0.5}>
                              {issue.file && (
                                <Chip size="small" label={issue.file.fileName || issue.file} variant="outlined" />
                              )}
                              {issue.tool && (
                                <Chip size="small" label={issue.tool} color="primary" variant="outlined" />
                              )}
                              {issue.location?.line && (
                                <Chip size="small" label={`Line ${issue.location.line}`} variant="outlined" />
                              )}
                            </Box>
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {(counts.medium > 0 || counts.low > 0) && (
              <>
                <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 'bold', mt: 2 }}>
                  Other Issues ({counts.medium + counts.low})
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {counts.medium} Medium + {counts.low} Low severity issues
                </Typography>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ScanResults;