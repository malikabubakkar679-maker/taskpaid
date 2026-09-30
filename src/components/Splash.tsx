import { motion } from 'framer-motion'
import { useEffect } from 'react'

const TITLE = 'Taskpad'

export function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const id = window.setTimeout(onDone, 2900)
    return () => window.clearTimeout(id)
  }, [onDone])

  return (
    <motion.div
      className="splash"
      onClick={onDone}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      role="status"
      aria-label="Loading Taskpad"
    >
      <div className="splash-paper" aria-hidden />
      <motion.div
        className="splash-logo"
        initial={{ y: 30, opacity: 0, rotate: -6 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 12 }}
      >
        <svg viewBox="0 0 120 140" width="120" height="140">
          <motion.rect
            x="10" y="16" width="100" height="118" rx="12"
            className="pad-body"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            style={{ originY: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
          <motion.rect
            x="35" y="6" width="50" height="20" rx="6"
            className="pad-clip"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45, type: 'spring' }}
          />
          {[50, 70, 90, 110].map((y, i) => (
            <motion.line
              key={y}
              x1="26" x2={i === 3 ? 70 : 94} y1={y} y2={y}
              className="pad-line"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.6 + i * 0.12, duration: 0.35 }}
            />
          ))}
          <motion.path
            d="M34 76 L52 94 L90 52"
            className="pad-check"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 1.2, duration: 0.5, ease: 'easeOut' }}
          />
        </svg>
      </motion.div>
      <h1 className="splash-title" aria-hidden>
        {TITLE.split('').map((ch, i) => (
          <motion.span
            key={i}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1 + i * 0.06, type: 'spring', stiffness: 200, damping: 14 }}
          >
            {ch}
          </motion.span>
        ))}
      </h1>
      <motion.p
        className="splash-tagline"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.7, duration: 0.6 }}
      >
        Tasks · Notes · Focus — the classic way
      </motion.p>
      <div className="splash-progress">
        <motion.div
          className="splash-progress-bar"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2.6, ease: 'easeInOut' }}
        />
      </div>
      <motion.span className="splash-skip" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 1.5 }}>
        Tap to skip
      </motion.span>
    </motion.div>
  )
}
