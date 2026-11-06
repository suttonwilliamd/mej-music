import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

// Run in a separate owned tab so the existing session/live-master qualification
// retains its original probes and assertions. Faults gate native render completion,
// never replace synthesis, contexts, scheduling or browser decoding.
export async function wavSmoke({ context, origin, width, output, artifacts }) {
  const page = await context.newPage()
  page.setDefaultTimeout(8000)
  const errors = []
  page.on('pageerror', () => errors.push('uncaught WAV page error'))
  await page.addInitScript(() => {
    const state = { count: 0, hold: false, mode: '', pending: [], cancellations: 0, seed: 1000, transitions: [] }
    window.__wav = state
    // Seeded fixture gives full-range noise and repeatable amplitude comparisons.
    // Its first draw omits optional melody in the isolated single-step cases.
    Math.random = () => {
      state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0
      return state.seed / 4294967296
    }
    const createConstant = AudioContext.prototype.createConstantSource
    AudioContext.prototype.createConstantSource = function (...args) {
      const source = Reflect.apply(createConstant, this, args)
      const record = { offset: null, start: null, stop: null, ahead: null }
      state.transitions.push(record)
      const start = source.start, stop = source.stop
      source.start = function (...args) {
        record.offset = source.offset.value; record.start = source.context.currentTime
        return Reflect.apply(start, this, args)
      }
      source.stop = function (...args) {
        record.stop = args[0]; record.ahead = args[0] - source.context.currentTime
        return Reflect.apply(stop, this, args)
      }
      return source
    }
    const nativeRender = OfflineAudioContext.prototype.startRendering
    OfflineAudioContext.prototype.startRendering = function (...args) {
      state.count++
      const result = Reflect.apply(nativeRender, this, args)
      const mode = state.mode
      let gate = Promise.resolve()
      if (state.hold) {
        const pending = Promise.withResolvers()
        state.pending.push(pending)
        gate = pending.promise
      }
      return result.then(async buffer => {
        await gate
        if (mode === 'render') throw Error('controlled native completion failure')
        if (mode === 'encode') buffer.getChannelData(0)[0] = NaN
        return buffer
      })
    }
    for (const prototype of [OscillatorNode.prototype, AudioBufferSourceNode.prototype]) {
      const stop = prototype.stop
      prototype.stop = function (...args) {
        if (this.context instanceof AudioContext && !args.length) state.cancellations++
        return Reflect.apply(stop, this, args)
      }
    }
  })
  const wavs = []
  let downloads = 0
  page.on('download', () => downloads++)
  try {
    await page.goto(origin, { waitUntil: 'networkidle' })
    const button = page.getByRole('button', { name: 'Download WAV', exact: true })
    await page.evaluate(() => {
      window.__wav.imports = 0
      new MutationObserver(() => { window.__wav.imports++ }).observe(document.querySelector('#project-status'), { childList: true })
    })
    const feedbackExposed = async (selector, role) => {
      const cdp = await context.newCDPSession(page)
      try {
        const { root } = await cdp.send('DOM.getDocument')
        const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector })
        const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false })
        assert.equal(nodes[0]?.ignored, false)
        if (role) assert.equal(nodes[0].role.value, role)
        else assert.ok(nodes[0].properties.some(property => property.name === 'live' && property.value.value === 'polite'))
      } finally { await cdp.detach() }
    }
    await feedbackExposed('#wav-status')
    const setSession = async (settings = {}) => {
      const session = { version: 2, preset: 'flow', speed: 'mid', steps: Array.from({ length: 16 }, (_, i) => i === 0), volume: 100, muted: false, ...settings }
      const imports = await page.evaluate(() => window.__wav.imports)
      await page.locator('#import-project').setInputFiles({ name: 'wav-fixture.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(session)) })
      await page.waitForFunction(before => window.__wav.imports > before && document.querySelector('#project-status').textContent.includes('Project imported'), imports)
      return session
    }
    const capture = async state => {
      const name = `${width}-${state}.png`
      await page.screenshot({ path: path.join(output, name), fullPage: true })
      const bytes = await readFile(path.join(output, name))
      artifacts.push({ name, state, viewport: { width, height: 900 }, bytes: bytes.length, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), sha256: createHash('sha256').update(bytes).digest('hex') })
    }
    const saveWav = async (name, expectedFrames) => {
      await page.evaluate(() => { window.__wav.seed = 1000 })
      const saved = await page.evaluate(() => localStorage.getItem('mej.session'))
      const event = page.waitForEvent('download')
      await button.press('Enter')
      const download = await event
      assert.match(download.suggestedFilename(), /^mej-(flow|starry|glitch|demon)-(slow|mid|fast)\.wav$/)
      const filename = `${width}-${name}.wav`
      await download.saveAs(path.join(output, filename))
      const bytes = await readFile(path.join(output, filename))
      assert.equal(bytes.toString('ascii', 0, 4), 'RIFF')
      assert.equal(bytes.readUInt32LE(4), bytes.length - 8)
      assert.equal(bytes.toString('ascii', 8, 16), 'WAVEfmt ')
      assert.equal(bytes.readUInt32LE(16), 16)
      assert.equal(bytes.readUInt16LE(20), 1)
      assert.equal(bytes.readUInt16LE(22), 2)
      assert.equal(bytes.readUInt32LE(24), 44100)
      assert.equal(bytes.readUInt32LE(28), 176400)
      assert.equal(bytes.readUInt16LE(32), 4)
      assert.equal(bytes.readUInt16LE(34), 16)
      assert.equal(bytes.toString('ascii', 36, 40), 'data')
      assert.equal(bytes.readUInt32LE(40), bytes.length - 44)
      const frames = (bytes.length - 44) / 4
      assert.equal(frames, expectedFrames)
      const left = new Int16Array(frames)
      let peak = 0, nonzero = 0
      for (let i = 0; i < frames; i++) {
        left[i] = bytes.readInt16LE(44 + i * 4)
        assert.equal(left[i], bytes.readInt16LE(46 + i * 4), 'Current mono voices fill both stereo channels equally')
        peak = Math.max(peak, Math.abs(left[i]))
        if (left[i]) nonzero++
      }
      const decoded = await page.evaluate(async base64 => {
        const data = Uint8Array.from(atob(base64), char => char.charCodeAt(0))
        const decoder = new OfflineAudioContext(2, 1, 44100)
        const buffer = await decoder.decodeAudioData(data.buffer)
        return { frames: buffer.length, channels: buffer.numberOfChannels, rate: buffer.sampleRate, duration: buffer.duration }
      }, bytes.toString('base64'))
      assert.deepEqual(decoded, { frames, channels: 2, rate: 44100, duration: frames / 44100 })
      assert.equal(await page.evaluate(() => localStorage.getItem('mej.session')), saved)
      const result = { name: filename, frames, duration: frames / 44100, channels: 2, rate: 44100, bits: 16, peak, nonzero, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }
      wavs.push(result)
      return { ...result, left, energy: (from, to) => {
        let sum = 0
        for (let i = Math.ceil(from * 44100); i < Math.min(frames, Math.floor(to * 44100)); i++) sum += Math.abs(left[i])
        return sum
      } }
    }
    await setSession()
    const full = await saveWav('bass-full', 117600)
    assert.ok(full.energy(0, 0.01) > 1000, 'First event begins at zero, not one live transport tick later')
    assert.equal(full.energy(0.501, full.duration), 0, 'Only one masked step, no repeated traversal')
    assert.ok(full.peak > 5000)
    assert.equal(await page.evaluate(() => window.__mejProbe.contexts.length), 0, 'Export must not construct/resume live audio')
    await setSession({ volume: 37 })
    const quiet = await saveWav('bass-37', 117600)
    assert.ok(Math.abs(quiet.peak / full.peak - 0.37) < 0.001, 'Output percentage scales real PCM')
    await setSession({ volume: 0 })
    assert.equal((await saveWav('zero', 117600)).nonzero, 0)
    await setSession({ volume: 37, muted: true })
    assert.equal((await saveWav('muted', 117600)).nonzero, 0)
    await setSession({ preset: 'starry', speed: 'slow', steps: Array(16).fill(false) })
    assert.equal((await saveWav('all-off', 176400)).nonzero, 0)
    // Glitch Fast: only step 4's four clap repetitions, no tonal voices/melody.
    await setSession({ preset: 'glitch', speed: 'fast', volume: 62, steps: Array.from({ length: 16 }, (_, i) => i === 3) })
    const repeated = await saveWav('glitch-repeats', Math.ceil(16 * 60 / 163 / 4 * 44100))
    const step = 60 / 163 / 4
    assert.equal(repeated.energy(0, 3 * step), 0)
    for (let i = 0; i < 4; i++) assert.ok(repeated.energy((3 + i / 4) * step + 0.001, (3 + i / 4) * step + 0.015) > 100, 'Each subdivision has actual PCM content')
    assert.equal(repeated.energy(3.75 * step + 0.101, repeated.duration), 0)
    // Demon Fast: last chord's full 1s decay extends past the 16-step span.
    const tailSession = await setSession({ preset: 'demon', speed: 'fast', volume: 37, steps: Array.from({ length: 16 }, (_, i) => i === 12) })
    const tail = await saveWav('demon-tail', Math.ceil((12 * 60 / 175 / 4 + 1) * 44100))
    assert.equal(tail.energy(0, 12 * 60 / 175 / 4), 0)
    assert.ok(tail.energy(1.5, 1.9) > 1000, 'Full chord envelope survives after the step span')
    await button.focus()
    const geometry = await button.boundingBox()
    assert.ok(geometry.width >= 44 && geometry.height >= 44)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width)
    await capture('wav-ready')
    // Hold a real native render while ordinary playback/edits continue.
    await page.getByRole('button', { name: 'Play music', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('#status').textContent === 'Playing')
    await page.waitForFunction(() => document.querySelector('.step-toggle.current'))
    const live = () => page.evaluate(() => ({ intervals: window.__mejProbe.intervals, clears: window.__mejProbe.clears, cancellations: window.__wav.cancellations, contexts: window.__mejProbe.contexts.length, saved: localStorage.getItem('mej.session') }))
    const before = await live()
    const downloadCount = downloads
    await page.evaluate(() => { window.__wav.hold = true })
    await button.click()
    await page.waitForFunction(() => window.__wav.pending.length === 1)
    assert.equal(await button.isDisabled(), true)
    const marker = await page.locator('.current').getAttribute('data-step')
    await page.waitForFunction(previous => document.querySelector('.current')?.getAttribute('data-step') !== previous, marker)
    assert.deepEqual(await live(), before, 'Export does not restart, stop, unlock or save live playback')
    await page.evaluate(() => window.__wav.pending.shift().resolve())
    await page.waitForFunction(() => !document.querySelector('#download-wav').disabled)
    assert.equal(downloads, downloadCount + 1)
    assert.deepEqual(await live(), before)
    await page.evaluate(() => { window.__wav.hold = false; window.__wav.mode = 'render' })
    const beforeFailure = downloads
    await button.click()
    await page.waitForFunction(() => document.querySelector('#wav-error').textContent.includes('WAV export failed'))
    assert.equal(downloads, beforeFailure)
    assert.deepEqual(await live(), before)
    assert.equal(await page.locator('#status').innerText(), 'Playing')
    // Every settings transition cancels stale success; stale failure is fenced too.
    for (const action of ['step', 'speed', 'preset', 'volume', 'mute', 'restore', 'import', 'reset']) {
      await page.evaluate(() => { window.__wav.hold = true; window.__wav.mode = '' })
      await button.click()
      await page.waitForFunction(() => window.__wav.pending.length === 1)
      const count = downloads
      const renders = await page.evaluate(() => window.__wav.count)
      await button.evaluate(element => element.click())
      assert.equal(await page.evaluate(() => window.__wav.count), renders)
      if (action === 'step') await page.locator('[data-step="0"]').click()
      if (action === 'speed') await page.locator('input[name="speed"][value="slow"]').check()
      if (action === 'preset') await page.locator('input[name="preset"][value="starry"]').check()
      if (action === 'volume') await page.locator('#volume').fill('19')
      if (action === 'mute') await page.locator('#mute').click()
      if (action === 'restore') await page.locator('#reset-pattern').click()
      if (action === 'import') await setSession(tailSession)
      if (action === 'reset') await page.locator('#reset-session').click()
      assert.equal(await button.isDisabled(), true)
      await page.evaluate(() => window.__wav.pending.shift().resolve())
      await page.waitForFunction(() => !document.querySelector('#download-wav').disabled)
      assert.equal(downloads, count)
      assert.match(await page.locator('#wav-status').innerText(), /canceled/)
      assert.equal(await page.locator('#wav-error').innerText(), '')
    }
    await setSession()
    for (const mode of ['render', 'encode', 'unavailable']) {
      await page.evaluate(mode => {
        window.__wav.hold = false; window.__wav.mode = mode
        if (mode === 'unavailable') { window.__savedOffline = window.OfflineAudioContext; window.OfflineAudioContext = undefined }
      }, mode)
      const count = downloads
      const saved = await page.evaluate(() => localStorage.getItem('mej.session'))
      await button.click()
      await page.waitForFunction(() => document.querySelector('#wav-error').textContent.includes('WAV export failed'))
      assert.equal(downloads, count)
      assert.equal(await page.evaluate(() => localStorage.getItem('mej.session')), saved)
      assert.equal(await page.locator('#status').innerText(), 'Paused')
      await capture(`wav-${mode}-error`)
      await feedbackExposed('#wav-status')
      await feedbackExposed('#wav-error', 'alert')
      await page.evaluate(() => {
        window.__wav.mode = ''
        if (window.__savedOffline) { window.OfflineAudioContext = window.__savedOffline; delete window.__savedOffline }
      })
      assert.ok((await saveWav(`${mode}-recovery`, 117600)).nonzero > 0)
      assert.equal(await page.locator('#wav-error').innerText(), '')
    }
    // Native rejected completion after a canceled snapshot must not announce error.
    await page.evaluate(() => { window.__wav.hold = true; window.__wav.mode = 'render' })
    await button.click()
    await page.waitForFunction(() => window.__wav.pending.length === 1)
    await page.locator('#mute').click()
    await page.evaluate(() => window.__wav.pending.shift().resolve())
    await page.waitForFunction(() => !document.querySelector('#download-wav').disabled)
    assert.equal(await page.locator('#wav-error').innerText(), '')
    await page.evaluate(() => { window.__wav.hold = false; window.__wav.mode = '' })
    await setSession({ preset: 'starry', speed: 'slow' })
    assert.ok((await saveWav('recovered', 176400)).nonzero > 0)
    // Consumer PCM regression for the baseline idle-graph ramp defect. The probe
    // tone and analyser are native, owned and disposed; no capture/recording API.
    await setSession({ steps: Array(16).fill(false), volume: 0 })
    const masterPcm = await page.evaluate(async () => {
      const probe = window.__mejProbe
      const context = probe.contexts[0]
      const master = probe.edges.find(([, to]) => to === context.destination)[0]
      const analyser = context.createAnalyser()
      analyser.fftSize = 256
      master.connect(analyser)
      const waitUntil = async time => {
        const deadline = performance.now() + 2000
        while (context.currentTime < time) {
          if (performance.now() > deadline) throw Error('Native context deadline')
          await new Promise(resolve => setTimeout(resolve, 1))
        }
      }
      const peak = () => {
        const samples = new Float32Array(analyser.fftSize)
        analyser.getFloatTimeDomainData(samples)
        return Math.max(...samples.map(Math.abs))
      }
      const setLevel = value => {
        const input = document.querySelector('#volume')
        input.value = String(value); input.dispatchEvent(new Event('input', { bubbles: true }))
      }
      let tone
      try {
        await waitUntil(context.currentTime + 0.06)
        const idlePeak = peak()
        const first = context.createOscillator()
        first.connect(master); first.start(); first.stop(context.currentTime + 0.05)
        first.onended = () => first.disconnect()
        await waitUntil(context.currentTime + 0.04)
        setLevel(37)
        await waitUntil(context.currentTime + 0.06)
        const endpoint = master.gain.value
        const gapPeak = peak()
        tone = context.createOscillator()
        tone.connect(master); tone.start()
        await waitUntil(context.currentTime + 0.03)
        const subsequentPeak = peak()
        document.querySelector('#play').click()
        while (document.querySelector('#status').textContent !== 'Playing') await waitUntil(context.currentTime + 0.003)
        const before = window.__wav.transitions.length
        for (let i = 0; i < 20; i++) setLevel(i * 5)
        setLevel(37)
        document.querySelector('#mute').click()
        document.querySelector('#play').click() // Pause must not cut the zero-driver's ramp short.
        const rapidCreated = window.__wav.transitions.length - before
        await waitUntil(context.currentTime + 0.06)
        const mutedPeak = peak(), mutedEndpoint = master.gain.value
        document.querySelector('#mute').click()
        await waitUntil(context.currentTime + 0.06)
        const restoredPeak = peak()
        tone.stop(); tone.disconnect(); tone = null
        await waitUntil(context.currentTime + 0.06)
        return { idlePeak, endpoint, gapPeak, subsequentPeak, rapidCreated, mutedPeak, mutedEndpoint, restoredPeak, finalPeak: peak(),
          paused: document.querySelector('#status').textContent === 'Paused', offsetsZero: window.__wav.transitions.every(source => source.offset === 0),
          bounded: window.__wav.transitions.every(source => source.ahead <= 0.015 + 128 / context.sampleRate + 1e-8),
          noPending: window.__wav.transitions.every(source => source.stop <= context.currentTime) }
      } finally {
        if (tone) { tone.stop(); tone.disconnect() }
        master.disconnect(analyser); analyser.disconnect()
      }
    })
    assert.equal(masterPcm.idlePeak, 0)
    assert.equal(masterPcm.gapPeak, 0)
    assert.ok(Math.abs(masterPcm.endpoint - 0.222) < 1e-7)
    assert.ok(Math.abs(masterPcm.subsequentPeak - 0.222) < 0.0001)
    assert.equal(masterPcm.rapidCreated, 1)
    assert.equal(masterPcm.mutedPeak, 0)
    assert.equal(masterPcm.mutedEndpoint, 0)
    assert.ok(Math.abs(masterPcm.restoredPeak - 0.222) < 0.0001)
    assert.equal(masterPcm.finalPeak, 0)
    assert.equal(masterPcm.paused, true)
    assert.equal(masterPcm.offsetsZero, true)
    assert.equal(masterPcm.bounded, true)
    assert.equal(masterPcm.noPending, true)
    assert.deepEqual(errors, [])
    return { nativeDecode: true, feedbackLiveRegionExposed: true, pendingSingleFlight: true, staleSuccessErrorFenced: true, editingPlaybackPreserved: true, liveFailurePreserved: true, failuresRecovered: ['unavailable', 'render', 'encode'], seededRandomnessFixture: true, masterPcm, wavs }
  } finally {
    await page.close()
  }
}
