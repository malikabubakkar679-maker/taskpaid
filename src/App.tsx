import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUpDown, BarChart3, CalendarDays, Menu, NotebookPen, Search, Sun, Timer, X } from 'lucide-react'
import type { SortMode, ViewId } from './types'
import { useStore } from './store'
import { useFocus } from './focus'
import { greeting, longDate, todayISO } from './lib/date'
import { tasksForView } from './lib/tasks'
import { Splash } from './components/Splash'
import { Onboarding } from './components/Onboarding'
import { Sidebar } from './components/Sidebar'
import { TaskView } from './components/TaskView'
import { TaskDetail } from './components/TaskDetail'
import { NotesView } from './components/NotesView'
import { CalendarView } from './components/CalendarView'
import { FocusView } from './components/FocusView'
import { StatsView } from './components/StatsView'
import { TrashView } from './components/TrashView'
import { SettingsView } from './components/SettingsView'
import { Toasts } from './components/Toasts'

const TITLES: Record<string, string> = {
  today: 'Today',
  upcoming: 'Upcoming',
  all: 'All tasks',
  starred: 'Starred',
  completed: 'Completed',
  notes: 'Notes',
  calendar: 'Calendar',
  focus: 'Focus',
  stats: 'Statistics',
  trash: 'Trash',
  settings: 'Settings',
}

const TASK_VIEWS = new Set(['today', 'upcoming', 'all', 'starred', 'completed'])
const SORTS: { id: SortMode; label: string }[] = [
  { id: 'manual', label: 'Manual' },
  { id: 'due', label: 'Due date' },
  { id: 'priority', label: 'Priority' },
  { id: 'created', label: 'Newest' },
  { id: 'alpha', label: 'A → Z' },
]

function useReminders() {
  const { data, updateTask, toast } = useStore()
  const ref = useRef(data)
  ref.current = data
  useEffect(() => {
    const check = () => {
      const now = new Date()
      const today = todayISO()
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      for (const t of ref.current.tasks) {
        if (t.done || t.deletedAt !== null || t.reminded || !t.due || !t.dueTime) continue
        if (t.due < today || (t.due === today && t.dueTime <= hhmm)) {
          updateTask(t.id, { reminded: true })
          toast(`Reminder: ${t.title}`)
          if (ref.current.settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Taskpad reminder', { body: t.title, icon: '/icon.svg', tag: t.id })
          }
        }
      }
    }
    check()
    const id = window.setInterval(check, 20_000)
    return () => window.clearInterval(id)
  }, [updateTask, toast])
}

export default function App() {
  const { data, updateSettings } = useStore()
  const focus = useFocus()
  const [splash, setSplash] = useState(data.settings.splash)
  const [view, setView] = useState<ViewId>('today')
  const [search, setSearch] = useState('')
  const [openTask, setOpenTask] = useState<string | null>(null)
  const [menu, setMenu] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const quickRef = useRef<HTMLInputElement>(null)
  const gPressed = useRef(false)

  useReminders()

  useEffect(() => {
    document.documentElement.dataset.accent = data.settings.accent
  }, [data.settings.accent])

  const navigate = useCallback((v: ViewId) => {
    setView(v)
    setMenu(false)
    setSearch('')
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable
      if (e.key === 'Escape') {
        setOpenTask(null)
        setMenu(false)
        setSortOpen(false)
        if (typing) target.blur()
        return
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      if (gPressed.current) {
        gPressed.current = false
        const map: Record<string, ViewId> = { n: 'notes', c: 'calendar', f: 'focus', s: 'stats', t: 'today' }
        if (map[e.key]) {
          e.preventDefault()
          navigate(map[e.key])
        }
        return
      }
      if (e.key === 'g') {
        gPressed.current = true
        window.setTimeout(() => (gPressed.current = false), 1000)
        return
      }
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key === 'n') {
        e.preventDefault()
        if (!quickRef.current) navigate('today')
        window.setTimeout(() => quickRef.current?.focus(), 50)
      } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
        navigate((['today', 'upcoming', 'all', 'starred', 'completed'] as ViewId[])[Number(e.key) - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  const list = view.startsWith('list:') ? data.lists.find((l) => l.id === view.slice(5)) : undefined
  useEffect(() => {
    if (view.startsWith('list:') && !list) setView('today')
  }, [view, list])

  const isTaskView = TASK_VIEWS.has(view) || view.startsWith('list:')
  const title = list ? `${list.emoji} ${list.name}` : TITLES[view]
  const todayTasks = tasksForView(data, 'today')
  const todayDone = todayTasks.filter((t) => t.done).length
  const pct = todayTasks.length ? todayDone / todayTasks.length : 0
  const searchable = isTaskView || view === 'notes'

  const content = () => {
    if (isTaskView) return <TaskView ref={quickRef} view={view} search={search} onOpen={setOpenTask} />
    switch (view) {
      case 'notes': return <NotesView search={search} />
      case 'calendar': return <CalendarView onOpen={setOpenTask} />
      case 'focus': return <FocusView />
      case 'stats': return <StatsView />
      case 'trash': return <TrashView />
      default: return <SettingsView />
    }
  }

  return (
    <MotionConfig reducedMotion={data.settings.reduceMotion ? 'always' : 'user'}>
      <AnimatePresence>{splash && <Splash key="splash" onDone={() => setSplash(false)} />}</AnimatePresence>
      <AnimatePresence>{!splash && !data.onboarded && <Onboarding key="onboarding" />}</AnimatePresence>

      <motion.div className="app" initial={{ opacity: 0 }} animate={{ opacity: splash ? 0 : 1 }} transition={{ duration: 0.5 }}>
        <Sidebar view={view} onNavigate={navigate} open={menu} onClose={() => setMenu(false)} />

        <main className="main">
          <header className="topbar">
            <button type="button" className="icon-btn mobile-only" onClick={() => setMenu(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div className="topbar-title">
              <AnimatePresence mode="wait">
                <motion.h1 key={view} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.2 }}>
                  {title}
                </motion.h1>
              </AnimatePresence>
              <p className="subtitle">
                {view === 'today'
                  ? `${greeting()}${data.settings.name ? `, ${data.settings.name}` : ''} · ${longDate()}`
                  : longDate()}
              </p>
            </div>
            {view === 'today' && todayTasks.length > 0 && (
              <div className="ring" title={`${todayDone} of ${todayTasks.length} done`}>
                <svg viewBox="0 0 44 44" width="48" height="48">
                  <circle cx="22" cy="22" r="18" className="ring-track" />
                  <motion.circle cx="22" cy="22" r="18" className="ring-bar" transform="rotate(-90 22 22)" initial={{ pathLength: 0 }} animate={{ pathLength: pct }} transition={{ type: 'spring', stiffness: 80, damping: 15 }} />
                </svg>
                <span>{Math.round(pct * 100)}%</span>
              </div>
            )}
            {searchable && (
              <div className="search">
                <Search size={16} />
                <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={view === 'notes' ? 'Search notes' : 'Search tasks'} aria-label="Search" />
                {search && <button type="button" className="icon-btn sm" onClick={() => setSearch('')} aria-label="Clear search"><X size={14} /></button>}
              </div>
            )}
            {isTaskView && (
              <div className="sort">
                <button type="button" className="icon-btn" onClick={() => setSortOpen((o) => !o)} aria-label="Sort" aria-expanded={sortOpen}>
                  <ArrowUpDown size={18} />
                </button>
                <AnimatePresence>
                  {sortOpen && (
                    <motion.div className="menu paper-card" initial={{ opacity: 0, y: -6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.95 }}>
                      <div className="menu-label">Sort by</div>
                      {SORTS.map((s) => (
                        <button key={s.id} type="button" className={`menu-item ${data.settings.sort === s.id ? 'active' : ''}`} onClick={() => { updateSettings({ sort: s.id }); setSortOpen(false) }}>
                          {s.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              className="content"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {content()}
            </motion.div>
          </AnimatePresence>
        </main>

        <nav className="bottom-nav mobile-only">
          {([
            ['today', Sun, 'Today'],
            ['notes', NotebookPen, 'Notes'],
            ['calendar', CalendarDays, 'Calendar'],
            ['focus', Timer, 'Focus'],
            ['stats', BarChart3, 'Stats'],
          ] as const).map(([id, Icon, label]) => (
            <button key={id} type="button" className={view === id ? 'active' : ''} onClick={() => navigate(id)}>
              {view === id && <motion.span layoutId="bottom-active" className="bottom-active" />}
              <Icon size={20} />
              <span>{label}</span>
              {id === 'focus' && focus.running && <i className="pulse-dot" />}
            </button>
          ))}
        </nav>
      </motion.div>

      <TaskDetail taskId={openTask} onClose={() => setOpenTask(null)} onFocus={() => { setOpenTask(null); navigate('focus') }} />
      <Toasts />
    </MotionConfig>
  )
}
