// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { MeJApp, type Instrument } from './main'

function setup(resume = () => Promise.resolve()) {
  vi.useFakeTimers()
  const root = document.createElement('div')
  document.body.replaceChildren(root)
  const audio: Instrument = { resume, stop: vi.fn(), drum: vi.fn(), note: vi.fn() }
  new MeJApp(root, audio)
  const click = (selector: string) => root.querySelector<HTMLButtonElement>(selector)!.click()
  return { root, audio, click }
}
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); document.body.replaceChildren() })
it('exposes labeled semantic controls, four presets and truthful paused state', () => {
  const { root } = setup()
  expect(root.querySelector('#play')!.getAttribute('aria-label')).toBe('Play music')
  expect(root.querySelector('#play')!.getAttribute('aria-pressed')).toBe('false')
  expect(root.querySelectorAll('input[name="preset"]')).toHaveLength(4)
  expect(root.querySelector<HTMLInputElement>('input[value="flow"]')!.checked).toBe(true)
  expect(root.querySelector('#status')!.textContent).toBe('Paused')
  expect(root.querySelector<HTMLButtonElement>('#restart')!.disabled).toBe(true)
})
it('updates actual timing and checked state, keeps Play focus target and cleans up pause', async () => {
  const { root, audio, click } = setup()
  click('input[value="starry"]')
  click('input[value="fast"]')
  expect(root.querySelector('#bpm')!.textContent).toBe('100')
  click('#play')
  await Promise.resolve()
  expect(root.querySelector('#play')!.getAttribute('aria-label')).toBe('Pause music')
  expect(root.querySelector('#play')!.getAttribute('aria-pressed')).toBe('true')
  expect(root.querySelector('#status')!.textContent).toBe('Playing')
  vi.advanceTimersByTime(149)
  expect(audio.drum).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  expect(audio.drum).toHaveBeenCalledWith('bd')
  click('#restart')
  expect(vi.getTimerCount()).toBe(1)
  click('#play')
  expect(vi.getTimerCount()).toBe(0)
  expect(audio.stop).toHaveBeenCalled()
  expect(root.querySelector('#status')!.textContent).toBe('Paused')
})
it('cannot resurrect playback after pause during asynchronous AudioContext resume', async () => {
  let resolve!: () => void
  const { root, click } = setup(() => new Promise<void>(done => { resolve = done }))
  click('#play')
  click('#play')
  resolve()
  await Promise.resolve()
  expect(vi.getTimerCount()).toBe(0)
  expect(root.querySelector('#status')!.textContent).toBe('Paused')
})
it('reports audio startup failure without claiming playback', async () => {
  const { root, click } = setup(() => Promise.reject(new Error('unavailable')))
  click('#play')
  await Promise.resolve()
  expect(root.querySelector('#status')!.textContent).toContain('Audio unavailable')
  expect(root.querySelector('#play')!.getAttribute('aria-pressed')).toBe('false')
})
