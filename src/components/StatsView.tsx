import { motion } from 'framer-motion'
import { useStore } from '../store'
import { addDays, dayStart, fromISO, todayISO } from '../lib/date'
import { PRIORITY_LABEL } from '../lib/tasks'
import type { Priority } from '../types'

export function StatsView() {
  const { data } = useStore()
  const today = todayISO()
  const live = data.tasks.filter((t) => t.deletedAt === null)
  const done = live.filter((t) => t.done && t.completedAt)
  const doneDays = new Set(done.map((t) => dayStart(t.completedAt ?? 0)))

  let streak = 0
  let cursor = doneDays.has(today) ? today : addDays(today, -1)
  while (doneDays.has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }

  const week = Array.from({ length: 7 }, (_, i) => {
    const iso = addDays(today, i - 6)
    return {
      iso,
      label: fromISO(iso).toLocaleDateString(undefined, { weekday: 'short' }),
      count: done.filter((t) => dayStart(t.completedAt ?? 0) === iso).length,
      focus: data.focus.filter((s) => dayStart(s.at) === iso).reduce((a, s) => a + s.minutes, 0),
    }
  })
  const max = Math.max(1, ...week.map((w) => w.count))
  const weekTotal = week.reduce((a, w) => a + w.count, 0)
  const rate = live.length ? Math.round((done.length / live.length) * 100) : 0
  const overdue = live.filter((t) => !t.done && t.due && t.due < today).length
  const focusMin = data.focus.reduce((a, s) => a + s.minutes, 0)

  const cards = [
    { label: 'Completed today', value: week[6].count },
    { label: 'This week', value: weekTotal },
    { label: 'Day streak', value: streak },
    { label: 'Completion rate', value: `${rate}%` },
    { label: 'Overdue', value: overdue },
    { label: 'Focus hours', value: (focusMin / 60).toFixed(1) },
  ]

  const prios: Priority[] = ['high', 'medium', 'low', 'none']
  const openTotal = Math.max(1, live.filter((t) => !t.done).length)

  return (
    <div className="stats-view">
      <div className="stats-cards">
        {cards.map((c, i) => (
          <motion.div key={c.label} className="stat-card paper-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <strong>{c.value}</strong>
            <span>{c.label}</span>
          </motion.div>
        ))}
      </div>

      <section className="paper-card chart-card">
        <h3>Last 7 days</h3>
        <div className="bar-chart">
          {week.map((w, i) => (
            <div key={w.iso} className="bar-col" title={`${w.count} completed · ${w.focus} focus min`}>
              <span className="bar-val">{w.count}</span>
              <div className="bar-track">
                <motion.div className={`bar ${w.iso === today ? 'today' : ''}`} initial={{ height: 0 }} animate={{ height: `${(w.count / max) * 100}%` }} transition={{ delay: 0.2 + i * 0.06, type: 'spring', stiffness: 120, damping: 16 }} />
              </div>
              <span className="bar-label">{w.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="stats-split">
        <section className="paper-card chart-card">
          <h3>Lists progress</h3>
          {data.lists.map((l, i) => {
            const all = live.filter((t) => t.listId === l.id)
            const d = all.filter((t) => t.done).length
            const pct = all.length ? (d / all.length) * 100 : 0
            return (
              <div key={l.id} className="progress-row">
                <span>{l.emoji} {l.name}</span>
                <span className="muted small">{d}/{all.length}</span>
                <div className="progress"><motion.div style={{ background: l.color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3 + i * 0.05 }} /></div>
              </div>
            )
          })}
        </section>
        <section className="paper-card chart-card">
          <h3>Open by priority</h3>
          {prios.map((p, i) => {
            const n = live.filter((t) => !t.done && t.priority === p).length
            return (
              <div key={p} className="progress-row">
                <span>{PRIORITY_LABEL[p]}</span>
                <span className="muted small">{n}</span>
                <div className="progress"><motion.div className={`prio-fill-${p}`} initial={{ width: 0 }} animate={{ width: `${(n / openTotal) * 100}%` }} transition={{ delay: 0.3 + i * 0.05 }} /></div>
              </div>
            )
          })}
        </section>
      </div>
    </div>
  )
}
