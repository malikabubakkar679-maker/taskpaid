import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import { fromISO, longDate, toISO, todayISO } from '../lib/date'
import { sortTasks } from '../lib/tasks'
import { QuickAdd } from './QuickAdd'
import { TaskItem } from './TaskItem'

const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarView({ onOpen }: { onOpen: (id: string) => void }) {
  const { data } = useStore()
  const today = todayISO()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selected, setSelected] = useState(today)
  const [dir, setDir] = useState(0)

  const byDay = useMemo(() => {
    const map = new Map<string, { open: number; done: number; colors: string[] }>()
    for (const t of data.tasks) {
      if (t.deletedAt !== null || !t.due) continue
      const e = map.get(t.due) ?? { open: 0, done: 0, colors: [] }
      if (t.done) e.done++
      else e.open++
      const c = data.lists.find((l) => l.id === t.listId)?.color
      if (c && e.colors.length < 3 && !e.colors.includes(c)) e.colors.push(c)
      map.set(t.due, e)
    }
    return map
  }, [data.tasks, data.lists])

  const cells = useMemo(() => {
    const first = new Date(cursor)
    first.setDate(1 - first.getDay())
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(first)
      d.setDate(first.getDate() + i)
      return { iso: toISO(d), day: d.getDate(), inMonth: d.getMonth() === cursor.getMonth() }
    })
  }, [cursor])

  const move = (n: number) => {
    setDir(n)
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1))
  }

  const dayTasks = sortTasks(
    data.tasks.filter((t) => t.deletedAt === null && t.due === selected),
    'due',
  ).sort((a, b) => Number(a.done) - Number(b.done))

  return (
    <div className="calendar-view">
      <div className="calendar paper-card">
        <div className="cal-head">
          <button type="button" className="icon-btn" onClick={() => move(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
          <AnimatePresence mode="wait" initial={false}>
            <motion.h3 key={cursor.toISOString()} initial={{ y: dir * 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -dir * 10, opacity: 0 }}>
              {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </motion.h3>
          </AnimatePresence>
          <button type="button" className="icon-btn" onClick={() => move(1)} aria-label="Next month"><ChevronRight size={18} /></button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              const d = new Date()
              setDir(0)
              setCursor(new Date(d.getFullYear(), d.getMonth(), 1))
              setSelected(today)
            }}
          >
            Today
          </button>
        </div>
        <div className="cal-week">{WEEK.map((w) => <span key={w}>{w}</span>)}</div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={cursor.toISOString()} className="cal-grid" initial={{ x: dir * 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -dir * 40, opacity: 0 }} transition={{ duration: 0.22 }}>
            {cells.map((c) => {
              const info = byDay.get(c.iso)
              return (
                <button
                  key={c.iso}
                  type="button"
                  className={`cal-cell ${c.inMonth ? '' : 'out'} ${c.iso === today ? 'today' : ''} ${c.iso === selected ? 'selected' : ''} ${info && info.open && c.iso < today ? 'late' : ''}`}
                  onClick={() => setSelected(c.iso)}
                >
                  {c.iso === selected && <motion.span layoutId="cal-sel" className="cal-sel" />}
                  <span className="cal-num">{c.day}</span>
                  {info && (
                    <span className="cal-dots">
                      {info.colors.map((col) => <i key={col} style={{ background: col }} />)}
                      {info.open > 0 && <b>{info.open}</b>}
                    </span>
                  )}
                </button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="cal-day">
        <h3 className="group-title">{longDate(fromISO(selected))} <span>{dayTasks.length}</span></h3>
        <QuickAdd defaults={{ due: selected }} placeholder="Add a task on this day…" />
        <ul className="task-ul">
          <AnimatePresence initial={false}>
            {dayTasks.map((t) => <TaskItem key={t.id} task={t} onOpen={() => onOpen(t.id)} showList />)}
          </AnimatePresence>
        </ul>
        {dayTasks.length === 0 && <p className="muted center pad">No tasks on this day.</p>}
      </div>
    </div>
  )
}
