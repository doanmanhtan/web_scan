import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Paper,
  Chip,
  Button,
  Collapse,
  IconButton,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';

const IssueDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedIssue, setExpandedIssue] = useState(null);

  const queryParams = new URLSearchParams(location.search);
  const severity = queryParams.get('severity');

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found. Please log in.');
          setLoading(false);
          return;
        }

        let url = `/api/scans/${id}/issues`;
        if (severity) {
          url += `?severity=${severity}`;
        }

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to fetch issues');
        }

        const apiData = await res.json();
        setIssues(apiData.data.issues || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchIssues();
    }
  }, [id, severity]);

  const handleToggleExpand = (issueId) => {
    setExpandedIssue(expandedIssue === issueId ? null : issueId);
  };

  if (loading) return <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {severity ? `${severity.charAt(0).toUpperCase() + severity.slice(1)} Issues for Scan ${id}` : `All Issues for Scan ${id}`}
      </Typography>
      <Button variant="contained" onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Back to Report Details
      </Button>
      {
        issues.length === 0 ? (
          <Alert severity="info">No issues found for this scan{severity && ` with severity '${severity}'`}.</Alert>
        ) : (
          <List>
            {issues.map((issue) => (
              <Paper key={issue._id} sx={{ mb: 2, p: 2 }}>
                <ListItem component="div" disablePadding>
                  <ListItemText
                    primary={
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {issue.title || 'No Title'}
                        <Chip label={issue.severity} color={
                          issue.severity === 'critical' ? 'error' :
                          issue.severity === 'high' ? 'warning' :
                          issue.severity === 'medium' ? 'info' :
                          issue.severity === 'low' ? 'success' : 'default'
                        } size="small" />
                        <Chip label={issue.vulnerabilityType || 'N/A'} size="small" variant="outlined" />
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        File: {issue.file} (Line: {issue.line})
                      </Typography>
                    }
                  />
                  <IconButton onClick={() => handleToggleExpand(issue._id)}>
                    {expandedIssue === issue._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </ListItem>
                <Collapse in={expandedIssue === issue._id} timeout="auto" unmountOnExit>
                  <Box sx={{ mt: 2, pl: 4 }}>
                    <Typography variant="subtitle1" gutterBottom>Description:</Typography>
                    <Typography variant="body2">{issue.description || 'No description available.'}</Typography>
                    <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>Suggested Fix:</Typography>
                    <Typography variant="body2">{issue.solution || 'No suggested fix available.'}</Typography>
                    {issue.cwe && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        CWE: <a href={`https://cwe.mitre.org/data/definitions/${issue.cwe.replace('CWE-', '')}.html`} target="_blank" rel="noopener noreferrer">{issue.cwe}</a>
                      </Typography>
                    )}
                    {issue.references && issue.references.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle1">References:</Typography>
                        <List dense>
                          {issue.references.map((ref, index) => (
                            <ListItem key={index} disablePadding>
                              <ListItemText primary={<a href={ref} target="_blank" rel="noopener noreferrer">{ref}</a>} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Paper>
            ))}
          </List>
        )
      }
    </Box>
  );
};

export default IssueDetailsPage; 