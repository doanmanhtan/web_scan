import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Chip,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Save as SaveIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  BugReport as BugIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

// Mock report data
const reportDetail = {
  id: 1,
  name: 'Project Alpha Full Scan',
  date: '2025-04-22 10:30:45',
  user: 'admin',
  status: 'completed',
  scanDuration: '00:15:32',
  filesScanned: 87,
  linesOfCode: 12480,
  issuesBySeverity: {
    critical: 2,
    high: 8,
    medium: 10,
    low: 3,
  },
  issuesByType: {
    'Memory Safety': 9,
    'Security': 5,
    'Code Quality': 4,
    'Performance': 3,
    'Concurrency': 2,
  },
  issuesByTool: {
    'semgrep': 8,
    'snyk': 6, 
    'clangtidy': 9,
  },
};

const severityColors = {
  critical: '#d32f2f',
  high: '#f44336',
  medium: '#ff9800',
  low: '#4caf50',
};

const pieChartData = Object.entries(reportDetail.issuesBySeverity).map(([name, value]) => ({
  name: name.charAt(0).toUpperCase() + name.slice(1),
  value,
  color: severityColors[name],
}));

const typeChartData = Object.entries(reportDetail.issuesByType).map(([name, value]) => ({
  name,
  value,
}));

const toolChartData = Object.entries(reportDetail.issuesByTool).map(([name, value]) => ({
  name,
  value,
}));

const ReportDetail = () => {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              {reportDetail.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Scan Date: {reportDetail.date}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Scan Duration: {reportDetail.scanDuration}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip 
                label={`${reportDetail.filesScanned} Files Scanned`} 
                size="small" 
                sx={{ mr: 1 }}
              />
              <Chip 
                label={`${reportDetail.linesOfCode.toLocaleString()} Lines of Code`} 
                size="small" 
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: { xs: 2, sm: 0 } }}>
            <Button startIcon={<SaveIcon />} variant="outlined" size="small">
              Save
            </Button>
            <Button startIcon={<PrintIcon />} variant="outlined" size="small">
              Print
            </Button>
            <Button startIcon={<ShareIcon />} variant="outlined" size="small">
              Share
            </Button>
          </Box>
        </Box>
      </Paper>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" icon={<Description />} iconPosition="start" />
        <Tab label="Issues" icon={<BugIcon />} iconPosition="start" />
        <Tab label="Code" icon={<CodeIcon />} iconPosition="start" />
      </Tabs>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Issues Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: severityColors.critical, color: 'white' }}>
                    <Typography variant="h4">{reportDetail.issuesBySeverity.critical}</Typography>
                    <Typography variant="subtitle2">Critical</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: severityColors.high, color: 'white' }}>
                    <Typography variant="h4">{reportDetail.issuesBySeverity.high}</Typography>
                    <Typography variant="subtitle2">High</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: severityColors.medium, color: 'white' }}>
                    <Typography variant="h4">{reportDetail.issuesBySeverity.medium}</Typography>
                    <Typography variant="subtitle2">Medium</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: severityColors.low, color: 'white' }}>
                    <Typography variant="h4">{reportDetail.issuesBySeverity.low}</Typography>
                    <Typography variant="subtitle2">Low</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                Issues by Severity
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                Issues by Type
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Issues" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Tool Effectiveness
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={toolChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Issues Found" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">Issues List</Typography>
          <Typography color="text.secondary">
            This tab would display the detailed list of issues found in the scan.
          </Typography>
        </Paper>
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">Code View</Typography>
          <Typography color="text.secondary">
            This tab would display the code with highlighted issues.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ReportDetail;