import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function AuthPages({ page, setPage, darkMode, onAuth }) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('individual')
  const [loading, setLoading] = useState(false)

  const isLogin = page === 'login'

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password || (!isLogin && !name)) {
      toast.error('Please fill all fields')
      return
    }

    setLoading(true)
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const body = isLogin
        ? { email, password }
        : { name, email, password, role }

      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (res.ok) {
        onAuth(data.token, data.user)
        toast.success(`Welcome back, ${data.user.name}! ✨`)
      } else {
        toast.error(data.message || 'Authentication failed')
      }
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-6 ${
      darkMode
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    }`}>
      {/* Background blur elements */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 20% 50%, ${darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)'} 0%, transparent 50%),
                          radial-gradient(circle at 80% 80%, ${darkMode ? 'rgba(147, 51, 234, 0.1)' : 'rgba(147, 51, 234, 0.15)'} 0%, transparent 50%)`
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative w-full max-w-md rounded-2xl border backdrop-blur shadow-2xl ${
          darkMode
            ? 'border-slate-700 bg-slate-900/80'
            : 'border-white/20 bg-white/80'
        }`}
      >
        {/* Header */}
        <div className={`px-8 py-6 border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-3xl font-black bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent text-center"
          >
            DocuVerify
          </motion.h1>
          <p className={`text-center text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {/* Name field (Register only) */}
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className={`w-full rounded-lg px-4 py-3 border transition ${
                  darkMode
                    ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500'
                    : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-400'
                } focus:outline-none`}
              />
            </motion.div>
          )}

          {/* Email field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: isLogin ? 0 : 0.1 }}
            className="relative"
          >
            <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Email Address
            </label>
            <div className={`flex items-center rounded-lg border px-4 py-3 transition ${
              darkMode
                ? 'border-slate-600 bg-slate-800'
                : 'border-slate-200 bg-white'
            }`}>
              <Mail className="h-5 w-5 text-slate-400 mr-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`flex-1 bg-transparent outline-none ${darkMode ? 'text-slate-100 placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
              />
            </div>
          </motion.div>

          {/* Password field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: isLogin ? 0.1 : 0.2 }}
            className="relative"
          >
            <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Password
            </label>
            <div className={`flex items-center rounded-lg border px-4 py-3 transition ${
              darkMode
                ? 'border-slate-600 bg-slate-800'
                : 'border-slate-200 bg-white'
            }`}>
              <Lock className="h-5 w-5 text-slate-400 mr-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`flex-1 bg-transparent outline-none ${darkMode ? 'text-slate-100 placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </motion.div>

          {/* Role selector (Register only) */}
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={`w-full rounded-lg px-4 py-3 border transition ${
                  darkMode
                    ? 'border-slate-600 bg-slate-800 text-slate-100 focus:border-blue-500'
                    : 'border-slate-200 bg-white text-slate-900 focus:border-blue-400'
                } focus:outline-none`}
              >
                <option value="issuer">Issuer (Issue Documents)</option>
                <option value="individual">Individual (Receive Documents)</option>
                <option value="verifier">Verifier (Verify Documents)</option>
              </select>
              <p className={`text-xs mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                Choose your role to match your account type
              </p>
            </motion.div>
          )}

          {/* Submit button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: isLogin ? 0.2 : 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full mt-6 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 font-bold text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition shadow-lg"
          >
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
          </motion.button>

          {/* Toggle auth mode */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: isLogin ? 0.3 : 0.5 }}
            className={`text-center text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}
          >
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setEmail('')
                setPassword('')
                setName('')
                setRole('individual')
                setPage(isLogin ? 'register' : 'login')
              }}
              className="font-semibold text-blue-500 hover:text-blue-600"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </motion.div>
        </form>

        {/* Back button */}
        <button
          onClick={() => setPage('landing')}
          className={`absolute top-4 left-4 px-3 py-1 rounded-lg text-sm font-semibold transition ${
            darkMode
              ? 'text-slate-400 hover:bg-slate-800'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          ← Back
        </button>
      </motion.div>
    </div>
  )
}
