// Hypothetical future main.jsx for global theme and baseline
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ThemeProvider, createTheme } from '@mui/material/styles'; // Import MUI theme tools
import CssBaseline from '@mui/material/CssBaseline'; // Import CssBaseline
import './index.css';

const globalTheme = createTheme({
  // You can define your global theme customizations here
  // For example:
  // palette: {
  //   primary: {
  //     main: '#1976d2',
  //   },
  // },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={globalTheme}> {/* Global ThemeProvider */}
      <CssBaseline /> {/* Global CssBaseline */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);