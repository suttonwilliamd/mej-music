// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MeJApp, type Instrument } from './main'
import { defaultSession, encodeSession, SESSION_KEY } from './session'

function setup(resume = () => Promise.resolve()) {
  const root = document.createElement('div')
  document.body.replaceChildren(root)
  const audio: Instrument = { resume: vi.fn(resume), setVolume: vi.fn(), stop: vi.fn(), drum: vi.fn(), note: vi.fn() }
  new MeJApp(root, audio)
  vi.advanceTimersByTime(0) // Deliver jsdom storage events separately from audio scheduling.
  const click = (selector: string) => {
    root.querySelector<HTMLElement>(selector)!.click()
    vi.advanceTimersByTime(0)
  }
  return { root, audio, click }
}
const mask = (root: HTMLElement) => Array.from(root.querySelectorAll('.step-toggle'), button => button.getAttribute('aria-pressed') === 'true')
beforeEach(() => { localStorage.clear(); vi.useFakeTimers() })
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); document.body.replaceChildren(); localStorage.clear() })

it('restores the exact edited preset, tempo and mask on reload, always paused', () => {
  const first = setup()
  first.click('input[value="demon"]'); first.click('input[value="slow"]')
  first.click('[data-step="0"]'); first.click('[data-step="15"]')
  const reloaded = setup()
  expect(reloaded.root.querySelector('#preset-name')!.textContent).toBe('Demon')
  expect(reloaded.root.querySelector('#bpm')!.textContent).toBe('105')
  expect(reloaded.root.querySelector<HTMLInputElement>('input[value="slow"]')!.checked).toBe(true)
  expect(mask(reloaded.root)).toEqual([false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,false])
  expect(reloaded.root.querySelector('#status')!.textContent).toBe('Paused')
  expect(reloaded.audio.resume).not.toHaveBeenCalled()
  expect(vi.getTimerCount()).toBe(0)
})

async function importFile(root: HTMLElement, text: string, options: { size?: number; read?: () => Promise<string> } = {}) {
  const input = root.querySelector<HTMLInputElement>('#import-project')!
  Object.defineProperty(input, 'files', { configurable: true, value: [{ size: options.size ?? text.length, text: options.read ?? (() => Promise.resolve(text)) }] })
  input.dispatchEvent(new Event('change'))
  await Promise.resolve()
  vi.advanceTimersByTime(0)
}

it('rejects malformed and unsupported files without touching active playback, selection or stored state', async () => {
  const { root, audio, click } = setup()
  click('input[value="starry"]'); click('input[value="fast"]'); click('[data-step="3"]')
  click('#play'); await Promise.resolve()
  const saved = localStorage.getItem(SESSION_KEY)
  const stops = vi.mocked(audio.stop).mock.calls.length
  for (const text of ['{', JSON.stringify({ ...defaultSession(), version: 9 }), JSON.stringify({ ...defaultSession(), steps: [true] })]) {
    await importFile(root, text)
    expect(root.querySelector('#project-error[role="alert"]')!.textContent).toContain('Import failed')
    expect(root.querySelector('#status')!.textContent).toBe('Playing')
    expect(root.querySelector('#bpm')!.textContent).toBe('100')
    expect(mask(root)[3]).toBe(false)
    expect(localStorage.getItem(SESSION_KEY)).toBe(saved)
    expect(vi.mocked(audio.stop).mock.calls.length).toBe(stops)
    expect(vi.getTimerCount()).toBe(1)
  }
  vi.advanceTimersByTime(150)
  expect(audio.drum).toHaveBeenCalledWith('bd')
})

it('preserves pending audio startup on rejected import, but fences it on successful import', async () => {
  const resumes: Array<() => void> = []
  const { root, audio, click } = setup(() => new Promise<void>(resolve => resumes.push(resolve)))
  click('#play')
  await importFile(root, 'not JSON')
  expect(root.querySelector('#status')!.textContent).toBe('Starting…')
  const imported = { ...defaultSession(), preset: 'starry' as const, speed: 'fast' as const, steps: Array(16).fill(false) }
  await importFile(root, encodeSession(imported))
  expect(root.querySelector('#status')!.textContent).toBe('Paused')
  expect(root.querySelector('#project-error')!.textContent).toBe('')
  click('#play') // A second resume races the old one.
  resumes[0](); await Promise.resolve()
  expect(vi.getTimerCount()).toBe(0)
  resumes[1](); await Promise.resolve()
  vi.advanceTimersByTime(450)
  expect(root.querySelector('#status')!.textContent).toBe('Playing')
  expect(root.querySelector('#bpm')!.textContent).toBe('100')
  expect(mask(root)).toEqual(Array(16).fill(false))
  expect(audio.drum).not.toHaveBeenCalled()
  expect(audio.note).not.toHaveBeenCalled()
  expect(localStorage.getItem(SESSION_KEY)).toBe(encodeSession(imported))
})

it('cancels repetitions and tails on import and restarts with the imported literal timing and notes', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.99)
  const { root, audio, click } = setup()
  click('input[value="glitch"]'); click('#play'); await Promise.resolve()
  vi.advanceTimersByTime(116) // Glitch step one has a deferred second kick.
  expect(vi.getTimerCount()).toBeGreaterThan(1)
  const imported = { ...defaultSession(), preset: 'starry' as const, speed: 'fast' as const }
  await importFile(root, encodeSession(imported))
  expect(audio.stop).toHaveBeenCalled()
  expect(vi.getTimerCount()).toBe(0)
  expect(root.querySelectorAll('.current')).toHaveLength(0)
  vi.mocked(audio.drum).mockClear(); vi.mocked(audio.note).mockClear()
  vi.advanceTimersByTime(1000)
  expect(audio.drum).not.toHaveBeenCalled()
  click('#play'); await Promise.resolve()
  vi.advanceTimersByTime(149)
  expect(audio.drum).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  expect(audio.drum).toHaveBeenCalledExactlyOnceWith('bd')
  expect(audio.note).toHaveBeenCalledExactlyOnceWith('a1', 0.5, 0.4)
  click('#play')
  expect(vi.getTimerCount()).toBe(0)
  click('#play'); await Promise.resolve(); vi.advanceTimersByTime(150)
  expect(vi.mocked(audio.drum).mock.calls).toEqual([['bd'], ['bd']])
})

it('ignores unreadable/oversized files without changing playback', async () => {
  const { root, click } = setup()
  click('#play'); await Promise.resolve()
  const read = vi.fn(() => Promise.resolve(encodeSession(defaultSession())))
  await importFile(root, '', { size: 4097, read })
  expect(read).not.toHaveBeenCalled()
  expect(root.querySelector('#project-error')!.textContent).toContain('4 KiB')
  await importFile(root, '', { read: () => Promise.reject(new Error('Could not read file.')) })
  expect(root.querySelector('#project-error')!.textContent).toContain('Could not read file')
  expect(root.querySelector('#status')!.textContent).toBe('Playing')
})

it('keeps the newest selected import and lets explicit session reset cancel an in-flight read', async () => {
  const { root, click } = setup()
  let resolve!: (text: string) => void
  await importFile(root, '', { read: () => new Promise<string>(done => { resolve = done }) })
  await importFile(root, encodeSession({ ...defaultSession(), preset: 'demon' }))
  resolve(encodeSession({ ...defaultSession(), preset: 'starry' })); await Promise.resolve()
  expect(root.querySelector('#preset-name')!.textContent).toBe('Demon')
  await importFile(root, '', { read: () => new Promise<string>(done => { resolve = done }) })
  click('#reset-session')
  resolve(encodeSession({ ...defaultSession(), preset: 'starry' })); await Promise.resolve()
  expect(root.querySelector('#preset-name')!.textContent).toBe('Flow')
})

it('reports invalid saved data without replacing it until an explicit edit', () => {
  localStorage.setItem(SESSION_KEY, '{"version":99}')
  const { root, click } = setup()
  expect(root.querySelector('#storage-status')!.textContent).toContain('invalid or unsupported')
  expect(root.querySelector('#status')!.textContent).toBe('Paused')
  expect(localStorage.getItem(SESSION_KEY)).toBe('{"version":99}')
  click('[data-step="15"]')
  expect(JSON.parse(localStorage.getItem(SESSION_KEY)!).steps[15]).toBe(false)
})

it('remains playable and importable when localStorage access is denied', async () => {
  vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError') })
  const { root, audio, click } = setup()
  expect(root.querySelector('#storage-status')!.textContent).toContain('unavailable')
  await importFile(root, encodeSession({ ...defaultSession(), preset: 'demon', speed: 'slow' }))
  expect(root.querySelector('#project-status')!.textContent).toContain('Project imported')
  expect(root.querySelector('#storage-status')!.textContent).toContain('not saved')
  click('#play'); await Promise.resolve(); vi.advanceTimersByTime(143)
  expect(audio.drum).toHaveBeenCalledWith('bd')
})

it('retains current edits when quota is exhausted and retries a later save', () => {
  const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError') })
  const { root, click } = setup()
  click('input[value="demon"]'); click('[data-step="0"]')
  expect(root.querySelector('#storage-status')!.textContent).toContain('not saved')
  expect(root.querySelector('#preset-name')!.textContent).toBe('Demon')
  expect(mask(root)[0]).toBe(false)
  set.mockRestore()
  click('input[value="fast"]')
  expect(JSON.parse(localStorage.getItem(SESSION_KEY)!)).toEqual({ ...defaultSession(), preset: 'demon', speed: 'fast', steps: [false,...Array(15).fill(true)] })
  expect(root.querySelector('#storage-status')!.textContent).toContain('Session saved')
})

it('distinguishes live pattern restore from full paused session reset and persists defaults', async () => {
  const { root, click } = setup()
  click('input[value="demon"]'); click('input[value="slow"]'); click('[data-step="0"]')
  click('#play'); await Promise.resolve()
  click('#reset-pattern')
  expect(root.querySelector('#status')!.textContent).toBe('Playing')
  expect(root.querySelector('#bpm')!.textContent).toBe('105')
  click('#reset-session')
  expect(root.querySelector('#status')!.textContent).toBe('Paused')
  expect(root.querySelector('#preset-name')!.textContent).toBe('Flow')
  expect(root.querySelector('#bpm')!.textContent).toBe('90')
  expect(mask(root)).toEqual(Array(16).fill(true))
  expect(localStorage.getItem(SESSION_KEY)).toBe(encodeSession(defaultSession()))
  expect(vi.getTimerCount()).toBe(0)
})

function volume(root: HTMLElement, value: number) {
  const input = root.querySelector<HTMLInputElement>('#volume')!
  input.value = String(value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
  vi.advanceTimersByTime(0)
}

it('migrates v1 local progress and files to paused v2 without starting audio', async () => {
  const old = { version: 1, preset: 'demon', speed: 'slow', steps: [false, ...Array(15).fill(true)] }
  localStorage.setItem(SESSION_KEY, JSON.stringify(old))
  const { root, audio, click } = setup()
  expect(root.querySelector('#preset-name')!.textContent).toBe('Demon')
  expect(root.querySelector('#bpm')!.textContent).toBe('105')
  expect(mask(root)).toEqual(old.steps)
  expect(audio.setVolume).toHaveBeenLastCalledWith(100, false)
  expect(audio.resume).not.toHaveBeenCalled()
  volume(root, 37); click('#mute')
  const expected = { ...old, version: 2, volume: 37, muted: true }
  expect(JSON.parse(localStorage.getItem(SESSION_KEY)!)).toEqual(expected)
  const reloaded = setup()
  expect(reloaded.root.querySelector('#volume-state')!.textContent).toBe('Muted · selected 37%')
  expect(reloaded.audio.setVolume).toHaveBeenLastCalledWith(37, true)
  expect(reloaded.audio.resume).not.toHaveBeenCalled()
  await importFile(reloaded.root, JSON.stringify(old))
  expect(reloaded.root.querySelector('#status')!.textContent).toBe('Paused')
  expect(reloaded.audio.setVolume).toHaveBeenLastCalledWith(100, false)
  expect(JSON.parse(localStorage.getItem(SESSION_KEY)!)).toEqual({ ...old, version: 2, volume: 100, muted: false })
})

it('keeps live volume and mute phase, notes, preset, speed and edits while continuing muted dispatch', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.99)
  const { root, audio, click } = setup()
  click('[data-step="15"]')
  click('#play'); await Promise.resolve()
  vi.advanceTimersByTime(167)
  const stops = vi.mocked(audio.stop).mock.calls.length
  const noteCount = vi.mocked(audio.note).mock.calls.length
  volume(root, 37); click('#mute')
  expect(audio.setVolume).toHaveBeenLastCalledWith(37, true)
  expect(audio.stop).toHaveBeenCalledTimes(stops)
  expect(audio.note).toHaveBeenCalledTimes(noteCount)
  expect(root.querySelector('[data-step="0"]')!.classList.contains('current')).toBe(true)
  vi.advanceTimersByTime(167)
  expect(root.querySelector('[data-step="1"]')!.classList.contains('current')).toBe(true)
  expect(audio.drum).toHaveBeenLastCalledWith('sn')
  volume(root, 42)
  expect(root.querySelector('#volume-state')!.textContent).toBe('Muted · selected 42%')
  click('#mute')
  expect(audio.setVolume).toHaveBeenLastCalledWith(42, false)
  vi.advanceTimersByTime(167)
  expect(root.querySelector('[data-step="2"]')!.classList.contains('current')).toBe(true)
  expect(root.querySelector('#status')!.textContent).toBe('Playing')
  expect(root.querySelector('#bpm')!.textContent).toBe('90')
  expect(mask(root)[15]).toBe(false)
  expect(audio.stop).toHaveBeenCalledTimes(stops)
  volume(root, 0)
  expect(root.querySelector('#volume-state')!.textContent).toBe('Silent · volume 0%')
})

it('uses latest output across pending resume, invalid import, successful import and reset cancellation', async () => {
  const resumes: Array<() => void> = []
  const { root, audio, click } = setup(() => new Promise<void>(resolve => resumes.push(resolve)))
  volume(root, 23); click('#mute')
  expect(audio.resume).not.toHaveBeenCalled()
  click('#play'); volume(root, 41); click('#mute')
  expect(audio.setVolume).toHaveBeenLastCalledWith(41, false)
  await importFile(root, JSON.stringify({ ...defaultSession(), volume: 101 }))
  expect(root.querySelector('#status')!.textContent).toBe('Starting…')
  expect(audio.setVolume).toHaveBeenLastCalledWith(41, false)
  resumes[0](); await Promise.resolve(); vi.advanceTimersByTime(167)
  expect(audio.drum).toHaveBeenCalled()
  click('#play'); click('#play')
  const imported = { ...defaultSession(), volume: 18, muted: true }
  await importFile(root, encodeSession(imported))
  expect(audio.setVolume).toHaveBeenLastCalledWith(18, true)
  resumes[1](); await Promise.resolve()
  expect(root.querySelector('#status')!.textContent).toBe('Paused')
  expect(vi.getTimerCount()).toBe(0)
  click('#play'); volume(root, 62)
  click('#reset-session')
  expect(audio.setVolume).toHaveBeenLastCalledWith(100, false)
  resumes[2](); await Promise.resolve()
  expect(root.querySelector('#status')!.textContent).toBe('Paused')
  expect(vi.getTimerCount()).toBe(0)
  expect(localStorage.getItem(SESSION_KEY)).toBe(encodeSession(defaultSession()))
})

it('never creates an AudioContext for initial settings, edits, imports, reset or reload before Play', async () => {
  const create = vi.fn(() => { throw Error('AudioContext must stay lazy') })
  vi.stubGlobal('AudioContext', create)
  try {
    localStorage.setItem(SESSION_KEY, encodeSession({ ...defaultSession(), volume: 17, muted: true }))
    const root = document.createElement('div')
    document.body.replaceChildren(root)
    new MeJApp(root)
    volume(root, 62)
    root.querySelector<HTMLButtonElement>('#mute')!.click()
    await importFile(root, encodeSession({ ...defaultSession(), volume: 0 }))
    root.querySelector<HTMLButtonElement>('#reset-session')!.click()
    new MeJApp(root)
    expect(create).not.toHaveBeenCalled()
    expect(root.querySelector('#status')!.textContent).toBe('Paused')
  } finally { vi.unstubAllGlobals() }
})
