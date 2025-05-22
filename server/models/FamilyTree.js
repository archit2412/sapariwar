const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FamilyTreeSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Family tree name is required.'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  owner: { // The user who created and owns this tree
    type: Schema.Types.ObjectId,
    ref: 'User', // References the 'User' model
    required: true,
    index: true, // Index for faster queries on owner
  },
  members: [{ // An array of ObjectIds referencing the FamilyMember model
    type: Schema.Types.ObjectId,
    ref: 'FamilyMember',
  }],
  // We can add more specific rootMember or similar if needed for visualization later
  // rootMember: {
  //   type: Schema.Types.ObjectId,
  //   ref: 'FamilyMember'
  // },
  privacy: {
    type: String,
    enum: ['private', 'public_link', 'public'], // 'public' might be a future addition
    default: 'private',
  },
  shareableLink: { // For 'public_link' privacy setting
    type: String,
    unique: true,
    sparse: true, // Allows multiple nulls, but unique if value exists
  },
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
FamilyTreeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // Potentially generate a shareableLink if privacy is 'public_link' and link doesn't exist
  // For now, we'll handle link generation in the route/controller logic for simplicity
  next();
});

// Ensure that a tree has an owner before saving (though 'required: true' handles this)
FamilyTreeSchema.pre('validate', function(next) {
  if (!this.owner) {
    next(new Error('A family tree must have an owner.'));
  } else {
    next();
  }
});

module.exports = mongoose.model('FamilyTree', FamilyTreeSchema);