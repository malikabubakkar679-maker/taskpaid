import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppData, FocusSession, Note, Settings, Task, TaskList } from './types'
import { addDays, addMonths, todayISO } from './lib/date'
import { uid } from './lib/id'

const STORAGE_KEY = 'taskpad:data:v1'

export const LIST_COLORS = ['#2f4b7c', '#8c2f39', '#3d6b4f', '#b8862b', '#5b6770', '#6b4c8a', '#b5553c']

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  accent: 'navy',
  sound: true,
  showCompleted: true,
  sort: 'manual',
  reduceMotion: false,
  notifications: false,
  splash: true,
  focusMinutes: 25,
  breakMinutes: 5,
}

export function makeTask(partial: Partial<Task> & { title: string }): Task {
  return {
    id: uid(),
    notes: '',
    done: false,
    starred: false,
    priority: 'none',
    due: null,
    dueTime: null,
    repeat: 'none',
    listId: 'inbox',
    tags: [],
    subtasks: [],
    order: Date.now(),
    createdAt: Date.now(),
    completedAt: null,
    deletedAt: null,
    reminded: false,
    ...partial,
  }
}

function seed(): AppData {
  const today = todayISO()
  const lists: TaskList[] = [
    { id: 'inbox', name: 'Inbox', color: LIST_COLORS[0], emoji: '📥' },
    { id: uid(), name: 'Personal', color: LIST_COLORS[2], emoji: '🌿' },
    { id: uid(), name: 'Work', color: LIST_COLORS[1], emoji: '💼' },
  ]
  let order = 0
  const t = (p: Partial<Task> & { title: string }) => makeTask({ ...p, order: order++ })
  return {
    version: 1,
    onboarded: false,
    lists,
    tasks: [
      t({
        title: 'Welcome to Taskpad — tap me to see the details',
        notes: 'Every task can hold notes, subtasks, tags, a due date, time reminders and a repeat rule.',
        due: today,
        starred: true,
        subtasks: [
          { id: uid(), title: 'Tick a checkbox to complete a task', done: false },
          { id: uid(), title: 'Drag the handle to reorder', done: false },
          { id: uid(), title: 'Try the Notes, Calendar and Focus pages', done: false },
        ],
      }),
      t({
        title: 'Try quick add: "Call mom tomorrow 6pm !high #family"',
        due: today,
        priority: 'high',
        tags: ['tips'],
      }),
      t({ title: 'Plan the week ahead', due: addDays(today, 1), listId: lists[2].id, priority: 'medium', repeat: 'weekly' }),
      t({ title: 'Water the plants', due: addDays(today, 2), listId: lists[1].id, repeat: 'daily', tags: ['home'] }),
      t({ title: 'Read 20 pages', listId: lists[1].id, priority: 'low' }),
    ],
    notes: [
      {
        id: uid(),
        title: 'A classic notepad',
        body: 'Jot down ideas, lists and thoughts here.\n\nNotes can be pinned, colored and searched.',
        color: 'butter',
        pinned: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
      },
    ],
    focus: [],
    settings: DEFAULT_SETTINGS,
  }
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed()
    return normalize(JSON.parse(raw))
  } catch {
    return seed()
  }
}

export function normalize(input: unknown): AppData {
  if (!input || typeof input !== 'object') throw new Error('Invalid data file')
  const d = input as Partial<AppData>
  if (!Array.isArray(d.tasks) || !Array.isArray(d.lists)) throw new Error('Invalid data file')
  const lists = d.lists.length ? d.lists : seed().lists
  if (!lists.some((l) => l.id === 'inbox')) lists.unshift({ id: 'inbox', name: 'Inbox', color: LIST_COLORS[0], emoji: '📥' })
  return {
    version: 1,
    onboarded: d.onboarded ?? true,
    lists,
    tasks: d.tasks.map((task) => makeTask(task)),
    notes: Array.isArray(d.notes) ? d.notes : [],
    focus: Array.isArray(d.focus) ? d.focus : [],
    settings: { ...DEFAULT_SETTINGS, ...(d.settings ?? {}) },
  }
}

export interface Toast {
  id: string
  message: string
  undo?: () => void
}

interface Store {
  data: AppData
  toasts: Toast[]
  toast: (message: string, undo?: () => void) => void
  dismissToast: (id: string) => void
  addTask: (partial: Partial<Task> & { title: string }) => Task
  updateTask: (id: string, patch: Partial<Task>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  restoreTask: (id: string) => void
  purgeTask: (id: string) => void
  reorderTasks: (ids: string[]) => void
  clearCompleted: (ids: string[]) => void
  addList: (name: string, color: string, emoji: string) => TaskList
  updateList: (id: string, patch: Partial<TaskList>) => void
  deleteList: (id: string) => void
  addNote: (partial?: Partial<Note>) => Note
  updateNote: (id: string, patch: Partial<Note>) => void
  deleteNote: (id: string) => void
  restoreNote: (id: string) => void
  purgeNote: (id: string) => void
  emptyTrash: () => void
  updateSettings: (patch: Partial<Settings>) => void
  completeOnboarding: (patch: Partial<Settings>) => void
  logFocus: (session: Omit<FocusSession, 'id'>) => void
  replaceData: (data: AppData) => void
  resetData: () => void
}

const StoreContext = createContext<Store | null>(null)

function nextDue(task: Task): string {
  const base = task.due ?? todayISO()
  if (task.repeat === 'daily') return addDays(base, 1)
  if (task.repeat === 'weekly') return addDays(base, 7)
  return addMonths(base, 1)
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load)
  const [toasts, setToasts] = useState<Toast[]>([])
  const dataRef = useRef(data)
  dataRef.current = data

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const toast = useCallback(
    (message: string, undo?: () => void) => {
      const id = uid()
      setToasts((t) => [...t.slice(-2), { id, message, undo }])
      window.setTimeout(() => dismissToast(id), 4500)
    },
    [dismissToast],
  )

  const snapshot = useCallback(() => {
    const prev = dataRef.current
    return () => setData(prev)
  }, [])

  const store = useMemo<Store>(() => {
    const setTasks = (fn: (tasks: Task[]) => Task[]) => setData((d) => ({ ...d, tasks: fn(d.tasks) }))
    const setNotes = (fn: (notes: Note[]) => Note[]) => setData((d) => ({ ...d, notes: fn(d.notes) }))

    return {
      data,
      toasts,
      toast,
      dismissToast,
      addTask: (partial) => {
        const task = makeTask({ order: Math.min(0, ...dataRef.current.tasks.map((t) => t.order)) - 1, ...partial })
        setTasks((tasks) => [...tasks, task])
        return task
      },
      updateTask: (id, patch) => setTasks((tasks) => tasks.map((t) => (t.id === id ? { ...t, ...patch } : t))),
      toggleTask: (id) => {
        const task = dataRef.current.tasks.find((t) => t.id === id)
        if (!task) return
        const undo = snapshot()
        setTasks((tasks) => {
          const next = tasks.map((t) =>
            t.id === id ? { ...t, done: !t.done, completedAt: t.done ? null : Date.now() } : t,
          )
          if (!task.done && task.repeat !== 'none') {
            next.push(
              makeTask({
                ...task,
                id: uid(),
                done: false,
                completedAt: null,
                reminded: false,
                createdAt: Date.now(),
                due: nextDue(task),
                subtasks: task.subtasks.map((s) => ({ ...s, id: uid(), done: false })),
              }),
            )
          }
          return next
        })
        if (!task.done) toast(task.repeat !== 'none' ? 'Completed — next one scheduled' : 'Task completed', undo)
      },
      deleteTask: (id) => {
        const undo = snapshot()
        setTasks((tasks) => tasks.map((t) => (t.id === id ? { ...t, deletedAt: Date.now() } : t)))
        toast('Task moved to trash', undo)
      },
      restoreTask: (id) => setTasks((tasks) => tasks.map((t) => (t.id === id ? { ...t, deletedAt: null } : t))),
      purgeTask: (id) => setTasks((tasks) => tasks.filter((t) => t.id !== id)),
      reorderTasks: (ids) =>
        setTasks((tasks) => {
          const orders = ids
            .map((id) => tasks.find((t) => t.id === id)?.order ?? 0)
            .sort((a, b) => a - b)
          const map = new Map(ids.map((id, i) => [id, orders[i]]))
          return tasks.map((t) => (map.has(t.id) ? { ...t, order: map.get(t.id) ?? t.order } : t))
        }),
      clearCompleted: (ids) => {
        const undo = snapshot()
        const set = new Set(ids)
        setTasks((tasks) => tasks.map((t) => (set.has(t.id) ? { ...t, deletedAt: Date.now() } : t)))
        toast(`${ids.length} completed task${ids.length === 1 ? '' : 's'} cleared`, undo)
      },
      addList: (name, color, emoji) => {
        const list = { id: uid(), name, color, emoji }
        setData((d) => ({ ...d, lists: [...d.lists, list] }))
        return list
      },
      updateList: (id, patch) =>
        setData((d) => ({ ...d, lists: d.lists.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
      deleteList: (id) => {
        if (id === 'inbox') return
        const undo = snapshot()
        setData((d) => ({
          ...d,
          lists: d.lists.filter((l) => l.id !== id),
          tasks: d.tasks.map((t) => (t.listId === id ? { ...t, listId: 'inbox' } : t)),
        }))
        toast('List deleted — its tasks moved to Inbox', undo)
      },
      addNote: (partial) => {
        const note: Note = {
          id: uid(),
          title: '',
          body: '',
          color: 'paper',
          pinned: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          deletedAt: null,
          ...partial,
        }
        setNotes((notes) => [note, ...notes])
        return note
      },
      updateNote: (id, patch) =>
        setNotes((notes) => notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))),
      deleteNote: (id) => {
        const undo = snapshot()
        setNotes((notes) => notes.map((n) => (n.id === id ? { ...n, deletedAt: Date.now() } : n)))
        toast('Note moved to trash', undo)
      },
      restoreNote: (id) => setNotes((notes) => notes.map((n) => (n.id === id ? { ...n, deletedAt: null } : n))),
      purgeNote: (id) => setNotes((notes) => notes.filter((n) => n.id !== id)),
      emptyTrash: () => {
        const undo = snapshot()
        setData((d) => ({
          ...d,
          tasks: d.tasks.filter((t) => t.deletedAt === null),
          notes: d.notes.filter((n) => n.deletedAt === null),
        }))
        toast('Trash emptied', undo)
      },
      updateSettings: (patch) => setData((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
      completeOnboarding: (patch) =>
        setData((d) => ({ ...d, onboarded: true, settings: { ...d.settings, ...patch } })),
      logFocus: (session) => setData((d) => ({ ...d, focus: [...d.focus, { ...session, id: uid() }] })),
      replaceData: (next) => setData(next),
      resetData: () => setData(seed()),
    }
  }, [data, toasts, toast, dismissToast, snapshot])

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
