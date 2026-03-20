import { motion } from 'framer-motion'
import { Loader } from 'lucide-react'

export default function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity }}
        className="rounded-xl border border-blue-300 bg-white p-8 shadow-xl"
      >
        <Loader className="h-12 w-12 animate-spin text-blue-600" />
        <p className="mt-4 font-semibold text-slate-700">Processing...</p>
      </motion.div>
    </motion.div>
  )
}
