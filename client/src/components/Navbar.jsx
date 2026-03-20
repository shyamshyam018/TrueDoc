import { motion } from 'framer-motion'
import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar({ user, onLogout }) {
  const [open, setOpen] = useState(false)

  if (!user) {
    return null
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold text-blue-600">DocuVerify</h1>
        
        <div className="hidden items-center gap-4 md:flex">
          <span className="text-sm text-slate-600">{user.email}</span>
          <motion.span
            whileHover={{ scale: 1.05 }}
            className="rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 capitalize"
          >
            {user.role}
          </motion.span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </motion.button>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-t border-slate-200 bg-slate-50 px-6 py-4 md:hidden"
        >
          <div className="space-y-2">
            <p className="text-sm text-slate-600">{user.email}</p>
            <span className="block rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 capitalize">{user.role}</span>
            <button onClick={onLogout} className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100">
              Logout
            </button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
