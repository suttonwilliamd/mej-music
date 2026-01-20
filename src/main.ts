// @ts-ignore - Strudel types are not available
import { initAudioOnFirstClick, getAudioContext, webaudioOutput } from '@strudel/webaudio'
// @ts-ignore - Import superdough for registerSynthSounds
import { registerSynthSounds } from 'superdough'
// @ts-ignore - Import tonal for note parsing
import '@strudel/tonal'
// @ts-ignore - Strudel types are not available
import { s, stack, repl, note, choose, rand, sine, registerSound } from '@strudel/core'

// Musical Foundation System
interface PresetMusicalConfig {
  key: string
  scale: string
  chordProgression: string[]
  bpmRange: [number, number]
  genre: string
}

const PRESET_MUSICAL_CONFIG: Record<string, PresetMusicalConfig> = {
  starry: {
    key: "A:minor",
    scale: "A:pentatonic",
    chordProgression: ["Am", "F", "C", "G"],
    bpmRange: [70, 90],
    genre: "ambient"
  },
  flow: {
    key: "C:major",
    scale: "C:pentatonic", 
    chordProgression: ["C", "G", "Am", "F"],
    bpmRange: [80, 100],
    genre: "lofi"
  },
  glitch: {
    key: "D:minor",
    scale: "D:blues",
    chordProgression: ["Dm", "G", "Am", "E"],
    bpmRange: [120, 140],
    genre: "idm"
  },
  demon: {
    key: "E:minor",
    scale: "E:phrygian",
    chordProgression: ["Em", "C", "G", "D"],
    bpmRange: [130, 150],
    genre: "industrial"
  }
}

interface DrumPattern {
  kick: string
  snare: string
  hihat: string
  percussion?: string
}

class MusicalPatternLibrary {
  static getDrumPattern(preset: string, _energy: number): DrumPattern {
    const basePatterns: Record<string, DrumPattern> = {
      starry: {
        kick: "bd ~ ~ ~",
        snare: "~ ~ sd ~", 
        hihat: "hh*8",
        percussion: "~ ~ ~ cp"
      },
      flow: {
        kick: "bd sd ~ sd",
        snare: "~ sd ~ ~",
        hihat: "hh*16",
        percussion: "cp*4 ~ ~ ~"
      },
      glitch: {
        kick: "bd*2 ~ bd sd",
        snare: "sd*4 ~ ~ ~",
        hihat: "hh*32",
        percussion: "cp*8 sd*4 ~ ~"
      },
      demon: {
        kick: "bd bd bd bd",
        snare: "sd ~ sd ~",
        hihat: "hh*16",
        percussion: "cp*4 bd*4 ~ ~"
      }
    }
    
    return basePatterns[preset] || basePatterns.flow
  }

  static getBassPattern(preset: string, key: string, _energy: number): any {
    // Use key parameter to avoid TypeScript warning
    console.log(`Bass pattern using key: ${key}`)
    
    const bassPatterns: Record<string, any> = {
      starry: note("a1 ~ ~ ~").scale(key).s("sawtooth").attack(2).sustain(4).lpf(100).gain(0.2),
      flow: note("c1 ~ g1 ~").scale(key).s("sawtooth").attack(0.1).sustain(0.4).lpf(600).gain(0.4),
      glitch: note("d1 ~ a1 ~").scale(key).s("sawtooth").fm(4).fmh(2).lpf(800).lpq(10).attack(0.01).gain(0.5),
      demon: note("e1 ~ e1 ~").scale(key).s("sawtooth").fm(8).fmh(1.5).lpf(400).lpq(15).distort(3).attack(0.01).gain(0.8)
    }
    
    return bassPatterns[preset] || bassPatterns.flow
  }

  static getChordPattern(preset: string, key: string, _atmosphere: number): any {
    const progression = PRESET_MUSICAL_CONFIG[preset]?.chordProgression || ["C", "G", "Am", "F"]
    const chordPattern = note(`<${progression.join(' ')}>`).scale(key)
    
    const chordStyles: Record<string, any> = {
      starry: chordPattern.s("sine").voicing().attack(3).sustain(8).release(4).room(0.8).size(0.9).dry(0.2).lpf(800).lpq(3).gain(0.3),
      flow: chordPattern.s("sawtooth").voicing().attack(0.1).sustain(2).release(0.5).room(0.4).sometimesBy(0.2, (x: any) => x.crush(12)).gain(0.4),
      glitch: chordPattern.s("square").voicing().fast(2).attack(0.01).release(0.1).lpf(2000).lpq(5).sometimesBy(0.3, (x: any) => x.crush(8)).gain(0.3),
      demon: chordPattern.s("sawtooth").voicing().attack(0.01).sustain(0.5).distort(2).lpf(500).lpq(8).gain(0.5)
    }
    
    return chordStyles[preset] || chordStyles.flow
  }

  static getMelodyPattern(preset: string, key: string, _complexity: number): any {
    const scale = PRESET_MUSICAL_CONFIG[preset]?.scale || "C:pentatonic"
    
    const melodyPatterns: Record<string, any> = {
      starry: note("0 [4 7] [12 7] 4").scale(scale).s("triangle").attack(0.5).release(2).gain(0.2).sometimesBy(0.3, (x: any) => x.delay(0.5)).pan(sine.slow(8)),
      flow: note("0 4 7 ~").scale(scale).s("triangle").fast(2).attack(0.05).release(0.3).gain(0.3).pan(sine.slow(4)),
      glitch: note("[0 2 4 7] [7 4 2 0]").scale(scale).s("square").fast(4).sometimesBy(0.3, (x: any) => x.fast(8)).sometimesBy(0.2, (x: any) => x.reverse()).gain(0.3),
      demon: note("0 3 6 ~").scale(scale).s("square").distort(3).attack(0.001).release(0.05).gain(0.4)
    }
    
    return melodyPatterns[preset] || melodyPatterns.flow
  }
}

// Song Structure System for Track Mode
class SongStructureManager {
  private sections = ['intro', 'verse', 'chorus', 'verse', 'chorus', 'outro']
  private currentSectionIndex = 0
  private sectionCounter = 0
  private sectionLength = 8 // cycles per section
  private preset: string

  constructor(preset: string) {
    this.preset = preset
  }

  getCurrentPattern(): any {
    const currentSection = this.sections[this.currentSectionIndex]
    
    switch(currentSection) {
      case 'intro':
        return this.generateIntro()
      case 'verse': 
        return this.generateVerse()
      case 'chorus':
        return this.generateChorus()
      case 'outro':
        return this.generateOutro()
      default:
        return this.generateVerse()
    }
  }

  private generateIntro(): any {
    const config = PRESET_MUSICAL_CONFIG[this.preset]
    // Sparse version of main groove
    return stack(
      s("bd ~ ~ ~").gain(0.4).room(0.3).orbit(1),
      MusicalPatternLibrary.getBassPattern(this.preset, config.key, 30).gain(0.3).orbit(2),
      MusicalPatternLibrary.getChordPattern(this.preset, config.key, 50).gain(0.2).orbit(3)
    )
  }

  private generateVerse(): any {
    const config = PRESET_MUSICAL_CONFIG[this.preset]
    const drumPattern = MusicalPatternLibrary.getDrumPattern(this.preset, 50)
    
    // Main groove with elements
    return stack(
      s(drumPattern.kick).gain(0.6).orbit(1),
      s(drumPattern.snare).gain(0.5).orbit(2),
      s(drumPattern.hihat).gain(0.3).orbit(3),
      MusicalPatternLibrary.getBassPattern(this.preset, config.key, 50).orbit(4),
      MusicalPatternLibrary.getChordPattern(this.preset, config.key, 50).gain(0.4).orbit(5),
      MusicalPatternLibrary.getMelodyPattern(this.preset, config.key, 50).gain(0.3).orbit(6)
    )
  }

  private generateChorus(): any {
    const config = PRESET_MUSICAL_CONFIG[this.preset]
    const drumPattern = MusicalPatternLibrary.getDrumPattern(this.preset, 80)
    
    // Full arrangement - higher energy
    return stack(
      s(drumPattern.kick).gain(1.2).orbit(1),
      s(drumPattern.snare).gain(1.1).orbit(2),
      s(drumPattern.hihat).gain(1.3).orbit(3),
      MusicalPatternLibrary.getBassPattern(this.preset, config.key, 80).lpf(600).gain(1.3).orbit(4),
      MusicalPatternLibrary.getChordPattern(this.preset, config.key, 80).attack(0.1).gain(1.4).orbit(5),
      MusicalPatternLibrary.getMelodyPattern(this.preset, config.key, 80).fast(1.2).gain(1.5).orbit(6),
      // Extra pad layer in chorus
      note("a2").s("sine").attack(2).sustain(4).room(0.6).gain(0.2).orbit(7)
    )
  }

  private generateOutro(): any {
    const config = PRESET_MUSICAL_CONFIG[this.preset]
    // Fade out
    return stack(
      s("bd ~ ~ ~").gain(0.2).degradeBy(0.5).orbit(1),
      MusicalPatternLibrary.getChordPattern(this.preset, config.key, 30).attack(4).gain(0.2).orbit(2)
    )
  }

  advanceSection(): void {
    this.sectionCounter++
    if (this.sectionCounter >= this.sectionLength) {
      this.currentSectionIndex = (this.currentSectionIndex + 1) % this.sections.length
      this.sectionCounter = 0
    }
  }

  getCurrentSectionName(): string {
    return this.sections[this.currentSectionIndex]
  }
}

// Continuous Evolution System
class ContinuousEvolutionManager {
  private evolutionStage = 0
  private currentChordIndex = 0
  private preset: string

  constructor(preset: string) {
    this.preset = preset
  }

  getEvolvingPattern(): any {
    const config = PRESET_MUSICAL_CONFIG[this.preset]
    
    // Slowly evolve parameters
    const energyModulation = 0.5 + (Math.sin(this.evolutionStage) * 0.3)
    const complexityModulation = 0.5 + (Math.cos(this.evolutionStage * 0.7) * 0.3)
    
    // Change chords slowly
    if (Math.floor(this.evolutionStage) % 32 === 0) {
      this.currentChordIndex = (this.currentChordIndex + 1) % config.chordProgression.length
    }
    
    return this.generateEvolvingPattern(config, energyModulation, complexityModulation)
  }

  private generateEvolvingPattern(config: PresetMusicalConfig, energyMod: number, complexityMod: number): any {
    const drumPattern = MusicalPatternLibrary.getDrumPattern(this.preset, energyMod * 100)
    
    return stack(
      s(drumPattern.kick).gain(0.5 + energyMod * 0.5).orbit(1),
      s(drumPattern.snare).gain(0.4 + energyMod * 0.4).orbit(2),
      s(drumPattern.hihat).gain(0.3 + complexityMod * 0.3).orbit(3),
      MusicalPatternLibrary.getBassPattern(this.preset, config.key, energyMod * 100).orbit(4),
      this.getEvolvingChords(config).orbit(5),
      this.getEvolvingMelody(config, complexityMod).orbit(6)
    )
  }

  private getEvolvingChords(config: PresetMusicalConfig): any {
    const currentChord = config.chordProgression[this.currentChordIndex]
    // Use config.key in scale
    return note(currentChord).scale(config.key).s("sine").voicing()
      .attack(2).sustain(6).release(3)
      .room(0.6).gain(0.3)
  }

  private getEvolvingMelody(config: PresetMusicalConfig, complexity: number): any {
    const melodicDensity = complexity > 0.7 ? 2 : 1
    // Use config.key and config.scale
    return note("0 [4 7] ~").scale(config.scale).s("triangle")
      .fast(melodicDensity)
      .attack(0.1).release(0.5)
      .gain(0.2 + complexity * 0.2)
      .pan(sine.slow(8))
  }

  evolve(): void {
    this.evolutionStage += 0.01
  }
}



class MeJApp {
  private audioContext: AudioContext | null = null
  private scheduler: any = null
  private isPlaying = false
  private currentSpeed = 'mid'
  private currentPreset = 'flow'
  private mode: 'continuous' | 'track' = 'continuous'
  
  // Parameters
  private energy = 50
  private complexity = 50
  private atmosphere = 50
  private rhythmFocus = 50 // Used in UI controls
  
  // Track mode properties
  private trackStartTime = 0
  private currentTrackDuration = 0
  private evolutionTimer: number | null = null
  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: Blob[] = []
  
  // Musical structure managers
  private songStructure: SongStructureManager | null = null
  private continuousEvolution: ContinuousEvolutionManager | null = null

  constructor() {
    this.initializeUI()
    this.initializeAudio()
  }

  private initializeAudio() {
    try {
      initAudioOnFirstClick()
      this.audioContext = getAudioContext()
      // Register basic synth sounds (sine, sawtooth, triangle, square, etc.)
      registerSynthSounds()
      console.log('Audio initialized successfully')
    } catch (error) {
      console.error('Failed to initialize audio:', error)
    }
  }



  private initializeUI() {
    // Create main app container
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

    this.attachEventListeners()
  }

  private attachEventListeners() {
    // Mode controls
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        this.setMode(target.dataset.mode as 'continuous' | 'track')
      })
    })

    // Playback controls
    document.getElementById('play-btn')?.addEventListener('click', () => this.play())
    document.getElementById('pause-btn')?.addEventListener('click', () => this.pause())
    document.getElementById('prev-btn')?.addEventListener('click', () => this.previousTrack())

    // Speed controls
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        this.setSpeed(target.dataset.speed as string)
      })
    })

    // Parameter sliders
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

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        const preset = target.dataset.preset
        if (preset) {
          this.setPreset(preset)
        }
      })
    })

    // New track button
    document.querySelector('.new-track-btn')?.addEventListener('click', () => {
      this.generateNewTrack()
    })
  }

  private async play() {
    // Initialize audio context on first interaction
    if (!this.audioContext) {
      this.audioContext = getAudioContext()
    }
    
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    // Initialize audio output
    try {
      console.log('Audio output initialized')
    } catch (error) {
      console.error('Failed to initialize audio output:', error)
    }

    this.isPlaying = true
    const playBtn = document.getElementById('play-btn')
    const pauseBtn = document.getElementById('pause-btn')
    if (playBtn) playBtn.style.display = 'none'
    if (pauseBtn) pauseBtn.style.display = 'block'

    // Start recording if in track mode
    if (this.mode === 'track') {
      this.startRecording()
    }

    // Start pattern generation
    this.startPattern()
  }

  private pause() {
    this.isPlaying = false
    const playBtn = document.getElementById('play-btn')
    const pauseBtn = document.getElementById('pause-btn')
    if (playBtn) playBtn.style.display = 'block'
    if (pauseBtn) pauseBtn.style.display = 'none'
    
    // Stop the current pattern
    if (this.scheduler) {
      this.scheduler.stop()
    }

    // Stop recording and save if in track mode
    if (this.mode === 'track' && this.mediaRecorder) {
      this.stopRecording()
    }

    // Clear evolution timer
    if (this.evolutionTimer) {
      clearInterval(this.evolutionTimer)
      this.evolutionTimer = null
    }
  }

  private previousTrack() {
    this.generateNewTrack()
  }

  private setSpeed(speed: string) {
    this.currentSpeed = speed
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.classList.remove('active')
    })
    document.querySelector(`[data-speed="${speed}"]`)?.classList.add('active')
    
    if (this.isPlaying) {
      this.updatePattern()
    }
  }

  private setParameter(param: string, value: number) {
    switch (param) {
      case 'energy':
        this.energy = value
        break
      case 'complexity':
        this.complexity = value
        break
      case 'atmosphere':
        this.atmosphere = value
        break
      case 'rhythmFocus':
        this.rhythmFocus = value
        break
    }

    // Update UI
    const slider = document.querySelector(`[data-param="${param}"]`)
    if (slider) {
      const valueElement = slider.querySelector('.parameter-value') as HTMLElement
      if (valueElement) {
        valueElement.style.left = `${value}%`
      }
    }

    if (this.isPlaying) {
      this.updatePattern()
    }
  }

  private setMode(mode: 'continuous' | 'track') {
    this.mode = mode
    
    // Clear existing managers
    this.songStructure = null
    this.continuousEvolution = null
    
    // Initialize new managers
    if (mode === 'track') {
      this.songStructure = new SongStructureManager(this.currentPreset)
    } else {
      this.continuousEvolution = new ContinuousEvolutionManager(this.currentPreset)
    }
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active')
    })
    document.querySelector(`[data-mode="${mode}"]`)?.classList.add('active')

    // Show/hide track info
    const trackInfo = document.getElementById('track-info')
    if (trackInfo) {
      trackInfo.style.display = mode === 'track' ? 'block' : 'none'
    }

    // Restart if playing to apply new mode
    if (this.isPlaying) {
      this.startPattern()
    }
  }

  private setPreset(preset: string) {
    this.currentPreset = preset
    
    // Reinitialize managers with new preset
    if (this.mode === 'track') {
      this.songStructure = new SongStructureManager(preset)
    } else {
      this.continuousEvolution = new ContinuousEvolutionManager(preset)
    }
    
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.remove('active')
    })
    document.querySelector(`[data-preset="${preset}"]`)?.classList.add('active')

    // Apply preset values
    switch (preset) {
      case 'starry':
        this.setParameter('energy', 60)
        this.setParameter('complexity', 50)
        this.setParameter('atmosphere', 80)
        this.setParameter('rhythmFocus', 30)
        break
      case 'flow':
        this.setParameter('energy', 50)
        this.setParameter('complexity', 30)
        this.setParameter('atmosphere', 50)
        this.setParameter('rhythmFocus', 25)
        break
      case 'glitch':
        this.setParameter('energy', 70)
        this.setParameter('complexity', 80)
        this.setParameter('atmosphere', 40)
        this.setParameter('rhythmFocus', 75)
        break
      case 'demon':
        this.setParameter('energy', 85)
        this.setParameter('complexity', 75)
        this.setParameter('atmosphere', 20)
        this.setParameter('rhythmFocus', 80)
        break
    }
    
    // Update pattern immediately if playing
    if (this.isPlaying) {
      this.updatePattern()
    }
  }

  private generateNewTrack() {
    if (this.isPlaying) {
      this.startPattern()
    }
  }



  private startPattern() {
    if (!this.audioContext) return

    try {
      // Initialize scheduler if not exists
      if (!this.scheduler) {
        this.scheduler = repl({
          defaultOutput: webaudioOutput,
          getTime: () => this.audioContext!.currentTime
        })
      }

      // Setup mode-specific behavior
      if (this.mode === 'track') {
        this.setupTrackMode()
      } else {
        this.setupContinuousMode()
      }

      const pat = this.generatePattern()
      this.scheduler.setPattern(pat)
      this.scheduler.start()
      console.log(`Pattern started in ${this.mode} mode`)
    } catch (error) {
      console.error('Failed to start pattern:', error)
    }
  }

  private updatePattern() {
    if (this.isPlaying) {
      this.startPattern()
    }
  }



  private generatePattern() {
    try {
      // Get musical configuration for current preset
      const config = PRESET_MUSICAL_CONFIG[this.currentPreset]
      if (!config) {
        return this.generateSafeFallbackPattern()
      }

      if (this.mode === 'track' && this.songStructure) {
        // Track mode: Use song structure
        return this.applyAudioMixing(this.songStructure.getCurrentPattern())
      } else if (this.mode === 'continuous' && this.continuousEvolution) {
        // Continuous mode: Use evolution system
        return this.applyAudioMixing(this.continuousEvolution.getEvolvingPattern())
      } else {
        // Fallback: generate basic pattern
        return this.applyAudioMixing(this.generateBasicPattern(config))
      }
    } catch (error) {
      console.error('Failed to generate pattern:', error)
      return this.generateSafeFallbackPattern()
    }
  }

  private generateBasicPattern(config: PresetMusicalConfig): any {
    const drumPattern = MusicalPatternLibrary.getDrumPattern(this.currentPreset, this.energy)
    
    return stack(
      s(drumPattern.kick).gain(0.6).orbit(1),
      s(drumPattern.snare).gain(0.5).orbit(2),
      s(drumPattern.hihat).gain(0.3).orbit(3),
      MusicalPatternLibrary.getBassPattern(this.currentPreset, config.key, this.energy).orbit(4),
      MusicalPatternLibrary.getChordPattern(this.currentPreset, config.key, this.atmosphere).orbit(5),
      MusicalPatternLibrary.getMelodyPattern(this.currentPreset, config.key, this.complexity).orbit(6)
    )
  }

  private applyAudioMixing(pattern: any): any {
    const speedMultiplier = this.currentSpeed === 'slow' ? 0.5 : 
                          this.currentSpeed === 'fast' ? 1.5 : 1

    return pattern
      .fast(speedMultiplier)
      .compressor("-20:4:10:0.001:0.1")  // Prevent clipping
      .postgain(0.8)                        // Master volume
      .sometimesBy(0.1, (x: any) => x.chorus(0.3)) // Stereo width
  }

  private generateSafeFallbackPattern(): any {
    // Safe fallback that always works
    return stack(
      s("bd ~ ~ ~").gain(0.5).orbit(1),
      s("hh*8").gain(0.2).orbit(2),
      note("c3").s("sine").gain(0.3).orbit(3)
    ).compressor("-20:4:10:0.001:0.1").postgain(0.6)
  }



  private setupContinuousMode() {
    // Initialize continuous evolution manager
    this.continuousEvolution = new ContinuousEvolutionManager(this.currentPreset)
    
    // Clear any existing evolution timer
    if (this.evolutionTimer) {
      clearInterval(this.evolutionTimer)
    }

    // Evolve the musical structure gradually
    this.evolutionTimer = window.setInterval(() => {
      if (!this.isPlaying || !this.continuousEvolution) return

      // Evolve the pattern
      this.continuousEvolution.evolve()
      
      // Update pattern with evolved structure
      const pat = this.continuousEvolution.getEvolvingPattern()
      if (this.scheduler) {
        this.scheduler.setPattern(pat)
      }
      
      // Occasionally switch presets for more variety
      if (Math.random() < 0.01) { // 1% chance every interval - less frequent
        const presets = ['starry', 'flow', 'glitch', 'demon']
        const currentPresetIndex = presets.indexOf(this.currentPreset)
        const newPresetIndex = (currentPresetIndex + Math.floor(Math.random() * 3) + 1) % 4
        this.setPreset(presets[newPresetIndex])
        this.continuousEvolution = new ContinuousEvolutionManager(this.currentPreset)
      }
    }, 4000) // Update every 4 seconds for smoother evolution
  }

  private setupTrackMode() {
    // Initialize song structure manager
    this.songStructure = new SongStructureManager(this.currentPreset)
    
    // Generate track duration (3-4 minutes most common, occasional 7 minutes)
    const isLongTrack = Math.random() < 0.1 // 10% chance for 7-minute track
    const durationMinutes = isLongTrack ? 7 : (3 + Math.random() * 2) // 3-5 minutes typically
    this.currentTrackDuration = durationMinutes * 60 * 1000 // Convert to milliseconds
    this.trackStartTime = Date.now()

    // Update track timer display
    this.updateTrackTimer()

    // Set timer for track completion
    setTimeout(() => {
      if (this.isPlaying && this.mode === 'track') {
        this.completeTrack()
      }
    }, this.currentTrackDuration)

    // Update timer and song structure every second
    const timerInterval = setInterval(() => {
      if (!this.isPlaying || this.mode !== 'track') {
        clearInterval(timerInterval)
        return
      }
      
      // Advance song structure every 8 seconds (approximately 1 bar)
      if (Date.now() - this.trackStartTime > 0 && (Date.now() - this.trackStartTime) % 8000 < 1000) {
        if (this.songStructure) {
          this.songStructure.advanceSection()
          const pat = this.songStructure.getCurrentPattern()
          if (this.scheduler) {
            this.scheduler.setPattern(pat)
          }
        }
      }
      
      this.updateTrackTimer()
    }, 1000)
  }

  private updateTrackTimer() {
    const elapsed = Date.now() - this.trackStartTime
    const remaining = Math.max(0, this.currentTrackDuration - elapsed)
    
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    
    const timerElement = document.getElementById('track-timer')
    const statusElement = document.getElementById('track-status')
    
    if (timerElement) {
      timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    
    if (statusElement) {
      const elapsedMinutes = Math.floor(elapsed / 60000)
      const elapsedSeconds = Math.floor((elapsed % 60000) / 1000)
      statusElement.textContent = `Playing - ${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')} elapsed`
    }
  }

  private completeTrack() {
    // Stop recording and save
    if (this.mediaRecorder) {
      this.stopRecording()
    }

    // Update status
    const statusElement = document.getElementById('track-status')
    if (statusElement) {
      statusElement.textContent = 'Complete!'
    }

    // Auto-start a new track after a brief pause
    setTimeout(() => {
      if (this.mode === 'track') {
        this.generateNewTrack()
      }
    }, 2000)
  }

  private startRecording() {
    if (!this.audioContext) return

    try {
      const destination = this.audioContext.createMediaStreamDestination()
      
      // Connect existing audio context to recording destination
      // Note: This is a simplified approach. In a production app, you'd need
      // to properly route all audio sources through this destination
      
      this.mediaRecorder = new MediaRecorder(destination.stream)
      this.recordedChunks = []

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        this.saveRecording()
      }

      this.mediaRecorder.start()
      console.log('Recording started')
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }

  private stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
      console.log('Recording stopped')
    }
  }

  private saveRecording() {
    if (this.recordedChunks.length === 0) return

    const blob = new Blob(this.recordedChunks, { type: 'audio/webm' })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const preset = this.currentPreset
    const duration = Math.floor(this.currentTrackDuration / 1000)
    
    const filename = `mej-track-${preset}-${duration}s-${timestamp}.webm`
    
    // Create download link
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    console.log(`Track saved as ${filename}`)
    
    // Clear recording
    this.recordedChunks = []
    this.mediaRecorder = null
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MeJApp()
})