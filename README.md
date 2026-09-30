# Taskpad

A classic, animated, light-themed task pad: tasks, lists, notes, calendar, focus timer and statistics in one app. Built with React 18, TypeScript, Vite and Framer Motion. All data is stored locally in the browser (`localStorage`), with JSON backup/restore. Installable as a PWA and works offline after the first load.

## Features

- **Animated splash screen** (drawn notepad + checkmark, letter-by-letter title) and a 3-step **onboarding** (name + accent ink)
- **Tasks**: priorities, due date + reminder time, repeat (daily/weekly/monthly), tags, subtasks with progress, notes, star, drag-to-reorder, undo on complete/delete
- **Smart views**: Today (with overdue + progress ring), Upcoming (grouped by day), All, Starred, Completed; custom **lists** with emoji + color
- **Quick add** natural syntax: `Pay rent friday 9am !high #home @work` (`today`, `tomorrow`, weekdays, `next week`, `in 3 days`, times, `!high/!med/!low`, `#tag`, `@list`)
- **Notes**: ruled notepad, 6 paper colors, pin, search, word count
- **Calendar**: month grid with per-day task dots, add tasks on any day
- **Focus**: Pomodoro timer with focus/break modes, task selection, session log
- **Statistics**: today/week/streak/completion rate/overdue/focus hours, 7-day chart, list and priority breakdowns
- **Trash** with restore / delete forever, **Settings** (accent color, splash, reduce motion, sort, sounds, reminder notifications, export/import/reset)
- Keyboard shortcuts: `N` new task, `/` search, `1–5` smart views, `G` then `N/C/F/S` for Notes/Calendar/Focus/Stats, `Esc` close
- Responsive: desktop sidebar, mobile drawer + bottom navigation

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint
npm run typecheck
npm run build && npm run preview
```
