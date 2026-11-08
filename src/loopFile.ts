import type { Speed } from './transport'

export interface LoopSettings {
  preset: 'starry' | 'flow' | 'glitch' | 'demon'
  speed: Speed
  mask: boolean[]
}
export const MAX_LOOP_BYTES = 16_384

export function parseLoop(source: string): LoopSettings {
  if (source.length > MAX_LOOP_BYTES) throw new Error('Loop files must be no larger than 16 KiB.')
  let value: unknown
  try { value = JSON.parse(source) } catch { throw new Error('Choose a valid MeJ loop JSON file.') }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Unsupported MeJ loop file.')
  const loop = value as Record<string, unknown>
  if (loop.format !== 'mej-loop' || loop.version !== 1) throw new Error('Unsupported MeJ loop format or version.')
  if (!['starry', 'flow', 'glitch', 'demon'].includes(String(loop.preset))) throw new Error('Unknown loop character.')
  if (!['slow', 'mid', 'fast'].includes(String(loop.speed))) throw new Error('Unknown loop tempo.')
  if (!Array.isArray(loop.mask) || loop.mask.length !== 16 || loop.mask.some(step => typeof step !== 'boolean')) throw new Error('A loop must contain exactly 16 boolean steps.')
  return { preset: loop.preset as LoopSettings['preset'], speed: loop.speed as Speed, mask: loop.mask }
}

export function serializeLoop(loop: LoopSettings): string {
  return JSON.stringify({ format: 'mej-loop', version: 1, preset: loop.preset, speed: loop.speed, mask: loop.mask }, null, 2)
}
