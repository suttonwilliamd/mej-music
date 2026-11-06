import type { Speed } from './transport'

export type Preset = 'starry' | 'flow' | 'glitch' | 'demon'
export interface Session {
  version: 1
  preset: Preset
  speed: Speed
  steps: boolean[]
}
export const SESSION_KEY = 'mej.session'
export const MAX_PROJECT_BYTES = 4096

export function defaultSession(): Session {
  return { version: 1, preset: 'flow', speed: 'mid', steps: Array<boolean>(16).fill(true) }
}

/** Strict, bounded v1 format shared by local storage and portable project files. */
export function decodeSession(text: string): Session {
  if (text.length > MAX_PROJECT_BYTES) throw new Error('Project exceeds the 4 KiB limit.')
  let value: unknown
  try { value = JSON.parse(text) } catch { throw new Error('Project is not valid JSON.') }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Project must be a session object.')
  const session = value as Record<string, unknown>
  if (session.version !== 1) throw new Error('Unsupported project version. Expected version 1.')
  if (Object.keys(session).length !== 4 || !['version', 'preset', 'speed', 'steps'].every(key => Object.prototype.hasOwnProperty.call(session, key))) {
    throw new Error('Project must contain only version, preset, speed and steps.')
  }
  if (!['starry', 'flow', 'glitch', 'demon'].includes(session.preset as string)) throw new Error('Project has an unknown preset.')
  if (!['slow', 'mid', 'fast'].includes(session.speed as string)) throw new Error('Project has an unknown tempo setting.')
  if (!Array.isArray(session.steps) || session.steps.length !== 16 || !session.steps.every(step => typeof step === 'boolean')) {
    throw new Error('Project needs exactly 16 boolean steps.')
  }
  return { version: 1, preset: session.preset as Preset, speed: session.speed as Speed, steps: [...session.steps] }
}

export function encodeSession(session: Session): string {
  // Validate exports too: never write state another MeJ instance cannot restore.
  const validated = decodeSession(JSON.stringify(session))
  return JSON.stringify(validated)
}
