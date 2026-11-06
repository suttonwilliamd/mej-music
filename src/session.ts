import type { Speed } from './transport'

export type Preset = 'starry' | 'flow' | 'glitch' | 'demon'
export interface Session {
  version: 2
  preset: Preset
  speed: Speed
  steps: boolean[]
  volume: number
  muted: boolean
}
export const SESSION_KEY = 'mej.session'
export const MAX_PROJECT_BYTES = 4096

export function defaultSession(): Session {
  return { version: 2, preset: 'flow', speed: 'mid', steps: Array<boolean>(16).fill(true), volume: 100, muted: false }
}

/** Strict, bounded codec; valid v1 projects migrate without losing existing edits. */
export function decodeSession(text: string): Session {
  if (text.length > MAX_PROJECT_BYTES) throw new Error('Project exceeds the 4 KiB limit.')
  let value: unknown
  try { value = JSON.parse(text) } catch { throw new Error('Project is not valid JSON.') }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Project must be a session object.')
  const session = value as Record<string, unknown>
  if (session.version !== 1 && session.version !== 2) throw new Error('Unsupported project version. Expected version 1 or 2.')
  const fields = session.version === 1 ? ['version', 'preset', 'speed', 'steps'] : ['version', 'preset', 'speed', 'steps', 'volume', 'muted']
  if (Object.keys(session).length !== fields.length || !fields.every(key => Object.prototype.hasOwnProperty.call(session, key))) {
    throw new Error(`Project must contain only ${fields.join(', ')}.`)
  }
  if (!['starry', 'flow', 'glitch', 'demon'].includes(session.preset as string)) throw new Error('Project has an unknown preset.')
  if (!['slow', 'mid', 'fast'].includes(session.speed as string)) throw new Error('Project has an unknown tempo setting.')
  if (!Array.isArray(session.steps) || session.steps.length !== 16 || !session.steps.every(step => typeof step === 'boolean')) {
    throw new Error('Project needs exactly 16 boolean steps.')
  }
  if (session.version === 2 && (typeof session.volume !== 'number' || !Number.isInteger(session.volume) || session.volume < 0 || session.volume > 100)) {
    throw new Error('Project volume must be an integer from 0 to 100.')
  }
  if (session.version === 2 && typeof session.muted !== 'boolean') throw new Error('Project muted must be a boolean.')
  return {
    version: 2, preset: session.preset as Preset, speed: session.speed as Speed, steps: [...session.steps],
    volume: session.version === 1 ? 100 : session.volume as number,
    muted: session.version === 1 ? false : session.muted as boolean,
  }
}

export function encodeSession(session: Session): string {
  // Validate exports too: never write state another MeJ instance cannot restore.
  const validated = decodeSession(JSON.stringify(session))
  return JSON.stringify(validated)
}
