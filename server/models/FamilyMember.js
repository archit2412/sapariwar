const mongoose = require('mongoose');

// Helper for conditional required
function parentRequired() {
  return this.role === 'self';
}

const familyMemberSchema = new mongoose.Schema({
  treeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyTree', required: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  dateOfBirth: { type: Date },
  placeOfBirth: { type: String },
  dateOfDeath: { type: Date },
  placeOfDeath: { type: String },
  profilePictureUrl: { type: String },
  biography: { type: String },
  mother: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
    required: [parentRequired, 'Mother is required for self.'],
  },
  father: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember',
    required: [parentRequired, 'Father is required for self.'],
  },
  spouses: [
    {
      spouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember' },
      relationshipType: { type: String },
    }
  ],
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember' }],
  role: {
    type: String,
    required: true,
    enum: ['self', 'father', 'mother', 'sibling', 'spouse', 'child']
  },
}, { timestamps: true });

module.exports = mongoose.model('FamilyMember', familyMemberSchema);