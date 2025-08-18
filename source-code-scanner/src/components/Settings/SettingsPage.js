import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import ToolSettings from './ToolSettings';
import RuleSettings from './RuleSettings';

const SettingsPage = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const renderTabContent = () => {
    switch (tabValue) {
      case 0:
        return <ToolSettings />;
      case 1:
        return <RuleSettings />;
      default:
        return <ToolSettings />;
    }
  };

  return (
    <Box sx={{ maxWidth: '100%', p: 3 }}>   
      {/* Navigation Tabs */}
      <Paper 
        elevation={0} 
        sx={{ 
          width: '100%', 
          mb: 4,
          border: '2px solid',
          borderColor: 'grey.100',
          borderRadius: 3,
          overflow: 'hidden'
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="settings tabs"
          sx={{ 
            background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '1rem',
              fontWeight: 500,
              textTransform: 'none',
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 600
              },
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.04)',
                color: 'primary.main'
              }
            },
            '& .MuiTabs-indicator': {
              height: 4,
              borderRadius: '2px 2px 0 0',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }
          }}
        >
          <Tab 
            icon={<CodeIcon sx={{ fontSize: 24 }} />} 
            label="Tools" 
            iconPosition="start"
            sx={{ minWidth: 120 }}
          />
          <Tab 
            icon={<SecurityIcon sx={{ fontSize: 24 }} />} 
            label="Rules" 
            iconPosition="start"
            sx={{ minWidth: 120 }}
          />
        </Tabs>
      </Paper>

      {/* Content Area */}
      <Box sx={{ 
        mt: 3,
        minHeight: '500px',
        background: 'transparent'
      }}>
        {renderTabContent()}
      </Box>
    </Box>
  );
};

export default SettingsPage;