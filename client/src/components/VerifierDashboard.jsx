import { motion } from 'framer-motion'
import { Search, CheckCircle, AlertCircle, Loader, Shield, User } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function VerifierDashboard({ user, token, darkMode = false }) {
  const [searchId, setSearchId] = useState('')
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(null)
  const [issuerInfo, setIssuerInfo] = useState(null)
  const [individualInfo, setIndividualInfo] = useState(null)

  const verifyDocument = async (e) => {
    e.preventDefault()
    if (!searchId.trim()) {
      toast.error('Please enter a document ID')
      return
    }

    setLoading(true)
    setDocument(null)
    setVerified(null)
    setIssuerInfo(null)
    setIndividualInfo(null)

    try {
      const res = await fetch(`http://localhost:5000/api/verify/document/${searchId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setDocument(data.document)
        setIssuerInfo(data.issuer)
        setIndividualInfo(data.individual)
        
        // Use blockchain validation from backend
        const isValid = data.blockchainValid
        setVerified(isValid ? 'valid' : 'invalid')
        
        toast.success(isValid ? '✅ Blockchain verified!' : '❌ Blockchain chain broken!')
      } else {
        setVerified('not-found')
        toast.error('Document not found')
      }
    } catch (err) {
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
          : 'border-slate-200 bg-gradient-to-br from-purple-50 to-slate-50'
      }`}>
        <h2 className={`flex items-center gap-2 text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
          <Shield className="h-7 w-7" />
          Verify Documents
        </h2>
        <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Search and authenticate documents using blockchain verification</p>

        <form onSubmit={verifyDocument} className="mt-6 flex gap-2">
          <input
            type="text"
            placeholder="Enter Document ID (e.g., DOC-1234)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className={`flex-1 rounded-lg border px-4 py-3 transition ${
              darkMode
                ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400 focus:border-purple-400 focus:outline-none'
                : 'border-slate-300 px-4 py-3 focus:border-purple-500 focus:outline-none'
            }`}
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3 font-semibold text-white hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Verify
          </motion.button>
        </form>
      </motion.div>

      {verified && document && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-xl border p-6 ${
            verified === 'valid'
              ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-slate-50'
              : 'border-red-200 bg-gradient-to-br from-red-50 to-slate-50'
          }`}
        >
          <div className="flex items-start gap-4">
            {verified === 'valid' ? (
              <CheckCircle className="h-12 w-12 flex-shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-12 w-12 flex-shrink-0 text-red-600" />
            )}
            <div className="flex-1">
              <h3 className={`text-2xl font-bold ${verified === 'valid' ? 'text-emerald-900' : 'text-red-900'}`}>
                {verified === 'valid' ? '✅ Blockchain Valid' : '⚠️ Blockchain Invalid'}
              </h3>
              <p className={`mt-1 ${verified === 'valid' ? 'text-emerald-700' : 'text-red-700'}`}>
                {verified === 'valid'
                  ? 'This document is part of an unbroken blockchain chain. The hash correctly references the previous document.'
                  : 'This document\'s blockchain chain is broken. The previousHash does not match any valid predecessor in the chain.'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {document && (
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-slate-200 bg-white p-6"
          >
            <h3 className="text-lg font-bold text-slate-900">Document Details</h3>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500 uppercase">Document ID</p>
                <p className="mt-1 font-mono text-sm text-slate-900">{document.docId || document._id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Name</p>
                <p className="mt-1 text-sm text-slate-900">{document.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Type</p>
                <p className="mt-1 text-sm text-slate-900">{document.type}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Issued Date</p>
                <p className="mt-1 text-sm text-slate-900">{new Date(document.createdAt).toLocaleString()}</p>
              </div>
            </div>
            
            {document.content && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 uppercase">Document Content</p>
                <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{document.content}</p>
              </div>
            )}
            
            <div className="mt-4">
              <p className="text-xs text-slate-500 uppercase">Current Blockchain Hash</p>
              <p className="mt-1 font-mono text-xs text-slate-700 break-all bg-slate-50 p-3 rounded-lg">{document.hash}</p>
            </div>
            
            <div className="mt-4">
              <p className="text-xs text-slate-500 uppercase">Previous Hash (Chain Link)</p>
              <p className="mt-1 font-mono text-xs text-slate-700 break-all bg-slate-50 p-3 rounded-lg">
                {document.previousHash === '0'.repeat(64) ? (
                  <span className="text-emerald-600 font-semibold">🔗 Genesis (Root Block)</span>
                ) : (
                  <span>{document.previousHash.substring(0, 16)}...</span>
                )}
              </p>
            </div>
          </motion.div>

          {issuerInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-slate-50 p-6"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Issuer Information</h3>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-slate-600"><span className="font-semibold">Email:</span> {issuerInfo.email}</p>
                <p className="text-sm text-slate-600"><span className="font-semibold">Role:</span> <span className="inline-block rounded-full bg-blue-200 px-3 py-1 text-xs font-bold text-blue-900">Issuer</span></p>
                {document?.metadata?.issuedAt && (
                  <p className="text-sm text-slate-600"><span className="font-semibold">Issue Timestamp:</span> {new Date(document.metadata.issuedAt).toLocaleString()}</p>
                )}
              </div>
            </motion.div>
          )}

          {individualInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-slate-50 p-6"
            >
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">Document Owner Information</h3>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-slate-600"><span className="font-semibold">Email:</span> {individualInfo.email}</p>
                <p className="text-sm text-slate-600"><span className="font-semibold">Role:</span> <span className="inline-block rounded-full bg-emerald-200 px-3 py-1 text-xs font-bold text-emerald-900">Individual</span></p>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {!document && verified === null && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-lg border border-dashed py-12 text-center ${
          darkMode
            ? 'border-slate-700 bg-slate-800'
            : 'border-slate-300 bg-slate-50'
        }`}>
          <Search className={`mx-auto h-12 w-12 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} />
          <p className={`mt-4 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>No document searched yet</p>
          <p className={`text-sm mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Enter a document ID above to verify its authenticity</p>
        </motion.div>
      )}
    </div>
  )
}
