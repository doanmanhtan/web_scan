import React, { useEffect, useState, useCallback } from 'react';
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
  CircularProgress,
  Alert,
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

const Dashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [issuesOverTime, setIssuesOverTime] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);

  useEffect(() => {
    // Lấy số liệu tổng hợp
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/scans', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        const data = await res.json();
        
        const allScans = data.data.scans || [];
        
        // Aggregate issues from all scans
        const aggregatedIssues = allScans.reduce((acc, scan) => {
          acc.critical += (scan.issuesCounts?.critical || 0);
          acc.high += (scan.issuesCounts?.high || 0);
          acc.medium += (scan.issuesCounts?.medium || 0);
          acc.low += (scan.issuesCounts?.low || 0);
          acc.total += (scan.issuesCounts?.total || 0);
          return acc;
        }, { critical: 0, high: 0, medium: 0, low: 0, total: 0 });

        setSummary({ issueStats: aggregatedIssues });

      } catch (err) {
        setError(err.message);
        setSummary({ issueStats: { critical: 0, high: 0, medium: 0, low: 0, total: 0 } }); // Set to default on error
      } finally {
        setLoading(false);
      }
    };

    // Lấy dữ liệu từng ngày cho biểu đồ thời gian
    const fetchTrends = async () => {
      try {
        const res = await fetch('/api/scans', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch scan trends');
        const data = await res.json();
        const scans = data.data.scans || [];
        const trends = scans.map(scan => ({
          date: scan.createdAt.slice(0, 10), // yyyy-mm-dd
          critical: scan.issuesCounts.critical || 0,
          high: scan.issuesCounts.high || 0,
          medium: scan.issuesCounts.medium || 0,
          low: scan.issuesCounts.low || 0,
        }));
        setIssuesOverTime(trends);
      } catch (err) {
        setIssuesOverTime([]);
      }
    };

    const fetchRecentScans = async () => {
      try {
        const res = await fetch('/api/scans', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch scans');
        const data = await res.json();
        // Lấy 5 scan mới nhất
        const scans = (data.data.scans || []).slice(0, 5).map(scan => ({
          id: scan._id,
          name: scan.name,
          date: scan.createdAt.slice(0, 10),
          status: scan.status,
          criticalIssues: scan.issuesCounts.critical || 0,
          highIssues: scan.issuesCounts.high || 0,
          mediumIssues: scan.issuesCounts.medium || 0,
          lowIssues: scan.issuesCounts.low || 0,
        }));
        setRecentScans(scans);
      } catch (err) {
        setRecentScans([]);
      }
    };

    // Lấy dữ liệu Recent Projects từ API scans và xử lý
    const fetchRecentProjects = async () => {
      try {
        const res = await fetch('/api/scans', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch projects');
        const apiData = await res.json();
        const scans = apiData.data.scans || [];

        // Nhóm các scan theo tên (tạm xem là tên project) và lấy scan gần nhất cho mỗi project
        const projectsMap = new Map();
        scans.forEach(scan => {
          const projectName = scan.name;
          if (!projectsMap.has(projectName) || new Date(scan.createdAt) > new Date(projectsMap.get(projectName).createdAt)) {
            projectsMap.set(projectName, scan);
          }
        });

        // Chuyển đổi Map thành mảng các project và giới hạn 5 project gần nhất
        const mappedProjects = Array.from(projectsMap.values())
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map(project => ({
            id: project._id,
            name: project.name,
            lastScan: project.createdAt.slice(0, 10),
            issuesCount: project.issuesCounts.total || 0,
          }));

        setRecentProjects(mappedProjects);
      } catch (err) {
        setRecentProjects([]);
      }
    };

    fetchSummary();
    fetchTrends();
    fetchRecentScans();
    fetchRecentProjects();
  }, []);

  // Thống nhất màu sắc
  const COLORS = {
    critical: '#f44336', // đỏ tươi
    high: '#ff9800',     // cam
    medium: '#2196f3',   // xanh dương
    low: '#4caf50',      // xanh lá
  };

  // Pie chart data
  const pieChartData = summary ? [
    { name: 'Critical', value: summary.issueStats.critical, color: COLORS.critical },
    { name: 'High', value: summary.issueStats.high, color: COLORS.high },
    { name: 'Medium', value: summary.issueStats.medium, color: COLORS.medium },
    { name: 'Low', value: summary.issueStats.low, color: COLORS.low },
  ] : [];

  const handleStartNewScan = useCallback(() => {
    navigate('/scanner');
  }, [navigate]);

  const handleViewAllScans = useCallback(() => {
    navigate('/reports');
  }, [navigate]);

  const handleViewAllProjects = useCallback(() => {
    navigate('/reports');
  }, [navigate]);

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

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

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
        <Grid container spacing={2}>
          <Grid item xs={12} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="error.main" gutterBottom>
                Critical Issues
              </Typography>
              <Typography variant="h4" color="error.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {summary.issueStats.critical}
                <ErrorIcon color="error" sx={{ ml: 1 }} />
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#ff9800' }} gutterBottom>
                High Issues
              </Typography>
              <Typography variant="h4" sx={{ color: '#ff9800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {summary.issueStats.high}
                <WarningIcon sx={{ color: '#ff9800', ml: 1 }} />
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#2196f3' }} gutterBottom>
                Medium Issues
              </Typography>
              <Typography variant="h4" sx={{ color: '#2196f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {summary.issueStats.medium}
                <InfoIcon sx={{ color: '#2196f3', ml: 1 }} />
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#4caf50' }} gutterBottom>
                Low Issues
              </Typography>
              <Typography variant="h4" sx={{ color: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {summary.issueStats.low}
                <InfoIcon sx={{ color: '#4caf50', ml: 1 }} />
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="default" gutterBottom>
                Total Issues
              </Typography>
              <Typography variant="h4" color="default" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {summary.issueStats.total}
                <BugIcon color="default" sx={{ ml: 1 }} />
              </Typography>
            </Paper>
          </Grid>
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
              {issuesOverTime.length > 0 ? (
                <LineChart data={issuesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="critical" stroke={COLORS.critical} name="Critical" />
                  <Line type="monotone" dataKey="high" stroke={COLORS.high} name="High" />
                  <Line type="monotone" dataKey="medium" stroke={COLORS.medium} name="Medium" />
                  <Line type="monotone" dataKey="low" stroke={COLORS.low} name="Low" />
                </LineChart>
              ) : (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No data available</Typography>
                </Box>
              )}
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
                        <IconButton edge="end" aria-label="view" onClick={() => navigate(`/reports/${scan.id}`)}>
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
                        {scan.criticalIssues > 0 && <Chip size="small" label={scan.criticalIssues} sx={{ bgcolor: COLORS.critical, color: 'white' }} icon={<ErrorIcon sx={{ color: 'white' }} />} />}
                        {scan.highIssues > 0 && <Chip size="small" label={scan.highIssues} sx={{ bgcolor: COLORS.high, color: 'white' }} icon={<WarningIcon sx={{ color: 'white' }} />} />}
                        {scan.mediumIssues > 0 && <Chip size="small" label={scan.mediumIssues} sx={{ bgcolor: COLORS.medium, color: 'white' }} icon={<InfoIcon sx={{ color: 'white' }} />} />}
                        {scan.lowIssues > 0 && <Chip size="small" label={scan.lowIssues} sx={{ bgcolor: COLORS.low, color: 'white' }} icon={<InfoIcon sx={{ color: 'white' }} />} />}
                      </Box>
                    </ListItem>
                    {recentScans.indexOf(scan) < recentScans.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
            <CardActions>
              <Button size="small" endIcon={<ArrowForwardIcon />} onClick={handleViewAllScans}>
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
                        <IconButton edge="end" aria-label="view" onClick={() => navigate(`/reports/${project.id}`)}>
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
              <Button size="small" endIcon={<ArrowForwardIcon />} onClick={handleViewAllProjects}>
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