import { useRef, useState } from 'react'
import { Bell, Download, Keyboard, RotateCcw, Upload } from 'lucide-react'
import { normalize, useStore } from '../store'
import type { SortMode } from '../types'
import { ACCENTS } from './accents'

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
      <span />
    </button>
  )
}

const SHORTCUTS: [string, string][] = [
  ['N', 'New task'],
  ['/', 'Search'],
  ['Esc', 'Close panel'],
  ['1 – 5', 'Today, Upcoming, All, Starred, Completed'],
  ['G then N / C / F / S', 'Notes, Calendar, Focus, Statistics'],
]

export function SettingsView() {
  const { data, updateSettings, replaceData, resetData, toast } = useStore()
  const s = data.settings
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `taskpad-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    toast('Backup downloaded')
  }

  const importData = async (file: File) => {
    try {
      replaceData(normalize(JSON.parse(await file.text())))
      toast('Backup restored')
    } catch {
      toast('That file is not a valid Taskpad backup')
    }
  }

  const enableNotifications = async (on: boolean) => {
    if (!on) return updateSettings({ notifications: false })
    if (!('Notification' in window)) return toast('Notifications are not supported in this browser')
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      updateSettings({ notifications: true })
      toast('Reminders enabled')
    } else toast('Notification permission was denied')
  }

  return (
    <div className="settings-view">
      <section className="paper-card settings-card">
        <h3>Profile</h3>
        <label className="setting-row">
          <span>Your name</span>
          <input className="input" value={s.name} maxLength={40} placeholder="Name" onChange={(e) => updateSettings({ name: e.target.value })} />
        </label>
      </section>

      <section className="paper-card settings-card">
        <h3>Appearance</h3>
        <div className="setting-row">
          <span>Accent ink</span>
          <div className="accent-row">
            {ACCENTS.map((a) => (
              <button key={a.id} type="button" className={`accent-swatch ${s.accent === a.id ? 'selected' : ''}`} style={{ background: a.color }} onClick={() => updateSettings({ accent: a.id })} aria-label={a.label} title={a.label} />
            ))}
          </div>
        </div>
        <div className="setting-row"><span>Show splash screen on launch</span><Toggle label="Splash" checked={s.splash} onChange={(v) => updateSettings({ splash: v })} /></div>
        <div className="setting-row"><span>Reduce motion</span><Toggle label="Reduce motion" checked={s.reduceMotion} onChange={(v) => updateSettings({ reduceMotion: v })} /></div>
      </section>

      <section className="paper-card settings-card">
        <h3>Tasks</h3>
        <label className="setting-row">
          <span>Sort tasks by</span>
          <select className="input" value={s.sort} onChange={(e) => updateSettings({ sort: e.target.value as SortMode })}>
            <option value="manual">Manual (drag)</option>
            <option value="due">Due date</option>
            <option value="priority">Priority</option>
            <option value="created">Newest first</option>
            <option value="alpha">Alphabetical</option>
          </select>
        </label>
        <div className="setting-row"><span>Show completed tasks in lists</span><Toggle label="Show completed" checked={s.showCompleted} onChange={(v) => updateSettings({ showCompleted: v })} /></div>
        <div className="setting-row"><span>Completion sounds</span><Toggle label="Sounds" checked={s.sound} onChange={(v) => updateSettings({ sound: v })} /></div>
        <div className="setting-row"><span><Bell size={14} /> Reminder notifications</span><Toggle label="Notifications" checked={s.notifications} onChange={enableNotifications} /></div>
      </section>

      <section className="paper-card settings-card">
        <h3>Data</h3>
        <p className="muted small">Everything is saved on this device. Back it up or move it with a JSON file.</p>
        <div className="row gap-sm wrap">
          <button type="button" className="btn btn-ghost" onClick={exportData}><Download size={16} /> Export backup</button>
          <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}><Upload size={16} /> Import backup</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importData(f)
              e.target.value = ''
            }}
          />
          {confirmReset ? (
            <>
              <button type="button" className="btn btn-danger" onClick={() => { resetData(); setConfirmReset(false); toast('Taskpad was reset') }}>Yes, erase everything</button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
            </>
          ) : (
            <button type="button" className="btn btn-danger" onClick={() => setConfirmReset(true)}><RotateCcw size={16} /> Reset app</button>
          )}
        </div>
      </section>

      <section className="paper-card settings-card">
        <h3><Keyboard size={16} /> Keyboard shortcuts</h3>
        <dl className="shortcuts">
          {SHORTCUTS.map(([k, v]) => (
            <div key={k}><dt><kbd>{k}</kbd></dt><dd>{v}</dd></div>
          ))}
        </dl>
        <h3>Quick add syntax</h3>
        <dl className="shortcuts">
          <div><dt><kbd>today</kbd> <kbd>tomorrow</kbd> <kbd>friday</kbd> <kbd>next week</kbd> <kbd>in 3 days</kbd></dt><dd>Due date</dd></div>
          <div><dt><kbd>9am</kbd> <kbd>18:30</kbd></dt><dd>Reminder time</dd></div>
          <div><dt><kbd>!high</kbd> <kbd>!med</kbd> <kbd>!low</kbd></dt><dd>Priority</dd></div>
          <div><dt><kbd>#tag</kbd></dt><dd>Tag</dd></div>
          <div><dt><kbd>@list</kbd></dt><dd>List</dd></div>
        </dl>
      </section>

      <p className="muted center small">Taskpad · Classic edition · v1.0</p>
    </div>
  )
}
