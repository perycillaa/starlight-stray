import { LEVEL_PAR_TIMES, calculateSpeedrunRank, rankOrder } from '~/utils/levelParTimes'
import type {
  DailyMissionSlot,
  DailyMissionsState,
  DailyQuestDef,
  DailyQuestId,
  DailyQuestState,
  SpeedrunRank,
  TimeTrialMedal
} from './types'

export const ALL_DAILY_BONUS_FISH = 5

export const DAILY_QUESTS: DailyQuestDef[] = [
  {
    id: 'stars-sakura',
    title: 'Kumpulkan 15 Bintang di Hutan Sakura',
    icon: '🌸',
    target: 15,
    rewardFish: 2
  },
  {
    id: 'stars-rooftops',
    title: 'Kumpulkan 15 Bintang di Atap Kota',
    icon: '🏙️',
    target: 15,
    rewardFish: 2
  },
  {
    id: 'stars-cloudland',
    title: 'Kumpulkan 15 Bintang di Negeri Awan',
    icon: '☁️',
    target: 15,
    rewardFish: 2
  },
  {
    id: 'stars-harbor',
    title: 'Kumpulkan 15 Bintang di Dermaga Lampion',
    icon: '⚓',
    target: 15,
    rewardFish: 2
  },
  {
    id: 'stars-cavern',
    title: 'Kumpulkan 15 Bintang di Gua Kristal',
    icon: '🍄',
    target: 15,
    rewardFish: 3
  },
  {
    id: 'stars-observatory',
    title: 'Kumpulkan 15 Bintang di Observatorium Jam',
    icon: '⚙️',
    target: 15,
    rewardFish: 3
  },
  {
    id: 'clear-2-levels',
    title: 'Selesaikan 2 Level mana saja',
    icon: '🏁',
    target: 2,
    rewardFish: 3
  },
  {
    id: 'no-hit-clear',
    title: 'Selesaikan 1 Level tanpa terkena rintangan',
    icon: '🛡️',
    target: 1,
    rewardFish: 3
  },
  {
    id: 'dash-10',
    title: 'Gunakan Dash sebanyak 10 kali',
    icon: '⚡',
    target: 10,
    rewardFish: 2
  },
  {
    id: 'dash-20',
    title: 'Gunakan Dash sebanyak 20 kali',
    icon: '💨',
    target: 20,
    rewardFish: 3
  },
  {
    id: 'collect-fish-4',
    title: 'Kumpulkan 4 Ikan Emas di level mana saja',
    icon: '🐟',
    target: 4,
    rewardFish: 3
  },
  {
    id: 'stars-any-20',
    title: 'Kumpulkan 20 Bintang di dunia mana saja',
    icon: '⭐',
    target: 20,
    rewardFish: 2
  },
  {
    id: 'stars-any-35',
    title: 'Kumpulkan 35 Bintang di dunia mana saja',
    icon: '🌠',
    target: 35,
    rewardFish: 3
  },
  {
    id: 'powerup-3',
    title: 'Ambil 3 item Power-Up selama petualangan',
    icon: '🥮',
    target: 3,
    rewardFish: 2
  },
  {
    id: 'collect-shard-1',
    title: 'Temukan 1 Starlight Shard tersembunyi',
    icon: '💎',
    target: 1,
    rewardFish: 3
  },
  {
    id: 'emote-3',
    title: 'Gunakan Emote karakter 3 kali saat bermain',
    icon: '♥',
    target: 3,
    rewardFish: 2
  }
]

export function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDateKeyToDayNumber(dateKey: string): number {
  const parts = dateKey.split('-').map((v) => Number(v))
  if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
    return Math.floor(Date.UTC(parts[0]!, parts[1]! - 1, parts[2]!) / 86400000)
  }
  return Math.floor(Date.now() / 86400000)
}

function nextPrng(state: number): number {
  // Mulberry32 step for crisp deterministic daily shuffling
  let t = (state + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0)
}

/**
 * Deterministically selects 3 distinct daily missions for the given local YYYY-MM-DD date.
 * Uses a 5-day disjoint block shuffle over all 16 quests so consecutive days NEVER repeat
 * the same quests or order — every daily reset feels genuinely fresh!
 */
export function pickThreeDailyQuestsForDate(
  dateKey: string
): [DailyQuestDef, DailyQuestDef, DailyQuestDef] {
  const dayNum = parseDateKeyToDayNumber(dateKey)
  const daysPerCycle = Math.floor(DAILY_QUESTS.length / 3) // 5 completely disjoint days per cycle (15/16 quests)
  const cycleIndex = Math.floor(dayNum / daysPerCycle)
  const dayInCycle = ((dayNum % daysPerCycle) + daysPerCycle) % daysPerCycle

  const shuffled = [...DAILY_QUESTS]
  let seed = Math.imul(cycleIndex ^ 0x9e3779b9, 2654435761) >>> 0
  for (let i = shuffled.length - 1; i > 0; i--) {
    seed = nextPrng(seed + i * 1013904223)
    const j = seed % (i + 1)
    const tmp = shuffled[i]!
    shuffled[i] = shuffled[j]!
    shuffled[j] = tmp
  }

  // Pick 3 disjoint missions for today's slot in the 5-day cycle, then shuffle today's 3-slot display order
  const start = dayInCycle * 3
  const slice: DailyQuestDef[] = [shuffled[start]!, shuffled[start + 1]!, shuffled[start + 2]!]
  seed = nextPrng(seed + dayNum * 1664525)
  if (seed % 2 === 1) {
    const t = slice[0]!
    slice[0] = slice[1]!
    slice[1] = t
  }
  seed = nextPrng(seed + 7919)
  if (seed % 3 === 1) {
    const t = slice[1]!
    slice[1] = slice[2]!
    slice[2] = t
  }
  return [slice[0]!, slice[1]!, slice[2]!]
}

export function pickDailyQuestForDate(dateKey: string): DailyQuestDef {
  return pickThreeDailyQuestsForDate(dateKey)[0]
}

export function createDailyMissionsForToday(dateKey = getLocalDateKey()): DailyMissionsState {
  const [q0, q1, q2] = pickThreeDailyQuestsForDate(dateKey)
  const makeSlot = (def: DailyQuestDef): DailyMissionSlot => ({
    questId: def.id,
    progress: 0,
    claimed: false
  })
  return {
    dateKey,
    missions: [makeSlot(q0), makeSlot(q1), makeSlot(q2)],
    bonusClaimed: false
  }
}

export function createDailyQuestForToday(dateKey = getLocalDateKey()): DailyQuestState {
  const def = pickDailyQuestForDate(dateKey)
  return {
    dateKey,
    questId: def.id,
    progress: 0,
    claimed: false
  }
}

export function getDailyQuestDef(id: DailyQuestId): DailyQuestDef {
  return DAILY_QUESTS.find((q) => q.id === id) ?? DAILY_QUESTS[0]!
}

// ============================================================================
// TIME TRIAL TARGET THRESHOLDS PER LEVEL (Gold / Silver / Bronze in milliseconds)
// ============================================================================

export interface TimeTrialTargets {
  goldMs: number
  silverMs: number
  bronzeMs: number
}

export const LEVEL_TIME_TRIAL_TARGETS: Record<number, TimeTrialTargets> = {
  1: { goldMs: LEVEL_PAR_TIMES[1]!.S, silverMs: LEVEL_PAR_TIMES[1]!.A, bronzeMs: LEVEL_PAR_TIMES[1]!.B },
  2: { goldMs: LEVEL_PAR_TIMES[2]!.S, silverMs: LEVEL_PAR_TIMES[2]!.A, bronzeMs: LEVEL_PAR_TIMES[2]!.B },
  3: { goldMs: LEVEL_PAR_TIMES[3]!.S, silverMs: LEVEL_PAR_TIMES[3]!.A, bronzeMs: LEVEL_PAR_TIMES[3]!.B },
  4: { goldMs: LEVEL_PAR_TIMES[4]!.S, silverMs: LEVEL_PAR_TIMES[4]!.A, bronzeMs: LEVEL_PAR_TIMES[4]!.B },
  5: { goldMs: LEVEL_PAR_TIMES[5]!.S, silverMs: LEVEL_PAR_TIMES[5]!.A, bronzeMs: LEVEL_PAR_TIMES[5]!.B },
  6: { goldMs: LEVEL_PAR_TIMES[6]!.S, silverMs: LEVEL_PAR_TIMES[6]!.A, bronzeMs: LEVEL_PAR_TIMES[6]!.B },
  7: { goldMs: LEVEL_PAR_TIMES[7]!.S, silverMs: LEVEL_PAR_TIMES[7]!.A, bronzeMs: LEVEL_PAR_TIMES[7]!.B },
  8: { goldMs: LEVEL_PAR_TIMES[8]!.S, silverMs: LEVEL_PAR_TIMES[8]!.A, bronzeMs: LEVEL_PAR_TIMES[8]!.B }
}

export function getTimeTrialTargets(levelId: number): TimeTrialTargets {
  return LEVEL_TIME_TRIAL_TARGETS[levelId] ?? LEVEL_TIME_TRIAL_TARGETS[1]!
}

export function evaluateTimeTrialMedal(levelId: number, elapsedMs: number): TimeTrialMedal {
  const targets = getTimeTrialTargets(levelId)
  if (elapsedMs <= targets.goldMs) return 'gold'
  if (elapsedMs <= targets.silverMs) return 'silver'
  if (elapsedMs <= targets.bronzeMs) return 'bronze'
  return 'none'
}

export function rankMedal(medal: TimeTrialMedal): number {
  if (medal === 'gold') return 3
  if (medal === 'silver') return 2
  if (medal === 'bronze') return 1
  return 0
}

export function formatTimeTrial(ms: number): string {
  const safe = Math.max(0, Math.floor(ms))
  const totalTenths = Math.floor(safe / 100)
  const tenths = totalTenths % 10
  const totalSec = Math.floor(totalTenths / 10)
  const secs = totalSec % 60
  const mins = Math.floor(totalSec / 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`
}

export function formatSpeedrunTime(ms: number): string {
  const safe = Math.max(0, Math.floor(ms))
  const centis = Math.floor((safe % 1000) / 10)
  const totalSec = Math.floor(safe / 1000)
  const secs = totalSec % 60
  const mins = Math.floor(totalSec / 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`
}

export function evaluateSpeedrunRank(levelId: number, elapsedMs: number): SpeedrunRank {
  return calculateSpeedrunRank(levelId, elapsedMs)
}

export function compareSpeedrunRank(rank: SpeedrunRank | undefined): number {
  return rankOrder(rank)
}
