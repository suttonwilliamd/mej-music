# MeJ development and acceptance

See README for the actual native Web Audio architecture and supported features. The prior Strudel/Tauri development assumptions do not apply.

## Checks

Use Node 22. Run `npm ci`, `npm test`, and `npm run build`. GitHub Actions repeats test/build on Ubuntu and Windows after an authorized push. Do not treat Linux results as Windows evidence.

### Retained development-tool advisories

Vitest is pinned to 4.1.12 (including `@vitest/mocker` 4.1.12) to address
GHSA-82fw-gwwq-j7x9 and GHSA-qxg6-89mg-rqv8 without jumping to Vitest 5.
This version no longer needs tinypool, removing the retained prototype-pollution
gadgets rather than overriding its dependency range. Compatible lockfile refreshes
update PostCSS, Rollup, nanoid and source-map-js; Vite remains 6.4.5 and Playwright
remains 1.64.1. No test, application, browser harness or workflow change is needed.

The October 26, 2026 local full audit moved from seven affected **development**
entries (one moderate, four high, two critical) to zero; production audit remained
zero. Audit entries include dependency propagation and are not seven demonstrated
production exploits. Registry audit results are time-specific, not a guarantee
against unknown vulnerabilities. Never expose development/test servers to untrusted
networks or use untrusted inputs on the assumption that production audit covers them.
Recheck with `npm audit --json` and `npm audit --omit=dev --json` after fresh
`npm ci`; all 18 existing tests and the build must still pass.

### Real built-dist browser smoke

After `npm ci && npm test && npm run build`, run `npx playwright install chromium`
(user-scoped browser download, not a host package installation), then `npm run test:browser`.
Playwright is pinned to 1.64.1 in the lockfile; its matching Chromium is the CI default.
The existing Node 22 Ubuntu/Windows matrix retains its separate test/build steps and
now runs this actual browser check. Workflow configuration alone is not Windows qualification:
inspect the successful hosted Windows job and its `platform: "win32"` JSON and actual images.

The harness serves only production `dist` on ephemeral IPv4 loopback, blocks other
browser network requests and WebSockets, disables service workers, bounds operations
and the entire run (90 seconds plus 5-second emergency cleanup), and closes its owned
browser/server. It does not substitute audio implementations: wrappers observe native
resume/start/stop and invoke the original methods. All-off Play advances markers with
zero source starts; live restore resumes real native dispatch, and Pause leaves no
new dispatch or marker. A running reused AudioContext after Pause is intentional.
Keyboard Space/Enter/Tab, visible focus, tempo-preserving pattern reset, page errors and
horizontal overflow are checked at 1280 and 320 pixels. The eight full-page PNGs show
paused, keyboard-focused, playing and imported/reloaded session states at each width.
Each isolated viewport context also downloads a real JSON file, resets, imports that
file through the browser file input, rejects an unsupported file during playback,
imports successfully to stop the native scheduler, and reloads to exact settings with
zero AudioContexts created. Chromium output is explicitly muted with `--mute-audio`.

`artifacts/browser-smoke/results.json` is success-only qualification (`qualified: true`
only after both viewports and cleanup), with Git head, Node/platform/browser identity,
actual dist hashes, PNG dimensions/hashes and per-viewport outcomes. CI uploads these
files on success or failure, under OS-and-SHA-specific artifact names. Failure messages
are intentionally sanitized: no arbitrary browser errors, raw environment, private
profiles or audio recordings. A new run first invalidates any old qualification; only
files explicitly listed in that run's manifest are evidence for that attempt.

Optional local-only environment controls: `MEJ_BROWSER_EXECUTABLE` selects an existing
accessible Chromium, and `MEJ_BROWSER_OUTPUT` selects an evidence directory. Use a
separate output directory for each attempt. `MEJ_BROWSER_FAULT=missing-dist`,
`external-request`, or `page-error` intentionally exits nonzero with `qualified: false`
for fail-closed regression checks (no application assertions are disabled). An invalid
executable likewise must fail at launch. These probes do not qualify any platform.

Muted headless output is not listening/device, Edge, screen-reader, sample-accuracy or
release acceptance. Aaron owns independent review/publication and hosted CI verification;
local browser evidence does not substitute for a successful hosted job or listening check.

The transport accepts an injected Clock and hit callback; tests assert concrete expected millisecond durations, not a copy of the implementation formula. A generation token guards stale callbacks even if clock cancellation races. The UI accepts an injected Instrument so state and asynchronous resume failure/cancellation can be tested without real audio hardware.

### Session persistence acceptance (November 6, 2026)

The local Windows run used Node 24.20.0 and Chromium 156.0.8078.4. `npm test`
passed **54 tests across four files**, and `npm run build` passed. The prior reload
regression was reproduced before implementation: an edited Demon/Slow session
reopened as Flow. The completed regression restores Demon/Slow and the exact mask,
paused. Initial final-check failures were jsdom's queued storage-event tasks being
counted as audio timers; test interaction helpers now deliver those zero-delay tasks
without advancing transport ticks, retaining the cancellation assertions.

`npm run test:browser` passed on `platform: "win32"` using production `dist`,
ephemeral loopback and fresh isolated contexts. `artifacts/browser-smoke/results.json`
records dist/image hashes and both outcomes; eight PNGs and two actual exported
project files are beside it. `1280-session-restored.png` and
`320-session-restored.png` were inspected: Demon, 105 BPM, Slow, step 1 off,
15 enabled steps and paused state remain visible without horizontal overflow.
An additional owned browser-helper tab imported the actual desktop export and
reloaded, then was closed; its dedicated preview server was stopped. This is local
Windows browser evidence, not a claim about a new hosted CI job.

The real native AudioContext reached `running`; all-off dispatch started zero sources,
live restore dispatched real sources, Pause/import stopped later dispatch, and reload
created no context. Output was muted, not listened to. No audible-quality, physical
device, screen-reader or sample-accuracy claim follows from this smoke.

Session unit/DOM coverage includes malformed JSON, unsupported/missing versions,
extra/missing fields, enum and boolean-mask boundaries, the 4096-character ASCII
format boundary, independent decoded/default arrays, exact reload, invalid saved
data preservation, blocked storage access, quota recovery, unreadable/oversized files,
invalid-import playback preservation, stale file reads, pending-resume import races,
cancellation of queued drum repetitions, imported timing/notes and explicit reset.
The file-read and audio-start races use controlled promises in DOM tests; native
browser smoke covers actual file IO and scheduler behavior, not a simulated delayed
browser audio-permission dialog.

Independent review caught empty project feedback being removed from the accessibility
tree with `display: none`. Empty feedback now collapses only its margins, so its live
region exists before a message is added. A real Chromium accessibility-tree regression
failed against the former CSS and passed after correction at both widths, checking
the empty polite region initially and again after a rejected import. The final build
and complete browser smoke passed after the fix. This checks browser exposure, not
actual announcements by a particular screen reader.

See README for the `mej.session` key, v1 JSON schema, 4 KiB file cap, storage privacy
and reset semantics. No state is uploaded, no dependencies were added, and projects
do not serialize audio, transport state or melody randomness. For future changes,
keep validation before state mutation, keep imports paused, preserve invalid-import
playback, and test storage failure independently of audio availability.


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
