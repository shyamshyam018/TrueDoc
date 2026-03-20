import { motion } from 'framer-motion'
import { Menu, X, LogOut, Home, FileText, CheckCircle, Settings, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import IssuerDashboard from '../components/IssuerDashboard'
import IndividualDashboard from '../components/IndividualDashboard'
import VerifierDashboard from '../components/VerifierDashboard'

export default function DashboardLayout({ user, token, darkMode, setDarkMode, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('home')

  const roleIcon = {
    issuer: '📋',
    individual: '👤',
    verifier: '✅',
  }

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    ...(user.role === 'issuer' ? [{ id: 'issue', label: 'Issue Document', icon: FileText }] : []),
    ...(user.role === 'individual' ? [{ id: 'documents', label: 'My Documents', icon: FileText }] : []),
    ...(user.role === 'verifier' ? [{ id: 'verify', label: 'Verify Document', icon: CheckCircle }] : []),
  ]

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 280 : 80 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed left-0 top-0 h-screen border-r overflow-hidden z-40 ${
          darkMode
            ? 'border-slate-800 bg-slate-900'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div className={`p-4 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <motion.h1
              animate={{ opacity: sidebarOpen ? 1 : 0 }}
              className="text-2xl font-black bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"
            >
              DocuVerify
            </motion.h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg transition ${
                darkMode
                  ? 'hover:bg-slate-800'
                  : 'hover:bg-slate-100'
              }`}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className={`p-4 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <motion.div
            animate={{ opacity: sidebarOpen ? 1 : 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              {sidebarOpen && (
                <div>
                  <p className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    {user.name}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                    {roleIcon[user.role]} {user.role}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === item.id
                  ? darkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-900'
                  : darkMode
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <motion.span
                animate={{ opacity: sidebarOpen ? 1 : 0 }}
                className="font-semibold text-sm"
              >
                {item.label}
              </motion.span>
            </motion.button>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className={`border-t p-4 space-y-2 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <motion.button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              darkMode
                ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <motion.span
              animate={{ opacity: sidebarOpen ? 1 : 0 }}
              className="font-semibold text-sm"
            >
              {darkMode ? 'Light' : 'Dark'}
            </motion.span>
          </motion.button>

          <motion.button
            onClick={() => {
              onLogout()
              toast.success('Logged out successfully!')
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              darkMode
                ? 'text-red-400 hover:bg-red-600/20 hover:text-red-300'
                : 'text-red-600 hover:bg-red-100'
            }`}
          >
            <LogOut className="h-5 w-5" />
            <motion.span
              animate={{ opacity: sidebarOpen ? 1 : 0 }}
              className="font-semibold text-sm"
            >
              Logout
            </motion.span>
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main
        style={{ marginLeft: sidebarOpen ? 280 : 80 }}
        className={`flex-1 transition-all duration-300 overflow-auto`}
      >
        {/* Top Bar */}
        <div className={`sticky top-0 z-30 border-b backdrop-blur ${
          darkMode
            ? 'border-slate-800 bg-slate-900/80'
            : 'border-slate-200 bg-white/80'
        }`}>
          <div className="flex items-center justify-between px-6 py-4">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-bold"
            >
              {activeTab === 'home' && 'Dashboard'}
              {activeTab === 'issue' && 'Issue Document'}
              {activeTab === 'documents' && 'My Documents'}
              {activeTab === 'verify' && 'Verify Document'}
            </motion.h2>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg lg:hidden ${
                darkMode
                  ? 'hover:bg-slate-800'
                  : 'hover:bg-slate-100'
              }`}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 ${darkMode ? 'text-slate-50' : 'text-slate-900'}`}
        >
          {activeTab === 'home' && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-xl border p-8 ${
                  darkMode
                    ? 'border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900'
                    : 'border-slate-200 bg-gradient-to-br from-blue-50 to-purple-50'
                }`}
              >
                <h3 className="text-3xl font-bold mb-2">Welcome, {user.name}! 👋</h3>
                <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  You're logged in as <span className="font-semibold">{roleIcon[user.role]} {user.role}</span>
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {[
                  { title: 'Secure & Tamper-Proof', desc: 'All documents are blockchain-verified' },
                  { title: 'Real-Time Verification', desc: 'Instant authentication of documents' },
                  { title: 'Complete Transparency', desc: 'Full audit trail of all transactions' },
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className={`rounded-xl border p-6 ${
                      darkMode
                        ? 'border-slate-700 bg-slate-800/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <h4 className="font-bold text-lg mb-2">{feature.title}</h4>
                    <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>{feature.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {activeTab === 'issue' && <IssuerDashboard user={user} token={token} darkMode={darkMode} />}
          {activeTab === 'documents' && <IndividualDashboard user={user} token={token} darkMode={darkMode} />}
          {activeTab === 'verify' && <VerifierDashboard user={user} token={token} darkMode={darkMode} />}
        </motion.div>
      </main>
    </div>
  )
}
