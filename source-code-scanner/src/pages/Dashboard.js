import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Security as SecurityIcon,
  History as HistoryIcon,
  BugReport as BugIcon,
  Code as CodeIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Mock data for recent scans
const recentScans = [
  { id: 1, name: 'Project Alpha Scan', date: '2025-04-22', status: 'completed', highIssues: 3, mediumIssues: 8, lowIssues: 12 },
  { id: 2, name: 'Security Audit', date: '2025-04-20', status: 'completed', highIssues: 1, mediumIssues: 4, lowIssues: 7 },
  { id: 3, name: 'Code Cleanup', date: '2025-04-18', status: 'completed', highIssues: 0, mediumIssues: 2, lowIssues: 15 },
];

// Mock data for issues over time
const issuesOverTime = [
  { date: '2025-03-01', high: 8, medium: 15, low: 20 },
  { date: '2025-03-15', high: 7, medium: 13, low: 18 },
  { date: '2025-04-01', high: 5, medium: 10, low: 15 },
  { date: '2025-04-15', high: 4, medium: 8, low: 14 },
  { date: '2025-04-22', high: 3, medium: 6, low: 12 },
];

// Mock data for total issues
const totalIssues = {
  high: 3,
  medium: 6,
  low: 12,
};

const pieChartData = [
  { name: 'High', value: totalIssues.high, color: '#f44336' },
  { name: 'Medium', value: totalIssues.medium, color: '#ff9800' },
  { name: 'Low', value: totalIssues.low, color: '#4caf50' },
];

// Mock data for recent projects
const recentProjects = [
  { id: 1, name: 'Project Alpha', lastScan: '2025-04-22', issuesCount: 23 },
  { id: 2, name: 'Security Module', lastScan: '2025-04-20', issuesCount: 12 },
  { id: 3, name: 'Core Library', lastScan: '2025-04-18', issuesCount: 17 },
];

const Dashboard = () => {
  const navigate = useNavigate();

  const handleStartNewScan = () => {
    navigate('/scanner');
  };

  const getIssueIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <ErrorIcon color="error" />;
      case 'medium':
        return <WarningIcon color="warning" />;
      case 'low':
        return <InfoIcon color="success" />;
      default:
        return <InfoIcon />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleStartNewScan}
        >
          New Scan
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 120 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Total Scans
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              24
              <SecurityIcon sx={{ ml: 1, color: 'primary.main' }} />
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 120 }}>
            <Typography variant="h6" color="warning.main" gutterBottom>
              Open Issues
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              {totalIssues.high + totalIssues.medium + totalIssues.low}
              <BugIcon sx={{ ml: 1, color: 'warning.main' }} />
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 120 }}>
            <Typography variant="h6" color="error.main" gutterBottom>
              Critical Issues
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              {totalIssues.high}
              <ErrorIcon sx={{ ml: 1, color: 'error.main' }} />
            </Typography>
          </Paper>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Issues by Severity
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
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Issues Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={issuesOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="high" stroke="#f44336" name="High" />
                <Line type="monotone" dataKey="medium" stroke="#ff9800" name="Medium" />
                <Line type="monotone" dataKey="low" stroke="#4caf50" name="Low" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Scans */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div">
                  Recent Scans
                </Typography>
                <IconButton size="small">
                  <HistoryIcon />
                </IconButton>
              </Box>
              <List>
                {recentScans.map((scan) => (
                  <React.Fragment key={scan.id}>
                    <ListItem
                      secondaryAction={
                        <IconButton edge="end" aria-label="view">
                          <ArrowForwardIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <SecurityIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={scan.name}
                        secondary={`${scan.date} - ${scan.status}`}
                      />
                      <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                        <Chip size="small" label={scan.highIssues} color="error" icon={<ErrorIcon />} />
                        <Chip size="small" label={scan.mediumIssues} color="warning" icon={<WarningIcon />} />
                        <Chip size="small" label={scan.lowIssues} color="success" icon={<InfoIcon />} />
                      </Box>
                    </ListItem>
                    {recentScans.indexOf(scan) < recentScans.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
            <CardActions>
              <Button size="small" endIcon={<ArrowForwardIcon />}>
                View All Scans
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Recent Projects */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div">
                  Recent Projects
                </Typography>
                <IconButton size="small">
                  <FolderIcon />
                </IconButton>
              </Box>
              <List>
                {recentProjects.map((project) => (
                  <React.Fragment key={project.id}>
                    <ListItem
                      secondaryAction={
                        <IconButton edge="end" aria-label="view">
                          <ArrowForwardIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <CodeIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={project.name}
                        secondary={`Last scan: ${project.lastScan}`}
                      />
                      <Chip 
                        size="small" 
                        label={`${project.issuesCount} issues`} 
                        color="primary" 
                      />
                    </ListItem>
                    {recentProjects.indexOf(project) < recentProjects.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
            <CardActions>
              <Button size="small" endIcon={<ArrowForwardIcon />}>
                View All Projects
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Quick Start Guide */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Start Guide
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="primary" variant="h6">
                      Step 1: Select Files
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Upload C/C++ source files or select a directory containing your code.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="primary" variant="h6">
                      Step 2: Configure Scan
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Choose scan type, select analysis tools, and customize rule settings.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="primary" variant="h6">
                      Step 3: Review Results
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Analyze scan results, review code issues, and generate detailed reports.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<SecurityIcon />}
                onClick={handleStartNewScan}
                sx={{ mt: 2 }}
              >
                Start Your First Scan
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;