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
  const headAccs = (progress.ownedHeadAccs ?? []).filter((id) => id !== 'none').length
  const faceAccs = (progress.ownedFaceAccs ?? []).filter((id) => id !== 'none').length
  return scarves + hats + capes + headAccs + faceAccs
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

export function countThreeStarMainLevels(progress: SaveProgress): number {
  let count = 0
  for (let lvlId = 1; lvlId <= 12; lvlId++) {
    if ((progress.levelRecords[lvlId]?.rating ?? 0) >= 3) count += 1
  }
  return count
}

const MAIN_BIOME_IDS: BiomeId[] = ['rooftops', 'sakura', 'cloudland', 'harbor', 'cavern', 'observatory']

export function countVisitedMainBiomes(progress: SaveProgress): number {
  return MAIN_BIOME_IDS.filter((b) => progress.visitedBiomes.includes(b)).length
}

export function getStampProgress(id: AchievementId, progress: SaveProgress): StampProgressInfo {
  switch (id) {
    case 'first-step': {
      const done = (progress.levelRecords[1]?.rating ?? 0) >= 1 ? 1 : 0
      return { current: done, target: 1, label: done ? 'Selesai!' : '0/1 Level 1' }
    }
    case 'rooftop-sprinter': {
      const best = progress.bestTimes[1]
      const done = typeof best === 'number' && best > 0 && best < 75000
      return {
        current: done ? 1 : 0,
        target: 1,
        label: done ? `Rekor ${(best! / 1000).toFixed(1)}s!` : best ? `Terbaik ${(best / 1000).toFixed(1)}s (<75s)` : 'Target < 75.0s'
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
      const count = Math.min(8, countRankSLevels(progress))
      return { current: count, target: 8, label: `${count}/8 Rank S` }
    }
    case 'eclipse-conqueror': {
      const done = (progress.levelRecords[13]?.rating ?? 0) >= 1 ? 1 : 0
      return { current: done, target: 1, label: done ? 'Umbra Owl Tumbang!' : '0/1 Level 13' }
    }
    case 'starlight-legend': {
      const done = (progress.levelRecords[14]?.rating ?? 0) >= 1 ? 1 : 0
      return { current: done, target: 1, label: done ? 'Chronos Tumbang!' : '0/1 Level 14' }
    }
    case 'sakura-wanderer': {
      const done = (progress.levelRecords[4]?.rating ?? 0) >= 1 ? 1 : 0
      return { current: done, target: 1, label: done ? 'Tamat!' : '0/1 Level 4' }
    }
    case 'cloud-dancer': {
      const done = (progress.levelRecords[6]?.rating ?? 0) >= 1 ? 1 : 0
      return { current: done, target: 1, label: done ? 'Tamat!' : '0/1 Level 6' }
    }
    case 'harbor-keeper': {
      const done = (progress.levelRecords[8]?.rating ?? 0) >= 1 ? 1 : 0
      return { current: done, target: 1, label: done ? 'Tamat!' : '0/1 Level 8' }
    }
    case 'cavern-delver': {
      const done = (progress.levelRecords[10]?.rating ?? 0) >= 1 ? 1 : 0
      return { current: done, target: 1, label: done ? 'Tamat!' : '0/1 Level 10' }
    }
    case 'clockwork-master': {
      const done = (progress.levelRecords[12]?.rating ?? 0) >= 1 ? 1 : 0
      return { current: done, target: 1, label: done ? 'Tamat!' : '0/1 Level 12' }
    }
    case 'world-explorer': {
      const n = countVisitedMainBiomes(progress)
      return { current: n, target: 6, label: `${n}/6 Dunia` }
    }
    case 'shard-hunter-12': {
      const total = Math.min(12, countTotalCollectedShards(progress))
      return { current: total, target: 12, label: `${total}/12 Shard` }
    }
    case 'shard-master-36': {
      const total = Math.min(36, countTotalCollectedShards(progress))
      return { current: total, target: 36, label: `${total}/36 Shard` }
    }
    case 'perfect-stars': {
      const n = Math.min(1, countThreeStarMainLevels(progress))
      return { current: n, target: 1, label: n ? 'Tercapai!' : '0/1 Level 3⭐' }
    }
    case 'star-virtuoso': {
      const n = Math.min(6, countThreeStarMainLevels(progress))
      return { current: n, target: 6, label: `${n}/6 Level 3⭐` }
    }
    case 'celestial-perfection': {
      const n = Math.min(12, countThreeStarMainLevels(progress))
      return { current: n, target: 12, label: `${n}/12 Level 3⭐` }
    }
    case 'high-scorer': {
      const s = Math.min(5000, progress.highScore)
      return { current: s, target: 5000, label: `${s}/5000 Poin` }
    }
    case 'dash-novice': {
      const d = Math.min(50, progress.totalDashes)
      return { current: d, target: 50, label: `${d}/50 Dash` }
    }
    case 'dash-master': {
      const d = Math.min(200, progress.totalDashes)
      return { current: d, target: 200, label: `${d}/200 Dash` }
    }
    case 'peaceful-sage': {
      const c = Math.min(5, progress.pacifistClears)
      return { current: c, target: 5, label: `${c}/5 Level Damai` }
    }
    case 'rank-s-first': {
      const n = Math.min(1, countRankSLevels(progress))
      return { current: n, target: 1, label: n ? 'Tercapai!' : '0/1 Rank S' }
    }
    case 'grand-speedrunner': {
      const n = Math.min(12, countRankSLevels(progress))
      return { current: n, target: 12, label: `${n}/12 Rank S` }
    }
    case 'fish-collector': {
      const f = Math.min(50, progress.totalFishEarned)
      return { current: f, target: 50, label: `${f}/50 Ikan` }
    }
    case 'fish-tycoon': {
      const f = Math.min(150, progress.totalFishEarned)
      return { current: f, target: 150, label: `${f}/150 Ikan` }
    }
    case 'daily-helper': {
      const m = Math.min(3, progress.totalDailyMissionsCompleted ?? 0)
      return { current: m, target: 3, label: `${m}/3 Misi Harian` }
    }
    case 'daily-devotee': {
      const m = Math.min(12, progress.totalDailyMissionsCompleted ?? 0)
      return { current: m, target: 12, label: `${m}/12 Misi Harian` }
    }
    case 'wardrobe-curator': {
      const owned = Math.min(15, countOwnedCosmeticItems(progress))
      return { current: owned, target: 15, label: `${owned}/15 Aksesoris` }
    }
    case 'all-friends': {
      const totalChars = CHARACTERS.length
      const unlocked = Math.min(totalChars, progress.unlockedCharacters.length)
      return { current: unlocked, target: totalChars, label: `${unlocked}/${totalChars} Hewan` }
    }
    default:
      return { current: 0, target: 1, label: '0/1' }
  }
}

/**
 * Evaluates all Stamp Book milestones against live progress.
 * Returns only newly unlocked AchievementDefs (never duplicates).
 */
export function evaluateStampAchievements(progress: SaveProgress): AchievementDef[] {
  const newlyUnlocked: AchievementDef[] = []
  const has = (id: AchievementId) => progress.unlockedAchievements.includes(id)
  const totalShards = countTotalCollectedShards(progress)
  const totalSRanks = countRankSLevels(progress)
  const threeStarCount = countThreeStarMainLevels(progress)
  const ownedCosmetics = countOwnedCosmeticItems(progress)
  const dailyDone = progress.totalDailyMissionsCompleted ?? 0

  const checks: Record<AchievementId, boolean> = {
    'first-step': (progress.levelRecords[1]?.rating ?? 0) >= 1,
    'rooftop-sprinter': typeof progress.bestTimes[1] === 'number' && progress.bestTimes[1]! > 0 && progress.bestTimes[1]! < 75000,
    'biome-explorer': hasAnyFullShardLevel(progress),
    'starlight-collector': totalShards >= 24,
    'fashionista-stray': ownedCosmetics >= 5,
    'full-squad': countUnlockedSpecies(progress) >= 4,
    'pacifist-run': progress.pacifistClears >= 1,
    'nine-lives': progress.totalFalls >= 9,
    'swift-paws': countRankAOrSLevels(progress) >= 8,
    'starlight-speedster': totalSRanks >= 4,
    'lightning-stray': totalSRanks >= 8,
    'eclipse-conqueror': (progress.levelRecords[13]?.rating ?? 0) >= 1,
    'starlight-legend': (progress.levelRecords[14]?.rating ?? 0) >= 1,
    'sakura-wanderer': (progress.levelRecords[4]?.rating ?? 0) >= 1,
    'cloud-dancer': (progress.levelRecords[6]?.rating ?? 0) >= 1,
    'harbor-keeper': (progress.levelRecords[8]?.rating ?? 0) >= 1,
    'cavern-delver': (progress.levelRecords[10]?.rating ?? 0) >= 1,
    'clockwork-master': (progress.levelRecords[12]?.rating ?? 0) >= 1,
    'world-explorer': countVisitedMainBiomes(progress) >= 6,
    'shard-hunter-12': totalShards >= 12,
    'shard-master-36': totalShards >= 36,
    'perfect-stars': threeStarCount >= 1,
    'star-virtuoso': threeStarCount >= 6,
    'celestial-perfection': threeStarCount >= 12,
    'high-scorer': progress.highScore >= 5000,
    'dash-novice': progress.totalDashes >= 50,
    'dash-master': progress.totalDashes >= 200,
    'peaceful-sage': progress.pacifistClears >= 5,
    'rank-s-first': totalSRanks >= 1,
    'grand-speedrunner': totalSRanks >= 12,
    'fish-collector': progress.totalFishEarned >= 50,
    'fish-tycoon': progress.totalFishEarned >= 150,
    'daily-helper': dailyDone >= 3,
    'daily-devotee': dailyDone >= 12,
    'wardrobe-curator': ownedCosmetics >= 15,
    'all-friends': progress.unlockedCharacters.length >= CHARACTERS.length
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
