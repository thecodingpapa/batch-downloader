import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Paper, Typography, Box } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { parseVideoFile } from '../utils/parser';

const DropZone = ({ onVideosParsed }) => {
  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const text = await file.text();
    const parsedVideos = parseVideoFile(text);
    onVideosParsed(parsedVideos);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/plain': ['.txt'] },
    multiple: false,
  });

  return (
    <Paper
      {...getRootProps()}
      elevation={isDragActive ? 8 : 2}
      sx={{
        p: 6,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: 2,
        borderStyle: 'dashed',
        borderColor: isDragActive ? 'primary.main' : 'divider',
        bgcolor: isDragActive ? 'action.hover' : 'background.paper',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'action.hover',
          transform: 'scale(1.01)',
        },
      }}
    >
      <input {...getInputProps()} />
      
      <CloudUploadIcon
        sx={{
          fontSize: 64,
          color: isDragActive ? 'primary.main' : 'text.secondary',
          mb: 2,
          transition: 'all 0.3s ease',
        }}
      />
      
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        {isDragActive ? 'Drop your file here' : 'Drop your video list here'}
      </Typography>
      
      <Typography variant="body1" color="text.secondary">
        or click to browse for a .txt file
      </Typography>
      
      <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
        <Typography variant="caption" color="text.secondary" component="div">
          Expected format: YouTube embed URLs with start and end parameters
        </Typography>
        <Typography variant="caption" color="text.secondary" fontFamily="monospace" sx={{ mt: 1, display: 'block' }}>
          https://www.youtube.com/embed/VIDEO_ID?start=10&end=20
        </Typography>
      </Box>
    </Paper>
  );
};

export default DropZone;
