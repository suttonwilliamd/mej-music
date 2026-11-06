# MeJ · 0.1.0

A small browser instrument built with **native Web Audio**, TypeScript and Vite. Choose Flow, Starry, Glitch or Demon, choose a tempo, then press Play. No account, samples, Strudel runtime or desktop wrapper is required.

## What works

- Four preserved preset patterns with synthesized percussion, bass, chords and occasional randomized melody.
- Slow / Mid / Fast set BPM to 75% / 100% / 125% of the preset base, rounded to the nearest integer. Base tempos: Starry 80, Flow 90, Glitch 130, Demon 140.
- Visible current BPM and playing/paused status. One persistent Play/Pause button, plus a clearly named Restart button (disabled while paused).
- Native radio groups for tempo/preset selection: Tab into a group, use arrow keys to select; Space activates buttons. Focus indicators and selected outlines do not rely on color alone.
- An editable 16-step groove mask. Each numbered On/Off button gates all voices for that preset step; the current-step underline advances even through muted steps. On permits the preset's existing ingredients, not a guaranteed hit (a preset can contain rests).
- Native step buttons support Tab, Space and Enter, with truthful `aria-pressed`, visible On/Off text, dashed muted outlines and amber keyboard focus. The responsive grid uses eight columns on wide desktop and four on narrower screens.
- Automatic browser-local session save/restore and portable JSON project download/import, sharing one validated versioned format. Loads always start paused.
- Master volume (0–100%) and mute affect every voice and already-sounding tail without restarting the loop. Native slider arrows/Home/End and the mute button work by keyboard; the selected percentage and muted/silent state remain visible on phone.
- Explicit local **Download WAV** renders one finite 16-step snapshot, including note tails, without recording or changing live playback.

## Run and verify

Use Node.js 22 and npm:

```sh
npm ci
npm run dev
# Open the local URL printed by Vite (default port 3000).
npm test
npm run build
npm run preview
```

Tests use Vitest fake timers and jsdom. They cover independently expected step durations, one-step-per-tick progression, tempo mapping, repeated-start replacement, cancellation of delayed repetitions, stop/restart, semantic selection/playback state and asynchronous audio-start cancellation/failure. Editor cases add literal default/edited masks, played-versus-muted drum and tonal outcomes, all-off including randomized melody, phase-preserving live edits/reset, edit persistence, stale callback fencing and pause/edit/start races. Session cases cover strict schema/version/size boundaries, exact reload restoration, malformed/read-failed import preservation, denied/quota-failed storage, import/startup races, and stop/restart using imported timing and notes. CI runs tests and builds on Ubuntu and Windows; workflow configuration is not evidence that remote jobs have run.

## Editing and reset

The default mask is **all 16 steps on**, preserving each original preset. Toggle any step before or during playback. One canonical session mask gates drums, bass, chords and randomized melody at dispatch; all-off leaves the transport running silently. The mask is shared across characters and survives tempo changes, Restart and Pause/Play. Character, tempo setting, all 16 steps, volume and mute save locally after edits and restore exactly on reload, **always paused**.

**Restore default pattern** turns all 16 steps on, including when paused or audio startup is pending. It does not change the selected character, tempo, playback state or loop position. Restart instead resets the loop position and cancels existing tails/repeats, without replacing your edits.

A live edit affects the next **not-yet-dispatched** step, without restarting the loop. Each step snapshots the mask once: a note already sounding and repeats already scheduled within that step are not undone by editing or restoring. Pause still cancels both active tails and pending repeats. This is a groove gate, not an instrument-note composer or a piano roll.

## Master output

**Volume** selects an integer percentage from 0 to 100. **Mute output** silences the master without changing that selection; **Unmute output** restores the latest selected level, including changes made while muted. Zero volume is silent even when unmuted. Mute does not pause: the marker and scheduler continue, retaining your edits and loop position. These controls also affect notes already sounding, unlike groove-step edits.

100% maps to the existing master gain of **0.6**, not a louder new maximum; 50% maps to 0.3. This is linear gain, not a perceived-loudness scale. Live changes use a short 15 ms ramp, reaching exact zero for mute. All voices share the same master node. No limiter, mastering or listening-quality guarantee is implied; keep device volume low.

Changing settings, restoring or importing before first Play never creates or resumes audio. First Play honors the latest settings, and changes while audio startup is pending remain effective. Settings are not per-instrument mixing.

## Download a WAV snapshot

**Download WAV** saves `mej-<character>-<speed>.wav`: standard stereo, **44,100 Hz,
16-bit signed little-endian PCM** in a RIFF/WAVE file. Both channels carry the
current mono instrument mix. It uses the same preset/token planner and native
oscillator/noise/filter/envelope synthesis as live playback, rendered locally with
`OfflineAudioContext`; there is no codec dependency, upload, microphone/system
recording or live-session capture.

Each explicit click captures character, tempo, all 16 steps, volume and mute.
The first step starts at **time zero**, regardless of the live play position
(live Play retains its existing one-sixteenth startup delay). Exactly one
16-step traversal is rendered, followed only by any still-sounding envelopes.
Duration is the greater of the complete step span and the latest note/drum end:
the longest voice envelope is one second. With the current presets/speeds,
the conservative bound is **five seconds / 220,500 frames / 882,044 WAV bytes**;
the actual snapshot is usually shorter. No extra loop or arbitrary long fade is
added, and natural tails mean this is **not promised to be a seamless loop**.

Export honors the same linear 0–100% → 0–0.6 output gain and mute; all-off,
zero-volume and muted snapshots are valid silent WAVs, not error fallbacks.
PCM saturates signed out-of-range samples; this is not a limiter or mastering
service. Noise and optional melody can be freshly randomized, so a WAV need not
match the current live realization or an earlier export. Project JSON does not
store a random seed, and this action does not generate a new composition.

Only the download button is unavailable while one render is pending; normal
editing, Play/Pause and Restart remain available. Editing settings, restoring
the pattern, selecting an import (even an invalid one), or resetting cancels
that snapshot's eventual download/error. Native offline work may still finish
internally; wait for the button to return, then explicitly download again.
Export never starts/resumes live audio, pauses/restarts the transport, cuts
current notes, saves settings or changes the project schema. Unsupported offline
audio, rendering, encoding or download failures show persistent accessible
feedback without changing the session/playback; another explicit attempt can
recover. Keep JSON separately when you want editable settings, not just sound.


## Sessions, project files and privacy

**Download project JSON** saves `mej-project.json`. **Import project JSON** opens a local file picker; choosing a valid file replaces your character, tempo, mask, volume and mute, cancels pending audio startup, notes and repetitions, and pauses. Press Play explicitly to start the imported loop from the beginning. Invalid, unreadable, oversized or unsupported files show an accessible error without changing your session, saved data or playback. Nothing uploads.

**Reset session to defaults** stops playback and saves Flow / Mid / all 16 steps on / volume 100% / unmuted as the new local session. This differs from **Restore default pattern**, which only enables the mask and preserves live play position, character, tempo, volume and mute.

Storage is one `localStorage` entry, `mej.session`, scoped to this browser profile and site origin (including port). There is no cloud, account, analytics or cross-tab synchronization. Browser clearing/private-mode policy can erase it; another tab can overwrite the stored entry. Download a file for a durable or portable copy. If storage access is blocked or quota is full, visible feedback says the session is not saved; playing, importing and downloading remain available. A later successful edit retries saving. Invalid saved data falls back to defaults without starting audio or overwriting that data until you edit, successfully import or explicitly reset.

The compact v2 format contains **only** these six fields:

```json
{"version":2,"preset":"flow","speed":"mid","steps":[true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true],"volume":100,"muted":false}
```

Preset is `starry`, `flow`, `glitch` or `demon`; speed is `slow`, `mid` or `fast`, not an arbitrary numeric BPM. Exactly 16 booleans, an integer `volume` from 0 to 100 and a boolean `muted` are required; extra fields are rejected. JSON files are limited to 4 KiB. Valid **v1** projects/local sessions (the same preset/speed/steps fields with `version:1` and no volume/mute fields) migrate to v2 in memory, preserving every edit and using **100% / unmuted**, the original output level. The next edit, import or reset writes v2 to the same `mej.session` key; downloads always use v2. There is no separate settings store. Other versions are rejected. This is a settings project, not audio export: it contains no transport position, play state, AudioContext, sound data, random seed, note edits or composition history. Melody randomness is not reproduced on load.


## Playback semantics and limitations

Each pattern entry is one sixteenth-note step; plain space-separated tokens in an entry sound together. `sn*4` divides that step into four snare hits. A rest is `~`. The first step occurs one sixteenth after Play. Preset/tempo changes while playing restart at the beginning; Pause followed by Play also starts from the beginning. Restart does not generate a new composition.

The earlier nonfunctional mood sliders, Track mode/timer and New Track button have been removed, not implemented. Mood shaping, timed composition, recording, MIDI, and sample loading remain deferred. Only finite WAV snapshot export is supported, not recording or general track production. Melody randomness is not a full procedural composition system. Preset descriptions describe musical ingredients, not verified listening quality. E-minor material is not advertised as phrygian.

The engine uses one lazily-created AudioContext and tracks active sources so pause stops existing tails as well as pending drum callbacks. Percussion uses oscillator kicks and filtered noise for hats/snare/clap, with simplified snare tone/clap envelopes; this increment is not sonically identical to the old synth. Output is attenuated, but **start with your device volume low**. This is not a mastered mix or limiter.

JavaScript interval scheduling is not sample-accurate and may drift or throttle in background tabs. No offline app installation or native desktop build is provided. Live browser audio requires a user gesture and a supported AudioContext; WAV rendering separately requires OfflineAudioContext. Headless tests do not validate listening quality, physical devices or screen-reader behavior. Actual rendered screenshot review and a browser listening check remain release gates; see `DEVELOPMENT_GUIDE.md`.

## Structure

- `src/main.ts`: semantic UI, application/session state and export cancellation
- `src/music.ts`: shared presets, note planning, native synthesis and lazy live output
- `src/transport.ts`: shared drum-token expansion, injectable clock and cancellable scheduling
- `src/wav.ts`: finite offline traversal and bounded stereo PCM WAV encoding
- `src/session.ts`: bounded versioned codec used by storage and project files
- `src/style.css`: visual tokens and responsive instrument layout
- `src/*.test.ts`: behavioral and DOM state tests

Unused Strudel and Tauri packages/scripts were removed after checking source imports and the repository tree (no desktop project exists). The obsolete Tauri Vite config import was also removed.
