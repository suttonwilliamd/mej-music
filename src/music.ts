import type { Preset } from './session'

export const PRESETS = {
  starry: { name: 'Starry', bpm: 80, description: 'A minor · spacious & wandering', bass: ['a1', 'f1', 'c2', 'g1'], chords: [['a3','c4','e4'],['f3','a3','c4'],['c4','e4','g4'],['g3','b3','d4']], melody: ['a4','c5','b4','c5'], chance: 0.1,
    pattern: ['bd ~ ~ ~','~ ~ sn ~','hh ~ hh ~','~ ~ ~ cp','bd ~ ~ ~','~ sn ~ ~','hh ~ hh ~','~ ~ ~ ~','bd ~ ~ ~','~ ~ sn ~','hh ~ hh ~','~ ~ ~ cp','bd ~ ~ ~','~ sn ~ ~','hh ~ hh ~','~ ~ ~ ~'] },
  flow: { name: 'Flow', bpm: 90, description: 'C major · steady & open', bass: ['c2','g1','a1','f1'], chords: [['c4','e4','g4'],['g3','b3','d4'],['a3','c4','e4'],['f3','a3','c4']], melody: ['c5','e4','g4','c4'], chance: 0.05,
    pattern: ['bd ~ bd ~','~ sn ~ ~','hh ~ hh ~','~ ~ ~ cp','bd ~ ~ ~','~ ~ sn ~','hh ~ hh ~','~ ~ ~ ~','bd ~ bd ~','~ sn ~ ~','hh ~ hh ~','~ ~ ~ cp','bd ~ ~ ~','~ ~ sn ~','hh ~ hh ~','~ ~ ~ ~'] },
  glitch: { name: 'Glitch', bpm: 130, description: 'D minor · restless repetitions', bass: ['d2','g1','a1','e2'], chords: [['d3','f3','a3'],['g3','b3','d4'],['a3','c4','e4'],['e3','g#3','b3']], melody: ['g4','b4','d5','b4'], chance: 0.2,
    pattern: ['bd*2 ~ bd sn','sn*4 ~ ~ ~','hh*8 ~ ~ ~','cp*4 ~ ~ ~','bd ~ ~ ~','sn ~ sn ~','hh*4 ~ ~ ~','~ ~ ~ cp','bd*2 ~ bd sn','sn*4 ~ ~ ~','hh*8 ~ ~ ~','cp*4 ~ ~ ~','bd ~ ~ sn','sn ~ ~ ~','hh*4 ~ ~ ~','~ ~ ~ ~'] },
  demon: { name: 'Demon', bpm: 140, description: 'E minor · dense & insistent', bass: ['e1','c2','g1','d2'], chords: [['e3','g3','b3'],['c4','e4','g4'],['g3','b3','d4'],['d3','f3','a3']], melody: ['e3','g3','b3','e4'], chance: 0.15,
    pattern: ['bd bd bd bd','sn ~ sn ~','hh*8 ~ ~ ~','cp*4 bd*4','bd ~ ~ ~','sn ~ sn ~','hh*4 ~ ~ ~','~ ~ ~ cp','bd bd bd bd','sn ~ sn ~','hh*8 ~ ~ ~','cp*4 bd*4','bd ~ ~ ~','sn ~ sn ~','hh*4 ~ ~ ~','~ ~ ~ ~'] }
}

export type Note = [note: string, duration: number, gain: number, type?: OscillatorType]
export function stepNotes(preset: Preset, step: number): Note[] {
  const selected = PRESETS[preset]
  const notes: Note[] = []
  if (step % 4 === 0) notes.push([selected.bass[Math.floor(step / 4)], 0.5, 0.4])
  if (step % 8 === 4) for (const note of selected.chords[Math.floor(step / 4)]) notes.push([note, 1, 0.15])
  if (Math.random() < selected.chance) notes.push([selected.melody[Math.floor(Math.random() * selected.melody.length)], 0.3, 0.15, 'triangle'])
  return notes
}

export function drumDuration(sound: string): number {
  return sound === 'bd' ? 0.5 : sound === 'hh' ? 0.05 : sound === 'cp' ? 0.1 : 0.2
}
export function outputLevel(volume: number, muted: boolean): number { return muted ? 0 : volume / 100 * 0.6 }

/** Identical voices for real-time and offline contexts; all times use the context clock. */
export class Synthesizer {
  readonly output: GainNode
  private sources = new Set<AudioScheduledSourceNode>()
  constructor(private context: BaseAudioContext, level: number) {
    this.output = context.createGain()
    this.output.gain.value = level
    this.output.connect(context.destination)
  }
  private connect(source: AudioScheduledSourceNode, last: AudioNode, at: number | undefined, duration: number, intermediate?: AudioNode) {
    last.connect(this.output)
    this.sources.add(source)
    source.onended = () => { this.sources.delete(source); source.disconnect(); intermediate?.disconnect(); last.disconnect() }
    // Keep live immediate start/stop semantics; only offline calls supply a timestamp.
    if (at === undefined) source.start()
    else source.start(at)
    source.stop((at ?? this.context.currentTime) + duration)
  }
  note(note: string, duration: number, gain: number, type: OscillatorType = 'sawtooth', at?: number) {
    const match = note.match(/^([a-g]#?)(-?\d)$/)!
    const frequencies: Record<string, number> = { c:261.63,'c#':277.18,d:293.66,'d#':311.13,e:329.63,f:349.23,'f#':369.99,g:392,'g#':415.30,a:440,'a#':466.16,b:493.88 }
    const osc = this.context.createOscillator()
    const envelope = this.context.createGain()
    osc.type = type
    osc.frequency.value = frequencies[match[1]] * 2 ** (Number(match[2]) - 4)
    envelope.gain.setValueAtTime(gain, at ?? this.context.currentTime)
    envelope.gain.exponentialRampToValueAtTime(0.001, (at ?? this.context.currentTime) + duration)
    osc.connect(envelope)
    this.connect(osc, envelope, at, duration)
  }
  drum(sound: string, at?: number) {
    const context = this.context
    const now = at ?? context.currentTime
    const envelope = context.createGain()
    if (sound === 'bd') {
      const osc = context.createOscillator()
      osc.frequency.setValueAtTime(150, now)
      osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5)
      envelope.gain.setValueAtTime(0.8, now)
      envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
      osc.connect(envelope)
      this.connect(osc, envelope, at, 0.5)
      return
    }
    const duration = drumDuration(sound)
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const noise = context.createBufferSource()
    noise.buffer = buffer
    const filter = context.createBiquadFilter()
    filter.type = sound === 'cp' ? 'bandpass' : 'highpass'
    filter.frequency.value = sound === 'hh' ? 7000 : sound === 'cp' ? 1500 : 1000
    envelope.gain.setValueAtTime(sound === 'hh' ? 0.25 : 0.3, now)
    envelope.gain.exponentialRampToValueAtTime(0.001, now + duration)
    noise.connect(filter)
    filter.connect(envelope)
    this.connect(noise, envelope, at, duration, filter)
    if (sound === 'sn') this.note('f3', 0.2, 0.18, 'triangle', at)
  }
  stop() {
    for (const source of this.sources) { source.stop(); source.disconnect() }
    this.sources.clear()
  }
}

/** Lazily unlocked live output, independent of any offline renderer. */
export class AudioEngine {
  private context: AudioContext | null = null
  private synth: Synthesizer | null = null
  private level = 0.6
  private transition: ConstantSourceNode | null = null
  private transitionEnd = 0
  setVolume(volume: number, muted: boolean) {
    this.level = outputLevel(volume, muted)
    if (!this.context || !this.synth) return
    const now = this.context.currentTime
    const gain = this.synth.output.gain
    const current = gain.value
    gain.cancelScheduledValues(now)
    gain.setValueAtTime(current, now)
    gain.linearRampToValueAtTime(this.level, now + 0.015)
    // Chromium can strand a ramp midway when the last voice disconnects and the
    // graph goes idle. Keep this master processing with exact zero for only the
    // transition plus one render quantum, including across Pause. Reuse it during
    // rapid slider edits; it is not a voice, timer, context unlock or audible tail.
    if (!this.transition || now >= this.transitionEnd) {
      const source = this.context.createConstantSource()
      source.offset.value = 0
      source.connect(this.synth.output)
      source.onended = () => { source.disconnect(); if (this.transition === source) this.transition = null }
      source.start()
      this.transition = source
    }
    this.transitionEnd = now + 0.015 + 128 / this.context.sampleRate
    this.transition.stop(this.transitionEnd)
  }
  async resume() {
    if (!this.context) {
      this.context = new AudioContext()
      this.synth = new Synthesizer(this.context, this.level)
    }
    await this.context.resume()
  }
  note(...args: Note) { this.synth?.note(...args) }
  drum(sound: string) { this.synth?.drum(sound) }
  stop() { this.synth?.stop() }
}
