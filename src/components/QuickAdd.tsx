import { AnimatePresence, motion } from 'framer-motion'
import { forwardRef, useMemo, useState } from 'react'
import { CalendarDays, Clock, Flag, Hash, List, Plus } from 'lucide-react'
import type { Task } from '../types'
import { useStore } from '../store'
import { parseQuickAdd } from '../lib/parse'
import { formatDue, formatTime } from '../lib/date'

export const QuickAdd = forwardRef<HTMLInputElement, { defaults: Partial<Task>; placeholder?: string }>(
  function QuickAdd({ defaults, placeholder = 'Add a task…  try "Pay rent friday 9am !high #home"' }, ref) {
    const { data, addTask } = useStore()
    const [value, setValue] = useState('')
    const parsed = useMemo(() => parseQuickAdd(value, data.lists), [value, data.lists])
    const list = data.lists.find((l) => l.id === parsed.listId)

    const submit = () => {
      if (!parsed.title) return
      addTask({
        ...defaults,
        title: parsed.title,
        priority: parsed.priority ?? defaults.priority ?? 'none',
        tags: [...new Set([...(defaults.tags ?? []), ...parsed.tags])],
        due: parsed.due ?? defaults.due ?? null,
        dueTime: parsed.dueTime ?? null,
        listId: parsed.listId ?? defaults.listId ?? 'inbox',
      })
      setValue('')
    }

    const chips = [
      parsed.due && { icon: CalendarDays, text: formatDue(parsed.due) },
      parsed.dueTime && { icon: Clock, text: formatTime(parsed.dueTime) },
      parsed.priority && { icon: Flag, text: parsed.priority },
      list && { icon: List, text: list.name },
      ...parsed.tags.map((t) => ({ icon: Hash, text: t })),
    ].filter(Boolean) as { icon: typeof Flag; text: string }[]

    return (
      <form
        className="quick-add"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Plus size={20} className="quick-add-icon" />
        <input
          ref={ref}
          className="quick-add-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label="Add a task"
          maxLength={300}
        />
        <AnimatePresence>
          {value.trim() && (
            <motion.button
              type="submit"
              className="btn btn-primary btn-sm"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
            >
              Add
            </motion.button>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {chips.length > 0 && (
            <motion.div className="quick-add-chips" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              {chips.map((c, i) => (
                <motion.span key={`${c.text}-${i}`} className="chip" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <c.icon size={12} /> {c.text}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    )
  },
)
