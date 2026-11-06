import type { Session } from './session'
import { drumHits, tempo } from './transport'
import { drumDuration, outputLevel, PRESETS, stepNotes, Synthesizer, type Note } from './music'

export const WAV_RATE = 44100
export type RenderEvent = { at: number } & ({ sound: string } | { note: Note })

/** One traversal, beginning at time zero; reserve the complete step span and every tail. */
export function planSnapshot(session: Session) {
  const preset = PRESETS[session.preset]
  const stepSeconds = 60 / tempo(preset.bpm, session.speed) / 4
  const events: RenderEvent[] = []
  let duration = 16 * stepSeconds
  for (let step = 0; step < 16; step++) {
    if (!session.steps[step]) continue
    const at = step * stepSeconds
    for (const note of stepNotes(session.preset, step)) {
      events.push({ at, note })
      duration = Math.max(duration, at + note[1])
    }
    for (const hit of drumHits(preset.pattern[step], stepSeconds)) {
      const time = at + hit.offset
      events.push({ at: time, sound: hit.sound })
      duration = Math.max(duration, time + drumDuration(hit.sound))
    }
  }
  // All presets are bounded: at most 16 steps at the slowest supported BPM plus
  // the longest scheduled envelope. No looping, live context, timers or capture.
  return { events, frames: Math.ceil(duration * WAV_RATE) }
}

/** Standard little-endian stereo PCM; signed saturation happens only at encoding. */
export function encodeWav(buffer: Pick<AudioBuffer, 'numberOfChannels' | 'sampleRate' | 'length' | 'getChannelData'>): ArrayBuffer {
  if (buffer.numberOfChannels !== 2 || buffer.sampleRate !== WAV_RATE || !Number.isSafeInteger(buffer.length) || buffer.length <= 0 || buffer.length > (0xffffffff - 36) / 4) throw new Error('Invalid WAV buffer')
  const channels = [buffer.getChannelData(0), buffer.getChannelData(1)]
  if (channels.some(channel => channel.length !== buffer.length)) throw new Error('Invalid channel length')
  const dataBytes = buffer.length * 4
  const bytes = new ArrayBuffer(44 + dataBytes)
  const view = new DataView(bytes)
  const text = (offset: number, value: string) => { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)) }
  text(0, 'RIFF'); view.setUint32(4, 36 + dataBytes, true); text(8, 'WAVE')
  text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true)
  view.setUint16(22, 2, true); view.setUint32(24, WAV_RATE, true)
  view.setUint32(28, WAV_RATE * 4, true); view.setUint16(32, 4, true); view.setUint16(34, 16, true)
  text(36, 'data'); view.setUint32(40, dataBytes, true)
  for (let frame = 0; frame < buffer.length; frame++) for (let channel = 0; channel < 2; channel++) {
    const sample = channels[channel][frame]
    if (!Number.isFinite(sample)) throw new Error('Non-finite audio sample')
    const clipped = Math.max(-1, Math.min(1, sample))
    view.setInt16(44 + frame * 4 + channel * 2, Math.round(clipped * (clipped < 0 ? 32768 : 32767)), true)
  }
  return bytes
}

export async function renderWav(session: Session): Promise<ArrayBuffer> {
  if (typeof OfflineAudioContext === 'undefined') throw new Error('Offline audio unavailable')
  const plan = planSnapshot(session)
  const context = new OfflineAudioContext(2, plan.frames, WAV_RATE)
  const synth = new Synthesizer(context, outputLevel(session.volume, session.muted))
  for (const event of plan.events) {
    if ('sound' in event) synth.drum(event.sound, event.at)
    else synth.note(event.note[0], event.note[1], event.note[2], event.note[3], event.at)
  }
  return encodeWav(await context.startRendering())
}
