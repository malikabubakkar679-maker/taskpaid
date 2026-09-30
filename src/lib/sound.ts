let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  ctx ??= new AudioContext()
  return ctx
}

function tone(freq: number, start: number, duration: number, gain = 0.08) {
  const ac = audio()
  if (!ac) return
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, ac.currentTime + start)
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + start + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + duration)
  osc.connect(g).connect(ac.destination)
  osc.start(ac.currentTime + start)
  osc.stop(ac.currentTime + start + duration + 0.05)
}

export function playComplete() {
  tone(880, 0, 0.15)
  tone(1320, 0.08, 0.25)
}

export function playChime() {
  tone(659, 0, 0.6, 0.1)
  tone(784, 0.2, 0.6, 0.1)
  tone(988, 0.4, 0.9, 0.1)
}
