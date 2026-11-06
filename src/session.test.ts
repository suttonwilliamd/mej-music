import { expect, it } from 'vitest'
import { decodeSession, defaultSession, encodeSession, MAX_PROJECT_BYTES } from './session'

it('round-trips every preset and tempo with exact mixed, all-on and all-off masks', () => {
  for (const preset of ['starry', 'flow', 'glitch', 'demon'] as const) {
    for (const speed of ['slow', 'mid', 'fast'] as const) {
      for (const steps of [Array(16).fill(true), Array(16).fill(false), Array.from({ length: 16 }, (_, i) => i % 3 === 0)]) {
        const session = { version: 1 as const, preset, speed, steps }
        expect(decodeSession(encodeSession(session))).toEqual(session)
        expect(Object.keys(JSON.parse(encodeSession(session)))).toEqual(['version', 'preset', 'speed', 'steps'])
      }
    }
  }
})

it.each([
  '', '{', 'null', '[]', 'true', '42', '"session"',
  JSON.stringify({ ...defaultSession(), version: 0 }),
  JSON.stringify({ ...defaultSession(), version: 2 }),
  JSON.stringify({ ...defaultSession(), version: '1' }),
  JSON.stringify({ preset: 'flow', speed: 'mid', steps: Array(16).fill(true) }),
  JSON.stringify({ ...defaultSession(), preset: 'constructor' }),
  JSON.stringify({ ...defaultSession(), preset: 'Flow' }),
  JSON.stringify({ ...defaultSession(), speed: 90 }),
  JSON.stringify({ ...defaultSession(), speed: 'turbo' }),
  JSON.stringify({ ...defaultSession(), steps: Array(15).fill(true) }),
  JSON.stringify({ ...defaultSession(), steps: Array(17).fill(true) }),
  JSON.stringify({ ...defaultSession(), steps: [0, ...Array(15).fill(true)] }),
  JSON.stringify({ ...defaultSession(), steps: ['false', ...Array(15).fill(true)] }),
  JSON.stringify({ ...defaultSession(), steps: [null, ...Array(15).fill(true)] }),
  JSON.stringify({ ...defaultSession(), steps: '1111111111111111' }),
  JSON.stringify({ ...defaultSession(), playing: true }),
  JSON.stringify({ version: 1, preset: 'flow', speed: 'mid' }),
])('rejects malformed, unsupported or lossy project input %#', text => {
  expect(() => decodeSession(text)).toThrow()
})

it('accepts the size boundary and rejects excess before parsing', () => {
  const text = encodeSession(defaultSession())
  expect(decodeSession(text.padEnd(MAX_PROJECT_BYTES))).toEqual(defaultSession())
  expect(() => decodeSession(text.padEnd(MAX_PROJECT_BYTES + 1))).toThrow('4 KiB')
})

it('returns independent defaults and decoded step arrays; refuses invalid exports', () => {
  const first = defaultSession()
  first.steps[0] = false
  expect(defaultSession().steps[0]).toBe(true)
  const decoded = decodeSession(encodeSession(first))
  decoded.steps[0] = true
  expect(first.steps[0]).toBe(false)
  expect(() => encodeSession({ ...first, steps: [] })).toThrow('16 boolean')
})
