// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { MeJApp, type Instrument } from './main'
import { defaultSession, SESSION_KEY, type Session } from './session'

function setup() {
  vi.useFakeTimers()
  localStorage.clear()
  const root = document.createElement('div')
  document.body.replaceChildren(root)
  const audio: Instrument = { resume: vi.fn(() => Promise.resolve()), stop: vi.fn(), setVolume: vi.fn(), drum: vi.fn(), note: vi.fn() }
  const pending: { resolve: (bytes: ArrayBuffer) => void, reject: (error: Error) => void }[] = []
  const snapshots: Session[] = []
  const render = vi.fn((session: Session) => {
    snapshots.push(session)
    return new Promise<ArrayBuffer>((resolve, reject) => pending.push({ resolve, reject }))
  })
  const urls = vi.fn(() => 'blob:export')
  vi.stubGlobal('URL', { createObjectURL: urls, revokeObjectURL: vi.fn() })
  const downloads = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  new MeJApp(root, audio, render)
  const click = (selector: string) => { root.querySelector<HTMLElement>(selector)!.click(); vi.advanceTimersByTime(0) }
  return { root, audio, pending, snapshots, render, urls, downloads, click }
}
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.replaceChildren() })
it('snapshots independent values without unlocking, saving or disturbing live phase', async () => {
  const { root, audio, click, snapshots, pending, downloads } = setup()
  click('input[value="demon"]'); click('input[value="slow"]'); click('[data-step="0"]')
  const input = root.querySelector<HTMLInputElement>('#volume')!
  input.value = '37'; input.dispatchEvent(new Event('input'))
  click('#mute')
  const saved = localStorage.getItem(SESSION_KEY)
  click('#download-wav')
  expect(audio.resume).not.toHaveBeenCalled()
  expect(snapshots).toEqual([{ ...defaultSession(), preset: 'demon', speed: 'slow', steps: [false, ...Array(15).fill(true)], volume: 37, muted: true }])
  expect(localStorage.getItem(SESSION_KEY)).toBe(saved)
  click('#play'); await Promise.resolve()
  vi.advanceTimersByTime(300)
  const stops = vi.mocked(audio.stop).mock.calls.length
  pending[0].resolve(new ArrayBuffer(44)); await Promise.resolve()
  expect(downloads).toHaveBeenCalledTimes(1)
  expect(root.querySelector('#status')!.textContent).toBe('Playing')
  expect(audio.stop).toHaveBeenCalledTimes(stops)
  expect(vi.getTimerCount()).toBeGreaterThan(0)
  expect(localStorage.getItem(SESSION_KEY)).toBe(saved)
})
it.each(['[data-step="0"]', '#reset-pattern', 'input[value="fast"]', 'input[value="starry"]', '#mute', '#reset-session', '#volume', '#import-project'])('fences stale success and error after %s, keeps one pending and permits recovery', async selector => {
  const { root, click, pending, render, snapshots, downloads } = setup()
  click('#download-wav')
  if (selector === '#volume') {
    const input = root.querySelector<HTMLInputElement>(selector)!
    input.value = '0'; input.dispatchEvent(new Event('input'))
  } else if (selector === '#import-project') {
    const input = root.querySelector<HTMLInputElement>(selector)!
    Object.defineProperty(input, 'files', { value: [{ size: 1, text: () => Promise.resolve('bad') }] })
    input.dispatchEvent(new Event('change'))
    await Promise.resolve()
  } else click(selector)
  // A snapshot's array must not track subsequent groove edits.
  expect(snapshots[0].steps).toEqual(Array(16).fill(true))
  click('#download-wav')
  expect(render).toHaveBeenCalledTimes(1)
  pending[0].resolve(new ArrayBuffer(44)); await Promise.resolve()
  expect(downloads).not.toHaveBeenCalled()
  expect(root.querySelector('#wav-status')!.textContent).toContain('canceled')
  click('#download-wav'); click('#mute')
  pending[1].reject(new Error('stale')); await Promise.resolve()
  expect(root.querySelector('#wav-error')!.textContent).toBe('')
  click('#download-wav'); pending[2].resolve(new ArrayBuffer(44)); await Promise.resolve()
  expect(downloads).toHaveBeenCalledTimes(1)
})
it('recovers from render and download/encoding errors without altering playback or storage', async () => {
  const { root, audio, click, pending, urls, downloads } = setup()
  click('#play'); await Promise.resolve(); vi.advanceTimersByTime(200)
  const stops = vi.mocked(audio.stop).mock.calls.length
  const saved = localStorage.getItem(SESSION_KEY)
  click('#download-wav'); pending[0].reject(new Error('render failed')); await Promise.resolve()
  expect(root.querySelector('#wav-error')!.textContent).toContain('WAV export failed')
  urls.mockImplementationOnce(() => { throw Error('download failed') })
  click('#download-wav'); pending[1].resolve(new ArrayBuffer(44)); await Promise.resolve()
  expect(downloads).not.toHaveBeenCalled()
  expect(root.querySelector('#wav-error')!.textContent).toContain('WAV export failed')
  click('#download-wav'); pending[2].resolve(new ArrayBuffer(44)); await Promise.resolve()
  expect(downloads).toHaveBeenCalledTimes(1)
  expect(root.querySelector('#wav-error')!.textContent).toBe('')
  expect(root.querySelector('#status')!.textContent).toBe('Playing')
  expect(audio.stop).toHaveBeenCalledTimes(stops)
  expect(localStorage.getItem(SESSION_KEY)).toBe(saved)
})
