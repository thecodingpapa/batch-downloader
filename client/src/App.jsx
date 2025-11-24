import React, { useState } from 'react';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Chip,
  Stack,
  CircularProgress,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DropZone from './components/DropZone';
import VideoGrid from './components/VideoGrid';

function App() {
  const [videos, setVideos] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleVideosParsed = (parsedVideos) => {
    setVideos(parsedVideos);
  };

  const handleToggleVideo = (id) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, selected: !v.selected } : v))
    );
  };

  const handleSelectAll = () => {
    setVideos((prev) => prev.map((v) => ({ ...v, selected: true })));
  };

  const handleDeselectAll = () => {
    setVideos((prev) => prev.map((v) => ({ ...v, selected: false })));
  };

  const handleDownload = async () => {
    const selectedVideos = videos.filter((v) => v.selected);
    if (selectedVideos.length === 0) return;

    setIsDownloading(true);
    try {
      for (const video of selectedVideos) {
        console.log('Requesting download for videoId:', video.videoId, 'URL:', video.originalUrl, 'start:', video.start, 'end:', video.end);
        try {
          const formData = new FormData();
          const response = await axios.post('http://localhost:3000/download', {
            url: video.originalUrl,
            start: video.start,
            end: video.end,
            videoId: video.videoId
          }, {
            responseType: 'blob',
            // Let axios reject non‑2xx to catch errors
          });

          // Determine MIME type from response headers (fallback to mp4)
          const mimeType = response.headers['content-type'] || 'video/mp4';
          const blob = new Blob([response.data], { type: mimeType });
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.setAttribute('download', `${video.videoId}_clip.mp4`);
          document.body.appendChild(link);
          link.click();
          link.remove();
        } catch (err) {
          // Axios error may contain a response with server message
          const serverMsg = err.response?.data?.error || err.message;
          
          console.error('Download failed for', video.videoId, ':', serverMsg);
          alert(`Failed to download video ${video.videoId}: ${serverMsg}`);
        }
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const selectedCount = videos.filter((v) => v.selected).length;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', pt: 2 }}>
        <Toolbar>
          <Container maxWidth="xl">
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography
                variant="h1"
                sx={{
                  background: 'linear-gradient(to right, #2563eb, #9333ea, #ec4899)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2,
                }}
              >
                Batch Clip Downloader
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
                Effortlessly trim and download YouTube clips in bulk. Just drop your list and go.
              </Typography>
            </Box>
          </Container>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Drop Zone */}
        <Box sx={{ maxWidth: 800, mx: 'auto', mb: 6 }}>
          <DropZone onVideosParsed={handleVideosParsed} />
        </Box>

        {/* Video Grid Section */}
        {videos.length > 0 && (
          <Box sx={{ pb: 10 }}>
            {/* Video Grid */}
            <VideoGrid videos={videos} onToggle={handleToggleVideo} />

            {/* Floating Download Button */}
            {selectedCount > 0 && (
              <Box
                sx={{
                  position: 'fixed',
                  bottom: 32,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 1000,
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  startIcon={isDownloading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                  sx={{
                    background: 'linear-gradient(to right, #2563eb, #9333ea)',
                    minWidth: 240,
                    py: 1.5,
                    px: 4,
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: 6,
                    '&:hover': {
                      background: 'linear-gradient(to right, #1d4ed8, #7e22ce)',
                      boxShadow: 8,
                    },
                  }}
                >
                  {isDownloading ? 'Processing...' : `Download ${selectedCount} ${selectedCount === 1 ? 'Clip' : 'Clips'}`}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default App;
