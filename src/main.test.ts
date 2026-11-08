/// <reference lib="es2024.promise" />
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
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); document.body.replaceChildren() })
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
const pressedMask = (root: HTMLElement) => Array.from(root.querySelectorAll('.step-toggle'), button => button.getAttribute('aria-pressed') === 'true')

it('starts with the literal default mask and toggles individual steps without replacing controls', () => {
  const { root, click } = setup()
  expect(pressedMask(root)).toEqual([true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true])
  const button = root.querySelector<HTMLButtonElement>('[data-step="0"]')!
  button.focus()
  click('[data-step="0"]')
  click('[data-step="15"]')
  expect(pressedMask(root)).toEqual([false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,false])
  expect(document.activeElement).toBe(button)
  expect(button.textContent).toContain('Off')
  expect(root.querySelector('#pattern-summary')!.textContent).toBe('14 of 16 steps on')
  click('#reset-pattern')
  expect(pressedMask(root)).toEqual([true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true])
  expect(root.querySelector('#status')!.textContent).toBe('Paused')
})

it('dispatches literal played/muted outcomes for drums AND tonal voices; live edits keep phase', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.99) // no random melody
  const { root, audio, click } = setup()
  click('[data-step="0"]')
  click('#play')
  await Promise.resolve()
  vi.advanceTimersByTime(167)
  expect(audio.drum).not.toHaveBeenCalled() // step 1: muted bd + bd
  expect(audio.note).not.toHaveBeenCalled() // muted c2 bass
  expect(root.querySelector('[data-step="0"]')!.classList.contains('current')).toBe(true)
  vi.advanceTimersByTime(167)
  expect(vi.mocked(audio.drum).mock.calls).toEqual([['sn']]) // step 2 still on
  click('[data-step="2"]') // mute future hats without restarting
  vi.advanceTimersByTime(167)
  expect(vi.mocked(audio.drum).mock.calls).toEqual([['sn']])
  expect(root.querySelector('[data-step="2"]')!.classList.contains('current')).toBe(true)
  click('#reset-pattern') // restore does not restart; next is step 4
  vi.advanceTimersByTime(167)
  expect(vi.mocked(audio.drum).mock.calls).toEqual([['sn'],['cp']])
  vi.advanceTimersByTime(167)
  expect(vi.mocked(audio.note).mock.calls).toEqual([['g1',0.5,0.4],['g3',1,0.15],['b3',1,0.15],['d4',1,0.15]])
})

it('all-off masks every voice including randomized melody', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0)
  const { root, audio, click } = setup()
  for (let i = 0; i < 16; i++) click(`[data-step="${i}"]`)
  click('#play'); await Promise.resolve()
  vi.advanceTimersByTime(2800)
  expect(audio.drum).not.toHaveBeenCalled()
  expect(audio.note).not.toHaveBeenCalled()
  expect(root.querySelector('#status')!.textContent).toBe('Playing')
})

it('preserves edits across pause, character, tempo and restart; reset changes only the mask', async () => {
  const { root, audio, click } = setup()
  click('[data-step="0"]')
  click('input[value="starry"]'); click('input[value="fast"]')
  click('#play'); await Promise.resolve()
  click('#restart'); vi.advanceTimersByTime(150)
  expect(audio.drum).not.toHaveBeenCalled()
  click('#play'); click('[data-step="1"]')
  click('#play'); await Promise.resolve(); vi.advanceTimersByTime(300)
  expect(audio.drum).not.toHaveBeenCalled()
  click('#reset-pattern')
  expect(root.querySelector('#bpm')!.textContent).toBe('100')
  expect(root.querySelector('#preset-name')!.textContent).toBe('Starry')
  expect(root.querySelector('#status')!.textContent).toBe('Playing')
  expect(pressedMask(root)).toEqual([true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true])
})

it('uses latest edits after canceled async start and ignores a stale completion', async () => {
  const resolves: Array<() => void> = []
  const { root, audio, click } = setup(() => new Promise<void>(resolve => resolves.push(resolve)))
  click('#play'); click('[data-step="0"]'); click('#play') // cancel pending start
  click('#play'); click('#reset-pattern'); click('[data-step="0"]')
  resolves[0](); await Promise.resolve()
  expect(vi.getTimerCount()).toBe(0)
  resolves[1](); await Promise.resolve()
  vi.advanceTimersByTime(167)
  expect(audio.drum).not.toHaveBeenCalled()
  expect(audio.note).not.toHaveBeenCalled()
  expect(root.querySelector('#status')!.textContent).toBe('Playing')
})

it('reports audio startup failure without claiming playback', async () => {
  const { root, click } = setup(() => Promise.reject(new Error('unavailable')))
  click('#play')
  await Promise.resolve()
  expect(root.querySelector('#status')!.textContent).toContain('Audio unavailable')
  expect(root.querySelector('#play')!.getAttribute('aria-pressed')).toBe('false')
})

const importedLoop = { format: 'mej-loop', version: 1, preset: 'starry', speed: 'fast', mask: [false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true] }
async function chooseLoop(root: HTMLElement, value: unknown, read?: () => Promise<string>) {
  const source = JSON.stringify(value)
  const file = new File([source], 'loop.json', { type: 'application/json' })
  // jsdom does not implement File.text; only the file-reader boundary is supplied.
  Object.defineProperty(file, 'text', { value: read ?? (() => Promise.resolve(source)) })
  const input = root.querySelector<HTMLInputElement>('#loop-file')!
  Object.defineProperty(input, 'files', { configurable: true, value: [file] })
  input.dispatchEvent(new Event('change'))
  await Promise.resolve()
}

it('previews without mutation, then loads paused and dispatches the imported musical steps on explicit Play', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.99)
  const { root, audio, click } = setup()
  click('#play'); await Promise.resolve()
  await chooseLoop(root, importedLoop)
  expect(root.querySelector('#status')!.textContent).toBe('Playing')
  expect(root.querySelector('#bpm')!.textContent).toBe('90')
  expect(pressedMask(root)[0]).toBe(true)
  click('#load-loop')
  expect(root.querySelector('#status')!.textContent).toBe('Paused')
  expect(vi.getTimerCount()).toBe(0)
  expect(root.querySelector('#bpm')!.textContent).toBe('100')
  expect(root.querySelector<HTMLInputElement>('input[value="starry"]')!.checked).toBe(true)
  expect(root.querySelector<HTMLInputElement>('input[value="fast"]')!.checked).toBe(true)
  expect(pressedMask(root)).toEqual(importedLoop.mask)
  vi.mocked(audio.drum).mockClear(); vi.mocked(audio.note).mockClear()
  click('#play'); await Promise.resolve()
  vi.advanceTimersByTime(150)
  expect(audio.drum).not.toHaveBeenCalled()
  expect(audio.note).not.toHaveBeenCalled()
  vi.advanceTimersByTime(150)
  expect(vi.mocked(audio.drum).mock.calls).toEqual([['sn']])
})

it('invalid files and cancelled previews leave the existing loop and playback running', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.99)
  const { root, audio, click } = setup()
  click('#play'); await Promise.resolve()
  await chooseLoop(root, { ...importedLoop, version: 2 })
  expect(root.querySelector<HTMLButtonElement>('#load-loop')!.disabled).toBe(true)
  expect(root.querySelector('#status')!.textContent).toBe('Playing')
  await chooseLoop(root, importedLoop)
  click('#cancel-load')
  expect(root.querySelector('#bpm')!.textContent).toBe('90')
  expect(pressedMask(root)).toEqual(Array(16).fill(true))
  vi.advanceTimersByTime(167)
  expect(vi.mocked(audio.drum).mock.calls).toEqual([['bd'], ['bd']])
})

it('loading during audio startup fences the old completion and never starts the imported loop', async () => {
  const { promise, resolve: resume } = Promise.withResolvers<void>()
  const { root, audio, click } = setup(() => promise)
  click('#play')
  await chooseLoop(root, importedLoop)
  click('#load-loop')
  resume(); await Promise.resolve()
  vi.advanceTimersByTime(2000)
  expect(root.querySelector('#status')!.textContent).toBe('Paused')
  expect(root.querySelector('#bpm')!.textContent).toBe('100')
  expect(audio.drum).not.toHaveBeenCalled()
  expect(audio.note).not.toHaveBeenCalled()
  expect(vi.getTimerCount()).toBe(0)
})

it('a stale file read cannot replace a newer loaded loop or resurrect its preview', async () => {
  const { promise, resolve: finish } = Promise.withResolvers<string>()
  const { root, click } = setup()
  await chooseLoop(root, importedLoop, () => promise)
  await chooseLoop(root, { ...importedLoop, preset: 'demon', speed: 'slow', mask: Array(16).fill(false) })
  click('#load-loop')
  finish(JSON.stringify(importedLoop)); await Promise.resolve()
  expect(root.querySelector('#bpm')!.textContent).toBe('105')
  expect(root.querySelector('#preset-name')!.textContent).toBe('Demon')
  expect(pressedMask(root)).toEqual(Array(16).fill(false))
  expect(root.querySelector<HTMLButtonElement>('#load-loop')!.disabled).toBe(true)
  expect(root.querySelector('#loop-file-status')!.textContent).toContain('Loop loaded and paused')
})
