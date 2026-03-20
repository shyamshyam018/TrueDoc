import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DocumentPreviewModal({ isOpen, onClose, apiEndpoint, token, darkMode }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !apiEndpoint) return;
    
    let isMounted = true;
    setLoading(true);
    setError(null);
    
    const fetchFile = async () => {
      try {
        const res = await fetch(`http://localhost:5000${apiEndpoint}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load document (Unauthorized or Not Found)');
        
        const blob = await res.blob();
        if (isMounted) {
          setBlobUrl(URL.createObjectURL(blob));
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
          toast.error('Preview failed to load');
        }
      }
    };

    fetchFile();

    return () => {
      isMounted = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [isOpen, apiEndpoint, token]);

  if (!isOpen) return null;

  const isPdf = apiEndpoint.toLowerCase().endsWith('.pdf');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border shadow-2xl ${
            darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
          }`}
        >
          <div className={`flex items-center justify-between border-b p-4 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
            <h3 className={`font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Secure Document Preview</h3>
            <button
              onClick={onClose}
              className={`rounded-lg p-2 transition ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 bg-slate-950 p-4 flex items-center justify-center overflow-auto relative rounded-b-xl">
            {loading && <Loader className="h-8 w-8 animate-spin text-blue-500" />}
            {error && <p className="text-red-400 font-semibold">{error}</p>}
            {!loading && !error && blobUrl && (
              isPdf ? (
                <iframe src={`${blobUrl}#toolbar=0`} className="h-full w-full rounded bg-white shadow-inner" title="PDF Preview" />
              ) : (
                <img src={blobUrl} alt="Document Preview" className="max-h-full max-w-full rounded object-contain shadow-2xl" />
              )
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
