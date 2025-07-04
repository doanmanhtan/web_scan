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
  Avatar,
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
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

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

  // Pie chart data - chỉ hiển thị những phần có giá trị > 0
  const pieChartData = summary ? [
    { name: 'Critical', value: summary.issueStats.critical, color: COLORS.critical },
    { name: 'High', value: summary.issueStats.high, color: COLORS.high },
    { name: 'Medium', value: summary.issueStats.medium, color: COLORS.medium },
    { name: 'Low', value: summary.issueStats.low, color: COLORS.low },
  ].filter(item => item.value > 0) : [];

  // Pie chart custom label dưới chart
  const renderPieChartLabels = () => {
    if (!pieChartData.length) return null;
    const total = summary?.issueStats?.total || 0;
    return (
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
        {pieChartData.map((item) => {
          const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
          return (
            <Typography key={item.name} variant="body2" sx={{ color: item.color, fontWeight: 'bold' }}>
              {item.name}: {item.value} issues ({percent}%)
            </Typography>
          );
        })}
      </Box>
    );
  };

  // Custom tooltip cho pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      // Tính tổng issues để lấy %
      const total = summary?.issueStats?.total || 0;
      const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0.0';
      return (
        <Box sx={{
          bgcolor: 'background.paper',
          p: 1,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          boxShadow: 1
        }}>
          <Typography variant="body2" sx={{ color: data.payload.color, fontWeight: 'bold' }}>
            {data.name}: {data.value} issues ({percent}%)
          </Typography>
        </Box>
      );
    }
    return null;
  };

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

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
      <CircularProgress size={60} />
    </Box>
  );
  
  if (error) return (
    <Box sx={{ p: 3 }}>
      <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
    </Box>
  );

  return (
    <Box sx={{ p: 3, bgcolor: '#fff', minHeight: '100vh' }}>
      <Box sx={{ width: '100%', maxWidth: '100%', p: 0, m: 0 }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          mt: 0,
          p: 2,
          bgcolor: '#fff',
          borderRadius: 0,
        }}>
        </Box>

        {/* Stats Cards Row - dùng flex cho đều và căn giữa */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, mb: 6, flexWrap: 'wrap' }}>
          {[{
            label: 'Critical Issues',
            value: summary.issueStats.critical,
            color: COLORS.critical,
            icon: <ErrorIcon />,
          }, {
            label: 'High Issues',
            value: summary.issueStats.high,
            color: COLORS.high,
            icon: <WarningIcon />,
          }, {
            label: 'Medium Issues',
            value: summary.issueStats.medium,
            color: COLORS.medium,
            icon: <InfoIcon />,
          }, {
            label: 'Low Issues',
            value: summary.issueStats.low,
            color: COLORS.low,
            icon: <InfoIcon />,
          }, {
            label: 'Total Issues',
            value: summary.issueStats.total,
            color: '#9c27b0',
            icon: <BugIcon />,
          }].map((stat, idx) => (
            <Paper key={stat.label} sx={{
              flex: '1 1 0',
              minWidth: 180,
              maxWidth: 220,
              p: 3,
              textAlign: 'center',
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              boxShadow: 0,
              bgcolor: '#fff',
              minHeight: 150,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
            }}>
              <Avatar sx={{ bgcolor: stat.color, mb: 1, width: 48, height: 48 }}>
                {stat.icon}
              </Avatar>
              <Typography variant="h3" sx={{ color: stat.color, fontWeight: 'bold', mb: 0.5 }}>
                {stat.value}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: '#222', mb: 0.5 }}>
                {stat.label}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Charts Row */}
        <Box sx={{ display: 'flex', gap: 3, mb: 6 }}>
          <Paper sx={{ flex: 1, minWidth: 0, p: 3, borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 0, height: 400 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <TrendingUpIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Issues Distribution
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={320}>
              {pieChartData.length > 0 ? (
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={130}
                    fill="#8884d8"
                    dataKey="value"
                    label={false}
                    labelLine={false}
                    stroke="#fff"
                    strokeWidth={3}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                  {renderPieChartLabels()}
                </PieChart>
              ) : (
                <Box sx={{ height: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                  <BugIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6">No security issues found</Typography>
                  <Typography variant="body2">Your applications are secure!</Typography>
                </Box>
              )}
            </ResponsiveContainer>
          </Paper>
          <Paper sx={{ flex: 1, minWidth: 0, p: 3, borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 0, height: 400 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                <BarChartIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Issues by Severity (Bar)
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={issuesOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip />
                <Legend />
                <Bar dataKey="critical" fill={COLORS.critical} name="Critical" />
                <Bar dataKey="high" fill={COLORS.high} name="High" />
                <Bar dataKey="medium" fill={COLORS.medium} name="Medium" />
                <Bar dataKey="low" fill={COLORS.low} name="Low" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
          <Paper sx={{ flex: 1, minWidth: 0, p: 3, borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 0, height: 400 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                <HistoryIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Issues Trends (Line)
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={320}>
              {issuesOverTime.length > 0 ? (
                <LineChart data={issuesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="critical" stroke={COLORS.critical} name="Critical" strokeWidth={3} dot={{ fill: COLORS.critical, strokeWidth: 2, r: 4 }} />
                  <Line type="monotone" dataKey="high" stroke={COLORS.high} name="High" strokeWidth={3} dot={{ fill: COLORS.high, strokeWidth: 2, r: 4 }} />
                  <Line type="monotone" dataKey="medium" stroke={COLORS.medium} name="Medium" strokeWidth={3} dot={{ fill: COLORS.medium, strokeWidth: 2, r: 4 }} />
                  <Line type="monotone" dataKey="low" stroke={COLORS.low} name="Low" strokeWidth={3} dot={{ fill: COLORS.low, strokeWidth: 2, r: 4 }} />
                </LineChart>
              ) : (
                <Box sx={{ height: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                  <HistoryIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6">No trend data available</Typography>
                  <Typography variant="body2">Run more scans to see trends</Typography>
                </Box>
              )}
            </ResponsiveContainer>
          </Paper>
        </Box>

        {/* Tables Row */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          {/* Recent Scans/Activities */}
          <Card sx={{ flex: 1, minWidth: 0, borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 0, height: 500 }}>
            <CardContent sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <SecurityIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Recent Scans
                </Typography>
              </Box>
              <List sx={{ maxHeight: '350px', overflow: 'auto' }}>
                {recentScans.map((scan, index) => (
                  <React.Fragment key={scan.id}>
                    <ListItem
                      sx={{ borderRadius: 1, mb: 1, '&:hover': { bgcolor: 'action.hover' } }}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => navigate(`/reports/${scan.id}`)} sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}>
                          <ArrowForwardIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <SecurityIcon />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{scan.name}</Typography>}
                        secondary={<Typography variant="body2" color="text.secondary">{scan.date} • {scan.status}</Typography>}
                      />
                      <Box sx={{ display: 'flex', gap: 0.5, mr: 2, flexWrap: 'wrap' }}>
                        {scan.criticalIssues > 0 && (
                          <Chip size="small" label={scan.criticalIssues} sx={{ bgcolor: COLORS.critical, color: 'white', fontWeight: 'bold' }} />
                        )}
                        {scan.highIssues > 0 && (
                          <Chip size="small" label={scan.highIssues} sx={{ bgcolor: COLORS.high, color: 'white', fontWeight: 'bold' }} />
                        )}
                        {scan.mediumIssues > 0 && (
                          <Chip size="small" label={scan.mediumIssues} sx={{ bgcolor: COLORS.medium, color: 'white', fontWeight: 'bold' }} />
                        )}
                        {scan.lowIssues > 0 && (
                          <Chip size="small" label={scan.lowIssues} sx={{ bgcolor: COLORS.low, color: 'white', fontWeight: 'bold' }} />
                        )}
                      </Box>
                      <Chip label={scan.status} size="small" sx={{ ml: 1, bgcolor: scan.status === 'completed' ? 'success.main' : scan.status === 'running' ? 'warning.main' : 'error.main', color: 'white', fontWeight: 'bold' }} />
                    </ListItem>
                    {index < recentScans.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
              <Button variant="outlined" endIcon={<ArrowForwardIcon />} onClick={handleViewAllScans} sx={{ borderRadius: 2 }}>
                View All Scans
              </Button>
            </CardActions>
          </Card>
          {/* Recent Projects/Tasks */}
          <Card sx={{ flex: 1, minWidth: 0, borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 0, height: 500 }}>
            <CardContent sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <FolderIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Recent Projects
                </Typography>
              </Box>
              <List sx={{ maxHeight: '350px', overflow: 'auto' }}>
                {recentProjects.map((project, index) => (
                  <React.Fragment key={project.id}>
                    <ListItem
                      sx={{ borderRadius: 1, mb: 1, '&:hover': { bgcolor: 'action.hover' } }}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => navigate(`/reports/${project.id}`)} sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}>
                          <ArrowForwardIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <CodeIcon />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{project.name}</Typography>}
                        secondary={<Typography variant="body2" color="text.secondary">Last scan: {project.lastScan}</Typography>}
                      />
                      <Chip size="medium" label={`${project.issuesCount} issues`} color={project.issuesCount > 10 ? 'error' : project.issuesCount > 5 ? 'warning' : 'success'} sx={{ fontWeight: 'bold' }} />
                    </ListItem>
                    {index < recentProjects.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
              <Button variant="outlined" endIcon={<ArrowForwardIcon />} onClick={handleViewAllProjects} sx={{ borderRadius: 2 }}>
                View All Projects
              </Button>
            </CardActions>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;