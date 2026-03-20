import { motion } from 'framer-motion'
import { Download, Eye, EyeOff, Clock, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export default function IndividualDashboard({ user, token, darkMode = false }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

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
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => downloadDocument(doc)}
                    className="w-full mt-3 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4" />
                    Download Document
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
