import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useStore } from '../store'

export function Toasts() {
  const { toasts, dismissToast } = useStore()
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} layout className="toast" initial={{ y: 30, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.9 }}>
            <span>{t.message}</span>
            {t.undo && (
              <button type="button" className="toast-undo" onClick={() => { t.undo?.(); dismissToast(t.id) }}>
                Undo
              </button>
            )}
            <button type="button" className="toast-close" onClick={() => dismissToast(t.id)} aria-label="Dismiss">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
