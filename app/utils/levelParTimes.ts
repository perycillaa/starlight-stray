import type { RankRewardTier, SpeedrunRank } from '~/game/types'

export interface LevelParTime {
  S: number
  A: number
  B: number
}

export interface ClaimedRankTierMap {
  B?: boolean
  A?: boolean
  S?: boolean
}

export interface RankRewardGrant {
  rank: RankRewardTier
  coins: number
}

/**
 * Target speedrun par times per level in milliseconds.
 * Clearing slower than B still completes the level as Rank C.
 */
export const LEVEL_PAR_TIMES: Record<number, LevelParTime> = {
  1: { S: 38000, A: 48000, B: 62000 },
  2: { S: 45000, A: 58000, B: 75000 },
  3: { S: 52000, A: 66000, B: 85000 },
  4: { S: 58000, A: 74000, B: 95000 },
  5: { S: 65000, A: 82000, B: 105000 },
  6: { S: 72000, A: 90000, B: 115000 },
  7: { S: 78000, A: 98000, B: 125000 },
  8: { S: 88000, A: 110000, B: 140000 }
}

/** One-time fish coin bonus per rank tier per level */
export const RANK_TIER_REWARDS: Record<RankRewardTier, number> = {
  B: 20,
  A: 30,
  S: 50
}

export function getLevelParTimes(levelId: number): LevelParTime {
  return LEVEL_PAR_TIMES[levelId] ?? LEVEL_PAR_TIMES[1]!
}

export function calculateSpeedrunRank(levelId: number, elapsedMs: number): SpeedrunRank {
  const par = getLevelParTimes(levelId)
  if (elapsedMs <= par.S) return 'S'
  if (elapsedMs <= par.A) return 'A'
  if (elapsedMs <= par.B) return 'B'
  return 'C'
}

export function rankOrder(rank: SpeedrunRank | undefined): number {
  if (rank === 'S') return 4
  if (rank === 'A') return 3
  if (rank === 'B') return 2
  if (rank === 'C') return 1
  return 0
}

/**
 * Smart Tier Roll-Up:
 * Awards all unclaimed one-time fish coin tiers up to the earned rank.
 * Example: achieving Rank S on first clear grants B (+20) + A (+30) + S (+50) = +100 fish coins.
 */
export function claimSpeedrunRankRewards(
  earnedRank: SpeedrunRank,
  existingClaimed?: ClaimedRankTierMap
): {
  nextClaimed: ClaimedRankTierMap
  grants: RankRewardGrant[]
  totalCoins: number
} {
  const nextClaimed: ClaimedRankTierMap = {
    ...(existingClaimed ?? {})
  }
  const grants: RankRewardGrant[] = []

  const eligibleTiers: RankRewardTier[] =
    earnedRank === 'S'
      ? ['B', 'A', 'S']
      : earnedRank === 'A'
        ? ['B', 'A']
        : earnedRank === 'B'
          ? ['B']
          : []

  let totalCoins = 0
  for (const tier of eligibleTiers) {
    if (!nextClaimed[tier]) {
      nextClaimed[tier] = true
      const coins = RANK_TIER_REWARDS[tier]
      grants.push({ rank: tier, coins })
      totalCoins += coins
    }
  }

  return { nextClaimed, grants, totalCoins }
}

export function formatParTimeMs(ms: number): string {
  const safe = Math.max(0, Math.floor(ms))
  const centis = Math.floor((safe % 1000) / 10)
  const totalSec = Math.floor(safe / 1000)
  const secs = totalSec % 60
  const mins = Math.floor(totalSec / 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`
}
