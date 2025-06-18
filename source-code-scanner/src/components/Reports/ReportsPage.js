import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Card,
  CardContent,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Grid,
  List,
  ListItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  InsertDriveFile as InsertDriveFileIcon,
} from '@mui/icons-material';

const ReportsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReportDetails, setSelectedReportDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError('');
        
        if (id) {
          const res = await fetch(`/api/scans/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
          if (!res.ok) throw new Error('Failed to fetch report details');
          const apiData = await res.json();
          const scan = apiData.data;

          setSelectedReportDetails({
            id: scan._id,
            name: scan.name,
            date: new Date(scan.createdAt).toLocaleString(),
            user: scan.createdBy ? scan.createdBy.username : 'N/A',
            status: scan.status,
            issuesCount: scan.issuesCounts.total || 0,
            criticalIssues: scan.issuesCounts.critical || 0,
            highIssues: scan.issuesCounts.high || 0,
            mediumIssues: scan.issuesCounts.medium || 0,
            lowIssues: scan.issuesCounts.low || 0,
            uploadedFiles: scan.uploadedFiles || [],
            scanDirectory: scan.scanDirectory || '',
            progress: scan.progress || 0,
            filesScanned: scan.filesScanned || 0,
            linesOfCode: scan.linesOfCode || 0,
            tools: scan.tools || [],
            startTime: new Date(scan.startTime).toLocaleString(),
            endTime: new Date(scan.endTime).toLocaleString(),
            duration: scan.duration ? `${(scan.duration / 1000).toFixed(2)}s` : 'N/A',
          });
        } else {
          const res = await fetch('/api/scans', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
          if (!res.ok) throw new Error('Failed to fetch reports');
          const apiData = await res.json();
          
          const mappedReports = (apiData.data.scans || []).map(scan => ({
            id: scan._id,
            name: scan.name,
            date: new Date(scan.createdAt).toLocaleString(),
            user: scan.createdBy ? scan.createdBy.username : 'N/A',
            status: scan.status,
            issuesCount: scan.issuesCounts.total || 0,
            criticalIssues: scan.issuesCounts.critical || 0,
            highIssues: scan.issuesCounts.high || 0,
            mediumIssues: scan.issuesCounts.medium || 0,
            lowIssues: scan.issuesCounts.low || 0,
          }));
          setReports(mappedReports);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [id]);

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

  const handleOpenMenu = (event, reportId) => {
    setAnchorEl(event.currentTarget);
    setSelectedReportId(reportId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedReportId(null);
  };

  const handleViewReport = (reportIdToView) => {
    navigate(`/reports/${reportIdToView}`);
    handleCloseMenu();
  };

  const handleDownloadReport = (reportIdToDownload) => {
    console.log(`Download report: ${reportIdToDownload}`);
    alert(`Downloading report: ${reportIdToDownload}`);
    handleCloseMenu();
  };

  const handleDeleteReport = (reportIdToDelete) => {
    console.log(`Delete report: ${reportIdToDelete}`);
    alert(`Deleting report: ${reportIdToDelete}`);
    handleCloseMenu();
  };

  const handleIssueClick = (severity) => {
    navigate(`/reports/${id}/issues?severity=${severity}`);
  };

  const filteredReports = reports.filter(
    (report) =>
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  if (id && selectedReportDetails) {
    const report = selectedReportDetails;
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Scan Report Details
        </Typography>
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Report Name: {report.name}</Typography>
                <Typography variant="body1">Scan ID: {report.id}</Typography>
                <Typography variant="body1">Date: {report.date}</Typography>
                <Typography variant="body1">User: {report.user}</Typography>
                <Typography variant="body1">Status: {report.status}</Typography>
                <Typography variant="body1">Total Issues: {report.issuesCount}</Typography>
                <Typography variant="body1">Files Scanned: {report.filesScanned}</Typography>
                <Typography variant="body1">Lines of Code: {report.linesOfCode}</Typography>
                <Typography variant="body1">Duration: {report.duration}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Issue Breakdown:</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  {report.criticalIssues > 0 && <Chip label={`Critical: ${report.criticalIssues}`} color="error" onClick={() => handleIssueClick('critical')} />}
                  {report.highIssues > 0 && <Chip label={`High: ${report.highIssues}`} color="warning" onClick={() => handleIssueClick('high')} />}
                  {report.mediumIssues > 0 && <Chip label={`Medium: ${report.mediumIssues}`} color="info" onClick={() => handleIssueClick('medium')} />}
                  {report.lowIssues > 0 && <Chip label={`Low: ${report.lowIssues}`} color="success" onClick={() => handleIssueClick('low')} />}
                </Box>
                <Typography variant="h6" sx={{ mt: 2 }}>Scanned Tools:</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  {report.tools.map(tool => <Chip key={tool} label={tool} variant="outlined" />)}
                </Box>
                <Typography variant="h6" sx={{ mt: 2 }}>Uploaded Files:</Typography>
                <List>
                  {report.uploadedFiles.map(file => (
                    <ListItem key={file._id} dense>
                      <ListItemIcon><InsertDriveFileIcon /></ListItemIcon>
                      <ListItemText primary={file.originalName} secondary={`Size: ${file.fileSize} bytes`} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
            <Box sx={{ mt: 4 }}>
              <Button variant="contained" onClick={() => window.history.back()}>Back to Reports</Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Scan Reports
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Reports Summary
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Paper sx={{ p: 2, minWidth: 180 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Total Reports
              </Typography>
              <Typography variant="h4">{reports.length}</Typography>
            </Paper>
            <Paper sx={{ p: 2, minWidth: 180 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Total Issues Found
              </Typography>
              <Typography variant="h4">
                {reports.reduce((sum, report) => sum + report.issuesCount, 0)}
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, minWidth: 180 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Average Issues per Scan
              </Typography>
              <Typography variant="h4">
                {reports.length > 0 ? Math.round(
                  reports.reduce((sum, report) => sum + report.issuesCount, 0) / reports.length
                ) : 0}
              </Typography>
            </Paper>
          </Box>
        </CardContent>
      </Card>

      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <TextField
            placeholder="Search reports..."
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
            sx={{ width: 300 }}
          />
          <Box>
            <Button startIcon={<FilterListIcon />} sx={{ mr: 1 }}>
              Filter
            </Button>
            <Button startIcon={<SortIcon />}>
              Sort
            </Button>
          </Box>
        </Box>
        
        <Divider />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Report Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Issues</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>{report.name}</TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell>{report.user}</TableCell>
                    <TableCell>
                      <Chip 
                        label={report.status.charAt(0).toUpperCase() + report.status.slice(1)} 
                        color={report.status === 'completed' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={report.issuesCount} 
                        color={
                          report.criticalIssues > 0 ? 'error' : 
                          report.highIssues > 0 ? 'warning' : 
                          report.mediumIssues > 0 ? 'info' : 
                          'success'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleViewReport(report.id)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => handleDownloadReport(report.id)}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                      <IconButton onClick={(e) => handleOpenMenu(e, report.id)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredReports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No reports found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredReports.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => handleViewReport(selectedReportId)}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDownloadReport(selectedReportId)}>
          <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDeleteReport(selectedReportId)}>
          <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ReportsPage;