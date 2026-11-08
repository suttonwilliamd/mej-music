import { expect, it } from 'vitest'
import { MAX_LOOP_BYTES, parseLoop } from './loopFile'
const valid = { format: 'mej-loop', version: 1, preset: 'starry', speed: 'fast', mask: [false,true,false,true,false,true,false,true,false,true,false,true,false,true,false,true] }
it('rejects incompatible files and truncated or malformed JSON', () => {
  for (const value of [null, [], { ...valid, format: 'other' }, { ...valid, version: 2 }]) expect(() => parseLoop(JSON.stringify(value))).toThrow()
  expect(() => parseLoop('{')).toThrow(/valid MeJ/)
  expect(() => parseLoop(' '.repeat(MAX_LOOP_BYTES + 1))).toThrow(/16 KiB/)
})
it('requires known characters/tempos and exactly sixteen actual boolean steps', () => {
  for (const patch of [{ preset: 'unknown' }, { speed: 'faster' }, { mask: valid.mask.slice(1) }, { mask: [...valid.mask, true] }, { mask: valid.mask.map(value => Number(value)) }, { mask: null }]) expect(() => parseLoop(JSON.stringify({ ...valid, ...patch }))).toThrow()
})
it('supports fully muted and fully enabled loops without importing playback or cached BPM', () => {
  for (const enabled of [false, true]) {
    const result = parseLoop(JSON.stringify({ ...valid, mask: Array(16).fill(enabled), playing: true, bpm: 999 }))
    expect(result).toEqual({ preset: 'starry', speed: 'fast', mask: Array(16).fill(enabled) })
    expect('playing' in result).toBe(false)
  }
})
