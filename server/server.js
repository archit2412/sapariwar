const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import middleware
const authMiddleware = require('./middleware/authMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const treeRoutes = require('./routes/treeRoutes');
const memberRoutes = require('./routes/memberRoutes');
const guestSessionRoutes = require('./routes/guestSessionRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses application/json

// Public routes (no auth)
app.use('/api/auth', authRoutes);
app.use('/api/guest-sessions', guestSessionRoutes);

// Authenticated routes (add authMiddleware here or inside the router files)
app.use(authMiddleware); // Sets req.user or req.guestSessionId

// Only mount treeRoutes here; it will handle nesting for /api/trees/:treeId/members internally
app.use('/api/trees', treeRoutes);

// If you want a flat `/api/members` route (not nested), keep this:
app.use('/api/members', memberRoutes);

// --- DO NOT mount memberRoutes directly for nested usage here ---
// app.use('/api/trees/:treeId/members', memberRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {})
  .then(() => console.log('MongoDB Connected Successfully.'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    // process.exit(1);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access local: http://localhost:${PORT}`);
});

module.exports = app;