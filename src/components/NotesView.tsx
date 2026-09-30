import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Pin, PinOff, Plus, Trash2, X } from 'lucide-react'
import type { Note } from '../types'
import { useStore } from '../store'
import { NOTE_COLORS } from './accents'

function NoteEditor({ note, onClose }: { note: Note; onClose: () => void }) {
  const { updateNote, deleteNote } = useStore()
  const words = note.body.trim() ? note.body.trim().split(/\s+/).length : 0
  return (
    <>
      <motion.div className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div
        className={`note-editor note-${note.color}`}
        layoutId={`note-${note.id}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        role="dialog"
        aria-label="Edit note"
      >
        <div className="note-editor-head">
          <input className="note-title-input" placeholder="Title" value={note.title} maxLength={120} onChange={(e) => updateNote(note.id, { title: e.target.value })} autoFocus={!note.title} />
          <button type="button" className="icon-btn" onClick={() => updateNote(note.id, { pinned: !note.pinned })} aria-label={note.pinned ? 'Unpin' : 'Pin'}>
            {note.pinned ? <PinOff size={18} /> : <Pin size={18} />}
          </button>
          <button type="button" className="icon-btn" onClick={() => { deleteNote(note.id); onClose() }} aria-label="Delete note">
            <Trash2 size={18} />
          </button>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <textarea className="note-body-input ruled" placeholder="Start writing…" value={note.body} onChange={(e) => updateNote(note.id, { body: e.target.value })} />
        <div className="note-editor-foot">
          <div className="color-row">
            {NOTE_COLORS.map((c) => (
              <button key={c.id} type="button" className={`color-dot note-${c.id} ${note.color === c.id ? 'selected' : ''}`} onClick={() => updateNote(note.id, { color: c.id })} aria-label={c.label} title={c.label} />
            ))}
          </div>
          <span className="muted small">{words} words · edited {new Date(note.updatedAt).toLocaleString()}</span>
        </div>
      </motion.div>
    </>
  )
}

export function NotesView({ search }: { search: string }) {
  const { data, addNote, updateNote } = useStore()
  const [openId, setOpenId] = useState<string | null>(null)
  const notes = useMemo(() => {
    const q = search.toLowerCase()
    return data.notes
      .filter((n) => n.deletedAt === null && (!q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt)
  }, [data.notes, search])
  const open = data.notes.find((n) => n.id === openId && n.deletedAt === null)

  return (
    <div className="notes-view">
      <motion.button type="button" className="new-note" onClick={() => setOpenId(addNote().id)} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
        <Plus size={22} /> New note
      </motion.button>
      <div className="notes-grid">
        <AnimatePresence>
          {notes.map((n, i) => (
            <motion.article
              key={n.id}
              layout
              layoutId={`note-${n.id}`}
              className={`note-card note-${n.color}`}
              initial={{ opacity: 0, y: 20, rotate: i % 2 ? 1 : -1 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ y: -4, rotate: i % 2 ? 0.6 : -0.6 }}
              onClick={() => setOpenId(n.id)}
            >
              {n.pinned && <span className="pin-badge"><Pin size={14} /></span>}
              <h4>{n.title || 'Untitled'}</h4>
              <p>{n.body || <em className="muted">Empty note</em>}</p>
              <footer>
                <span>{new Date(n.updatedAt).toLocaleDateString()}</span>
                <button
                  type="button"
                  className="icon-btn sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    updateNote(n.id, { pinned: !n.pinned })
                  }}
                  aria-label={n.pinned ? 'Unpin' : 'Pin'}
                >
                  {n.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                </button>
              </footer>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
      {notes.length === 0 && (
        <div className="empty">
          <h3>{search ? 'No matching notes' : 'No notes yet'}</h3>
          <p>{search ? `Nothing matches "${search}".` : 'Tap "New note" to start your notepad.'}</p>
        </div>
      )}
      <AnimatePresence>{open && <NoteEditor key={open.id} note={open} onClose={() => setOpenId(null)} />}</AnimatePresence>
    </div>
  )
}
