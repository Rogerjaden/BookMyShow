import { createTheme } from '@mui/material/styles';

const font = '"Plus Jakarta Sans", "Roboto", "Helvetica", "Arial", sans-serif';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#E53935' },
    secondary: { main: '#FF6D00' },
    background: { default: '#121212', paper: '#1E1E1E' },
    success: { main: '#4CAF50' },
    warning: { main: '#FF9800' },
  },
  typography: {
    fontFamily: font,
    h3: { fontWeight: 800, letterSpacing: '-0.02em' },
    h4: { fontWeight: 800, letterSpacing: '-0.015em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700 },
    button: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          transition: 'transform 140ms ease, box-shadow 200ms ease, background-color 200ms ease',
          '&:active': { transform: 'scale(0.97)' },
        },
        containedPrimary: {
          '&:hover': { boxShadow: '0 6px 20px rgba(229, 57, 53, 0.4)' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { transition: 'transform 140ms ease, background-color 200ms ease', '&:active': { transform: 'scale(0.9)' } },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontSize: 12, backgroundColor: 'rgba(10,10,12,0.96)', border: '1px solid rgba(255,255,255,0.12)' },
        arrow: { color: 'rgba(10,10,12,0.96)' },
      },
    },
  },
});
