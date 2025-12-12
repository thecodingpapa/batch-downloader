import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6', // Blue-500
      light: '#60a5fa',
      dark: '#2563eb',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#a855f7', // Purple-500
      light: '#c084fc',
      dark: '#9333ea',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444',
    },
    warning: {
      main: '#f59e0b',
    },
    success: {
      main: '#10b981',
    },
    background: {
      default: '#0f172a', // Slate-900
      paper: '#1e293b', // Slate-800
    },
    text: {
      primary: '#f1f5f9', // Slate-100
      secondary: '#94a3b8', // Slate-400
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '3rem',
      fontWeight: 900,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 800,
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 700,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 700,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
    '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
    '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
    '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    '0 25px 50px -12px rgb(0 0 0 / 0.6)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.9375rem',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;
