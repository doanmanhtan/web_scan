import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const CodeViewer = ({ code, highlightedLine, language }) => {
  // Chuyển đổi code thành mảng các dòng
  const lines = code.split('\n');
  
  return (
    <Paper 
      sx={{ 
        backgroundColor: '#f5f5f5',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <Box 
        sx={{ 
          p: 2,
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          overflowX: 'auto',
          position: 'relative',
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '50px', 
            backgroundColor: '#e0e0e0',
            borderRight: '1px solid #ccc',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 2,
            color: '#666',
          }}
        >
          {lines.map((_, i) => (
            <Typography 
              key={i} 
              variant="body2"
              sx={{ 
                lineHeight: '1.5rem',
                fontSize: '0.75rem',
              }}
            >
              {i + 1}
            </Typography>
          ))}
        </Box>
        
        <Box sx={{ pl: 7 }}>
          {lines.map((line, i) => (
            <Box 
              key={i}
              sx={{ 
                backgroundColor: i + 1 === highlightedLine ? 'rgba(255, 0, 0, 0.1)' : 'transparent',
                p: '0 0.5rem',
                height: '1.5rem',
                lineHeight: '1.5rem',
                whiteSpace: 'pre',
              }}
            >
              {line || ' '}
            </Box>
          ))}
        </Box>
      </Box>
      
      {language && (
        <Box 
          sx={{ 
            backgroundColor: '#e0e0e0',
            p: '0.25rem 0.5rem',
            borderTop: '1px solid #ccc',
            fontSize: '0.75rem',
            color: '#666',
          }}
        >
          {language}
        </Box>
      )}
    </Paper>
  );
};

export default CodeViewer;