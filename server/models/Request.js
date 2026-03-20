const mongoose = require('mongoose')

const RequestSchema = new mongoose.Schema({
  individualEmail: { type: String, required: true },
  issuerEmail: { type: String, required: true },
  documentType: { type: String, required: true },
  status: { type: String, enum: ['pending', 'fulfilled', 'rejected'], default: 'pending' },
  docId: { type: String }, // Linked document ID upon fulfillment
  attachmentUrl: { type: String },
}, { timestamps: true })

module.exports = mongoose.model('Request', RequestSchema)
