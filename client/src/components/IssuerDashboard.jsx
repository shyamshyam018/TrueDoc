import { motion } from 'framer-motion'
import { Plus, Copy, Check, FileText, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export default function IssuerDashboard({ user, token, darkMode = false }) {
  const [documents, setDocuments] = useState([])
  const [form, setForm] = useState({ name: '', type: '', recipientEmail: '', content: '' })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

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

  const issueDocument = async (e) => {
    e.preventDefault()
    if (!form.name || !form.type || !form.recipientEmail) {
      toast.error('Please fill all required fields')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/issuer/document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          owner: form.recipientEmail,
          content: form.content,
          metadata: { issuerEmail: user.email, issuedAt: new Date().toISOString() }
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setDocuments(prev => [data.document, ...prev])
        setForm({ name: '', type: '', recipientEmail: '', content: '' })
        toast.success('🎉 Document issued successfully!')
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
        <div className="flex items-center justify-between">
          <h3 className={`flex items-center gap-2 text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            <FileText className="h-6 w-6" />
            Issued Documents ({documents.length})
          </h3>
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={fetchDocuments}
            disabled={fetching}
            className={`p-2 rounded-lg disabled:opacity-50 transition ${
              darkMode
                ? 'hover:bg-slate-800'
                : 'hover:bg-slate-100'
            }`}
          >
            <RefreshCw className={`h-5 w-5 ${fetching ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
        
        <div className="mt-6 space-y-3">
          {documents.length === 0 && !fetching ? (
            <p className={`py-8 text-center ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>No documents issued yet. Create your first document above.</p>
          ) : (
            documents.map((doc, idx) => (
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
                      <p className={darkMode ? 'text-slate-500' : 'text-slate-500'}>⛓️ Blockchain Hash:</p>
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
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}
