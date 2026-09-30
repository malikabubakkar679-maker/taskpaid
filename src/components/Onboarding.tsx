import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { ArrowRight, CalendarDays, CheckCircle2, NotebookPen, Timer } from 'lucide-react'
import type { Accent } from '../types'
import { useStore } from '../store'
import { ACCENTS } from './accents'

const FEATURES = [
  { icon: CheckCircle2, title: 'Tasks & lists', text: 'Priorities, due dates, subtasks, tags and repeats.' },
  { icon: NotebookPen, title: 'Classic notes', text: 'A ruled notepad for ideas, pinned and colored.' },
  { icon: CalendarDays, title: 'Calendar', text: 'See your month at a glance and plan ahead.' },
  { icon: Timer, title: 'Focus timer', text: 'Pomodoro sessions with progress stats.' },
]

export function Onboarding() {
  const { data, completeOnboarding } = useStore()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(data.settings.name)
  const [accent, setAccent] = useState<Accent>(data.settings.accent)

  const finish = () => completeOnboarding({ name: name.trim(), accent })

  return (
    <motion.div className="overlay onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="onboarding-card paper-card"
        data-accent={accent}
        initial={{ y: 40, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 140, damping: 16 }}
      >
        <div className="onboarding-dots">
          {[0, 1, 2].map((i) => (
            <motion.span key={i} className={i === step ? 'active' : ''} layout />
          ))}
        </div>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" className="onboarding-step" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}>
              <h2>Welcome to Taskpad</h2>
              <p className="muted">Everything you need to get things done, on one classic page.</p>
              <div className="feature-grid">
                {FEATURES.map((f, i) => (
                  <motion.div key={f.title} className="feature" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 + i * 0.08 }}>
                    <f.icon size={22} />
                    <strong>{f.title}</strong>
                    <span>{f.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="s1" className="onboarding-step" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}>
              <h2>What should we call you?</h2>
              <p className="muted">Used for your daily greeting. Optional.</p>
              <input
                className="input input-lg"
                autoFocus
                placeholder="Your name"
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setStep(2)}
              />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="s2" className="onboarding-step" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}>
              <h2>Pick your ink</h2>
              <p className="muted">Choose a classic accent color. You can change it later in Settings.</p>
              <div className="accent-row">
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`accent-swatch ${accent === a.id ? 'selected' : ''}`}
                    style={{ background: a.color }}
                    onClick={() => setAccent(a.id)}
                    aria-label={a.label}
                    title={a.label}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="onboarding-actions">
          {step > 0 ? (
            <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>
              Back
            </button>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={finish}>
              Skip
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={() => (step < 2 ? setStep(step + 1) : finish())}>
            {step < 2 ? 'Continue' : 'Start writing'} <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
