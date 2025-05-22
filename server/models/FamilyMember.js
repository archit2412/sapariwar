const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FamilyMemberSchema = new Schema({
  treeId: { // The family tree this member belongs to
    type: Schema.Types.ObjectId,
    ref: 'FamilyTree',
    required: true,
    index: true, // Index for faster queries for members of a specific tree
  },
  firstName: {
    type: String,
    required: [true, 'First name is required.'],
    trim: true,
  },
  lastName: {
    type: String,
    trim: true, // Optional, some may only have one name or prefer a single 'fullName' field
  },
  // Consider a virtual for fullName if you keep firstName and lastName separate
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say'], // Customizable
    required: true,
  },
  dateOfBirth: {
    type: Date,
  },
  placeOfBirth: {
    type: String,
    trim: true,
  },
  dateOfDeath: { // Optional
    type: Date,
  },
  placeOfDeath: { // Optional
    type: String,
    trim: true,
  },
  profilePictureUrl: {
    type: String,
    trim: true, // URL to the image
  },
  biography: {
    type: String,
    trim: true,
  },
  // --- Relationships ---
  parents: [{ // IDs of this member's parents
    type: Schema.Types.ObjectId,
    ref: 'FamilyMember',
  }],
  spouses: [{ // List of spouses
    spouseId: {
      type: Schema.Types.ObjectId,
      ref: 'FamilyMember',
    },
    // You could add more details about the union if needed:
    // marriageDate: Date,
    // divorceDate: Date,
    // relationshipType: { type: String, enum: ['Married', 'Divorced', 'Partnered'] }
  }],
  children: [{ // IDs of this member's children
    type: Schema.Types.ObjectId,
    ref: 'FamilyMember',
  }],
  // Note on relationships:
  // Storing direct children and parents can lead to data duplication or synchronization issues
  // if not handled carefully. Often, one side is stored (e.g., parents), and the other
  // (children) is derived. For simplicity in this initial model, we'll include all three,
  // but be mindful of this during API development.
  // A common approach is to store `parents` on a member, and then `children` can be
  // found by querying for members who list the current member in their `parents` array.
  // Spousal relationships are often many-to-many and can be explicitly stored.

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
FamilyMemberSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for full name
FamilyMemberSchema.virtual('fullName').get(function() {
  let fullName = this.firstName || '';
  if (this.lastName) {
    fullName += (fullName ? ' ' : '') + this.lastName;
  }
  return fullName.trim() || undefined; // Return undefined if no name parts exist
});

// Ensure the virtuals are included when converting to JSON or Object
FamilyMemberSchema.set('toJSON', { virtuals: true });
FamilyMemberSchema.set('toObject', { virtuals: true });


module.exports = mongoose.model('FamilyMember', FamilyMemberSchema);