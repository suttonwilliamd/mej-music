import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { preview } from 'vite'
import { wavSmoke } from './wav-smoke.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.resolve(process.env.MEJ_BROWSER_OUTPUT || path.join(root, 'artifacts/browser-smoke'))
const fault = process.env.MEJ_BROWSER_FAULT || ''
const artifacts = [], outcomes = [], pageErrors = [], blockedRequests = []
let browser, server, failure, stage = 'preflight', browserVersion = null, head = null
let context, currentPage, diagnostics = null
const distManifest = []
async function manifest(directory, prefix = '') {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = path.posix.join(prefix, entry.name)
    assert.ok(!entry.isSymbolicLink(), 'No symlinked dist assets')
    if (entry.isDirectory()) await manifest(path.join(directory, entry.name), name)
    else {
      const bytes = await readFile(path.join(directory, entry.name))
      distManifest.push({ name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') })
    }
  }
}
await mkdir(output, { recursive: true })
// A stale qualification must never survive a failed attempt in the same directory.
await writeFile(path.join(output, 'results.json'), JSON.stringify({ qualified: false, stage: 'starting' }) + '\n')
const deadline = setTimeout(async () => {
  // Close only this harness's owned browser and loopback server, even on a deadline.
  const emergencyExit = setTimeout(() => process.exit(1), 5000)
  await writeFile(path.join(output, 'results.json'), JSON.stringify({ qualified: false, failure: '90s deadline exceeded' }) + '\n')
  server?.httpServer.closeAllConnections?.()
  server?.httpServer.close()
  await browser?.close().catch(() => {})
  clearTimeout(emergencyExit)
  process.exit(1)
}, 90000)
// Individual operations are bounded too; normal failures always use finally cleanup.
try {
  assert.ok(['', 'missing-dist', 'external-request', 'page-error'].includes(fault))
  head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', timeout: 5000 }).trim()
  const index = await readFile(path.join(root, fault === 'missing-dist' ? 'missing-dist/index.html' : 'dist/index.html'))
  assert.ok(index.length > 0)
  await manifest(path.join(root, 'dist'))
  stage = 'preview'
  server = await preview({ root, configFile: false, preview: { host: '127.0.0.1', port: 0, strictPort: true, open: false } })
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  stage = 'browser-launch'
  browser = await chromium.launch({ headless: true, args: ['--mute-audio'], timeout: 15000,
    executablePath: process.env.MEJ_BROWSER_EXECUTABLE || undefined })
  browserVersion = browser.version()
  for (const width of [1280, 320]) {
    stage = `viewport-${width}`
    context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' })
    await context.routeWebSocket('**/*', socket => {
      if (blockedRequests.length < 10) blockedRequests.push('WebSocket blocked')
      socket.close()
    })
    await context.route('**/*', route => {
      if (new URL(route.request().url()).origin === origin) return route.continue()
      if (blockedRequests.length < 10) blockedRequests.push('non-preview request blocked')
      return route.abort('blockedbyclient')
    })
    // Observe native APIs without substituting AudioContext, clocks, nodes or synthesis.
    // Every intercepted method invokes the original browser implementation.
    await context.addInitScript(() => {
      const probe = { starts: 0, stops: 0, contexts: [], edges: [], sources: [], intervals: 0, clears: 0, holdResume: false, releases: [] }
      Object.defineProperty(window, '__mejProbe', { value: probe })
      const NativeContext = window.AudioContext
      window.AudioContext = new Proxy(NativeContext, { construct(target, args) {
        const context = Reflect.construct(target, args)
        probe.contexts.push(context)
        return context
      } })
      const connect = AudioNode.prototype.connect
      AudioNode.prototype.connect = function (...args) {
        const result = Reflect.apply(connect, this, args)
        probe.edges.push([this, args[0]])
        return result
      }
      for (const method of ['setInterval', 'clearInterval']) {
        const native = window[method]
        window[method] = function (...args) {
          const result = Reflect.apply(native, this, args)
          probe[method === 'setInterval' ? 'intervals' : 'clears']++
          return result
        }
      }
      for (const method of ['start', 'stop']) {
        for (const prototype of [OscillatorNode.prototype, AudioBufferSourceNode.prototype]) {
          const native = prototype[method]
          prototype[method] = function (...args) {
            const result = Reflect.apply(native, this, args)
            probe[method === 'start' ? 'starts' : 'stops']++
            if (method === 'start') probe.sources.push(this)
            return result
          }
        }
      }
      const resume = AudioContext.prototype.resume
      NativeContext.prototype.resume = function (...args) {
        const result = Reflect.apply(resume, this, args)
        if (!probe.holdResume) return result
        const { promise, resolve } = Promise.withResolvers()
        probe.releases.push(resolve)
        return result.then(() => promise)
      }
    })
    const page = await context.newPage()
    currentPage = page
    page.setDefaultTimeout(8000)
    page.setDefaultNavigationTimeout(10000)
    page.on('pageerror', () => { if (pageErrors.length < 10) pageErrors.push('uncaught browser page error') })
    await page.goto(origin, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    if (fault === 'external-request') {
      await page.evaluate(() => fetch('https://example.invalid/blocked-probe').catch(() => null))
      assert.equal(blockedRequests.length, 1)
      throw Error('fault probe')
    }
    if (fault === 'page-error') {
      await page.evaluate(() => { setTimeout(() => { throw Error('synthetic page-error probe') }, 0) })
      await page.waitForTimeout(100)
      assert.equal(pageErrors.length, 1)
      throw Error('fault probe')
    }
    const capture = async state => {
      const name = `${width}-${state}.png`
      await page.screenshot({ path: path.join(output, name), fullPage: true, timeout: 8000 })
      const bytes = await readFile(path.join(output, name))
      assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
      artifacts.push({ name, state, viewport: { width, height: 900 }, bytes: bytes.length,
        width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20),
        sha256: createHash('sha256').update(bytes).digest('hex') })
    }
    const noOverflow = async () => {
      const size = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }))
      assert.equal(size.scrollWidth, size.width)
      return size
    }
    const first = page.getByRole('button', { name: 'Step 1', exact: true })
    await first.waitFor()
    // Empty feedback must already exist in Chromium's accessibility tree before
    // its first update; revealing populated live regions can lose announcements.
    const feedbackExposed = async () => {
      const cdp = await context.newCDPSession(page)
      try {
        const { root } = await cdp.send('DOM.getDocument')
        const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '#project-status' })
        const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false })
        assert.equal(nodes[0]?.ignored, false, 'Project feedback must remain exposed while empty')
        assert.ok(nodes[0].properties.some(property => property.name === 'live' && property.value.value === 'polite'))
      } finally {
        await cdp.detach()
      }
    }
    await feedbackExposed()
    const legacy = { version: 1, preset: 'flow', speed: 'mid', steps: Array(16).fill(true) }
    await page.locator('#import-project').setInputFiles({ name: 'legacy.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(legacy)) })
    await page.waitForFunction(() => document.querySelector('#project-status')?.textContent.includes('Project imported'))
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('mej.session'))), { ...legacy, version: 2, volume: 100, muted: false })
    assert.equal(await page.evaluate(() => window.__mejProbe.contexts.length), 0)
    const volume = page.getByRole('slider', { name: 'Volume', exact: true })
    const setVolume = async value => {
      await volume.evaluate((input, level) => {
        input.value = String(level)
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }, value)
      assert.equal(await page.locator('#volume-value').innerText(), `${value}%`)
    }
    await volume.focus()
    await volume.press('Home')
    assert.equal(await volume.inputValue(), '0')
    await volume.press('ArrowRight')
    assert.equal(await volume.inputValue(), '1')
    await volume.press('End')
    assert.equal(await volume.inputValue(), '100')
    await setVolume(37)
    await page.getByRole('button', { name: 'Mute output', exact: true }).press('Space')
    assert.equal(await page.locator('#volume-state').innerText(), 'Muted · selected 37%')
    assert.equal(await page.evaluate(() => window.__mejProbe.contexts.length), 0)
    assert.equal(await page.locator('.step-toggle').count(), 16)
    await capture('paused')
    await first.focus()
    await first.press('Space')
    assert.equal(await first.getAttribute('aria-pressed'), 'false')
    await first.press('Enter')
    assert.equal(await first.getAttribute('aria-pressed'), 'true')
    await first.press('Tab')
    await page.keyboard.press('Space')
    const focus = await page.evaluate(() => ({ name: document.activeElement?.getAttribute('aria-label'),
      pressed: document.activeElement?.getAttribute('aria-pressed'), outline: getComputedStyle(document.activeElement).outlineWidth }))
    assert.deepEqual(focus, { name: 'Step 2', pressed: 'false', outline: '3px' })
    await capture('focused')
    const fast = page.locator('input[name="speed"][value="fast"]')
    await fast.focus()
    await fast.press('Space')
    assert.equal(await fast.isChecked(), true)
    const bpm = await page.locator('#bpm').innerText()
    const reset = page.getByRole('button', { name: 'Restore default pattern', exact: true })
    await reset.click()
    assert.equal(await page.locator('.step-toggle[aria-pressed="true"]').count(), 16)
    assert.equal(await fast.isChecked(), true)
    assert.equal(await page.locator('#bpm').innerText(), bpm)
    // All-off first Play must advance its marker without dispatching any native sources.
    for (const step of await page.locator('.step-toggle').all()) await step.click()
    await page.getByRole('button', { name: 'Play music', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('#status')?.textContent === 'Playing')
    await page.waitForFunction(() => window.__mejProbe.contexts.some(c => c.state === 'running' && c.currentTime > 0))
    const mutedMarker = await page.locator('.step-toggle.current').getAttribute('data-step')
    await page.waitForFunction(previous => document.querySelector('.step-toggle.current')?.getAttribute('data-step') !== previous, mutedMarker)
    assert.equal(await page.evaluate(() => window.__mejProbe.starts), 0)
    assert.equal(await page.evaluate(() => {
      const p = window.__mejProbe
      return p.edges.find(([, to]) => to === p.contexts[0].destination)[0].gain.value
    }), 0, 'First Play honors settings chosen before audio creation')
    // Restore is a live edit; real native dispatch must resume on subsequent steps.
    await reset.click()
    assert.equal(await page.getByRole('status').innerText(), 'Playing')
    await page.waitForFunction(() => window.__mejProbe.starts > 0)
    const masterState = () => page.evaluate(() => {
      const p = window.__mejProbe
      const master = p.edges.find(([, to]) => to === p.contexts[0].destination)[0]
      const pathsControlled = (node, controlled = false, seen = new Set()) => {
        if (node === p.contexts[0].destination) return controlled
        if (seen.has(node)) return false
        const next = p.edges.filter(([from]) => from === node)
        return next.length > 0 && next.every(([, to]) => pathsControlled(to, controlled || node === master, new Set([...seen, node])))
      }
      return { gain: master.gain.value, allControlled: p.sources.every(source => pathsControlled(source)),
        sourceTypes: [...new Set(p.sources.map(source => source.constructor.name))],
        starts: p.starts, intervals: p.intervals, clears: p.clears, masters: p.edges.filter(([, to]) => to === p.contexts[0].destination).length }
    })
    const beforeOutput = await masterState()
    assert.equal(beforeOutput.gain, 0)
    assert.equal(beforeOutput.allControlled, true)
    assert.equal(beforeOutput.masters, 1)
    await page.getByRole('button', { name: 'Unmute output', exact: true }).click()
    await page.waitForFunction(() => {
      const p = window.__mejProbe
      return Math.abs(p.edges.find(([, to]) => to === p.contexts[0].destination)[0].gain.value - 0.222) < 0.00001
    })
    await setVolume(62)
    await page.waitForFunction(() => {
      const p = window.__mejProbe
      return Math.abs(p.edges.find(([, to]) => to === p.contexts[0].destination)[0].gain.value - 0.372) < 0.00001
    })
    const outputMarker = await page.locator('.step-toggle.current').getAttribute('data-step')
    await page.getByRole('button', { name: 'Mute output', exact: true }).click()
    await page.waitForFunction(() => {
      const p = window.__mejProbe
      return p.edges.find(([, to]) => to === p.contexts[0].destination)[0].gain.value === 0
    })
    await page.waitForFunction(previous => document.querySelector('.step-toggle.current')?.getAttribute('data-step') !== previous, outputMarker)
    await setVolume(37)
    await page.getByRole('button', { name: 'Unmute output', exact: true }).click()
    await page.waitForFunction(() => {
      const p = window.__mejProbe
      return Math.abs(p.edges.find(([, to]) => to === p.contexts[0].destination)[0].gain.value - 0.222) < 0.00001
    })
    await page.waitForFunction(() => {
      const sources = window.__mejProbe.sources
      return sources.some(source => source instanceof OscillatorNode) && sources.some(source => source instanceof AudioBufferSourceNode)
    })
    const afterOutput = await masterState()
    assert.equal(afterOutput.intervals, beforeOutput.intervals)
    assert.equal(afterOutput.clears, beforeOutput.clears)
    assert.equal(afterOutput.allControlled, true)
    assert.ok(afterOutput.starts > beforeOutput.starts)
    assert.deepEqual(afterOutput.sourceTypes.sort(), ['AudioBufferSourceNode', 'OscillatorNode'])
    await page.getByRole('button', { name: 'Mute output', exact: true }).click()
    await first.click()
    assert.equal(await first.getAttribute('aria-pressed'), 'false')
    await capture('playing')
    const dimensions = await noOverflow()
    await page.getByRole('button', { name: 'Pause music', exact: true }).click()
    assert.equal(await page.getByRole('status').innerText(), 'Paused')
    assert.equal(await page.locator('.step-toggle.current').count(), 0)
    const starts = await page.evaluate(() => window.__mejProbe.starts)
    await page.waitForTimeout(800)
    assert.equal(await page.evaluate(() => window.__mejProbe.starts), starts)
    assert.equal(await page.locator('.step-toggle.current').count(), 0)
    assert.equal(await fast.isChecked(), true)
    const audio = await page.evaluate(() => ({ starts: window.__mejProbe.starts, stops: window.__mejProbe.stops,
      contexts: window.__mejProbe.contexts.map(c => ({ state: c.state, sampleRate: c.sampleRate, currentTime: c.currentTime })) }))
    assert.ok(audio.stops > 0)
    // A native idle graph must finish output transitions too, without new voices,
    // a scheduler restart or Play. Previously Chromium could strand a ramp when
    // the last source disconnected before its endpoint.
    const idleIntervals = await page.evaluate(() => window.__mejProbe.intervals)
    await setVolume(52)
    await page.getByRole('button', { name: 'Unmute output', exact: true }).click()
    await page.waitForFunction(() => {
      const p = window.__mejProbe
      return Math.abs(p.edges.find(([, to]) => to === p.contexts[0].destination)[0].gain.value - 0.312) < 0.00001
    })
    assert.equal(await page.evaluate(() => window.__mejProbe.starts), starts)
    assert.equal(await page.evaluate(() => window.__mejProbe.intervals), idleIntervals)
    assert.equal(await page.locator('#status').innerText(), 'Paused')
    await setVolume(37)
    await page.getByRole('button', { name: 'Mute output', exact: true }).click()
    // Exercise actual browser download and file chooser imports, not an app test seam.
    await page.locator('input[name="preset"][value="demon"]').check()
    await page.locator('input[name="speed"][value="slow"]').check()
    const expected = { version: 2, preset: 'demon', speed: 'slow', steps: [false, ...Array(15).fill(true)], volume: 37, muted: true }
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download project JSON', exact: true }).click()
    const download = await downloadPromise
    assert.equal(download.suggestedFilename(), 'mej-project.json')
    const projectPath = path.join(output, `${width}-project.json`)
    await download.saveAs(projectPath)
    assert.deepEqual(JSON.parse(await readFile(projectPath, 'utf8')), expected)
    await page.getByRole('button', { name: 'Reset session to defaults', exact: true }).click()
    assert.equal(await page.locator('#preset-name').innerText(), 'Flow')
    assert.equal(await page.locator('.step-toggle[aria-pressed="true"]').count(), 16)
    assert.equal(await volume.inputValue(), '100')
    assert.equal(await page.locator('#mute').getAttribute('aria-pressed'), 'false')
    await page.locator('#import-project').setInputFiles(projectPath)
    await page.waitForFunction(() => document.querySelector('#project-status')?.textContent.includes('Project imported'))
    assert.equal(await page.locator('#preset-name').innerText(), 'Demon')
    assert.equal(await page.locator('#bpm').innerText(), '105')
    assert.equal(await page.getByRole('status').innerText(), 'Paused')
    assert.equal(await first.getAttribute('aria-pressed'), 'false')
    assert.equal(await volume.inputValue(), '37')
    assert.equal(await page.locator('#mute').getAttribute('aria-pressed'), 'true')
    // Malformed import must preserve a live run and the persisted session.
    await page.getByRole('button', { name: 'Play music', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('#status')?.textContent === 'Playing')
    await page.locator('#import-project').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"version":99}') })
    await page.waitForFunction(() => document.querySelector('#project-error')?.textContent.includes('Import failed'))
    assert.equal(await page.getByRole('status').innerText(), 'Playing')
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('mej.session'))), expected)
    await feedbackExposed()
    // Valid import stops the real scheduler and nodes, without a later resurrection.
    await page.locator('#import-project').setInputFiles(projectPath)
    await page.waitForFunction(() => document.querySelector('#status')?.textContent === 'Paused')
    const importedStarts = await page.evaluate(() => window.__mejProbe.starts)
    await page.waitForTimeout(400)
    assert.equal(await page.evaluate(() => window.__mejProbe.starts), importedStarts)
    assert.equal(await page.locator('.step-toggle.current').count(), 0)
    await page.reload({ waitUntil: 'networkidle' })
    assert.equal(await page.locator('#preset-name').innerText(), 'Demon')
    assert.equal(await page.locator('#bpm').innerText(), '105')
    assert.equal(await page.locator('input[name="speed"][value="slow"]').isChecked(), true)
    assert.equal(await page.getByRole('status').innerText(), 'Paused')
    assert.equal(await page.locator('.step-toggle[aria-pressed="true"]').count(), 15)
    assert.equal(await first.getAttribute('aria-pressed'), 'false')
    assert.equal(await page.evaluate(() => window.__mejProbe.contexts.length), 0)
    assert.equal(await volume.inputValue(), '37')
    assert.equal(await page.locator('#volume-state').innerText(), 'Muted · selected 37%')
    await capture('session-restored')
    await noOverflow()
    // Native audio still starts/resumes normally; defer only the app-facing promise
    // to exercise settings/import/reset races without fake contexts or nodes.
    await page.evaluate(() => { window.__mejProbe.holdResume = true })
    await page.getByRole('button', { name: 'Play music', exact: true }).click()
    await page.waitForFunction(() => window.__mejProbe.releases.length === 1)
    await setVolume(24)
    await page.getByRole('button', { name: 'Unmute output', exact: true }).click()
    await page.waitForFunction(() => {
      const p = window.__mejProbe
      return Math.abs(p.edges.find(([, to]) => to === p.contexts[0].destination)[0].gain.value - 0.144) < 0.00001
    })
    await page.evaluate(() => window.__mejProbe.releases.shift()())
    await page.waitForFunction(() => document.querySelector('#status')?.textContent === 'Playing')
    await page.getByRole('button', { name: 'Pause music', exact: true }).click()
    await page.getByRole('button', { name: 'Play music', exact: true }).click()
    await page.waitForFunction(() => window.__mejProbe.releases.length === 1)
    await page.locator('#import-project').setInputFiles(projectPath)
    await page.waitForFunction(() => document.querySelector('#status')?.textContent === 'Paused')
    await page.evaluate(() => window.__mejProbe.releases.shift()())
    await page.waitForTimeout(200)
    assert.equal(await page.getByRole('status').innerText(), 'Paused')
    assert.equal((await masterState()).gain, 0)
    await page.getByRole('button', { name: 'Play music', exact: true }).click()
    await page.waitForFunction(() => window.__mejProbe.releases.length === 1)
    await page.getByRole('button', { name: 'Reset session to defaults', exact: true }).click()
    await page.evaluate(() => window.__mejProbe.releases.shift()())
    await page.waitForTimeout(200)
    assert.equal(await page.getByRole('status').innerText(), 'Paused')
    assert.ok(Math.abs((await masterState()).gain - 0.6) < 0.00001)
    await page.evaluate(old => localStorage.setItem('mej.session', JSON.stringify(old)), legacy)
    await page.reload({ waitUntil: 'networkidle' })
    assert.equal(await page.getByRole('status').innerText(), 'Paused')
    assert.equal(await volume.inputValue(), '100')
    assert.equal(await page.locator('#mute').getAttribute('aria-pressed'), 'false')
    assert.equal(await page.evaluate(() => window.__mejProbe.contexts.length), 0)
    await setVolume(19)
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('mej.session'))), { ...legacy, version: 2, volume: 19, muted: false })
    stage = `viewport-${width}-wav`
    const wav = await wavSmoke({ context, origin, width, output, artifacts })
    assert.deepEqual(pageErrors, [])
    assert.deepEqual(blockedRequests, [])
    outcomes.push({ ...dimensions, keyboard: true, resetPreservesTempo: true, mutedNativeDispatch: 0,
      liveEditNativeDispatch: true, pauseNoLaterDispatch: true, markerCleanup: true,
      projectDownloadImport: true, invalidImportPreservesPlayback: true, importedPauseNoLaterDispatch: true,
      feedbackLiveRegionExposed: true, reloadExactAndPaused: true, reloadAudioContexts: 0,
      masterGain: { allSourcesControlled: true, maximum: 0.6, selected37: 0.222, muted: 0, phasePreserved: true, pendingResumeLatest: true, importResetCancellation: true },
      wav,
      audio })
    await context.close()
    context = null
  }
} catch (error) {
  // Keep only our source location, never arbitrary browser errors or environment.
  const location = error instanceof Error ? error.stack?.match(/(?:browser-smoke|wav-smoke)\.mjs:\d+:\d+/)?.[0] : undefined
  failure = `Smoke failed at ${stage}${location ? ` (${location})` : ''}`
  diagnostics = await currentPage?.evaluate(() => {
    const p = window.__mejProbe
    const context = p?.contexts[0]
    const master = p?.edges.find(([, to]) => to === context?.destination)?.[0]
    return { volume: document.querySelector('#volume')?.value, muted: document.querySelector('#mute')?.getAttribute('aria-pressed'), gain: master?.gain.value, contextState: context?.state, contextTime: context?.currentTime, starts: p?.starts, stops: p?.stops, intervals: p?.intervals, clears: p?.clears }
  }).catch(() => null)
} finally {
  stage = failure ? stage : 'cleanup'
  try { await context?.close(); await browser?.close() } catch { failure ||= 'Browser cleanup failed' }
  try {
    if (server) {
      server.httpServer.closeAllConnections?.()
      await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()))
    }
  } catch { failure ||= 'Preview cleanup failed' }
  clearTimeout(deadline)
  await writeFile(path.join(output, 'results.json'), JSON.stringify({
    qualified: !failure && outcomes.length === 2 && artifacts.length === 16,
    platform: process.platform, arch: process.arch, node: process.version, head,
    browser: { name: 'Chromium', version: browserVersion }, fault: fault || null,
    evidenceLimit: 'Muted headless native Web Audio; not listening, device, Edge, screen-reader, sample accuracy or release acceptance. Windows only if platform is win32.',
    diagnostics,
    distManifest, outcomes, artifacts, pageErrors, blockedRequests, failure,
  }, null, 2) + '\n')
}
if (failure) { console.error(failure); process.exitCode = 1 }
else console.log('Built-dist Chromium smoke passed (2 viewports, 16 PNGs, project sessions/master gain and native WAV download/decode).')
