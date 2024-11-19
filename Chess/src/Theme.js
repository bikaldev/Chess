import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
      mode: 'dark', // Enable dark mode
      primary: {
        main: '#90caf9', // Light blue for primary color
      },
      secondary: {
        main: '#f48fb1', // Pink for secondary color
      },
      background: {
        default: '#121212', // Dark background
        paper: '#1e1e1e', // Slightly lighter background for cards and surfaces
      },
      text: {
        primary: '#ffffff', // White text for better contrast
        secondary: '#b0bec5', // Grey text for secondary content
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h5: {
        fontWeight: 600,
        color: '#ffffff',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none', // Disable uppercase text on buttons
          },
        },
      },
    },
});
