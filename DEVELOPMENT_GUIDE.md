# MeJ development and acceptance

See README for the actual native Web Audio architecture and supported features. The prior Strudel/Tauri development assumptions do not apply.

## Checks

Use Node 22. Run `npm ci`, `npm test`, and `npm run build`. GitHub Actions repeats test/build on Ubuntu and Windows after an authorized push. Do not treat Linux results as Windows evidence.

The transport accepts an injected Clock and hit callback; tests assert concrete expected millisecond durations, not a copy of the implementation formula. A generation token guards stale callbacks even if clock cancellation races. The UI accepts an injected Instrument so state and asynchronous resume failure/cancellation can be tested without real audio hardware.

## Visual direction

A compact field instrument: charcoal/forest surfaces (`#141b1b`, `#202c27`), warm off-white type (`#f4f1e9`), readable sage secondary text (`#b7c3bd`), and acid-lime active states (`#d6f28b`). Serif emphasis contrasts with system UI typography; no external font requests. Amber focus rings (`#ffcb83`) are distinct from selected outlines. Primary controls are at least 48px high. Two-column desktop hierarchy collapses at 760px; preset cards retain a two-by-two grid. The step strip is decorative and hidden from assistive technology, not an announced stream of beats.

## Required rendered acceptance before release

This service worker has no configured browser/screenshot tool. Baseline: `eb5ea18` (use a separate checkout; do not reset the delivery branch). The baseline entry point imported `main.ts` without importing its stylesheet, so do not assume the old CSS represented its rendered appearance.

CEO-assisted screenshot handoff:

1. Capture baseline at `eb5ea18` and the delivered branch at 1280×900 and 375×812; also inspect 320px width and 200% zoom for horizontal overflow.
2. Capture final paused Flow/Mid and playing Glitch/Fast states. Confirm 90 BPM and 163 BPM respectively (rounding 162.5 up).
3. Tab through transport and radio groups. Capture an amber keyboard-focus ring. Verify Space toggles playback, arrow keys change native radio selection, the focus stays on the Play/Pause button, and selected cards have a border plus text distinction.
4. Check reduced-motion preference: no animated transitions; no glow on the moving current-step marker. Verify status is announced politely but steps are not announced.
5. Return the actual images for BobRoss review, or explicitly record CEO visual acceptance. Do not release based on source inspection or jsdom alone.

## Browser audio / Windows acceptance

At low device volume, exercise each preset and each speed. Verify perceived tempo changes, only one loop plays after repeated clicks, pause silences tails and delayed drum bursts, restart returns to step zero, and switching presets cancels old bursts. Check start-pause during audio permission/startup and unsupported-audio failure messaging. Recheck after tab background/foreground (timer drift is a known limitation). Confirm no console exceptions. Repeat browser behavior on native Windows once the authorized runner is available; no Windows testing is claimed here.

Source tracking intentionally stops active Web Audio nodes on pause instead of suspending a context full of future notes. No desktop app, recording, timer or mood feature should be claimed without a separately tested implementation.
