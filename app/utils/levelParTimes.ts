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
 * Target speedrun par times per level in milliseconds (calibrated for extended 1.5x stages + 2 endgame bosses).
 * Clearing slower than B still completes the level as Rank C.
 */
export const LEVEL_PAR_TIMES: Record<number, LevelParTime> = {
  1: { S: 65000, A: 85000, B: 110000 },
  2: { S: 70000, A: 92000, B: 118000 },
  3: { S: 75000, A: 98000, B: 126000 },
  4: { S: 80000, A: 104000, B: 134000 },
  5: { S: 84000, A: 108000, B: 140000 },
  6: { S: 88000, A: 114000, B: 146000 },
  7: { S: 92000, A: 118000, B: 150000 },
  8: { S: 98000, A: 125000, B: 158000 },
  9: { S: 102000, A: 128000, B: 162000 },
  10: { S: 106000, A: 132000, B: 166000 },
  11: { S: 110000, A: 136000, B: 170000 },
  12: { S: 115000, A: 140000, B: 175000 },
  13: { S: 95000, A: 125000, B: 160000 },
  14: { S: 110000, A: 145000, B: 185000 }
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
