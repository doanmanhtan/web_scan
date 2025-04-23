import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  GetApp as DownloadIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Print as PrintIcon,
  Edit as EditIcon
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

const ReportTable = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
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

  const handleMenuAction = (action) => {
    console.log(`${action} report: ${selectedReportId}`);
    handleCloseMenu();
  };

  const getSeverityColor = (count) => {
    if (count > 20) return 'error';
    if (count > 10) return 'warning';
    return 'default';
  };

  return (
    <Paper variant="outlined">
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
            {mockReports
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
                      color={getSeverityColor(report.issuesCount)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Tooltip title="View Report">
                        <IconButton size="small" onClick={() => handleMenuAction('view')}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton size="small" onClick={() => handleMenuAction('download')}>
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton size="small" onClick={(e) => handleOpenMenu(e, report.id)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={mockReports.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => handleMenuAction('view')}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Report</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('download')}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('print')}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Print</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('share')}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('rename')}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('delete')} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default ReportTable;