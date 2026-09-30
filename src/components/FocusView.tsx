import { motion } from 'framer-motion'
import { Coffee, Pause, Play, RotateCcw, SkipForward, Target } from 'lucide-react'
import { useFocus } from '../focus'
import { useStore } from '../store'
import { dayStart, todayISO } from '../lib/date'

const R = 120
const C = 2 * Math.PI * R

export function FocusView() {
  const { data, updateSettings } = useStore()
  const f = useFocus()
  const progress = f.total ? 1 - f.remaining / f.total : 0
  const mm = String(Math.floor(f.remaining / 60)).padStart(2, '0')
  const ss = String(f.remaining % 60).padStart(2, '0')
  const today = todayISO()
  const todays = data.focus.filter((s) => dayStart(s.at) === today)
  const minutesToday = todays.reduce((a, s) => a + s.minutes, 0)
  const openTasks = data.tasks.filter((t) => !t.done && t.deletedAt === null)
  const task = data.tasks.find((t) => t.id === f.taskId)

  return (
    <div className="focus-view">
      <div className="segmented focus-modes">
        {(['focus', 'break'] as const).map((m) => (
          <button key={m} type="button" className={`seg ${f.mode === m ? 'active' : ''}`} onClick={() => f.setMode(m)}>
            {f.mode === m && <motion.span layoutId="focus-seg" className="seg-bg" />}
            <span>{m === 'focus' ? <><Target size={14} /> Focus</> : <><Coffee size={14} /> Break</>}</span>
          </button>
        ))}
      </div>

      <motion.div className={`timer ${f.running ? 'running' : ''} mode-${f.mode}`} animate={{ scale: f.running ? 1 : 0.97 }}>
        <svg viewBox="0 0 280 280" className="timer-svg">
          <circle cx="140" cy="140" r={R} className="timer-track" />
          {Array.from({ length: 60 }, (_, i) => (
            <line key={i} x1="140" y1="12" x2="140" y2={i % 5 === 0 ? 22 : 17} className="timer-tick" transform={`rotate(${i * 6} 140 140)`} />
          ))}
          <motion.circle
            cx="140" cy="140" r={R}
            className="timer-bar"
            strokeDasharray={C}
            animate={{ strokeDashoffset: C * (1 - progress) }}
            transition={{ duration: 0.3, ease: 'linear' }}
            transform="rotate(-90 140 140)"
          />
        </svg>
        <div className="timer-center">
          <div className="timer-time">{mm}:{ss}</div>
          <div className="timer-label">{f.mode === 'focus' ? (f.running ? 'Stay focused' : 'Ready to focus') : 'Take a breather'}</div>
        </div>
      </motion.div>

      <div className="timer-controls">
        <button type="button" className="icon-btn lg" onClick={f.reset} aria-label="Reset"><RotateCcw size={20} /></button>
        <motion.button type="button" className="btn btn-primary btn-round" whileTap={{ scale: 0.92 }} onClick={f.running ? f.pause : f.start} aria-label={f.running ? 'Pause' : 'Start'}>
          {f.running ? <Pause size={28} /> : <Play size={28} />}
        </motion.button>
        <button type="button" className="icon-btn lg" onClick={f.skip} aria-label="Skip"><SkipForward size={20} /></button>
      </div>

      <div className="focus-task paper-card">
        <label className="muted small">Working on</label>
        <select className="input" value={f.taskId ?? ''} onChange={(e) => f.setTaskId(e.target.value || null)}>
          <option value="">— No specific task —</option>
          {openTasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        {task?.done && <p className="muted small">This task is complete.</p>}
      </div>

      <div className="focus-stats">
        <div className="stat-card paper-card"><strong>{todays.length}</strong><span>sessions today</span></div>
        <div className="stat-card paper-card"><strong>{minutesToday}</strong><span>minutes today</span></div>
        <div className="stat-card paper-card"><strong>{data.focus.length}</strong><span>all-time sessions</span></div>
      </div>

      <div className="focus-settings paper-card">
        <label>
          Focus length
          <select className="input" value={data.settings.focusMinutes} onChange={(e) => updateSettings({ focusMinutes: Number(e.target.value) })} disabled={f.running}>
            {[1, 5, 10, 15, 20, 25, 30, 45, 50, 60, 90].map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
        </label>
        <label>
          Break length
          <select className="input" value={data.settings.breakMinutes} onChange={(e) => updateSettings({ breakMinutes: Number(e.target.value) })} disabled={f.running}>
            {[1, 3, 5, 10, 15, 20, 30].map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
        </label>
      </div>
    </div>
  )
}
