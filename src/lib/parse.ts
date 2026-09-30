import type { Priority, TaskList } from '../types'
import { addDays, todayISO } from './date'

export interface ParsedTask {
  title: string
  priority: Priority | null
  tags: string[]
  due: string | null
  dueTime: string | null
  listId: string | null
}

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function nextWeekday(target: number): string {
  const today = new Date().getDay()
  let delta = (target - today + 7) % 7
  if (delta === 0) delta = 7
  return addDays(todayISO(), delta)
}

function parseTime(raw: string): string | null {
  const m = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i)
  if (!m) return null
  let h = Number(m[1])
  const min = Number(m[2] ?? '0')
  const ap = m[3]?.toLowerCase()
  if (ap === 'pm' && h < 12) h += 12
  if (ap === 'am' && h === 12) h = 0
  if (!ap && !m[2]) return null
  if (h > 23 || min > 59) return null
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export function parseQuickAdd(input: string, lists: TaskList[]): ParsedTask {
  const result: ParsedTask = { title: '', priority: null, tags: [], due: null, dueTime: null, listId: null }
  let text = ` ${input} `

  text = text.replace(/\s!(high|h|3|!!)(?=\s)/gi, () => ((result.priority = 'high'), ' '))
  text = text.replace(/\s!(medium|med|m|2|!)(?=\s)/gi, () => ((result.priority ??= 'medium'), ' '))
  text = text.replace(/\s!(low|l|1)(?=\s)/gi, () => ((result.priority ??= 'low'), ' '))

  text = text.replace(/\s#([\p{L}\p{N}_-]+)/gu, (_, tag: string) => {
    if (!result.tags.includes(tag.toLowerCase())) result.tags.push(tag.toLowerCase())
    return ' '
  })

  text = text.replace(/\s@([\p{L}\p{N}_-]+)/gu, (full, name: string) => {
    const list = lists.find((l) => l.name.toLowerCase().replace(/\s+/g, '') === name.toLowerCase())
    if (!list) return full
    result.listId = list.id
    return ' '
  })

  text = text.replace(/\s(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{1,2}:\d{2})(?=\s)/gi, (full, t: string) => {
    const parsed = parseTime(t.replace(/\s+/g, ''))
    if (!parsed) return full
    result.dueTime = parsed
    return ' '
  })

  const dateRules: [RegExp, (m: RegExpMatchArray) => string][] = [
    [/\s(today|tod)(?=\s)/i, () => todayISO()],
    [/\s(tomorrow|tmr|tmrw)(?=\s)/i, () => addDays(todayISO(), 1)],
    [/\snext\s+week(?=\s)/i, () => addDays(todayISO(), 7)],
    [/\sin\s+(\d{1,3})\s+days?(?=\s)/i, (m) => addDays(todayISO(), Number(m[1]))],
    [
      /\s(?:on\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)(?=\s)/i,
      (m) => nextWeekday(WEEKDAYS.indexOf(m[1].slice(0, 3).toLowerCase())),
    ],
  ]
  for (const [re, fn] of dateRules) {
    const m = text.match(re)
    if (m) {
      result.due = fn(m)
      text = text.replace(re, ' ')
      break
    }
  }
  if (result.dueTime && !result.due) result.due = todayISO()

  result.title = text.replace(/\s+/g, ' ').trim()
  return result
}
