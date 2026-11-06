import './style.css'
import { Transport, tempo, type Speed } from './transport'
import { decodeSession, defaultSession, encodeSession, MAX_PROJECT_BYTES, SESSION_KEY, type Preset, type Session } from './session'

import { AudioEngine, PRESETS, stepNotes } from './music'
import { renderWav } from './wav'

export interface Instrument {
  resume(): Promise<void>
  setVolume(volume: number, muted: boolean): void
  stop(): void
  drum(sound: string): void
  note(note: string, duration: number, gain: number, type?: OscillatorType): void
}

export class MeJApp {
  private preset: Preset
  private speed: Speed
  private playing = false
  private ready = false
  private request = 0
  private transport: Transport
  // One session-wide groove mask. Preset/tempo/restart/pause do not replace edits.
  private mask: boolean[]
  private importRequest = 0
  private volume: number
  private muted: boolean
  private exportRevision = 0
  private exporting = false

  constructor(private root: HTMLElement, private audio: Instrument = new AudioEngine(), private renderAudio = renderWav) {
    this.transport = new Transport(window, sound => this.audio.drum(sound))
    let session = defaultSession()
    let storageMessage = 'Changes save automatically in this browser. Downloads are portable.'
    try {
      const saved = window.localStorage.getItem(SESSION_KEY)
      if (saved !== null) {
        try {
          session = decodeSession(saved)
          storageMessage = 'Saved session restored, paused. Changes save automatically in this browser.'
        } catch {
          storageMessage = 'Saved session is invalid or unsupported. Using defaults; it is replaced only when you edit, import or reset.'
        }
      }
    } catch {
      storageMessage = 'Browser storage unavailable. You can still play and download projects; changes may not survive reload.'
    }
    this.preset = session.preset
    this.speed = session.speed
    this.mask = session.steps
    this.volume = session.volume
    this.muted = session.muted
    root.innerHTML = `
      <header><a class="wordmark" href="./" aria-label="MeJ home">MeJ<span> / </span></a><span class="edition">A small generative instrument · 0.1</span></header>
      <main>
        <div class="intro"><p class="eyebrow">Make room for a little noise</p><h1>Find your<br><em>own frequency.</em></h1><p>Four starting points. An endless loop.<br>Choose a character. Shape its steps. Press play.</p></div>
        <section class="instrument" aria-label="Music controls">
          <div class="readout"><div><p class="eyebrow">Now selected</p><h2 id="preset-name">Flow</h2></div><p class="tempo"><span id="bpm">90</span><span>BPM</span></p></div>
          <fieldset class="pattern-editor" aria-describedby="pattern-help">
            <legend>Shape your loop <span>· 16 groove steps</span></legend>
            <p id="pattern-help">On lets the preset play; off skips all voices at that step. Edits affect future steps, not notes or repeats already started.</p>
            <div class="step-grid">${Array.from({length:16}, (_, index) => `<button type="button" class="step-toggle" aria-label="Step ${index + 1}" aria-pressed="true" data-step="${index}"><span>${String(index + 1).padStart(2, '0')}</span><span class="step-state">On</span></button>`).join('')}</div>
            <div class="pattern-actions"><p id="pattern-summary">16 of 16 steps on</p><button id="reset-pattern" type="button">Restore default pattern</button></div>
            <p class="pattern-hint">Default = all steps on. Restore keeps your character, tempo and play position.</p>
          </fieldset>
          <div class="transport"><button id="play" class="primary" aria-label="Play music" aria-pressed="false"><span aria-hidden="true">▶</span> <span id="play-label">Play</span></button><button id="restart" aria-label="Restart loop from beginning">↺ <span>Restart</span></button><p id="status" role="status" aria-live="polite">Paused</p></div>
          <fieldset class="master-volume" aria-describedby="volume-help">
            <legend>Master output</legend>
            <label for="volume">Volume <output id="volume-value" for="volume" aria-hidden="true">100%</output></label>
            <input id="volume" type="range" min="0" max="100" step="1" value="100">
            <button id="mute" type="button" aria-pressed="false" aria-label="Mute output">Mute output</button>
            <p id="volume-state">Output on · 100%</p>
            <p id="volume-help">Live level, including sounding notes. 100% keeps the original output ceiling. Start with device volume low.</p>
          </fieldset>
          <fieldset class="speed"><legend>Tempo <span>· relative to preset</span></legend>${(['slow','mid','fast'] as const).map(speed => `<label><input type="radio" name="speed" value="${speed}" ${speed === 'mid' ? 'checked' : ''}><span>${speed[0].toUpperCase() + speed.slice(1)}</span></label>`).join('')}</fieldset>
          <fieldset class="presets"><legend>Choose your character</legend>${Object.entries(PRESETS).map(([key,preset], index) => `<label><input type="radio" name="preset" value="${key}" ${key === 'flow' ? 'checked' : ''}><span class="card"><span class="card-number">0${index+1}</span><strong>${preset.name}</strong><span>${preset.description}</span></span></label>`).join('')}</fieldset>
          <section class="session-files" aria-labelledby="wav-heading">
            <h3 id="wav-heading">Take one loop with you</h3>
            <p id="wav-help">One 16-step snapshot from the beginning, with natural note tails. Stereo 44.1 kHz / 16-bit WAV, made locally. Not a recording or seamless loop; randomness can differ.</p>
            <button id="download-wav" type="button" aria-describedby="wav-help">Download WAV</button>
            <p id="wav-status" aria-live="polite"></p>
            <p id="wav-error" role="alert"></p>
          </section>
          <section class="session-files" aria-labelledby="session-heading">
            <h3 id="session-heading">Keep your session</h3>
            <p id="session-help">Character, tempo, steps, volume and mute. Import and reset pause playback. Reload never starts audio.</p>
            <div class="session-actions"><button id="download-project" type="button">Download project JSON</button><button id="reset-session" type="button">Reset session to defaults</button></div>
            <label for="import-project">Import project JSON <span>· replaces this session after validation</span></label>
            <input id="import-project" type="file" accept=".json,application/json" aria-describedby="session-help">
            <p id="storage-status" aria-live="polite"></p>
            <p id="project-status" aria-live="polite"></p>
            <p id="project-error" role="alert"></p>
          </section>
        </section>
        <aside><strong>Just the essentials.</strong> Continuous playback with synthesized drums, bass, chords and occasional melody. Mood shaping, timed tracks, recording and “New Track” generation aren’t available in this version.</aside>
      </main><footer>Made in your browser. No samples, no account.<span>Start with your volume low.</span></footer>`
    root.querySelectorAll<HTMLButtonElement>('.step-toggle').forEach(button => button.addEventListener('click', () => {
      const step = Number(button.dataset.step)
      this.mask[step] = !this.mask[step]
      this.updatePattern()
      this.saveSession()
    }))
    root.querySelector('#reset-pattern')!.addEventListener('click', () => {
      this.mask.fill(true)
      this.updatePattern()
      this.saveSession()
    })
    root.querySelector('#play')!.addEventListener('click', () => this.playing ? this.pause() : void this.play())
    root.querySelector('#restart')!.addEventListener('click', () => { if (this.playing) this.startLoop() })
    root.querySelector<HTMLInputElement>('#volume')!.addEventListener('input', event => {
      this.volume = Number((event.target as HTMLInputElement).value)
      this.updateOutput()
      this.saveSession()
    })
    root.querySelector('#mute')!.addEventListener('click', () => {
      this.muted = !this.muted
      this.updateOutput()
      this.saveSession()
    })
    root.querySelectorAll<HTMLInputElement>('input[name="speed"]').forEach(input => input.addEventListener('change', () => {
      this.speed = input.value as Speed
      this.update()
      this.saveSession()
      if (this.playing) this.startLoop()
    }))
    root.querySelectorAll<HTMLInputElement>('input[name="preset"]').forEach(input => input.addEventListener('change', () => {
      this.preset = input.value as Preset
      this.update()
      this.saveSession()
      if (this.playing) this.startLoop()
    }))
    root.querySelector('#storage-status')!.textContent = storageMessage
    root.querySelector('#download-project')!.addEventListener('click', () => this.downloadProject())
    root.querySelector('#download-wav')!.addEventListener('click', () => void this.downloadWav())
    root.querySelector('#import-project')!.addEventListener('change', event => {
      const input = event.target as HTMLInputElement
      const file = input.files?.[0]
      input.value = ''
      if (file) void this.importProject(file)
    })
    root.querySelector('#reset-session')!.addEventListener('click', () => {
      this.importRequest++
      this.replaceSession(defaultSession())
      this.projectFeedback('Session reset: Flow, Mid, all 16 steps on, volume 100%, output unmuted. Paused.')
    })
    this.updateOutput()
    this.updatePattern()
    this.update()
  }

  private snapshot(): Session {
    return { version: 2, preset: this.preset, speed: this.speed, steps: [...this.mask], volume: this.volume, muted: this.muted }
  }

  private saveSession() {
    this.invalidateExport()
    try {
      window.localStorage.setItem(SESSION_KEY, encodeSession(this.snapshot()))
      this.root.querySelector('#storage-status')!.textContent = 'Session saved in this browser. Download a project to keep a portable copy.'
    } catch {
      this.root.querySelector('#storage-status')!.textContent = 'Session not saved: browser storage unavailable or full. You can still play and download your project.'
    }
  }

  private projectFeedback(message: string, error = false) {
    this.root.querySelector('#project-error')!.textContent = error ? message : ''
    this.root.querySelector('#project-status')!.textContent = error ? '' : message
  }

  private replaceSession(session: Session) {
    this.pause() // Invalidates pending resume and cancels active tails/repetitions.
    this.preset = session.preset
    this.speed = session.speed
    this.mask = session.steps
    this.volume = session.volume
    this.muted = session.muted
    this.updateOutput()
    this.updatePattern()
    this.update()
    this.saveSession()
  }

  private async importProject(file: File) {
    this.invalidateExport()
    const request = ++this.importRequest
    try {
      if (file.size > MAX_PROJECT_BYTES) throw new Error('Project exceeds the 4 KiB limit.')
      const session = decodeSession(await file.text())
      if (request !== this.importRequest) return
      this.replaceSession(session)
      this.projectFeedback('Project imported. Paused; press Play when ready.')
    } catch (error) {
      if (request !== this.importRequest) return
      this.projectFeedback(`Import failed. Current session and playback unchanged. ${error instanceof Error ? error.message : 'File could not be read.'}`, true)
    }
  }

  private downloadProject() {
    let url: string | undefined
    try {
      const blob = new Blob([encodeSession(this.snapshot())], { type: 'application/json' })
      url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'mej-project.json'
      this.root.append(link)
      link.click()
      link.remove()
      this.projectFeedback('Project download requested. Keep the JSON file to import on another browser.')
    } catch {
      this.projectFeedback('Download unavailable in this browser. Your session and playback are unchanged.', true)
    } finally {
      if (url) window.setTimeout(() => URL.revokeObjectURL(url!), 0)
    }
  }

  private invalidateExport() {
    this.exportRevision++
    this.root.querySelector('#wav-error')!.textContent = ''
    this.root.querySelector('#wav-status')!.textContent = this.exporting ? 'Export canceled by session change. Wait for rendering to finish, then download again.' : ''
  }

  private async downloadWav() {
    if (this.exporting) return
    const revision = this.exportRevision
    const snapshot = this.snapshot()
    const button = this.root.querySelector<HTMLButtonElement>('#download-wav')!
    this.exporting = true
    button.disabled = true
    this.root.querySelector('#wav-error')!.textContent = ''
    this.root.querySelector('#wav-status')!.textContent = 'Rendering one loop locally… Music controls remain available.'
    let url: string | undefined
    try {
      const bytes = await this.renderAudio(snapshot)
      if (revision !== this.exportRevision) return
      url = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `mej-${snapshot.preset}-${snapshot.speed}.wav`
      this.root.append(link)
      link.click()
      link.remove()
      this.root.querySelector('#wav-status')!.textContent = 'WAV download requested. One finite snapshot, not a recording or seamless loop.'
    } catch {
      if (revision !== this.exportRevision) return
      this.root.querySelector('#wav-status')!.textContent = ''
      this.root.querySelector('#wav-error')!.textContent = 'WAV export failed or is unavailable in this browser. Session and playback unchanged. Try Download WAV again in a supported browser.'
    } finally {
      if (url) window.setTimeout(() => URL.revokeObjectURL(url!), 0)
      this.exporting = false
      button.disabled = false
      if (revision !== this.exportRevision) this.root.querySelector('#wav-status')!.textContent = 'Export canceled by session change. Download WAV again for the current settings.'
    }
  }

  private updateOutput() {
    this.audio.setVolume(this.volume, this.muted)
    this.root.querySelector<HTMLInputElement>('#volume')!.value = String(this.volume)
    this.root.querySelector('#volume-value')!.textContent = `${this.volume}%`
    this.root.querySelector('#volume')!.setAttribute('aria-valuetext', `${this.volume}%${this.muted ? ', output muted' : ''}`)
    const mute = this.root.querySelector<HTMLButtonElement>('#mute')!
    mute.setAttribute('aria-pressed', String(this.muted))
    mute.textContent = this.muted ? 'Unmute output' : 'Mute output'
    mute.setAttribute('aria-label', mute.textContent)
    this.root.querySelector('#volume-state')!.textContent = this.muted ? `Muted · selected ${this.volume}%` : this.volume === 0 ? 'Silent · volume 0%' : `Output on · ${this.volume}%`
  }

  private updatePattern() {
    this.root.querySelectorAll<HTMLButtonElement>('.step-toggle').forEach((button, index) => {
      button.setAttribute('aria-pressed', String(this.mask[index]))
      button.querySelector('.step-state')!.textContent = this.mask[index] ? 'On' : 'Off'
    })
    this.root.querySelector('#pattern-summary')!.textContent = `${this.mask.filter(Boolean).length} of 16 steps on`
  }

  private update() {
    this.root.querySelectorAll<HTMLInputElement>('input[name="preset"]').forEach(input => { input.checked = input.value === this.preset })
    this.root.querySelectorAll<HTMLInputElement>('input[name="speed"]').forEach(input => { input.checked = input.value === this.speed })
    this.root.querySelector('#bpm')!.textContent = String(tempo(PRESETS[this.preset].bpm, this.speed))
    this.root.querySelector('#preset-name')!.textContent = PRESETS[this.preset].name
    this.root.querySelector('#play')!.setAttribute('aria-pressed', String(this.playing))
    this.root.querySelector('#play')!.setAttribute('aria-label', this.playing ? 'Pause music' : 'Play music')
    this.root.querySelector('#play-label')!.textContent = this.playing ? 'Pause' : 'Play'
    this.root.querySelector('#play > span')!.textContent = this.playing ? 'Ⅱ' : '▶'
    this.root.querySelector('#status')!.textContent = this.playing ? 'Playing' : 'Paused'
    this.root.querySelector<HTMLButtonElement>('#restart')!.disabled = !this.playing
    this.root.classList.toggle('is-playing', this.playing)
    if (!this.playing) this.root.querySelectorAll('.step-toggle').forEach(dot => dot.classList.remove('current'))
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
    this.transport.start(tempo(preset.bpm, this.speed), preset.pattern, (step, enabled) => {
      this.root.querySelectorAll('.step-toggle').forEach((dot, index) => dot.classList.toggle('current', step === index))
      if (!enabled) return
      for (const note of stepNotes(this.preset, step)) this.audio.note(...note)
    }, step => this.mask[step])
  }
}

const root = document.getElementById('app')
if (root) new MeJApp(root)
