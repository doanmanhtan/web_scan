import React from 'react';
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Divider,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

const ReportFilters = ({ onSearch, onFilter, onResetFilters }) => {
  const [filters, setFilters] = React.useState({
    search: '',
    dateRange: 'all',
    user: 'all',
    status: 'all',
    severity: 'all',
  });

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    const newFilters = {
      ...filters,
      [name]: value,
    };
    setFilters(newFilters);
    
    if (onFilter) {
      onFilter(newFilters);
    }
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setFilters({
      ...filters,
      search: value,
    });
    
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      dateRange: 'all',
      user: 'all',
      status: 'all',
      severity: 'all',
    };
    setFilters(resetFilters);
    
    if (onResetFilters) {
      onResetFilters();
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          <FilterListIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
          Filter Reports
        </Typography>
      </Box>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder="Search reports..."
            variant="outlined"
            size="small"
            name="search"
            value={filters.search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Date Range</InputLabel>
            <Select
              name="dateRange"
              value={filters.dateRange}
              label="Date Range"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>User</InputLabel>
            <Select
              name="user"
              value={filters.user}
              label="User"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">All Users</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="security_team">Security Team</MenuItem>
              <MenuItem value="dev_team">Dev Team</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={filters.status}
              label="Status"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Severity</InputLabel>
            <Select
              name="severity"
              value={filters.severity}
              label="Severity"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">All Severity</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          startIcon={<ClearIcon />}
          onClick={handleReset}
          sx={{ mr: 1 }}
        >
          Reset Filters
        </Button>
        
        <Button
          variant="contained"
          color="primary"
        >
          Apply Filters
        </Button>
      </Box>
    </Paper>
  );
};

export default ReportFilters;