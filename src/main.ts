import './style.css'
import { Transport, tempo, type Speed } from './transport'

const PRESETS = {
  starry: { name: 'Starry', bpm: 80, description: 'A minor · spacious & wandering', bass: ['a1', 'f1', 'c2', 'g1'], chords: [['a3','c4','e4'],['f3','a3','c4'],['c4','e4','g4'],['g3','b3','d4']], melody: ['a4','c5','b4','c5'], chance: 0.1,
    pattern: ['bd ~ ~ ~','~ ~ sn ~','hh ~ hh ~','~ ~ ~ cp','bd ~ ~ ~','~ sn ~ ~','hh ~ hh ~','~ ~ ~ ~','bd ~ ~ ~','~ ~ sn ~','hh ~ hh ~','~ ~ ~ cp','bd ~ ~ ~','~ sn ~ ~','hh ~ hh ~','~ ~ ~ ~'] },
  flow: { name: 'Flow', bpm: 90, description: 'C major · steady & open', bass: ['c2','g1','a1','f1'], chords: [['c4','e4','g4'],['g3','b3','d4'],['a3','c4','e4'],['f3','a3','c4']], melody: ['c5','e4','g4','c4'], chance: 0.05,
    pattern: ['bd ~ bd ~','~ sn ~ ~','hh ~ hh ~','~ ~ ~ cp','bd ~ ~ ~','~ ~ sn ~','hh ~ hh ~','~ ~ ~ ~','bd ~ bd ~','~ sn ~ ~','hh ~ hh ~','~ ~ ~ cp','bd ~ ~ ~','~ ~ sn ~','hh ~ hh ~','~ ~ ~ ~'] },
  glitch: { name: 'Glitch', bpm: 130, description: 'D minor · restless repetitions', bass: ['d2','g1','a1','e2'], chords: [['d3','f3','a3'],['g3','b3','d4'],['a3','c4','e4'],['e3','g#3','b3']], melody: ['g4','b4','d5','b4'], chance: 0.2,
    pattern: ['bd*2 ~ bd sn','sn*4 ~ ~ ~','hh*8 ~ ~ ~','cp*4 ~ ~ ~','bd ~ ~ ~','sn ~ sn ~','hh*4 ~ ~ ~','~ ~ ~ cp','bd*2 ~ bd sn','sn*4 ~ ~ ~','hh*8 ~ ~ ~','cp*4 ~ ~ ~','bd ~ ~ sn','sn ~ ~ ~','hh*4 ~ ~ ~','~ ~ ~ ~'] },
  demon: { name: 'Demon', bpm: 140, description: 'E minor · dense & insistent', bass: ['e1','c2','g1','d2'], chords: [['e3','g3','b3'],['c4','e4','g4'],['g3','b3','d4'],['d3','f3','a3']], melody: ['e3','g3','b3','e4'], chance: 0.15,
    pattern: ['bd bd bd bd','sn ~ sn ~','hh*8 ~ ~ ~','cp*4 bd*4','bd ~ ~ ~','sn ~ sn ~','hh*4 ~ ~ ~','~ ~ ~ cp','bd bd bd bd','sn ~ sn ~','hh*8 ~ ~ ~','cp*4 bd*4','bd ~ ~ ~','sn ~ sn ~','hh*4 ~ ~ ~','~ ~ ~ ~'] }
}
type Preset = keyof typeof PRESETS

/** Browser synthesis only: no samples, Strudel runtime, or desktop wrapper. */
class AudioEngine {
  private context: AudioContext | null = null
  private output: GainNode | null = null
  private sources = new Set<AudioScheduledSourceNode>()

  async resume() {
    if (!this.context) {
      this.context = new AudioContext()
      this.output = this.context.createGain()
      this.output.gain.value = 0.6
      this.output.connect(this.context.destination)
    }
    await this.context.resume()
  }

  private connect(source: AudioScheduledSourceNode, last: AudioNode, duration: number, intermediate?: AudioNode) {
    const context = this.context!
    last.connect(this.output!)
    this.sources.add(source)
    source.onended = () => { this.sources.delete(source); source.disconnect(); intermediate?.disconnect(); last.disconnect() }
    source.start()
    source.stop(context.currentTime + duration)
  }

  note(note: string, duration: number, gain: number, type: OscillatorType = 'sawtooth') {
    if (!this.context) return
    const match = note.match(/^([a-g]#?)(-?\d)$/)!
    const frequencies: Record<string, number> = { c:261.63,'c#':277.18,d:293.66,'d#':311.13,e:329.63,f:349.23,'f#':369.99,g:392,'g#':415.30,a:440,'a#':466.16,b:493.88 }
    const osc = this.context.createOscillator()
    const envelope = this.context.createGain()
    osc.type = type
    osc.frequency.value = frequencies[match[1]] * 2 ** (Number(match[2]) - 4)
    envelope.gain.setValueAtTime(gain, this.context.currentTime)
    envelope.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration)
    osc.connect(envelope)
    this.connect(osc, envelope, duration)
  }

  drum(sound: string) {
    const context = this.context
    if (!context) return
    const now = context.currentTime
    const envelope = context.createGain()
    if (sound === 'bd') {
      const osc = context.createOscillator()
      osc.frequency.setValueAtTime(150, now)
      osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5)
      envelope.gain.setValueAtTime(0.8, now)
      envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
      osc.connect(envelope)
      this.connect(osc, envelope, 0.5)
      return
    }
    const duration = sound === 'hh' ? 0.05 : sound === 'cp' ? 0.1 : 0.2
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
    this.connect(noise, envelope, duration, filter)
    if (sound === 'sn') this.note('f3', 0.2, 0.18, 'triangle')
  }

  stop() {
    // Cancel active tails as well as transport callbacks. No suspended notes to revive.
    for (const source of this.sources) { source.stop(); source.disconnect() }
    this.sources.clear()
  }
}

export interface Instrument {
  resume(): Promise<void>
  stop(): void
  drum(sound: string): void
  note(note: string, duration: number, gain: number, type?: OscillatorType): void
}

export class MeJApp {
  private preset: Preset = 'flow'
  private speed: Speed = 'mid'
  private playing = false
  private ready = false
  private request = 0
  private transport: Transport

  constructor(private root: HTMLElement, private audio: Instrument = new AudioEngine()) {
    this.transport = new Transport(window, sound => this.audio.drum(sound))
    root.innerHTML = `
      <header><a class="wordmark" href="./" aria-label="MeJ home">MeJ<span> / </span></a><span class="edition">A small generative instrument · 0.1</span></header>
      <main>
        <div class="intro"><p class="eyebrow">Make room for a little noise</p><h1>Find your<br><em>own frequency.</em></h1><p>Four starting points. An endless loop.<br>Choose a character, then press play.</p></div>
        <section class="instrument" aria-label="Music controls">
          <div class="readout"><div><p class="eyebrow">Now selected</p><h2 id="preset-name">Flow</h2></div><p class="tempo"><span id="bpm">90</span><span>BPM</span></p></div>
          <div class="step-strip" aria-hidden="true">${Array.from({length:16}, () => '<i></i>').join('')}</div>
          <div class="transport"><button id="play" class="primary" aria-label="Play music" aria-pressed="false"><span aria-hidden="true">▶</span> <span id="play-label">Play</span></button><button id="restart" aria-label="Restart loop from beginning">↺ <span>Restart</span></button><p id="status" role="status" aria-live="polite">Paused</p></div>
          <fieldset class="speed"><legend>Tempo <span>· relative to preset</span></legend>${(['slow','mid','fast'] as const).map(speed => `<label><input type="radio" name="speed" value="${speed}" ${speed === 'mid' ? 'checked' : ''}><span>${speed[0].toUpperCase() + speed.slice(1)}</span></label>`).join('')}</fieldset>
          <fieldset class="presets"><legend>Choose your character</legend>${Object.entries(PRESETS).map(([key,preset], index) => `<label><input type="radio" name="preset" value="${key}" ${key === 'flow' ? 'checked' : ''}><span class="card"><span class="card-number">0${index+1}</span><strong>${preset.name}</strong><span>${preset.description}</span></span></label>`).join('')}</fieldset>
        </section>
        <aside><strong>Just the essentials.</strong> Continuous playback with synthesized drums, bass, chords and occasional melody. Mood shaping, timed tracks, recording and “New Track” generation aren’t available in this version.</aside>
      </main><footer>Made in your browser. No samples, no account.<span>Start with your volume low.</span></footer>`
    root.querySelector('#play')!.addEventListener('click', () => this.playing ? this.pause() : void this.play())
    root.querySelector('#restart')!.addEventListener('click', () => { if (this.playing) this.startLoop() })
    root.querySelectorAll<HTMLInputElement>('input[name="speed"]').forEach(input => input.addEventListener('change', () => {
      this.speed = input.value as Speed
      this.update()
      if (this.playing) this.startLoop()
    }))
    root.querySelectorAll<HTMLInputElement>('input[name="preset"]').forEach(input => input.addEventListener('change', () => {
      this.preset = input.value as Preset
      this.update()
      if (this.playing) this.startLoop()
    }))
    this.update()
  }

  private update() {
    this.root.querySelector('#bpm')!.textContent = String(tempo(PRESETS[this.preset].bpm, this.speed))
    this.root.querySelector('#preset-name')!.textContent = PRESETS[this.preset].name
    this.root.querySelector('#play')!.setAttribute('aria-pressed', String(this.playing))
    this.root.querySelector('#play')!.setAttribute('aria-label', this.playing ? 'Pause music' : 'Play music')
    this.root.querySelector('#play-label')!.textContent = this.playing ? 'Pause' : 'Play'
    this.root.querySelector('#play > span')!.textContent = this.playing ? 'Ⅱ' : '▶'
    this.root.querySelector('#status')!.textContent = this.playing ? 'Playing' : 'Paused'
    this.root.querySelector<HTMLButtonElement>('#restart')!.disabled = !this.playing
    this.root.classList.toggle('is-playing', this.playing)
    if (!this.playing) this.root.querySelectorAll('.step-strip i').forEach(dot => dot.classList.remove('current'))
  }

  private async play() {
    const request = ++this.request
    this.ready = false
    this.playing = true
    this.update()
    this.root.querySelector('#status')!.textContent = 'Starting…'
    try {
      await this.audio.resume()
      if (request !== this.request) return
      this.ready = true
      this.startLoop()
      this.update()
    } catch {
      if (request !== this.request) return
      this.pause()
      this.root.querySelector('#status')!.textContent = 'Audio unavailable. Try Play again in a supported browser.'
    }
  }

  private pause() {
    this.request++
    this.playing = false
    this.ready = false
    this.transport.stop()
    this.audio.stop()
    this.update()
  }

  private startLoop() {
    if (!this.ready) return
    this.audio.stop()
    const preset = PRESETS[this.preset]
    this.transport.start(tempo(preset.bpm, this.speed), preset.pattern, step => {
      this.root.querySelectorAll('.step-strip i').forEach((dot, index) => dot.classList.toggle('current', step === index))
      if (step % 4 === 0) this.audio.note(preset.bass[Math.floor(step / 4)], 0.5, 0.4)
      if (step % 8 === 4) preset.chords[Math.floor(step / 4)].forEach(note => this.audio.note(note, 1, 0.15))
      if (Math.random() < preset.chance) this.audio.note(preset.melody[Math.floor(Math.random() * preset.melody.length)], 0.3, 0.15, 'triangle')
    })
  }
}

const root = document.getElementById('app')
if (root) new MeJApp(root)
