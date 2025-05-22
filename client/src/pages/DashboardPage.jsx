import React from 'react';
import { Typography, Container } from '@mui/material';

export default function DashboardPage() {
  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard Page
      </Typography>
      <Typography>
        This is where the dashboard content (create new tree, list of trees) will go.
      </Typography>
    </Container>
  );
}