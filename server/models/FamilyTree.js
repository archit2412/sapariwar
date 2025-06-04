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
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  guestSessionId: {
    type: String,
    index: true,
    sparse: true,
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
}, { timestamps: true });

FamilyTreeSchema.pre('validate', function(next) {
  if (this.owner && this.guestSessionId) {
    next(new Error('A family tree cannot have both an owner and a guest session ID.'));
  } else {
    next();
  }
});

module.exports = mongoose.model('FamilyTree', FamilyTreeSchema);