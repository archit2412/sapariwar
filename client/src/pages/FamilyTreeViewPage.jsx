import React from 'react';
import { Typography, Container } from '@mui/material';

export default function FamilyTreeViewPage() {
  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Family Tree View Page
      </Typography>
      <Typography>
        This is where the interactive family tree (React Flow) will be displayed.
      </Typography>
    </Container>
  );
}