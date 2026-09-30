import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { CalendarDays, Clock, Flag, Hash, List, Plus, Repeat, Star, Timer, Trash2, X } from 'lucide-react'
import type { Priority, Repeat as RepeatT, Task } from '../types'
import { useStore } from '../store'
import { useFocus } from '../focus'
import { uid } from '../lib/id'
import { playComplete } from '../lib/sound'
import { PRIORITY_LABEL } from '../lib/tasks'
import { addDays, todayISO } from '../lib/date'
import { Checkbox } from './Checkbox'

const PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high']
const REPEATS: RepeatT[] = ['none', 'daily', 'weekly', 'monthly']

function DetailBody({ task, onClose, onFocus }: { task: Task; onClose: () => void; onFocus: () => void }) {
  const { data, updateTask, toggleTask, deleteTask } = useStore()
  const focus = useFocus()
  const [sub, setSub] = useState('')
  const [tag, setTag] = useState('')
  const patch = (p: Partial<Task>) => updateTask(task.id, p)

  const addTag = () => {
    const t = tag.trim().replace(/^#/, '').toLowerCase()
    if (t && !task.tags.includes(t)) patch({ tags: [...task.tags, t] })
    setTag('')
  }

  return (
    <>
      <div className="detail-head">
        <Checkbox
          checked={task.done}
          priority={task.priority}
          size={26}
          label="Toggle complete"
          onChange={() => {
            if (!task.done && data.settings.sound) playComplete()
            toggleTask(task.id)
          }}
        />
        <textarea
          className="detail-title"
          value={task.title}
          rows={1}
          maxLength={300}
          onChange={(e) => patch({ title: e.target.value })}
          onBlur={(e) => !e.target.value.trim() && patch({ title: 'Untitled task' })}
          aria-label="Task title"
        />
        <button type="button" className={`star-btn ${task.starred ? 'on' : ''}`} onClick={() => patch({ starred: !task.starred })} aria-label="Star">
          <Star size={20} fill={task.starred ? 'currentColor' : 'none'} />
        </button>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close details">
          <X size={18} />
        </button>
      </div>

      <div className="detail-scroll">
        <div className="field">
          <label><CalendarDays size={14} /> Due date</label>
          <div className="row gap-sm wrap">
            <input type="date" className="input" value={task.due ?? ''} onChange={(e) => patch({ due: e.target.value || null, reminded: false })} />
            <button type="button" className="chip-btn" onClick={() => patch({ due: todayISO(), reminded: false })}>Today</button>
            <button type="button" className="chip-btn" onClick={() => patch({ due: addDays(todayISO(), 1), reminded: false })}>Tomorrow</button>
            <button type="button" className="chip-btn" onClick={() => patch({ due: addDays(todayISO(), 7), reminded: false })}>Next week</button>
            {task.due && <button type="button" className="chip-btn" onClick={() => patch({ due: null, dueTime: null })}>Clear</button>}
          </div>
        </div>

        <div className="field">
          <label><Clock size={14} /> Reminder time</label>
          <input
            type="time"
            className="input"
            value={task.dueTime ?? ''}
            onChange={(e) => patch({ dueTime: e.target.value || null, due: task.due ?? todayISO(), reminded: false })}
          />
        </div>

        <div className="field">
          <label><Flag size={14} /> Priority</label>
          <div className="segmented">
            {PRIORITIES.map((p) => (
              <button key={p} type="button" className={`seg prio-seg-${p} ${task.priority === p ? 'active' : ''}`} onClick={() => patch({ priority: p })}>
                {task.priority === p && <motion.span layoutId="prio-seg" className="seg-bg" />}
                <span>{PRIORITY_LABEL[p]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="row gap-md wrap">
          <div className="field grow">
            <label><List size={14} /> List</label>
            <select className="input" value={task.listId} onChange={(e) => patch({ listId: e.target.value })}>
              {data.lists.map((l) => (
                <option key={l.id} value={l.id}>{l.emoji} {l.name}</option>
              ))}
            </select>
          </div>
          <div className="field grow">
            <label><Repeat size={14} /> Repeat</label>
            <select className="input" value={task.repeat} onChange={(e) => patch({ repeat: e.target.value as RepeatT })}>
              {REPEATS.map((r) => (
                <option key={r} value={r}>{r === 'none' ? 'Never' : r[0].toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label><Hash size={14} /> Tags</label>
          <div className="tag-editor">
            <AnimatePresence>
              {task.tags.map((t) => (
                <motion.button key={t} type="button" className="tag removable" layout initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onClick={() => patch({ tags: task.tags.filter((x) => x !== t) })} title="Remove tag">
                  #{t} <X size={11} />
                </motion.button>
              ))}
            </AnimatePresence>
            <input
              className="tag-input"
              placeholder="Add tag…"
              value={tag}
              maxLength={24}
              onChange={(e) => setTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addTag()
                }
              }}
              onBlur={addTag}
            />
          </div>
        </div>

        <div className="field">
          <label>Subtasks {task.subtasks.length > 0 && `· ${task.subtasks.filter((s) => s.done).length}/${task.subtasks.length}`}</label>
          <ul className="subtasks">
            <AnimatePresence initial={false}>
              {task.subtasks.map((s) => (
                <motion.li key={s.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={s.done ? 'is-done' : ''}>
                  <Checkbox
                    checked={s.done}
                    size={18}
                    label={`Toggle ${s.title}`}
                    onChange={() => patch({ subtasks: task.subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) })}
                  />
                  <input
                    className="sub-input"
                    value={s.title}
                    onChange={(e) => patch({ subtasks: task.subtasks.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)) })}
                  />
                  <button type="button" className="icon-btn sm" onClick={() => patch({ subtasks: task.subtasks.filter((x) => x.id !== s.id) })} aria-label="Remove subtask">
                    <X size={14} />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <form
            className="sub-add"
            onSubmit={(e) => {
              e.preventDefault()
              if (!sub.trim()) return
              patch({ subtasks: [...task.subtasks, { id: uid(), title: sub.trim(), done: false }] })
              setSub('')
            }}
          >
            <Plus size={16} />
            <input className="sub-input" placeholder="Add a step" value={sub} maxLength={200} onChange={(e) => setSub(e.target.value)} />
          </form>
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea className="input ruled notes-area" rows={6} placeholder="Write anything…" value={task.notes} onChange={(e) => patch({ notes: e.target.value })} />
        </div>

        <p className="detail-foot muted">
          Created {new Date(task.createdAt).toLocaleString()}
          {task.completedAt && ` · Completed ${new Date(task.completedAt).toLocaleString()}`}
        </p>
      </div>

      <div className="detail-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            focus.startForTask(task.id)
            onFocus()
          }}
          disabled={task.done}
        >
          <Timer size={16} /> Focus on this
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            deleteTask(task.id)
            onClose()
          }}
        >
          <Trash2 size={16} /> Delete
        </button>
      </div>
    </>
  )
}

export function TaskDetail({ taskId, onClose, onFocus }: { taskId: string | null; onClose: () => void; onFocus: () => void }) {
  const { data } = useStore()
  const task = data.tasks.find((t) => t.id === taskId && t.deletedAt === null)
  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div key="scrim" className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside
            key="panel"
            className="detail paper-card"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            aria-label="Task details"
          >
            <DetailBody key={task.id} task={task} onClose={onClose} onFocus={onFocus} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
