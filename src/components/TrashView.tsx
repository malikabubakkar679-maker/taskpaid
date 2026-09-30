import { AnimatePresence, motion } from 'framer-motion'
import { CheckSquare, NotebookPen, RotateCcw, Trash2, X } from 'lucide-react'
import { useStore } from '../store'

export function TrashView() {
  const { data, restoreTask, purgeTask, restoreNote, purgeNote, emptyTrash } = useStore()
  const items = [
    ...data.tasks.filter((t) => t.deletedAt !== null).map((t) => ({ kind: 'task' as const, id: t.id, title: t.title, at: t.deletedAt ?? 0 })),
    ...data.notes.filter((n) => n.deletedAt !== null).map((n) => ({ kind: 'note' as const, id: n.id, title: n.title || 'Untitled note', at: n.deletedAt ?? 0 })),
  ].sort((a, b) => b.at - a.at)

  return (
    <div className="trash-view">
      {items.length > 0 && (
        <div className="row space-between">
          <p className="muted">{items.length} item{items.length === 1 ? '' : 's'} in trash</p>
          <button type="button" className="btn btn-danger btn-sm" onClick={emptyTrash}><Trash2 size={14} /> Empty trash</button>
        </div>
      )}
      <ul className="trash-list">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.li key={it.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }} className="trash-item paper-card">
              {it.kind === 'task' ? <CheckSquare size={16} /> : <NotebookPen size={16} />}
              <div className="grow">
                <div>{it.title}</div>
                <div className="muted small">Deleted {new Date(it.at).toLocaleString()}</div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => (it.kind === 'task' ? restoreTask(it.id) : restoreNote(it.id))}>
                <RotateCcw size={14} /> Restore
              </button>
              <button type="button" className="icon-btn sm" onClick={() => (it.kind === 'task' ? purgeTask(it.id) : purgeNote(it.id))} aria-label="Delete forever">
                <X size={14} />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {items.length === 0 && (
        <div className="empty">
          <Trash2 size={40} className="muted" />
          <h3>Trash is empty</h3>
          <p>Deleted tasks and notes wait here until you clear them.</p>
        </div>
      )}
    </div>
  )
}
