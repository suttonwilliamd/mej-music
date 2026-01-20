# MeJ Music Application - Development Plan

## Project Overview

MeJ (pronounced D.J.) is a desktop application that continuously generates fresh music using algorithmic patterns. The application features a small, intuitive interface with mood controls, speed settings, and playback controls, designed to create similar-but-unique musical experiences each time it runs.

## Core Requirements

- **Continuous music generation** with algorithmic patterns
- **Intuitive mood controls** that affect musical characteristics
- **Speed control** (Slow/Mid/Fast) affecting tempo and rhythm complexity
- **Playback controls** (Previous/Next, Play/Pause)
- **Non-deterministic but consistent** - same settings feel like same artist/album
- **Desktop application** with native performance

## Technical Architecture

### Framework Choice: Tauri 2.0

After extensive research, **Tauri 2.0** is the recommended framework over Electron:

#### Advantages:
- **90% smaller apps** (~10MB vs ~100MB for Electron)
- **30-40MB memory usage** vs ~200MB for Electron
- **Native webview performance** - better for real-time audio
- **Rust backend** for system integration and performance
- **Cross-platform** (Windows, macOS, Linux) from single codebase
- **Security-first design** with minimal attack surface
- **Active community** (17,700+ Discord members, growing rapidly)

#### Audio Performance Considerations:
- Web Audio API works well in Tauri's webview context
- Real-time audio processing has been proven in production (PianoRhythm, voice apps)
- Lower latency than Electron due to native webview implementation

### Music Engine: Strudel

**Strudel** is the core pattern generation system:

- **JavaScript port of TidalCycles** - battle-tested pattern language
- **Real-time pattern manipulation** - perfect for live adjustment
- **Rich ecosystem** - samples, effects, and synthesis
- **AGPL-3.0 license** - requires source disclosure (see licensing section)

## User Interface Design

### Main Window (400x300px - compact design)

```
┌─────────────────────────────────────────────────────────────┐
│                        MeJ                               │
├─────────────────────────────────────────────────────────────┤
│  [◀] [⏸▶] [▶]        Speed: [Slow ● Mid Fast]          │
├─────────────────────────────────────────────────────────────┤
│     Energy     ━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│   Complexity   ━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━    │
│   Atmosphere   ━━━━━━━━━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━    │
│ Rhythm Focus  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●━━━━━━    │
├─────────────────────────────────────────────────────────────┤
│ [Starry] [Flow] [Glitch] [Demon]      [🎲 New Track]     │
└─────────────────────────────────────────────────────────────┘
```

### Control Functions

#### Core Parameters:
1. **Energy (0-100)**: Controls tempo, density, and intensity
2. **Complexity (0-100)**: Layers, subdivisions, harmonic movement
3. **Atmosphere (Dark ← → Bright)**: Timbre, reverb, harmonic content
4. **Rhythm Focus (4/4 ← → Experimental)**: Predictable to polyrhythmic

#### Speed Control:
- **Slow**: 60-90 BPM, longer patterns, more spacing
- **Mid**: 90-130 BPM, balanced rhythm
- **Fast**: 130-160 BPM, dense patterns, rapid evolution

#### Preset Moods:
- **"Starry"**: High Atmosphere, Mid Energy, Medium Complexity, 4/4 Focus
- **"Flow"**: Mid Atmosphere, Mid Energy, Low-Medium Complexity, 4/4 Focus  
- **"Glitch"**: Variable Atmosphere, High-Mid Energy, High Complexity, Experimental
- **"Demon"**: Low Atmosphere, High Energy, High Complexity, Experimental

## Music Generation System

### Pattern Architecture

Based on Strudel research, the system uses parameter-based mapping to generate patterns that feel similar but different each time.

### Variation System

**Seed-based randomization** ensures consistency - same parameters produce similar-feeling music but different specific patterns.

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Tauri 2.0 project structure
- [ ] Install Strudel dependencies
- [ ] Create basic UI with all controls
- [ ] Implement Web Audio API initialization
- [ ] Basic Strudel pattern playing

### Phase 2: Core Features (Week 3-4)
- [ ] Implement parameter-to-pattern mapping
- [ ] Add real-time control updates
- [ ] Create speed control system
- [ ] Implement seed-based variation
- [ ] Add basic playback controls

### Phase 3: Polish & Presets (Week 5-6)
- [ ] Implement mood presets
- [ ] Add Previous/Next navigation
- [ ] Refine parameter mappings
- [ ] Add visual feedback for active states
- [ ] Performance optimization

### Phase 4: Advanced Features (Week 7-8)
- [ ] Add configuration persistence
- [ ] Implement custom sample loading
- [ ] Add keyboard shortcuts
- [ ] Create advanced mood combinations
- [ ] Testing and bug fixes

## Licensing Considerations

### AGPL-3.0 Compliance (Strudel)

**Critical Requirement**: Strudel uses AGPL-3.0 license, which means:
- **Source code disclosure required** for the entire application
- **Modifications count** - integrating Strudel counts as modification
- **Distribution requirement** - must provide source to users

**Options**:
1. **Open Source Route**: Release MeJ under AGPL-3.0 (recommended for transparency)
2. **Commercial License**: Contact Strudel authors for commercial licensing
3. **Alternative**: Use Web Audio API directly (loses Strudel's power)

**Recommended Approach**: Embrace open source - the music community benefits from transparency, and AGPL-3.0 ensures the project remains accessible.

## Dependencies & Tooling

### Core Dependencies
```json
{
  "dependencies": {
    "@strudel/web": "^1.0.0",
    "@strudel/webaudio": "^1.0.0", 
    "@tauri-apps/api": "^2.0.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

### Build Tools
- **Vite** for frontend bundling (fast HMR)
- **TypeScript** for type safety
- **Rust** for backend (installed via Tauri CLI)

## Performance Targets

- **Startup time**: < 2 seconds
- **Memory usage**: < 50MB idle
- **Audio latency**: < 10ms
- **UI responsiveness**: 60fps animations
- **App size**: < 15MB

## Testing Strategy

- **Unit tests**: Pattern generation logic
- **Integration tests**: Audio output consistency
- **User testing**: Control intuitiveness  
- **Performance testing**: Memory usage and latency
- **Cross-platform testing**: Windows/macOS/Linux

## Success Metrics

1. **Musical Quality**: Same settings produce similar-feeling music
2. **Performance**: Smooth real-time playback
3. **Usability**: Intuitive controls without musical knowledge required
4. **Stability**: No audio glitches or crashes
5. **Cross-platform**: Consistent experience across operating systems

## Future Enhancements

- **Custom sample packs**
- **MIDI export capability** 
- **Visual music visualization**
- **Plugin system for custom moods**
- **Cloud preset sharing**
- **Mobile version (Tauri mobile)**

---

## Development Notes

This plan incorporates extensive research into:
- **Desktop framework comparison** (Tauri vs Electron analysis)
- **Strudel pattern generation capabilities** (real code examples)
- **UI/UX best practices for music applications**
- **License compliance requirements**
- **Performance optimization strategies**

The approach prioritizes **user experience** over technical complexity, focusing on creating an intuitive tool that generates compelling music without requiring musical expertise from the user.

**Next Steps**: Begin Phase 1 implementation with Tauri project setup and basic UI creation.
