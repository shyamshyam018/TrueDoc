import { motion } from 'framer-motion'
import { Search, CheckCircle, AlertCircle, Loader, Shield, User, Users, FileText, Info } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export default function VerifierDashboard({ user, token, darkMode = false }) {
  const [activeTab, setActiveTab] = useState('verify')
  const [directory, setDirectory] = useState({ issuers: [], individuals: [], allDocuments: [] })
  const [loadingDir, setLoadingDir] = useState(false)

  const [searchId, setSearchId] = useState('')
  const [file, setFile] = useState(null)
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(null)
  const [issuerInfo, setIssuerInfo] = useState(null)
  const [individualInfo, setIndividualInfo] = useState(null)
  const [aiResult, setAiResult] = useState(null)

  useEffect(() => {
    if (activeTab === 'directory') fetchDirectory()
  }, [activeTab])

  const fetchDirectory = async () => {
    setLoadingDir(true)
    try {
      const res = await fetch('http://localhost:5000/api/verifier/directory', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setDirectory(data)
      } else toast.error('Failed to load directory')
    } catch(err) {
      toast.error('Failed to load directory')
    } finally {
      setLoadingDir(false)
    }
  }

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
    setAiResult(null)

    try {
      const formData = new FormData()
      formData.append('docId', searchId)
      if (file) formData.append('file', file)

      const res = await fetch(`http://localhost:5000/api/verifier`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setDocument(data.document)
        setIssuerInfo(data.issuer)
        setIndividualInfo(data.individual)
        setAiResult(data.aiResult || null)
        
        // Use blockchain validation from backend
        const isValid = data.blockchainValid
        setVerified(isValid ? 'valid' : 'invalid')
        
        if (!isValid) {
          toast.error(data.hashMismatchReason || '❌ Blockchain chain logically broken!')
        } else {
          toast.success('✅ Verification complete!')
        }
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
      <div className={`flex gap-6 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        <button onClick={() => setActiveTab('verify')} className={`pb-3 font-semibold transition ${activeTab === 'verify' ? 'border-b-2 border-purple-600 text-purple-600' : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
          Verify Document
        </button>
        <button onClick={() => setActiveTab('directory')} className={`pb-3 font-semibold transition ${activeTab === 'directory' ? 'border-b-2 border-purple-600 text-purple-600' : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
          Network Directory
        </button>
      </div>

      {activeTab === 'directory' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className={`rounded-xl border p-6 ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <h2 className={`flex items-center gap-2 text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              <Shield className="h-6 w-6 text-purple-500" />
              Registered Issuers
            </h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {loadingDir ? <Loader className="animate-spin text-purple-500" /> : directory.issuers.map(i => (
                <div key={i._id} className={`p-4 rounded-lg border ${darkMode ? 'border-slate-600 bg-slate-700/50' : 'border-slate-100 bg-slate-50'}`}>
                  <p className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{i.name}</p>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{i.email}</p>
                  <p className="mt-2 text-xs font-semibold text-purple-600 bg-purple-100 dark:bg-purple-900/30 inline-block px-2 py-1 rounded">
                    {i.documentsIssued} Documents Issued
                  </p>
                </div>
              ))}
              {directory.issuers.length === 0 && !loadingDir && <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>No issuers found.</p>}
            </div>
          </div>
          
          <div className={`rounded-xl border p-6 ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <h2 className={`flex items-center gap-2 text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              <Users className="h-6 w-6 text-emerald-500" />
              Registered Individuals
            </h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {loadingDir ? <Loader className="animate-spin text-emerald-500" /> : directory.individuals.map(i => (
                <div key={i._id} className={`p-4 rounded-lg border ${darkMode ? 'border-slate-600 bg-slate-700/50' : 'border-slate-100 bg-slate-50'}`}>
                  <p className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{i.name}</p>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{i.email}</p>
                  <p className="mt-2 text-xs font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 inline-block px-2 py-1 rounded">
                    {i.documentsOwned} Verified Assets
                  </p>
                </div>
              ))}
              {directory.individuals.length === 0 && !loadingDir && <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>No individuals found.</p>}
            </div>
          </div>
          <div className={`rounded-xl border p-6 ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <h2 className={`flex items-center gap-2 text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              <FileText className="h-6 w-6 text-blue-500" />
              Global Document Ledger
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              {loadingDir ? <Loader className="animate-spin text-blue-500" /> : directory.allDocuments?.map(doc => (
                <div key={doc._id} className={`flex items-center justify-between p-4 rounded-lg border ${darkMode ? 'border-slate-600 bg-slate-700/50' : 'border-slate-100 bg-slate-50'}`}>
                  <div>
                    <p className={`font-mono text-xs mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>ID: {doc.docId}</p>
                    <p className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{doc.name}</p>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{doc.type}</p>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Issued by: {doc.issuer}</p>
                  </div>
                  <button 
                    onClick={() => {
                       setSearchId(doc.docId)
                       setActiveTab('verify')
                       window.scrollTo({ top: 0, behavior: 'smooth' })
                    }} 
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition"
                  >
                    Verify Hash
                  </button>
                </div>
              ))}
              {(!directory.allDocuments || directory.allDocuments.length === 0) && !loadingDir && <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>No documents registered yet.</p>}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'verify' && (
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

        <form onSubmit={verifyDocument} className="mt-6 flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter Document ID (e.g., DOC-1234)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className={`w-full rounded-lg border px-4 py-3 transition ${
              darkMode
                ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400 focus:border-purple-400 focus:outline-none'
                : 'border-slate-300 px-4 py-3 focus:border-purple-500 focus:outline-none'
            }`}
          />
          
          <div className="flex gap-2 items-center mt-2">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className={`flex-1 rounded-lg border px-4 py-2 transition file:mr-4 file:rounded-full file:border-0 file:bg-purple-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-purple-700 hover:file:bg-purple-100 ${
                darkMode
                  ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-purple-400'
                  : 'border-slate-300 bg-white text-slate-900 focus:border-purple-500'
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
              Verify Status
            </motion.button>
          </div>
        </form>
      </motion.div>

      {verified && document && (
        <div className="space-y-4">
          {!aiResult && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`rounded-xl border p-4 ${darkMode ? 'border-indigo-800 bg-indigo-900/30' : 'border-indigo-200 bg-indigo-50'}`}>
              <div className="flex items-start gap-3">
                <Info className={`h-6 w-6 flex-shrink-0 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <div>
                  <h4 className={`font-semibold ${darkMode ? 'text-indigo-200' : 'text-indigo-900'}`}>Pure Blockchain Verification</h4>
                  <p className={`text-sm ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Since no physical file was uploaded AND the document record was issued without an attached file, the system solely verified the mathematical integrity of the cryptographic chain. To trigger the visual AI checks, upload a supplementary document.</p>
                </div>
              </div>
            </motion.div>
          )}
          {aiResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-xl border p-6 ${
                aiResult.isValid
                  ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-slate-50'
                  : 'border-amber-200 bg-gradient-to-br from-amber-50 to-slate-50'
              }`}
            >
              <div className="flex items-start gap-4">
                {aiResult.isValid ? (
                  <CheckCircle className="h-10 w-10 flex-shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-10 w-10 flex-shrink-0 text-amber-600" />
                )}
                <div className="flex-1">
                  <h3 className={`text-xl font-bold ${aiResult.isValid ? 'text-emerald-900' : 'text-amber-900'}`}>
                    {aiResult.isValid ? '🤖 AI Extracted Matches Record' : '⚠️ AI Found Deviations'}
                  </h3>
                  <p className={`mt-1 text-sm ${aiResult.isValid ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {aiResult.message}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-xl border p-6 ${
              verified === 'valid'
                ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-slate-50'
                : 'border-red-200 bg-gradient-to-br from-red-50 to-slate-50'
            }`}
          >
            <div className="flex items-start gap-4">
              {verified === 'valid' ? (
                <Shield className="h-10 w-10 flex-shrink-0 text-blue-600" />
              ) : (
                <AlertCircle className="h-10 w-10 flex-shrink-0 text-red-600" />
              )}
              <div className="flex-1">
                <h3 className={`text-xl font-bold ${verified === 'valid' ? 'text-blue-900' : 'text-red-900'}`}>
                  {verified === 'valid' ? '⛓️ Blockchain Integrity Verified' : '❌ Blockchain Invalid'}
                </h3>
                <p className={`mt-1 text-sm ${verified === 'valid' ? 'text-blue-700' : 'text-red-700'}`}>
                  {verified === 'valid'
                    ? 'This document is part of an unbroken blockchain chain. The cryptographic hash matches.'
                    : 'This document\'s blockchain chain is broken. Verification failed.'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
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
      )}
    </div>
  )
}
