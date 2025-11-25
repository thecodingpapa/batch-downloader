import React, { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Slider,
  Paper,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import axios from 'axios';

function TrimTube() {
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [duration, setDuration] = useState(0);
  const [range, setRange] = useState([0, 10]);
  const [playing, setPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  
  const playerRef = useRef(null);
  const parsedTimesRef = useRef({ start: 0, end: 0 });

  const handleUrlChange = async (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setPlayerReady(false);
    setDuration(0);
    setRange([0, 10]);
    setVideoTitle('');
    
    try {
      let id = null;
      let startTime = 0;
      let endTime = 0;

      if (newUrl.includes('youtube.com') || newUrl.includes('youtu.be')) {
        const urlObj = new URL(newUrl.startsWith('http') ? newUrl : `https://${newUrl}`);
        
        if (newUrl.includes('youtu.be')) {
            id = urlObj.pathname.slice(1);
        } else if (newUrl.includes('embed')) {
            const parts = urlObj.pathname.split('/');
            id = parts[parts.length - 1];
        } else {
            id = urlObj.searchParams.get('v');
        }

        // Parse timestamps (support floats)
        const t = urlObj.searchParams.get('t');
        const start = urlObj.searchParams.get('start');
        const end = urlObj.searchParams.get('end');

        if (start) startTime = parseFloat(start);
        if (end) endTime = parseFloat(end);
        if (t) startTime = parseFloat(t); 
      }

      if (id) {
        setVideoId(id);
        setError(null);
        parsedTimesRef.current = { start: startTime, end: endTime };
        
        // Fetch video title
        try {
          const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
          if (response.ok) {
            const data = await response.json();
            setVideoTitle(data.title || '');
          }
        } catch (err) {
          console.error('Failed to fetch video title:', err);
        }
      } else {
        setVideoId(null);
      }
    } catch (e) {
      setVideoId(null);
    }
  };

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    setPlayerReady(true);
    
    // Get duration
    const d = event.target.getDuration();
    if (d && Number.isFinite(d)) {
      setDuration(d);
      
      const { start, end } = parsedTimesRef.current;
      let newStart = start || 0;
      let newEnd = end || Math.min(10, d);
      
      // Validate bounds
      if (newEnd > d) newEnd = d;
      if (newStart >= newEnd) newStart = Math.max(0, newEnd - 10);
      
      setRange([newStart, newEnd]);
      
      // Seek to start if specified
      if (newStart > 0) {
        event.target.seekTo(newStart, true);
      }
    }
  };

  const onPlayerStateChange = (event) => {
    // YouTube Player States:
    // -1 (unstarted)
    // 0 (ended)
    // 1 (playing)
    // 2 (paused)
    // 3 (buffering)
    // 5 (video cued)
    
    if (event.data === 1) { // Playing
      setPlaying(true);
    } else if (event.data === 2) { // Paused
      setPlaying(false);
    } else if (event.data === 0) { // Ended
      setPlaying(false);
    }
  };

  // Monitor playback and loop within range
  useEffect(() => {
    let interval;
    if (playing && playerRef.current) {
      interval = setInterval(() => {
        const currentTime = playerRef.current.getCurrentTime();
        if (currentTime >= range[1]) {
          playerRef.current.seekTo(range[0], true);
        }
      }, 100); // Check every 100ms
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [playing, range]);

  const onPlayerError = (event) => {
    console.error('YouTube Player Error:', event);
    setError('Failed to load video. Please check the URL or try another video.');
    setPlayerReady(false);
  };

  const handleRangeChange = (event, newValue) => {
    setRange(newValue);
    // Seek to start when slider changes
    if (playerRef.current && Math.abs(playerRef.current.getCurrentTime() - newValue[0]) > 1) {
      playerRef.current.seekTo(newValue[0], true);
    }
  };

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (playing) {
        playerRef.current.pauseVideo();
      } else {
        // Seek to start of range before playing
        playerRef.current.seekTo(range[0], true);
        playerRef.current.playVideo();
      }
    }
  };

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds();
    const pad = (num) => num.toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${pad(mm)}:${pad(ss)}`;
    }
    return `${mm}:${pad(ss)}`;
  };

  const handleDownload = async () => {
    if (!videoId) return;
    setIsDownloading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:3000/download', {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        start: range[0],
        end: range[1],
        videoId: videoId
      }, {
        responseType: 'blob',
      });

      const mimeType = response.headers['content-type'] || 'video/mp4';
      const blob = new Blob([response.data], { type: mimeType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Format filename as [TITLE]_[RANGE].mp4
      const sanitizeFilename = (str) => {
        return str.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
      };
      
      const titlePart = videoTitle ? sanitizeFilename(videoTitle) : videoId;
      const rangePart = `${Math.floor(range[0])}-${Math.floor(range[1])}`;
      const filename = `${titlePart}_${rangePart}.mp4`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      const serverMsg = err.response?.data?.error || err.message;
      setError(serverMsg);
    } finally {
      setIsDownloading(false);
    }
  };

  const opts = {
    playerVars: {
      autoplay: 0,
      controls: 1,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        TrimTube
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <TextField
          fullWidth
          label="Paste YouTube Link"
          variant="outlined"
          value={url}
          onChange={handleUrlChange}
          placeholder="https://www.youtube.com/watch?v=..."
          helperText="Supports standard, short, and embed links with timestamps"
          sx={{ mb: 2 }}
        />
        
        {videoId && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ position: 'relative', paddingTop: '56.25%', bgcolor: 'black', mb: 2 }}>
              {!playerReady && !error && (
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', zIndex: 1 }}>
                  <CircularProgress color="inherit" />
                </Box>
              )}
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                <YouTube
                  videoId={videoId}
                  opts={opts}
                  onReady={onPlayerReady}
                  onStateChange={onPlayerStateChange}
                  onError={onPlayerError}
                  style={{ width: '100%', height: '100%' }}
                  iframeClassName="youtube-iframe"
                />
              </Box>
            </Box>

            <Box sx={{ px: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Typography>
                  Trim Range: {formatTime(range[0])} - {formatTime(range[1])}
                </Typography>
                {duration > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    (Total: {formatTime(duration)})
                  </Typography>
                )}
              </Stack>
              <Slider
                value={range}
                onChange={handleRangeChange}
                valueLabelDisplay="auto"
                valueLabelFormat={formatTime}
                min={0}
                max={duration > 0 ? duration : 100}
                disabled={!playerReady || duration === 0}
                step={0.1}
                disableSwap
              />
              
              <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={handlePlayPause}
                  startIcon={playing ? <PauseIcon /> : <PlayArrowIcon />}
                  disabled={!playerReady}
                >
                  {playing ? 'Pause' : 'Preview'}
                </Button>
                
                <Button
                  variant="contained"
                  onClick={handleDownload}
                  disabled={isDownloading || !playerReady}
                  startIcon={isDownloading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                  sx={{
                    background: 'linear-gradient(to right, #f50057, #ff9100)',
                    '&:hover': {
                      background: 'linear-gradient(to right, #c51162, #ff6d00)',
                    },
                  }}
                >
                  {isDownloading ? 'Downloading...' : 'Download Trimmed Clip'}
                </Button>
              </Stack>
            </Box>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>
    </Container>
  );
}

export default TrimTube;
