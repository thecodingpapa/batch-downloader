import React from 'react';
import { Grid } from '@mui/material';
import VideoCard from './VideoCard';

const VideoGrid = ({ videos, onToggle }) => {
  if (videos.length === 0) {
    return null;
  }

  return (
    <Grid container spacing={3}>
      {videos.map((video) => (
        <Grid key={video.id} size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 3 }} sx={{ display: 'flex', minWidth: 300 }}>
          <VideoCard video={video} onToggle={onToggle} />
        </Grid>
      ))}
    </Grid>
  );
};

export default VideoGrid;
