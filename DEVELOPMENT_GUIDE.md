# MeJ Music Generator - Development Guide

## Overview

MeJ is a browser-based music generator that creates real-time electronic music using the Web Audio API. It features 4 genre presets, pattern-based drum sequencing, and synthesized bass/chord/melody generation.

## Architecture

### Core Components

```
src/
├── main.ts      # Complete application (14KB)
├── style.css    # UI styling
└── index.html   # Entry point
```

### Audio System (Pure Web Audio API)

**DrumSynth Class**
- `playKick(gain)` - Oscillator with pitch envelope (150Hz → 0.01Hz)
- `playSnare(gain)` - Noise burst + triangle tone blend
- `playHiHat(gain)` - High-pass filtered noise (7000Hz+)
- `playClap(gain)` - Triple noise burst with bandpass filtering

**SynthManager Class**
- `playNote(note, duration, gain, type)` - Single oscillator notes
- `playChord(chord[], duration, gain)` - Chord synthesis
- Supports sawtooth, triangle, square, sine waves

**PatternScheduler Class**
- 16-step sequencer based on BPM
- Handles pattern strings like "bd*2 ~ bd sn"
- Calls back on each step for harmony generation

### Musical System

**Preset Configuration**
```typescript
const PRESET_CONFIG: Record<string, { key, scale, chords, bpm }> = {
  starry: { key: 'A', scale: 'minor pentatonic', chords: ['Am', 'F', 'C', 'G'], bpm: 80 },
  flow:   { key: 'C', scale: 'major pentatonic', chords: ['C', 'G', 'Am', 'F'], bpm: 90 },
  glitch: { key: 'D', scale: 'blues', chords: ['Dm', 'G', 'Am', 'E'], bpm: 130 },
  demon:  { key: 'E', scale: 'phrygian', chords: ['Em', 'C', 'G', 'D'], bpm: 140 }
}
```

**Pattern Format**
- 16-step sequences using Tidal-style notation
- `bd` = kick, `sn` = snare, `hh` = hi-hat, `cp` = clap
- `~` = rest
- `*n` = repeat n times (e.g., `bd*4` plays kick 4 times)

### UI System

**MeJApp Class**
- Creates and manages all UI elements
- Handles event listeners for controls
- Coordinates between UI and audio systems
- Maintains playback state

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Audio Setup

The audio context initializes on first user interaction (browser requirement):

```typescript
private play() {
  this.scheduler = new PatternScheduler()
  this.scheduler.init() // Creates AudioContext
  this.scheduler.start(bpm, pattern, onStep)
}
```

## Adding New Presets

1. Add to `PRESET_CONFIG`:
```typescript
newpreset: { 
  key: 'F#', 
  scale: 'dorian', 
  chords: ['F#m', 'E', 'B', 'C#m'], 
  bpm: 125 
}
```

2. Add drum pattern in `getDrumPattern()`:
```typescript
newpreset: [
  "bd ~ bd ~", "sn ~ sn ~", "hh*8 ~", "~ ~ cp ~",
  // ... 16 steps total
]
```

3. Add bass pattern in `getBassNote()`:
```typescript
const bassMap: Record<string, string[]> = {
  newpreset: ['f#2', 'e2', 'b2', 'c#2'],
  // ...
}
```

4. Add melody notes in `onBeat()`:
```typescript
const melodyNotes: Record<string, string[]> = {
  newpreset: ['f#4', 'a4', 'b4', 'c#5'],
  // ...
}
```

## Audio Synthesis Details

### Kick Drum
```typescript
osc.frequency.setValueAtTime(150, time)
osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5)
```

### Snare (Noise + Tone)
```typescript
// Noise component
const buffer = createBuffer(noiseData)
const noiseFilter = createBiquadFilter('highpass', 1000)

// Tone component  
osc.type = 'triangle'
osc.frequency.value = 180
```

### Hi-Hat
```typescript
const filter = createBiquadFilter('highpass', 7000)
// White noise through high-pass filter
```

### Chord Synthesis
```typescript
playChord(chord: string[], duration: number, gain: number) {
  chord.forEach(note => playNote(note, duration, gain))
}
```

## Pattern Notation Reference

| Symbol | Meaning | Example |
|--------|---------|---------|
| `bd` | Kick drum | `"bd ~ ~ ~"` |
| `sn` | Snare | `"~ sn ~ ~"` |
| `hh` | Hi-hat | `"hh*8"` |
| `cp` | Clap | `"~ ~ ~ cp"` |
| `~` | Rest (silence) | `"bd ~ sn ~"` |
| `*n` | Repeat n times | `"bd*4"` |
| `|` | Bar separator (visual only) | Not used in code |

## Performance Considerations

- AudioContext created once on first play
- Oscillators created/destroyed per note (no pooling)
- Pattern scheduler uses setInterval (not requestAnimationFrame)
- No external dependencies or network requests

## Browser Compatibility

Requires modern browser with:
- Web Audio API
- AudioContext
- ES6+ JavaScript

Tested on Chrome, Firefox, Edge, Safari.

## Troubleshooting

**No audio?**
- User must interact with page first (browser policy)
- Check browser console for errors

**Distorted audio?**
- Reduce gain values in playNote/playKick calls
- Check AudioContext sample rate

**Latency?**
- Pattern scheduler uses setInterval (may drift slightly)
- Acceptable for musical timing (<10ms variance)

## File Structure

```
mej-music/
├── src/
│   ├── main.ts      # All application code
│   ├── style.css    # UI styles
│   └── index.html   # Entry point
├── dist/            # Production build
├── package.json     # Dependencies
├── tsconfig.json    # TypeScript config
└── README.md        # This guide
```

## Dependencies

- **Vite** - Build tool
- **TypeScript** - Type safety
- **No audio libraries** - Pure Web Audio API

## License

MIT License
