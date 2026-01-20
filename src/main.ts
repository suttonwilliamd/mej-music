// MeJ Music Generator - Pure Web Audio API Implementation

// Musical Configuration per Preset
const PRESET_CONFIG: Record<string, { key: string, scale: string, chords: string[], bpm: number }> = {
  starry: { key: 'A', scale: 'minor pentatonic', chords: ['Am', 'F', 'C', 'G'], bpm: 80 },
  flow: { key: 'C', scale: 'major pentatonic', chords: ['C', 'G', 'Am', 'F'], bpm: 90 },
  glitch: { key: 'D', scale: 'blues', chords: ['Dm', 'G', 'Am', 'E'], bpm: 130 },
  demon: { key: 'E', scale: 'phrygian', chords: ['Em', 'C', 'G', 'D'], bpm: 140 }
}

// Synthesized Drum Generator
class DrumSynth {
  private audioContext: AudioContext | null = null
  
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return this.audioContext
  }
  
  playKick(gain: number = 0.8) {
    if (!this.audioContext) return
    
    const osc = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    osc.frequency.setValueAtTime(150, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5)
    
    gainNode.gain.setValueAtTime(gain, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5)
    
    osc.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    osc.start()
    osc.stop(this.audioContext.currentTime + 0.5)
  }
  
  playSnare(gain: number = 0.6) {
    if (!this.audioContext) return
    
    // Noise burst
    const bufferSize = this.audioContext.sampleRate * 0.2
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    
    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer
    
    const noiseGain = this.audioContext.createGain()
    noiseGain.gain.setValueAtTime(gain * 0.5, this.audioContext.currentTime)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2)
    
    const noiseFilter = this.audioContext.createBiquadFilter()
    noiseFilter.type = 'highpass'
    noiseFilter.frequency.value = 1000
    
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(this.audioContext.destination)
    
    // Tone
    const osc = this.audioContext.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(180, this.audioContext.currentTime)
    
    const oscGain = this.audioContext.createGain()
    oscGain.gain.setValueAtTime(gain * 0.3, this.audioContext.currentTime)
    oscGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1)
    
    osc.connect(oscGain)
    oscGain.connect(this.audioContext.destination)
    
    noise.start()
    osc.start()
    osc.stop(this.audioContext.currentTime + 0.2)
  }
  
  playHiHat(gain: number = 0.3) {
    if (!this.audioContext) return
    
    const bufferSize = this.audioContext.sampleRate * 0.05
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    
    const source = this.audioContext.createBufferSource()
    source.buffer = buffer
    
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 7000
    
    const gainNode = this.audioContext.createGain()
    gainNode.gain.setValueAtTime(gain, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05)
    
    source.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    source.start()
  }
  
  playClap(gain: number = 0.4) {
    if (!this.audioContext) return
    
    // Multiple noise bursts for clap effect
    for (let i = 0; i < 3; i++) {
      const delay = i * 0.01
      const bufferSize = this.audioContext.sampleRate * 0.02
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
      const data = buffer.getChannelData(0)
      for (let j = 0; j < bufferSize; j++) {
        data[j] = Math.random() * 2 - 1
      }
      
      const source = this.audioContext.createBufferSource()
      source.buffer = buffer
      source.start(this.audioContext.currentTime + delay)
      
      const filter = this.audioContext.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 1500
      
      const gainNode = this.audioContext.createGain()
      gainNode.gain.setValueAtTime(gain * (0.3 - i * 0.08), this.audioContext.currentTime + delay)
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + delay + 0.1)
      
      source.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(this.audioContext.destination)
    }
  }
}

// Note to frequency conversion
function noteToFreq(note: string): number {
  const notes: Record<string, number> = {
    'c': 261.63, 'c#': 277.18, 'd': 293.66, 'd#': 311.13, 'e': 329.63,
    'f': 349.23, 'f#': 369.99, 'g': 392.00, 'g#': 415.30, 'a': 440.00,
    'a#': 466.16, 'b': 493.88
  }
  
  const match = note.match(/^([a-g]#?)(-?\d)$/)
  if (!match) return 440
  
  const noteName = match[1].toLowerCase()
  const octave = parseInt(match[2])
  
  const baseFreq = notes[noteName] || 440
  return baseFreq * Math.pow(2, octave - 4)
}

// Oscillator-based synth for notes
class SynthManager {
  private audioContext: AudioContext | null = null
  
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }
  
  playNote(note: string, duration: number, gain: number = 0.3, type: OscillatorType = 'sawtooth') {
    if (!this.audioContext) return
    
    const freq = noteToFreq(note)
    const osc = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    osc.type = type
    osc.frequency.value = freq
    
    gainNode.gain.value = gain
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)
    
    osc.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    osc.start()
    osc.stop(this.audioContext.currentTime + duration)
  }
  
  playChord(chord: string[], duration: number, gain: number = 0.2) {
    chord.forEach(note => {
      this.playNote(note, duration, gain)
    })
  }
}

// Simple Pattern Scheduler
class PatternScheduler {
  private drumSynth: DrumSynth
  private synthManager: SynthManager
  private currentTime = 0
  private isPlaying = false
  private intervalId: number | null = null
  
  constructor() {
    this.drumSynth = new DrumSynth()
    this.synthManager = new SynthManager()
  }
  
  init() {
    this.drumSynth.init()
    this.synthManager.init()
  }
  
  start(bpm: number, pattern: string[], onStep?: (step: number) => void) {
    this.initAudio()
    this.isPlaying = true
    this.currentTime = 0
    
    const stepTime = 60 / bpm / 4 // 16th notes
    
    this.intervalId = window.setInterval(() => {
      if (!this.isPlaying) return
      
      const stepIndex = Math.floor(this.currentTime) % pattern.length
      const patternStr = pattern[stepIndex]
      
      if (onStep) {
        onStep(stepIndex)
      }
      
      this.playPatternStep(patternStr)
      this.currentTime += 0.25 // Advance 1/16th note
    }, stepTime * 1000)
  }
  
  private initAudio() {
    this.drumSynth.init()
    this.synthManager.init()
  }
  
  private playPatternStep(patternStr: string) {
    const sounds = patternStr.split(' ').filter(s => s.trim())
    
    sounds.forEach(sound => {
      if (sound === '~') return // Rest
      
      // Handle repetition like "bd*4" means play bd 4 times
      const match = sound.match(/^([a-z]+)(\*(\d+))?$/)
      if (match) {
        const name = match[1]
        const count = match[3] ? parseInt(match[3]) : 1
        for (let i = 0; i < count; i++) {
          this.playSound(name, i * 0.08)
        }
      }
    })
  }
  
  private playSound(name: string, delay: number) {
    const playFn = () => {
      switch (name) {
        case 'bd':
          this.drumSynth.playKick(0.8)
          break
        case 'sn':
          this.drumSynth.playSnare(0.6)
          break
        case 'hh':
          this.drumSynth.playHiHat(0.25)
          break
        case 'cp':
          this.drumSynth.playClap(0.4)
          break
      }
    }
    
    if (delay > 0) {
      setTimeout(playFn, delay * 1000)
    } else {
      playFn()
    }
  }
  
  playBass(note: string) {
    this.synthManager.playNote(note, 0.5, 0.4, 'sawtooth')
  }
  
  playChord(chord: string[]) {
    this.synthManager.playChord(chord, 1.0, 0.15)
  }
  
  playMelody(note: string) {
    this.synthManager.playNote(note, 0.3, 0.15, 'triangle')
  }
  
  stop() {
    this.isPlaying = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
}

// Main App Class
class MeJApp {
  private scheduler: PatternScheduler | null = null
  private isPlaying = false
  private currentPreset = 'flow'
  private currentMode: 'continuous' | 'track' = 'continuous'
  
  // UI Elements
  private playBtn: HTMLElement | null = null
  private pauseBtn: HTMLElement | null = null
  
  constructor() {
    this.createUI()
    this.attachEvents()
  }
  
  private createUI() {
    const app = document.getElementById('app')!
    app.innerHTML = `
      <div class="header">MeJ</div>
      
      <div class="controls">
        <div class="mode-control">
          <button class="mode-btn active" data-mode="continuous">Continuous</button>
          <button class="mode-btn" data-mode="track">Track</button>
        </div>
        
        <div class="playback-controls">
          <button class="playback-btn" id="prev-btn">◀</button>
          <button class="playback-btn" id="play-btn">▶</button>
          <button class="playback-btn" id="pause-btn" style="display:none">⏸</button>
        </div>
        
        <div class="speed-control">
          <button class="speed-btn" data-speed="slow">Slow</button>
          <button class="speed-btn active" data-speed="mid">Mid</button>
          <button class="speed-btn" data-speed="fast">Fast</button>
        </div>
      </div>

      <div class="mood-parameters">
        <div class="parameter">
          <span class="parameter-label">Energy</span>
          <div class="parameter-slider" data-param="energy">
            <div class="parameter-value" style="left: 50%"></div>
          </div>
        </div>
        
        <div class="parameter">
          <span class="parameter-label">Complexity</span>
          <div class="parameter-slider" data-param="complexity">
            <div class="parameter-value" style="left: 50%"></div>
          </div>
        </div>
        
        <div class="parameter">
          <span class="parameter-label">Atmosphere</span>
          <div class="parameter-slider" data-param="atmosphere">
            <div class="parameter-value" style="left: 50%"></div>
          </div>
        </div>
        
        <div class="parameter">
          <span class="parameter-label">Rhythm Focus</span>
          <div class="parameter-slider" data-param="rhythmFocus">
            <div class="parameter-value" style="left: 50%"></div>
          </div>
        </div>
      </div>

      <div class="presets">
        <button class="preset-btn" data-preset="starry">Starry</button>
        <button class="preset-btn active" data-preset="flow">Flow</button>
        <button class="preset-btn" data-preset="glitch">Glitch</button>
        <button class="preset-btn" data-preset="demon">Demon</button>
        <button class="new-track-btn">🎲 New Track</button>
      </div>
      
      <div class="track-info" id="track-info" style="display: none;">
        <div class="track-timer" id="track-timer">00:00</div>
        <div class="track-status" id="track-status">Ready</div>
      </div>
    `
    
    this.playBtn = document.getElementById('play-btn')
    this.pauseBtn = document.getElementById('pause-btn')
  }
  
  private attachEvents() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        this.setMode(target.dataset.mode as 'continuous' | 'track')
      })
    })
    
    this.playBtn?.addEventListener('click', () => this.play())
    this.pauseBtn?.addEventListener('click', () => this.pause())
    document.getElementById('prev-btn')?.addEventListener('click', () => this.previousTrack())
    
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        const speed = target.dataset.speed || 'mid'
        this.setSpeed(speed)
      })
    })
    
    document.querySelectorAll('.parameter-slider').forEach(slider => {
      slider.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        const param = target.dataset.param
        if (param && target.classList.contains('parameter-slider')) {
          const rect = target.getBoundingClientRect()
          const x = (e as MouseEvent).clientX - rect.left
          const value = Math.round((x / rect.width) * 100)
          this.setParameter(param, value)
        }
      })
    })
    
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        const preset = target.dataset.preset
        if (preset) {
          this.setPreset(preset)
        }
      })
    })
    
    document.querySelector('.new-track-btn')?.addEventListener('click', () => {
      this.generateNewTrack()
    })
  }
  
  private play() {
    this.scheduler = new PatternScheduler()
    
    this.isPlaying = true
    if (this.playBtn) this.playBtn.style.display = 'none'
    if (this.pauseBtn) this.pauseBtn.style.display = 'block'
    
    const config = PRESET_CONFIG[this.currentPreset]
    
    this.scheduler.start(config.bpm, this.getDrumPattern(), (step) => {
      this.onBeat(step)
    })
    
    console.log(`Playing ${this.currentPreset} at ${config.bpm} BPM`)
  }
  
  private pause() {
    this.isPlaying = false
    if (this.playBtn) this.playBtn.style.display = 'block'
    if (this.pauseBtn) this.pauseBtn.style.display = 'none'
    
    if (this.scheduler) {
      this.scheduler.stop()
      this.scheduler = null
    }
    
    console.log('Paused')
  }
  
  private previousTrack() {
    this.pause()
    this.play()
  }
  
  private setSpeed(speed: string) {
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.classList.remove('active')
    })
    document.querySelector(`[data-speed="${speed}"]`)?.classList.add('active')
    
    if (this.isPlaying) {
      this.pause()
      this.play()
    }
  }
  
  private setParameter(param: string, value: number) {
    const slider = document.querySelector(`[data-param="${param}"]`)
    if (slider) {
      const valueElement = slider.querySelector('.parameter-value') as HTMLElement
      if (valueElement) {
        valueElement.style.left = `${value}%`
      }
    }
    
    console.log(`Parameter ${param}: ${value}`)
  }
  
  private setMode(mode: 'continuous' | 'track') {
    this.currentMode = mode
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active')
    })
    document.querySelector(`[data-mode="${mode}"]`)?.classList.add('active')
    
    const trackInfo = document.getElementById('track-info')
    if (trackInfo) {
      trackInfo.style.display = mode === 'track' ? 'block' : 'none'
    }
  }
  
  private setPreset(preset: string) {
    this.currentPreset = preset
    
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.remove('active')
    })
    document.querySelector(`[data-preset="${preset}"]`)?.classList.add('active')
    
    const presets: Record<string, { energy: number, complexity: number, atmosphere: number, rhythm: number }> = {
      starry: { energy: 60, complexity: 50, atmosphere: 80, rhythm: 30 },
      flow: { energy: 50, complexity: 30, atmosphere: 50, rhythm: 25 },
      glitch: { energy: 70, complexity: 80, atmosphere: 40, rhythm: 75 },
      demon: { energy: 85, complexity: 75, atmosphere: 20, rhythm: 80 }
    }
    
    const values = presets[preset]
    if (values) {
      this.setParameter('energy', values.energy)
      this.setParameter('complexity', values.complexity)
      this.setParameter('atmosphere', values.atmosphere)
      this.setParameter('rhythmFocus', values.rhythm)
    }
    
    if (this.isPlaying) {
      this.pause()
      this.play()
    }
  }
  
  private generateNewTrack() {
    if (this.isPlaying) {
      this.pause()
      this.play()
    }
  }
  
  private getDrumPattern(): string[] {
    const patterns: Record<string, string[]> = {
      starry: [
        "bd ~ ~ ~", "~ ~ sn ~", "hh ~ hh ~", "~ ~ ~ cp",
        "bd ~ ~ ~", "~ sn ~ ~", "hh ~ hh ~", "~ ~ ~ ~",
        "bd ~ ~ ~", "~ ~ sn ~", "hh ~ hh ~", "~ ~ ~ cp",
        "bd ~ ~ ~", "~ sn ~ ~", "hh ~ hh ~", "~ ~ ~ ~"
      ],
      flow: [
        "bd ~ bd ~", "~ sn ~ ~", "hh ~ hh ~", "~ ~ ~ cp",
        "bd ~ ~ ~", "~ ~ sn ~", "hh ~ hh ~", "~ ~ ~ ~",
        "bd ~ bd ~", "~ sn ~ ~", "hh ~ hh ~", "~ ~ ~ cp",
        "bd ~ ~ ~", "~ ~ sn ~", "hh ~ hh ~", "~ ~ ~ ~"
      ],
      glitch: [
        "bd*2 ~ bd sn", "sn*4 ~ ~ ~", "hh*8 ~ ~ ~", "cp*4 ~ ~ ~",
        "bd ~ ~ ~", "sn ~ sn ~", "hh*4 ~ ~ ~", "~ ~ ~ cp",
        "bd*2 ~ bd sn", "sn*4 ~ ~ ~", "hh*8 ~ ~ ~", "cp*4 ~ ~ ~",
        "bd ~ ~ sn", "sn ~ ~ ~", "hh*4 ~ ~ ~", "~ ~ ~ ~"
      ],
      demon: [
        "bd bd bd bd", "sn ~ sn ~", "hh*8 ~ ~ ~", "cp*4 bd*4",
        "bd ~ ~ ~", "sn ~ sn ~", "hh*4 ~ ~ ~", "~ ~ ~ cp",
        "bd bd bd bd", "sn ~ sn ~", "hh*8 ~ ~ ~", "cp*4 bd*4",
        "bd ~ ~ ~", "sn ~ sn ~", "hh*4 ~ ~ ~", "~ ~ ~ ~"
      ]
    }
    
    return patterns[this.currentPreset] || patterns.flow
  }
  
  private getChordForStep(step: number): string[] {
    const config = PRESET_CONFIG[this.currentPreset]
    const chordIndex = Math.floor(step / 4) % config.chords.length
    const chordName = config.chords[chordIndex]
    
    const chordMap: Record<string, string[]> = {
      'C': ['c4', 'e4', 'g4'],
      'G': ['g3', 'b3', 'd4'],
      'Am': ['a3', 'c4', 'e4'],
      'F': ['f3', 'a3', 'c4'],
      'Dm': ['d3', 'f3', 'a3'],
      'Em': ['e3', 'g3', 'b3'],
      'E': ['e3', 'g#3', 'b3']
    }
    
    return chordMap[chordName] || ['c4', 'e4', 'g4']
  }
  
  private getBassNote(step: number): string {
    const bassMap: Record<string, string[]> = {
      'starry': ['a1', 'f1', 'c2', 'g1'],
      'flow': ['c2', 'g1', 'a1', 'f1'],
      'glitch': ['d2', 'g1', 'a1', 'e2'],
      'demon': ['e1', 'c2', 'g1', 'd2']
    }
    
    const bassPattern = bassMap[this.currentPreset] || bassMap.flow
    const noteIndex = Math.floor(step / 4) % bassPattern.length
    return bassPattern[noteIndex]
  }
  
  private onBeat(step: number) {
    if (!this.scheduler) return
    
    // Play bass on beat 1 and 3
    if (step % 4 === 0 || step % 4 === 8) {
      const bassNote = this.getBassNote(step)
      this.scheduler.playBass(bassNote)
    }
    
    // Play chords on certain steps
    if (step % 8 === 4) {
      const chord = this.getChordForStep(step)
      this.scheduler.playChord(chord)
    }
    
    // Play melody occasionally based on preset
    const melodyChance: Record<string, number> = {
      'starry': 0.1,
      'flow': 0.05,
      'glitch': 0.2,
      'demon': 0.15
    }
    
    if (Math.random() < (melodyChance[this.currentPreset] || 0.1)) {
      const melodyNotes: Record<string, string[]> = {
        'starry': ['a4', 'c5', 'b4', 'c5'],
        'flow': ['c5', 'e4', 'g4', 'c4'],
        'glitch': ['g4', 'b4', 'd5', 'b4'],
        'demon': ['e3', 'g3', 'b3', 'e4']
      }
      
      const notes = melodyNotes[this.currentPreset] || melodyNotes.flow
      const note = notes[Math.floor(Math.random() * notes.length)]
      this.scheduler.playMelody(note)
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new MeJApp()
})
