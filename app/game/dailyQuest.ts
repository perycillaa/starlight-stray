import { LEVEL_PAR_TIMES, calculateSpeedrunRank, rankOrder } from '~/utils/levelParTimes'
import type { DailyQuestDef, DailyQuestId, DailyQuestState, SpeedrunRank, TimeTrialMedal } from './types'

export const DAILY_QUESTS: DailyQuestDef[] = [
  {
    id: 'stars-sakura',
    title: 'Kumpulkan 15 Bintang di Hutan Sakura',
    icon: '🌸',
    target: 15,
    rewardFish: 2
  },
  {
    id: 'no-hit-clear',
    title: 'Selesaikan 1 Level tanpa terkena rintangan',
    icon: '🛡️',
    target: 1,
    rewardFish: 2
  },
  {
    id: 'dash-10',
    title: 'Gunakan Dash sebanyak 10 kali',
    icon: '⚡',
    target: 10,
    rewardFish: 2
  },
  {
    id: 'collect-fish-4',
    title: 'Kumpulkan 4 Ikan Emas di level mana saja',
    icon: '🐟',
    target: 4,
    rewardFish: 2
  },
  {
    id: 'stars-any-20',
    title: 'Kumpulkan 20 Bintang di dunia mana saja',
    icon: '⭐',
    target: 20,
    rewardFish: 2
  },
  {
    id: 'powerup-3',
    title: 'Ambil 3 item Power-Up selama petualangan',
    icon: '🥮',
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

export function pickDailyQuestForDate(dateKey: string): DailyQuestDef {
  let hash = 2166136261
  for (let i = 0; i < dateKey.length; i++) {
    hash ^= dateKey.charCodeAt(i)
    hash = Math.imul(hash, 16777619) >>> 0
  }
  return DAILY_QUESTS[hash % DAILY_QUESTS.length]!
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
