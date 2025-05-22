import React from 'react';
import { Typography, Container } from '@mui/material';

export default function UserProfilePage() { // Make sure "export default" is here
  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        User Profile Page
      </Typography>
      <Typography>
        This is where users can manage their account settings.
      </Typography>
    </Container>
  );
}