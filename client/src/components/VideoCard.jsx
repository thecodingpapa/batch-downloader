import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const VideoCard = ({ video, onToggle }) => {
  const [isHovering, setIsHovering] = useState(false);
  const duration = (video.end - video.start).toFixed(1);

  // Construct iframe URL with start time and autoplay
  const iframeUrl = `https://www.youtube.com/embed/${video.videoId}?start=${Math.floor(video.start)}&autoplay=1&mute=0&controls=1&modestbranding=1&rel=0&enablejsapi=1`;

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Thumbnail Section */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%', // 16:9 Aspect Ratio
          bgcolor: 'black',
          borderRadius: '12px',
          overflow: 'hidden',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Default Thumbnail Image */}
        <Box
          component="img"
          src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
          alt="Video Thumbnail"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isHovering ? 0 : 1,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
          }}
        />

        {/* YouTube iframe - only render when hovering */}
        {isHovering && (
          <iframe
            src={iframeUrl}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}

        {/* Duration Badge */}
        <Chip
          label={duration + 's'}
          size="small"
          sx={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            bgcolor: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.75rem',
            height: 18,
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 10,
            '& .MuiChip-label': {
              px: 0.5,
            },
          }}
        />
      </Box>

      {/* Info Section */}
      <Box
        onClick={() => onToggle(video.id)}
        sx={{
          display: 'flex',
          gap: 1.5,
          pt: 1.5,
          cursor: 'pointer',
          '&:hover': {
            '& .video-title': {
              color: 'text.primary',
            },
          },
        }}
      >
        {/* Checkbox */}
        <Box sx={{ flexShrink: 0 }}>
          <Checkbox
            checked={video.selected}
            icon={<RadioButtonUncheckedIcon sx={{ fontSize: 20 }} />}
            checkedIcon={<CheckCircleIcon sx={{ fontSize: 20 }} />}
            sx={{
              p: 0,
              color: 'text.secondary',
              '&.Mui-checked': {
                color: 'primary.main',
              },
            }}
          />
        </Box>

        {/* Video Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            className="video-title"
            variant="body2"
            fontWeight={500}
            sx={{
              mb: 0.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.4,
              color: 'text.primary',
              transition: 'color 0.1s',
            }}
            title={video.videoId}
          >
            {video.videoId}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <AccessTimeIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {video.start}s - {video.end}s
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default VideoCard;
