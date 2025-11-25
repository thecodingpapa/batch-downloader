import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  Stack
} from '@mui/material';
import BatchDownloader from './pages/BatchDownloader';
import TrimTube from './pages/TrimTube';
import TrimTubeTest from './pages/TrimTubeTest';

function Navigation() {
  const location = useLocation();
  
  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', pt: 2 }}>
        <Toolbar>
          <Container maxWidth="xl">
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography
                variant="h1"
                sx={{
                  background: location.pathname === '/trim' 
                    ? 'linear-gradient(to right, #f50057, #ff9100)'
                    : 'linear-gradient(to right, #2563eb, #9333ea, #ec4899)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2,
                  fontSize: { xs: '2.5rem', md: '4rem' },
                  fontWeight: 'bold'
                }}
              >
                {location.pathname === '/trim' ? 'TrimTube' : 'Batch Clip Downloader'}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', mb: 3 }}>
                {location.pathname === '/trim' 
                    ? 'Precise trimming for your favorite YouTube moments.' 
                    : 'Effortlessly trim and download YouTube clips in bulk.'}
              </Typography>
              
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button 
                    component={Link} 
                    to="/" 
                    variant={location.pathname === '/' ? 'contained' : 'outlined'}
                    sx={location.pathname === '/' ? {
                        background: 'linear-gradient(to right, #2563eb, #9333ea)',
                        border: 'none',
                        '&:hover': { background: 'linear-gradient(to right, #1d4ed8, #7e22ce)' }
                    } : { borderColor: '#2563eb', color: '#2563eb' }}
                >
                    Batch Downloader
                </Button>
                <Button 
                    component={Link} 
                    to="/trim" 
                    variant={location.pathname === '/trim' ? 'contained' : 'outlined'}
                    sx={location.pathname === '/trim' ? {
                        background: 'linear-gradient(to right, #f50057, #ff9100)',
                        border: 'none',
                        '&:hover': { background: 'linear-gradient(to right, #c51162, #ff6d00)' }
                    } : { borderColor: '#f50057', color: '#f50057' }}
                >
                    TrimTube
                </Button>
              </Stack>
            </Box>
          </Container>
        </Toolbar>
      </AppBar>
  );
}

function App() {
  return (
    <Router>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <Navigation />
            <Routes>
                <Route path="/" element={<BatchDownloader />} />
                <Route path="/trim" element={<TrimTube />} />
                <Route path="/test" element={<TrimTubeTest />} />
            </Routes>
        </Box>
    </Router>
  );
}

export default App;
