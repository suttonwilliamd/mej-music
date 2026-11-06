import { afterEach, expect, it, vi } from 'vitest'
import { defaultSession } from './session'
import { encodeWav, planSnapshot, WAV_RATE } from './wav'

afterEach(() => vi.restoreAllMocks())
it('writes RIFF PCM lengths, stereo interleaving and signed saturation independently', () => {
  const channels = [new Float32Array([-2, -0.5, 0, 0.5, 2]), new Float32Array([1, 0.25, -1, -0.25, 0])]
  const bytes = encodeWav({ numberOfChannels: 2, sampleRate: 44100, length: 5, getChannelData: channel => channels[channel] })
  const view = new DataView(bytes)
  expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('RIFF')
  expect(new TextDecoder().decode(bytes.slice(8, 16))).toBe('WAVEfmt ')
  expect(new TextDecoder().decode(bytes.slice(36, 40))).toBe('data')
  expect(bytes.byteLength).toBe(64)
  expect([view.getUint32(4, true), view.getUint32(16, true), view.getUint16(20, true), view.getUint16(22, true), view.getUint32(24, true), view.getUint32(28, true), view.getUint16(32, true), view.getUint16(34, true), view.getUint32(40, true)]).toEqual([56,16,1,2,44100,176400,4,16,20])
  expect(Array.from({ length: 10 }, (_, i) => view.getInt16(44 + i * 2, true))).toEqual([-32768,32767,-16384,8192,0,-32768,16384,-8192,32767,0])
})
it('rejects malformed or non-finite PCM rather than inventing silence', () => {
  const buffer = { numberOfChannels: 2, sampleRate: 44100, length: 1, getChannelData: () => new Float32Array([NaN]) }
  expect(() => encodeWav(buffer)).toThrow('Non-finite')
  expect(() => encodeWav({ ...buffer, sampleRate: 48000 })).toThrow('Invalid')
  expect(() => encodeWav({ ...buffer, length: 0 })).toThrow('Invalid')
  expect(() => encodeWav({ ...buffer, getChannelData: () => new Float32Array(2) })).toThrow('length')
})
it('plans one masked preset from zero with literal repetitions and complete chord tails', () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.99)
  const session = { ...defaultSession(), preset: 'demon' as const, speed: 'fast' as const, steps: Array.from({ length: 16 }, (_, i) => i === 3 || i === 12) }
  const plan = planSnapshot(session)
  const drums = plan.events.filter(event => 'sound' in event)
  expect(drums).toHaveLength(9) // simultaneous cp*4 + bd*4, then one bd
  for (const [index, at] of [0.2571428571, 0.2785714286, 0.3, 0.3214285714].entries()) expect(drums[index].at).toBeCloseTo(at, 9)
  const notes = plan.events.filter(event => 'note' in event)
  expect(notes.map(event => 'note' in event && event.note[0])).toEqual(['d2','d3','f3','a3'])
  expect(plan.frames).toBe(Math.ceil((36 / 35 + 1) * 44100))
  expect(plan.events.every(event => event.at < 16 * 3 / 35)).toBe(true)
})
it('bounds every preset/speed and all-off traversals without generating events', () => {
  vi.spyOn(Math, 'random').mockReturnValue(0) // maximum melody participation
  for (const preset of ['flow','starry','glitch','demon'] as const) for (const speed of ['slow','mid','fast'] as const) {
    const session = { ...defaultSession(), preset, speed }
    const plan = planSnapshot(session)
    expect(plan.frames).toBeLessThanOrEqual(5 * WAV_RATE)
    expect(plan.events.length).toBeGreaterThan(16)
    expect(plan.events.length).toBeLessThan(160)
    expect(planSnapshot({ ...session, steps: Array(16).fill(false) }).events).toEqual([])
  }
  expect(planSnapshot({ ...defaultSession(), preset: 'starry', speed: 'slow', steps: Array(16).fill(false) }).frames).toBe(176400)
})
