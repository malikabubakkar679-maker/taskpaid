import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useStore } from './store'
import { playChime } from './lib/sound'

export type FocusMode = 'focus' | 'break'

interface FocusState {
  mode: FocusMode
  running: boolean
  remaining: number
  total: number
  taskId: string | null
  start: () => void
  pause: () => void
  reset: () => void
  skip: () => void
  setMode: (mode: FocusMode) => void
  setTaskId: (id: string | null) => void
  startForTask: (id: string) => void
}

const FocusContext = createContext<FocusState | null>(null)

export function FocusProvider({ children }: { children: ReactNode }) {
  const { data, logFocus, toast } = useStore()
  const { focusMinutes, breakMinutes, sound, notifications } = data.settings
  const [mode, setModeState] = useState<FocusMode>('focus')
  const [running, setRunning] = useState(false)
  const [taskId, setTaskId] = useState<string | null>(null)
  const total = (mode === 'focus' ? focusMinutes : breakMinutes) * 60
  const [remaining, setRemaining] = useState(total)
  const endAt = useRef<number | null>(null)
  const runningRef = useRef(running)
  runningRef.current = running

  useEffect(() => {
    if (!runningRef.current) setRemaining(total)
  }, [total])

  const finish = useCallback(() => {
    setRunning(false)
    endAt.current = null
    if (sound) playChime()
    const done = mode === 'focus'
    if (done) logFocus({ at: Date.now(), minutes: focusMinutes, taskId })
    const msg = done ? 'Focus session complete — time for a break' : 'Break over — ready to focus?'
    toast(msg)
    if (notifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Taskpad', { body: msg, icon: '/icon.svg' })
    }
    const next: FocusMode = done ? 'break' : 'focus'
    setModeState(next)
    setRemaining((next === 'focus' ? focusMinutes : breakMinutes) * 60)
  }, [sound, mode, logFocus, focusMinutes, breakMinutes, taskId, toast, notifications])

  useEffect(() => {
    if (!running) return
    const tick = () => {
      if (endAt.current === null) return
      const left = Math.max(0, Math.round((endAt.current - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0) finish()
    }
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [running, finish])

  useEffect(() => {
    const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
    const ss = String(remaining % 60).padStart(2, '0')
    document.title = running ? `${mm}:${ss} · ${mode === 'focus' ? 'Focus' : 'Break'} — Taskpad` : 'Taskpad'
  }, [remaining, running, mode])

  const start = useCallback(() => {
    endAt.current = Date.now() + remaining * 1000
    setRunning(true)
  }, [remaining])

  const pause = useCallback(() => {
    setRunning(false)
    endAt.current = null
  }, [])

  const reset = useCallback(() => {
    pause()
    setRemaining(total)
  }, [pause, total])

  const setMode = useCallback(
    (m: FocusMode) => {
      pause()
      setModeState(m)
      setRemaining((m === 'focus' ? focusMinutes : breakMinutes) * 60)
    },
    [pause, focusMinutes, breakMinutes],
  )

  const skip = useCallback(() => setMode(mode === 'focus' ? 'break' : 'focus'), [mode, setMode])

  const startForTask = useCallback(
    (id: string) => {
      setTaskId(id)
      setModeState('focus')
      const secs = focusMinutes * 60
      setRemaining(secs)
      endAt.current = Date.now() + secs * 1000
      setRunning(true)
    },
    [focusMinutes],
  )

  return (
    <FocusContext.Provider
      value={{ mode, running, remaining, total, taskId, start, pause, reset, skip, setMode, setTaskId, startForTask }}
    >
      {children}
    </FocusContext.Provider>
  )
}

export function useFocus(): FocusState {
  const ctx = useContext(FocusContext)
  if (!ctx) throw new Error('useFocus must be used inside FocusProvider')
  return ctx
}
