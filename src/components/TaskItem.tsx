import { motion, Reorder, useDragControls } from 'framer-motion'
import { AlignLeft, CalendarDays, Flag, GripVertical, ListChecks, Repeat, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Task } from '../types'
import { useStore } from '../store'
import { formatDue, formatTime } from '../lib/date'
import { isOverdue } from '../lib/tasks'
import { playComplete } from '../lib/sound'
import { Checkbox } from './Checkbox'

function Body({ task, onOpen, showList, handle }: { task: Task; onOpen: () => void; showList: boolean; handle?: ReactNode }) {
  const { data, toggleTask, updateTask } = useStore()
  const list = data.lists.find((l) => l.id === task.listId)
  const doneSubs = task.subtasks.filter((s) => s.done).length
  const overdue = isOverdue(task)

  return (
    <div className={`task ${task.done ? 'is-done' : ''} prio-${task.priority}`} onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
      {handle}
      <Checkbox
        checked={task.done}
        priority={task.priority}
        label={task.done ? `Mark "${task.title}" as not done` : `Complete "${task.title}"`}
        onChange={() => {
          if (!task.done && data.settings.sound) playComplete()
          toggleTask(task.id)
        }}
      />
      <div className="task-main">
        <div className="task-title">
          <span>{task.title}</span>
          <motion.span className="strike" initial={false} animate={{ scaleX: task.done ? 1 : 0 }} transition={{ duration: 0.3 }} />
        </div>
        <div className="task-meta">
          {task.due && (
            <span className={`meta ${overdue ? 'overdue' : ''}`}>
              <CalendarDays size={12} /> {formatDue(task.due)}
              {task.dueTime && ` · ${formatTime(task.dueTime)}`}
            </span>
          )}
          {task.repeat !== 'none' && (
            <span className="meta"><Repeat size={12} /> {task.repeat}</span>
          )}
          {task.subtasks.length > 0 && (
            <span className="meta"><ListChecks size={12} /> {doneSubs}/{task.subtasks.length}</span>
          )}
          {task.notes && <span className="meta"><AlignLeft size={12} /></span>}
          {task.priority !== 'none' && (
            <span className={`meta prio-text-${task.priority}`}><Flag size={12} /> {task.priority}</span>
          )}
          {task.tags.map((t) => (
            <span key={t} className="tag">#{t}</span>
          ))}
          {showList && list && (
            <span className="meta list-meta"><span className="nav-dot" style={{ background: list.color }} /> {list.name}</span>
          )}
        </div>
        {task.subtasks.length > 0 && (
          <div className="sub-progress"><motion.div animate={{ width: `${(doneSubs / task.subtasks.length) * 100}%` }} /></div>
        )}
      </div>
      <motion.button
        type="button"
        className={`star-btn ${task.starred ? 'on' : ''}`}
        whileTap={{ scale: 1.4, rotate: 72 }}
        onClick={(e) => {
          e.stopPropagation()
          updateTask(task.id, { starred: !task.starred })
        }}
        aria-label={task.starred ? 'Unstar' : 'Star'}
      >
        <Star size={18} fill={task.starred ? 'currentColor' : 'none'} />
      </motion.button>
    </div>
  )
}

const itemMotion = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, x: 40, transition: { duration: 0.2 } },
}

export function TaskItem({ task, onOpen, showList }: { task: Task; onOpen: () => void; showList: boolean }) {
  return (
    <motion.li layout {...itemMotion} className="task-li">
      <Body task={task} onOpen={onOpen} showList={showList} />
    </motion.li>
  )
}

export function DraggableTaskItem({ task, onOpen, showList }: { task: Task; onOpen: () => void; showList: boolean }) {
  const controls = useDragControls()
  return (
    <Reorder.Item value={task} dragListener={false} dragControls={controls} {...itemMotion} className="task-li" whileDrag={{ scale: 1.02, boxShadow: '0 12px 30px rgba(60,40,10,0.18)' }}>
      <Body
        task={task}
        onOpen={onOpen}
        showList={showList}
        handle={
          <span
            className="drag-handle"
            onPointerDown={(e) => {
              e.stopPropagation()
              controls.start(e)
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label="Drag to reorder"
          >
            <GripVertical size={16} />
          </span>
        }
      />
    </Reorder.Item>
  )
}
