# MeJ - Generative Music Application

A web-based generative music application built with [Strudel](https://strudel.cc/) that creates infinite, evolving musical patterns based on mood parameters.

## Features

- **4 Unique Presets**: Flow, Starry, Glitch, and Demon - each with distinct sonic character
- **Mood Parameters**: Energy, Complexity, Atmosphere, and Rhythm Focus sliders
- **Speed Control**: Slow, Mid, and Fast playback options
- **Live Pattern Generation**: Each track generates new patterns dynamically
- **Web Audio Synthesis**: No samples required - all sounds synthesized in real-time

## Presets

| Preset | Description | Best For |
|--------|-------------|----------|
| **Flow** | Smooth basslines with melodic leads and liquid hi-hats | Relaxation, focus |
| **Starry** | Ethereal pads with twinkling accents | Ambient, meditation |
| **Glitch** | Degraded beats with digital noise and FM glitches | Energy, experimentation |
| **Demon** | Heavy distorted kicks and menacing bass | Intensity, dark atmospheres |

## Tech Stack

- **Strudel** - Pattern-based live coding framework
- **Superdough** - WebAudio synthesis engine
- **Vite** - Build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **Tauri** (optional) - Desktop app wrapper

## Installation

```bash
cd mej-music
npm install
```

## Development

```bash
npm run dev
```

Open `http://localhost:5173` in your browser. Click "Play" to start generating music.

## Building

```bash
npm run build
```

## MVP Status

This is the **Minimum Viable Product** release. The application is fully functional with:

- ✅ Working audio synthesis (no sample loading required)
- ✅ All presets generating sound
- ✅ Parameter controls functioning
- ✅ No blocking errors

### Known Issues

- Console shows deprecation warnings from superdough library internals (onceEnded vs node.onended pattern) - these are library issues, not application errors, and don't affect functionality
- Pattern value ranges are simplified to prevent AudioParam errors

### Future Improvements

- Add sample loading for more diverse sounds
- Expand pattern complexity options
- Add MIDI input support
- Save/load parameter presets
- Visual waveform display
- Mobile responsive UI
- Audio recording capability

## Architecture

```
mej-music/
├── src/
│   ├── main.ts      # Core application logic, pattern generators
│   ├── app.ts       # UI components (if any)
│   └── style.css    # Styling
├── index.html       # Entry point
├── package.json     # Dependencies
├── vite.config.ts   # Vite configuration
└── tsconfig.json    # TypeScript configuration
```

## License

MIT License - feel free to use, modify, and distribute.

## Credits

Built with [Strudel](https://strudel.cc/) - inspired by TidalCycles and designed for live coding in the browser.
