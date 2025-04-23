import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormGroup,
  Checkbox,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  InsertDriveFile as CsvIcon,
  Code as JsonIcon,
  Description as DocIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';

const ReportExport = () => {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState('pdf');
  const [options, setOptions] = useState({
    includeDetails: true,
    includeCode: true,
    includeCharts: true,
    includeRemediation: true,
  });

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleFormatChange = (event) => {
    setFormat(event.target.value);
  };

  const handleOptionChange = (event) => {
    setOptions({
      ...options,
      [event.target.name]: event.target.checked,
    });
  };

  const handleExport = () => {
    // In a real application, this would trigger the export functionality
    console.log('Exporting report in format:', format);
    console.log('With options:', options);
    handleClose();
  };

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<DownloadIcon />}
        onClick={handleOpen}
      >
        Export Report
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Export Report</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" gutterBottom>
            Export Format
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <FormControl component="fieldset">
              <RadioGroup
                row
                name="format"
                value={format}
                onChange={handleFormatChange}
              >
                <FormControlLabel 
                  value="pdf" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PdfIcon color="error" sx={{ mr: 1 }} />
                      PDF
                    </Box>
                  } 
                />
                <FormControlLabel 
                  value="csv" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CsvIcon color="success" sx={{ mr: 1 }} />
                      CSV
                    </Box>
                  } 
                />
                <FormControlLabel 
                  value="json" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <JsonIcon color="primary" sx={{ mr: 1 }} />
                      JSON
                    </Box>
                  } 
                />
                <FormControlLabel 
                  value="docx" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DocIcon color="info" sx={{ mr: 1 }} />
                      DOCX
                    </Box>
                  } 
                />
              </RadioGroup>
            </FormControl>
          </Paper>

          <Typography variant="subtitle1" gutterBottom>
            Content Options
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <FormGroup>
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={options.includeDetails} 
                    onChange={handleOptionChange} 
                    name="includeDetails" 
                  />
                } 
                label="Include detailed issue descriptions" 
              />
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={options.includeCode} 
                    onChange={handleOptionChange} 
                    name="includeCode" 
                  />
                } 
                label="Include code snippets" 
              />
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={options.includeCharts} 
                    onChange={handleOptionChange} 
                    name="includeCharts" 
                  />
                } 
                label="Include charts and visualizations" 
                disabled={format === 'csv' || format === 'json'}
              />
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={options.includeRemediation} 
                    onChange={handleOptionChange} 
                    name="includeRemediation" 
                  />
                } 
                label="Include remediation recommendations" 
              />
            </FormGroup>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleExport}
            startIcon={<DownloadIcon />}
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReportExport;