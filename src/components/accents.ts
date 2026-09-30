import type { Accent, NoteColor } from '../types'

export const ACCENTS: { id: Accent; label: string; color: string }[] = [
  { id: 'navy', label: 'Navy ink', color: '#2f4b7c' },
  { id: 'burgundy', label: 'Burgundy', color: '#8c2f39' },
  { id: 'forest', label: 'Forest', color: '#3d6b4f' },
  { id: 'ochre', label: 'Ochre', color: '#a87a23' },
  { id: 'slate', label: 'Slate', color: '#4f5b66' },
]

export const NOTE_COLORS: { id: NoteColor; label: string }[] = [
  { id: 'paper', label: 'Paper' },
  { id: 'butter', label: 'Butter' },
  { id: 'sky', label: 'Sky' },
  { id: 'sage', label: 'Sage' },
  { id: 'rose', label: 'Rose' },
  { id: 'lavender', label: 'Lavender' },
]

export const LIST_EMOJIS = ['📥', '🌿', '💼', '🏠', '🛒', '📚', '💡', '🎯', '✈️', '❤️', '🎨', '💪']
