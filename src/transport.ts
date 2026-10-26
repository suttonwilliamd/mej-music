export interface Clock {
  setInterval(callback: () => void, ms: number): number
  clearInterval(id: number): void
  setTimeout(callback: () => void, ms: number): number
  clearTimeout(id: number): void
}

export type Speed = 'slow' | 'mid' | 'fast'
export function tempo(base: number, speed: Speed): number {
  return Math.round(base * ({ slow: 0.75, mid: 1, fast: 1.25 }[speed]))
}

/** One tick is exactly one sixteenth. All deferred hits belong to one run. */
export class Transport {
  private interval: number | null = null
  private pending = new Set<number>()
  private generation = 0

  constructor(private clock: Clock, private hit: (sound: string) => void) {}

  start(bpm: number, pattern: string[], onStep: (step: number, enabled: boolean) => void = () => {}, isEnabled: (step: number) => boolean = () => true) {
    this.stop()
    if (!Number.isFinite(bpm) || bpm <= 0 || !pattern.length) throw new Error('Invalid tempo or pattern')
    const generation = this.generation
    const stepMs = 60000 / bpm / 4
    let step = 0
    this.interval = this.clock.setInterval(() => {
      if (generation !== this.generation) return
      const index = step++ % pattern.length
      // Snapshot once per dispatch: edits cannot retract this step's scheduled hits.
      const enabled = isEnabled(index)
      onStep(index, enabled)
      if (generation !== this.generation || !enabled) return
      for (const token of pattern[index].split(/\s+/)) {
        const match = token.match(/^(bd|sn|hh|cp)(?:\*(\d+))?$/)
        if (!match) continue
        const count = Math.min(32, Number(match[2] || 1))
        for (let i = 0; i < count; i++) {
          if (i === 0) this.hit(match[1])
          else {
            // Repetitions divide this step rather than leaking across later steps.
            const id = this.clock.setTimeout(() => {
              this.pending.delete(id)
              if (generation === this.generation) this.hit(match[1])
            }, i * stepMs / count)
            this.pending.add(id)
          }
        }
      }
    }, stepMs)
  }

  stop() {
    this.generation++
    if (this.interval !== null) this.clock.clearInterval(this.interval)
    this.interval = null
    for (const id of this.pending) this.clock.clearTimeout(id)
    this.pending.clear()
  }
}
