require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const path = require('path')
const fs = require('fs')
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
const Request = require('./models/Request')

const app = express()

app.use(cors())
app.use(express.json())
// Removed public static /uploads

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
  const { name, email, password, role, stateOfResidence, aadharNumber, panNumber } = req.body
  if (!name || !email || !password || !role) return res.status(400).json({ message: 'Missing fields' })
  if (!['issuer', 'individual', 'verifier'].includes(role)) return res.status(400).json({ message: 'Invalid role' })

  if (role === 'individual' && (!stateOfResidence || !aadharNumber || !panNumber)) {
    return res.status(400).json({ message: 'Missing KYC fields for individual' })
  }

  const existing = await User.findOne({ email })
  if (existing) return res.status(409).json({ message: 'Email already exists' })

  const hashed = await bcrypt.hash(password, 12)
  const user = await User.create({ name, email, password: hashed, role, stateOfResidence, aadharNumber, panNumber })

  const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, isIdentityVerified: user.isIdentityVerified } })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ message: 'Missing fields' })

  const user = await User.findOne({ email })
  if (!user) return res.status(401).json({ message: 'Invalid credentials' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' })

  const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, isIdentityVerified: user.isIdentityVerified } })
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
  if (req.user.role?.toLowerCase() !== 'issuer') return res.status(403).json({ message: 'Permission denied' })

  const { name, type, owner, content, metadata, requestId } = req.body
  let parsedMetadata = metadata;
  if (typeof metadata === 'string') {
    try { parsedMetadata = JSON.parse(metadata) } catch (e) { parsedMetadata = {} }
  }

  // Inject Individual KYC fields if they exist
  const ownerUser = await User.findOne({ email: owner, role: 'individual' });
  if (ownerUser) {
    if (ownerUser.stateOfResidence) parsedMetadata.individualState = ownerUser.stateOfResidence;
    if (ownerUser.aadharNumber) parsedMetadata.individualAadhar = ownerUser.aadharNumber;
    if (ownerUser.panNumber) parsedMetadata.individualPan = ownerUser.panNumber;
  }

  if (!name || !type || !owner) return res.status(400).json({ message: 'Missing fields' })

  try {
    // Get the previous document to chain the hash
    const previousDoc = await Document.findOne().sort({ createdAt: -1 })
    const previousHash = previousDoc ? previousDoc.hash : '0'.repeat(64)
    
    // File handling and physical payload hashing
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
    let physicalFileHash = null;
    if (req.file) {
      const fileBuffer = fs.readFileSync(req.file.path);
      physicalFileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      parsedMetadata = { ...parsedMetadata, physicalFileHash };
    }
    
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

    if (requestId) {
      await Request.findByIdAndUpdate(requestId, { status: 'fulfilled', docId: document.docId });
    }

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
    if (req.user.role?.toLowerCase() !== 'issuer') return res.status(403).json({ message: 'Permission denied' })
    const docs = await Document.find({ issuer: req.user.email }).sort({ createdAt: -1 })
    res.json({ documents: docs })
  } catch (err) {
    res.status(500).json({ message: 'Error fetching documents', error: err.message })
  }
})

const { verifyDocumentWithAI, verifyIdentityDocumentWithAI } = require('./utils/ai')

app.post('/api/user/verify-identity', authMiddleware, upload.fields([{ name: 'aadharFile', maxCount: 1 }, { name: 'panFile', maxCount: 1 }]), async (req, res) => {
  try {
    if (req.user.role?.toLowerCase() !== 'individual') return res.status(403).json({ message: 'Only individuals can verify identity.' });

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (!req.files || !req.files.aadharFile || !req.files.panFile) {
        return res.status(400).json({ message: 'Both Aadhar and PAN files are required' });
    }
    
    // Verify Aadhar (Autonomous Extraction)
    const aadharRes = await verifyIdentityDocumentWithAI(req.files.aadharFile[0].path, 'Aadhar Card');
    if (!aadharRes.isValid || !aadharRes.idNumber) return res.status(400).json({ message: 'Aadhar AI Extraction Failed: ' + aadharRes.message });

    // Verify PAN (Autonomous Extraction)
    const panRes = await verifyIdentityDocumentWithAI(req.files.panFile[0].path, 'PAN Card');
    if (!panRes.isValid || !panRes.idNumber) return res.status(400).json({ message: 'PAN AI Extraction Failed: ' + panRes.message });

    // Update User Profile with the physically extracted legit data
    user.aadharNumber = aadharRes.idNumber;
    user.panNumber = panRes.idNumber;
    user.name = aadharRes.name && aadharRes.name.length > 2 ? aadharRes.name : (panRes.name && panRes.name.length > 2 ? panRes.name : user.name);
    
    user.isIdentityVerified = true;
    user.aadharFileUrl = '/uploads/' + req.files.aadharFile[0].filename;
    user.panFileUrl = '/uploads/' + req.files.panFile[0].filename;
    await user.save();

    res.json({ success: true, message: 'Identity successfully verified! Access granted.', isIdentityVerified: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Identity verification error', error: err.message });
  }
});

app.post('/api/user/documents/tamper/:docId', authMiddleware, upload.single('fakeFile'), async (req, res) => {
  try {
    if (req.user.role?.toLowerCase() !== 'individual') return res.status(403).json({ message: 'Only individuals can tamper their own files.' });
    if (!req.file) return res.status(400).json({ message: 'A physical replacement file is required to simulate tampering.' });

    const doc = await Document.findOne({ docId: req.params.docId, owner: req.user.email });
    if (!doc) return res.status(404).json({ message: 'Document not found or access denied.' });

    // Aggressive tampering: Update backend fileUrl pointer to the fake file
    doc.fileUrl = '/uploads/' + req.file.filename;
    await doc.save();

    res.json({ success: true, message: 'Malicious Tampering Successful! The backend physical asset has been overridden.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Tampering failed', error: err.message });
  }
});

app.post('/api/verifier', authMiddleware, upload.single('file'), async (req, res) => {
  const { docId, hash, engine } = req.body
  if (!docId) return res.status(400).json({ message: 'Document ID required' })

  const doc = await Document.findOne({ docId })
  if (!doc) return res.status(404).json({ valid: false, message: 'Document not found' })
  if (hash && hash !== doc.hash) return res.json({ valid: false, message: 'Blockchain hash mismatch! Document might be tampered.' })

  const previousDoc = await Document.findOne({ hash: doc.previousHash })
  let isBlockchainValid = !previousDoc || doc.previousHash === previousDoc.hash
  let hashMismatchReason = null

  const issuer = await User.findOne({ email: doc.issuer }).select('email role')
  const individual = await User.findOne({ email: doc.owner }).select('email role name aadharNumber panNumber stateOfResidence')

  const crypto = require('crypto')
  const fs = require('fs')
  const path = require('path')
  let aiResult = null;
  let targetFilePath = null;

  const blockchainParams = {
    name: doc.name,
    type: doc.type,
    owner: doc.owner,
    issuer: doc.issuer,
    individualName: individual?.name,
    individualAadhar: individual?.aadharNumber,
    individualPan: individual?.panNumber,
    individualState: individual?.stateOfResidence
  };

  if (req.file) {
    targetFilePath = req.file.path;
  } else if (doc.fileUrl) {
    const filename = doc.fileUrl.split('/').pop();
    targetFilePath = path.join(__dirname, 'uploads', filename);
  }

  // Cryptographic Payload Proof
  // We strictly recompute the hash of the target physical file and check if it matches the originally issued 'physicalFileHash'.
  if (targetFilePath && fs.existsSync(targetFilePath)) {
    const fileBuffer = fs.readFileSync(targetFilePath);
    const currentPhysicalHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    if (doc.metadata?.physicalFileHash && currentPhysicalHash !== doc.metadata.physicalFileHash) {
      isBlockchainValid = false;
      hashMismatchReason = 'Cryptographic Genesis Block Tampering Detected: The physical file payload violently mismatches the originally hashed bytes embedded in the genesis block metadata! The file was maliciously replaced!';
    }
    
    aiResult = await verifyDocumentWithAI(targetFilePath, blockchainParams, engine || 'gemini');
  }

  res.json({ 
    valid: aiResult ? aiResult.isValid : true, 
    document: doc,
    issuer,
    individual,
    blockchainValid: isBlockchainValid,
    hashMismatchReason,
    aiResult
  })
})

app.get('/api/verify/document/:docId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role?.toLowerCase() !== 'verifier') return res.status(403).json({ message: 'Permission denied' })

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

app.post('/api/requests/new', authMiddleware, async (req, res) => {
  if (req.user.role?.toLowerCase() !== 'individual') return res.status(403).json({ message: 'Only individuals can request documents' })
  const { issuerEmail, documentType } = req.body
  if (!issuerEmail || !documentType) return res.status(400).json({ message: 'Missing fields' })

  try {
    const request = await Request.create({
      individualEmail: req.user.email,
      issuerEmail,
      documentType,
      status: 'pending'
    })
    res.status(201).json({ success: true, request })
  } catch (err) {
    res.status(500).json({ message: 'Failed to create request', error: err.message })
  }
})

app.get('/api/requests/download/:filename', authMiddleware, async (req, res) => {
  const { filename } = req.params;
  const request = await Request.findOne({ attachmentUrl: `/uploads/${filename}` });
  if (!request) return res.status(404).json({ message: 'Attachment not found' });
  
  if (req.user.role?.toLowerCase() === 'individual' && request.individualEmail !== req.user.email) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  if (req.user.role?.toLowerCase() === 'issuer' && request.issuerEmail !== req.user.email) {
     return res.status(403).json({ message: 'Unauthorized' });
  }

  const filePath = path.join(__dirname, 'uploads', filename);
  res.download(filePath);
});

app.get('/api/issuer/requests', authMiddleware, async (req, res) => {
  if (req.user.role?.toLowerCase() !== 'issuer') return res.status(403).json({ message: 'Permission denied' })
  try {
    const requests = await Request.find({ issuerEmail: req.user.email }).sort({ createdAt: -1 })
    res.json({ requests })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch requests', error: err.message })
  }
})

app.get('/api/user/requests', authMiddleware, async (req, res) => {
  if (req.user.role?.toLowerCase() !== 'individual') return res.status(403).json({ message: 'Permission denied' })
  try {
    const requests = await Request.find({ individualEmail: req.user.email }).sort({ createdAt: -1 })
    res.json({ requests })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch requests', error: err.message })
  }
})

app.get('/api/documents', authMiddleware, async (req, res) => {
  const docs = await Document.find()
  res.json(docs)
})

app.get('/api/documents/download/:filename', authMiddleware, async (req, res) => {
  const { filename } = req.params;
  const doc = await Document.findOne({ fileUrl: `/uploads/${filename}` });
  if (!doc) return res.status(404).json({ message: 'File not found' });
  
  if (req.user.role?.toLowerCase() === 'individual' && doc.owner !== req.user.email) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  if (req.user.role?.toLowerCase() === 'issuer' && doc.issuer !== req.user.email) {
     return res.status(403).json({ message: 'Unauthorized' });
  }

  const filePath = path.join(__dirname, 'uploads', filename);
  res.download(filePath);
});

// Verifier Directory Endpoint (Phase 2 Insights)
app.get('/api/verifier/directory', authMiddleware, async (req, res) => {
  if (req.user.role?.toLowerCase() !== 'verifier') return res.status(403).json({ message: 'Permission denied' });
  
  try {
    const issuers = await User.find({ role: 'issuer' }).select('name email createdAt');
    const individuals = await User.find({ role: 'individual' }).select('name email createdAt');
    
    const issuerCounts = await Document.aggregate([ { $group: { _id: "$issuer", count: { $sum: 1 } } } ]);
    const ownerCounts = await Document.aggregate([ { $group: { _id: "$owner", count: { $sum: 1 } } } ]);
    const allDocuments = await Document.find({}).sort({ createdAt: -1 });

    res.json({
      issuers: issuers.map(i => ({
        ...i.toObject(),
        documentsIssued: issuerCounts.find(c => c._id === i.email)?.count || 0
      })),
      individuals: individuals.map(i => ({
        ...i.toObject(),
        documentsOwned: ownerCounts.find(c => c._id === i.email)?.count || 0
      })),
      allDocuments
    });
  } catch(err) {
    res.status(500).json({ message: "Failed to fetch directory" });
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`))
