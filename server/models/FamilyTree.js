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
    index: true,
  },
  guestSessionId: { // For trees created by guests before login/signup
    type: String,
    index: true,
    sparse: true, // Allows multiple nulls; uniqueness managed by controller logic for active sessions.
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'FamilyMember',
  }],
  privacy: {
    type: String,
    enum: ['private', 'public_link', 'public'],
    default: 'private',
  },
  shareableLink: {
    type: String,
    unique: true,
    sparse: true,
  },
}, { timestamps: true }); // Mongoose option for automatic createdAt/updatedAt

// Validation to ensure a tree has an owner OR a guestSessionId, but not both.
// Controller logic is responsible for ensuring at least one is set upon creation.
FamilyTreeSchema.pre('validate', function(next) {
  if (this.owner && this.guestSessionId) {
    next(new Error('A family tree cannot have both an owner and a guest session ID.'));
  } else {
    next();
  }
});

module.exports = mongoose.model('FamilyTree', FamilyTreeSchema);