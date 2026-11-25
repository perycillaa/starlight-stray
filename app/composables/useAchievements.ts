import { computed } from 'vue'
import { ACHIEVEMENTS } from '~/game/achievements'
import { CHARACTERS } from '~/game/characters'
import { LEVELS } from '~/game/levels'
import type { AchievementDef, AchievementId, BiomeId, SaveProgress } from '~/game/types'

export interface StampProgressInfo {
  current: number
  target: number
  label: string
}

export function countTotalCollectedShards(progress: SaveProgress): number {
  let total = 0
  for (const tuple of Object.values(progress.collectedShards)) {
    if (!Array.isArray(tuple)) continue
    if (tuple[0]) total += 1
    if (tuple[1]) total += 1
    if (tuple[2]) total += 1
  }
  return total
}

/** Counts collected Starlight Shards across BOTH levels of a biome (max 6 per biome) */
export function countBiomeCollectedShards(biome: BiomeId, progress: SaveProgress): number {
  let total = 0
  for (const lvl of LEVELS) {
    if (lvl.biome !== biome) continue
    const tuple = progress.collectedShards[lvl.id]
    if (!Array.isArray(tuple)) continue
    if (tuple[0]) total += 1
    if (tuple[1]) total += 1
    if (tuple[2]) total += 1
  }
  return total
}

export function hasAnyFullShardLevel(progress: SaveProgress): boolean {
  return Object.values(progress.collectedShards).some(
    (tuple) => Array.isArray(tuple) && tuple[0] && tuple[1] && tuple[2]
  )
}

export function countOwnedCosmeticItems(progress: SaveProgress): number {
  const scarves = progress.ownedScarves.length
  const hats = progress.ownedHats.filter((id) => id !== 'none').length
  const capes = progress.ownedCapes.filter((id) => id !== 'none').length
  return scarves + hats + capes
}

export function countUnlockedSpecies(progress: SaveProgress): number {
  const speciesSet = new Set<string>()
  for (const charId of progress.unlockedCharacters) {
    const def = CHARACTERS.find((c) => c.id === charId)
    if (def) speciesSet.add(def.species)
  }
  return speciesSet.size
}

export function countRankAOrSLevels(progress: SaveProgress): number {
  let count = 0
  for (let lvlId = 1; lvlId <= LEVELS.length; lvlId++) {
    const r = progress.levelRanks[lvlId]
    if (r === 'A' || r === 'S') count += 1
  }
  return count
}

export function countRankSLevels(progress: SaveProgress): number {
  let count = 0
  for (let lvlId = 1; lvlId <= LEVELS.length; lvlId++) {
    if (progress.levelRanks[lvlId] === 'S') count += 1
  }
  return count
}

export function getStampProgress(id: AchievementId, progress: SaveProgress): StampProgressInfo {
  switch (id) {
    case 'first-step': {
      const done = (progress.levelRecords[1]?.rating ?? 0) >= 1 ? 1 : 0
      return { current: done, target: 1, label: done ? 'Selesai!' : '0/1 Level 1' }
    }
    case 'rooftop-sprinter': {
      const best = progress.bestTimes[1]
      const done = typeof best === 'number' && best > 0 && best < 45000
      return {
        current: done ? 1 : 0,
        target: 1,
        label: done ? `Rekor ${(best! / 1000).toFixed(1)}s!` : best ? `Terbaik ${(best / 1000).toFixed(1)}s (<45s)` : 'Target < 45.0s'
      }
    }
    case 'biome-explorer': {
      const maxInAny = Math.max(
        0,
        ...Object.values(progress.collectedShards).map((t) =>
          Array.isArray(t) ? Number(Boolean(t[0])) + Number(Boolean(t[1])) + Number(Boolean(t[2])) : 0
        )
      )
      return { current: Math.min(3, maxInAny), target: 3, label: `${Math.min(3, maxInAny)}/3 Shard` }
    }
    case 'starlight-collector': {
      const total = countTotalCollectedShards(progress)
      return { current: Math.min(24, total), target: 24, label: `${Math.min(24, total)}/24 Shard` }
    }
    case 'fashionista-stray': {
      const owned = countOwnedCosmeticItems(progress)
      return { current: Math.min(5, owned), target: 5, label: `${Math.min(5, owned)}/5 Item` }
    }
    case 'full-squad': {
      const sp = countUnlockedSpecies(progress)
      return { current: Math.min(4, sp), target: 4, label: `${Math.min(4, sp)}/4 Spesies` }
    }
    case 'pacifist-run': {
      const clears = Math.min(1, progress.pacifistClears)
      return { current: clears, target: 1, label: clears ? 'Tercapai!' : '0/1 Level Damai' }
    }
    case 'nine-lives': {
      const falls = Math.min(9, progress.totalFalls)
      return { current: falls, target: 9, label: `${falls}/9 Jatuh` }
    }
    case 'swift-paws': {
      const count = countRankAOrSLevels(progress)
      return { current: count, target: 8, label: `${count}/8 Rank A/S` }
    }
    case 'starlight-speedster': {
      const count = Math.min(4, countRankSLevels(progress))
      return { current: count, target: 4, label: `${count}/4 Rank S` }
    }
    case 'lightning-stray': {
      const count = countRankSLevels(progress)
      return { current: count, target: 8, label: `${count}/8 Rank S` }
    }
    default:
      return { current: 0, target: 1, label: '0/1' }
  }
}

/**
 * Evaluates all 11 Stamp Book milestones against live progress.
 * Returns only newly unlocked AchievementDefs (never duplicates).
 */
export function evaluateStampAchievements(progress: SaveProgress): AchievementDef[] {
  const newlyUnlocked: AchievementDef[] = []
  const has = (id: AchievementId) => progress.unlockedAchievements.includes(id)

  const checks: Record<string, boolean> = {
    'first-step': (progress.levelRecords[1]?.rating ?? 0) >= 1,
    'rooftop-sprinter': typeof progress.bestTimes[1] === 'number' && progress.bestTimes[1]! > 0 && progress.bestTimes[1]! < 45000,
    'biome-explorer': hasAnyFullShardLevel(progress),
    'starlight-collector': countTotalCollectedShards(progress) >= 24,
    'fashionista-stray': countOwnedCosmeticItems(progress) >= 5,
    'full-squad': countUnlockedSpecies(progress) >= 4,
    'pacifist-run': progress.pacifistClears >= 1,
    'nine-lives': progress.totalFalls >= 9,
    'swift-paws': countRankAOrSLevels(progress) >= 8,
    'starlight-speedster': countRankSLevels(progress) >= 4,
    'lightning-stray': countRankSLevels(progress) >= 8
  }

  for (const def of ACHIEVEMENTS) {
    if (!has(def.id) && checks[def.id]) {
      newlyUnlocked.push(def)
    }
  }
  return newlyUnlocked
}

/**
 * Nuxt 4 Composable for Stamp Book state, progress lookups, and shard/rank totals.
 */
export function useAchievements() {
  const { saveState } = useGameSave()

  const stamps = computed(() =>
    ACHIEVEMENTS.map((def) => {
      const unlocked = saveState.value.unlockedAchievements.includes(def.id)
      const info = getStampProgress(def.id, saveState.value)
      return {
        ...def,
        unlocked,
        progress: info,
        pct: Math.min(100, Math.round((info.current / Math.max(1, info.target)) * 100))
      }
    })
  )

  const unlockedCount = computed(() => stamps.value.filter((s) => s.unlocked).length)
  const totalShards = computed(() => countTotalCollectedShards(saveState.value))
  const totalSRanks = computed(() => countRankSLevels(saveState.value))

  return {
    stamps,
    unlockedCount,
    totalCount: ACHIEVEMENTS.length,
    totalShards,
    totalSRanks,
    getStampProgress,
    countBiomeCollectedShards,
    evaluateStampAchievements
  }
}
