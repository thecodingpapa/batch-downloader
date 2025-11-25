import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
} from '@mui/material';

function TrimTubeTest() {
  const [url, setUrl] = useState('');
  const [showPlayer, setShowPlayer] = useState(false);

  const handleSubmit = () => {
    if (url) {
      setShowPlayer(true);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        TrimTube Test
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <TextField
          fullWidth
          label="Paste YouTube Link"
          variant="outlined"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          sx={{ mb: 2 }}
        />
        
        <Button variant="contained" onClick={handleSubmit}>
          Load Video
        </Button>
        
        {showPlayer && (
          <Box sx={{ mt: 3 }}>
            <Typography>Video ID: {url}</Typography>
            <Box sx={{ position: 'relative', paddingTop: '56.25%', bgcolor: 'black', mt: 2 }}>
              <ReactPlayer
                url={url}
                width="100%"
                height="100%"
                style={{ position: 'absolute', top: 0, left: 0 }}
                controls
                onReady={() => console.log('Player ready!')}
                onError={(e) => console.error('Player error:', e)}
              />
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default TrimTubeTest;
