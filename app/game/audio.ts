import type { AnimalSpecies, AudioSettings, BiomeCosmeticJumpKind, BiomeId, PlatformStyle } from './types'

/**
 * Retro 8-Bit Lo-Fi Music Box + Dynamic Biome Ambient Soundscapes + Species Voices
 * 100% Web Audio API synthesis (zero external audio files).
 * Supports independent BGM, Ambience, and SFX volumes plus master Mute.
 */

const NOTE_FREQ: Record<string, number> = {
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  B5: 987.77,
  C6: 1046.5,
  D6: 1174.66,
  E6: 1318.51,
  G6: 1567.98,
  A6: 1760.0
}

const MELODY_SEQ: (string | null)[] = [
  'E5', null, 'G5', null, 'A5', null, 'G5', 'E5',
  'D5', null, 'E5', null, 'C5', null, null, null,
  'A4', null, 'C5', null, 'E5', null, 'D5', 'C5',
  'B4', null, 'C5', 'D5', 'E5', null, null, null,
  'E5', null, 'G5', null, 'A5', 'G5', 'E5', 'D5',
  'C5', null, 'D5', 'E5', 'G5', null, null, null,
  'F5', null, 'E5', null, 'D5', null, 'C5', 'B4',
  'A4', null, null, null, 'E5', null, null, null
]

const BASS_SEQ: (string | null)[] = [
  'A3', null, null, 'E3', 'A3', null, null, null,
  'F3', null, null, 'C3', 'F3', null, null, null,
  'D3', null, null, 'A3', 'D3', null, null, null,
  'E3', null, null, 'B3', 'E3', null, null, null,
  'A3', null, null, 'E3', 'A3', null, null, null,
  'C3', null, null, 'G3', 'C3', null, null, null,
  'F3', null, 'G3', null, 'E3', null, 'E3', null,
  'A3', null, null, 'E3', 'A3', null, null, null
]

const ARP_SEQ: (string | null)[] = [
  null, 'C5', null, 'E5', null, 'C5', null, null,
  null, 'A4', null, 'C5', null, 'A4', null, null,
  null, 'A4', null, 'D5', null, 'A4', null, null,
  null, 'G4', null, 'B4', null, 'G4', null, null,
  null, 'C5', null, 'E5', null, 'C5', null, null,
  null, 'E5', null, 'G5', null, 'E5', null, null,
  null, 'A4', null, 'B4', null, 'G4', null, null,
  null, 'C5', null, 'E5', null, 'A5', null, null
]

// Biome 2 — Midnight Sakura Woods (Serene Pentatonic Lullaby: D-E-G-A-B)
const SAKURA_MELODY_SEQ: (string | null)[] = [
  'E5', null, 'G5', null, 'A5', null, 'B5', 'A5',
  'G5', null, 'E5', null, 'D5', null, null, null,
  'B4', null, 'D5', null, 'E5', null, 'G5', 'E5',
  'D5', null, 'E5', 'G5', 'A5', null, null, null,
  'B5', null, 'A5', null, 'G5', null, 'E5', 'D5',
  'E5', null, 'G5', null, 'A5', null, null, null,
  'G5', null, 'E5', null, 'D5', null, 'B4', 'D5',
  'E5', null, null, null, 'B5', null, null, null
]
const SAKURA_BASS_SEQ: (string | null)[] = [
  'E3', null, null, 'B3', 'E3', null, null, null,
  'G3', null, null, 'D3', 'G3', null, null, null,
  'A3', null, null, 'E3', 'A3', null, null, null,
  'D3', null, null, 'A3', 'D3', null, null, null,
  'E3', null, null, 'B3', 'E3', null, null, null,
  'C3', null, null, 'G3', 'C3', null, null, null,
  'D3', null, 'G3', null, 'B3', null, null, null,
  'E3', null, null, 'B3', 'E3', null, null, null
]

// Biome 3 — Pastel Cloudland (Light Floating Dreamy Melody)
const CLOUD_MELODY_SEQ: (string | null)[] = [
  'C5', null, 'E5', 'G5', 'C6', null, 'B5', 'G5',
  'A5', null, 'G5', null, 'E5', null, null, null,
  'F5', null, 'A5', null, 'G5', 'E5', 'D5', 'C5',
  'D5', null, 'E5', null, 'G5', null, null, null,
  'C6', null, 'G5', null, 'A5', null, 'F5', 'G5',
  'E5', null, 'C5', null, 'D5', null, null, null,
  'F5', null, 'G5', null, 'A5', null, 'B5', 'G5',
  'C6', null, null, null, 'G5', null, null, null
]
const CLOUD_BASS_SEQ: (string | null)[] = [
  'C4', null, null, 'G3', 'C4', null, null, null,
  'A3', null, null, 'E3', 'A3', null, null, null,
  'F3', null, null, 'C4', 'F3', null, null, null,
  'G3', null, null, 'D4', 'G3', null, null, null,
  'C4', null, null, 'G3', 'F3', null, null, null,
  'E3', null, null, 'C3', 'G3', null, null, null,
  'F3', null, 'G3', null, 'A3', null, 'G3', null,
  'C4', null, null, 'G3', 'C4', null, null, null
]

// Biome 4 — Lantern Harbor (Warm Rhythmic Seaside Melody)
const HARBOR_MELODY_SEQ: (string | null)[] = [
  'G5', null, 'D5', 'E5', 'G5', null, 'A5', 'G5',
  'E5', null, 'D5', 'B4', 'D5', null, null, null,
  'C5', null, 'E5', 'G5', 'A5', null, 'G5', 'E5',
  'D5', null, 'G5', null, 'B5', null, null, null,
  'A5', null, 'G5', 'E5', 'D5', null, 'E5', 'G5',
  'E5', null, 'C5', null, 'D5', null, null, null,
  'G5', null, 'A5', 'B5', 'A5', null, 'G5', 'E5',
  'G5', null, null, null, 'D5', null, null, null
]
const HARBOR_BASS_SEQ: (string | null)[] = [
  'G3', null, 'D3', null, 'G3', null, 'D3', null,
  'E3', null, 'B3', null, 'E3', null, 'B3', null,
  'C3', null, 'G3', null, 'C3', null, 'G3', null,
  'D3', null, 'A3', null, 'D3', null, 'A3', null,
  'G3', null, 'D3', null, 'E3', null, 'B3', null,
  'C3', null, 'G3', null, 'D3', null, 'A3', null,
  'C3', null, 'D3', null, 'E3', null, 'D3', null,
  'G3', null, 'D3', null, 'G3', null, null, null
]

// Fast Energetic Challenge Motif (Star Ring Mini-Challenge & Time Trial!)
const CHALLENGE_MELODY_SEQ: (string | null)[] = [
  'E5', 'G5', 'A5', null, 'C6', 'B5', 'A5', 'G5',
  'E5', 'G5', 'A5', 'C6', 'D6', null, 'C6', null,
  'A5', 'G5', 'E5', 'G5', 'A5', null, 'G5', 'E5',
  'D5', 'E5', 'G5', 'A5', 'B5', null, 'G5', null
]

// Joyful Upbeat Invincibility Jingle (Golden Mooncake 8s Giant Power-Up!)
const MOONCAKE_MELODY_SEQ: (string | null)[] = [
  'C5', 'E5', 'G5', 'C6', 'G5', 'E5', 'A5', 'G5',
  'F5', 'A5', 'C6', 'A5', 'G5', 'E5', 'D5', 'G5',
  'C5', 'E5', 'G5', 'C6', 'D6', 'C6', 'B5', 'A5',
  'G5', 'A5', 'B5', 'C6', 'E6', null, 'C6', null
]

// Tender Closing Music Box Lullaby for the Level 8 Epilogue Cutscene (warm C-major moonlit harbor)
const EPILOGUE_MELODY_SEQ: (string | null)[] = [
  'G5', null, 'E5', null, 'C5', null, 'D5', 'E5',
  'G5', null, 'A5', null, 'G5', null, null, null,
  'F5', null, 'E5', null, 'D5', null, 'C5', 'D5',
  'E5', null, 'G5', null, 'E5', null, null, null,
  'C6', null, 'B5', null, 'A5', null, 'G5', 'E5',
  'F5', null, 'A5', null, 'G5', null, 'E5', null,
  'D5', null, 'E5', null, 'G5', null, 'E5', 'D5',
  'C5', null, null, null, 'G5', null, 'C6', null
]

const EPILOGUE_HARMONY_SEQ: (string | null)[] = [
  null, 'E5', null, 'G5', null, 'E5', null, null,
  null, 'E5', null, 'C6', null, 'B5', null, null,
  null, 'A4', null, 'C5', null, 'A4', null, null,
  null, 'C5', null, 'E5', null, 'C5', null, null,
  null, 'E5', null, 'G5', null, 'C5', null, null,
  null, 'C5', null, 'F5', null, 'C5', null, null,
  null, 'B4', null, 'D5', null, 'B4', null, null,
  null, 'E5', null, 'G5', null, 'E5', null, null
]

const EPILOGUE_BASS_SEQ: (string | null)[] = [
  'C4', null, null, null, 'G3', null, null, null,
  'A3', null, null, null, 'E3', null, null, null,
  'F3', null, null, null, 'C4', null, null, null,
  'G3', null, null, null, 'D4', null, null, null,
  'A3', null, null, null, 'E4', null, null, null,
  'F3', null, null, null, 'C4', null, null, null,
  'G3', null, null, null, 'G3', null, null, null,
  'C4', null, null, null, 'C4', null, null, null
]

interface AmbientLayerNodes {
  stop: () => void
  gain: GainNode
}

export class RetroAudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private bgmGain: GainNode | null = null
  private ambienceGain: GainNode | null = null
  private sfxGain: GainNode | null = null

  private muted = false
  private settings: AudioSettings = {
    bgmVolume: 0.65,
    ambienceVolume: 0.65,
    sfxVolume: 0.8
  }

  private bgmRunning = false
  private bgmMode: 'normal' | 'epilogue' | 'challenge' | 'mooncake' = 'normal'
  private bgmBiome: BiomeId = 'rooftops'
  private bgmLowHealth = false
  private bgmClimaxLayer = false
  private bgmTimer: number | null = null
  private stepIndex = 0
  private nextStepTime = 0

  // Dynamic Biome Soundscape state
  private activeBiome: BiomeId | null = null
  private activeAmbientNodes: AmbientLayerNodes | null = null
  private ambientAccentTimer: number | null = null
  private cleanupTimers = new Set<number>()
  private pinkNoiseBuffer: AudioBuffer | null = null
  private brownNoiseBuffer: AudioBuffer | null = null

  constructor(initialMuted = false, initialSettings?: AudioSettings) {
    this.muted = initialMuted
    if (initialSettings) {
      this.settings = { ...initialSettings }
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return null
      this.ctx = new AudioCtx()
      this.masterGain = this.ctx.createGain()
      this.bgmGain = this.ctx.createGain()
      this.ambienceGain = this.ctx.createGain()
      this.sfxGain = this.ctx.createGain()

      this.applyVolumesImmediate()

      this.bgmGain.connect(this.masterGain)
      this.ambienceGain.connect(this.masterGain)
      this.sfxGain.connect(this.masterGain)
      this.masterGain.connect(this.ctx.destination)

      this.createNoiseBuffers(this.ctx)
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  private createNoiseBuffers(ctx: AudioContext): void {
    const length = ctx.sampleRate * 4 // 4 seconds seamless noise buffer
    const pink = ctx.createBuffer(1, length, ctx.sampleRate)
    const brown = ctx.createBuffer(1, length, ctx.sampleRate)
    const pData = pink.getChannelData(0)
    const bData = brown.getChannelData(0)

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    let lastBrown = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.969 * b2 + white * 0.153852
      b3 = 0.8665 * b3 + white * 0.3104856
      b4 = 0.55 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.016898
      pData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08
      b6 = white * 0.115926

      lastBrown = (lastBrown + 0.02 * white) / 1.02
      bData[i] = lastBrown * 1.4
    }

    this.pinkNoiseBuffer = pink
    this.brownNoiseBuffer = brown
  }

  private applyVolumesImmediate(): void {
    if (!this.ctx || !this.masterGain || !this.bgmGain || !this.ambienceGain || !this.sfxGain) return
    const now = this.ctx.currentTime
    this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.78, now)
    this.bgmGain.gain.setValueAtTime(this.settings.bgmVolume * 0.32, now)
    this.ambienceGain.gain.setValueAtTime(this.settings.ambienceVolume * 0.42, now)
    this.sfxGain.gain.setValueAtTime(this.settings.sfxVolume * 0.65, now)
  }

  public setAudioSettings(next: AudioSettings): void {
    this.settings = { ...next }
    if (!this.ctx || !this.bgmGain || !this.ambienceGain || !this.sfxGain) return
    const now = this.ctx.currentTime
    this.bgmGain.gain.setTargetAtTime(this.settings.bgmVolume * 0.32, now, 0.04)
    this.ambienceGain.gain.setTargetAtTime(this.settings.ambienceVolume * 0.42, now, 0.05)
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume * 0.65, now, 0.04)
  }

  public unlock(): void {
    const ctx = this.ensureContext()
    if (ctx && !this.bgmRunning) {
      this.startBgm()
    }
    if (ctx && this.activeBiome && !this.activeAmbientNodes) {
      const target = this.activeBiome
      this.activeBiome = null
      this.setBiomeAmbience(target)
    }
  }

  public isMuted(): boolean {
    return this.muted
  }

  public setMuted(muted: boolean): void {
    this.muted = muted
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.78, this.ctx.currentTime, 0.04)
    }
  }

  public toggleMute(): boolean {
    this.ensureContext()
    this.setMuted(!this.muted)
    if (!this.muted && !this.bgmRunning) {
      this.startBgm()
    }
    return this.muted
  }

  // ============================================================================
  // DYNAMIC BIOME AMBIENT SOUNDSCAPES (Smooth Fade-In / Fade-Out)
  // ============================================================================

  public setBiomeAmbience(biome: BiomeId | null): void {
    if (biome === this.activeBiome && (biome === null || this.activeAmbientNodes !== null)) {
      return
    }

    // Smoothly fade out previous biome ambience
    this.fadeOutActiveAmbience()
    this.activeBiome = biome

    if (!biome) return
    if (!this.ctx || !this.ambienceGain || !this.pinkNoiseBuffer || !this.brownNoiseBuffer) {
      // Will initialize automatically on first user gesture via unlock()
      return
    }

    const ctx = this.ctx
    const now = ctx.currentTime
    const layerGain = ctx.createGain()
    layerGain.gain.setValueAtTime(0.0001, now)
    layerGain.gain.setTargetAtTime(1.0, now + 0.02, 0.55) // gentle ~1.5s fade-in
    layerGain.connect(this.ambienceGain)

    const sources: AudioNode[] = []
    const stoppables: { stop: (when?: number) => void }[] = []

    const createLoopingNoise = (
      buffer: AudioBuffer,
      filterType: BiquadFilterType,
      freq: number,
      q: number,
      vol: number
    ) => {
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true

      const filter = ctx.createBiquadFilter()
      filter.type = filterType
      filter.frequency.setValueAtTime(freq, now)
      filter.Q.setValueAtTime(q, now)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(vol, now)

      src.connect(filter)
      filter.connect(gain)
      gain.connect(layerGain)
      src.start(now)
      stoppables.push(src)
      sources.push(src, filter, gain)
      return { filter, gain }
    }

    if (biome === 'rooftops') {
      // Gentle low-volume night breeze (filtered brown noise) + soft distant crickets
      createLoopingNoise(this.brownNoiseBuffer, 'lowpass', 360, 0.7, 0.22)
      this.scheduleBiomeAccents('rooftops', layerGain)
    } else if (biome === 'sakura') {
      // Light rustling leaves (soft bandpass pink noise) + random pentatonic wind chimes
      createLoopingNoise(this.pinkNoiseBuffer, 'bandpass', 1100, 1.1, 0.16)
      this.scheduleBiomeAccents('sakura', layerGain)
    } else if (biome === 'cloudland') {
      // Open airy high-altitude breeze + serene crystal harmonic shimmers
      createLoopingNoise(this.pinkNoiseBuffer, 'bandpass', 620, 0.55, 0.18)
      this.scheduleBiomeAccents('cloudland', layerGain)
    } else if (biome === 'harbor') {
      // Rhythmic slow ocean waves rising & receding gently against wooden pier
      const wave = createLoopingNoise(this.brownNoiseBuffer, 'lowpass', 420, 0.8, 0.22)
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.type = 'sine'
      lfo.frequency.setValueAtTime(0.14, now) // calm ~7s wave cycle
      lfoGain.gain.setValueAtTime(0.14, now)
      lfo.connect(lfoGain)
      lfoGain.connect(wave.gain.gain)
      lfo.start(now)
      stoppables.push(lfo)

      // Subtle filter sweep with waves
      const filterLfo = ctx.createOscillator()
      const filterLfoGain = ctx.createGain()
      filterLfo.type = 'sine'
      filterLfo.frequency.setValueAtTime(0.14, now)
      filterLfoGain.gain.setValueAtTime(220, now)
      filterLfo.connect(filterLfoGain)
      filterLfoGain.connect(wave.filter.frequency)
      filterLfo.start(now)
      stoppables.push(filterLfo)
    }

    this.activeAmbientNodes = {
      gain: layerGain,
      stop: () => {
        const t = ctx.currentTime
        layerGain.gain.cancelScheduledValues(t)
        layerGain.gain.setTargetAtTime(0.0001, t, 0.18) // smooth fade-out (~0.5s)
        const timerId = window.setTimeout(() => {
          this.cleanupTimers.delete(timerId)
          for (const s of stoppables) {
            try {
              s.stop()
            } catch {
              // ignore already stopped
            }
          }
          for (const node of sources) {
            try {
              node.disconnect()
            } catch {
              // ignore already disconnected
            }
          }
          try {
            layerGain.disconnect()
          } catch {
            // ignore
          }
        }, 700)
        this.cleanupTimers.add(timerId)
      }
    }
  }

  public stopAmbience(): void {
    this.setBiomeAmbience(null)
  }

  private fadeOutActiveAmbience(): void {
    if (this.ambientAccentTimer !== null) {
      window.clearTimeout(this.ambientAccentTimer)
      this.ambientAccentTimer = null
    }
    if (this.activeAmbientNodes) {
      this.activeAmbientNodes.stop()
      this.activeAmbientNodes = null
    }
  }

  private scheduleBiomeAccents(biome: BiomeId, targetGain: GainNode): void {
    const loop = () => {
      if (this.activeBiome !== biome || !this.ctx) return
      const ctx = this.ctx
      const now = ctx.currentTime

      if (!this.muted && this.settings.ambienceVolume > 0.01) {
        if (biome === 'rooftops') {
          // Soft distant rhythmic night cricket (3 gentle pulses)
          for (let i = 0; i < 3; i++) {
            const t = now + i * 0.085
            const osc = ctx.createOscillator()
            const g = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(4150 + (i % 2) * 120, t)
            g.gain.setValueAtTime(0.0001, t)
            g.gain.linearRampToValueAtTime(0.022, t + 0.012)
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.065)
            osc.connect(g)
            g.connect(targetGain)
            osc.start(t)
            osc.stop(t + 0.075)
          }
        } else if (biome === 'sakura') {
          // Delicate random pentatonic wind chime note (C6, D6, E6, G6, A6)
          const notes = [1046.5, 1174.66, 1318.51, 1567.98, 1760.0]
          const count = Math.random() > 0.55 ? 2 : 1
          for (let i = 0; i < count; i++) {
            const freq = notes[Math.floor(Math.random() * notes.length)]!
            const t = now + i * 0.22
            const osc = ctx.createOscillator()
            const g = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, t)
            g.gain.setValueAtTime(0.0001, t)
            g.gain.linearRampToValueAtTime(0.055, t + 0.02)
            g.gain.exponentialRampToValueAtTime(0.0001, t + 1.15)
            osc.connect(g)
            g.connect(targetGain)
            osc.start(t)
            osc.stop(t + 1.2)
          }
        } else if (biome === 'cloudland') {
          // Serene soft harmonic crystal shimmer
          const bases = [659.25, 783.99, 880.0, 1046.5]
          const f = bases[Math.floor(Math.random() * bases.length)]!
          ;[f, f * 1.5].forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            const g = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, now + idx * 0.12)
            g.gain.setValueAtTime(0.0001, now + idx * 0.12)
            g.gain.linearRampToValueAtTime(0.032, now + idx * 0.12 + 0.25)
            g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.45)
            osc.connect(g)
            g.connect(targetGain)
            osc.start(now + idx * 0.12)
            osc.stop(now + idx * 0.12 + 1.5)
          })
        }
      }

      const nextDelay =
        biome === 'rooftops'
          ? 2400 + Math.random() * 2400
          : biome === 'sakura'
            ? 2800 + Math.random() * 3200
            : 3000 + Math.random() * 2800
      this.ambientAccentTimer = window.setTimeout(loop, nextDelay)
    }

    this.ambientAccentTimer = window.setTimeout(loop, 1200)
  }

  // ============================================================================
  // SOFT LO-FI MUSIC BOX BGM
  // ============================================================================

  public setBgmMode(mode: 'normal' | 'epilogue' | 'challenge' | 'mooncake'): void {
    if (this.bgmMode === mode) return
    this.bgmMode = mode
    this.stepIndex = 0
    if (this.ctx && this.bgmRunning) {
      this.nextStepTime = Math.max(this.ctx.currentTime + 0.06, this.nextStepTime)
    }
  }

  public setBgmBiome(biome: BiomeId): void {
    if (this.bgmBiome === biome) return
    this.bgmBiome = biome
    if (this.bgmMode === 'normal') {
      this.stepIndex = 0
    }
  }

  public setAdaptiveBgmFlags(opts: { lowHealth: boolean; climaxLayer: boolean }): void {
    this.bgmLowHealth = opts.lowHealth
    this.bgmClimaxLayer = opts.climaxLayer
  }

  public startBgm(): void {
    const ctx = this.ensureContext()
    if (!ctx || this.bgmRunning) return
    this.bgmRunning = true
    this.nextStepTime = ctx.currentTime + 0.06
    this.scheduleLoop()
  }

  public stopBgm(): void {
    this.bgmRunning = false
    if (this.bgmTimer !== null) {
      window.clearTimeout(this.bgmTimer)
      this.bgmTimer = null
    }
  }

  public destroy(): void {
    this.stopBgm()
    this.fadeOutActiveAmbience()
    for (const id of this.cleanupTimers) {
      window.clearTimeout(id)
    }
    this.cleanupTimers.clear()
    if (this.ctx) {
      this.ctx.close().catch(() => {})
      this.ctx = null
    }
  }

  private scheduleLoop(): void {
    if (!this.bgmRunning || !this.ctx) return
    const mode = this.bgmMode
    const stepDuration =
      mode === 'epilogue'
        ? 0.235
        : mode === 'mooncake'
          ? 0.112
          : mode === 'challenge'
            ? 0.125
            : this.bgmBiome === 'sakura'
              ? 0.18
              : this.bgmBiome === 'harbor'
                ? 0.158
                : 0.165
    const lookAhead = 0.14
    // Gentle pitch soften when at 1 heart (calm reminder without panic)
    const pitchMult = mode === 'normal' && this.bgmLowHealth ? 0.944 : 1.0

    while (this.nextStepTime < this.ctx.currentTime + lookAhead) {
      if (mode === 'epilogue') {
        const idx = this.stepIndex % EPILOGUE_MELODY_SEQ.length
        const melodyNote = EPILOGUE_MELODY_SEQ[idx]
        const harmNote = EPILOGUE_HARMONY_SEQ[idx]
        const bassNote = EPILOGUE_BASS_SEQ[idx]

        if (melodyNote && NOTE_FREQ[melodyNote]) {
          const f = NOTE_FREQ[melodyNote]!
          this.scheduleBgmTone(f, this.nextStepTime, stepDuration * 3.1, 'sine', 0.18, 3200)
          this.scheduleBgmTone(f * 2, this.nextStepTime, stepDuration * 1.4, 'sine', 0.055, 4200)
          this.scheduleBgmTone(f * 3, this.nextStepTime, stepDuration * 0.6, 'sine', 0.018, 4800)
        }
        if (harmNote && NOTE_FREQ[harmNote]) {
          this.scheduleBgmTone(NOTE_FREQ[harmNote]!, this.nextStepTime, stepDuration * 1.6, 'sine', 0.07, 2600)
        }
        if (bassNote && NOTE_FREQ[bassNote]) {
          this.scheduleBgmTone(NOTE_FREQ[bassNote]!, this.nextStepTime, stepDuration * 3.2, 'triangle', 0.16, 680)
        }

        this.nextStepTime += stepDuration
        this.stepIndex = (this.stepIndex + 1) % EPILOGUE_MELODY_SEQ.length
      } else if (mode === 'mooncake') {
        const idx = this.stepIndex % MOONCAKE_MELODY_SEQ.length
        const note = MOONCAKE_MELODY_SEQ[idx]
        if (note && NOTE_FREQ[note]) {
          const f = NOTE_FREQ[note]!
          this.scheduleBgmTone(f, this.nextStepTime, stepDuration * 1.35, 'square', 0.11, 2600)
          this.scheduleBgmTone(f * 2, this.nextStepTime, stepDuration * 0.8, 'sine', 0.04, 3800)
        }
        if (idx % 2 === 0) {
          const bass = idx % 8 < 4 ? NOTE_FREQ.C4! : NOTE_FREQ.G3!
          this.scheduleBgmTone(bass, this.nextStepTime, stepDuration * 1.4, 'triangle', 0.2, 720)
        }
        this.nextStepTime += stepDuration
        this.stepIndex = (this.stepIndex + 1) % MOONCAKE_MELODY_SEQ.length
      } else if (mode === 'challenge') {
        const idx = this.stepIndex % CHALLENGE_MELODY_SEQ.length
        const note = CHALLENGE_MELODY_SEQ[idx]
        if (note && NOTE_FREQ[note]) {
          const f = NOTE_FREQ[note]!
          this.scheduleBgmTone(f, this.nextStepTime, stepDuration * 1.4, 'triangle', 0.18, 2400)
          this.scheduleBgmTone(f * 2, this.nextStepTime, stepDuration * 0.75, 'sine', 0.05, 3400)
        }
        if (idx % 4 === 0) {
          const bass = idx < 16 ? NOTE_FREQ.A3! : NOTE_FREQ.E3!
          this.scheduleBgmTone(bass, this.nextStepTime, stepDuration * 1.8, 'triangle', 0.22, 680)
        }
        this.nextStepTime += stepDuration
        this.stepIndex = (this.stepIndex + 1) % CHALLENGE_MELODY_SEQ.length
      } else {
        // Biome-specific adaptive themes!
        const melSeq =
          this.bgmBiome === 'sakura'
            ? SAKURA_MELODY_SEQ
            : this.bgmBiome === 'cloudland'
              ? CLOUD_MELODY_SEQ
              : this.bgmBiome === 'harbor'
                ? HARBOR_MELODY_SEQ
                : MELODY_SEQ
        const bassSeq =
          this.bgmBiome === 'sakura'
            ? SAKURA_BASS_SEQ
            : this.bgmBiome === 'cloudland'
              ? CLOUD_BASS_SEQ
              : this.bgmBiome === 'harbor'
                ? HARBOR_BASS_SEQ
                : BASS_SEQ

        const idx = this.stepIndex % melSeq.length
        const melodyNote = melSeq[idx]
        const bassNote = bassSeq[idx]
        const arpNote = ARP_SEQ[idx % ARP_SEQ.length]

        const leadWave: OscillatorType =
          this.bgmBiome === 'sakura' || this.bgmBiome === 'cloudland' ? 'sine' : 'triangle'

        if (melodyNote && NOTE_FREQ[melodyNote]) {
          const f = NOTE_FREQ[melodyNote]! * pitchMult
          this.scheduleBgmTone(f, this.nextStepTime, stepDuration * 2.1, leadWave, 0.16, 1850)
          this.scheduleBgmTone(f * 2, this.nextStepTime, stepDuration * 1.0, 'sine', 0.045, 2900)
        }
        if (bassNote && NOTE_FREQ[bassNote]) {
          const bf = NOTE_FREQ[bassNote]! * pitchMult
          this.scheduleBgmTone(bf, this.nextStepTime, stepDuration * 2.2, 'sine', 0.24, 540)
          // Climax Harmony Layer near Moon Portal or Level 8 Finale!
          if (this.bgmClimaxLayer) {
            this.scheduleBgmTone(bf * 1.5, this.nextStepTime + stepDuration * 0.5, stepDuration * 1.1, 'triangle', 0.11, 1400)
          }
        }
        if (arpNote && NOTE_FREQ[arpNote]) {
          const af = NOTE_FREQ[arpNote]! * pitchMult
          this.scheduleBgmTone(af, this.nextStepTime, stepDuration * 0.9, 'sine', this.bgmClimaxLayer ? 0.105 : 0.072, 2400)
        }
        // Subtle calm heartbeat pulse at 1 heart (soft low reminder without panic)
        if (this.bgmLowHealth && idx % 4 === 0) {
          this.scheduleBgmTone(110, this.nextStepTime, 0.11, 'sine', 0.14, 240)
        }

        this.nextStepTime += stepDuration
        this.stepIndex = (this.stepIndex + 1) % melSeq.length
      }
    }

    this.bgmTimer = window.setTimeout(() => this.scheduleLoop(), 50)
  }

  private scheduleBgmTone(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    cutoffHz: number
  ): void {
    if (!this.ctx || !this.bgmGain) return
    const osc = this.ctx.createOscillator()
    const filter = this.ctx.createBiquadFilter()
    const gain = this.ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freq, startTime)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(cutoffHz, startTime)

    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.bgmGain)

    osc.start(startTime)
    osc.stop(startTime + duration + 0.02)
  }

  // ============================================================================
  // RETRO 8-BIT SFX, POWER-UP SFX & SPECIES VOICES
  // ============================================================================

  public playJump(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(240, now)
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.11)
    gain.gain.setValueAtTime(0.16, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13)
    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + 0.14)
  }

  /**
   * Subtle procedural Web Audio API jump sound layer (~25% of sfxVolume) for the 4 Biome Reward cosmetics.
   * Respects mute and sfxVolume via `this.sfxGain`. Caller enforces Hat > Cape > Scarf anti-clutter priority.
   */
  public playBiomeCosmeticJumpLayer(layer: BiomeCosmeticJumpKind): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime

    if (layer === 'beret-starlight') {
      // Starlight Beret: two rapid high-pitched sine notes (1318 Hz, then 1760 Hz after 40ms, ~120ms decay)
      const freqs = [1318, 1760]
      freqs.forEach((freq, i) => {
        const start = now + i * 0.04
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, start)
        gain.gain.setValueAtTime(0.0005, start)
        gain.gain.linearRampToValueAtTime(0.052, start + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0005, start + 0.12)
        osc.connect(gain)
        gain.connect(this.sfxGain!)
        osc.start(start)
        osc.stop(start + 0.13)
      })
    } else if (layer === 'cape-sakura-petal') {
      // Sakura Petal Cape: ~150ms filtered noise burst through bandpass (~950 Hz, Q: 2.5)
      const dur = 0.15
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur))
      const buf = ctx.createBuffer(1, len, ctx.sampleRate)
      const ch = buf.getChannelData(0)
      for (let i = 0; i < len; i++) {
        ch[i] = Math.random() * 2 - 1
      }
      const src = ctx.createBufferSource()
      src.buffer = buf
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.setValueAtTime(950, now)
      bp.Q.setValueAtTime(2.5, now)
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0005, now)
      gain.gain.linearRampToValueAtTime(0.065, now + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.0005, now + dur)
      src.connect(bp)
      bp.connect(gain)
      gain.connect(this.sfxGain)
      src.start(now)
      src.stop(now + dur + 0.01)
    } else if (layer === 'wings-cloud-pastel') {
      // Cloud Wings Cape: low-mid triangle sweep (320 -> 520 Hz over 130ms) + subtle 450 Hz lowpass noise puff
      const osc = ctx.createOscillator()
      const og = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(320, now)
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.13)
      og.gain.setValueAtTime(0.0005, now)
      og.gain.linearRampToValueAtTime(0.055, now + 0.015)
      og.gain.exponentialRampToValueAtTime(0.0005, now + 0.13)
      osc.connect(og)
      og.connect(this.sfxGain)
      osc.start(now)
      osc.stop(now + 0.14)

      const dur = 0.11
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur))
      const buf = ctx.createBuffer(1, len, ctx.sampleRate)
      const ch = buf.getChannelData(0)
      for (let i = 0; i < len; i++) {
        ch[i] = Math.random() * 2 - 1
      }
      const src = ctx.createBufferSource()
      src.buffer = buf
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.setValueAtTime(450, now)
      const ng = ctx.createGain()
      ng.gain.setValueAtTime(0.0005, now)
      ng.gain.linearRampToValueAtTime(0.036, now + 0.02)
      ng.gain.exponentialRampToValueAtTime(0.0005, now + dur)
      src.connect(lp)
      lp.connect(ng)
      ng.connect(this.sfxGain)
      src.start(now)
      src.stop(now + dur + 0.01)
    } else if (layer === 'lantern-gold') {
      // Golden Lantern Scarf: soft harmonic sine bell (880 Hz fundamental + subtle 1320 Hz overtone, 140ms decay)
      const fund = ctx.createOscillator()
      const fg = ctx.createGain()
      fund.type = 'sine'
      fund.frequency.setValueAtTime(880, now)
      fg.gain.setValueAtTime(0.0005, now)
      fg.gain.linearRampToValueAtTime(0.052, now + 0.012)
      fg.gain.exponentialRampToValueAtTime(0.0005, now + 0.14)
      fund.connect(fg)
      fg.connect(this.sfxGain)
      fund.start(now)
      fund.stop(now + 0.15)

      const over = ctx.createOscillator()
      const og = ctx.createGain()
      over.type = 'sine'
      over.frequency.setValueAtTime(1320, now)
      og.gain.setValueAtTime(0.0005, now)
      og.gain.linearRampToValueAtTime(0.022, now + 0.012)
      og.gain.exponentialRampToValueAtTime(0.0005, now + 0.13)
      over.connect(og)
      og.connect(this.sfxGain)
      over.start(now)
      over.stop(now + 0.14)
    }
  }

  /** Shimmering ascending crystal chime for hidden Starlight Shards */
  public playShardCollect(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    const notes = [880, 1108.73, 1318.51, 1760]
    notes.forEach((freq, i) => {
      const start = now + i * 0.055
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = i % 2 === 0 ? 'triangle' : 'sine'
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.001, start)
      gain.gain.linearRampToValueAtTime(0.16, start + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28)
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(start)
      osc.stop(start + 0.3)
    })
  }

  /** Crisp retro camera shutter click for Photo Mode postcard snap */
  public playCameraShutter(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(980, now)
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.045)
    gain.gain.setValueAtTime(0.14, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055)
    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + 0.06)

    const chime = ctx.createOscillator()
    const cg = ctx.createGain()
    chime.type = 'sine'
    chime.frequency.setValueAtTime(1318.5, now + 0.05)
    cg.gain.setValueAtTime(0.1, now + 0.05)
    cg.gain.exponentialRampToValueAtTime(0.001, now + 0.19)
    chime.connect(cg)
    cg.connect(this.sfxGain)
    chime.start(now + 0.05)
    chime.stop(now + 0.2)
  }

  public playDoubleJump(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    ;[440, 660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      const t = now + i * 0.035
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.22, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09)
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(t)
      osc.stop(t + 0.1)
    })
  }

  public playDash(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    const duration = 0.16
    const bufSize = Math.floor(ctx.sampleRate * duration)
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufSize; i++) {
      const env = Math.sin((i / bufSize) * Math.PI)
      data[i] = (Math.random() * 2 - 1) * env
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.setValueAtTime(1.8, now)
    filter.frequency.setValueAtTime(1600, now)
    filter.frequency.exponentialRampToValueAtTime(420, now + duration)
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.3, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration)
    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.sfxGain)
    noise.start(now)

    const osc = ctx.createOscillator()
    const oscGain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(720, now)
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.12)
    oscGain.gain.setValueAtTime(0.15, now)
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13)
    osc.connect(oscGain)
    oscGain.connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + 0.14)
  }

  public playStar(combo = 1): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    // Rising pentatonic pitch per consecutive star chain combo (1..8+)
    const scale = [1, 1.122, 1.26, 1.498, 1.682, 2.0, 2.245, 2.52]
    const mult = scale[Math.min(scale.length - 1, Math.max(0, combo - 1))]!
    ;[
      { f: 784 * mult, t: 0, d: 0.07 },
      { f: 1175 * mult, t: 0.052, d: 0.13 }
    ].forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = combo >= 3 ? 'triangle' : 'square'
      osc.frequency.setValueAtTime(Math.min(3400, f), now + t)
      gain.gain.setValueAtTime(combo >= 3 ? 0.18 : 0.14, now + t)
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d)
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(now + t)
      osc.stop(now + t + d + 0.01)
    })
  }

  public playBigStar(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    ;[587.33, 783.99, 987.77, 1174.66, 1567.98].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      const t = now + i * 0.045
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.22, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24)
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(t)
      osc.stop(t + 0.26)
    })
  }

  public playSecretReveal(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    // Soft leafy/dusty rustle paired with warm magical discovery chime
    if (this.pinkNoiseBuffer) {
      const src = ctx.createBufferSource()
      src.buffer = this.pinkNoiseBuffer
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(1400, now)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.14, now)
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
      src.connect(filter)
      filter.connect(g)
      g.connect(this.sfxGain)
      src.start(now)
      src.stop(now + 0.2)
    }
    ;[523.25, 659.25, 783.99, 987.77, 1318.51].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      const t = now + i * 0.055
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.2, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34)
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(t)
      osc.stop(t + 0.36)
    })
  }

  // Soft surface-specific footsteps (brick tile, wood/sakura branch, fluffy cloud, harbor plank)
  public playFootstep(surface: PlatformStyle): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const jitter = 0.94 + Math.random() * 0.12
    if (surface === 'cloud') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(240 * jitter, now)
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.045)
      gain.gain.setValueAtTime(0.045, now)
    } else if (surface === 'harbor') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(165 * jitter, now)
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.05)
      gain.gain.setValueAtTime(0.07, now)
    } else if (surface === 'wood' || surface === 'sakura') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(235 * jitter, now)
      osc.frequency.exponentialRampToValueAtTime(135, now + 0.04)
      gain.gain.setValueAtTime(0.06, now)
    } else {
      // Rooftop clay brick tap
      osc.type = 'square'
      osc.frequency.setValueAtTime(340 * jitter, now)
      osc.frequency.exponentialRampToValueAtTime(185, now + 0.032)
      gain.gain.setValueAtTime(0.038, now)
    }
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055)
    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + 0.06)
  }

  public playLand(surface: PlatformStyle): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = surface === 'cloud' ? 'sine' : 'triangle'
    const base = surface === 'cloud' ? 190 : surface === 'harbor' ? 120 : surface === 'brick' ? 210 : 160
    osc.frequency.setValueAtTime(base, now)
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.075)
    gain.gain.setValueAtTime(surface === 'cloud' ? 0.06 : 0.095, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085)
    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + 0.09)
  }

  public playSteamHiss(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted || !this.pinkNoiseBuffer) return
    const now = ctx.currentTime
    const src = ctx.createBufferSource()
    src.buffer = this.pinkNoiseBuffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(1900, now)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.09, now)
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.24)
    src.connect(filter)
    filter.connect(g)
    g.connect(this.sfxGain)
    src.start(now)
    src.stop(now + 0.26)
  }

  public playMiniZap(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(1120, now)
    osc.frequency.setValueAtTime(640, now + 0.03)
    osc.frequency.setValueAtTime(1420, now + 0.06)
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.14)
    g.gain.setValueAtTime(0.09, now)
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
    osc.connect(g)
    g.connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + 0.16)
  }

  public playCrowFlap(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted || !this.brownNoiseBuffer) return
    const now = ctx.currentTime
    const src = ctx.createBufferSource()
    src.buffer = this.brownNoiseBuffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(420, now)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.001, now)
    g.gain.linearRampToValueAtTime(0.11, now + 0.04)
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
    src.connect(filter)
    filter.connect(g)
    g.connect(this.sfxGain)
    src.start(now)
    src.stop(now + 0.16)
  }

  public playStarRingStart(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    ;[880, 1174.66, 1567.98].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      const t = now + i * 0.04
      osc.frequency.setValueAtTime(freq, t)
      g.gain.setValueAtTime(0.22, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
      osc.connect(g)
      g.connect(this.sfxGain!)
      osc.start(t)
      osc.stop(t + 0.38)
    })
  }

  public playStarRingComplete(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    ;[523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'triangle'
      const t = now + i * 0.05
      osc.frequency.setValueAtTime(freq, t)
      g.gain.setValueAtTime(0.24, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.32)
      osc.connect(g)
      g.connect(this.sfxGain!)
      osc.start(t)
      osc.stop(t + 0.34)
    })
  }

  public playWireBounce(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(190, now)
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.14)
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.21)
    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23)
    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + 0.24)
  }

  public playFish(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      const t = now + i * 0.055
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.15, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(t)
      osc.stop(t + 0.15)
    })
  }

  // Power-Up specific 8-bit SFX
  public playMilk(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    ;[440, 554.37, 659.25, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      const t = now + i * 0.06
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.24, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(t)
      osc.stop(t + 0.24)
    })
  }

  public playFeather(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    ;[587.33, 783.99, 987.77, 1318.51].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      const t = now + i * 0.05
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.2, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26)
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(t)
      osc.stop(t + 0.28)
    })
  }

  public playBell(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    ;[1046.5, 1318.51, 1567.98].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      const t = now + i * 0.045
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.22, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(t)
      osc.stop(t + 0.48)
    })
  }

  public playBubblePickup(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(340, now)
    osc.frequency.exponentialRampToValueAtTime(860, now + 0.18)
    gain.gain.setValueAtTime(0.24, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + 0.24)
  }

  public playBubblePop(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(680, now)
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.12)
    gain.gain.setValueAtTime(0.28, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13)
    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + 0.14)
  }

  // Golden Mooncake growth power-up chime (warm rising retro fanfare)
  public playMooncake(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    ;[330, 440, 554.37, 659.25, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      const t = now + i * 0.048
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.24, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(t)
      osc.stop(t + 0.2)
    })
  }

  // Satisfying bonk + sparkle when giant Mooncake cat bashes a crow
  public playMooncakeBash(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    ;[523.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      const t = now + i * 0.035
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.16, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11)
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(t)
      osc.stop(t + 0.12)
    })
  }

  // Biome 1 Exclusive: Starlight Yarn Ball (playful bouncy triple arpeggio)
  public playYarn(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    ;[392, 523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      const t = now + i * 0.045
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.22, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(t)
      osc.stop(t + 0.16)
    })
  }

  // Biome 2 Exclusive: Sakura Mochi (delicate Japanese pentatonic bell chord)
  public playMochi(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    ;[659.25, 783.99, 1046.5, 1318.51].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      const t = now + i * 0.06
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.22, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34)
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(t)
      osc.stop(t + 0.36)
    })
  }

  // Biome 3 Exclusive: Rainbow Star Candy (sparkling rapid rainbow shimmer!)
  public playCandy(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    ;[523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      const t = now + i * 0.036
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.2, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(t)
      osc.stop(t + 0.16)
    })
  }

  // Biome 4 Exclusive: Moonlit Pearl (calm aquatic crystalline chime)
  public playPearl(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    ;[493.88, 739.99, 987.77, 1479.98].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      const t = now + i * 0.07
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.21, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(t)
      osc.stop(t + 0.42)
    })
  }

  // Species-specific cute 8-bit animal voices!
  public playSpeciesVoice(species: AnimalSpecies): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime

    if (species === 'cat') {
      // Soft rising-then-falling melodic "meow~"
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(520, now)
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.08)
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.24)
      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.22, now + 0.035)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26)
      osc.connect(gain)
      gain.connect(this.sfxGain)
      osc.start(now)
      osc.stop(now + 0.28)
    } else if (species === 'samoyed' || species === 'shiba') {
      // Cute short chiptune "woof-woof!"
      ;[0, 0.11].forEach((offset) => {
        const t = now + offset
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(340, t)
        osc.frequency.exponentialRampToValueAtTime(195, t + 0.075)
        gain.gain.setValueAtTime(0.14, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.085)
        osc.connect(gain)
        gain.connect(this.sfxGain!)
        osc.start(t)
        osc.stop(t + 0.095)
      })
    } else if (species === 'bunny') {
      // Gentle playful bunny hop-squeak
      ;[0, 0.085].forEach((offset, idx) => {
        const t = now + offset
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(idx === 0 ? 640 : 780, t)
        osc.frequency.exponentialRampToValueAtTime(idx === 0 ? 960 : 1140, t + 0.065)
        gain.gain.setValueAtTime(0.2, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
        osc.connect(gain)
        gain.connect(this.sfxGain!)
        osc.start(t)
        osc.stop(t + 0.09)
      })
    }
  }

  public playHurt(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(240, now)
    osc.frequency.linearRampToValueAtTime(75, now + 0.22)
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24)
    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + 0.25)
  }

  public playLevelClear(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    ;[
      { f: 523.25, t: 0, d: 0.1 },
      { f: 659.25, t: 0.1, d: 0.1 },
      { f: 783.99, t: 0.2, d: 0.1 },
      { f: 1046.5, t: 0.32, d: 0.35 }
    ].forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(f, now + t)
      gain.gain.setValueAtTime(0.24, now + t)
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d)
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(now + t)
      osc.stop(now + t + d + 0.02)
    })
  }

  public playGameOver(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    ;[
      { f: 392.0, t: 0, d: 0.16 },
      { f: 349.23, t: 0.17, d: 0.16 },
      { f: 329.63, t: 0.34, d: 0.16 },
      { f: 261.63, t: 0.52, d: 0.4 }
    ].forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(f, now + t)
      gain.gain.setValueAtTime(0.24, now + t)
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d)
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(now + t)
      osc.stop(now + t + d + 0.02)
    })
  }

  public playUiClick(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(660, now)
    osc.frequency.setValueAtTime(880, now + 0.03)
    gain.gain.setValueAtTime(0.14, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07)
    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + 0.08)
  }

  public playBounce(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.16)
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.22)
    gain.gain.setValueAtTime(0.26, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24)
    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + 0.25)
  }

  public playCheckpoint(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      const t = now + i * 0.065
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.22, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24)
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(t)
      osc.stop(t + 0.25)
    })
  }

  public playUnlock(): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain || this.muted) return
    const now = ctx.currentTime
    ;[587.33, 739.99, 880.0, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      const t = now + i * 0.06
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.24, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
      osc.connect(gain)
      gain.connect(this.sfxGain!)
      osc.start(t)
      osc.stop(t + 0.24)
    })
  }
}
