const mongoose = require('mongoose')

const DocumentSchema = new mongoose.Schema({
  docId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  issuer: { type: String, required: true },
  owner: { type: String, required: true },
  hash: { type: String, required: true },
  previousHash: { type: String, default: '0'.repeat(64) }, // Blockchain chain reference
  content: { type: String, default: '' }, // Document content
  metadata: { type: Object, default: {} }, // Additional metadata
}, { timestamps: true })

module.exports = mongoose.model('Document', DocumentSchema)
