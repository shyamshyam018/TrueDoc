import { motion } from 'framer-motion'
import { Plus, Copy, Check, FileText, RefreshCw, Eye } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import DocumentPreviewModal from './DocumentPreviewModal'

export default function IssuerDashboard({ user, token, darkMode = false }) {
  const [documents, setDocuments] = useState([])
  const [requests, setRequests] = useState([])
  const [form, setForm] = useState({ name: '', type: '', recipientEmail: '', content: '', file: null, requestId: null })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [copied, setCopied] = useState(null)
  const [previewEndpoint, setPreviewEndpoint] = useState(null)
  const [groupBy, setGroupBy] = useState('none')

  useEffect(() => {
    fetchDocuments()
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/issuer/requests', {
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

  const fetchDocuments = async () => {
    setFetching(true)
    try {
      const res = await fetch('http://localhost:5000/api/issuer/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
      } else {
        toast.error('Failed to fetch documents')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      toast.error('Error fetching documents: ' + err.message)
    } finally {
      setFetching(false)
    }
  }

  const downloadFile = async (fileUrl, isRequestAttachment = false) => {
    try {
      const filename = fileUrl.split('/').pop();
      const endpoint = isRequestAttachment ? `/api/requests/download/${filename}` : `/api/documents/download/${filename}`;
      const res = await fetch(`http://localhost:5000${endpoint}`, {
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

  const issueDocument = async (e) => {
    e.preventDefault()
    if (!form.name || !form.type || !form.recipientEmail) {
      toast.error('Please fill all required fields')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('type', form.type)
      formData.append('owner', form.recipientEmail)
      formData.append('content', form.content)
      formData.append('metadata', JSON.stringify({ issuerEmail: user.email, issuedAt: new Date().toISOString() }))
      if (form.file) formData.append('file', form.file)
      if (form.requestId) formData.append('requestId', form.requestId)

      const res = await fetch('http://localhost:5000/api/issuer/document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setDocuments(prev => [data.document, ...prev])
        setForm({ name: '', type: '', recipientEmail: '', content: '', file: null, requestId: null })
        toast.success('🎉 Document issued successfully!')
        fetchRequests()
      } else {
        toast.error(data.message || 'Failed to issue document')
      }
    } catch (err) {
      console.error('Issue error:', err)
      toast.error('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {requests.filter(req => req.status === 'pending').length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border p-6 ${darkMode ? 'border-amber-700/30 bg-amber-900/10' : 'border-amber-200 bg-amber-50'}`}>
          <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-amber-400' : 'text-amber-800'}`}>Pending Document Requests</h3>
          <div className="space-y-3">
            {requests.filter(req => req.status === 'pending').map(req => (
              <div key={req._id} className={`flex items-center justify-between p-4 rounded-lg border ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                <div>
                  <p className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{req.documentType}</p>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>From: {req.individualEmail}</p>
                </div>
                <button
                  onClick={() => {
                    setForm({ ...form, type: req.documentType, recipientEmail: req.individualEmail, requestId: req._id })
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Fulfill Request
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border p-6 ${
        darkMode
          ? 'border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900'
          : 'border-slate-200 bg-gradient-to-br from-blue-50 to-slate-50'
      }`}>
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Issue New Document</h2>
        <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Create and assign tamper-proof documents to users</p>

        <form onSubmit={issueDocument} className="mt-6 space-y-4">
          <input
            type="text"
            placeholder="Document Name (e.g., Degree Certificate)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={`w-full rounded-lg border px-4 py-3 focus:outline-none transition ${
              darkMode
                ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-400'
                : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:border-blue-500'
            }`}
          />
          <input
            type="text"
            placeholder="Document Type (e.g., Academic)"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className={`w-full rounded-lg border px-4 py-3 focus:outline-none transition ${
              darkMode
                ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-400'
                : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:border-blue-500'
            }`}
          />
          <input
            type="email"
            placeholder="Recipient Email"
            value={form.recipientEmail}
            onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
            className={`w-full rounded-lg border px-4 py-3 focus:outline-none transition ${
              darkMode
                ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-400'
                : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:border-blue-500'
            }`}
          />
          <textarea
            placeholder="Document Content (optional)"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows="4"
            className={`w-full rounded-lg border px-4 py-3 focus:outline-none transition ${
              darkMode
                ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-400'
                : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:border-blue-500'
            }`}
          />
          <input
            type="file"
            onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
            className={`w-full rounded-lg border px-4 py-3 focus:outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 ${
              darkMode
                ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-blue-400'
                : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500'
            }`}
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 py-3 font-semibold text-white hover:from-blue-500 hover:to-blue-600 disabled:opacity-50"
          >
            {loading ? 'Issuing...' : '✨ Issue Document'}
          </motion.button>
        </form>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`rounded-xl border p-6 ${
        darkMode
          ? 'border-slate-700 bg-slate-900'
          : 'border-slate-200 bg-white'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className={`flex items-center gap-2 text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            <FileText className="h-6 w-6" />
            Issued Documents ({documents.length})
          </h3>
          <div className="flex items-center gap-3">
            <select
              value={groupBy}
              onChange={e => setGroupBy(e.target.value)}
              className={`rounded-lg border px-3 py-2 text-sm focus:outline-none transition ${
                darkMode ? 'border-slate-600 bg-slate-800 text-slate-200' : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              <option value="none">Group By: None</option>
              <option value="owner">Group By: Individual</option>
              <option value="type">Group By: Document Type</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={fetchDocuments}
              disabled={fetching}
              className={`p-2 rounded-lg disabled:opacity-50 transition ${
                darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
              }`}
            >
              <RefreshCw className={`h-5 w-5 ${fetching ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
        
        <div className="mt-6 space-y-3">
          {documents.length === 0 && !fetching ? (
            <p className={`py-8 text-center ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>No documents issued yet. Create your first document above.</p>
          ) : (
            Object.entries(
              groupBy === 'none' ? { 'All Documents': documents } :
              documents.reduce((acc, doc) => {
                const key = groupBy === 'owner' ? doc.owner : doc.type;
                (acc[key] = acc[key] || []).push(doc);
                return acc;
              }, {})
            ).map(([groupName, groupDocs]) => (
              <div key={groupName} className="mb-6 space-y-3">
                {groupBy !== 'none' && (
                  <h4 className={`text-sm font-black uppercase tracking-wider ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{groupName}</h4>
                )}
                {groupDocs.map((doc, idx) => (
                  <motion.div
                    key={doc._id || doc.docId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`rounded-lg border p-4 transition hover:shadow-md ${
                      darkMode
                        ? 'border-slate-700 bg-gradient-to-r from-slate-800 to-slate-700'
                        : 'border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{doc.docId}</p>
                        <p className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{doc.name}</p>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{doc.type} → {doc.owner}</p>
                        <div className="mt-3 space-y-1 text-xs">
                          {doc.fileUrl && (
                            <div className="flex gap-4">
                              <button
                                onClick={(e) => { e.stopPropagation(); setPreviewEndpoint(`/api/documents/download/${doc.fileUrl.split('/').pop()}`); }}
                                className={`flex items-center gap-1 font-semibold ${darkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}
                              >
                                <Eye className="h-4 w-4" /> Preview
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); downloadFile(doc.fileUrl); }}
                                className={`flex items-center gap-1 font-semibold ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                              >
                                📎 Download
                              </button>
                            </div>
                          )}
                          <p className={`mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>⛓️ Blockchain Hash:</p>
                          <p className={`font-mono break-all ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{doc.hash}</p>
                          <p className={`mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>🔗 Previous Hash: {doc.previousHash === '0'.repeat(64) ? '🔗 Genesis (Root)' : doc.previousHash.slice(0, 16) + '...'}</p>
                          <p className={`mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>📅 {new Date(doc.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={() => {
                          navigator.clipboard.writeText(doc.hash)
                          setCopied(doc._id)
                          toast.success('Hash copied!')
                          setTimeout(() => setCopied(null), 2000)
                        }}
                        className={`flex-shrink-0 p-2 rounded-lg transition ${
                          darkMode
                            ? 'hover:bg-slate-600'
                            : 'hover:bg-slate-200'
                        }`}
                      >
                        {copied === doc._id ? <Check className="h-5 w-5 text-green-600" /> : <Copy className={`h-5 w-5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))
          )}
        </div>
      </motion.div>

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
