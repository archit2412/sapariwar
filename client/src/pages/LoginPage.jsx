import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Avatar, Button, CssBaseline, TextField, Link, Grid, Box, Typography, Container, CircularProgress } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'; // Will work after install
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const defaultTheme = createTheme();

export default function LoginPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error("Firebase login error:", err);
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Invalid email format.');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Invalid email or password.');
          break;
        case 'auth/too-many-requests':
          setError('Too many login attempts. Please try again later.');
          break;
        default:
          setError('Failed to log in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Display loading/redirecting message if user is already logged in
  // and Firebase is still determining auth state or navigating.
  if (loading || (currentUser && !error) ) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress sx={{ mr: 2 }} />
        <Typography>
          {currentUser ? 'Redirecting...' : 'Loading...'}
        </Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline /> {/* Apply baseline styles globally for this page context */}
      <Box
        display="flex"
        justifyContent="center" // Horizontally centers the child (Container)
        alignItems="center"    // Vertically centers the child (Container)
        minHeight="100vh"      // Ensures the Box takes full viewport height
        sx={{
          width: '100%',       // Ensures the Box takes full viewport width
          // bgcolor: 'rgba(0,0,255,0.1)', // For debugging: light blue background for outer Box
        }}
      >
        <Container component="main" maxWidth="xs" sx={{
          // bgcolor: 'rgba(255,0,0,0.1)', // For debugging: light red background for Container
        }}>
          <Box
            sx={{
              padding: { xs: 2, sm: 3 }, // Add some padding inside the container
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: '0px solid #ccc', // Optional: for visualizing the form box
              borderRadius: '4px', // Optional: if you want rounded corners for the form area
              // boxShadow: '0 2px 10px rgba(0,0,0,0.1)', // Optional: subtle shadow
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              Sign in
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              {error && (
                <Typography color="error" variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                  {error}
                </Typography>
              )}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
              <Grid container justifyContent="flex-end"> {/* Changed to flex-end for only sign up link */}
                {/* <Grid item xs>
                  <Link component={RouterLink} to="/forgot-password" variant="body2">
                    Forgot password?
                  </Link>
                </Grid> */}
                <Grid item>
                  <Link component={RouterLink} to="/signup" variant="body2">
                    {"Don't have an account? Sign Up"}
                  </Link>
                </Grid>
              </Grid>
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom sx={{mb:1}}>
                      OR
                  </Typography>
                  <Button
                      fullWidth
                      variant="outlined" // Changed to outlined for visual distinction
                      onClick={() => alert('Google Sign-In not implemented yet.')}
                      // startIcon={<GoogleIcon />} // Example if you add a Google icon
                  >
                      Sign In with Google
                  </Button>
              </Box>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4, mb: 3 }}>
            {'Copyright © '}
            <Link color="inherit" href="#"> {/* Replace with your actual site */}
              Sapariwar
            </Link>{' '}
            {new Date().getFullYear()}
            {'.'}
          </Typography>
        </Container>
      </Box>
    </ThemeProvider>
  );
}