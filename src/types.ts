export type Priority = 'none' | 'low' | 'medium' | 'high'
export type Repeat = 'none' | 'daily' | 'weekly' | 'monthly'
export type SortMode = 'manual' | 'due' | 'priority' | 'created' | 'alpha'
export type Accent = 'navy' | 'burgundy' | 'forest' | 'ochre' | 'slate'
export type NoteColor = 'paper' | 'butter' | 'sky' | 'sage' | 'rose' | 'lavender'

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  notes: string
  done: boolean
  starred: boolean
  priority: Priority
  due: string | null
  dueTime: string | null
  repeat: Repeat
  listId: string
  tags: string[]
  subtasks: Subtask[]
  order: number
  createdAt: number
  completedAt: number | null
  deletedAt: number | null
  reminded: boolean
}

export interface TaskList {
  id: string
  name: string
  color: string
  emoji: string
}

export interface Note {
  id: string
  title: string
  body: string
  color: NoteColor
  pinned: boolean
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface FocusSession {
  id: string
  at: number
  minutes: number
  taskId: string | null
}

export interface Settings {
  name: string
  accent: Accent
  sound: boolean
  showCompleted: boolean
  sort: SortMode
  reduceMotion: boolean
  notifications: boolean
  splash: boolean
  focusMinutes: number
  breakMinutes: number
}

export interface AppData {
  version: 1
  onboarded: boolean
  tasks: Task[]
  lists: TaskList[]
  notes: Note[]
  focus: FocusSession[]
  settings: Settings
}

export type ViewId =
  | 'today'
  | 'upcoming'
  | 'all'
  | 'starred'
  | 'completed'
  | 'notes'
  | 'calendar'
  | 'focus'
  | 'stats'
  | 'trash'
  | 'settings'
  | `list:${string}`
