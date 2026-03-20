require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const path = require('path')
const multer = require('multer')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})
const upload = multer({ storage })

const User = require('./models/User')
const Document = require('./models/Document')

const app = express()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

const start = async () => {
  try {
    const uri = process.env.MONGODB_URI.includes('retryWrites')
      ? process.env.MONGODB_URI
      : `${process.env.MONGODB_URI}${process.env.MONGODB_URI.includes('?') ? '&' : '?'}retryWrites=true&w=majority`

    await mongoose.connect(uri, {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      tls: true,
      tlsAllowInvalidCertificates: false,
      family: 4,
    })

    console.log('MongoDB connected')
  } catch (err) {
    console.error('MongoDB connection error (Atlas may need IP whitelist):', err.message)
    console.error('Check Atlas Network Access IP whitelist; add your IP or 0.0.0.0/0 for dev.')
    console.error('Retrying in 5 seconds...')
    setTimeout(start, 5000)
  }
}

start()

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body
  if (!name || !email || !password || !role) return res.status(400).json({ message: 'Missing fields' })
  if (!['issuer', 'individual', 'verifier'].includes(role)) return res.status(400).json({ message: 'Invalid role' })

  const existing = await User.findOne({ email })
  if (existing) return res.status(409).json({ message: 'Email already exists' })

  const hashed = await bcrypt.hash(password, 12)
  const user = await User.create({ name, email, password: hashed, role })

  const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ message: 'Missing fields' })

  const user = await User.findOne({ email })
  if (!user) return res.status(401).json({ message: 'Invalid credentials' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' })

  const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
})

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Not authorized' })

  const token = header.split(' ')[1]
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' })
  }
}

// Document endpoints with blockchain logic
app.post('/api/issuer/document', authMiddleware, upload.single('file'), async (req, res) => {
  if (req.user.role !== 'issuer') return res.status(403).json({ message: 'Permission denied' })

  const { name, type, owner, content, metadata } = req.body
  let parsedMetadata = metadata;
  if (typeof metadata === 'string') {
    try { parsedMetadata = JSON.parse(metadata) } catch (e) { parsedMetadata = {} }
  }

  if (!name || !type || !owner) return res.status(400).json({ message: 'Missing fields' })

  try {
    // Get the previous document to chain the hash
    const previousDoc = await Document.findOne().sort({ createdAt: -1 })
    const previousHash = previousDoc ? previousDoc.hash : '0'.repeat(64)
    
    // File handling
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Create blockchain hash with chaining
    const timestamp = Date.now()
    const blockData = `${name}|${type}|${req.user.email}|${owner}|${timestamp}|${fileUrl || ''}|${previousHash}`
    const hash = crypto.createHash('sha256').update(blockData).digest('hex')
    const docId = `DOC-${Math.floor(1000 + Math.random() * 9000)}`

    const document = await Document.create({
      docId,
      name,
      type,
      issuer: req.user.email,
      owner,
      hash,
      previousHash,
      fileUrl,
      content: content || '',
      metadata: parsedMetadata || { issuedAt: new Date(timestamp).toISOString() }
    })

    res.status(201).json({ success: true, document, message: 'Document issued successfully' })
  } catch (err) {
    console.error('Error issuing document:', err)
    res.status(500).json({ message: 'Error issuing document', error: err.message })
  }
})

app.get('/api/user/documents/:owner', authMiddleware, async (req, res) => {
  try {
    const owner = req.params.owner
    const docs = await Document.find({ owner }).sort({ createdAt: -1 })
    res.json({ documents: docs })
  } catch (err) {
    res.status(500).json({ message: 'Error fetching documents', error: err.message })
  }
})

app.get('/api/issuer/documents', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'issuer') return res.status(403).json({ message: 'Permission denied' })
    const docs = await Document.find({ issuer: req.user.email }).sort({ createdAt: -1 })
    res.json({ documents: docs })
  } catch (err) {
    res.status(500).json({ message: 'Error fetching documents', error: err.message })
  }
})

const { verifyDocumentWithAI } = require('./utils/ai')

app.post('/api/verifier', authMiddleware, upload.single('file'), async (req, res) => {
  const { docId, hash } = req.body
  if (!docId) return res.status(400).json({ message: 'Document ID required' })

  const doc = await Document.findOne({ docId })
  if (!doc) return res.status(404).json({ valid: false, message: 'Document not found' })
  if (hash && hash !== doc.hash) return res.json({ valid: false, message: 'Blockchain hash mismatch! Document might be tampered.' })

  const previousDoc = await Document.findOne({ hash: doc.previousHash })
  const isValid = !previousDoc || doc.previousHash === previousDoc.hash

  const issuer = await User.findOne({ email: doc.issuer }).select('email role')
  const individual = await User.findOne({ email: doc.owner }).select('email role')

  let aiResult = null;
  if (req.file) {
    const blockchainParams = {
      name: doc.name,
      type: doc.type,
      owner: doc.owner,
      issuer: doc.issuer
    };
    aiResult = await verifyDocumentWithAI(req.file.path, blockchainParams);
  }

  res.json({ 
    valid: aiResult ? aiResult.isValid : true, 
    document: doc,
    issuer,
    individual,
    blockchainValid: isValid,
    aiResult
  })
})

app.get('/api/verify/document/:docId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'verifier') return res.status(403).json({ message: 'Permission denied' })

    const { docId } = req.params
    const document = await Document.findOne({ docId })
    
    if (!document) return res.status(404).json({ message: 'Document not found' })

    // Verify blockchain chain integrity
    const previousDoc = await Document.findOne({ hash: document.previousHash })
    const isValid = !previousDoc || document.previousHash === previousDoc.hash

    const issuer = await User.findOne({ email: document.issuer }).select('email role')
    const individual = await User.findOne({ email: document.owner }).select('email role')

    res.json({ document, issuer, individual, blockchainValid: isValid })
  } catch (err) {
    res.status(500).json({ message: 'Error verifying document', error: err.message })
  }
})

app.get('/api/documents', authMiddleware, async (req, res) => {
  const docs = await Document.find()
  res.json(docs)
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`))
