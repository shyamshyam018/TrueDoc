const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['issuer', 'individual', 'verifier'], required: true },
  stateOfResidence: { type: String },
  aadharNumber: { type: String },
  panNumber: { type: String },
  isIdentityVerified: { type: Boolean, default: false },
  aadharFileUrl: { type: String },
  panFileUrl: { type: String }
}, { timestamps: true })

module.exports = mongoose.model('User', UserSchema)
