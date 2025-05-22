import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link as RouterLink } from 'react-router-dom';
import { Box, Container, CssBaseline, AppBar, Toolbar, Typography, Button, CircularProgress } from '@mui/material';
import { useAuth } from './contexts/AuthContext'; // Import the useAuth hook

// Import your page components
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FamilyTreeViewPage from './pages/FamilyTreeViewPage';
import UserProfilePage from './pages/UserProfilePage';
// import ErrorPage from './pages/ErrorPage'; // Uncomment if you have an ErrorPage

// --- Layout Component ---
const MainLayout = () => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation to /login will happen automatically when ProtectedRoute re-evaluates
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      // Optionally, show an error message to the user
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sapariwar (User: {currentUser?.email || 'Guest'})
          </Typography>
          <Button color="inherit" component={RouterLink} to="/dashboard">Dashboard</Button>
          <Button color="inherit" component={RouterLink} to="/profile">Profile</Button>
          {/* Add other navigation links as needed */}
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Outlet /> {/* Child routes render here */}
      </Container>
      <Box
        component="footer"
        sx={{
          py: 3, px: 2, mt: 'auto',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800],
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            {'© '} Sapariwar {new Date().getFullYear()} {'.'}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

// --- Protected Route Component ---
const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout />; // Renders the layout which includes <Outlet /> for the specific page
};

// --- App Component: Defines the application's routing structure ---
function App() {
  const { currentUser, loading } = useAuth(); // Needed for the fallback route and initial load check

  // Initial loading check to prevent premature redirection by fallback route
  if (loading && !currentUser) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Router> {/* BrowserRouter aliased as Router */}
      <Routes> {/* Container for all route definitions */}
        {/* Public Route: Login Page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes: These routes will use the ProtectedRoute component */}
        <Route element={<ProtectedRoute />}>
          {/* If authenticated and at root, navigate to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tree/:treeId" element={<FamilyTreeViewPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
          {/* Add other protected routes here */}
        </Route>

        {/* Fallback for any unknown routes */}
        <Route
          path="*"
          element={
            currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;