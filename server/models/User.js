const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  firebaseUid: { // The unique ID provided by Firebase Authentication
    type: String,
    required: true,
    unique: true,
    index: true, // Index for faster queries on firebaseUid
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  displayName: { // Optional, can be synced from Firebase or set by user
    type: String,
    trim: true,
  },
  profilePicture: { // Optional, URL to profile picture
    type: String,
    trim: true,
  },
  familyTrees: [{ // An array of ObjectIds referencing the FamilyTree model
    type: Schema.Types.ObjectId,
    ref: 'FamilyTree',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update `updatedAt` field before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', UserSchema);