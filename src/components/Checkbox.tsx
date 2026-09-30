import { motion } from 'framer-motion'
import type { Priority } from '../types'

export function Checkbox({
  checked,
  onChange,
  priority = 'none',
  size = 22,
  label,
}: {
  checked: boolean
  onChange: () => void
  priority?: Priority
  size?: number
  label: string
}) {
  return (
    <motion.button
      type="button"
      className={`check check-${priority} ${checked ? 'is-checked' : ''}`}
      style={{ width: size, height: size }}
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      whileTap={{ scale: 0.8 }}
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
    >
      <svg viewBox="0 0 24 24" width={size - 6} height={size - 6}>
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.25 }}
        />
      </svg>
      {checked && (
        <motion.span
          className="check-burst"
          initial={{ scale: 0.4, opacity: 0.7 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </motion.button>
  )
}
