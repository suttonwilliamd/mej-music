# MeJ · 0.1.0

A small browser instrument built with **native Web Audio**, TypeScript and Vite. Choose Flow, Starry, Glitch or Demon, choose a tempo, then press Play. No account, samples, Strudel runtime or desktop wrapper is required.

## What works

- Four preserved preset patterns with synthesized percussion, bass, chords and occasional randomized melody.
- Slow / Mid / Fast set BPM to 75% / 100% / 125% of the preset base, rounded to the nearest integer. Base tempos: Starry 80, Flow 90, Glitch 130, Demon 140.
- Visible current BPM and playing/paused status. One persistent Play/Pause button, plus a clearly named Restart button (disabled while paused).
- Native radio groups for tempo/preset selection: Tab into a group, use arrow keys to select; Space activates buttons. Focus indicators and selected outlines do not rely on color alone.
- An editable 16-step groove mask. Each numbered On/Off button gates all voices for that preset step; the current-step underline advances even through muted steps. On permits the preset's existing ingredients, not a guaranteed hit (a preset can contain rests).
- Native step buttons support Tab, Space and Enter, with truthful `aria-pressed`, visible On/Off text, dashed muted outlines and amber keyboard focus. The responsive grid uses eight columns on wide desktop and four on narrower screens.
- Portable loop JSON save/load: keep character, relative tempo and all 16 step gates; preview before explicit load, which always pauses and never starts audio.

## Run and verify

Use Node.js 22 and npm:

```sh
npm ci --ignore-scripts
npm run dev
# Open the local URL printed by Vite (default port 3000).
npm test
npm run build
npm run preview
```

Tests use Vitest fake timers and jsdom. **25 tests pass**, covering independently expected transport timing, tempo mapping, repeated-start replacement, delayed-hit cancellation, semantic playback state, audio-start cancellation/failure, and edited groove outcomes. File cases cover incompatible/oversized/malformed settings, exact boolean-mask boundaries, preview/cancel preservation, loaded step dispatch, startup cancellation and stale file reads. CI runs the existing tests/build/native-browser smoke on Ubuntu and Windows; configuration alone is not evidence that remote jobs ran.

## Editing and reset

The default mask is **all 16 steps on**, preserving each original preset. Toggle any step before or during playback. One canonical session mask gates drums, bass, chords and randomized melody at dispatch; all-off leaves the transport running silently. The mask is shared across characters and survives tempo changes, Restart and Pause/Play. Reloading restores defaults unless you explicitly load a saved loop file; nothing is automatically stored or sent over the network.

**Restore default pattern** turns all 16 steps on, including when paused or audio startup is pending. It does not change the selected character, tempo, playback state or loop position. Restart instead resets the loop position and cancels existing tails/repeats, without replacing your edits.

A live edit affects the next **not-yet-dispatched** step, without restarting the loop. Each step snapshots the mask once: a note already sounding and repeats already scheduled within that step are not undone by editing or restoring. Pause still cancels both active tails and pending repeats. This is a groove gate, not an instrument-note composer or a piano roll.

## Save and load a loop

1. Choose character/tempo and edit steps, then **Save loop JSON** downloads `mej-loop.json`. It captures these settings even during playback, not notes currently sounding.
2. After reloading or on another device, **Choose loop JSON to preview** shows the character, derived BPM and enabled-step count without changing your current loop or playback. **Cancel load** keeps both unchanged.
3. **Load loop and pause** explicitly replaces character/tempo/mask and stops active tails and scheduled hits. It also cancels pending audio startup. It never plays automatically; press Play when ready, starting at step 1.

The version-1 format uses `format: "mej-loop"`, `version: 1`, `preset`, `speed` (`slow`/`mid`/`fast`) and exactly 16 boolean `mask` entries. Maximum file size is 16 KiB. Incompatible versions, unknown characters/tempos, malformed masks and oversized files are rejected as a whole without changing settings or stopping playback. Newer file selections and cancellation fence older unfinished reads.

This is a portable **settings file**, not recorded audio, MIDI, a melody seed, a play-position bookmark, autosave or cloud sync. Random melody/noise may differ on replay. Files are read locally, not uploaded. Keep a saved file before replacing unsaved edits.

### Exercised file workflow — 2026-11-08

Windows hidden Chrome against the production build: an actual JSON download retained Starry/Fast and two muted steps; invalid/cancelled previews preserved playing audio; explicit load stopped native dispatch; explicit Play respected the imported muted first step before a later enabled step sounded. Reload/file-load restored settings while paused without creating an AudioContext. Oversized input and 320px layout were checked, with no page errors/overflow. Existing native-audio smoke also passed both 1280px and 320px viewports (six PNGs).

Evidence is in the portfolio owner's `evidence/mej-music.json`, `evidence/mej-loop-browser-results.json`, `evidence/mej-loop.json`, screenshots and `evidence/mej-existing-browser/results.json`. These are muted headless checks, not a listening, physical-device, screen-reader or release qualification.


## Playback semantics and limitations

Each pattern entry is one sixteenth-note step; plain space-separated tokens in an entry sound together. `sn*4` divides that step into four snare hits. A rest is `~`. The first step occurs one sixteenth after Play. Preset/tempo changes while playing restart at the beginning; Pause followed by Play also starts from the beginning. Restart does not generate a new composition.

The earlier nonfunctional mood sliders, Track mode/timer and New Track button have been removed, not implemented. Mood shaping, timed composition, audio recording/export, MIDI, and sample loading remain deferred. Melody randomness is not a full procedural composition system. Preset descriptions describe musical ingredients, not verified listening quality. E-minor material is not advertised as phrygian.

The engine uses one lazily-created AudioContext and tracks active sources so pause stops existing tails as well as pending drum callbacks. Percussion uses oscillator kicks and filtered noise for hats/snare/clap, with simplified snare tone/clap envelopes; this increment is not sonically identical to the old synth. Output is attenuated, but **start with your device volume low**. This is not a mastered mix or limiter.

JavaScript interval scheduling is not sample-accurate and may drift or throttle in background tabs. No offline playback or native desktop build is provided. Browser audio requires a user gesture and a supported AudioContext. Tests and muted headless Windows Chrome checks do not validate audible quality, screen-reader behavior or physical devices. A browser listening check remains a release gate; see `DEVELOPMENT_GUIDE.md`.

## Structure

- `src/main.ts`: presets, native synthesis, semantic UI and application state
- `src/transport.ts`: injectable clock and cancellable sixteenth-step scheduling
- `src/style.css`: visual tokens and responsive instrument layout
- `src/loopFile.ts`: bounded versioned portable loop settings, without playback state
- `src/*.test.ts`: behavioral and DOM state tests

Unused Strudel and Tauri packages/scripts were removed after checking source imports and the repository tree (no desktop project exists). The obsolete Tauri Vite config import was also removed.
