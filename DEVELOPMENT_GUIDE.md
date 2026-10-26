# MeJ development and acceptance

See README for the actual native Web Audio architecture and supported features. The prior Strudel/Tauri development assumptions do not apply.

## Checks

Use Node 22. Run `npm ci`, `npm test`, and `npm run build`. GitHub Actions repeats test/build on Ubuntu and Windows after an authorized push. Do not treat Linux results as Windows evidence.

The transport accepts an injected Clock and hit callback; tests assert concrete expected millisecond durations, not a copy of the implementation formula. A generation token guards stale callbacks even if clock cancellation races. The UI accepts an injected Instrument so state and asynchronous resume failure/cancellation can be tested without real audio hardware.

## Visual direction

A compact field instrument: charcoal/forest surfaces (`#141b1b`, `#202c27`), warm off-white type (`#f4f1e9`), readable sage secondary text (`#b7c3bd`), and acid-lime active states (`#d6f28b`). Serif emphasis contrasts with system UI typography; no external font requests. Amber focus rings (`#ffcb83`) are distinct from selected outlines. Primary controls are at least 48px high. Two-column desktop hierarchy collapses at 760px; preset cards retain a two-by-two grid. The numbered groove pads are real buttons with stable accessible names and `aria-pressed`; On/Off labels and dashed muted borders distinguish state without color alone. Their inset amber current-step underline is visual only, not an announced stream of beats. Eight columns at widths above 1100px become four below, keeping touch targets usable at 320px. The mask gates every existing voice, rather than pretending to add unsupported instrument controls.

## Required rendered acceptance before release

For the editable-pattern increment, the comparison baseline is public master `0feea80b06ac3bca24c2ad4e0339be506de722ee`. Actual Linux headless Chromium before/after full-page captures at 1280×900 and 320×900 were produced and inspected by BobRoss. The browser checks exercised step Space/Enter toggles, Tab order, a 3px visible keyboard focus outline, default restore, Play/live edit/Pause and native tempo arrow selection, with no page errors or horizontal overflow at either width. Additional checks covered an emulated touch tap, reduced-motion marker styling and widths 640/760/900/1100/1101px (no overflow and step targets at least 44px wide). Browser 200% zoom was not exercised; 640px reflow is not a claim of native browser zoom testing. This does not establish audible output or native Windows/browser acceptance.

Repeatable acceptance checklist:

1. Capture the baseline and candidate at desktop and 320px, including one muted pad with keyboard focus. Check intermediate widths and 200% zoom/reflow for horizontal overflow.
2. Play each character at each tempo. Toggle steps while playing and confirm phase continues, skipped steps silence every voice, and the marker still advances. On permits existing preset content; it does not fill a rest.
3. Confirm Restore default pattern enables all 16 steps without changing character, tempo, playback state or loop position. Confirm Pause cancels tails/repeats and Play restarts at step 1 using the edited mask.
4. Tab through pads, restore, transport and native radio groups. Space/Enter toggle pads; arrow keys change radios. Focus must stay visible and state must be distinguishable without color.
5. Check reduced-motion preference and polite status; moving steps must not be a live announcement. Real screen-reader behavior remains a separate manual check.

Evidence from headless rendering is not a browser listening check, a physical touch-device test, or release approval.

## Browser audio / Windows acceptance

At low device volume, exercise each preset and each speed. Verify perceived tempo changes, only one loop plays after repeated clicks, pause silences tails and delayed drum bursts, restart returns to step zero, and switching presets cancels old bursts. Check start-pause during audio permission/startup and unsupported-audio failure messaging. Recheck after tab background/foreground (timer drift is a known limitation). Confirm no console exceptions. Repeat browser behavior on native Windows once the authorized runner is available; no Windows testing is claimed here.

Source tracking intentionally stops active Web Audio nodes on pause instead of suspending a context full of future notes. No desktop app, recording, timer or mood feature should be claimed without a separately tested implementation.
