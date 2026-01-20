// @ts-ignore - Strudel types are not available
import { initAudioOnFirstClick, getAudioContext, webaudioOutput } from '@strudel/webaudio'
// @ts-ignore - Import superdough for registerSynthSounds
import { registerSynthSounds } from 'superdough'
// @ts-ignore - Import tonal for note parsing
import '@strudel/tonal'
// @ts-ignore - Strudel types are not available
import { s, stack, repl, note, choose, rand, sine, registerSound } from '@strudel/core'

// Parameter mapping interfaces
interface EnergyMap {
  density: number
  speed: number
  gain: number
  degrade: number
}

interface ComplexityMap {
  layers: number
  polyrhythm: boolean
  effects: boolean
  variation: number
  randomness: string
}

interface AtmosphereMap {
  reverb: number
  release: number
  filter: { lpf?: number; lpq?: number }
  decay: number
  pad: boolean
}

interface RhythmMap {
  euclidean: boolean
  pulse: number
  swing: boolean
  subdivision: number
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
  private rhythmFocus = 50
  
  // Track mode properties
  private trackStartTime = 0
  private currentTrackDuration = 0
  private evolutionTimer: number | null = null
  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: Blob[] = []

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
  }

  private generateNewTrack() {
    if (this.isPlaying) {
      this.startPattern()
    }
  }

  private safePatternGeneration(patternName: string, generator: () => any): any {
    try {
      console.log(`Generating ${patternName} pattern...`)
      const pattern = generator()
      console.log(`Successfully generated ${patternName} pattern`)
      return pattern
    } catch (error) {
      console.error(`Failed to generate ${patternName} pattern:`, error)
    // Fallback to a simple safe pattern using basic oscillator
    return s("sine").note("c3").gain(0.3).orbit(1)
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

  // Parameter mapping utilities
  private getEnergyPattern(energy: number): EnergyMap {
    return {
      density: Math.floor(energy / 20) + 1, // 1-6 events per cycle
      speed: energy > 70 ? 1.5 : energy > 40 ? 1 : 0.5,
      gain: 0.3 + (energy / 100) * 0.7,
      degrade: energy < 30 ? 0.5 : energy < 60 ? 0.2 : 0
    }
  }

  private getComplexityPattern(complexity: number): ComplexityMap {
    return {
      layers: complexity > 70 ? 3 : complexity > 40 ? 2 : 1,
      polyrhythm: complexity > 60,
      effects: complexity > 50,
      variation: complexity / 100,
      randomness: complexity > 60 ? 'wchoose' : 'choose'
    }
  }

  private getAtmospherePattern(atmosphere: number): AtmosphereMap {
    return {
      reverb: atmosphere / 100,
      release: 0.1 + (atmosphere / 100) * 2,
      filter: atmosphere > 60 ? { lpf: 800, lpq: 5 } : {},
      decay: atmosphere > 70 ? 0.5 : atmosphere > 40 ? 0.2 : 0.1,
      pad: atmosphere > 80
    }
  }

  private getRhythmPattern(rhythmFocus: number): RhythmMap {
    return {
      euclidean: rhythmFocus > 50,
      pulse: rhythmFocus > 70 ? 16 : rhythmFocus > 40 ? 8 : 4,
      swing: rhythmFocus > 60,
      subdivision: Math.floor(rhythmFocus / 20) + 2
    }
  }

  private generatePattern() {
    const energyMap = this.getEnergyPattern(this.energy)
    const complexityMap = this.getComplexityPattern(this.complexity)
    const atmosphereMap = this.getAtmospherePattern(this.atmosphere)
    const rhythmMap = this.getRhythmPattern(this.rhythmFocus)
    
    // Use preset-specific generators with error handling
    switch (this.currentPreset) {
      case 'starry': 
        return this.safePatternGeneration('starry', () => 
          this.generateStarryPattern(energyMap, complexityMap, atmosphereMap, rhythmMap))
      case 'flow': 
        return this.safePatternGeneration('flow', () => 
          this.generateFlowPattern(energyMap, complexityMap, atmosphereMap, rhythmMap))
      case 'glitch': 
        return this.safePatternGeneration('glitch', () => 
          this.generateGlitchPattern(energyMap, complexityMap, atmosphereMap, rhythmMap))
      case 'demon': 
        return this.safePatternGeneration('demon', () => 
          this.generateDemonPattern(energyMap, complexityMap, atmosphereMap, rhythmMap))
      default: 
        return this.safePatternGeneration('default', () => 
          this.generateDefaultPattern(energyMap, complexityMap, atmosphereMap, rhythmMap))
    }
  }

  private generateStarryPattern(energyMap: EnergyMap, _complexityMap: ComplexityMap, atmosphereMap: AtmosphereMap, _rhythmMap: RhythmMap) {
    // Ethereal pad
    const pads = s("sine")
      .freq("261.63")
      .attack(2)
      .decay(0.5)
      .sustain(0.8)
      .release(3)
      .room(atmosphereMap.reverb)
      .roomsize(8)
      .lpf(1200)
      .lpq(3)
      .gain(0.3)
      .sometimesBy(0.1, (x: any) => x.phaser(4))
      .orbit(1)
    
    // Twinkling accents - use crackle noise
    const accents = s("crackle")
      .density(0.05)
      .gain(0.1)
      .pan(sine.slow(4).range(0.2, 0.8))
      .room(atmosphereMap.reverb * 0.3)
      .orbit(2)
    
    // Sparse rhythm - use synthesized kick
    const rhythm = s("sine")
      .freq(60)
      .gain(energyMap.gain * 0.6)
      .lpf(60)
      .orbit(3)

    const speedMultiplier = this.currentSpeed === 'slow' ? 0.5 : 
                          this.currentSpeed === 'fast' ? 1.5 : 1

    // Apply overall gain control to prevent clipping
    const masterGain = 0.8
    return stack(pads, accents, rhythm).fast(speedMultiplier).gain(masterGain)
  }

  private generateFlowPattern(_energyMap: EnergyMap, _complexityMap: ComplexityMap, atmosphereMap: AtmosphereMap, _rhythmMap: RhythmMap) {
    // Flowing bass - use simpler freq values
    const bass = s("sawtooth")
      .freq("130.81")
      .attack(0.1)
      .decay(0.3)
      .sustain(0.4)
      .lpf(800)
      .lpenv(2)
      .lpattack(0.2)
      .lpdecay(0.1)
      .lpq(3)
      .gain(0.4)
      .orbit(1)
    
    // Liquid hi-hats - use pink noise instead of hh sample
    const hihats = s("pink")
      .speed(16)
      .degradeBy(0.1)
      .gain(0.2)
      .hpf(2000)
      .hpq(5)
      .lpf(8000)
      .lpq(2)
      .orbit(2)
    
    // Melodic flow
    const melody = s("triangle")
      .freq("261.63")
      .fast(2)
      .attack(0.05)
      .sustain(0.3)
      .pan(sine.slow(2))
      .release(atmosphereMap.release)
      .sometimesBy(0.2, (x: any) => x.penv(12).pattack(0.1))
      .sometimesBy(0.1, (x: any) => x.phaser(2).delay(0.25))
      .orbit(3)

    const speedMultiplier = this.currentSpeed === 'slow' ? 0.5 : 
                          this.currentSpeed === 'fast' ? 1.5 : 1

    // Apply overall gain control to prevent clipping
    const masterGain = 0.75
    return stack(bass, hihats, melody).fast(speedMultiplier).gain(masterGain)
  }

  private generateGlitchPattern(energyMap: EnergyMap, _complexityMap: ComplexityMap, _atmosphereMap: AtmosphereMap, _rhythmMap: RhythmMap) {
    // Glitchy drums - use synthesized kick and snare
    const kick = s("sine")
      .freq(80)
      .gain(energyMap.gain * 0.5)
      .orbit(1)
    
    const snare = s("triangle")
      .freq(200)
      .gain(energyMap.gain * 0.3)
      .orbit(2)
    
    // Digital noise
    const noise = s("white")
      .coarse(8)
      .lpf(4000)
      .gain(0.1)
      .pan(choose(0, 0.5, 1))
      .orbit(2)
    
    // FM melodic glitches
    const melody = s("sawtooth")
      .freq("523.25")
      .fm(10)
      .fmh(2)
      .fmattack(0.01)
      .fmdecay(0.1)
      .attack(0.001)
      .release(0.05)
      .gain(0.3)
      .sometimesBy(0.5, (x: any) => x.crush(4))
      .orbit(3)

    const speedMultiplier = this.currentSpeed === 'slow' ? 0.5 : 
                          this.currentSpeed === 'fast' ? 1.5 : 1

    // Apply overall gain control to prevent clipping
    const masterGain = 0.6
    return stack(kick, snare, noise, melody).fast(speedMultiplier).gain(masterGain)
  }

  private generateDemonPattern(energyMap: EnergyMap, _complexityMap: ComplexityMap, _atmosphereMap: AtmosphereMap, _rhythmMap: RhythmMap) {
    // Heavy distorted kick
    const kick = s("sine")
      .freq(50)
      .distort(10)
      .lpf(80)
      .lpq(20)
      .gain(energyMap.gain * 1.2)
      .sometimesBy(0.5, (x: any) => x.fast(2))
      .orbit(1)
    
    // Aggressive snare
    const snare = s("square")
      .freq("196.00")
      .mask("sd*2")
      .distort(5)
      .hpf(1000)
      .hpq(3)
      .attack(0.001)
      .release(0.05)
      .gain(0.7)
      .orbit(2)
    
    // Menacing bass
    const bass = s("sawtooth")
      .freq("65.41")
      .fm(8)
      .fmh(1.5)
      .lpf(400)
      .lpq(15)
      .distort(3)
      .attack(0.05)
      .gain(0.8)
      .orbit(3)
    
    // Harsh noise textures
    const noise = s("pink")
      .distort(8)
      .crush(2)
      .lpf(2000)
      .gain(0.15)
      .hpf(500)
      .sometimesBy(0.3, (x: any) => x.speed("<1 2 4>"))
      .sometimesBy(0.2, (x: any) => x.coarse(4))
      .orbit(4)

    const speedMultiplier = this.currentSpeed === 'slow' ? 0.5 : 
                          this.currentSpeed === 'fast' ? 1.5 : 1

    // Apply overall gain control to prevent clipping
    const masterGain = 0.5
    return stack(kick, snare, bass, noise).fast(speedMultiplier).gain(masterGain)
  }

  private generateDefaultPattern(energyMap: EnergyMap, _complexityMap: ComplexityMap, atmosphereMap: AtmosphereMap, rhythmMap: RhythmMap) {
    // Basic pattern using parameter maps
    const baseRhythm = rhythmMap.euclidean 
      ? `bd(${energyMap.density},${rhythmMap.pulse})`
      : `bd*${energyMap.density}`

    const drums = s(baseRhythm)
      .gain(energyMap.gain)
      .degradeBy(energyMap.degrade)
      .orbit(1)

    const bass = s("sawtooth")
      .freq("130.81")
      .lpf(atmosphereMap.filter.lpf || 400)
      .gain(0.4)
      .orbit(2)

    const melody = s("triangle")
      .freq("261.63")
      .release(atmosphereMap.release)
      .orbit(3)

    const speedMultiplier = this.currentSpeed === 'slow' ? 0.5 : 
                          this.currentSpeed === 'fast' ? 1.5 : 1

    // Apply overall gain control to prevent clipping
    const masterGain = 0.7
    return stack(drums, bass, melody).fast(speedMultiplier).gain(masterGain)
  }

  private setupContinuousMode() {
    // Clear any existing evolution timer
    if (this.evolutionTimer) {
      clearInterval(this.evolutionTimer)
    }

    // Evolve parameters gradually over time for continuous flow
    this.evolutionTimer = window.setInterval(() => {
      if (!this.isPlaying) return

      // Randomly adjust one parameter slightly for organic evolution
      const params = ['energy', 'complexity', 'atmosphere', 'rhythmFocus'] as const
      const randomParam = params[Math.floor(Math.random() * params.length)]
      const currentValue = this[randomParam]
      
      // Small adjustment (±5)
      let newValue = currentValue + (Math.random() < 0.5 ? -5 : 5)
      newValue = Math.max(0, Math.min(100, newValue))
      
      this.setParameter(randomParam, newValue)
      
      // Occasionally switch presets for more variety
      if (Math.random() < 0.02) { // 2% chance every interval
        const presets = ['starry', 'flow', 'glitch', 'demon']
        const currentPresetIndex = presets.indexOf(this.currentPreset)
        const newPresetIndex = (currentPresetIndex + Math.floor(Math.random() * 3) + 1) % 4
        this.setPreset(presets[newPresetIndex])
      }
    }, 8000) // Evolve every 8 seconds
  }

  private setupTrackMode() {
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

    // Update timer every second
    const timerInterval = setInterval(() => {
      if (!this.isPlaying || this.mode !== 'track') {
        clearInterval(timerInterval)
        return
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