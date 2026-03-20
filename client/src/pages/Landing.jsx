import { motion } from 'framer-motion'
import { Shield, Lock, CheckCircle, ArrowRight, Zap, Globe } from 'lucide-react'

export default function Landing({ setPage, darkMode, setDarkMode }) {
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-50' : 'bg-white text-slate-900'}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 border-b backdrop-blur ${
        darkMode
          ? 'border-slate-800 bg-slate-950/95'
          : 'border-slate-200 bg-white/95'
      }`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-black bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"
          >
            DocuVerify
          </motion.h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                darkMode
                  ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setPage('login')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                darkMode
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Login
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage('register')}
              className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2 font-semibold text-white hover:from-blue-600 hover:to-blue-700 shadow-lg"
            >
              Sign Up
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`relative overflow-hidden px-6 py-24 ${
        darkMode
          ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900'
          : 'bg-gradient-to-br from-blue-50 via-purple-50 to-slate-50'
      }`}>
        <div className="pointer-events-none absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, ${darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)'} 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, ${darkMode ? 'rgba(147, 51, 234, 0.1)' : 'rgba(147, 51, 234, 0.2)'} 0%, transparent 50%)`
        }} />

        <div className="relative mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block rounded-full bg-blue-500/10 px-4 py-2 mb-4">
              <span className="text-sm font-semibold text-blue-400">🔐 Blockchain-Powered Security</span>
            </div>
            <h2 className="text-6xl font-black leading-tight mb-4">
              Secure Document <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Verification</span>
            </h2>
            <p className={`text-xl mb-8 max-w-2xl mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Tamper-proof credentials issued, verified and audited in seconds using advanced blockchain technology.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex gap-4 justify-center mb-12"
          >
            <button
              onClick={() => setPage('register')}
              className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-4 font-bold text-white hover:from-blue-600 hover:to-blue-700 shadow-xl hover:shadow-2xl transition flex items-center gap-2"
            >
              Get Started Free <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => setPage('login')}
              className={`rounded-lg px-8 py-4 font-bold transition ${
                darkMode
                  ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              }`}
            >
              Sign In
            </button>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              { icon: Shield, title: 'Tamper-Proof', desc: 'Blockchain technology ensures documents cannot be altered' },
              { icon: Lock, title: 'Secure Chain', desc: 'Each document links to the previous in an unbreakable chain' },
              { icon: Zap, title: 'Instant Verify', desc: 'Verify document authenticity in seconds' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className={`rounded-xl p-6 border backdrop-blur ${
                  darkMode
                    ? 'border-slate-700 bg-slate-800/50'
                    : 'border-slate-200 bg-white/50'
                }`}
              >
                <feature.icon className="h-10 w-10 mb-3 text-blue-500 mx-auto" />
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`px-6 py-24 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="mx-auto max-w-5xl">
          <h3 className="text-4xl font-black text-center mb-12">Why Choose DocuVerify?</h3>

          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Issuers Issue Documents',
                desc: 'Organizations create secure, timestamped documents with blockchain hashing. Each document is cryptographically linked to the previous one, creating an immutable chain.',
              },
              {
                step: '2',
                title: 'Individuals Receive & View',
                desc: 'Users receive documents assigned to their email. They can view, download, and store documents with complete chain information.',
              },
              {
                step: '3',
                title: 'Verifiers Authenticate',
                desc: 'Third-party verifiers can search and authenticate any document, checking the entire blockchain chain for tampering.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className={`flex gap-6 p-6 rounded-xl border ${
                  darkMode
                    ? 'border-slate-700 bg-slate-800/30'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-blue-500">
                  <span className="text-xl font-bold text-white">{item.step}</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                  <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`px-6 py-24 ${darkMode ? 'bg-slate-950' : 'bg-white'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mx-auto max-w-4xl rounded-2xl p-12 text-center border ${
            darkMode
              ? 'border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900'
              : 'border-slate-200 bg-gradient-to-br from-blue-50 to-purple-50'
          }`}
        >
          <h3 className="text-4xl font-black mb-4">Ready to Secure Your Documents?</h3>
          <p className={`text-lg mb-8 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Join thousands of organizations using DocuVerify for secure document management
          </p>
          <button
            onClick={() => setPage('register')}
            className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-10 py-4 font-bold text-white hover:from-blue-600 hover:to-blue-700 shadow-xl transition inline-flex items-center gap-2"
          >
            Start Free Trial <ArrowRight className="h-5 w-5" />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className={`px-6 py-8 border-t ${
        darkMode
          ? 'border-slate-800 bg-slate-950 text-slate-400'
          : 'border-slate-200 bg-slate-50 text-slate-600'
      }`}>
        <div className="mx-auto max-w-7xl text-center">
          <p>&copy; 2026 DocuVerify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
