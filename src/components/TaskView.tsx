import { AnimatePresence, motion, Reorder } from 'framer-motion'
import { forwardRef, useMemo } from 'react'
import { Sparkles, Trash } from 'lucide-react'
import type { Task, ViewId } from '../types'
import { useStore } from '../store'
import { matchesSearch, sortTasks, tasksForView } from '../lib/tasks'
import { addDays, formatDue, todayISO } from '../lib/date'
import { QuickAdd } from './QuickAdd'
import { DraggableTaskItem, TaskItem } from './TaskItem'

interface Group {
  key: string
  title: string
  tasks: Task[]
  tone?: 'danger'
}

const EMPTY: Record<string, { title: string; text: string }> = {
  today: { title: 'A clean page', text: 'Nothing due today. Enjoy it — or add something above.' },
  upcoming: { title: 'Clear skies ahead', text: 'Tasks with future due dates appear here.' },
  starred: { title: 'No starred tasks', text: 'Star the tasks that matter most.' },
  completed: { title: 'Nothing completed yet', text: 'Finished tasks are kept here.' },
  all: { title: 'Your pad is empty', text: 'Write your first task above.' },
}

export const TaskView = forwardRef<HTMLInputElement, { view: ViewId; search: string; onOpen: (id: string) => void }>(
  function TaskView({ view, search, onOpen }, quickRef) {
    const { data, reorderTasks, clearCompleted } = useStore()
    const { sort, showCompleted } = data.settings
    const today = todayISO()

    const tasks = useMemo(
      () => sortTasks(tasksForView(data, view).filter((t) => matchesSearch(t, search)), sort),
      [data, view, search, sort],
    )
    const open = tasks.filter((t) => !t.done)
    const done = tasks.filter((t) => t.done)

    const groups: Group[] = useMemo(() => {
      if (view === 'completed') return [{ key: 'done', title: '', tasks: done }]
      if (view === 'today') {
        const overdue = open.filter((t) => t.due !== null && t.due < today)
        const rest = open.filter((t) => t.due === today)
        return [
          { key: 'overdue', title: 'Overdue', tasks: overdue, tone: 'danger' as const },
          { key: 'today', title: overdue.length ? 'Today' : '', tasks: rest },
        ]
      }
      if (view === 'upcoming') {
        const byDay = new Map<string, Task[]>()
        const later: Task[] = []
        for (const t of sortTasks(open, 'due')) {
          if (t.due && t.due <= addDays(today, 7)) byDay.set(t.due, [...(byDay.get(t.due) ?? []), t])
          else later.push(t)
        }
        return [
          ...[...byDay.entries()].map(([d, ts]) => ({ key: d, title: formatDue(d), tasks: ts })),
          { key: 'later', title: 'Later', tasks: later },
        ]
      }
      return [{ key: 'open', title: '', tasks: open }]
    }, [view, open, done, today])

    const defaults: Partial<Task> = view.startsWith('list:')
      ? { listId: view.slice(5) }
      : view === 'today'
        ? { due: today }
        : view === 'upcoming'
          ? { due: addDays(today, 1) }
          : view === 'starred'
            ? { starred: true }
            : {}

    const showList = !view.startsWith('list:')
    const canDrag = sort === 'manual' && !search && view !== 'upcoming'
    const empty = EMPTY[view] ?? { title: 'Nothing here yet', text: 'Add a task to this list above.' }
    const total = tasks.length
    const visibleGroups = groups.filter((g) => g.tasks.length)

    return (
      <div className="task-view">
        {view !== 'completed' && <QuickAdd ref={quickRef} defaults={defaults} />}

        {visibleGroups.map((g) => (
          <section key={g.key} className="task-group">
            {g.title && (
              <h3 className={`group-title ${g.tone ?? ''}`}>
                {g.title} <span>{g.tasks.length}</span>
              </h3>
            )}
            {canDrag && g.key !== 'done' ? (
              <Reorder.Group
                as="ul"
                axis="y"
                values={g.tasks}
                onReorder={(next: Task[]) => reorderTasks(next.map((t) => t.id))}
                className="task-ul"
              >
                <AnimatePresence initial={false}>
                  {g.tasks.map((t) => (
                    <DraggableTaskItem key={t.id} task={t} onOpen={() => onOpen(t.id)} showList={showList} />
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            ) : (
              <ul className="task-ul">
                <AnimatePresence initial={false}>
                  {g.tasks.map((t) => (
                    <TaskItem key={t.id} task={t} onOpen={() => onOpen(t.id)} showList={showList} />
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </section>
        ))}

        {view !== 'completed' && showCompleted && done.length > 0 && (
          <section className="task-group">
            <h3 className="group-title muted-title">
              Completed <span>{done.length}</span>
              <button type="button" className="link-btn" onClick={() => clearCompleted(done.map((t) => t.id))}>
                <Trash size={13} /> Clear
              </button>
            </h3>
            <ul className="task-ul">
              <AnimatePresence initial={false}>
                {done.map((t) => (
                  <TaskItem key={t.id} task={t} onOpen={() => onOpen(t.id)} showList={showList} />
                ))}
              </AnimatePresence>
            </ul>
          </section>
        )}

        {view === 'today' && open.length === 0 && done.length > 0 && (
          <motion.div className="celebrate" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Sparkles size={28} />
            <div>
              <strong>All done for today!</strong>
              <span>You completed {done.length} task{done.length === 1 ? '' : 's'}. Well earned.</span>
            </div>
          </motion.div>
        )}

        {total === 0 && (
          <motion.div className="empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <svg viewBox="0 0 120 100" width="140" className="empty-art" aria-hidden>
              <rect x="22" y="10" width="76" height="84" rx="8" />
              <path d="M36 34h48M36 50h48M36 66h30" />
              <circle cx="90" cy="76" r="14" className="empty-dot" />
            </svg>
            <h3>{search ? 'No matches' : empty.title}</h3>
            <p>{search ? `Nothing matches "${search}".` : empty.text}</p>
          </motion.div>
        )}
      </div>
    )
  },
)
