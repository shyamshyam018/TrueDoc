import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import Landing from './pages/Landing'
import AuthPages from './pages/AuthPages'
import DashboardLayout from './components/DashboardLayout'

export default function App() {
  const [page, setPage] = useState('landing')
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true'
    }
    return true
  })

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  // Check for saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      setPage('dashboard')
    }
  }, [])

  const handleAuth = (newToken, newUser) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setPage('dashboard')
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setPage('landing')
  }

  return (
    <div className={`transition-colors ${darkMode ? 'dark' : ''}`}>
      <Toaster position="top-right" />

      {!token ? (
        <>
          {page === 'landing' && (
            <Landing setPage={setPage} darkMode={darkMode} setDarkMode={setDarkMode} />
          )}
          {(page === 'login' || page === 'register') && (
            <AuthPages
              page={page}
              setPage={setPage}
              darkMode={darkMode}
              onAuth={handleAuth}
            />
          )}
        </>
      ) : (
        <DashboardLayout
          user={user}
          token={token}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onLogout={handleLogout}
        />
      )}
    </div>
  )
}

