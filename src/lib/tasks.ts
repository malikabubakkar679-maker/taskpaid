import type { AppData, Priority, SortMode, Task, ViewId } from '../types'
import { dayStart, todayISO } from './date'

export const PRIORITY_RANK: Record<Priority, number> = { high: 3, medium: 2, low: 1, none: 0 }
export const PRIORITY_LABEL: Record<Priority, string> = { high: 'High', medium: 'Medium', low: 'Low', none: 'None' }

export function isOverdue(task: Task): boolean {
  return !task.done && task.due !== null && task.due < todayISO()
}

export function matchesSearch(task: Task, q: string): boolean {
  if (!q) return true
  const s = q.toLowerCase()
  return (
    task.title.toLowerCase().includes(s) ||
    task.notes.toLowerCase().includes(s) ||
    task.tags.some((t) => t.includes(s.replace(/^#/, ''))) ||
    task.subtasks.some((st) => st.title.toLowerCase().includes(s))
  )
}

export function sortTasks(tasks: Task[], mode: SortMode): Task[] {
  const copy = [...tasks]
  const dueKey = (t: Task) => `${t.due ?? '9999-99-99'} ${t.dueTime ?? '99:99'}`
  copy.sort((a, b) => {
    switch (mode) {
      case 'due':
        return dueKey(a).localeCompare(dueKey(b)) || a.order - b.order
      case 'priority':
        return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || a.order - b.order
      case 'created':
        return b.createdAt - a.createdAt
      case 'alpha':
        return a.title.localeCompare(b.title)
      default:
        return a.order - b.order
    }
  })
  return copy
}

export function tasksForView(data: AppData, view: ViewId): Task[] {
  const today = todayISO()
  const live = data.tasks.filter((t) => t.deletedAt === null)
  switch (view) {
    case 'today':
      return live.filter(
        (t) => t.due !== null && t.due <= today && (!t.done || (t.completedAt !== null && dayStart(t.completedAt) === today)),
      )
    case 'upcoming':
      return live.filter((t) => t.due !== null && t.due > today)
    case 'all':
      return live
    case 'starred':
      return live.filter((t) => t.starred)
    case 'completed':
      return live.filter((t) => t.done)
    default:
      if (view.startsWith('list:')) {
        const id = view.slice(5)
        return live.filter((t) => t.listId === id)
      }
      return []
  }
}

export function countOpen(data: AppData, view: ViewId): number {
  return tasksForView(data, view).filter((t) => !t.done).length
}
