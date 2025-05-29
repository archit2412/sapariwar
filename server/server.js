const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import middleware
const authMiddleware = require('./middleware/authMiddleware'); // Your modified authMiddleware

// Import routes
const authRoutes = require('./routes/authRoutes');
const treeRoutes = require('./routes/treeRoutes');
const memberRoutes = require('./routes/memberRoutes');
const guestSessionRoutes = require('./routes/guestSessionRoutes'); // << ADDED: Import new guest routes

const app = express();

// Basic Middleware
app.use(cors());
app.use(express.json()); // For parsing application/json

// --- IMPORTANT: Apply authMiddleware globally ---
// This middleware will attempt to populate req.user (if token provided)
// or req.guestSessionId (if 'x-guest-session-id' header provided)
// for all subsequent routes.
app.use(authMiddleware); // << ADDED/MODIFIED: Ensure this is present and correctly placed

// API Routes
// These routes will now have req.user or req.guestSessionId potentially populated
// by the global authMiddleware.
app.use('/api/auth', authRoutes); // For login, signup, etc.
app.use('/api/trees', treeRoutes); // For tree-related operations
app.use('/api/members', memberRoutes); // For member-related operations
app.use('/api/guest-sessions', guestSessionRoutes); // << ADDED: Register guest session routes

// Default error handler (optional, but good practice)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Database Connection
// Ensure your MONGODB_URI is correctly set in your .env file
mongoose.connect(process.env.MONGODB_URI, {
  // useNewUrlParser: true, // Deprecated
  // useUnifiedTopology: true, // Deprecated
  // useCreateIndex: true, // Not supported
  // useFindAndModify: false, // Not supported
  // Mongoose 6+ these are default and/or not needed.
  // If using older Mongoose, you might need them.
})
.then(() => console.log('MongoDB Connected Successfully.'))
.catch(err => {
  console.error('MongoDB Connection Error:', err.message);
  // process.exit(1); // Optionally exit if DB connection fails
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access local: http://localhost:${PORT}`);
});

// For testing purposes if you import 'app' elsewhere (e.g. in test files)
module.exports = app;