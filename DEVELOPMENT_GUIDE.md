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
`npm ci`; all 25 current tests and the build must still pass.

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
Keyboard Space/Enter/Tab, visible focus, tempo-preserving reset, page errors and
horizontal overflow are checked at 1280 and 320 pixels. The six full-page PNGs show
paused, keyboard-focused and playing states at each width.

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
release acceptance. Root owns review/push and actual hosted Windows verification;
BobRoss must independently assess the actual hosted Windows images, not substitute
these local Linux captures. No app/synthesis/preset/test semantics are changed.

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

At low device volume, exercise each preset and each speed. Verify perceived tempo changes, only one loop plays after repeated clicks, pause silences tails and delayed drum bursts, restart returns to step zero, and switching presets cancels old bursts. Check start-pause during audio permission/startup and unsupported-audio failure messaging. Recheck after tab background/foreground (timer drift is a known limitation). Confirm no console exceptions. The portability branch below includes actual muted headless Windows browser checks; it does not establish listening quality or physical-device acceptance.

Source tracking intentionally stops active Web Audio nodes on pause instead of suspending a context full of future notes. No desktop app, recording, timer or mood feature should be claimed without a separately tested implementation.

## Portable loop settings — 2026-11-08 branch

`src/loopFile.ts` defines the bounded version-1 JSON contract described in README. Loading changes settings only after complete validation plus an explicit user action. Preview/cancel and invalid files leave transport/voices running; apply calls the existing pause path first, fencing audio startup and scheduled callbacks, then replaces settings and updates radio/mask state. Pending file reads have a separate generation token so old reads cannot revive cancelled/applied previews.

`npm test`: **25 passed**; `npm run build`: passed. Permanent regressions cover file boundaries, imported audible-versus-muted step outcomes, continued old playback after invalid/cancelled previews, async resume cancellation, and stale file-read fencing. Test-only deferred promises use the Node 22 `Promise.withResolvers` API; browser source remains ES2020.

Actual built-dist Windows Chrome file smoke passed using an isolated profile and ephemeral loopback preview. The downloaded file was read from disk; load after reload recovered Starry/Fast and steps 1/16 off. Preview/cancel/invalid input preserved playing audio. Load stopped native dispatch; Play alone resumed, with no first-step sources and later enabled native source starts. Loading while paused after reload created no AudioContext. A 16 KiB overflow file was rejected; desktop/320px screenshots were inspected without overflow or page errors.

Existing `npm run test:browser` also passed (two viewports, six PNGs) using the installed Chrome via process-local `MEJ_BROWSER_EXECUTABLE` and an isolated `MEJ_BROWSER_OUTPUT`. No browser installation, global environment change, audible recording or new service was needed. Its pre-commit `head` identifies the base checkout; `distManifest` hashes identify the actual changed production assets tested, not an unmodified-base claim.

Portfolio-owner artifacts outside this checkout: `evidence/mej-loop-browser-results.json`, `evidence/mej-loop.json`, desktop/mobile screenshots and `evidence/mej-existing-browser/results.json`. Non-Chromium engines, listening, physical touch devices, screen readers and timed/background accuracy remain unverified.
