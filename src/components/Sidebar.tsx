import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import {
  BarChart3, CalendarDays, CalendarRange, CheckCheck, Inbox, Layers, NotebookPen, Pencil, Plus, Settings, Star, Sun, Timer, Trash2, X,
} from 'lucide-react'
import type { ViewId } from '../types'
import { LIST_COLORS, useStore } from '../store'
import { countOpen } from '../lib/tasks'
import { useFocus } from '../focus'
import { LIST_EMOJIS } from './accents'

interface NavItem {
  id: ViewId
  label: string
  icon: typeof Sun
}

const SMART: NavItem[] = [
  { id: 'today', label: 'Today', icon: Sun },
  { id: 'upcoming', label: 'Upcoming', icon: CalendarRange },
  { id: 'all', label: 'All tasks', icon: Layers },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'completed', label: 'Completed', icon: CheckCheck },
]

const TOOLS: NavItem[] = [
  { id: 'notes', label: 'Notes', icon: NotebookPen },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'focus', label: 'Focus', icon: Timer },
  { id: 'stats', label: 'Statistics', icon: BarChart3 },
]

export function Sidebar({
  view,
  onNavigate,
  open,
  onClose,
}: {
  view: ViewId
  onNavigate: (v: ViewId) => void
  open: boolean
  onClose: () => void
}) {
  const { data, addList, updateList, deleteList } = useStore()
  const focus = useFocus()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(LIST_COLORS[3])
  const [emoji, setEmoji] = useState(LIST_EMOJIS[5])

  const startEdit = (id: string) => {
    const l = data.lists.find((x) => x.id === id)
    if (!l) return
    setEditing(id)
    setAdding(true)
    setName(l.name)
    setColor(l.color)
    setEmoji(l.emoji)
  }

  const submit = () => {
    const n = name.trim()
    if (!n) return
    if (editing) updateList(editing, { name: n, color, emoji })
    else onNavigate(`list:${addList(n, color, emoji).id}`)
    setAdding(false)
    setEditing(null)
    setName('')
  }

  const trashCount =
    data.tasks.filter((t) => t.deletedAt !== null).length + data.notes.filter((n) => n.deletedAt !== null).length

  const item = (it: { id: ViewId; label: string; icon?: typeof Sun; emoji?: string; color?: string; count?: number }) => (
    <button
      key={it.id}
      type="button"
      className={`nav-item ${view === it.id ? 'active' : ''}`}
      onClick={() => onNavigate(it.id)}
    >
      {view === it.id && <motion.span layoutId="nav-active" className="nav-active" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
      <span className="nav-icon">
        {it.icon ? <it.icon size={18} /> : <span className="nav-emoji">{it.emoji}</span>}
      </span>
      <span className="nav-label">{it.label}</span>
      {it.color && <span className="nav-dot" style={{ background: it.color }} />}
      {!!it.count && <span className="nav-count">{it.count}</span>}
    </button>
  )

  return (
    <>
      <AnimatePresence>
        {open && <motion.div className="scrim mobile-only" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
      </AnimatePresence>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <img src="/icon.svg" alt="" width={34} height={34} />
          <div>
            <div className="brand-name">Taskpad</div>
            <div className="brand-sub">Classic edition</div>
          </div>
          <button type="button" className="icon-btn mobile-only" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="nav-section">
          {SMART.map((s) => item({ ...s, count: s.id === 'completed' ? 0 : countOpen(data, s.id) }))}
        </nav>

        <div className="nav-heading">
          <span>Lists</span>
          <button
            type="button"
            className="icon-btn sm"
            onClick={() => {
              setEditing(null)
              setName('')
              setAdding((a) => !a)
            }}
            aria-label="Add list"
          >
            <Plus size={16} />
          </button>
        </div>
        <AnimatePresence>
          {adding && (
            <motion.form
              className="list-form"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
            >
              <input className="input" autoFocus placeholder="List name" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} />
              <div className="emoji-row">
                {LIST_EMOJIS.map((e) => (
                  <button key={e} type="button" className={`emoji-btn ${emoji === e ? 'selected' : ''}`} onClick={() => setEmoji(e)}>
                    {e}
                  </button>
                ))}
              </div>
              <div className="color-row">
                {LIST_COLORS.map((c) => (
                  <button key={c} type="button" className={`color-dot ${color === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={`Color ${c}`} />
                ))}
              </div>
              <div className="row gap-sm">
                <button type="submit" className="btn btn-primary btn-sm">{editing ? 'Save' : 'Add list'}</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setAdding(false); setEditing(null) }}>Cancel</button>
                {editing && editing !== 'inbox' && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm push-right"
                    onClick={() => {
                      deleteList(editing)
                      if (view === `list:${editing}`) onNavigate('today')
                      setAdding(false)
                      setEditing(null)
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </motion.form>
          )}
        </AnimatePresence>
        <nav className="nav-section">
          {data.lists.map((l) => (
            <div key={l.id} className="nav-row">
              {item({
                id: `list:${l.id}`,
                label: l.name,
                icon: l.id === 'inbox' ? Inbox : undefined,
                emoji: l.emoji,
                color: l.color,
                count: countOpen(data, `list:${l.id}`),
              })}
              <button type="button" className="icon-btn sm nav-edit" onClick={() => startEdit(l.id)} aria-label={`Edit ${l.name}`}>
                <Pencil size={13} />
              </button>
            </div>
          ))}
        </nav>

        <div className="nav-heading"><span>Tools</span></div>
        <nav className="nav-section">
          {TOOLS.map((t) => item(t))}
        </nav>

        <div className="sidebar-footer">
          {focus.running && (
            <button type="button" className="focus-pill" onClick={() => onNavigate('focus')}>
              <span className="pulse-dot" />
              {focus.mode === 'focus' ? 'Focusing' : 'On break'} · {Math.floor(focus.remaining / 60)}:{String(focus.remaining % 60).padStart(2, '0')}
            </button>
          )}
          {item({ id: 'trash', label: 'Trash', icon: Trash2, count: trashCount })}
          {item({ id: 'settings', label: 'Settings', icon: Settings })}
        </div>
      </aside>
    </>
  )
}
