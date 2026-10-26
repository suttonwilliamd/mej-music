import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { preview } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.resolve(process.env.MEJ_BROWSER_OUTPUT || path.join(root, 'artifacts/browser-smoke'))
const fault = process.env.MEJ_BROWSER_FAULT || ''
const artifacts = [], outcomes = [], pageErrors = [], blockedRequests = []
let browser, server, failure, stage = 'preflight', browserVersion = null, head = null
let context
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
  browser = await chromium.launch({ headless: true, timeout: 15000,
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
      const probe = { starts: 0, stops: 0, contexts: [] }
      Object.defineProperty(window, '__mejProbe', { value: probe })
      for (const method of ['start', 'stop']) {
        for (const prototype of [OscillatorNode.prototype, AudioBufferSourceNode.prototype]) {
          const native = prototype[method]
          prototype[method] = function (...args) {
            const result = Reflect.apply(native, this, args)
            probe[method === 'start' ? 'starts' : 'stops']++
            return result
          }
        }
      }
      const resume = AudioContext.prototype.resume
      AudioContext.prototype.resume = function (...args) {
        if (!probe.contexts.includes(this)) probe.contexts.push(this)
        return Reflect.apply(resume, this, args)
      }
    })
    const page = await context.newPage()
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
    // Restore is a live edit; real native dispatch must resume on subsequent steps.
    await reset.click()
    assert.equal(await page.getByRole('status').innerText(), 'Playing')
    await page.waitForFunction(() => window.__mejProbe.starts > 0)
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
    assert.deepEqual(pageErrors, [])
    assert.deepEqual(blockedRequests, [])
    outcomes.push({ ...dimensions, keyboard: true, resetPreservesTempo: true, mutedNativeDispatch: 0,
      liveEditNativeDispatch: true, pauseNoLaterDispatch: true, markerCleanup: true, audio })
    await context.close()
    context = null
  }
} catch {
  // Deliberately do not persist arbitrary errors, URLs, paths, environment or browser logs.
  failure = `Smoke failed at ${stage}`
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
    qualified: !failure && outcomes.length === 2 && artifacts.length === 6,
    platform: process.platform, arch: process.arch, node: process.version, head,
    browser: { name: 'Chromium', version: browserVersion }, fault: fault || null,
    evidenceLimit: 'Muted headless native Web Audio; not listening, device, Edge, screen-reader, sample accuracy or release acceptance. Windows only if platform is win32.',
    distManifest, outcomes, artifacts, pageErrors, blockedRequests, failure,
  }, null, 2) + '\n')
}
if (failure) { console.error(failure); process.exitCode = 1 }
else console.log('Built-dist Chromium smoke passed (2 viewports, 6 PNGs).')
