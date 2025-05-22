require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const admin = require('firebase-admin');

const authRoutes = require('./routes/authRoutes');
// LMP 1. Import tree routes
const treeRoutes = require('./routes/treeRoutes');


// Initialize Firebase Admin SDK
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log('Firebase Admin SDK initialized with service account file.');
  } else if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        clientId: process.env.FIREBASE_CLIENT_ID,
      }),
    });
    console.log('Firebase Admin SDK initialized with individual environment variables.');
  } else {
    console.error('Firebase Admin SDK Credentials not found. Please set GOOGLE_APPLICATION_CREDENTIALS or individual FIREBASE_... variables in .env');
  }
} catch (error) {
  console.error('Firebase Admin SDK Initialization Error:', error);
}

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Sapariwar API Running');
});

// Define API Routes
app.use('/api/auth', authRoutes);
// LMP 2. Mount the tree routes
app.use('/api/trees', treeRoutes); // All routes in treeRoutes will be prefixed with /api/trees and use authMiddleware as defined within treeRoutes.js

// We'll add these later:
// const memberRoutes = require('./routes/memberRoutes');
// app.use('/api/members', authMiddleware, memberRoutes);


const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));