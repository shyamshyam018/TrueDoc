import { motion } from 'framer-motion'
import { Download, Eye, EyeOff, Clock, CheckCircle, Shield, Loader } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import DocumentPreviewModal from './DocumentPreviewModal'

export default function IndividualDashboard({ user, token, darkMode = false }) {
  const [documents, setDocuments] = useState([])
  const [requests, setRequests] = useState([])
  const [requestForm, setRequestForm] = useState({ issuerEmail: '', documentType: '' })
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [previewEndpoint, setPreviewEndpoint] = useState(null)
  const [tamperingDoc, setTamperingDoc] = useState(null)

  const [identityFiles, setIdentityFiles] = useState({ aadhar: null, pan: null })
  const [verifyingIdentity, setVerifyingIdentity] = useState(false)

  useEffect(() => {
    if (user && user.isIdentityVerified !== false) {
      fetchDocuments()
      fetchRequests()
    }
  }, [user])

  const fetchRequests = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/user/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const submitRequest = async (e) => {
    e.preventDefault()
    if (!requestForm.issuerEmail || !requestForm.documentType) return toast.error('Fill all fields')
    setRequesting(true)
    try {
      const res = await fetch(`http://localhost:5000/api/requests/new`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestForm)
      })
      if (res.ok) {
        toast.success("Document requested successfully!")
        setRequestForm({ issuerEmail: '', documentType: '' })
        fetchRequests()
      } else {
        const err = await res.json()
        toast.error(err.message || 'Request failed')
      }
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setRequesting(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/user/documents/${user.email}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
        if (data.documents?.length === 0) {
          toast('No documents assigned yet', { icon: '📋' })
        }
      } else {
        toast.error('Failed to fetch documents')
      }
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async (fileUrl) => {
    try {
      const filename = fileUrl.split('/').pop();
      const res = await fetch(`http://localhost:5000/api/documents/download/${filename}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Secure document downloaded!');
      } else {
        toast.error('Failed to download secure file');
      }
    } catch (err) {
      console.error(err)
      toast.error('Download error');
    }
  }

  const downloadDocument = (doc) => {
    const dataStr = JSON.stringify(doc, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.docId || 'document'}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Document downloaded!')
  }

  const handleTamper = async (e, docId) => {
    e.preventDefault()
    const file = e.target[0].files[0]
    if (!file) return toast.error('Drop a fake file to tamper!')
    setTamperingDoc(docId)
    try {
      const formData = new FormData()
      formData.append('fakeFile', file)
      const res = await fetch(`http://localhost:5000/api/user/documents/tamper/${docId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        fetchDocuments()
      } else toast.error(data.message)
    } catch(err) {
      toast.error('Tampering error: ' + err.message)
    } finally {
      setTamperingDoc(null)
    }
  }

  const handleIdentityVerify = async (e) => {
    e.preventDefault()
    if (!identityFiles.aadhar || !identityFiles.pan) return toast.error('Please upload both Aadhar and PAN documents')
    setVerifyingIdentity(true)
    try {
      const formData = new FormData()
      formData.append('aadharFile', identityFiles.aadhar)
      formData.append('panFile', identityFiles.pan)

      const res = await fetch(`http://localhost:5000/api/user/verify-identity`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        const updatedUser = { ...user, isIdentityVerified: true }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        window.location.reload()
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error('Verification failed: ' + err.message)
    } finally {
      setVerifyingIdentity(false)
    }
  }

  if (user && user.isIdentityVerified === false) {
    return (
      <div className="max-w-xl mx-auto mt-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border p-8 shadow-lg ${darkMode ? 'border-amber-700/30 bg-amber-900/10' : 'border-amber-200 bg-amber-50'}`}>
          <h2 className={`text-2xl font-bold flex items-center gap-3 ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
            <Shield className="h-7 w-7" /> Identity Verification Required
          </h2>
          <p className={`mt-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Before you can request or access secure certificates, our AI strictly requires visual identity verification to ensure maximum system integrity.
          </p>
          <p className={`mt-2 font-semibold ${darkMode ? 'text-amber-200' : 'text-amber-800'}`}>
            Please upload clear scans of your registered Aadhar Card and PAN Card.
          </p>
          
          <form onSubmit={handleIdentityVerify} className="mt-8 space-y-6">
            <div>
              <label className={`block mb-2 font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Aadhar Card Scan</label>
              <input type="file" required onChange={e => setIdentityFiles({...identityFiles, aadhar: e.target.files[0]})} className={`w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold ${darkMode ? 'file:bg-amber-900/40 file:text-amber-400 text-slate-300' : 'file:bg-amber-100 file:text-amber-700 text-slate-700'}`} />
            </div>
            <div>
              <label className={`block mb-2 font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>PAN Card Scan</label>
              <input type="file" required onChange={e => setIdentityFiles({...identityFiles, pan: e.target.files[0]})} className={`w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold ${darkMode ? 'file:bg-amber-900/40 file:text-amber-400 text-slate-300' : 'file:bg-amber-100 file:text-amber-700 text-slate-700'}`} />
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              type="submit" 
              disabled={verifyingIdentity}
              className={`w-full py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition ${darkMode ? 'bg-amber-500 hover:bg-amber-400 text-slate-900' : 'bg-amber-600 hover:bg-amber-700 text-white'} disabled:opacity-50`}
            >
              {verifyingIdentity ? <Loader className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
              {verifyingIdentity ? 'Evaluating Identity Models...' : 'Verify My Identity'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border p-6 ${
        darkMode
          ? 'border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900'
          : 'border-slate-200 bg-gradient-to-br from-emerald-50 to-slate-50'
      }`}>
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>My Documents</h2>
        <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>View and manage documents assigned to you by issuers</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`rounded-xl border p-6 ${
        darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
      }`}>
        <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Request a Document</h3>
        <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Request an official document directly from an Issuer. They will verify your identity using your securely stored Aadhar/PAN.</p>
        <form onSubmit={submitRequest} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="email"
              placeholder="Issuer Email"
              value={requestForm.issuerEmail}
              onChange={e => setRequestForm({...requestForm, issuerEmail: e.target.value})}
              className={`flex-1 rounded-lg border px-4 py-2 focus:outline-none transition ${darkMode ? 'border-slate-600 bg-slate-700 text-white focus:border-blue-400' : 'border-slate-300 focus:border-blue-500'}`}
            />
            <input
              type="text"
              placeholder="Document Type (e.g. Transcript)"
              value={requestForm.documentType}
              onChange={e => setRequestForm({...requestForm, documentType: e.target.value})}
              className={`flex-1 rounded-lg border px-4 py-2 focus:outline-none transition ${darkMode ? 'border-slate-600 bg-slate-700 text-white focus:border-blue-400' : 'border-slate-300 focus:border-blue-500'}`}
            />
            <button disabled={requesting} type="submit" className="w-full md:w-auto rounded-lg bg-blue-600 px-8 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-50">
              {requesting ? 'Sending...' : 'Request Document'}
            </button>
          </div>
        </form>

        {requests.length > 0 && (
          <div className="mt-6">
            <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pending & Past Requests</h4>
            <div className="space-y-2">
              {requests.map(req => (
                <div key={req._id} className={`flex items-center justify-between p-3 rounded-lg border ${darkMode ? 'border-slate-700 bg-slate-700/50' : 'border-slate-100 bg-slate-50'}`}>
                  <div>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{req.documentType}</p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>To: {req.issuerEmail}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${req.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {req.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {loading ? (
        <div className="py-12 text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className={`mx-auto h-8 w-8 rounded-full border-4 ${
            darkMode ? 'border-slate-600 border-t-blue-400' : 'border-blue-200 border-t-blue-600'
          }`} />
        </div>
      ) : documents.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-lg border border-dashed py-12 text-center ${
          darkMode
            ? 'border-slate-700 bg-slate-800'
            : 'border-slate-300 bg-slate-50'
        }`}>
          <Clock className={`mx-auto h-12 w-12 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} />
          <p className={`mt-4 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>No documents assigned yet</p>
          <p className={`text-sm mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Issuers will assign documents to your email</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc, idx) => (
            <motion.div
              key={doc._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`rounded-lg border overflow-hidden hover:shadow-md transition ${
                darkMode
                  ? 'border-slate-700 bg-slate-800'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <motion.div
                onClick={() => setExpanded(expanded === doc._id ? null : doc._id)}
                className={`cursor-pointer p-4 transition ${
                  darkMode
                    ? 'hover:bg-slate-700'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className={`font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{doc.name}</p>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{doc.type}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Issued by {doc.issuer}</span>
                    </div>
                  </div>
                  <motion.div animate={{ rotate: expanded === doc._id ? 180 : 0 }} className={darkMode ? 'text-slate-500' : 'text-slate-400'}>
                    {expanded === doc._id ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </motion.div>
                </div>
              </motion.div>

              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: expanded === doc._id ? 'auto' : 0, opacity: expanded === doc._id ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className={`overflow-hidden border-t ${
                  darkMode
                    ? 'border-slate-700 bg-slate-700'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="p-4 space-y-3">
                  <div>
                    <p className={`text-xs uppercase ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Document ID</p>
                    <p className={`font-mono text-sm ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{doc._id}</p>
                  </div>
                  <div>
                    <p className={`text-xs uppercase ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Issued Date</p>
                    <p className={`text-sm ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{new Date(doc.createdAt).toLocaleString()}</p>
                  </div>
                  
                  {doc.content && (
                    <div className={`rounded-lg border p-3 ${
                      darkMode
                        ? 'border-slate-600 bg-slate-600'
                        : 'border-slate-200 bg-white'
                    }`}>
                      <p className={`text-xs uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Document Content</p>
                      <p className={`mt-2 text-sm whitespace-pre-wrap ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{doc.content}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className={`text-xs uppercase ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Current Blockchain Hash</p>
                    <p className={`font-mono text-xs break-all p-2 rounded border ${
                      darkMode
                        ? 'border-slate-600 bg-slate-600 text-slate-200'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}>{doc.hash}</p>
                  </div>
                  <div>
                    <p className={`text-xs uppercase ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Previous Hash (Chain Link)</p>
                    <p className={`font-mono text-xs break-all p-2 rounded border ${
                      darkMode
                        ? 'border-slate-600 bg-slate-600 text-slate-200'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}>
                      {doc.previousHash === '0'.repeat(64) ? (
                        <span className="text-emerald-600 font-semibold">🔗 Genesis (Root Block)</span>
                      ) : (
                        <span>{doc.previousHash.substring(0, 16)}...</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs uppercase ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Issued by</p>
                    <p className={`text-sm ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{doc.issuer}</p>
                  </div>
                  <div>
                    <p className={`text-xs uppercase ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Document Type</p>
                    <p className={`text-sm ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{doc.type}</p>
                  </div>
                  <div className="w-full mt-3 flex flex-col gap-2">
                    {doc.fileUrl && (
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setPreviewEndpoint(`/api/documents/download/${doc.fileUrl.split('/').pop()}`)}
                          className={`flex-1 flex items-center justify-center gap-2 rounded-lg ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} px-4 py-2 text-sm font-semibold text-white transition`}
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => downloadFile(doc.fileUrl)}
                          className={`flex-1 flex items-center justify-center gap-2 rounded-lg ${darkMode ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'} px-4 py-2 text-sm font-semibold text-white transition`}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </motion.button>
                      </div>
                    )}
                    <div className={`mt-2 pt-3 border-t ${darkMode ? 'border-amber-900/50' : 'border-amber-200'} `}>
                      <p className={`text-xs font-bold mb-2 flex items-center gap-1 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                        🚨 Demo: Simulate Physical Overwrite (Tamper)
                      </p>
                      <form onSubmit={(e) => handleTamper(e, doc.docId)} className="flex gap-2 items-center">
                        <input type="file" required className={`flex-1 text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-amber-900/40 file:text-amber-400 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`} />
                        <button type="submit" disabled={tamperingDoc === doc.docId} className={`px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded flex items-center gap-1 disabled:opacity-50`}>
                          {tamperingDoc === doc.docId ? '...' : 'Swap File'}
                        </button>
                      </form>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => downloadDocument(doc)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                    >
                      <Download className="h-4 w-4" />
                      Download Metadata (JSON)
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}

      <DocumentPreviewModal 
        isOpen={!!previewEndpoint} 
        onClose={() => setPreviewEndpoint(null)} 
        apiEndpoint={previewEndpoint} 
        token={token} 
        darkMode={darkMode} 
      />
    </div>
  )
}
