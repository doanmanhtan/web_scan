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
  Card,
  CardContent,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
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
} from '@mui/icons-material';

// Mock data for reports
const mockReports = [
  { id: 1, name: 'Project Alpha Full Scan', date: '2025-04-22 10:30:45', user: 'admin', status: 'completed', issuesCount: 23 },
  { id: 2, name: 'Security Audit - Module A', date: '2025-04-20 14:22:18', user: 'security_team', status: 'completed', issuesCount: 12 },
  { id: 3, name: 'Code Quality Review', date: '2025-04-18 09:15:30', user: 'dev_team', status: 'completed', issuesCount: 17 },
  { id: 4, name: 'Memory Safety Check', date: '2025-04-15 16:45:12', user: 'admin', status: 'completed', issuesCount: 8 },
  { id: 5, name: 'Performance Optimization', date: '2025-04-12 11:20:34', user: 'dev_team', status: 'completed', issuesCount: 5 },
  { id: 6, name: 'Weekly Security Scan', date: '2025-04-10 08:30:00', user: 'security_team', status: 'completed', issuesCount: 15 },
  { id: 7, name: 'Core Module Scan', date: '2025-04-08 13:25:18', user: 'admin', status: 'completed', issuesCount: 19 },
  { id: 8, name: 'API Integration Test', date: '2025-04-05 15:40:22', user: 'dev_team', status: 'completed', issuesCount: 7 },
  { id: 9, name: 'Frontend Code Review', date: '2025-04-03 10:15:30', user: 'dev_team', status: 'completed', issuesCount: 11 },
  { id: 10, name: 'Monthly Security Audit', date: '2025-04-01 09:00:00', user: 'security_team', status: 'completed', issuesCount: 22 },
];

const ReportsPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);

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

  const handleViewReport = () => {
    console.log(`View report: ${selectedReportId}`);
    handleCloseMenu();
  };

  const handleDownloadReport = () => {
    console.log(`Download report: ${selectedReportId}`);
    handleCloseMenu();
  };

  const handleDeleteReport = () => {
    console.log(`Delete report: ${selectedReportId}`);
    handleCloseMenu();
  };

  const filteredReports = mockReports.filter(
    (report) =>
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <Typography variant="h4">{mockReports.length}</Typography>
            </Paper>
            <Paper sx={{ p: 2, minWidth: 180 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Total Issues Found
              </Typography>
              <Typography variant="h4">
                {mockReports.reduce((sum, report) => sum + report.issuesCount, 0)}
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, minWidth: 180 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Average Issues per Scan
              </Typography>
              <Typography variant="h4">
                {Math.round(
                  mockReports.reduce((sum, report) => sum + report.issuesCount, 0) / mockReports.length
                )}
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
                          report.issuesCount > 20 ? 'error' : 
                          report.issuesCount > 10 ? 'warning' : 
                          'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => window.open('#/report-details', '_blank')}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton>
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
        <MenuItem onClick={handleViewReport}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Report</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownloadReport}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownloadReport}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Print</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownloadReport}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDownloadReport}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteReport} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ReportsPage;