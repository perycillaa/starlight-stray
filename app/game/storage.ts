import { ACHIEVEMENTS } from './achievements'
import { CAPES, CHARACTERS, FACE_ACCS, HATS, HEAD_ACCS, SCARF_COLORS } from './characters'
import {
  DAILY_QUESTS,
  createDailyMissionsForToday,
  createDailyQuestForToday,
  getLocalDateKey
} from './dailyQuest'
import { LEVELS } from './levels'
import type {
  AchievementId,
  BiomeId,
  CapeId,
  CharacterId,
  ClaimedRankRewards,
  DailyMissionSlot,
  DailyMissionsState,
  DailyQuestId,
  DailyQuestState,
  EquippedCosmetics,
  FaceAccId,
  GameSavePayload,
  GraphicsStyle,
  HatId,
  HeadAccId,
  HomeBackdropMode,
  LevelRecord,
  SaveProgress,
  ScarfColorId,
  ShardTuple,
  SpeedrunRank,
  TimeTrialMedal,
  TimeTrialRecord,
  TouchControlsMode,
  TouchLayoutConfig,
  TouchZoneId,
  TouchZoneLayout
} from './types'

export const STORAGE_KEY = 'starlight_stray_save_v1'
const LEGACY_KEYS = [
  'starlight_stray_save_v4',
  'starlight_stray_save_v3',
  'starlight_stray_save_v2',
  'moonpaw_night_save_v1'
]

const CHARACTER_ALIAS_MAP: Record<string, CharacterId> = {
  cat: 'cat-mochi',
  rabbit: 'bunny-starlight',
  bunny: 'bunny-starlight',
  shiba: 'dog-shiba',
  'white-dog': 'dog-samoyed',
  samoyed: 'dog-samoyed'
}

function isBrowserStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function normalizeCharacterId(raw: unknown): CharacterId | null {
  if (typeof raw !== 'string') return null
  if (VALID_CHAR_IDS.has(raw)) return raw as CharacterId
  const mapped = CHARACTER_ALIAS_MAP[raw.toLowerCase()]
  return mapped && VALID_CHAR_IDS.has(mapped) ? mapped : null
}

const VALID_CHAR_IDS = new Set<string>(CHARACTERS.map((c) => c.id))
const VALID_SCARF_IDS = new Set<string>(SCARF_COLORS.map((s) => s.id))
const VALID_HAT_IDS = new Set<string>(HATS.map((h) => h.id))
const VALID_CAPE_IDS = new Set<string>(CAPES.map((c) => c.id))
const VALID_HEAD_ACC_IDS = new Set<string>(HEAD_ACCS.map((h) => h.id))
const VALID_FACE_ACC_IDS = new Set<string>(FACE_ACCS.map((f) => f.id))
const VALID_ACH_IDS = new Set<string>(ACHIEVEMENTS.map((a) => a.id))
const VALID_BIOMES = new Set<string>([
  'rooftops',
  'sakura',
  'cloudland',
  'harbor',
  'cavern',
  'observatory',
  'eclipse',
  'citadel'
])
const VALID_MAIN_BIOMES = new Set<string>([
  'rooftops',
  'sakura',
  'cloudland',
  'harbor',
  'cavern',
  'observatory'
])
const VALID_DAILY_IDS = new Set<string>(DAILY_QUESTS.map((q) => q.id))
const VALID_MEDALS = new Set<string>(['none', 'bronze', 'silver', 'gold'])
const VALID_RANKS = new Set<string>(['S', 'A', 'B', 'C'])

export const MAX_LEVEL_COUNT = 14
export const MAIN_LEVEL_COUNT = 12

function clamp01(val: unknown, fallback: number): number {
  const num = Number(val)
  if (!Number.isFinite(num)) return fallback
  return Math.max(0, Math.min(1, num))
}

function clampRange(val: unknown, min: number, max: number, fallback: number): number {
  const num = Number(val)
  if (!Number.isFinite(num)) return fallback
  return Math.max(min, Math.min(max, num))
}

export function createDefaultTouchLayout(): TouchLayoutConfig {
  return {
    opacity: 0.65,
    joystickRadius: 56,
    joystickDeadzone: 12,
    zones: {
      joystick: { xPct: 19, yPct: 70, scale: 1.0 },
      jump: { xPct: 87, yPct: 81, scale: 1.0 },
      dash: { xPct: 70, yPct: 85, scale: 1.0 },
      pulse: { xPct: 73, yPct: 60, scale: 1.0 },
      aegis: { xPct: 88, yPct: 56, scale: 1.0 },
      nova: { xPct: 59, yPct: 68, scale: 1.0 },
      mend: { xPct: 88, yPct: 36, scale: 1.0 }
    }
  }
}

export function sanitizeTouchLayout(raw: unknown): TouchLayoutConfig {
  const def = createDefaultTouchLayout()
  if (!raw || typeof raw !== 'object') return def
  const obj = raw as Partial<TouchLayoutConfig>
  const rawZones = (obj.zones && typeof obj.zones === 'object' ? obj.zones : {}) as Partial<
    Record<TouchZoneId, Partial<TouchZoneLayout>>
  >
  const fixZone = (id: TouchZoneId): TouchZoneLayout => {
    const base = def.zones[id]
    const z = rawZones[id]
    return {
      xPct: clampRange(z?.xPct, 6, 94, base.xPct),
      yPct: clampRange(z?.yPct, 16, 92, base.yPct),
      scale: clampRange(z?.scale, 0.7, 1.5, base.scale)
    }
  }
  return {
    opacity: clamp01(obj.opacity, def.opacity),
    joystickRadius: Math.round(clampRange(obj.joystickRadius, 40, 85, def.joystickRadius)),
    joystickDeadzone: Math.round(clampRange(obj.joystickDeadzone, 8, 20, def.joystickDeadzone)),
    zones: {
      joystick: fixZone('joystick'),
      jump: fixZone('jump'),
      dash: fixZone('dash'),
      pulse: fixZone('pulse'),
      aegis: fixZone('aegis'),
      nova: fixZone('nova'),
      mend: fixZone('mend')
    }
  }
}

export function normalizeTouchControlsMode(raw: unknown): TouchControlsMode {
  if (raw === 'invisible' || raw === 'translucent' || raw === 'visible' || raw === 'off') {
    return raw
  }
  // Backward-compatible migration from legacy 'auto' / 'on' modes
  if (raw === 'on') return 'translucent'
  return 'invisible'
}

export function createDefaultSave(): SaveProgress {
  return {
    unlockedLevel: 1,
    lastPlayedLevel: 1,
    homeBackdropMode: 'auto',
    hasUnseenStamps: false,
    highScore: 0,
    fishBank: 0,
    totalFishEarned: 0,
    totalDashes: 0,
    visitedBiomes: ['rooftops'],
    selectedCharacter: 'cat-mochi',
    selectedScarf: 'pink',
    selectedHat: 'none',
    selectedCape: 'none',
    selectedHeadAcc: 'none',
    selectedFaceAcc: 'none',
    unlockedCharacters: ['cat-mochi'],
    ownedScarves: ['pink'],
    ownedHats: ['none'],
    ownedCapes: ['none'],
    ownedHeadAccs: ['none'],
    ownedFaceAccs: ['none'],
    unlockedAchievements: [],
    claimedAchievements: [],
    bestLevelScores: {},
    levelRecords: {},
    collectedShards: {},
    bestTimes: {},
    levelRanks: {},
    claimedRankRewards: {},
    totalFalls: 0,
    pacifistClears: 0,
    timeTrials: {},
    dailyQuest: createDailyQuestForToday(),
    dailyMissions: createDailyMissionsForToday(),
    totalDailyMissionsCompleted: 0,
    muted: false,
    reduceMotion: true,
    showSpeedrunTimer: false,
    graphicsStyle: 'modern',
    touchControlsMode: 'invisible',
    touchLayout: createDefaultTouchLayout(),
    audio: {
      bgmVolume: 0.65,
      ambienceVolume: 0.65,
      sfxVolume: 0.8
    }
  }
}

export function toCanonicalSavePayload(progress: SaveProgress): GameSavePayload {
  const sanitized = sanitizeProgress(progress)
  const unlockedLevels: number[] = []
  for (let i = 1; i <= sanitized.unlockedLevel; i++) {
    unlockedLevels.push(i)
  }

  const ownedCosmetics: string[] = [
    ...sanitized.ownedScarves.map((id) => `scarf:${id}`),
    ...sanitized.ownedHats.map((id) => `hat:${id}`),
    ...sanitized.ownedCapes.map((id) => `cape:${id}`),
    ...sanitized.ownedHeadAccs.map((id) => `head_acc:${id}`),
    ...sanitized.ownedFaceAccs.map((id) => `face:${id}`)
  ]

  const equippedCosmetics: EquippedCosmetics = {
    scarf: sanitized.selectedScarf,
    hat: sanitized.selectedHat,
    cape: sanitized.selectedCape,
    head_acc: sanitized.selectedHeadAcc,
    face: sanitized.selectedFaceAcc
  }

  return {
    version: 1,
    savedAt: Date.now(),
    ...sanitized,
    fishCoins: sanitized.fishBank,
    unlockedLevels,
    levelHighScores: { ...sanitized.bestLevelScores },
    ownedCosmetics,
    equippedCosmetics,
    settings: {
      classicVisuals: sanitized.graphicsStyle === 'classic',
      reduceMotion: sanitized.reduceMotion,
      showSpeedrunTimer: sanitized.showSpeedrunTimer,
      muted: sanitized.muted,
      bgmVolume: sanitized.audio.bgmVolume,
      ambienceVolume: sanitized.audio.ambienceVolume,
      sfxVolume: sanitized.audio.sfxVolume,
      touchControlsMode: sanitized.touchControlsMode,
      touchLayout: sanitizeTouchLayout(sanitized.touchLayout)
    }
  }
}

export const defaultSaveData: GameSavePayload = toCanonicalSavePayload(createDefaultSave())

export function sanitizeProgress(rawObj: unknown): SaveProgress {
  const def = createDefaultSave()
  if (!rawObj || typeof rawObj !== 'object') return def
  const parsed = rawObj as Partial<GameSavePayload>

  const unlockedChars: CharacterId[] = ['cat-mochi']
  if (Array.isArray(parsed.unlockedCharacters)) {
    for (const rawId of parsed.unlockedCharacters) {
      const id = normalizeCharacterId(rawId)
      if (id && !unlockedChars.includes(id)) unlockedChars.push(id)
    }
  }

  const ownedScarves: ScarfColorId[] = ['pink']
  const ownedHats: HatId[] = ['none']
  const ownedCapes: CapeId[] = ['none']
  const ownedHeadAccs: HeadAccId[] = ['none']
  const ownedFaceAccs: FaceAccId[] = ['none']

  if (Array.isArray(parsed.ownedScarves)) {
    for (const id of parsed.ownedScarves) {
      if (VALID_SCARF_IDS.has(id) && !ownedScarves.includes(id)) ownedScarves.push(id)
    }
  }
  if (Array.isArray(parsed.ownedHats)) {
    for (const id of parsed.ownedHats) {
      if (VALID_HAT_IDS.has(id) && !ownedHats.includes(id)) ownedHats.push(id)
    }
  }
  if (Array.isArray(parsed.ownedCapes)) {
    for (const rawId of parsed.ownedCapes) {
      const idStr = String(rawId)
      const mapped =
        idStr === 'biome-sakura-wings'
          ? 'cape-sakura-petal'
          : idStr === 'biome-cloudland-cloak'
            ? 'wings-cloud-pastel'
            : idStr
      if (VALID_CAPE_IDS.has(mapped) && !ownedCapes.includes(mapped as CapeId)) {
        ownedCapes.push(mapped as CapeId)
      }
      if (idStr === 'biome-rooftops-cloak' && !ownedHats.includes('beret-starlight')) {
        ownedHats.push('beret-starlight')
      }
      if (idStr === 'biome-harbor-royal' && !ownedScarves.includes('lantern-gold')) {
        ownedScarves.push('lantern-gold')
      }
    }
  }
  if (Array.isArray(parsed.ownedHeadAccs)) {
    for (const id of parsed.ownedHeadAccs) {
      if (VALID_HEAD_ACC_IDS.has(id) && !ownedHeadAccs.includes(id)) ownedHeadAccs.push(id)
    }
  }
  if (Array.isArray(parsed.ownedFaceAccs)) {
    for (const id of parsed.ownedFaceAccs) {
      if (VALID_FACE_ACC_IDS.has(id) && !ownedFaceAccs.includes(id)) ownedFaceAccs.push(id)
    }
  }
  // Also absorb canonical ownedCosmetics strings ('scarf:pink', 'hat:...', 'cape:...', 'head_acc:...', 'face:...')
  if (Array.isArray(parsed.ownedCosmetics)) {
    for (const entry of parsed.ownedCosmetics) {
      if (typeof entry !== 'string') continue
      const [slot, itemId] = entry.split(':')
      if (!itemId) continue
      if (slot === 'scarf' && VALID_SCARF_IDS.has(itemId) && !ownedScarves.includes(itemId as ScarfColorId)) {
        ownedScarves.push(itemId as ScarfColorId)
      } else if (slot === 'hat' && VALID_HAT_IDS.has(itemId) && !ownedHats.includes(itemId as HatId)) {
        ownedHats.push(itemId as HatId)
      } else if (slot === 'cape' && VALID_CAPE_IDS.has(itemId) && !ownedCapes.includes(itemId as CapeId)) {
        ownedCapes.push(itemId as CapeId)
      } else if (slot === 'head_acc' && VALID_HEAD_ACC_IDS.has(itemId) && !ownedHeadAccs.includes(itemId as HeadAccId)) {
        ownedHeadAccs.push(itemId as HeadAccId)
      } else if (slot === 'face' && VALID_FACE_ACC_IDS.has(itemId) && !ownedFaceAccs.includes(itemId as FaceAccId)) {
        ownedFaceAccs.push(itemId as FaceAccId)
      }
    }
  }

  const normalizedSelChar = normalizeCharacterId(parsed.selectedCharacter)
  const selectedCharacter: CharacterId =
    normalizedSelChar && unlockedChars.includes(normalizedSelChar) ? normalizedSelChar : 'cat-mochi'

  const rawSelScarf = parsed.selectedScarf ?? parsed.equippedCosmetics?.scarf
  const selectedScarf: ScarfColorId =
    rawSelScarf && VALID_SCARF_IDS.has(rawSelScarf) && ownedScarves.includes(rawSelScarf) ? rawSelScarf : 'pink'

  const rawSelHat = parsed.selectedHat ?? parsed.equippedCosmetics?.hat
  const selectedHat: HatId =
    rawSelHat && VALID_HAT_IDS.has(rawSelHat) && ownedHats.includes(rawSelHat) ? rawSelHat : 'none'

  const rawSelCape = parsed.selectedCape ?? parsed.equippedCosmetics?.cape
  const selectedCape: CapeId =
    rawSelCape && VALID_CAPE_IDS.has(rawSelCape) && ownedCapes.includes(rawSelCape) ? rawSelCape : 'none'

  const rawSelHeadAcc = parsed.selectedHeadAcc ?? parsed.equippedCosmetics?.head_acc
  const selectedHeadAcc: HeadAccId =
    rawSelHeadAcc && VALID_HEAD_ACC_IDS.has(rawSelHeadAcc) && ownedHeadAccs.includes(rawSelHeadAcc)
      ? rawSelHeadAcc
      : 'none'

  const rawSelFaceAcc = parsed.selectedFaceAcc ?? parsed.equippedCosmetics?.face
  const selectedFaceAcc: FaceAccId =
    rawSelFaceAcc && VALID_FACE_ACC_IDS.has(rawSelFaceAcc) && ownedFaceAccs.includes(rawSelFaceAcc)
      ? rawSelFaceAcc
      : 'none'

  const unlockedAchievements = Array.isArray(parsed.unlockedAchievements)
    ? Array.from(new Set(parsed.unlockedAchievements.filter((id): id is AchievementId => VALID_ACH_IDS.has(id))))
    : []

  // Backward-compatible migration: legacy saves without claimedAchievements already received auto-payouts
  const claimedAchievements = Array.isArray(parsed.claimedAchievements)
    ? Array.from(
        new Set(
          parsed.claimedAchievements.filter(
            (id): id is AchievementId => VALID_ACH_IDS.has(id) && unlockedAchievements.includes(id)
          )
        )
      )
    : [...unlockedAchievements]

  const visitedBiomes = Array.isArray(parsed.visitedBiomes)
    ? Array.from(new Set(parsed.visitedBiomes.filter((id): id is BiomeId => VALID_BIOMES.has(id))))
    : ['rooftops' as BiomeId]
  if (!visitedBiomes.includes('rooftops')) {
    visitedBiomes.unshift('rooftops')
  }

  const levelRecords: Record<number, LevelRecord> = {}
  if (parsed.levelRecords && typeof parsed.levelRecords === 'object') {
    for (const [rawKey, rawRec] of Object.entries(parsed.levelRecords)) {
      const lvlId = Number(rawKey)
      if (!Number.isInteger(lvlId) || lvlId < 1 || lvlId > MAX_LEVEL_COUNT) continue
      if (!rawRec || typeof rawRec !== 'object') continue
      const r = rawRec as Partial<LevelRecord>
      const ratingNum = Math.max(0, Math.min(3, Math.floor(Number(r.rating) || 0))) as 0 | 1 | 2 | 3
      levelRecords[lvlId] = {
        bestScore: Math.max(0, Math.floor(Number(r.bestScore) || 0)),
        bestStars: Math.max(0, Math.floor(Number(r.bestStars) || 0)),
        totalStars: Math.max(0, Math.floor(Number(r.totalStars) || 0)),
        bestFish: Math.max(0, Math.floor(Number(r.bestFish) || 0)),
        totalFish: Math.max(0, Math.floor(Number(r.totalFish) || 0)),
        rating: ratingNum,
        threeStarBonusClaimed: Boolean(r.threeStarBonusClaimed)
      }
    }
  }

  const bestLevelScores: Record<number, number> = {}
  const rawScoreMap = parsed.bestLevelScores ?? parsed.levelHighScores
  if (rawScoreMap && typeof rawScoreMap === 'object') {
    for (const [rawKey, rawVal] of Object.entries(rawScoreMap)) {
      const lvlId = Number(rawKey)
      if (!Number.isInteger(lvlId) || lvlId < 1 || lvlId > MAX_LEVEL_COUNT) continue
      bestLevelScores[lvlId] = Math.max(0, Math.floor(Number(rawVal) || 0))
    }
  }

  // Keep unlockedLevel and visitedBiomes synced cleanly with unlockedLevels array & completed levelRecords
  let derivedUnlock = Math.max(1, Math.min(MAX_LEVEL_COUNT, Math.floor(Number(parsed.unlockedLevel) || 1)))
  if (Array.isArray(parsed.unlockedLevels)) {
    for (const lvl of parsed.unlockedLevels) {
      const num = Math.floor(Number(lvl))
      if (Number.isInteger(num) && num >= 1 && num <= MAX_LEVEL_COUNT) {
        derivedUnlock = Math.max(derivedUnlock, num)
      }
    }
  }
  for (const [lvlKey, rec] of Object.entries(levelRecords)) {
    const lvlId = Number(lvlKey)
    if (rec.rating >= 1) {
      if (lvlId < MAIN_LEVEL_COUNT) {
        derivedUnlock = Math.max(derivedUnlock, Math.min(MAIN_LEVEL_COUNT, lvlId + 1))
      }
      const lvlDef = LEVELS.find((l) => l.id === lvlId)
      if (lvlDef && !visitedBiomes.includes(lvlDef.biome)) {
        visitedBiomes.push(lvlDef.biome)
      }
    }
    if ((bestLevelScores[lvlId] ?? 0) < rec.bestScore) {
      bestLevelScores[lvlId] = rec.bestScore
    }
  }
  // Cap normal sequential progression at MAIN_LEVEL_COUNT (12); Levels 13–14 unlock via Rank S >= 3!
  derivedUnlock = Math.min(MAIN_LEVEL_COUNT, derivedUnlock)

  const collectedShards: Record<number, ShardTuple> = {}
  if (parsed.collectedShards && typeof parsed.collectedShards === 'object') {
    for (const [rawKey, rawTuple] of Object.entries(parsed.collectedShards)) {
      const lvlId = Number(rawKey)
      if (!Number.isInteger(lvlId) || lvlId < 1 || lvlId > MAX_LEVEL_COUNT) continue
      if (Array.isArray(rawTuple)) {
        collectedShards[lvlId] = [Boolean(rawTuple[0]), Boolean(rawTuple[1]), Boolean(rawTuple[2])]
      }
    }
  }

  // Retroactively unlock 6/6 Biome Reward cosmetics on load if all 6 shards of a biome are already collected!
  const biomeShardCounts: Record<BiomeId, number> = {
    rooftops: 0,
    sakura: 0,
    cloudland: 0,
    harbor: 0,
    cavern: 0,
    observatory: 0,
    eclipse: 0,
    citadel: 0
  }
  for (const lvl of LEVELS) {
    const tup = collectedShards[lvl.id]
    if (!tup) continue
    biomeShardCounts[lvl.biome] += Number(tup[0]) + Number(tup[1]) + Number(tup[2])
  }
  if (biomeShardCounts.rooftops >= 6 && !ownedHats.includes('beret-starlight')) {
    ownedHats.push('beret-starlight')
  }
  if (biomeShardCounts.sakura >= 6 && !ownedCapes.includes('cape-sakura-petal')) {
    ownedCapes.push('cape-sakura-petal')
  }
  if (biomeShardCounts.cloudland >= 6 && !ownedCapes.includes('wings-cloud-pastel')) {
    ownedCapes.push('wings-cloud-pastel')
  }
  if (biomeShardCounts.harbor >= 6 && !ownedScarves.includes('lantern-gold')) {
    ownedScarves.push('lantern-gold')
  }
  if (biomeShardCounts.cavern >= 6 && !ownedCapes.includes('cape-crystal-glow')) {
    ownedCapes.push('cape-crystal-glow')
  }
  if (biomeShardCounts.observatory >= 6 && !ownedHats.includes('hat-astral-clockwork')) {
    ownedHats.push('hat-astral-clockwork')
  }
  // Retroactively ensure Boss Reward cosmetics stay unlocked if boss stages were cleared
  if ((levelRecords[13]?.rating ?? 0) >= 1 && !ownedHeadAccs.includes('halo-eclipse')) {
    ownedHeadAccs.push('halo-eclipse')
  }
  if ((levelRecords[14]?.rating ?? 0) >= 1 && !ownedCapes.includes('cape-nebula-sovereign')) {
    ownedCapes.push('cape-nebula-sovereign')
  }

  const bestTimes: Record<number, number> = {}
  if (parsed.bestTimes && typeof parsed.bestTimes === 'object') {
    for (const [rawKey, rawMs] of Object.entries(parsed.bestTimes)) {
      const lvlId = Number(rawKey)
      if (!Number.isInteger(lvlId) || lvlId < 1 || lvlId > MAX_LEVEL_COUNT) continue
      const ms = Math.floor(Number(rawMs) || 0)
      if (ms >= 1000) {
        bestTimes[lvlId] = ms
      }
    }
  }

  const levelRanks: Record<number, SpeedrunRank> = {}
  if (parsed.levelRanks && typeof parsed.levelRanks === 'object') {
    for (const [rawKey, rawRank] of Object.entries(parsed.levelRanks)) {
      const lvlId = Number(rawKey)
      if (!Number.isInteger(lvlId) || lvlId < 1 || lvlId > MAX_LEVEL_COUNT) continue
      if (typeof rawRank === 'string' && VALID_RANKS.has(rawRank)) {
        levelRanks[lvlId] = rawRank as SpeedrunRank
      }
    }
  }

  const claimedRankRewards: Record<number, ClaimedRankRewards> = {}
  if (parsed.claimedRankRewards && typeof parsed.claimedRankRewards === 'object') {
    for (const [rawKey, rawClaim] of Object.entries(parsed.claimedRankRewards)) {
      const lvlId = Number(rawKey)
      if (!Number.isInteger(lvlId) || lvlId < 1 || lvlId > MAX_LEVEL_COUNT) continue
      if (!rawClaim || typeof rawClaim !== 'object') continue
      const c = rawClaim as Partial<ClaimedRankRewards>
      claimedRankRewards[lvlId] = {
        ...(c.B ? { B: true } : {}),
        ...(c.A ? { A: true } : {}),
        ...(c.S ? { S: true } : {})
      }
    }
  }

  const timeTrials: Record<number, TimeTrialRecord> = {}
  if (parsed.timeTrials && typeof parsed.timeTrials === 'object') {
    for (const [rawKey, rawRec] of Object.entries(parsed.timeTrials)) {
      const lvlId = Number(rawKey)
      if (!Number.isInteger(lvlId) || lvlId < 1 || lvlId > MAX_LEVEL_COUNT) continue
      if (!rawRec || typeof rawRec !== 'object') continue
      const r = rawRec as Partial<TimeTrialRecord>
      const bestTimeMs = Math.max(1000, Math.floor(Number(r.bestTimeMs) || 0))
      const medal: TimeTrialMedal =
        typeof r.medal === 'string' && VALID_MEDALS.has(r.medal) ? (r.medal as TimeTrialMedal) : 'none'
      if (Number.isFinite(Number(r.bestTimeMs)) && Number(r.bestTimeMs) > 0) {
        timeTrials[lvlId] = { bestTimeMs, medal }
        if (!bestTimes[lvlId] || bestTimeMs < bestTimes[lvlId]!) {
          bestTimes[lvlId] = bestTimeMs
        }
      }
    }
  }

  const todayKey = getLocalDateKey()
  let dailyMissions: DailyMissionsState = createDailyMissionsForToday(todayKey)
  if (
    parsed.dailyMissions &&
    typeof parsed.dailyMissions === 'object' &&
    parsed.dailyMissions.dateKey === todayKey &&
    Array.isArray(parsed.dailyMissions.missions) &&
    parsed.dailyMissions.missions.length === 3
  ) {
    const rawSlots = parsed.dailyMissions.missions
    const validated: DailyMissionSlot[] = dailyMissions.missions.map((fallbackSlot, idx) => {
      const candidate = rawSlots[idx]
      if (candidate && typeof candidate === 'object' && VALID_DAILY_IDS.has(candidate.questId)) {
        return {
          questId: candidate.questId as DailyQuestId,
          progress: Math.max(0, Math.floor(Number(candidate.progress) || 0)),
          claimed: Boolean(candidate.claimed)
        }
      }
      return fallbackSlot
    })
    dailyMissions = {
      dateKey: todayKey,
      missions: [validated[0]!, validated[1]!, validated[2]!],
      bonusClaimed: Boolean(parsed.dailyMissions.bonusClaimed)
    }
  } else if (
    parsed.dailyQuest &&
    typeof parsed.dailyQuest === 'object' &&
    parsed.dailyQuest.dateKey === todayKey &&
    VALID_DAILY_IDS.has(parsed.dailyQuest.questId)
  ) {
    // Seamless upgrade from legacy 1-mission dailyQuest into today's 3-mission tracker
    const matchIdx = dailyMissions.missions.findIndex((m) => m.questId === parsed.dailyQuest!.questId)
    const targetSlot = matchIdx >= 0 ? dailyMissions.missions[matchIdx]! : dailyMissions.missions[0]!
    targetSlot.questId = parsed.dailyQuest.questId as DailyQuestId
    targetSlot.progress = Math.max(0, Math.floor(Number(parsed.dailyQuest.progress) || 0))
    targetSlot.claimed = Boolean(parsed.dailyQuest.claimed)
  }

  const dailyQuest: DailyQuestState = {
    dateKey: todayKey,
    questId: dailyMissions.missions[0].questId,
    progress: dailyMissions.missions[0].progress,
    claimed: dailyMissions.missions[0].claimed
  }

  const totalDailyMissionsCompleted = Math.max(
    0,
    Math.floor(Number(parsed.totalDailyMissionsCompleted) || 0)
  )

  const rawFish = parsed.fishBank ?? parsed.fishCoins ?? 0
  const fishBank = Math.max(0, Math.floor(Number(rawFish) || 0))

  const settingsObj = parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : undefined
  const graphicsStyle: GraphicsStyle =
    parsed.graphicsStyle === 'classic' || parsed.graphicsStyle === 'modern'
      ? parsed.graphicsStyle
      : typeof settingsObj?.classicVisuals === 'boolean'
        ? settingsObj.classicVisuals
          ? 'classic'
          : 'modern'
        : 'modern'

  const rawTouch = parsed.touchControlsMode ?? settingsObj?.touchControlsMode
  const touchControlsMode: TouchControlsMode = normalizeTouchControlsMode(rawTouch)
  const touchLayout: TouchLayoutConfig = sanitizeTouchLayout(
    parsed.touchLayout ?? settingsObj?.touchLayout
  )

  const muted =
    typeof parsed.muted === 'boolean'
      ? parsed.muted
      : typeof settingsObj?.muted === 'boolean'
        ? settingsObj.muted
        : def.muted

  const reduceMotion =
    typeof parsed.reduceMotion === 'boolean'
      ? parsed.reduceMotion
      : typeof settingsObj?.reduceMotion === 'boolean'
        ? settingsObj.reduceMotion
        : def.reduceMotion

  const showSpeedrunTimer =
    typeof parsed.showSpeedrunTimer === 'boolean'
      ? parsed.showSpeedrunTimer
      : typeof settingsObj?.showSpeedrunTimer === 'boolean'
        ? settingsObj.showSpeedrunTimer
        : def.showSpeedrunTimer

  const lastPlayedLevel = Math.max(
    1,
    Math.min(MAX_LEVEL_COUNT, Math.floor(Number(parsed.lastPlayedLevel) || 1))
  )

  const rawHomeMode = parsed.homeBackdropMode
  const homeBackdropMode: HomeBackdropMode =
    rawHomeMode === 'auto' || (typeof rawHomeMode === 'string' && VALID_MAIN_BIOMES.has(rawHomeMode))
      ? (rawHomeMode as HomeBackdropMode)
      : 'auto'

  return {
    unlockedLevel: derivedUnlock,
    lastPlayedLevel,
    homeBackdropMode,
    hasUnseenStamps: Boolean(parsed.hasUnseenStamps),
    highScore: Math.max(0, Math.floor(Number(parsed.highScore) || 0)),
    fishBank,
    totalFishEarned: Math.max(fishBank, Math.floor(Number(parsed.totalFishEarned) || 0)),
    totalDashes: Math.max(0, Math.floor(Number(parsed.totalDashes) || 0)),
    visitedBiomes,
    selectedCharacter,
    selectedScarf,
    selectedHat,
    selectedCape,
    selectedHeadAcc,
    selectedFaceAcc,
    unlockedCharacters: unlockedChars,
    ownedScarves,
    ownedHats,
    ownedCapes,
    ownedHeadAccs,
    ownedFaceAccs,
    unlockedAchievements,
    claimedAchievements,
    bestLevelScores,
    levelRecords,
    collectedShards,
    bestTimes,
    levelRanks,
    claimedRankRewards,
    totalFalls: Math.max(0, Math.floor(Number(parsed.totalFalls) || 0)),
    pacifistClears: Math.max(0, Math.floor(Number(parsed.pacifistClears) || 0)),
    timeTrials,
    dailyQuest,
    dailyMissions,
    totalDailyMissionsCompleted,
    muted,
    reduceMotion,
    showSpeedrunTimer,
    graphicsStyle,
    touchControlsMode,
    touchLayout,
    audio: {
      bgmVolume: clamp01(parsed.audio?.bgmVolume ?? settingsObj?.bgmVolume, def.audio.bgmVolume),
      ambienceVolume: clamp01(parsed.audio?.ambienceVolume ?? settingsObj?.ambienceVolume, def.audio.ambienceVolume),
      sfxVolume: clamp01(parsed.audio?.sfxVolume ?? settingsObj?.sfxVolume, def.audio.sfxVolume)
    }
  }
}

function tryParseSavedPayload(raw: string | null): SaveProgress | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object') return null
    // Support both flat SaveProgress objects and future versioned wrapper payloads
    const inner =
      parsed.data && typeof parsed.data === 'object'
        ? parsed.data
        : parsed.progress && typeof parsed.progress === 'object'
          ? parsed.progress
          : parsed
    return sanitizeProgress(inner)
  } catch {
    return null
  }
}

let memoryFallbackSave: SaveProgress | null = null

export function loadGameData(): SaveProgress {
  if (!isBrowserStorageAvailable()) {
    return memoryFallbackSave ? sanitizeProgress(memoryFallbackSave) : createDefaultSave()
  }
  try {
    const primary = tryParseSavedPayload(window.localStorage.getItem(STORAGE_KEY))
    if (primary) {
      memoryFallbackSave = primary
      return primary
    }

    // Seamless migration & corruption fallback from any previous storage key
    for (const key of LEGACY_KEYS) {
      const recovered = tryParseSavedPayload(window.localStorage.getItem(key))
      if (recovered) {
        memoryFallbackSave = recovered
        saveGameData(recovered)
        return recovered
      }
    }

    return memoryFallbackSave ? sanitizeProgress(memoryFallbackSave) : createDefaultSave()
  } catch {
    // Graceful fallback to in-memory save for Safari Private Browsing / storage restrictions
    return memoryFallbackSave ? sanitizeProgress(memoryFallbackSave) : createDefaultSave()
  }
}

export function saveGameData(progress: SaveProgress): boolean {
  const sanitized = sanitizeProgress(progress)
  memoryFallbackSave = sanitized
  if (!isBrowserStorageAvailable()) return false
  try {
    const payload = toCanonicalSavePayload(sanitized)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    return true
  } catch {
    // Safari Private Browsing / quota limit: state remains preserved in memoryFallbackSave
    return false
  }
}

export function clearStoredGameData(): void {
  memoryFallbackSave = null
  if (!isBrowserStorageAvailable()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    for (const key of LEGACY_KEYS) {
      window.localStorage.removeItem(key)
    }
  } catch {
    // Ignore private-mode storage errors cleanly
  }
}

// Backward-compatible aliases
export const loadProgress = loadGameData
export const saveProgress = saveGameData

const SAVE_CODE_PREFIX = 'SS4:'

function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

function base64ToUtf8(b64: string): string {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}

export function exportProgressJson(progress: SaveProgress): string {
  const canonical = toCanonicalSavePayload(progress)
  return JSON.stringify(
    {
      app: 'Starlight Stray',
      exportedAt: new Date().toISOString(),
      ...canonical,
      progress: sanitizeProgress(progress)
    },
    null,
    2
  )
}

export function exportProgressCode(progress: SaveProgress): string {
  const compact = JSON.stringify({ v: 4, p: progress })
  return `${SAVE_CODE_PREFIX}${utf8ToBase64(compact)}`
}

export function importProgressJson(
  rawInput: string
): { ok: true; progress: SaveProgress } | { ok: false; error: string } {
  const trimmed = rawInput.trim()
  if (!trimmed) {
    return { ok: false, error: 'Teks kode simpanan kosong.' }
  }
  try {
    let jsonText = trimmed
    if (trimmed.startsWith(SAVE_CODE_PREFIX)) {
      const payload = trimmed.slice(SAVE_CODE_PREFIX.length).replace(/\s+/g, '')
      jsonText = base64ToUtf8(payload)
    }
    const parsed = JSON.parse(jsonText) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'Format kode simpanan tidak valid.' }
    }
    const candidate =
      parsed.progress && typeof parsed.progress === 'object'
        ? parsed.progress
        : parsed.p && typeof parsed.p === 'object'
          ? parsed.p
          : parsed
    const sanitized = sanitizeProgress(candidate)
    saveProgress(sanitized)
    return { ok: true, progress: sanitized }
  } catch {
    return { ok: false, error: 'Gagal membaca kode simpanan atau JSON. Pastikan teks utuh dan benar.' }
  }
}
