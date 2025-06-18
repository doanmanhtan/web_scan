import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Paper,
  Divider,
  Chip,
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
} from '@mui/icons-material';

const getFileIcon = (file) => {
  if (file.isDirectory) {
    return <FolderIcon />;
  }
  
  const extension = file.name.split('.').pop().toLowerCase();
  switch (extension) {
    case 'c':
    case 'cpp':
    case 'h':
    case 'hpp':
      return <CodeIcon />;
    default:
      return <FileIcon />;
  }
};

const getFileSize = (size) => {
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
};

const FileList = ({ files, onRemoveFile }) => {
  if (!files || files.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="textSecondary">
          No files selected. Please select files or directories to scan.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1">
          Selected Files/Directories ({files.length})
        </Typography>
      </Box>
      <Divider />
      <List>
        {files.map((file, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              {getFileIcon(file)}
            </ListItemIcon>
            <ListItemText
              primary={file.name}
              secondary={
                <Typography component="div" variant="body2" color="textSecondary">
                  <Box component="span" display="block">
                    {file.path}
                  </Box>
                  <Box component="span" display="inline-flex" alignItems="center" gap={1} mt={0.5}>
                    {!file.isDirectory && file.size && (
                      <Chip size="small" label={getFileSize(file.size)} />
                    )}
                    {file.isDirectory && (
                      <Chip size="small" label="Directory" color="primary" variant="outlined" />
                    )}
                  </Box>
                </Typography>
              }
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" aria-label="delete" onClick={() => onRemoveFile(index)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default FileList;