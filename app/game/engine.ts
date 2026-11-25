import { BIOMES } from './achievements'
import { RetroAudioEngine } from './audio'
import { BossEncounterController } from './bosses'
import {
  BIOME_SHARD_REWARDS,
  CHARACTERS,
  getCapeById,
  getCharacterById,
  getCharacterMissionProgress,
  getFaceAccById,
  getHatById,
  getHeadAccById,
  getScarfById
} from './characters'
import {
  ALL_DAILY_BONUS_FISH,
  createDailyMissionsForToday,
  createDailyQuestForToday,
  evaluateTimeTrialMedal,
  getDailyQuestDef,
  getLocalDateKey,
  getTimeTrialTargets,
  rankMedal
} from './dailyQuest'
import {
  countBiomeCollectedShards,
  countRankSLevels,
  evaluateStampAchievements
} from '~/composables/useAchievements'
import { calculateSpeedrunRank, claimSpeedrunRankRewards, rankOrder } from '~/utils/levelParTimes'
import { LEVELS } from './levels'
import { drawPixelEmoteBubble } from './photoStudio'
import { drawPixelText, measurePixelText } from './pixelFont'
import {
  getPlayerSpriteSet,
  getSpriteBank,
  type DirectionalPlayerSprites,
  type SpriteBank
} from './sprites'
import {
  MAIN_LEVEL_COUNT,
  clearStoredGameData,
  createDefaultSave,
  createDefaultTouchLayout,
  exportProgressCode,
  exportProgressJson,
  importProgressJson,
  loadGameData,
  sanitizeProgress,
  sanitizeTouchLayout,
  saveGameData
} from './storage'
import type {
  AchievementId,
  AmbientCritter,
  ArenaBattleItemKind,
  AudioSettings,
  BiomeCosmeticJumpKind,
  BiomeId,
  BounceCloudState,
  CapeId,
  CharacterId,
  CheckpointState,
  CollectibleState,
  CosmeticTrailParticle,
  CrabState,
  CrowState,
  DailyQuestId,
  DashAfterimage,
  FaceAccId,
  FallingEventStar,
  FloatingBoatState,
  FloatingText,
  FragileBranchState,
  GameScreen,
  GearPlatformState,
  GlowMushroomState,
  GraphicsStyle,
  HatId,
  HeadAccId,
  HedgehogState,
  HomeBackdropMode,
  HudSnapshot,
  InputState,
  LanternState,
  LevelCoinBreakdown,
  LevelDefinition,
  MainBiomeId,
  MovingPlatformState,
  NightEventKind,
  Particle,
  PhasingCloudState,
  PhotoModePose,
  PlatformStyle,
  PlayerState,
  PostcardEmoteId,
  PowerUpState,
  PowerWireState,
  ProximityCrystalState,
  RankRewardBreakdownItem,
  SaveProgress,
  ScarfColorId,
  SecretAlcoveState,
  ShardState,
  ShardTuple,
  SpeedrunRank,
  StarRingStar,
  SteamVentState,
  StormCloudState,
  SwingingPerchState,
  SwoopCrowState,
  TimeTrialMedal,
  ToastNotice,
  TouchControlsMode,
  TouchLayoutConfig,
  WispState
} from './types'

export const VIEW_W = 384
export const VIEW_H = 216

// Motion-comfort platformer physics constants (pixels & seconds)
const MOVE_SPEED = 108
const DASH_SPEED = MOVE_SPEED * 2.5
const DASH_DURATION = 0.16
const DASH_COOLDOWN = 1.0
const GRAVITY = 560
const MAX_FALL_SPEED = 290
const FEATHER_GLIDE_MAX_FALL = 56
const FEATHER_DURATION = 8.0
const MAGNET_DURATION = 10.0
const MAGNET_RADIUS = 78
const MOONCAKE_DURATION = 8.0
const YARN_DURATION = 10.0
const MOCHI_DURATION = 8.0
const CANDY_DURATION = 7.0
const PEARL_DURATION = 10.0
const CRYSTAL_ELIXIR_DURATION = 9.0
const CHRONO_GEAR_DURATION = 8.0
const ECLIPSE_SHARD_DURATION = 7.0
const STARFALL_NOVA_COOLDOWN = 7.5
const LUNAR_MEND_COOLDOWN = 16.0
const LUNAR_MEND_MAX_USES = 2
const PEARL_FISH_RADIUS = 96
const JUMP_VY = -224
const DOUBLE_JUMP_VY = -208
const BOUNCE_CLOUD_VY = -302
const WIRE_BOUNCE_VY = -286
const STAR_COMBO_WINDOW = 2.5
const JUMP_CUT_MULT = 0.52
const COYOTE_TIME = 0.1
const JUMP_BUFFER_TIME = 0.1
const INVINCIBLE_DURATION = 1.5
const CAMERA_DEADZONE_HALF_W = 24

interface BgStar {
  x: number
  y: number
  size: 1 | 2
  cross: boolean
  phase: number
  speed: number
  color: string
}

interface BgCloud {
  x: number
  y: number
  w: number
  h: number
  speed: number
  tier: 'high' | 'low'
}

interface BgBuilding {
  x: number
  w: number
  h: number
  roof: 'flat' | 'gable' | 'spire'
  windows: { rx: number; ry: number; color: string }[]
}

interface RooftopProp {
  x: number
  y: number
  kind: 'fence' | 'flowerPink' | 'flowerBlue' | 'flowerGold' | 'pottedPlant' | 'harborPost'
  modernOnly?: boolean
}

interface UnderLedgeBranch {
  x: number
  y: number
}

interface ShootingStar {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
}

function createRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export class MoonpawGameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private sprites: SpriteBank
  private playerSprites!: DirectionalPlayerSprites
  private epilogueFriends: { id: CharacterId; sprites: DirectionalPlayerSprites; blinkOffset: number }[] = []
  private epilogueTimer = 0
  private audio: RetroAudioEngine
  private onHudUpdate: (snapshot: HudSnapshot) => void

  private rafId: number | null = null
  private lastTimestamp = 0
  private worldTime = 0
  private hurtPulseCount = 0
  private knockbackTimer = 0
  private landingTimer = 0
  private wasOnGround = true
  private styleFadeTimer = 0
  private pendingGraphicsStyle: GraphicsStyle | null = null
  private hudSyncTimer = 0
  private lastDashReady = true
  private lastIsDashing = false
  private npcGreeted = false

  private recentToast: ToastNotice | null = null
  private toastTimer = 0

  private screen: GameScreen = 'title'
  private currentLevelIdx = 0
  private level: LevelDefinition = LEVELS[0]!

  private progress: SaveProgress
  private totalRunScore = 0
  private levelScore = 0
  private lastStageRating: 1 | 2 | 3 = 1
  private justEarnedThreeStarBonus = false
  private tookDamageThisLevel = false

  // Time Trial / Speedrun state
  private isTimeTrial = false
  private timeTrialElapsedMs = 0
  private lastTimeTrialMedal: TimeTrialMedal = 'none'
  private isNewTimeRecord = false

  private player: PlayerState
  private movingPlatforms: MovingPlatformState[] = []
  private bounceClouds: BounceCloudState[] = []
  private checkpoints: CheckpointState[] = []
  private activeCheckpointIdx = -1
  private collectibles: CollectibleState[] = []
  private powerUps: PowerUpState[] = []
  private crows: CrowState[] = []
  private steamVents: SteamVentState[] = []
  private hedgehogs: HedgehogState[] = []
  private stormClouds: StormCloudState[] = []
  private swoopCrows: SwoopCrowState[] = []
  private crabs: CrabState[] = []
  private wisps: WispState[] = []
  private powerWires: PowerWireState[] = []
  private fragileBranches: FragileBranchState[] = []
  private floatingBoats: FloatingBoatState[] = []
  private standingBoatIdx = -1
  private phasingClouds: PhasingCloudState[] = []
  private swingingPerches: SwingingPerchState[] = []
  private standingPerchIdx = -1
  private glowMushrooms: GlowMushroomState[] = []
  private proximityCrystals: ProximityCrystalState[] = []
  private gearPlatforms: GearPlatformState[] = []
  private standingGearIdx = -1
  private bossController: BossEncounterController | null = null
  private bossWindPushX = 0
  private secretAlcoves: SecretAlcoveState[] = []
  private starComboCount = 0
  private starComboTimer = 0

  // Optional Star Ring Mini-Challenge state (8 stars in 6 seconds -> +1 Golden Fish!)
  private starRingState: 'ready' | 'active' | 'completed' | 'cooldown' = 'ready'
  private starRingTimer = 0
  private starRingStars: StarRingStar[] = []

  // Dynamic Rare Night Events (25% chance per level: Meteor Shower or Pink Full Moon)
  private nightEvent: NightEventKind = 'none'
  private nightEventBannerTimer = 0
  private meteorShowerTriggered = false
  private meteorShowerTimer = 0
  private meteorSpawnTimer = 0
  private fallingEventStars: FallingEventStar[] = []

  // Surface-specific footsteps & throttled enemy SFX timers
  private standingSurface: PlatformStyle = 'brick'
  private footstepTimer = 0
  private crowFlapCooldown = 0

  private lanterns: LanternState[] = []
  private critters: AmbientCritter[] = []
  private rooftopProps: RooftopProp[] = []
  private sakuraBranches: UnderLedgeBranch[] = []
  private particles: Particle[] = []
  private afterimages: DashAfterimage[] = []
  private floatingTexts: FloatingText[] = []

  private cameraX = 0
  private cameraY = 0
  private cameraTargetY = 0
  private bgStars: BgStar[] = []
  private bgClouds: BgCloud[] = []
  private deepBuildings: BgBuilding[] = []
  private farBuildings: BgBuilding[] = []
  private midBuildings: BgBuilding[] = []
  private shootingStar: ShootingStar | null = null
  private shootingStarCooldown = 4

  // Input management (keyboard + multi-touch merged cleanly)
  private keyLeft = false
  private keyRight = false
  private keyJump = false
  private keyDash = false
  private keyPulse = false
  private keyAegis = false
  private keyNova = false
  private keyMend = false
  private touchLeft = false
  private touchRight = false
  private touchJump = false
  private touchDash = false
  private touchPulse = false
  private touchAegis = false
  private touchNova = false
  private touchMend = false
  private prevJumpHeld = false
  private prevDashHeld = false
  private prevPulseHeld = false
  private prevAegisHeld = false
  private prevNovaHeld = false
  private prevMendHeld = false
  private input: InputState = {
    left: false,
    right: false,
    jumpHeld: false,
    jumpJustPressed: false,
    dashHeld: false,
    dashJustPressed: false,
    pulseJustPressed: false,
    aegisJustPressed: false,
    novaJustPressed: false,
    mendJustPressed: false
  }

  private autoSavePulse = 0
  private audioSaveDebounce: number | null = null
  private shards: ShardState[] = []
  private runElapsedMs = 0
  private lastSpeedrunRank: SpeedrunRank = 'C'
  private isNewBestTime = false
  private lastRankRewardBreakdown: RankRewardBreakdownItem[] = []
  private lastRankRewardTotal = 0
  private lastCoinBreakdown: LevelCoinBreakdown = {
    starsCoins: 0,
    firstClearCoins: 0,
    rankCoins: 0,
    foragerCoins: 0,
    bossCoins: 0,
    threeStarCoins: 0,
    totalCoins: 0
  }
  private celebrationCharId: CharacterId | null = null
  private playerEmote: PostcardEmoteId = 'none'
  private playerEmoteTimer = 0
  private campAmbientEmoteTimer = 2.4
  private campFriendEmoteIdx = -1
  private campFriendEmote: PostcardEmoteId = 'none'
  private campFriendEmoteTimer = 0
  private returnedFromClear = false
  private bossArenaAlerted = false
  private touchedEnemyThisLevel = false
  private campReaction: 'none' | 'hop' | 'love' | 'nap' = 'none'
  private campReactionTimer = 0
  private campHopOffset = 0
  private campCycleIdx = 0
  private campFriends: Array<{
    id: CharacterId
    sprites: DirectionalPlayerSprites
    blinkOffset: number
    reaction: 'none' | 'hop' | 'love' | 'nap'
    reactionTimer: number
    hopOffset: number
    cycleIdx: number
  }> = []
  private photoModePose: PhotoModePose = 'idle'
  private photoModeFrame = true
  private viewW = VIEW_W
  private desiredWideViewW = VIEW_W
  private cosmeticParticles: CosmeticTrailParticle[] = []
  private cosmeticHatTimer = 0
  private cosmeticCapeTimer = 0
  private cosmeticScarfTimer = 0

  private boundKeyDown: (e: KeyboardEvent) => void
  private boundKeyUp: (e: KeyboardEvent) => void
  private boundBlur: () => void
  private boundVisibilityChange: () => void
  private boundPageHide: () => void
  private boundCanvasClick: (e: MouseEvent) => void

  constructor(
    canvas: HTMLCanvasElement,
    onHudUpdate: (snapshot: HudSnapshot) => void,
    initialProgress?: SaveProgress
  ) {
    this.canvas = canvas
    this.canvas.width = VIEW_W
    this.canvas.height = VIEW_H
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2D Canvas context tidak tersedia')
    this.ctx = ctx
    this.ctx.imageSmoothingEnabled = false

    this.sprites = getSpriteBank()
    this.progress = initialProgress ? sanitizeProgress(initialProgress) : loadGameData()
    this.refreshPlayerSprites()
    this.audio = new RetroAudioEngine(this.progress.muted, this.progress.audio)
    this.onHudUpdate = onHudUpdate

    this.checkpoints = [{ ...this.level.checkpoint, activated: false }]
    this.player = this.createInitialPlayer(this.level)
    this.generateBackgroundScenery()
    this.loadLevel(0, false)
    this.placeTitlePose()
    this.checkSpecialCharacterMissions(false)
    this.audio.stopAmbience()

    this.boundKeyDown = (e) => this.handleKeyDown(e)
    this.boundKeyUp = (e) => this.handleKeyUp(e)
    this.boundBlur = () => this.clearAllInputs()
    this.boundVisibilityChange = () => {
      if (document.hidden) {
        this.clearAllInputs()
        this.flushAutoSave()
      }
    }
    this.boundPageHide = () => {
      this.flushAutoSave()
    }
    this.boundCanvasClick = (e: MouseEvent) => {
      if (this.screen !== 'title') return
      const rect = this.canvas.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      const cx =
        ((e.clientX - rect.left) / rect.width) * this.viewW - Math.max(0, this.viewW - VIEW_W)
      const cy = ((e.clientY - rect.top) / rect.height) * VIEW_H
      // Primary selected character (enlarged ~1.67x framing on right camp perch)
      const px = this.player.x + this.player.w / 2
      const py = this.player.y + this.player.h - 18
      if (Math.hypot(cx - px, cy - py) <= 34) {
        this.triggerCampReaction()
        return
      }
      // Check lounging unlocked camp friends
      const slots = this.getCampFriendSlots(this.getActiveHomeBiome())
      for (let i = 0; i < Math.min(this.campFriends.length, slots.length); i++) {
        const slot = slots[i]!
        if (Math.hypot(cx - slot.x, cy - (slot.y - 12)) <= 24) {
          this.triggerCampFriendReaction(i, slot.x, slot.y)
          return
        }
      }
    }

    window.addEventListener('keydown', this.boundKeyDown, { passive: false })
    window.addEventListener('keyup', this.boundKeyUp)
    window.addEventListener('blur', this.boundBlur)
    window.addEventListener('pagehide', this.boundPageHide)
    window.addEventListener('beforeunload', this.boundPageHide)
    document.addEventListener('visibilitychange', this.boundVisibilityChange)
    this.canvas.addEventListener('click', this.boundCanvasClick)

    this.emitHud()
  }

  public startLoop(): void {
    if (this.rafId !== null) return
    this.lastTimestamp = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTimestamp) / 1000))
      this.lastTimestamp = now
      this.update(dt)
      this.render()
      this.rafId = window.requestAnimationFrame(tick)
    }
    this.rafId = window.requestAnimationFrame(tick)
  }

  public destroy(): void {
    if (this.audioSaveDebounce !== null) {
      window.clearTimeout(this.audioSaveDebounce)
      this.audioSaveDebounce = null
    }
    this.flushAutoSave()
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    window.removeEventListener('keydown', this.boundKeyDown)
    window.removeEventListener('keyup', this.boundKeyUp)
    window.removeEventListener('blur', this.boundBlur)
    window.removeEventListener('pagehide', this.boundPageHide)
    window.removeEventListener('beforeunload', this.boundPageHide)
    document.removeEventListener('visibilitychange', this.boundVisibilityChange)
    this.canvas.removeEventListener('click', this.boundCanvasClick)
    this.audio.destroy()
  }

  /**
   * Adapts internal pixel viewport width for both ultrawide mobile landscape (384..640, zero black bars)
   * and tall mobile portrait (192..244, ~2x larger sprites filling the portrait play area cleanly).
   */
  public setViewportAspect(containerWidth: number, containerHeight: number): void {
    if (containerWidth <= 0 || containerHeight <= 0) return
    const ratio = containerWidth / containerHeight
    const baseRatio = VIEW_W / VIEW_H
    const isMobilePortrait = containerHeight > containerWidth && containerWidth <= 768
    const isMobileLandscape = containerWidth > containerHeight && containerHeight <= 540

    if (isMobilePortrait) {
      // Reserve top HUD (~78px) + bottom thumb control deck (~142px)
      const availH = Math.max(240, containerHeight - 220)
      const portraitRatio = containerWidth / availH
      this.desiredWideViewW = Math.max(192, Math.min(244, Math.round(VIEW_H * portraitRatio)))
    } else if (isMobileLandscape && ratio > baseRatio + 0.03) {
      this.desiredWideViewW = Math.max(VIEW_W, Math.min(640, Math.round(VIEW_H * ratio)))
    } else {
      this.desiredWideViewW = VIEW_W
    }
    this.syncViewportWidthForCurrentScreen()
  }

  private syncViewportWidthForCurrentScreen(): void {
    const isMenuOrEnding =
      this.screen === 'title' ||
      this.screen === 'levelSelect' ||
      this.screen === 'characters' ||
      this.screen === 'shop' ||
      this.screen === 'achievements' ||
      this.screen === 'photoStudio' ||
      this.screen === 'guidebook' ||
      this.screen === 'settings' ||
      this.screen === 'victory'

    // In ultrawide landscape, keep full wide canvas even on Lobby/menus (zero black bars!).
    // In portrait, keep Lobby at 384x216 for clean top-header framing while gameplay uses zoomed portrait viewW.
    const targetW = isMenuOrEnding
      ? Math.max(VIEW_W, this.desiredWideViewW)
      : this.desiredWideViewW
    if (this.viewW !== targetW || this.canvas.width !== targetW) {
      this.viewW = targetW
      this.canvas.width = targetW
      this.canvas.height = VIEW_H
      this.ctx.imageSmoothingEnabled = false
      const maxCamX = Math.max(0, this.level.width - this.viewW)
      if (this.cameraX > maxCamX) {
        this.cameraX = maxCamX
      }
    }
  }

  private persistSave(showIndicator = false): void {
    const ok = saveGameData(this.progress)
    if (ok && showIndicator) {
      this.autoSavePulse += 1
    }
  }

  private syncCurrentLevelBestRecords(): boolean {
    if (this.screen !== 'playing') return false
    const starsCollected = this.collectibles.filter((c) => c.kind === 'star' && c.collected).length
    const totalStars = this.collectibles.filter((c) => c.kind === 'star').length
    const fishCollected = this.collectibles.filter((c) => c.kind === 'fish' && c.collected).length
    const totalFish = this.collectibles.filter((c) => c.kind === 'fish').length

    const prevRec = this.progress.levelRecords[this.level.id]
    const prevBestScore = this.progress.bestLevelScores[this.level.id] ?? 0
    const nextBestScore = Math.max(prevRec?.bestScore ?? 0, prevBestScore, this.levelScore)
    const nextBestStars = Math.max(prevRec?.bestStars ?? 0, starsCollected)
    const nextBestFish = Math.max(prevRec?.bestFish ?? 0, fishCollected)

    const changed =
      !prevRec ||
      nextBestScore > prevRec.bestScore ||
      nextBestStars > prevRec.bestStars ||
      nextBestFish > prevRec.bestFish ||
      nextBestScore > prevBestScore

    if (!changed) return false

    this.progress.bestLevelScores[this.level.id] = nextBestScore
    this.progress.levelRecords[this.level.id] = {
      bestScore: nextBestScore,
      bestStars: nextBestStars,
      totalStars,
      bestFish: nextBestFish,
      totalFish,
      rating: prevRec?.rating ?? 0,
      threeStarBonusClaimed: Boolean(prevRec?.threeStarBonusClaimed)
    }
    return true
  }

  private flushAutoSave(): void {
    if (this.totalRunScore > this.progress.highScore) {
      this.progress.highScore = this.totalRunScore
    }
    this.syncCurrentLevelBestRecords()
    saveGameData(this.progress)
  }

  // ============================================================================
  // PUBLIC UI, CHARACTER, SETTINGS, SCRAPBOOK & BACKUP METHODS
  // ============================================================================

  private refreshPlayerSprites(): void {
    this.playerSprites = getPlayerSpriteSet(
      this.progress.selectedCharacter,
      this.progress.selectedScarf,
      this.progress.selectedHat,
      this.progress.selectedCape,
      this.progress.graphicsStyle,
      this.progress.selectedHeadAcc,
      this.progress.selectedFaceAcc
    )
    this.prepareCampFriends()
    if (this.screen === 'victory') {
      this.prepareEpilogueFriends()
    }
  }

  private prepareCampFriends(): void {
    const scarfPool: ScarfColorId[] = ['sky', 'gold', 'mint', 'purple', 'pink']
    const otherUnlocked = this.progress.unlockedCharacters
      .filter((id) => id !== this.progress.selectedCharacter)
      .slice(0, 4)

    this.campFriends = otherUnlocked.map((id, idx) => ({
      id,
      sprites: getPlayerSpriteSet(
        id,
        scarfPool[idx % scarfPool.length]!,
        'none',
        'none',
        this.progress.graphicsStyle
      ),
      blinkOffset: idx * 1.1 + 0.5,
      reaction: 'none',
      reactionTimer: 0,
      hopOffset: 0,
      cycleIdx: 0
    }))
  }

  private getCampFriendSlots(biome: BiomeId): Array<{ x: number; y: number; facing: 1 | -1; pose: 'nap' | 'gaze' }> {
    if (biome === 'rooftops') {
      return [
        { x: 348, y: 128, facing: -1, pose: 'nap' },
        { x: 222, y: 164, facing: 1, pose: 'gaze' },
        { x: 320, y: 164, facing: -1, pose: 'gaze' },
        { x: 196, y: 166, facing: 1, pose: 'nap' }
      ]
    }
    if (biome === 'sakura') {
      return [
        { x: 218, y: 158, facing: 1, pose: 'gaze' },
        { x: 336, y: 100, facing: -1, pose: 'nap' },
        { x: 350, y: 164, facing: -1, pose: 'gaze' },
        { x: 244, y: 166, facing: 1, pose: 'nap' }
      ]
    }
    if (biome === 'cloudland') {
      return [
        { x: 214, y: 144, facing: 1, pose: 'gaze' },
        { x: 344, y: 134, facing: -1, pose: 'nap' },
        { x: 332, y: 164, facing: -1, pose: 'gaze' },
        { x: 236, y: 164, facing: 1, pose: 'nap' }
      ]
    }
    return [
      { x: 218, y: 160, facing: 1, pose: 'gaze' },
      { x: 352, y: 160, facing: -1, pose: 'nap' },
      { x: 326, y: 164, facing: -1, pose: 'gaze' },
      { x: 242, y: 164, facing: 1, pose: 'nap' }
    ]
  }

  private triggerBespokeCampParticles(charId: CharacterId, cx: number, cy: number): 'hop' | 'love' | 'nap' {
    this.audio.playCampCharacterVoice(charId)
    const calm = this.progress.reduceMotion
    const count = calm ? 4 : 9

    if (charId === 'bear-sun') {
      // Golden honey droplets + tiny hearts
      this.spawnCollectBurst(cx, cy - 10, '#ffbf3b', count)
      this.spawnCollectBurst(cx, cy - 14, '#ff9ec4', Math.max(2, Math.floor(count / 2)))
      this.floatingTexts.push({ x: cx - 6, y: cy - 22, vy: -11, text: '♥ MADU!', color: '#ffd966', life: 1.15, maxLife: 1.15 })
      return 'love'
    }
    if (charId === 'bear-polar') {
      // Sleepy yawn + floating zZz & ice-blue snowflakes
      this.spawnCollectBurst(cx, cy - 12, '#9ee8ff', count)
      this.spawnCollectBurst(cx, cy - 16, '#ffffff', Math.max(2, Math.floor(count / 2)))
      this.floatingTexts.push({ x: cx - 4, y: cy - 22, vy: -8, text: 'zZz ❄', color: '#c4f2ff', life: 1.5, maxLife: 1.5 })
      return 'nap'
    }
    if (charId === 'bear-black') {
      // Confident nod + gold star sparkles highlighting cream crescent chest mark
      this.spawnCollectBurst(cx, cy - 6, '#ffe475', count)
      this.spawnCollectBurst(cx, cy - 10, '#ffefc2', Math.max(2, Math.floor(count / 2)))
      this.floatingTexts.push({ x: cx - 4, y: cy - 22, vy: -12, text: '★ ✦', color: '#ffe885', life: 1.05, maxLife: 1.05 })
      return 'love'
    }
    if (charId === 'fox-brown') {
      // Playful quick hop + tail wag + floating music-note & leaf particles
      this.spawnCollectBurst(cx, cy - 10, '#8ce696', count)
      this.spawnCollectBurst(cx, cy - 14, '#ffe475', Math.max(2, Math.floor(count / 2)))
      this.floatingTexts.push({ x: cx - 6, y: cy - 24, vy: -13, text: '♪ YIP!', color: '#b0ffba', life: 1.0, maxLife: 1.0 })
      return 'hop'
    }
    if (charId === 'fox-kitsune') {
      // Calm closed-eye smile + 3 floating blue-gold pixel kitsunebi wisps
      this.spawnCollectBurst(cx - 6, cy - 14, '#7eeeff', Math.max(3, Math.floor(count / 2)))
      this.spawnCollectBurst(cx + 6, cy - 16, '#ffe475', Math.max(3, Math.floor(count / 2)))
      this.floatingTexts.push({ x: cx - 6, y: cy - 24, vy: -10, text: '✦ ✦ ✦', color: '#9ef2ff', life: 1.3, maxLife: 1.3 })
      return 'nap'
    }
    if (charId === 'bunny-starlight') {
      // Energetic wiggle hop + sparkling starlight & clover particles
      this.spawnCollectBurst(cx, cy - 10, '#ffe475', count)
      this.spawnCollectBurst(cx, cy - 14, '#9ef5b8', Math.max(2, Math.floor(count / 2)))
      this.floatingTexts.push({ x: cx - 6, y: cy - 24, vy: -14, text: '★ HOP!', color: '#c4ffe0', life: 0.95, maxLife: 0.95 })
      return 'hop'
    }
    if (charId === 'dog-samoyed') {
      // Playful play-bow bounce + floating bone & heart particles
      this.spawnCollectBurst(cx, cy - 10, '#fff5e0', count)
      this.spawnCollectBurst(cx, cy - 14, '#ff9ec4', Math.max(2, Math.floor(count / 2)))
      this.floatingTexts.push({ x: cx - 8, y: cy - 24, vy: -13, text: '♥ WOOF!', color: '#ffe6f2', life: 1.0, maxLife: 1.0 })
      return 'hop'
    }
    if (charId === 'dog-shiba') {
      // Proud happy spin/hop + golden starlight sparkles
      this.spawnCollectBurst(cx, cy - 10, '#ffe475', count)
      this.spawnCollectBurst(cx, cy - 14, '#ffb86b', Math.max(2, Math.floor(count / 2)))
      this.floatingTexts.push({ x: cx - 6, y: cy - 24, vy: -13, text: '★ ARU!', color: '#ffe885', life: 1.0, maxLife: 1.0 })
      return 'hop'
    }
    // White Cat / Mochi & Cat variants: stretch + purr-meow + pink hearts & musical notes
    this.spawnCollectBurst(cx, cy - 12, '#ff9ec4', count)
    this.spawnCollectBurst(cx, cy - 16, '#ffe475', Math.max(2, Math.floor(count / 2)))
    this.floatingTexts.push({ x: cx - 6, y: cy - 22, vy: -11, text: '♥ ♪ MEOW', color: '#ffb8dc', life: 1.1, maxLife: 1.1 })
    return 'love'
  }

  private triggerCampFriendReaction(idx: number, x: number, y: number): void {
    const fr = this.campFriends[idx]
    if (!fr) return
    this.audio.unlock()
    fr.cycleIdx += 1
    const mode = this.triggerBespokeCampParticles(fr.id, x, y - 6)
    fr.reaction = mode
    fr.reactionTimer = mode === 'nap' ? 2.2 : 1.25
    fr.hopOffset = 0
  }

  private prepareEpilogueFriends(): void {
    const preferredOrder: CharacterId[] = [
      'bunny-starlight',
      'dog-shiba',
      'dog-samoyed',
      'cat-calico',
      'cat-ginger',
      'cat-midnight',
      'cat-mochi',
      'cat-blue'
    ]
    const scarfPool: ScarfColorId[] = ['sky', 'gold', 'mint', 'purple', 'pink']
    const friendIds = preferredOrder
      .filter((id) => id !== this.progress.selectedCharacter)
      .slice(0, 5)
    this.epilogueFriends = friendIds.map((id, idx) => ({
      id,
      sprites: getPlayerSpriteSet(
        id,
        scarfPool[idx % scarfPool.length]!,
        idx === 0 ? 'clip-sakura' : idx === 2 ? 'beret-cream' : 'none',
        'none',
        this.progress.graphicsStyle
      ),
      blinkOffset: idx * 0.9 + 0.4
    }))
  }

  public setTouchControlsMode(mode: TouchControlsMode): void {
    if (this.progress.touchControlsMode === mode) return
    this.audio.unlock()
    this.audio.playUiClick()
    this.progress.touchControlsMode = mode
    this.persistSave(true)
    this.emitHud()
  }

  public setTouchLayout(next: TouchLayoutConfig): void {
    this.audio.unlock()
    this.progress.touchLayout = sanitizeTouchLayout(next)
    this.persistSave(true)
    this.emitHud()
  }

  public resetTouchLayout(): void {
    this.audio.unlock()
    this.audio.playUiClick()
    this.progress.touchLayout = createDefaultTouchLayout()
    this.persistSave(true)
    this.emitHud()
  }

  public setShowSpeedrunTimer(enabled: boolean): void {
    if (this.progress.showSpeedrunTimer === enabled) return
    this.audio.unlock()
    this.audio.playUiClick()
    this.progress.showSpeedrunTimer = enabled
    this.persistSave(true)
    this.emitHud()
  }

  private getBiomeForLevelId(levelId: number): BiomeId {
    const lvl = LEVELS.find((l) => l.id === levelId)
    return lvl ? lvl.biome : 'rooftops'
  }

  private getActiveHomeBiome(): BiomeId {
    if (this.progress.homeBackdropMode !== 'auto') {
      return this.progress.homeBackdropMode
    }
    const raw = this.getBiomeForLevelId(this.progress.lastPlayedLevel)
    if (raw === 'eclipse' || raw === 'citadel') return 'observatory'
    return raw
  }

  public cycleHomeBackdropMode(): void {
    const order: HomeBackdropMode[] = [
      'auto',
      'rooftops',
      'sakura',
      'cloudland',
      'harbor',
      'cavern',
      'observatory'
    ]
    const idx = order.indexOf(this.progress.homeBackdropMode)
    const next = order[(idx + 1) % order.length]!
    this.audio.unlock()
    this.audio.playUiClick()
    this.progress.homeBackdropMode = next
    this.persistSave(true)
    this.emitHud()
  }

  public setReduceMotion(enabled: boolean): void {
    if (this.progress.reduceMotion === enabled) return
    this.audio.unlock()
    this.audio.playUiClick()
    this.progress.reduceMotion = enabled
    this.persistSave(true)
    this.emitHud()
  }

  /** Interactive Title Screen / Camp Hub bespoke character reaction, particles & Web Audio SFX */
  public triggerCampReaction(): void {
    this.audio.unlock()
    this.campCycleIdx += 1
    const cx = this.player.x + this.player.w / 2
    const cy = this.player.y + this.player.h - 14
    const mode = this.triggerBespokeCampParticles(this.progress.selectedCharacter, cx, cy)
    this.campReaction = mode
    this.campReactionTimer = mode === 'nap' ? 2.3 : 1.25
    this.campHopOffset = 0
  }

  /** Pause-Menu Photo Mode & Crisp 4x Postcard Exporter */
  public openPhotoMode(): void {
    if (this.screen !== 'paused' && this.screen !== 'playing') return
    this.audio.unlock()
    this.audio.playUiClick()
    this.screen = 'photoMode'
    this.photoModePose = 'idle'
    this.clearAllInputs()
    this.emitHud()
  }

  public exitPhotoMode(): void {
    if (this.screen !== 'photoMode') return
    this.audio.playUiClick()
    this.screen = 'paused'
    this.emitHud()
  }

  public setPhotoModePose(pose: PhotoModePose): void {
    this.audio.unlock()
    this.audio.playUiClick()
    this.photoModePose = pose
    this.emitHud()
  }

  public togglePhotoModeFrame(): void {
    this.audio.unlock()
    this.audio.playUiClick()
    this.photoModeFrame = !this.photoModeFrame
    this.emitHud()
  }

  public snapPhotoModePostcard(): string {
    this.audio.unlock()
    this.audio.playCameraShutter()
    // Ensure latest frame is rendered cleanly before capture
    this.render()
    const scale = 4
    const out = document.createElement('canvas')
    out.width = this.viewW * scale
    out.height = VIEW_H * scale
    const octx = out.getContext('2d')!
    octx.imageSmoothingEnabled = false
    octx.drawImage(this.canvas, 0, 0, out.width, out.height)
    return out.toDataURL('image/png')
  }

  public exportSaveCode(): string {
    return exportProgressCode(this.progress)
  }

  private get isModern(): boolean {
    return this.progress.graphicsStyle === 'modern'
  }

  public setGraphicsStyle(style: GraphicsStyle): void {
    if (this.progress.graphicsStyle === style) return
    this.audio.unlock()
    this.audio.playUiClick()
    // Single source of truth updated IMMEDIATELY on click so canvas, Title Screen, HUD & previews switch on frame 1!
    this.progress.graphicsStyle = style
    this.pendingGraphicsStyle = null
    this.refreshPlayerSprites()
    this.persistSave(true)
    this.styleFadeTimer = 0.16
    this.emitHud()
  }

  public getProgress(): SaveProgress {
    return {
      ...this.progress,
      unlockedCharacters: [...this.progress.unlockedCharacters],
      ownedScarves: [...this.progress.ownedScarves],
      ownedHats: [...this.progress.ownedHats],
      ownedCapes: [...this.progress.ownedCapes],
      ownedHeadAccs: [...this.progress.ownedHeadAccs],
      ownedFaceAccs: [...this.progress.ownedFaceAccs],
      unlockedAchievements: [...this.progress.unlockedAchievements],
      visitedBiomes: [...this.progress.visitedBiomes],
      bestLevelScores: { ...this.progress.bestLevelScores },
      levelRecords: { ...this.progress.levelRecords },
      collectedShards: { ...this.progress.collectedShards },
      bestTimes: { ...this.progress.bestTimes },
      levelRanks: { ...this.progress.levelRanks },
      claimedRankRewards: { ...this.progress.claimedRankRewards },
      timeTrials: { ...this.progress.timeTrials },
      dailyQuest: { ...this.progress.dailyQuest },
      dailyMissions: {
        dateKey: this.progress.dailyMissions.dateKey,
        bonusClaimed: this.progress.dailyMissions.bonusClaimed,
        missions: [
          { ...this.progress.dailyMissions.missions[0] },
          { ...this.progress.dailyMissions.missions[1] },
          { ...this.progress.dailyMissions.missions[2] }
        ]
      },
      audio: { ...this.progress.audio }
    }
  }

  private syncLegacyDailyQuestMirror(): void {
    const first = this.progress.dailyMissions.missions[0]
    this.progress.dailyQuest = {
      dateKey: this.progress.dailyMissions.dateKey,
      questId: first.questId,
      progress: first.progress,
      claimed: first.claimed
    }
  }

  private ensureDailyQuestFresh(): void {
    const todayKey = getLocalDateKey()
    if (this.progress.dailyMissions.dateKey !== todayKey) {
      this.progress.dailyMissions = createDailyMissionsForToday(todayKey)
      this.syncLegacyDailyQuestMirror()
      this.persistSave(false)
    }
  }

  private incrementDailyQuest(id: DailyQuestId, amount = 1): void {
    this.ensureDailyQuestFresh()
    let anyChanged = false
    for (const slot of this.progress.dailyMissions.missions) {
      if (slot.questId !== id || slot.claimed) continue
      const def = getDailyQuestDef(slot.questId)
      if (slot.progress >= def.target) continue
      slot.progress = Math.min(def.target, slot.progress + amount)
      anyChanged = true
      if (slot.progress >= def.target) {
        this.showToast({
          icon: def.icon,
          label: 'MISI HARI INI SELESAI!',
          title: `Klaim +${def.rewardFish} Ikan Emas di Menu Utama`
        })
      }
    }
    if (anyChanged) {
      this.syncLegacyDailyQuestMirror()
      this.persistSave(true)
    }
  }

  public claimDailyQuestReward(slotIndex = 0): boolean {
    this.ensureDailyQuestFresh()
    const slot = this.progress.dailyMissions.missions[slotIndex]
    if (!slot || slot.claimed) return false
    const def = getDailyQuestDef(slot.questId)
    if (slot.progress < def.target) return false

    this.audio.unlock()
    slot.claimed = true
    this.progress.fishBank += def.rewardFish
    this.progress.totalFishEarned += def.rewardFish
    this.progress.totalDailyMissionsCompleted += 1

    // Check if all 3 daily missions for today are now claimed -> award +25 Fish All-Clear Bonus!
    const allThreeClaimed = this.progress.dailyMissions.missions.every((m) => m.claimed)
    let grantedAllClearBonus = false
    if (allThreeClaimed && !this.progress.dailyMissions.bonusClaimed) {
      this.progress.dailyMissions.bonusClaimed = true
      this.progress.fishBank += ALL_DAILY_BONUS_FISH
      this.progress.totalFishEarned += ALL_DAILY_BONUS_FISH
      grantedAllClearBonus = true
    }

    this.syncLegacyDailyQuestMirror()
    this.persistSave(true)
    this.audio.playUnlock()
    this.checkSpecialCharacterMissions(true)
    this.checkAchievements()
    this.showToast(
      grantedAllClearBonus
        ? {
            icon: '🏆',
            label: 'BONUS 3/3 MISI HARIAN!',
            title: `+${def.rewardFish + ALL_DAILY_BONUS_FISH} Ikan Emas (termasuk +${ALL_DAILY_BONUS_FISH} Bonus!)`
          }
        : {
            icon: '🎁',
            label: 'HADIAH MISI HARIAN!',
            title: `+${def.rewardFish} Ikan Emas • Total ${this.progress.totalDailyMissionsCompleted} Misi`
          }
    )
    this.emitHud()
    return true
  }

  public openPhotoStudio(): void {
    this.audio.unlock()
    this.audio.playUiClick()
    this.audio.setBgmMode('normal')
    this.audio.stopAmbience()
    this.screen = 'photoStudio'
    this.clearAllInputs()
    this.emitHud()
  }

  public openGuidebook(): void {
    this.audio.unlock()
    this.audio.playUiClick()
    this.audio.setBgmMode('normal')
    this.audio.stopAmbience()
    this.screen = 'guidebook'
    this.clearAllInputs()
    this.emitHud()
  }

  public continueFromCheckpoint(): void {
    const cp = this.activeCheckpointIdx >= 0 ? this.checkpoints[this.activeCheckpointIdx] : null
    if (!cp || !cp.activated) {
      this.restartLevel()
      return
    }
    this.audio.unlock()
    this.audio.playCheckpoint()
    this.audio.setBgmMode('normal')
    this.refreshPlayerSprites()
    const p = this.player
    p.hearts = p.maxHearts
    p.x = cp.x + 1
    p.y = cp.y + 6
    p.vx = 0
    p.vy = 0
    p.dashTimer = 0
    p.airDashUsed = false
    p.onGround = false
    p.jumpsUsed = 0
    p.invincibleTimer = INVINCIBLE_DURATION
    this.knockbackTimer = 0
    this.starComboCount = 0
    this.starComboTimer = 0
    this.standingBoatIdx = -1
    this.clearAllInputs()
    this.screen = 'playing'
    this.audio.setBiomeAmbience(this.level.biome)
    this.spawnDoubleJumpStars(p.x + p.w / 2, p.y + p.h / 2)
    this.emitHud()
  }

  public startTimeTrial(levelId: number): void {
    const idx = LEVELS.findIndex((l) => l.id === levelId)
    if (idx < 0) return
    if (levelId > this.progress.unlockedLevel) return
    this.audio.unlock()
    this.audio.playUiClick()
    this.audio.setBgmMode('normal')
    this.refreshPlayerSprites()
    this.isTimeTrial = true
    this.totalRunScore = 0
    this.progress.lastPlayedLevel = levelId
    this.persistSave(false)
    this.loadLevel(idx, true)
    this.screen = 'playing'
    this.audio.setBiomeAmbience(this.level.biome)
    this.emitHud()
  }

  public getLevels(): LevelDefinition[] {
    return LEVELS
  }

  public unlockAudio(): void {
    this.audio.unlock()
    this.audio.unlockAudio()
  }

  public toggleMute(): void {
    const muted = this.audio.toggleMute()
    this.progress.muted = muted
    this.persistSave(true)
    this.emitHud()
  }

  public updateAudioSettings(partial: Partial<AudioSettings>): void {
    this.audio.unlock()
    this.progress.audio = {
      ...this.progress.audio,
      ...partial
    }
    this.audio.setAudioSettings(this.progress.audio)
    if (this.audioSaveDebounce !== null) {
      window.clearTimeout(this.audioSaveDebounce)
    }
    this.audioSaveDebounce = window.setTimeout(() => {
      this.audioSaveDebounce = null
      this.persistSave(true)
      this.emitHud()
    }, 300)
    this.emitHud()
  }

  public applyProgress(next: SaveProgress, notifyIndicator = true): void {
    this.progress = sanitizeProgress(next)
    this.checkSpecialCharacterMissions(false)
    this.checkAchievements()
    this.persistSave(notifyIndicator)
    this.refreshPlayerSprites()
    this.audio.setMuted(this.progress.muted)
    this.audio.setAudioSettings(this.progress.audio)
    this.emitHud()
  }

  public resetProgress(): void {
    if (this.audioSaveDebounce !== null) {
      window.clearTimeout(this.audioSaveDebounce)
      this.audioSaveDebounce = null
    }
    clearStoredGameData()
    this.progress = createDefaultSave()
    this.persistSave(true)
    this.totalRunScore = 0
    this.levelScore = 0
    this.isTimeTrial = false
    this.refreshPlayerSprites()
    this.audio.setMuted(this.progress.muted)
    this.audio.setAudioSettings(this.progress.audio)
    this.audio.setBgmMode('normal')
    this.audio.setBgmBiome('rooftops')
    this.audio.setAdaptiveBgmFlags({ lowHealth: false, climaxLayer: false })
    this.audio.stopAmbience()
    this.audio.playUiClick()
    this.screen = 'title'
    this.clearAllInputs()
    this.loadLevel(0, false)
    this.placeTitlePose()
    this.emitHud()
  }

  public exportSaveJson(): string {
    return exportProgressJson(this.progress)
  }

  public importSaveJson(rawText: string): { ok: boolean; message: string } {
    const res = importProgressJson(rawText)
    if (!res.ok) {
      return { ok: false, message: res.error }
    }
    this.applyProgress(res.progress, true)
    this.audio.playUnlock()
    return { ok: true, message: 'Data simpanan berhasil dimuat dan disinkronkan!' }
  }

  public openTitle(): void {
    this.audio.playUiClick()
    this.audio.setBgmMode('normal')
    this.audio.setBgmBiome('rooftops')
    this.audio.setAdaptiveBgmFlags({ lowHealth: false, climaxLayer: false })
    this.audio.stopAmbience()
    this.ensureDailyQuestFresh()
    this.isTimeTrial = false
    this.screen = 'title'
    this.clearAllInputs()
    this.loadLevel(0, false)
    this.placeTitlePose()
    if (this.returnedFromClear) {
      this.returnedFromClear = false
      this.triggerSyncCampHop()
    }
    this.emitHud()
  }

  public triggerSyncCampHop(): void {
    const hopDur = this.progress.reduceMotion ? 0.55 : 1.05
    this.campReaction = 'hop'
    this.campReactionTimer = hopDur
    this.campHopOffset = 0
    for (const fr of this.campFriends) {
      fr.reaction = 'hop'
      fr.reactionTimer = hopDur
      fr.hopOffset = 0
    }
    this.campFriendEmoteIdx = this.campFriends.length > 0 ? 0 : -1
    this.campFriendEmote = 'star'
    this.campFriendEmoteTimer = 1.6
  }

  public dismissCelebration(): void {
    this.celebrationCharId = null
    this.audio.playUiClick()
    this.emitHud()
  }

  public equipCelebrationChar(openStudio = false): void {
    const id = this.celebrationCharId
    this.celebrationCharId = null
    if (id && this.progress.unlockedCharacters.includes(id)) {
      this.progress.selectedCharacter = id
      this.refreshPlayerSprites()
      this.persistSave(true)
      this.audio.playCampCharacterVoice(id)
    }
    if (openStudio) {
      this.openPhotoStudio()
    } else {
      this.triggerSyncCampHop()
      this.emitHud()
    }
  }

  public triggerManualEmote(): void {
    if (this.screen !== 'playing') return
    const p = this.player
    this.audio.unlock()
    const pool: PostcardEmoteId[] = ['heart', 'music', 'star']
    const picked = pool[Math.floor(Math.random() * pool.length)]!
    this.triggerPlayerEmote(picked, 1.8)
    this.audio.playCampCharacterVoice(this.progress.selectedCharacter)
    if (!this.progress.reduceMotion) {
      this.spawnCollectBurst(p.x + p.w / 2, p.y - 4, '#ffe475', 6)
    }
  }

  private triggerPlayerEmote(emote: PostcardEmoteId, duration = 1.6): void {
    this.playerEmote = emote
    this.playerEmoteTimer = duration
  }

  public openLevelSelect(): void {
    this.audio.unlock()
    this.audio.playUiClick()
    this.audio.setBgmMode('normal')
    this.screen = 'levelSelect'
    this.clearAllInputs()
    this.emitHud()
  }

  public openCharacters(): void {
    this.audio.unlock()
    this.audio.playUiClick()
    this.audio.setBgmMode('normal')
    this.checkSpecialCharacterMissions(true)
    this.screen = 'characters'
    this.clearAllInputs()
    this.emitHud()
  }

  public openShop(): void {
    this.audio.unlock()
    this.audio.playUiClick()
    this.audio.setBgmMode('normal')
    this.screen = 'shop'
    this.clearAllInputs()
    this.emitHud()
  }

  public openAchievements(): void {
    this.audio.unlock()
    this.audio.playUiClick()
    this.audio.setBgmMode('normal')
    if (this.progress.hasUnseenStamps) {
      this.progress.hasUnseenStamps = false
      this.persistSave(false)
    }
    this.screen = 'achievements'
    this.clearAllInputs()
    this.emitHud()
  }

  public openSettings(): void {
    this.audio.unlock()
    this.audio.playUiClick()
    this.audio.setBgmMode('normal')
    this.screen = 'settings'
    this.clearAllInputs()
    this.emitHud()
  }

  public selectCharacter(id: CharacterId): void {
    if (!this.progress.unlockedCharacters.includes(id)) return
    this.audio.unlock()
    this.audio.playUiClick()
    this.progress.selectedCharacter = id
    this.refreshPlayerSprites()
    this.persistSave(true)
    this.audio.playCampCharacterVoice(id)
    this.triggerSyncCampHop()
    this.emitHud()
  }

  public unlockCharacter(id: CharacterId): boolean {
    if (this.progress.unlockedCharacters.includes(id)) {
      this.selectCharacter(id)
      return true
    }
    const def = getCharacterById(id)
    // Special mission characters CANNOT be bought directly with Golden Fish!
    if (def.unlockMode === 'mission') {
      return false
    }
    if (this.progress.fishBank < def.cost) {
      return false
    }
    this.audio.unlock()
    this.progress.fishBank -= def.cost
    this.progress.unlockedCharacters.push(id)
    this.progress.selectedCharacter = id
    this.refreshPlayerSprites()
    this.persistSave(true)
    this.audio.playUnlock()
    this.audio.playCampCharacterVoice(id)
    this.celebrationCharId = id
    this.triggerSyncCampHop()
    this.checkAchievements()
    this.emitHud()
    return true
  }

  public buyOrEquipScarf(id: ScarfColorId): boolean {
    this.audio.unlock()
    if (this.progress.ownedScarves.includes(id)) {
      this.progress.selectedScarf = id
      this.refreshPlayerSprites()
      this.persistSave(true)
      this.audio.playUiClick()
      this.emitHud()
      return true
    }
    const def = getScarfById(id)
    if (def.unlockStampId || def.shardUnlockBiome) return false
    if (this.progress.fishBank < def.cost) return false
    this.progress.fishBank -= def.cost
    this.progress.ownedScarves.push(id)
    this.progress.selectedScarf = id
    this.refreshPlayerSprites()
    this.persistSave(true)
    this.audio.playUnlock()
    this.checkAchievements()
    this.emitHud()
    return true
  }

  public buyOrEquipHat(id: HatId): boolean {
    this.audio.unlock()
    if (this.progress.ownedHats.includes(id)) {
      this.progress.selectedHat = id
      this.refreshPlayerSprites()
      this.persistSave(true)
      this.audio.playUiClick()
      this.emitHud()
      return true
    }
    const def = getHatById(id)
    if (def.shardUnlockBiome) return false
    if (this.progress.fishBank < def.cost) return false
    this.progress.fishBank -= def.cost
    this.progress.ownedHats.push(id)
    this.progress.selectedHat = id
    this.refreshPlayerSprites()
    this.persistSave(true)
    this.audio.playUnlock()
    this.checkAchievements()
    this.emitHud()
    return true
  }

  public buyOrEquipCape(id: CapeId): boolean {
    this.audio.unlock()
    if (this.progress.ownedCapes.includes(id)) {
      this.progress.selectedCape = id
      this.refreshPlayerSprites()
      this.persistSave(true)
      this.audio.playUiClick()
      this.emitHud()
      return true
    }
    const def = getCapeById(id)
    // Biome-exclusive shard capes & boss reward capes cannot be purchased with fish!
    if (def.shardUnlockBiome || def.bossUnlockLevelId) return false
    if (this.progress.fishBank < def.cost) return false
    this.progress.fishBank -= def.cost
    this.progress.ownedCapes.push(id)
    this.progress.selectedCape = id
    this.refreshPlayerSprites()
    this.persistSave(true)
    this.audio.playUnlock()
    this.checkAchievements()
    this.emitHud()
    return true
  }

  public buyOrEquipHeadAcc(id: HeadAccId): boolean {
    this.audio.unlock()
    if (this.progress.ownedHeadAccs.includes(id)) {
      this.progress.selectedHeadAcc = id
      this.refreshPlayerSprites()
      this.persistSave(true)
      this.audio.playUiClick()
      this.emitHud()
      return true
    }
    const def = getHeadAccById(id)
    if (def.bossUnlockLevelId) return false
    if (this.progress.fishBank < def.cost) return false
    this.progress.fishBank -= def.cost
    this.progress.ownedHeadAccs.push(id)
    this.progress.selectedHeadAcc = id
    this.refreshPlayerSprites()
    this.persistSave(true)
    this.audio.playUnlock()
    this.checkAchievements()
    this.emitHud()
    return true
  }

  public buyOrEquipFaceAcc(id: FaceAccId): boolean {
    this.audio.unlock()
    if (this.progress.ownedFaceAccs.includes(id)) {
      this.progress.selectedFaceAcc = id
      this.refreshPlayerSprites()
      this.persistSave(true)
      this.audio.playUiClick()
      this.emitHud()
      return true
    }
    const def = getFaceAccById(id)
    if (this.progress.fishBank < def.cost) return false
    this.progress.fishBank -= def.cost
    this.progress.ownedFaceAccs.push(id)
    this.progress.selectedFaceAcc = id
    this.refreshPlayerSprites()
    this.persistSave(true)
    this.audio.playUnlock()
    this.checkAchievements()
    this.emitHud()
    return true
  }

  public startNewGame(): void {
    this.audio.unlock()
    this.audio.playUiClick()
    this.audio.setBgmMode('normal')
    this.refreshPlayerSprites()
    this.isTimeTrial = false
    this.totalRunScore = 0
    const startIdx = Math.max(
      0,
      LEVELS.findIndex((l) => l.id === Math.min(this.progress.unlockedLevel, this.progress.lastPlayedLevel))
    )
    this.progress.lastPlayedLevel = LEVELS[startIdx]!.id
    this.persistSave(false)
    this.loadLevel(startIdx, true)
    this.screen = 'playing'
    this.audio.setBiomeAmbience(this.level.biome)
    this.emitHud()
  }

  public startLevel(levelId: number): void {
    const idx = LEVELS.findIndex((l) => l.id === levelId)
    if (idx < 0) return
    const targetLvl = LEVELS[idx]!
    if (targetLvl.isSecretFinale) {
      if (countRankSLevels(this.progress) < 3) return
    } else if (levelId > this.progress.unlockedLevel) {
      return
    }
    this.audio.unlock()
    this.audio.playUiClick()
    this.audio.setBgmMode('normal')
    this.refreshPlayerSprites()
    this.isTimeTrial = false
    this.totalRunScore = 0
    this.progress.lastPlayedLevel = levelId
    this.persistSave(false)
    this.loadLevel(idx, true)
    this.screen = 'playing'
    this.audio.setBiomeAmbience(this.level.biome)
    this.emitHud()
  }

  public nextLevel(): void {
    this.audio.unlock()
    this.audio.playUiClick()
    const curLvl = LEVELS[this.currentLevelIdx]
    const nextIdx = this.currentLevelIdx + 1
    const nextLvl = LEVELS[nextIdx]
    if (curLvl && curLvl.id === MAIN_LEVEL_COUNT) {
      this.openEndingCutscene()
      return
    }
    if (nextLvl && (!nextLvl.isSecretFinale || countRankSLevels(this.progress) >= 3)) {
      this.audio.setBgmMode('normal')
      this.progress.lastPlayedLevel = nextLvl.id
      this.persistSave(false)
      this.loadLevel(nextIdx, true)
      this.screen = 'playing'
      this.audio.setBiomeAmbience(this.level.biome)
      this.emitHud()
    } else {
      this.openEndingCutscene()
    }
  }

  public openEndingCutscene(): void {
    this.audio.unlock()
    this.screen = 'victory'
    this.epilogueTimer = 0
    this.clearAllInputs()
    this.particles = []
    this.cosmeticParticles = []
    this.afterimages = []
    this.floatingTexts = []
    this.cameraX = 0
    this.cameraY = 0
    this.prepareEpilogueFriends()
    this.audio.setBiomeAmbience('harbor')
    this.audio.setBgmMode('epilogue')
    this.emitHud()
  }

  public restartLevel(): void {
    this.audio.unlock()
    this.audio.playUiClick()
    this.audio.setBgmMode('normal')
    this.totalRunScore = Math.max(0, this.totalRunScore - this.levelScore)
    this.loadLevel(this.currentLevelIdx, true)
    this.screen = 'playing'
    this.audio.setBiomeAmbience(this.level.biome)
    this.emitHud()
  }

  public togglePause(): void {
    if (this.screen === 'playing') {
      this.screen = 'paused'
      this.clearAllInputs()
      this.audio.playUiClick()
      this.emitHud()
    } else if (this.screen === 'paused') {
      this.screen = 'playing'
      this.audio.playUiClick()
      this.emitHud()
    }
  }

  public setTouchInput(
    control: 'left' | 'right' | 'jump' | 'dash' | 'pulse' | 'aegis' | 'nova' | 'mend',
    pressed: boolean
  ): void {
    this.audio.unlock()
    if (control === 'left') this.touchLeft = pressed
    if (control === 'right') this.touchRight = pressed
    if (control === 'jump') this.touchJump = pressed
    if (control === 'dash') this.touchDash = pressed
    if (control === 'pulse') this.touchPulse = pressed
    if (control === 'aegis') this.touchAegis = pressed
    if (control === 'nova') this.touchNova = pressed
    if (control === 'mend') this.touchMend = pressed
  }

  // ============================================================================
  // ACHIEVEMENT & SPECIAL CHARACTER MISSION UNLOCK SYSTEM
  // ============================================================================

  private showToast(notice: ToastNotice): void {
    this.recentToast = notice
    this.toastTimer = 3.8
    this.audio.playUnlock()
    this.emitHud()
  }

  private checkSpecialCharacterMissions(notify = true): void {
    let unlockedAny = false
    for (const ch of CHARACTERS) {
      if (ch.unlockMode !== 'mission') continue
      if (this.progress.unlockedCharacters.includes(ch.id)) continue
      const mission = getCharacterMissionProgress(ch.id, this.progress)
      if (mission.completed) {
        this.progress.unlockedCharacters.push(ch.id)
        unlockedAny = true
        if (notify) {
          this.celebrationCharId = ch.id
          this.audio.playCampCharacterVoice(ch.id)
          this.showToast({
            icon: '🏆',
            label: 'KARAKTER SPESIAL TERBUKA!',
            title: ch.name
          })
        }
      }
    }
    if (unlockedAny) {
      this.persistSave(notify)
    }
  }

  private checkAchievements(): void {
    this.checkSpecialCharacterMissions(true)

    const newlyUnlocked = evaluateStampAchievements(this.progress)
    if (newlyUnlocked.length === 0) return

    for (const def of newlyUnlocked) {
      if (this.progress.unlockedAchievements.includes(def.id)) continue
      this.progress.unlockedAchievements.push(def.id)
      this.progress.hasUnseenStamps = true
      if (def.rewardFish > 0) {
        this.progress.fishBank += def.rewardFish
        this.progress.totalFishEarned += def.rewardFish
      }
      if (def.id === 'lightning-stray' && !this.progress.ownedScarves.includes('lightning')) {
        this.progress.ownedScarves.push('lightning')
      }
      const rewardSuffix = def.rewardCosmeticLabel
        ? `+${def.rewardFish} 🐟 & ${def.rewardCosmeticLabel}`
        : `+${def.rewardFish} 🐟`
      this.showToast({
        icon: def.icon,
        label: `STEMPEL BARU! (${rewardSuffix})`,
        title: def.name
      })
    }
    this.persistSave(true)
    // Re-check in case bonus fish completed a special character mission or fish stamp!
    this.checkSpecialCharacterMissions(true)
    this.emitHud()
  }

  // ============================================================================
  // INITIALIZATION & LEVEL LOADING
  // ============================================================================

  private createInitialPlayer(lvl: LevelDefinition): PlayerState {
    const startHearts = this.progress.selectedCharacter === 'dog-samoyed' ? 4 : 3
    return {
      x: lvl.spawn.x,
      y: lvl.spawn.y,
      w: 12,
      h: 16,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      jumpsUsed: 0,
      maxJumps: 2,
      dashTimer: 0,
      dashCooldownTimer: 0,
      airDashUsed: false,
      airDashCount: 0,
      afterimageSpawnTimer: 0,
      featherTimer: 0,
      magnetTimer: 0,
      hasBubbleShield: false,
      hasFrostShield: this.progress.selectedCharacter === 'bear-polar',
      mooncakeTimer: 0,
      yarnTimer: 0,
      mochiTimer: 0,
      candyTimer: 0,
      pearlTimer: 0,
      crystalElixirTimer: 0,
      chronoGearTimer: 0,
      eclipseShardTimer: 0,
      cometChargeTimer: 0,
      moonlightFeatherTimer: 0,
      starlightPulseCooldown: 0,
      astralAegisTimer: 0,
      astralAegisCooldown: 0,
      starfallNovaCooldown: 0,
      lunarMendCooldown: 0,
      lunarMendUsesLeft: LUNAR_MEND_MAX_USES,
      idleDuration: 0,
      hearts: startHearts,
      maxHearts: startHearts,
      invincibleTimer: 0,
      animTimer: 0,
      blinkTimer: 2.5,
      safeX: lvl.spawn.x,
      safeY: lvl.spawn.y,
      standingMovingPlatformIdx: -1
    }
  }

  private placeTitlePose(): void {
    // Perched prominently at ~1.67x scale on the open right-side scenic Camp Hub
    this.player.x = 278
    this.player.y = 148
    this.player.vx = 0
    this.player.vy = 0
    this.player.facing = -1
    this.player.onGround = true
    this.campReaction = 'none'
    this.campReactionTimer = 0
    this.campHopOffset = 0
    this.cameraX = 0
    this.cameraY = 0
    this.prepareCampFriends()
  }

  private loadLevel(idx: number, resetScore: boolean): void {
    this.currentLevelIdx = idx
    this.level = LEVELS[idx]!
    if (resetScore) {
      this.levelScore = 0
    }
    this.player = this.createInitialPlayer(this.level)
    this.cameraX = 0
    this.cameraY = 0
    this.cameraTargetY = 0
    this.knockbackTimer = 0
    this.npcGreeted = false
    this.particles = []
    this.cosmeticParticles = []
    this.afterimages = []
    this.floatingTexts = []
    this.lastDashReady = true
    this.lastIsDashing = false
    this.lastStageRating = 1
    this.justEarnedThreeStarBonus = false
    this.tookDamageThisLevel = false
    this.touchedEnemyThisLevel = false
    this.runElapsedMs = 0
    this.lastSpeedrunRank = 'C'
    this.isNewBestTime = false
    this.lastRankRewardBreakdown = []
    this.lastRankRewardTotal = 0
    this.lastCoinBreakdown = {
      starsCoins: 0,
      firstClearCoins: 0,
      rankCoins: 0,
      foragerCoins: 0,
      bossCoins: 0,
      threeStarCoins: 0,
      totalCoins: 0
    }
    this.playerEmote = 'none'
    this.playerEmoteTimer = 0
    this.bossArenaAlerted = false
    this.timeTrialElapsedMs = 0
    this.lastTimeTrialMedal = 'none'
    this.isNewTimeRecord = false

    const savedShards = this.progress.collectedShards[this.level.id] ?? [false, false, false]
    this.shards = (this.level.shards ?? []).map((sh) => ({
      ...sh,
      collected: false,
      previouslyCollected: Boolean(savedShards[sh.index]),
      phase: sh.index * 1.4
    }))

    // Record visited biome for 'world-explorer' achievement
    if (!this.progress.visitedBiomes.includes(this.level.biome)) {
      this.progress.visitedBiomes.push(this.level.biome)
      this.persistSave(false)
      this.checkAchievements()
    }

    this.movingPlatforms = this.level.movingPlatforms.map((mp) => ({
      ...mp,
      curX: mp.x,
      curY: mp.y,
      prevX: mp.x,
      prevY: mp.y,
      time: mp.phase ?? 0
    }))

    this.bounceClouds = this.level.bounceClouds.map((bc) => ({
      ...bc,
      squishTimer: 0
    }))

    const rawCps = this.level.checkpoints && this.level.checkpoints.length > 0
      ? this.level.checkpoints
      : [this.level.checkpoint]
    this.checkpoints = rawCps.map((cp) => ({
      ...cp,
      activated: false
    }))
    this.activeCheckpointIdx = -1
    this.standingBoatIdx = -1
    this.standingPerchIdx = -1
    this.standingGearIdx = -1
    this.bossWindPushX = 0
    this.phasingClouds = (this.level.phasingClouds ?? []).map((pc) => ({
      ...pc,
      timer: pc.offset ?? 0,
      phase: 'solid'
    }))
    this.swingingPerches = (this.level.swingingPerches ?? []).map((sp) => {
      const a = Math.sin(sp.phase ?? 0) * sp.ampAngle
      const cx = sp.anchorX + Math.sin(a) * sp.ropeLen - sp.w / 2
      const cy = sp.anchorY + Math.cos(a) * sp.ropeLen
      return {
        ...sp,
        curX: cx,
        curY: cy,
        prevX: cx,
        prevY: cy,
        angle: a,
        time: sp.phase ?? 0
      }
    })
    this.glowMushrooms = (this.level.glowMushrooms ?? []).map((gm) => ({
      ...gm,
      squishTimer: 0,
      glowPulse: 0
    }))
    this.proximityCrystals = (this.level.proximityCrystals ?? []).map((pc) => ({
      ...pc,
      glow: 0.12
    }))
    this.gearPlatforms = (this.level.gearPlatforms ?? []).map((gp) => {
      const ang = gp.phase ?? 0
      const cx = gp.centerX + Math.cos(ang) * gp.orbitRadius - gp.w / 2
      const cy = gp.centerY + Math.sin(ang) * gp.orbitRadius
      return {
        ...gp,
        curX: cx,
        curY: cy,
        prevX: cx,
        prevY: cy,
        angle: ang
      }
    })
    this.bossController = this.level.bossConfig
      ? new BossEncounterController(this.level.bossConfig, this.level.arenaBattleItems)
      : null
    this.starComboCount = 0
    this.starComboTimer = 0
    this.starRingState = 'ready'
    this.starRingTimer = 0
    this.starRingStars = []
    this.fallingEventStars = []
    this.meteorShowerTriggered = false
    this.meteorShowerTimer = 0
    this.meteorSpawnTimer = 0
    this.standingSurface = this.level.platforms[0]?.style ?? 'brick'
    this.footstepTimer = 0
    this.crowFlapCooldown = 0

    // 25% chance to trigger a Dynamic Rare Night Event on real gameplay entry!
    if (resetScore) {
      if (Math.random() < 0.25) {
        this.nightEvent = Math.random() < 0.5 ? 'meteorShower' : 'pinkMoon'
        this.nightEventBannerTimer = 4.4
      } else {
        this.nightEvent = 'none'
        this.nightEventBannerTimer = 0
      }
      this.audio.setBgmBiome(this.level.biome)
      this.audio.setAdaptiveBgmFlags({ lowHealth: false, climaxLayer: false })
    } else {
      this.nightEvent = 'none'
      this.nightEventBannerTimer = 0
    }

    this.secretAlcoves = (this.level.secretAlcoves ?? []).map((sa) => ({
      ...sa,
      alpha: 1,
      discovered: false
    }))

    this.steamVents = (this.level.steamVents ?? []).map((sv) => ({
      ...sv,
      timer: sv.offset ?? 0,
      phase: 'calm'
    }))

    this.hedgehogs = (this.level.hedgehogs ?? []).map((hh) => ({
      ...hh,
      curX: hh.x,
      facing: 1,
      defeated: false
    }))

    this.stormClouds = (this.level.stormClouds ?? []).map((sc) => ({
      ...sc,
      timer: sc.offset ?? 0,
      phase: 'calm'
    }))

    this.swoopCrows = (this.level.swoopCrows ?? []).map((sw) => ({
      ...sw,
      curX: sw.x,
      curY: sw.y,
      state: 'hover',
      stateTimer: 0,
      defeated: false
    }))

    this.crabs = (this.level.crabs ?? []).map((cr) => ({
      ...cr,
      curX: cr.x,
      curY: cr.y,
      vy: 0,
      facing: 1,
      hopCooldown: 1.4 + Math.random() * 1.4,
      defeated: false
    }))

    this.wisps = (this.level.wisps ?? []).map((w) => ({
      ...w,
      curY: w.y,
      time: w.phase ?? 0,
      defeated: false
    }))

    this.powerWires = (this.level.powerWires ?? []).map((pw) => ({
      ...pw,
      sag: 0,
      sagVel: 0
    }))

    this.fragileBranches = (this.level.fragileBranches ?? []).map((fb) => ({
      ...fb,
      curY: fb.y,
      state: 'solid',
      timer: 0
    }))

    this.floatingBoats = (this.level.floatingBoats ?? []).map((bo) => ({
      ...bo,
      curX: bo.x,
      curY: bo.y,
      prevX: bo.x,
      prevY: bo.y,
      time: bo.phase ?? 0
    }))

    this.collectibles = this.level.collectibles.map((c, i) => ({
      ...c,
      id: i,
      curX: c.x,
      curY: c.y,
      collected: false,
      phase: i * 0.75
    }))

    this.powerUps = this.level.powerUps.map((pu, i) => ({
      ...pu,
      id: i,
      collected: false,
      phase: i * 1.15
    }))

    this.crows = this.level.crows.map((cr) => ({
      ...cr,
      curX: cr.x,
      curY: cr.y,
      facing: 1,
      time: cr.phase ?? 0,
      defeated: false
    }))

    this.lanterns = this.level.lanterns.map((lan) => ({
      ...lan,
      swayOffset: 0,
      swayVel: 0,
      sparkCooldown: 0
    }))

    this.generateAmbientCritters()
    this.generateRooftopProps()
  }

  private generateAmbientCritters(): void {
    const rng = createRng(7711 + this.level.id * 131)
    const biome = this.level.biome
    const kind: 'bird' | 'butterfly' = biome === 'sakura' || biome === 'cloudland' ? 'butterfly' : 'bird'
    const critters: AmbientCritter[] = []

    for (const plat of this.level.platforms) {
      if (plat.w < 96 || critters.length >= 6) continue
      if (rng() > 0.65) continue
      const cx = Math.round(plat.x + 24 + rng() * Math.max(8, plat.w - 48))
      // Keep clear of spawn and portal
      if (Math.abs(cx - this.level.spawn.x) < 64) continue
      if (Math.abs(cx - this.level.portal.x) < 64) continue

      const color =
        kind === 'butterfly'
          ? biome === 'sakura'
            ? rng() > 0.5
              ? '#ffb3dc'
              : '#fff0a8'
            : rng() > 0.5
              ? '#a8f0ff'
              : '#e6c2ff'
          : biome === 'harbor'
            ? '#dceeff'
            : '#4a3d70'
      const accent =
        kind === 'butterfly'
          ? '#ffffff'
          : biome === 'harbor'
            ? '#ffe082'
            : '#ffe475'

      critters.push({
        x: cx,
        y: plat.y - (kind === 'butterfly' ? 10 : 6),
        baseY: plat.y - (kind === 'butterfly' ? 10 : 6),
        kind,
        state: 'perched',
        vx: 0,
        vy: 0,
        facing: rng() > 0.5 ? 1 : -1,
        phase: rng() * Math.PI * 2,
        color,
        accent,
        gone: false
      })
    }
    this.critters = critters
  }

  private generateRooftopProps(): void {
    const rng = createRng(4040 + this.level.id * 97)
    const props: RooftopProp[] = []
    const branches: UnderLedgeBranch[] = []
    if (this.level.biome === 'cloudland') {
      this.rooftopProps = []
      this.sakuraBranches = []
      return
    }

    const flowerKinds: RooftopProp['kind'][] =
      this.level.biome === 'sakura'
        ? ['flowerPink', 'flowerPink', 'flowerGold']
        : this.level.biome === 'harbor'
          ? ['flowerBlue', 'flowerGold']
          : ['flowerPink', 'flowerBlue', 'flowerGold']

    const isClearZone = (px: number, py: number, pw: number) => {
      for (const pud of this.level.puddles) {
        if (Math.abs(pud.y - py) < 16 && px + pw > pud.x - 4 && px < pud.x + pud.w + 4) return false
      }
      for (const lan of this.level.lanterns) {
        if (Math.abs(lan.y + 20 - py) < 16 && px + pw > lan.x - 4 && px < lan.x + 16) return false
      }
      for (const bc of this.level.bounceClouds) {
        if (Math.abs(bc.y + 10 - py) < 18 && px + pw > bc.x - 4 && px < bc.x + bc.w + 4) return false
      }
      if (this.level.tutorialSigns) {
        for (const s of this.level.tutorialSigns) {
          if (px + pw > s.x - 16 && px < s.x + 48) return false
        }
      }
      for (const cp of this.checkpoints) {
        if (px + pw > cp.x - 6 && px < cp.x + 20) return false
      }
      if (px + pw > this.level.npc.x - 6 && px < this.level.npc.x + 22) return false
      const portal = this.level.portal
      if (px + pw > portal.x - 10 && px < portal.x + 42) return false
      return true
    }

    for (const plat of this.level.platforms) {
      if (plat.h < 24) {
        const fx = Math.round(plat.x + 10 + rng() * Math.max(4, plat.w - 24))
        props.push({
          x: fx,
          y: plat.y - 7,
          kind: flowerKinds[Math.floor(rng() * flowerKinds.length)]!
        })
        continue
      }

      if (plat.w >= 112) {
        const fenceX = Math.round(plat.x + 28 + rng() * Math.max(8, plat.w - 78))
        if (isClearZone(fenceX, plat.y, 32)) {
          props.push({ x: fenceX, y: plat.y - 10, kind: 'fence' })
          if (plat.w >= 144 && isClearZone(fenceX + 16, plat.y, 16)) {
            props.push({ x: fenceX + 16, y: plat.y - 10, kind: 'fence' })
          }
        }
      }

      const flowerCount = Math.max(1, Math.floor(plat.w / 54))
      for (let i = 0; i < flowerCount; i++) {
        const fx = Math.round(plat.x + 8 + rng() * Math.max(6, plat.w - 18))
        if (isClearZone(fx, plat.y, 6)) {
          props.push({
            x: fx,
            y: plat.y - 7,
            kind: flowerKinds[Math.floor(rng() * flowerKinds.length)]!
          })
        }
      }

      // Modern 16-Bit extra cozy props per biome (rooftop potted plants, harbor mooring bollards, hanging sakura twigs)
      if (this.level.biome === 'rooftops' && plat.w >= 96) {
        const potX = Math.round(plat.x + 14 + rng() * Math.max(6, plat.w - 32))
        if (isClearZone(potX, plat.y, 10)) {
          props.push({ x: potX, y: plat.y - 10, kind: 'pottedPlant', modernOnly: true })
        }
      } else if (this.level.biome === 'harbor' && plat.w >= 88) {
        const postX = Math.round(plat.x + 12 + rng() * Math.max(6, plat.w - 28))
        if (isClearZone(postX, plat.y, 10)) {
          props.push({ x: postX, y: plat.y - 10, kind: 'harborPost', modernOnly: true })
        }
      } else if (this.level.biome === 'sakura' && plat.w >= 64) {
        branches.push({ x: Math.round(plat.x + 10), y: Math.round(plat.y + 15) })
        if (plat.w >= 128) {
          branches.push({ x: Math.round(plat.x + plat.w - 30), y: Math.round(plat.y + 15) })
        }
      }
    }

    this.rooftopProps = props
    this.sakuraBranches = branches
  }

  private generateBackgroundScenery(): void {
    const rng = createRng(90210)
    const starColors = ['#fffbe6', '#dfd9ff', '#ffe29c', '#b7e0ff', '#ffcce6']
    this.bgStars = []
    for (let i = 0; i < 120; i++) {
      this.bgStars.push({
        x: Math.floor(rng() * 760),
        y: Math.floor(5 + rng() * 114),
        size: rng() > 0.8 ? 2 : 1,
        cross: rng() > 0.82,
        phase: rng() * Math.PI * 2,
        speed: 0.55 + rng() * 0.85,
        color: starColors[Math.floor(rng() * starColors.length)]!
      })
    }

    this.bgClouds = [
      { x: 24, y: 24, w: 54, h: 12, speed: 1.1, tier: 'high' },
      { x: 158, y: 40, w: 68, h: 14, speed: 0.85, tier: 'low' },
      { x: 290, y: 20, w: 46, h: 10, speed: 1.25, tier: 'high' },
      { x: 404, y: 54, w: 60, h: 12, speed: 0.75, tier: 'low' },
      { x: 528, y: 30, w: 52, h: 12, speed: 1.0, tier: 'high' }
    ]

    this.deepBuildings = []
    let dx = -20
    while (dx < 820) {
      const w = 26 + Math.floor(rng() * 38)
      const h = 62 + Math.floor(rng() * 58)
      const roll = rng()
      const roof = roll < 0.4 ? 'flat' : roll < 0.75 ? 'gable' : 'spire'
      this.deepBuildings.push({ x: dx, w, h, roof, windows: [] })
      dx += w - 4 + Math.floor(rng() * 10)
    }

    this.farBuildings = []
    let fx = -20
    while (fx < 920) {
      const w = 24 + Math.floor(rng() * 34)
      const h = 46 + Math.floor(rng() * 54)
      const roofRoll = rng()
      const roof = roofRoll < 0.45 ? 'flat' : roofRoll < 0.8 ? 'gable' : 'spire'
      const windows: { rx: number; ry: number; color: string }[] = []
      for (let wy = 10; wy < h - 14; wy += 9) {
        for (let wx = 4; wx < w - 5; wx += 7) {
          if (rng() > 0.78) {
            windows.push({
              rx: wx,
              ry: wy,
              color: rng() > 0.5 ? '#c7a4ff' : '#ffd28a'
            })
          }
        }
      }
      this.farBuildings.push({ x: fx, w, h, roof, windows })
      fx += w - 2 + Math.floor(rng() * 8)
    }

    this.midBuildings = []
    let mx = -24
    while (mx < 1160) {
      const w = 30 + Math.floor(rng() * 44)
      const h = 32 + Math.floor(rng() * 44)
      const roof = rng() > 0.52 ? 'gable' : 'flat'
      const windows: { rx: number; ry: number; color: string }[] = []
      for (let wy = 8; wy < h - 10; wy += 10) {
        for (let wx = 5; wx < w - 6; wx += 8) {
          if (rng() > 0.64) {
            windows.push({
              rx: wx,
              ry: wy,
              color: rng() > 0.3 ? '#ffd873' : '#ffa14a'
            })
          }
        }
      }
      this.midBuildings.push({ x: mx, w, h, roof, windows })
      mx += w + 2 + Math.floor(rng() * 14)
    }
  }

  // ============================================================================
  // UNIVERSAL KEYBOARD HANDLING & ANTI-STUCK PROTECTION
  // ============================================================================

  private handleKeyDown(e: KeyboardEvent): void {
    // Allow normal typing / copy-paste inside Save Code inputs without triggering game hotkeys
    const target = e.target as HTMLElement | null
    if (
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    ) {
      return
    }

    this.audio.unlock()
    const code = e.code

    if (
      [
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Space',
        'KeyW',
        'KeyA',
        'KeyD',
        'KeyZ',
        'KeyX',
        'KeyK',
        'ShiftLeft',
        'ShiftRight'
      ].includes(code)
    ) {
      e.preventDefault()
    }

    if (code === 'KeyA' || code === 'ArrowLeft') this.keyLeft = true
    if (code === 'KeyD' || code === 'ArrowRight') this.keyRight = true
    if (code === 'KeyW' || code === 'ArrowUp' || code === 'Space' || code === 'KeyZ') {
      this.keyJump = true
    }
    if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyX' || (!this.bossController && code === 'KeyK')) {
      this.keyDash = true
    }
    if (code === 'KeyC' || code === 'KeyJ') {
      this.keyPulse = true
    }
    if (code === 'KeyV' || (this.bossController && code === 'KeyK')) {
      this.keyAegis = true
    }
    if (code === 'KeyQ' || code === 'KeyU') {
      this.keyNova = true
    }
    if (code === 'KeyH' || code === 'KeyL') {
      this.keyMend = true
    }

    if (code === 'KeyP' || code === 'Escape') {
      if (this.screen === 'photoMode') {
        e.preventDefault()
        this.exitPhotoMode()
      } else if (this.screen === 'playing' || this.screen === 'paused') {
        e.preventDefault()
        this.togglePause()
      } else if (
        this.screen === 'levelSelect' ||
        this.screen === 'characters' ||
        this.screen === 'shop' ||
        this.screen === 'achievements' ||
        this.screen === 'photoStudio' ||
        this.screen === 'guidebook' ||
        this.screen === 'settings'
      ) {
        e.preventDefault()
        this.openTitle()
      }
    } else if (code === 'KeyR' && (this.screen === 'playing' || this.screen === 'paused' || this.screen === 'gameOver')) {
      e.preventDefault()
      this.restartLevel()
    } else if (code === 'KeyM') {
      e.preventDefault()
      this.toggleMute()
    } else if (code === 'KeyE' && this.screen === 'playing') {
      e.preventDefault()
      this.triggerManualEmote()
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const code = e.code
    if (code === 'KeyA' || code === 'ArrowLeft') this.keyLeft = false
    if (code === 'KeyD' || code === 'ArrowRight') this.keyRight = false
    if (code === 'KeyW' || code === 'ArrowUp' || code === 'Space' || code === 'KeyZ') {
      this.keyJump = false
    }
    if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyX' || code === 'KeyK') {
      this.keyDash = false
    }
    if (code === 'KeyC' || code === 'KeyJ') {
      this.keyPulse = false
    }
    if (code === 'KeyV' || code === 'KeyK') {
      this.keyAegis = false
    }
    if (code === 'KeyQ' || code === 'KeyU') {
      this.keyNova = false
    }
    if (code === 'KeyH' || code === 'KeyL') {
      this.keyMend = false
    }
  }

  private clearAllInputs(): void {
    this.keyLeft = false
    this.keyRight = false
    this.keyJump = false
    this.keyDash = false
    this.keyPulse = false
    this.keyAegis = false
    this.keyNova = false
    this.keyMend = false
    this.touchLeft = false
    this.touchRight = false
    this.touchJump = false
    this.touchDash = false
    this.touchPulse = false
    this.touchAegis = false
    this.touchNova = false
    this.touchMend = false
    this.prevJumpHeld = false
    this.prevDashHeld = false
    this.prevPulseHeld = false
    this.prevAegisHeld = false
    this.prevNovaHeld = false
    this.prevMendHeld = false
  }

  private sampleInputs(): void {
    const jumpHeld = this.keyJump || this.touchJump
    const dashHeld = this.keyDash || this.touchDash
    const pulseHeld = this.keyPulse || this.touchPulse
    const aegisHeld = this.keyAegis || this.touchAegis
    const novaHeld = this.keyNova || this.touchNova
    const mendHeld = this.keyMend || this.touchMend
    this.input = {
      left: this.keyLeft || this.touchLeft,
      right: this.keyRight || this.touchRight,
      jumpHeld,
      jumpJustPressed: jumpHeld && !this.prevJumpHeld,
      dashHeld,
      dashJustPressed: dashHeld && !this.prevDashHeld,
      pulseJustPressed: pulseHeld && !this.prevPulseHeld,
      aegisJustPressed: aegisHeld && !this.prevAegisHeld,
      novaJustPressed: novaHeld && !this.prevNovaHeld,
      mendJustPressed: mendHeld && !this.prevMendHeld
    }
    this.prevJumpHeld = jumpHeld
    this.prevDashHeld = dashHeld
    this.prevPulseHeld = pulseHeld
    this.prevAegisHeld = aegisHeld
    this.prevNovaHeld = novaHeld
    this.prevMendHeld = mendHeld
  }

  // ============================================================================
  // UPDATE LOOP
  // ============================================================================

  private update(dt: number): void {
    this.worldTime += dt
    this.updateShootingStar(dt)
    this.spawnAmbientWorldParticles()

    // Gentle quick veil fade-out after instant graphics style switch
    if (this.styleFadeTimer > 0) {
      this.styleFadeTimer = Math.max(0, this.styleFadeTimer - dt)
    }

    if (this.toastTimer > 0) {
      this.toastTimer = Math.max(0, this.toastTimer - dt)
      if (this.toastTimer === 0 && this.recentToast) {
        this.recentToast = null
        this.emitHud()
      }
    }

    if (this.playerEmoteTimer > 0) {
      this.playerEmoteTimer = Math.max(0, this.playerEmoteTimer - dt)
      if (this.playerEmoteTimer === 0) {
        this.playerEmote = 'none'
      }
    }

    if (this.screen !== 'playing') {
      if (this.screen === 'title') {
        if (this.campFriendEmoteTimer > 0) {
          this.campFriendEmoteTimer = Math.max(0, this.campFriendEmoteTimer - dt)
          if (this.campFriendEmoteTimer === 0) {
            this.campFriendEmote = 'none'
            this.campFriendEmoteIdx = -1
          }
        } else if (this.campFriends.length > 0) {
          this.campAmbientEmoteTimer -= dt
          if (this.campAmbientEmoteTimer <= 0) {
            this.campAmbientEmoteTimer = 3.6 + Math.random() * 2.2
            const pool: PostcardEmoteId[] = ['heart', 'music', 'sleep', 'star']
            this.campFriendEmoteIdx = Math.floor(Math.random() * this.campFriends.length)
            this.campFriendEmote = pool[Math.floor(Math.random() * pool.length)]!
            this.campFriendEmoteTimer = 2.0
          }
        }
      }
      if (this.screen === 'victory') {
        this.epilogueTimer += dt
        this.spawnEpilogueParticles()
      }
      if (this.screen === 'title' && this.campReactionTimer > 0) {
        this.campReactionTimer = Math.max(0, this.campReactionTimer - dt)
        if (this.campReaction === 'hop') {
          const prog = 1 - this.campReactionTimer / 1.15
          const hopHeight = this.progress.reduceMotion ? 4 : 11
          this.campHopOffset = Math.round(Math.sin(prog * Math.PI) * hopHeight)
        } else {
          this.campHopOffset = 0
        }
        if (this.campReactionTimer === 0) {
          this.campReaction = 'none'
          this.campHopOffset = 0
        }
      }
      if (this.screen === 'title') {
        for (const fr of this.campFriends) {
          if (fr.reactionTimer > 0) {
            fr.reactionTimer = Math.max(0, fr.reactionTimer - dt)
            if (fr.reaction === 'hop') {
              const prog = 1 - fr.reactionTimer / 1.1
              const hopH = this.progress.reduceMotion ? 3 : 8
              fr.hopOffset = Math.round(Math.sin(prog * Math.PI) * hopH)
            } else {
              fr.hopOffset = 0
            }
            if (fr.reactionTimer === 0) {
              fr.reaction = 'none'
              fr.hopOffset = 0
            }
          }
        }
      }
      if (this.screen !== 'photoMode') {
        this.player.animTimer += dt
        this.player.blinkTimer -= dt
        if (this.player.blinkTimer <= -0.14) {
          this.player.blinkTimer = 2.6 + Math.random() * 2.4
        }
        this.updateParticles(dt)
        this.updateCosmeticTrailParticles(dt)
        this.updateAfterimages(dt)
        this.updateFloatingTexts(dt)
      }
      return
    }

    this.sampleInputs()

    this.runElapsedMs += dt * 1000
    if (this.isTimeTrial) {
      this.timeTrialElapsedMs += dt * 1000
    }

    if (this.starComboTimer > 0) {
      this.starComboTimer = Math.max(0, this.starComboTimer - dt)
      if (this.starComboTimer === 0 && this.starComboCount > 0) {
        this.starComboCount = 0
        this.emitHud()
      }
    }

    if (this.nightEventBannerTimer > 0) {
      this.nightEventBannerTimer = Math.max(0, this.nightEventBannerTimer - dt)
      if (this.nightEventBannerTimer === 0) {
        this.emitHud()
      }
    }

    if (this.crowFlapCooldown > 0) {
      this.crowFlapCooldown = Math.max(0, this.crowFlapCooldown - dt)
    }

    this.updateMovingPlatforms(dt)
    this.updateSpecialPlatforms(dt)
    this.updateBounceClouds(dt)
    this.updateCrows(dt)
    this.updateBiomeHazards(dt)
    this.updatePlayer(dt)
    this.updateBossEncounter(dt)
    this.updateInteractiveProps(dt)
    this.updateSecretAlcoves(dt)
    this.updateStarRingChallenge(dt)
    this.updateNightEvents(dt)
    this.checkCheckpoint()
    this.checkPowerUps()
    this.updateShards()
    this.updateMagnetAndCollectibles(dt)
    this.checkNpcGreeting()
    this.checkHazards()
    this.checkPortal()
    this.syncAdaptiveAudio()
    this.updateCamera(dt)
    this.updateParticles(dt)
    this.updateCosmeticTrailParticles(dt)
    this.updateAfterimages(dt)
    this.updateFloatingTexts(dt)

    const dashReady = this.isDashReady()
    const isDashing = this.player.dashTimer > 0
    const hasActiveTimers =
      this.isTimeTrial ||
      this.progress.showSpeedrunTimer ||
      this.starComboTimer > 0 ||
      this.starRingState === 'active' ||
      this.meteorShowerTimer > 0 ||
      this.player.dashCooldownTimer > 0 ||
      this.player.featherTimer > 0 ||
      this.player.magnetTimer > 0 ||
      this.player.mooncakeTimer > 0 ||
      this.player.yarnTimer > 0 ||
      this.player.mochiTimer > 0 ||
      this.player.candyTimer > 0 ||
      this.player.pearlTimer > 0 ||
      this.player.crystalElixirTimer > 0 ||
      this.player.chronoGearTimer > 0 ||
      this.player.eclipseShardTimer > 0 ||
      this.player.cometChargeTimer > 0 ||
      this.player.moonlightFeatherTimer > 0 ||
      this.player.starlightPulseCooldown > 0 ||
      this.player.astralAegisTimer > 0 ||
      this.player.astralAegisCooldown > 0 ||
      this.player.starfallNovaCooldown > 0 ||
      this.player.lunarMendCooldown > 0 ||
      Boolean(this.bossController)

    this.hudSyncTimer += dt
    if (
      dashReady !== this.lastDashReady ||
      isDashing !== this.lastIsDashing ||
      (hasActiveTimers && this.hudSyncTimer >= 0.08)
    ) {
      this.lastDashReady = dashReady
      this.lastIsDashing = isDashing
      this.hudSyncTimer = 0
      this.emitHud()
    }
  }

  private isDashReady(): boolean {
    const p = this.player
    if (p.dashTimer > 0) return false
    // Rainbow Star Candy removes cooldown & allows unlimited Air-Dash!
    if (p.candyTimer > 0) return true
    if (p.dashCooldownTimer > 0) return false
    const maxAirDashes = this.progress.selectedCharacter === 'fox-kitsune' ? 2 : 1
    if (!p.onGround && p.airDashCount >= maxAirDashes) return false
    return true
  }

  private getBuffDurationMultiplier(): number {
    const charId = this.progress.selectedCharacter
    if (charId === 'cat-blue') return 1.2 // Kucing Abu-Abu: +20% durasi semua power-up!
    if (charId === 'bear-sun') return 1.15 // Beruang Madu (Spesial): +15% durasi semua power-up!
    return 1.0
  }

  private updateShootingStar(dt: number): void {
    if (this.shootingStar) {
      this.shootingStar.x += this.shootingStar.vx * dt
      this.shootingStar.y += this.shootingStar.vy * dt
      this.shootingStar.life -= dt
      if (this.shootingStar.life <= 0) {
        this.shootingStar = null
        this.shootingStarCooldown = 4.5 + Math.random() * 6
      }
    } else {
      this.shootingStarCooldown -= dt
      if (this.shootingStarCooldown <= 0) {
        this.shootingStar = {
          x: 60 + Math.random() * 240,
          y: 10 + Math.random() * 44,
          vx: 145 + Math.random() * 55,
          vy: 42 + Math.random() * 24,
          life: 0.65,
          maxLife: 0.65
        }
      }
    }
  }

  private updateMovingPlatforms(dt: number): void {
    for (const mp of this.movingPlatforms) {
      mp.prevX = mp.curX
      mp.prevY = mp.curY
      mp.time += dt * mp.speed
      const t = (Math.sin(mp.time) + 1) * 0.5
      mp.curX = mp.x + mp.dx * t
      mp.curY = mp.y + mp.dy * t
    }
  }

  private updateBounceClouds(dt: number): void {
    for (const bc of this.bounceClouds) {
      if (bc.squishTimer > 0) {
        bc.squishTimer = Math.max(0, bc.squishTimer - dt)
      }
    }
  }

  private updateInteractiveProps(dt: number): void {
    const p = this.player
    const px = p.x + p.w / 2
    const py = p.y + p.h / 2

    // 1. Cozy Swinging Lanterns (max 2-3px gentle sway + warm golden sparks when jumping/dashing past!)
    for (const lan of this.lanterns) {
      if (lan.sparkCooldown > 0) lan.sparkCooldown = Math.max(0, lan.sparkCooldown - dt)
      const lx = lan.x + 6
      const ly = lan.y + 8
      const distX = Math.abs(px - lx)
      const distY = Math.abs(py - ly)
      const movingFast = p.dashTimer > 0 || Math.abs(p.vy) > 45 || Math.abs(p.vx) > 65

      if (distX < 22 && distY < 26 && movingFast && lan.sparkCooldown <= 0) {
        const pushDir = p.vx !== 0 ? (p.vx > 0 ? 1 : -1) : p.facing
        const impulse = p.dashTimer > 0 ? 18 : 11
        lan.swayVel = Math.max(-22, Math.min(22, lan.swayVel + pushDir * impulse))
        lan.sparkCooldown = 0.42
        // Warm golden sparkle puff around swaying lantern
        const count = this.isModern ? 6 : 4
        for (let i = 0; i < count; i++) {
          this.particles.push({
            x: lx + (Math.random() - 0.5) * 10,
            y: ly + (Math.random() - 0.5) * 6,
            vx: pushDir * (8 + Math.random() * 14) + (Math.random() - 0.5) * 12,
            vy: -10 - Math.random() * 14,
            life: 0.45 + Math.random() * 0.3,
            maxLife: 0.75,
            size: i % 2 === 0 ? 2 : 1,
            color: i % 3 === 0 ? '#ffffff' : i % 2 === 0 ? '#ffe885' : '#ffb85c',
            kind: 'spark'
          })
        }
      }

      // Smooth damped spring capped at ±2.6px so it feels calm and cozy (zero motion sickness)
      lan.swayVel += -lan.swayOffset * 26 * dt
      lan.swayVel *= Math.exp(-3.6 * dt)
      lan.swayOffset = Math.max(-2.6, Math.min(2.6, lan.swayOffset + lan.swayVel * dt))
      if (Math.abs(lan.swayOffset) < 0.04 && Math.abs(lan.swayVel) < 0.08) {
        lan.swayOffset = 0
        lan.swayVel = 0
      }
    }

    // 2. Cozy Background Critters (night birds & glowing butterflies fluttering gently upward!)
    for (const cr of this.critters) {
      if (cr.gone) continue
      if (cr.state === 'perched') {
        const dx = Math.abs(px - cr.x)
        const dy = Math.abs(py - cr.y)
        if (dx < 50 && dy < 44) {
          cr.state = 'flying'
          cr.facing = px <= cr.x ? 1 : -1
          cr.vx = cr.facing * (cr.kind === 'butterfly' ? 18 : 28)
          cr.vy = cr.kind === 'butterfly' ? -24 : -34
        }
      } else {
        cr.x += cr.vx * dt
        cr.y += cr.vy * dt + Math.sin(this.worldTime * 6 + cr.phase) * 8 * dt
        if (this.isModern && cr.kind === 'butterfly' && Math.random() < 0.14) {
          this.particles.push({
            x: cr.x,
            y: cr.y,
            vx: (Math.random() - 0.5) * 6,
            vy: 4,
            life: 0.45,
            maxLife: 0.45,
            size: 1,
            color: cr.color,
            kind: 'glint'
          })
        }
        if (cr.y < -18) {
          cr.gone = true
        }
      }
    }
  }

  private updateSpecialPlatforms(dt: number): void {
    // 1. Rooftop Bouncy Power Wires (smooth spring oscillation after bounce)
    for (const pw of this.powerWires) {
      if (Math.abs(pw.sag) > 0.05 || Math.abs(pw.sagVel) > 0.05) {
        pw.sagVel += -pw.sag * 52 * dt
        pw.sagVel *= Math.exp(-5.5 * dt)
        pw.sag = Math.max(-3, Math.min(8, pw.sag + pw.sagVel * dt))
      } else {
        pw.sag = 0
        pw.sagVel = 0
      }
    }

    // 2. Sakura Fragile Branches (quiver 1.0s when stepped on -> sink slowly -> gently respawn after 3.2s)
    for (const fb of this.fragileBranches) {
      if (fb.state === 'shaking') {
        fb.timer -= dt
        if (fb.timer <= 0) {
          fb.state = 'falling'
          fb.timer = 1.1
        }
      } else if (fb.state === 'falling') {
        fb.curY += 68 * dt
        fb.timer -= dt
        if (fb.timer <= 0 || fb.curY > VIEW_H + 24) {
          fb.state = 'gone'
          fb.timer = 2.5
        }
      } else if (fb.state === 'gone') {
        fb.timer -= dt
        if (fb.timer <= 0) {
          fb.state = 'solid'
          fb.curY = fb.y
        }
      }
    }

    // 3. Harbor Floating Wooden Boats (calm horizontal drift + gentle 1.5px water rock)
    for (const bo of this.floatingBoats) {
      bo.prevX = bo.curX
      bo.prevY = bo.curY
      bo.time += dt * bo.speed
      const t = (Math.sin(bo.time) + 1) * 0.5
      bo.curX = bo.x + bo.dx * t
      bo.curY = bo.y + Math.sin(this.worldTime * 2.1 + (bo.phase ?? 0)) * 1.5
    }

    // 4. Cloudland Phasing Star Clouds (rhythmic solid -> warn -> phased beat!)
    for (const pc of this.phasingClouds) {
      pc.timer = (pc.timer + dt) % pc.period
      const solidEnd = pc.period * 0.52
      const warnEnd = pc.period * 0.72
      if (pc.timer < solidEnd) {
        pc.phase = 'solid'
      } else if (pc.timer < warnEnd) {
        pc.phase = 'warn'
      } else {
        pc.phase = 'phased'
      }
    }

    // 5. Harbor Swinging Lantern Perches (smooth horizontal pendulum!)
    for (const sp of this.swingingPerches) {
      sp.prevX = sp.curX
      sp.prevY = sp.curY
      sp.time += dt * sp.speed
      sp.angle = Math.sin(sp.time) * sp.ampAngle
      sp.curX = sp.anchorX + Math.sin(sp.angle) * sp.ropeLen - sp.w / 2
      sp.curY = sp.anchorY + Math.cos(sp.angle) * sp.ropeLen
    }

    // 6. Cavern Elastic Glow-Mushrooms & Proximity Crystals
    for (const gm of this.glowMushrooms) {
      if (gm.squishTimer > 0) gm.squishTimer = Math.max(0, gm.squishTimer - dt)
      gm.glowPulse = 0.5 + 0.5 * Math.sin(this.worldTime * 2.6 + gm.x * 0.04)
    }
    const pCx = this.player.x + this.player.w / 2
    const pCy = this.player.y + this.player.h / 2
    const crystalBoost = this.player.crystalElixirTimer > 0
    for (const cr of this.proximityCrystals) {
      const dist = Math.hypot(pCx - cr.x, pCy - cr.y)
      const effRadius = crystalBoost ? Math.max(cr.radius * 2.4, 260) : cr.radius
      const targetGlow = crystalBoost && dist < effRadius ? 1.0 : dist < effRadius ? Math.max(0.25, 1 - dist / effRadius) : 0.14
      cr.glow += (targetGlow - cr.glow) * Math.min(1, dt * 4.5)
    }

    // 7. Observatory Rotating Gear Platforms (smooth circular rim carriage!)
    for (const gp of this.gearPlatforms) {
      gp.prevX = gp.curX
      gp.prevY = gp.curY
      gp.angle += dt * gp.speed
      gp.curX = gp.centerX + Math.cos(gp.angle) * gp.orbitRadius - gp.w / 2
      gp.curY = gp.centerY + Math.sin(gp.angle) * gp.orbitRadius
    }
  }

  private updateBiomeHazards(dt: number): void {
    const p = this.player
    const px = p.x + p.w / 2
    const py = p.y + p.h / 2

    // 1. Rooftop Steam Chimneys (calm -> 0.85s vibrating smoke warn -> 1.25s active steam plume)
    for (const sv of this.steamVents) {
      const prevPhase = sv.phase
      sv.timer = (sv.timer + dt) % sv.period
      const warnStart = Math.max(0.4, sv.period - 2.1)
      const activeStart = Math.max(0.8, sv.period - 1.25)
      if (sv.timer >= activeStart) {
        sv.phase = 'active'
        if (prevPhase !== 'active' && Math.abs(sv.x - px) < 185) {
          this.audio.playSteamHiss()
        }
        if (Math.random() < 0.28) {
          this.particles.push({
            x: sv.x + 2 + (Math.random() - 0.5) * 8,
            y: sv.y - 6 - Math.random() * 24,
            vx: (Math.random() - 0.5) * 10,
            vy: -28 - Math.random() * 14,
            life: 0.35,
            maxLife: 0.35,
            size: 2,
            color: Math.random() > 0.4 ? '#fff6f0' : '#d6d4eb',
            kind: 'dust'
          })
        }
      } else if (sv.timer >= warnStart) {
        sv.phase = 'warn'
        if (Math.random() < 0.16) {
          this.particles.push({
            x: sv.x + 2 + (Math.random() - 0.5) * 4,
            y: sv.y - 3,
            vx: (Math.random() - 0.5) * 6,
            vy: -12,
            life: 0.25,
            maxLife: 0.25,
            size: 1,
            color: '#ffe3a8',
            kind: 'dust'
          })
        }
      } else {
        sv.phase = 'calm'
      }
    }

    // 2. Sakura Forest Hedgehogs (patrol wide branches and turn cleanly at edges)
    for (const hh of this.hedgehogs) {
      if (hh.defeated) continue
      hh.curX += hh.facing * hh.speed * dt
      if (hh.curX <= hh.minX) {
        hh.curX = hh.minX
        hh.facing = 1
      } else if (hh.curX >= hh.maxX) {
        hh.curX = hh.maxX
        hh.facing = -1
      }
    }

    // 3. Cloudland Mini Storm Clouds (calm -> 1.0s yellow warning flash -> 0.65s electric spark!)
    for (const sc of this.stormClouds) {
      const prevPhase = sc.phase
      sc.timer = (sc.timer + dt) % sc.period
      const warnStart = Math.max(0.4, sc.period - 1.65)
      const zapStart = Math.max(0.9, sc.period - 0.65)
      if (sc.timer >= zapStart) {
        sc.phase = 'zap'
        if (prevPhase !== 'zap' && Math.abs(sc.x - px) < 195) {
          this.audio.playMiniZap()
        }
      } else if (sc.timer >= warnStart) {
        sc.phase = 'warn'
      } else {
        sc.phase = 'calm'
      }
    }

    // 4. Cloudland Swooping Crows (hover calmly -> 0.4s glint warn -> gentle diagonal glide -> recover)
    for (const sw of this.swoopCrows) {
      if (sw.defeated) continue
      if (sw.state === 'hover') {
        sw.curY = sw.y + Math.sin(this.worldTime * 2.4 + sw.x * 0.03) * 2.5
        const dx = sw.curX - px
        if (Math.abs(dx) < 126 && Math.abs(sw.curY - py) < 92) {
          sw.state = 'warn'
          sw.stateTimer = 0.42
        }
      } else if (sw.state === 'warn') {
        sw.stateTimer -= dt
        if (sw.stateTimer <= 0) {
          sw.state = 'swoop'
          sw.stateTimer = 1.35
          if (this.crowFlapCooldown <= 0) {
            this.audio.playCrowFlap()
            this.crowFlapCooldown = 0.85
          }
        }
      } else if (sw.state === 'swoop') {
        sw.curX += sw.dir * 68 * dt
        sw.curY += 36 * dt
        sw.stateTimer -= dt
        if (sw.stateTimer <= 0 || sw.curY > VIEW_H + 16) {
          sw.state = 'recover'
          sw.stateTimer = 1.4
        }
      } else {
        // Smooth calm glide back to perch
        sw.curX += (sw.x - sw.curX) * Math.min(1, dt * 2.8)
        sw.curY += (sw.y - sw.curY) * Math.min(1, dt * 2.8)
        sw.stateTimer -= dt
        if (sw.stateTimer <= 0) {
          sw.curX = sw.x
          sw.curY = sw.y
          sw.state = 'hover'
        }
      }
    }

    // 5. Harbor Agile Pier Crabs (brisk patrol + periodic cute small hops!)
    for (const cr of this.crabs) {
      if (cr.defeated) continue
      cr.curX += cr.facing * cr.speed * dt
      if (cr.curX <= cr.minX) {
        cr.curX = cr.minX
        cr.facing = 1
      } else if (cr.curX >= cr.maxX) {
        cr.curX = cr.maxX
        cr.facing = -1
      }
      cr.hopCooldown -= dt
      if (cr.hopCooldown <= 0 && cr.curY >= cr.y - 0.5) {
        cr.vy = -105
        cr.hopCooldown = 1.5 + Math.random() * 1.1
      }
      if (cr.vy !== 0 || cr.curY < cr.y) {
        cr.vy += 380 * dt
        cr.curY += cr.vy * dt
        if (cr.curY >= cr.y) {
          cr.curY = cr.y
          cr.vy = 0
        }
      }
    }

    // 6. Harbor Floating Lantern Wisps (smooth sine wave around jump gaps)
    for (const w of this.wisps) {
      if (w.defeated) continue
      w.time += dt * w.speed
      w.curY = w.y + Math.sin(w.time) * w.ampY
    }
  }

  private updateSecretAlcoves(dt: number): void {
    const p = this.player
    for (const sa of this.secretAlcoves) {
      const inside = this.aabbOverlap(p.x - 4, p.y - 4, p.w + 8, p.h + 8, sa.x, sa.y, sa.w, sa.h)
      const targetAlpha = inside ? 0.16 : sa.discovered ? 0.42 : 1.0
      sa.alpha += (targetAlpha - sa.alpha) * Math.min(1, dt * 7)
      if (inside && !sa.discovered) {
        sa.discovered = true
        this.audio.playSecretReveal()
        this.spawnCollectBurst(sa.x + sa.w / 2, sa.y + sa.h / 2, '#ffe885', 14)
        this.floatingTexts.push({
          x: sa.x + sa.w / 2,
          y: sa.y - 2,
          vy: -16,
          text: 'AREA RAHASIA!',
          color: '#ffe885',
          life: 1.25,
          maxLife: 1.25
        })
      }
    }
  }

  private updateStarRingChallenge(dt: number): void {
    const bell = this.level.starRingBell
    if (!bell) return
    const p = this.player

    if (this.starRingState === 'ready') {
      if (this.aabbOverlap(p.x - 2, p.y - 2, p.w + 4, p.h + 4, bell.x, bell.y, 14, 16)) {
        this.starRingState = 'active'
        this.starRingTimer = 6.0
        const cx = bell.x + 6
        const cy = bell.y - 14
        const radius = 36
        this.starRingStars = []
        for (let i = 0; i < 8; i++) {
          const ang = (Math.PI * 2 * i) / 8 - Math.PI / 2
          this.starRingStars.push({
            x: Math.round(cx + Math.cos(ang) * radius - 6),
            y: Math.round(cy + Math.sin(ang) * radius - 6),
            collected: false,
            phase: i * 0.6
          })
        }
        this.audio.playStarRingStart()
        this.spawnCollectBurst(cx, cy + 14, '#ffe475', 12)
        this.floatingTexts.push({
          x: cx,
          y: bell.y - 8,
          vy: -18,
          text: 'LONCENG 8 BINTANG! 6s',
          color: '#ffe875',
          life: 1.3,
          maxLife: 1.3
        })
        this.emitHud()
      }
    } else if (this.starRingState === 'active') {
      this.starRingTimer = Math.max(0, this.starRingTimer - dt)
      let collectedCount = 0
      const reachPad = p.mooncakeTimer > 0 ? 5 : 2
      for (const st of this.starRingStars) {
        if (st.collected) {
          collectedCount += 1
          continue
        }
        if (this.aabbOverlap(p.x - reachPad, p.y - reachPad, p.w + reachPad * 2, p.h + reachPad * 2, st.x, st.y, 12, 12)) {
          st.collected = true
          collectedCount += 1
          const bonusPts = this.nightEvent === 'pinkMoon' ? 19 : 15
          this.levelScore += bonusPts
          this.totalRunScore += bonusPts
          this.updateHighScoreIfNeeded()
          this.audio.playStar(collectedCount)
          this.spawnCollectBurst(st.x + 6, st.y + 6, '#fff4a8', 7)
          this.floatingTexts.push({
            x: st.x + 6,
            y: st.y - 2,
            vy: -18,
            text: `${collectedCount}/8`,
            color: '#ffe875',
            life: 0.7,
            maxLife: 0.7
          })
        }
      }

      if (collectedCount >= this.starRingStars.length) {
        // Completed all 8 stars in time -> spawn +1 Golden Fish right in the center!
        this.starRingState = 'completed'
        this.starRingTimer = 0
        this.starRingStars = []
        this.collectibles.push({
          id: 9000 + this.level.id,
          x: bell.x,
          y: bell.y - 16,
          curX: bell.x,
          curY: bell.y - 16,
          kind: 'fish',
          collected: false,
          phase: 0
        })
        this.audio.playStarRingComplete()
        this.spawnCollectBurst(bell.x + 7, bell.y - 12, '#ffe475', 18)
        this.floatingTexts.push({
          x: bell.x + 7,
          y: bell.y - 24,
          vy: -18,
          text: 'HADIAH +1 🐟!',
          color: '#ffe46b',
          life: 1.4,
          maxLife: 1.4
        })
        this.emitHud()
      } else if (this.starRingTimer <= 0) {
        // Time ran out: gently fade away & allow retrying after 4s cooldown
        this.starRingState = 'cooldown'
        this.starRingTimer = 4.0
        this.starRingStars = []
        this.emitHud()
      }
    } else if (this.starRingState === 'cooldown') {
      this.starRingTimer = Math.max(0, this.starRingTimer - dt)
      if (this.starRingTimer <= 0) {
        this.starRingState = 'ready'
      }
    }
  }

  private updateNightEvents(dt: number): void {
    if (this.nightEvent !== 'meteorShower') return
    const p = this.player

    // Trigger 15-second Meteor Shower around mid-level!
    if (!this.meteorShowerTriggered && p.x >= this.level.width * 0.26) {
      this.meteorShowerTriggered = true
      this.meteorShowerTimer = 15.0
      this.meteorSpawnTimer = 0.2
      this.floatingTexts.push({
        x: p.x + p.w / 2,
        y: p.y - 14,
        vy: -14,
        text: '🌠 HUJAN BINTANG!',
        color: '#ffe894',
        life: 1.5,
        maxLife: 1.5
      })
      this.emitHud()
    }

    if (this.meteorShowerTimer > 0) {
      this.meteorShowerTimer = Math.max(0, this.meteorShowerTimer - dt)
      this.meteorSpawnTimer -= dt
      if (this.meteorSpawnTimer <= 0 && this.fallingEventStars.length < 14) {
        this.meteorSpawnTimer = 0.72 + Math.random() * 0.48
        this.fallingEventStars.push({
          x: this.cameraX + 40 + Math.random() * (this.viewW - 64),
          y: -10,
          vx: 10 + Math.random() * 12,
          vy: 30 + Math.random() * 14,
          phase: Math.random() * Math.PI * 2,
          collected: false
        })
      }
    }

    for (let i = this.fallingEventStars.length - 1; i >= 0; i--) {
      const fs = this.fallingEventStars[i]!
      fs.x += fs.vx * dt
      fs.y += fs.vy * dt
      if (
        !fs.collected &&
        this.aabbOverlap(p.x - 3, p.y - 3, p.w + 6, p.h + 6, fs.x, fs.y, 12, 12)
      ) {
        fs.collected = true
        this.levelScore += 25
        this.totalRunScore += 25
        this.updateHighScoreIfNeeded()
        this.audio.playStar(4)
        this.spawnCollectBurst(fs.x + 6, fs.y + 6, '#ffe885', 10)
        this.floatingTexts.push({
          x: fs.x + 6,
          y: fs.y - 2,
          vy: -20,
          text: '+25 🌠',
          color: '#ffe885',
          life: 0.9,
          maxLife: 0.9
        })
        this.emitHud()
      }
      if (fs.collected || fs.y > VIEW_H + 14 || fs.x > this.cameraX + this.viewW + 64) {
        this.fallingEventStars.splice(i, 1)
      }
    }
  }

  private syncAdaptiveAudio(): void {
    const p = this.player
    this.audio.setBgmBiome(this.level.biome)
    if (p.mooncakeTimer > 0) {
      this.audio.setBgmMode('mooncake')
    } else if (this.starRingState === 'active' || this.isTimeTrial) {
      this.audio.setBgmMode('challenge')
    } else {
      this.audio.setBgmMode('normal')
    }
    const nearPortal = p.x > this.level.width - 540 || (this.level.id === 8 && p.x > this.level.width * 0.62)
    this.audio.setAdaptiveBgmFlags({
      lowHealth: p.hearts === 1,
      climaxLayer: nearPortal
    })
  }

  private updateCrows(dt: number): void {
    const px = this.player.x + this.player.w / 2
    for (const crow of this.crows) {
      if (crow.defeated) continue
      const prevX = crow.curX
      crow.time += dt * crow.speed
      crow.curX = crow.x + Math.sin(crow.time) * crow.rangeX
      crow.curY = crow.y + Math.cos(crow.time * 2) * (crow.waveAmp ?? 3)
      const dx = crow.curX - prevX
      if (Math.abs(dx) > 0.01) {
        crow.facing = dx > 0 ? 1 : -1
      }
      if (this.crowFlapCooldown <= 0 && Math.abs(crow.curX - px) < 62) {
        this.audio.playCrowFlap()
        this.crowFlapCooldown = 1.25
      }
    }
  }

  private updatePlayer(dt: number): void {
    const p = this.player

    if (p.invincibleTimer > 0) p.invincibleTimer = Math.max(0, p.invincibleTimer - dt)
    if (p.dashCooldownTimer > 0) p.dashCooldownTimer = Math.max(0, p.dashCooldownTimer - dt)
    if (p.featherTimer > 0) p.featherTimer = Math.max(0, p.featherTimer - dt)
    if (p.magnetTimer > 0) p.magnetTimer = Math.max(0, p.magnetTimer - dt)
    if (p.mooncakeTimer > 0) p.mooncakeTimer = Math.max(0, p.mooncakeTimer - dt)
    if (p.yarnTimer > 0) p.yarnTimer = Math.max(0, p.yarnTimer - dt)
    if (p.mochiTimer > 0) p.mochiTimer = Math.max(0, p.mochiTimer - dt)
    if (p.candyTimer > 0) p.candyTimer = Math.max(0, p.candyTimer - dt)
    if (p.pearlTimer > 0) p.pearlTimer = Math.max(0, p.pearlTimer - dt)
    if (p.crystalElixirTimer > 0) p.crystalElixirTimer = Math.max(0, p.crystalElixirTimer - dt)
    if (p.chronoGearTimer > 0) p.chronoGearTimer = Math.max(0, p.chronoGearTimer - dt)
    if (p.eclipseShardTimer > 0) p.eclipseShardTimer = Math.max(0, p.eclipseShardTimer - dt)
    if (p.cometChargeTimer > 0) p.cometChargeTimer = Math.max(0, p.cometChargeTimer - dt)
    if (p.moonlightFeatherTimer > 0) p.moonlightFeatherTimer = Math.max(0, p.moonlightFeatherTimer - dt)
    if (p.starlightPulseCooldown > 0) p.starlightPulseCooldown = Math.max(0, p.starlightPulseCooldown - dt)
    if (p.astralAegisTimer > 0) p.astralAegisTimer = Math.max(0, p.astralAegisTimer - dt)
    if (p.astralAegisCooldown > 0) p.astralAegisCooldown = Math.max(0, p.astralAegisCooldown - dt)
    if (p.starfallNovaCooldown > 0) p.starfallNovaCooldown = Math.max(0, p.starfallNovaCooldown - dt)
    if (p.lunarMendCooldown > 0) p.lunarMendCooldown = Math.max(0, p.lunarMendCooldown - dt)
    if (this.knockbackTimer > 0) this.knockbackTimer = Math.max(0, this.knockbackTimer - dt)
    if (this.landingTimer > 0) this.landingTimer = Math.max(0, this.landingTimer - dt)
    this.wasOnGround = p.onGround

    // 13 Individual Unique Character Passives (7 Regular + 6 Upgraded Special Mission Traits!)
    const selectedCharId = this.progress.selectedCharacter
    const isCatMochi = selectedCharId === 'cat-mochi'
    const isCatGinger = selectedCharId === 'cat-ginger'
    const isCatMidnight = selectedCharId === 'cat-midnight'
    const isBunny = selectedCharId === 'bunny-starlight'
    const isShiba = selectedCharId === 'dog-shiba'
    const isSamoyed = selectedCharId === 'dog-samoyed'
    const isWindImmune = isShiba || isSamoyed
    const isBlackBear = selectedCharId === 'bear-black'
    const isBrownFox = selectedCharId === 'fox-brown'
    const isKitsune = selectedCharId === 'fox-kitsune'

    // Yarn Ball OR Moonlight Feather unlocks Triple Jump!
    p.maxJumps = p.yarnTimer > 0 || p.moonlightFeatherTimer > 0 ? 3 : 2
    let baseSpeed = MOVE_SPEED
    if (p.yarnTimer > 0) baseSpeed *= 1.18
    if (p.crystalElixirTimer > 0) baseSpeed *= 1.1 // Crystal Elixir: +10% movement speed!
    if (isCatGinger) baseSpeed *= 1.08 // Kucing Oren (Zoomies): +8% speed!
    if (isBrownFox) baseSpeed *= 1.06 // Rubah Cokelat: +6% speed!
    const airSpeedMult = isCatMochi ? 1.12 : isCatGinger ? 1.08 : 1.0
    const effectiveMoveSpeed = !p.onGround ? Math.round(baseSpeed * airSpeedMult) : Math.round(baseSpeed)
    const effectiveJumpVy = isBunny ? Math.round(JUMP_VY * 1.065) : JUMP_VY // Kelinci Putih (Spesial): +10%+ jump height!
    const effectiveDoubleJumpVy = isBunny ? Math.round(DOUBLE_JUMP_VY * 1.045) : DOUBLE_JUMP_VY
    const effectiveCoyoteTime = isCatMochi ? COYOTE_TIME * 1.35 : COYOTE_TIME
    const effectiveDashDuration = isShiba
      ? DASH_DURATION * 1.2 // Shiba Inu (Spesial): +20% dash distance!
      : isBlackBear
        ? DASH_DURATION * 1.1 // Beruang Hitam: +10% dash distance!
        : isCatMidnight
          ? DASH_DURATION * 1.08 // Kucing Hitam Malam: +8% dash distance!
          : DASH_DURATION
    let effectiveDashCooldown = isShiba
      ? DASH_COOLDOWN * 0.85 // Shiba Inu (Spesial): -15% dash cooldown!
      : isBrownFox
        ? DASH_COOLDOWN * 0.88 // Rubah Cokelat: -12% dash cooldown!
        : DASH_COOLDOWN
    if (p.chronoGearTimer > 0) {
      effectiveDashCooldown *= 0.5 // Roda Waktu Emas: -50% dash cooldown!
    }

    if (p.onGround && p.standingMovingPlatformIdx >= 0 && p.dashTimer <= 0) {
      const mp = this.movingPlatforms[p.standingMovingPlatformIdx]
      if (mp) {
        p.x += mp.curX - mp.prevX
        p.y += mp.curY - mp.prevY
      }
    }

    if (p.onGround && this.standingBoatIdx >= 0 && p.dashTimer <= 0) {
      const bo = this.floatingBoats[this.standingBoatIdx]
      if (bo) {
        p.x += bo.curX - bo.prevX
        p.y += bo.curY - bo.prevY
      }
    }

    if (p.onGround && this.standingPerchIdx >= 0 && p.dashTimer <= 0) {
      const sp = this.swingingPerches[this.standingPerchIdx]
      if (sp) {
        p.x += sp.curX - sp.prevX
        p.y += sp.curY - sp.prevY
      }
    }

    if (p.onGround && this.standingGearIdx >= 0 && p.dashTimer <= 0) {
      const gp = this.gearPlatforms[this.standingGearIdx]
      if (gp) {
        p.x += gp.curX - gp.prevX
        p.y += gp.curY - gp.prevY
      }
    }

    // Sakura Petal Wind Vortex + Umbra Owl Boss Wind Gust (Shiba Inu & Samoyed are wind immune!)
    let windPushX = p.dashTimer <= 0 && !isWindImmune ? this.bossWindPushX : 0
    if (p.dashTimer <= 0 && !isWindImmune && this.level.windVortices) {
      for (const wv of this.level.windVortices) {
        if (this.aabbOverlap(p.x, p.y, p.w, p.h, wv.x, wv.y, wv.w, wv.h)) {
          windPushX += wv.pushX
        }
      }
    }

    // Rooftops Updraft Chimney Vents (smooth upward lift!)
    let insideUpdraftLift: number | null = null
    if (this.level.updrafts && p.dashTimer <= 0) {
      for (const ud of this.level.updrafts) {
        if (this.aabbOverlap(p.x, p.y, p.w, p.h, ud.x, ud.y, ud.w, ud.h)) {
          insideUpdraftLift = ud.liftVy ?? -162
          break
        }
      }
    }

    // Observatory Astral Low-Gravity Zones
    let zoneGravityScale = 1
    if (this.level.lowGravityZones) {
      for (const lg of this.level.lowGravityZones) {
        if (this.aabbOverlap(p.x, p.y, p.w, p.h, lg.x, lg.y, lg.w, lg.h)) {
          zoneGravityScale = Math.min(zoneGravityScale, lg.gravityScale ?? 0.5)
        }
      }
    }

    const moveDir = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0)
    if (p.dashTimer <= 0 && moveDir !== 0) {
      p.facing = moveDir > 0 ? 1 : -1
    }

    // Always record Jump Buffering (~100ms) even right before a Dash finishes!
    if (this.input.jumpJustPressed) {
      p.jumpBufferTimer = JUMP_BUFFER_TIME
    } else {
      p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt)
    }

    // Trigger DASH ability!
    if (this.input.dashJustPressed && this.isDashReady()) {
      p.dashTimer = effectiveDashDuration
      p.dashCooldownTimer = p.candyTimer > 0 ? 0 : effectiveDashCooldown
      p.coyoteTimer = 0
      this.knockbackTimer = 0
      p.idleDuration = 0
      if (!p.onGround && p.candyTimer <= 0) {
        p.airDashCount += 1
        p.airDashUsed = p.airDashCount >= (isKitsune ? 2 : 1)
      }
      p.vx = p.facing * DASH_SPEED
      p.vy = 0
      p.standingMovingPlatformIdx = -1
      p.afterimageSpawnTimer = 0
      this.progress.totalDashes += 1
      this.persistSave(false)
      this.incrementDailyQuest('dash-10', 1)
      this.audio.playDash()
      this.spawnDashBurst(p.x + p.w / 2, p.y + p.h / 2, p.facing, p.candyTimer > 0)
      this.checkAchievements()
      this.emitHud()
    }

    if (p.dashTimer > 0) {
      p.dashTimer = Math.max(0, p.dashTimer - dt)
      p.vx = p.facing * DASH_SPEED
      p.vy = 0

      p.afterimageSpawnTimer -= dt
      if (p.afterimageSpawnTimer <= 0) {
        p.afterimageSpawnTimer = 0.024
        const isRainbow = p.candyTimer > 0
        this.afterimages.push({
          x: p.x,
          y: p.y,
          facing: p.facing,
          life: 0.2,
          maxLife: 0.2,
          tint: isRainbow ? 'rainbow' : this.afterimages.length % 2 === 0 ? 'scarf' : 'white',
          rainbowIdx: this.afterimages.length % 5,
          scale: p.mooncakeTimer > 0 ? 1.35 : 1
        })
        this.spawnDashTrailSpark(p.x + p.w / 2 - p.facing * 4, p.y + 4 + Math.random() * 8, p.facing, isRainbow)
      }

      if (p.dashTimer <= 0) {
        p.vx = moveDir * effectiveMoveSpeed
      }
    } else {
      // Crisp, zero-slide horizontal control
      if (this.knockbackTimer <= 0) {
        p.vx = moveDir * effectiveMoveSpeed
      } else if (moveDir !== 0) {
        this.knockbackTimer = 0
        p.vx = moveDir * effectiveMoveSpeed
      }

      if (p.onGround) {
        p.coyoteTimer = effectiveCoyoteTime
        p.jumpsUsed = 0
        p.airDashUsed = false
        p.airDashCount = 0
      } else {
        p.coyoteTimer = Math.max(0, p.coyoteTimer - dt)
      }

      if (p.jumpBufferTimer > 0) {
        if (p.coyoteTimer > 0) {
          // Grounded jump OR Coyote Time jump (~100ms after walking off an edge)
          p.vy = effectiveJumpVy
          p.onGround = false
          p.standingMovingPlatformIdx = -1
          p.coyoteTimer = 0
          p.jumpBufferTimer = 0
          p.jumpsUsed = 1
          p.idleDuration = 0
          this.audio.playJump()
          this.triggerBiomeCosmeticJumpAccent()
          this.spawnJumpDust(p.x + p.w / 2, p.y + p.h)
        } else if (p.jumpsUsed < p.maxJumps) {
          // Midair jump: if player walked off a ledge and coyote time expired, consume the missed ground jump cleanly
          p.vy = effectiveDoubleJumpVy
          p.onGround = false
          p.standingMovingPlatformIdx = -1
          p.jumpBufferTimer = 0
          p.jumpsUsed = p.jumpsUsed === 0 ? 2 : p.jumpsUsed + 1
          p.idleDuration = 0
          this.audio.playDoubleJump()
          this.triggerBiomeCosmeticJumpAccent()
          this.spawnDoubleJumpStars(p.x + p.w / 2, p.y + p.h)
        }
      }

      if (!this.input.jumpHeld && p.vy < -65) {
        p.vy *= Math.pow(JUMP_CUT_MULT, dt * 16)
      }

      // Gravity + Kitsune Spirit (-18% float) + Bunny Lunar Soft-Fall + Chrono Gear (-22%) + Observatory Low-G!
      const isGliding = (p.featherTimer > 0 || p.mochiTimer > 0) && !p.onGround && p.vy > 0 && this.input.jumpHeld
      const kitsuneScale = isKitsune && !p.onGround && p.vy > -85 ? 0.82 : 1
      const bunnySoftFall = isBunny && !p.onGround && p.vy > 0 && this.input.jumpHeld ? 0.78 : 1
      const chronoScale = p.chronoGearTimer > 0 ? 0.78 : 1
      const effGravity = GRAVITY * zoneGravityScale * kitsuneScale * bunnySoftFall * chronoScale
      if (insideUpdraftLift !== null) {
        p.vy = Math.max(insideUpdraftLift, p.vy - 520 * dt)
        p.onGround = false
      } else if (isGliding) {
        p.vy = Math.min(FEATHER_GLIDE_MAX_FALL, p.vy + effGravity * 0.35 * dt)
        if (Math.random() < 0.25) {
          this.particles.push({
            x: p.x + p.w / 2 + (Math.random() - 0.5) * 10,
            y: p.y + p.h - 2,
            vx: (Math.random() - 0.5) * 14,
            vy: 8 + Math.random() * 10,
            life: 0.4,
            maxLife: 0.4,
            size: 2,
            color: p.mochiTimer > 0 ? '#ffb5d8' : Math.random() > 0.5 ? '#ffe894' : '#e0b8ff',
            kind: 'ambient'
          })
        }
      } else {
        const fallCap =
          zoneGravityScale < 0.9 || bunnySoftFall < 1 || chronoScale < 1
            ? MAX_FALL_SPEED * 0.72
            : MAX_FALL_SPEED
        p.vy = Math.min(fallCap, p.vy + effGravity * dt)
      }
    }

    // Track calm idle duration (> 2.0s triggers species-specific idle animation!)
    if (p.onGround && Math.abs(p.vx) < 1 && p.dashTimer <= 0 && !this.input.jumpJustPressed) {
      p.idleDuration += dt
    } else {
      p.idleDuration = 0
    }

    // Move & resolve X axis (with calm petal wind push + boss arena bounds when active)
    p.x += (p.vx + windPushX) * dt
    const minBoundX =
      this.bossController && this.bossController.active ? this.bossController.config.arenaMinX : 2
    const maxBoundX =
      this.bossController && this.bossController.active
        ? this.bossController.config.arenaMaxX
        : this.level.width - 2
    if (p.x < minBoundX) {
      p.x = minBoundX
      p.vx = 0
      p.dashTimer = 0
    } else if (p.x + p.w > maxBoundX) {
      p.x = maxBoundX - p.w
      p.vx = 0
      p.dashTimer = 0
    }

    for (const plat of this.level.platforms) {
      if (this.aabbOverlap(p.x, p.y, p.w, p.h, plat.x, plat.y, plat.w, plat.h)) {
        if (p.vx > 0) {
          p.x = plat.x - p.w
          p.vx = 0
          p.dashTimer = 0
        } else if (p.vx < 0) {
          p.x = plat.x + plat.w
          p.vx = 0
          p.dashTimer = 0
        }
      }
    }

    // Move & resolve Y axis
    const prevBottom = p.y + p.h
    p.y += p.vy * dt
    p.onGround = false
    p.standingMovingPlatformIdx = -1
    this.standingBoatIdx = -1
    this.standingPerchIdx = -1
    this.standingGearIdx = -1

    for (const bc of this.bounceClouds) {
      if (
        p.vy >= 0 &&
        p.x + p.w > bc.x + 2 &&
        p.x < bc.x + bc.w - 2 &&
        prevBottom <= bc.y + 8 &&
        p.y + p.h >= bc.y + 2
      ) {
        p.y = bc.y + 2 - p.h
        p.vy = BOUNCE_CLOUD_VY
        p.onGround = false
        p.coyoteTimer = 0
        p.jumpsUsed = 0
        p.airDashUsed = false
        p.airDashCount = 0
        bc.squishTimer = 0.24
        this.audio.playBounce()
        this.spawnBouncePuffs(bc.x + bc.w / 2, bc.y + 4)
        break
      }
    }

    // Rooftop Bouncy Power Wires: sag softly & bounce player high upward!
    for (const pw of this.powerWires) {
      if (
        p.vy >= 0 &&
        p.x + p.w > pw.x + 2 &&
        p.x < pw.x + pw.w - 2 &&
        prevBottom <= pw.y + 7 &&
        p.y + p.h >= pw.y - 1
      ) {
        p.y = pw.y - p.h
        p.vy = WIRE_BOUNCE_VY
        p.onGround = false
        p.coyoteTimer = 0
        p.jumpsUsed = 0
        p.airDashUsed = false
        p.airDashCount = 0
        pw.sag = 6
        pw.sagVel = 24
        this.audio.playWireBounce()
        this.spawnCollectBurst(p.x + p.w / 2, pw.y + 2, '#ffe875', 8)
        break
      }
    }

    for (const plat of this.level.platforms) {
      if (this.aabbOverlap(p.x, p.y, p.w, p.h, plat.x, plat.y, plat.w, plat.h)) {
        if (p.vy >= 0 && prevBottom <= plat.y + 8) {
          p.y = plat.y - p.h
          p.vy = 0
          p.onGround = true
          p.airDashUsed = false
          this.standingSurface = plat.style
          if (this.activeCheckpointIdx < 0 && p.x > plat.x + 8 && p.x + p.w < plat.x + plat.w - 8) {
            p.safeX = p.x
            p.safeY = plat.y - p.h - 2
          }
        } else if (p.vy < 0 && p.y >= plat.y + plat.h - 10) {
          p.y = plat.y + plat.h
          p.vy = 0
        }
      }
    }

    // Sakura Fragile Branches (solid -> quiver 1.0s -> sink gently!)
    for (const fb of this.fragileBranches) {
      if (fb.state === 'falling' || fb.state === 'gone') continue
      if (
        p.vy >= 0 &&
        p.x + p.w > fb.x + 2 &&
        p.x < fb.x + fb.w - 2 &&
        prevBottom <= fb.curY + 6 &&
        p.y + p.h >= fb.curY
      ) {
        p.y = fb.curY - p.h
        p.vy = 0
        p.onGround = true
        p.airDashUsed = false
        this.standingSurface = 'sakura'
        if (fb.state === 'solid') {
          fb.state = 'shaking'
          fb.timer = 1.0
        }
      }
    }

    // Harbor Floating Wooden Boats (calmly rocking on water!)
    for (let i = 0; i < this.floatingBoats.length; i++) {
      const bo = this.floatingBoats[i]!
      if (
        p.vy >= 0 &&
        p.x + p.w > bo.curX + 3 &&
        p.x < bo.curX + bo.w - 3 &&
        prevBottom <= bo.curY + 7 &&
        p.y + p.h >= bo.curY
      ) {
        p.y = bo.curY - p.h
        p.vy = 0
        p.onGround = true
        p.airDashUsed = false
        this.standingSurface = 'harbor'
        this.standingBoatIdx = i
      }
    }

    for (let i = 0; i < this.movingPlatforms.length; i++) {
      const mp = this.movingPlatforms[i]!
      if (
        p.vy >= 0 &&
        p.x + p.w > mp.curX + 2 &&
        p.x < mp.curX + mp.w - 2 &&
        prevBottom <= mp.curY + 6 &&
        p.y + p.h >= mp.curY
      ) {
        p.y = mp.curY - p.h
        p.vy = 0
        p.onGround = true
        p.airDashUsed = false
        p.standingMovingPlatformIdx = i
      }
    }

    // Cloudland Phasing Star Clouds (solid & warn phases support landing!)
    for (const pc of this.phasingClouds) {
      if (pc.phase === 'phased') continue
      if (
        p.vy >= 0 &&
        p.x + p.w > pc.x + 2 &&
        p.x < pc.x + pc.w - 2 &&
        prevBottom <= pc.y + 7 &&
        p.y + p.h >= pc.y
      ) {
        p.y = pc.y - p.h
        p.vy = 0
        p.onGround = true
        p.airDashUsed = false
        this.standingSurface = 'cloud'
      }
    }

    // Harbor Swinging Lantern Perches
    for (let i = 0; i < this.swingingPerches.length; i++) {
      const sp = this.swingingPerches[i]!
      if (
        p.vy >= 0 &&
        p.x + p.w > sp.curX + 2 &&
        p.x < sp.curX + sp.w - 2 &&
        prevBottom <= sp.curY + 7 &&
        p.y + p.h >= sp.curY
      ) {
        p.y = sp.curY - p.h
        p.vy = 0
        p.onGround = true
        p.airDashUsed = false
        this.standingSurface = 'harbor'
        this.standingPerchIdx = i
      }
    }

    // Cavern Elastic Glow-Mushrooms (high bouncy bioluminescent caps; Crystal Elixir boosts +14% height!)
    for (const gm of this.glowMushrooms) {
      if (
        p.vy >= 0 &&
        p.x + p.w > gm.x + 2 &&
        p.x < gm.x + gm.w - 2 &&
        prevBottom <= gm.y + 8 &&
        p.y + p.h >= gm.y + 1
      ) {
        p.y = gm.y + 1 - p.h
        const baseBounce = gm.bounceVy ?? -296
        p.vy = p.crystalElixirTimer > 0 ? Math.round(baseBounce * 1.07) : baseBounce
        p.onGround = false
        p.coyoteTimer = 0
        p.jumpsUsed = 0
        p.airDashUsed = false
        p.airDashCount = 0
        gm.squishTimer = 0.26
        this.audio.playBounce()
        this.spawnCollectBurst(gm.x + gm.w / 2, gm.y + 4, gm.tint === 'violet' ? '#cfa6ff' : '#76f7eb', 10)
        break
      }
    }

    // Observatory Rotating Gear Platforms
    for (let i = 0; i < this.gearPlatforms.length; i++) {
      const gp = this.gearPlatforms[i]!
      if (
        p.vy >= 0 &&
        p.x + p.w > gp.curX + 2 &&
        p.x < gp.curX + gp.w - 2 &&
        prevBottom <= gp.curY + 7 &&
        p.y + p.h >= gp.curY
      ) {
        p.y = gp.curY - p.h
        p.vy = 0
        p.onGround = true
        p.airDashUsed = false
        this.standingSurface = 'observatory'
        this.standingGearIdx = i
      }
    }

    p.animTimer += dt
    p.blinkTimer -= dt
    if (p.blinkTimer <= -0.14) {
      p.blinkTimer = 2.4 + Math.random() * 2.5
    }

    // Trigger soft landing cushion frame & surface-specific soft landing SFX!
    if (p.onGround && !this.wasOnGround) {
      this.landingTimer = 0.11
      this.audio.playLand(this.standingSurface)
    }

    // Soft surface-specific running footsteps
    if (p.onGround && Math.abs(p.vx) > 20 && p.dashTimer <= 0) {
      this.footstepTimer -= dt
      if (this.footstepTimer <= 0) {
        this.footstepTimer = 0.24
        this.audio.playFootstep(this.standingSurface)
      }
    } else {
      this.footstepTimer = 0.06
    }

    if (p.y > this.level.height + 28) {
      this.handlePitFall()
    }
  }

  private updateBossEncounter(dt: number): void {
    const boss = this.bossController
    if (!boss) {
      this.bossWindPushX = 0
      return
    }
    const p = this.player
    const skillCdMult = p.eclipseShardTimer > 0 ? 0.6 : 1.0
    const kitsunePulseMult = this.progress.selectedCharacter === 'fox-kitsune' ? 0.85 : 1.0
    const bonusBossDmg = p.eclipseShardTimer > 0 ? 1 : 0

    // Combat Skill 1: Starlight Pulse (C / J or ✦ button, 1.2s CD; 0.14s & 3-way spread during Comet Charge!)
    if (this.input.pulseJustPressed) {
      const hasComet = p.cometChargeTimer > 0
      if (hasComet || p.starlightPulseCooldown <= 0) {
        const px = p.x + p.w / 2 + p.facing * 8
        const py = p.y + p.h / 2
        boss.firePlayerPulse(px, py, p.facing, hasComet, bonusBossDmg)
        p.starlightPulseCooldown = hasComet ? 0.14 : 1.2 * skillCdMult * kitsunePulseMult
        this.audio.playStarlightPulse(hasComet)
        this.spawnCollectBurst(px, py, bonusBossDmg > 0 ? '#ff6b9d' : hasComet ? '#ff9ed2' : '#8ef0ff', 4)
        this.emitHud()
      }
    }

    // Combat Skill 2: Astral Aegis (V / K or ◈ button, 5.0s CD, 1.2s barrier; Polar Bear +0.35s!)
    if (this.input.aegisJustPressed && p.astralAegisCooldown <= 0) {
      p.astralAegisTimer = this.progress.selectedCharacter === 'bear-polar' ? 1.55 : 1.2
      p.astralAegisCooldown = 5.0 * skillCdMult
      this.audio.playAstralAegis(false)
      this.spawnCollectBurst(p.x + p.w / 2, p.y + p.h / 2, '#b8e8ff', 8)
      this.floatingTexts.push({
        x: p.x + p.w / 2,
        y: p.y - 6,
        vy: -16,
        text: '◈ AEGIS!',
        color: '#b8f0ff',
        life: 0.85,
        maxLife: 0.85
      })
      this.emitHud()
    }

    const bossCallbacks = {
      onDamagePlayer: (kvx: number, kvy: number) => {
        this.touchedEnemyThisLevel = true
        this.damagePlayer(kvx, kvy)
      },
      onAegisBlock: (bx: number, by: number) => {
        // Successful block restores Starlight Pulse cooldown immediately!
        p.starlightPulseCooldown = 0
        this.audio.playAstralAegis(true)
        this.spawnCollectBurst(bx, by, '#9ef0ff', 10)
        this.floatingTexts.push({
          x: bx,
          y: by - 8,
          vy: -18,
          text: 'TANGKIS! ✦ SIAP!',
          color: '#9ef0ff',
          life: 0.9,
          maxLife: 0.9
        })
        this.emitHud()
      },
      onBossHit: (hx: number, hy: number, dmg: number, critical: boolean, deflected: boolean) => {
        this.spawnCollectBurst(hx, hy, critical ? '#ffe466' : '#a8efff', critical ? 12 : 7)
        this.floatingTexts.push({
          x: hx,
          y: hy - 6,
          vy: -20,
          text: deflected ? `-${dmg} STUN! ★` : critical ? `-${dmg} CRIT!` : `-${dmg}`,
          color: critical ? '#ffe466' : '#fff5d6',
          life: 0.85,
          maxLife: 0.85
        })
        this.emitHud()
      },
      onBossPhaseChange: () => {
        this.emitHud()
      },
      onBossDefeated: (dx: number, dy: number) => {
        this.spawnCollectBurst(dx, dy, '#ffe466', 24)
        this.spawnCollectBurst(dx, dy, '#ff8cb8', 18)
        this.floatingTexts.push({
          x: dx,
          y: dy - 10,
          vy: -14,
          text: 'BOSS DIKALAHKAN! GERBANG TERBUKA!',
          color: '#ffe475',
          life: 2.4,
          maxLife: 2.4
        })
        this.emitHud()
      },
      onPlayBossSfx: (kind: 'cue' | 'beam' | 'swoop' | 'deflect' | 'hit' | 'phase' | 'defeat') =>
        this.audio.playBossSfx(kind),
      onSpawnParticle: (sx: number, sy: number, color: string, count: number) =>
        this.spawnCollectBurst(sx, sy, color, count),
      onFloatingText: (tx: number, ty: number, text: string, color: string) => {
        this.floatingTexts.push({ x: tx, y: ty, vy: -16, text, color, life: 1.2, maxLife: 1.2 })
      }
    }

    // Combat Skill 3: Starfall Nova (Q / U or ☄ button, 7.5s CD — clears nearby projectiles + fires 3 homing stars!)
    if (this.input.novaJustPressed && p.starfallNovaCooldown <= 0) {
      p.starfallNovaCooldown = STARFALL_NOVA_COOLDOWN * skillCdMult
      const px = p.x + p.w / 2
      const py = p.y + p.h / 2
      boss.triggerStarfallNova(px, py, bonusBossDmg, bossCallbacks)
      this.audio.playStarlightPulse(true)
      this.spawnCollectBurst(px, py, '#ffe466', 14)
      this.floatingTexts.push({
        x: px,
        y: p.y - 8,
        vy: -18,
        text: '☄️ STARFALL NOVA!',
        color: '#ffe875',
        life: 1.0,
        maxLife: 1.0
      })
      this.emitHud()
    }

    // Combat Skill 4: Lunar Mend (H / L or ♥ button, 16s CD, 2 uses per Boss Fight — heals +1 ♥ & clears nearby threats!)
    if (this.input.mendJustPressed && p.lunarMendCooldown <= 0 && p.lunarMendUsesLeft > 0) {
      p.lunarMendUsesLeft -= 1
      p.lunarMendCooldown = LUNAR_MEND_COOLDOWN * skillCdMult
      const px = p.x + p.w / 2
      const py = p.y + p.h / 2
      boss.clearProjectilesNear(px, py, 74, bossCallbacks)
      p.invincibleTimer = Math.max(p.invincibleTimer, 1.0)
      this.audio.playMilk()
      this.triggerPlayerEmote('heart', 1.6)
      this.spawnCollectBurst(px, py, '#8ef5c8', 14)
      if (p.hearts < p.maxHearts) {
        p.hearts += 1
        this.floatingTexts.push({
          x: px,
          y: p.y - 8,
          vy: -18,
          text: `💚 LUNAR MEND +1 ♥ (${p.lunarMendUsesLeft}x)`,
          color: '#9ef5c8',
          life: 1.2,
          maxLife: 1.2
        })
      } else {
        p.hasBubbleShield = true
        this.floatingTexts.push({
          x: px,
          y: p.y - 8,
          vy: -18,
          text: `🫧 PERISAI MEND (${p.lunarMendUsesLeft}x)`,
          color: '#b8f0ff',
          life: 1.2,
          maxLife: 1.2
        })
      }
      this.emitHud()
    }

    const res = boss.update(dt, p, this.progress.reduceMotion, bossCallbacks)

    this.bossWindPushX = res.windPushX

    if (!this.bossArenaAlerted && boss.active) {
      this.bossArenaAlerted = true
      this.triggerPlayerEmote('alert', 1.8)
    }

    // Apply collected Arena Battle Item effect!
    if (res.collectedItem) {
      this.applyArenaBattleItem(res.collectedItem)
    }
  }

  private applyArenaBattleItem(kind: ArenaBattleItemKind): void {
    const p = this.player
    const cx = p.x + p.w / 2
    const cy = p.y
    const buffMult = this.getBuffDurationMultiplier()
    if (kind === 'starBerry') {
      this.audio.playMilk()
      if (p.hearts < p.maxHearts) {
        p.hearts += 1
      } else {
        this.levelScore += 150
        this.totalRunScore += 150
      }
      this.triggerPlayerEmote('heart', 1.6)
      this.spawnCollectBurst(cx, cy, '#ff7aa8', 12)
      this.floatingTexts.push({ x: cx, y: cy - 6, vy: -18, text: '🍓 +1 ♥ STAR BERRY!', color: '#ffb5d4', life: 1.1, maxLife: 1.1 })
    } else if (kind === 'starNectar') {
      this.audio.playMilk()
      this.triggerPlayerEmote('heart', 1.8)
      p.invincibleTimer = Math.max(p.invincibleTimer, 2.5)
      this.spawnCollectBurst(cx, cy, '#ff78a8', 16)
      if (p.hearts < p.maxHearts) {
        p.hearts = Math.min(p.maxHearts, p.hearts + 2)
        this.floatingTexts.push({ x: cx, y: cy - 6, vy: -18, text: '🧪 NEKTAR +2 ♥!', color: '#ff9ec4', life: 1.3, maxLife: 1.3 })
      } else {
        p.hasBubbleShield = true
        this.levelScore += 200
        this.totalRunScore += 200
        this.floatingTexts.push({ x: cx, y: cy - 6, vy: -18, text: '🧪 PERISAI +200!', color: '#ffe475', life: 1.3, maxLife: 1.3 })
      }
    } else if (kind === 'eclipseShard') {
      p.eclipseShardTimer = ECLIPSE_SHARD_DURATION * buffMult
      p.starlightPulseCooldown = 0
      this.audio.playCandy()
      this.triggerPlayerEmote('star', 1.6)
      this.spawnCollectBurst(cx, cy, '#ff5c8a', 14)
      this.floatingTexts.push({ x: cx, y: cy - 6, vy: -18, text: '🌘 GERHANA +1 DMG!', color: '#ff8cb2', life: 1.25, maxLife: 1.25 })
    } else if (kind === 'cometCharge') {
      p.cometChargeTimer = 6.0 * buffMult
      p.starlightPulseCooldown = 0
      this.audio.playCandy()
      this.triggerPlayerEmote('star', 1.6)
      this.spawnCollectBurst(cx, cy, '#ffe466', 14)
      this.floatingTexts.push({ x: cx, y: cy - 6, vy: -18, text: '☄️ COMET CHARGE!', color: '#ffe466', life: 1.2, maxLife: 1.2 })
    } else if (kind === 'moonlightFeather') {
      p.moonlightFeatherTimer = 10.0 * buffMult
      this.audio.playFeather()
      this.spawnCollectBurst(cx, cy, '#9ef0ff', 14)
      this.floatingTexts.push({ x: cx, y: cy - 6, vy: -18, text: '🌙 TRIPLE JUMP!', color: '#b8f3ff', life: 1.2, maxLife: 1.2 })
    }
    this.emitHud()
  }

  private checkCheckpoint(): void {
    const p = this.player
    for (let i = 0; i < this.checkpoints.length; i++) {
      const cp = this.checkpoints[i]!
      if (cp.activated) continue
      if (this.aabbOverlap(p.x, p.y, p.w, p.h, cp.x - 4, cp.y, 22, 26)) {
        cp.activated = true
        this.activeCheckpointIdx = i
        p.safeX = cp.x + 1
        p.safeY = cp.y + 6
        // Polar Bear Special Passive: regenerates Frost Shield on every Star Lantern Checkpoint!
        const restoredFrost = this.progress.selectedCharacter === 'bear-polar' && !p.hasFrostShield
        if (restoredFrost) {
          p.hasFrostShield = true
        }
        this.audio.playCheckpoint()
        this.triggerPlayerEmote('heart', 1.5)
        this.spawnCollectBurst(cp.x + 7, cp.y + 8, '#ff9ec4', 10)
        this.spawnCollectBurst(cp.x + 7, cp.y + 8, restoredFrost ? '#a8f2ff' : '#ffe680', 10)
        this.floatingTexts.push({
          x: cp.x + 7,
          y: cp.y - 4,
          vy: -18,
          text: restoredFrost ? 'POS LENTERA + ❄️ FROST!' : 'POS LENTERA!',
          color: restoredFrost ? '#b8f7ff' : '#ffe894',
          life: 1.25,
          maxLife: 1.25
        })
        this.emitHud()
      }
    }
  }

  private checkPowerUps(): void {
    const p = this.player
    for (const pu of this.powerUps) {
      if (pu.collected) continue
      const bobY = pu.y + Math.round(Math.sin(this.worldTime * 1.4 + pu.phase) * 1.5)
      if (this.aabbOverlap(p.x - 2, p.y - 2, p.w + 4, p.h + 4, pu.x, bobY, 14, 14)) {
        pu.collected = true
        this.incrementDailyQuest('powerup-3', 1)
        if (pu.kind === 'milk') {
          this.audio.playMilk()
          this.triggerPlayerEmote('heart', 1.5)
          if (p.hearts < p.maxHearts) {
            p.hearts += 1
            this.spawnCollectBurst(pu.x + 5, bobY + 7, '#ff9ec4', 10)
            this.floatingTexts.push({
              x: pu.x + 5,
              y: bobY - 3,
              vy: -20,
              text: '+1 ♥',
              color: '#ffb0ce',
              life: 1.0,
              maxLife: 1.0
            })
          } else {
            this.levelScore += 100
            this.totalRunScore += 100
            this.updateHighScoreIfNeeded()
            this.spawnCollectBurst(pu.x + 5, bobY + 7, '#fff6cc', 10)
            this.floatingTexts.push({
              x: pu.x + 5,
              y: bobY - 3,
              vy: -20,
              text: '+100 🥛',
              color: '#fff4ba',
              life: 1.0,
              maxLife: 1.0
            })
          }
        } else if (pu.kind === 'feather') {
          p.featherTimer = FEATHER_DURATION * this.getBuffDurationMultiplier()
          this.audio.playFeather()
          this.spawnCollectBurst(pu.x + 6, bobY + 6, '#e2b8ff', 10)
          this.floatingTexts.push({
            x: pu.x + 6,
            y: bobY - 3,
            vy: -20,
            text: 'MELAYANG!',
            color: '#eed6ff',
            life: 1.1,
            maxLife: 1.1
          })
        } else if (pu.kind === 'bell') {
          p.magnetTimer = MAGNET_DURATION * this.getBuffDurationMultiplier()
          this.audio.playBell()
          this.spawnCollectBurst(pu.x + 6, bobY + 6, '#ffe26b', 12)
          this.floatingTexts.push({
            x: pu.x + 6,
            y: bobY - 3,
            vy: -20,
            text: 'MAGNET!',
            color: '#ffe680',
            life: 1.1,
            maxLife: 1.1
          })
        } else if (pu.kind === 'bubble') {
          p.hasBubbleShield = true
          this.audio.playBubblePickup()
          this.spawnCollectBurst(pu.x + 7, bobY + 7, '#9be0ff', 10)
          this.floatingTexts.push({
            x: pu.x + 7,
            y: bobY - 3,
            vy: -20,
            text: 'PERISAI!',
            color: '#b8ecff',
            life: 1.1,
            maxLife: 1.1
          })
        } else if (pu.kind === 'mooncake') {
          p.mooncakeTimer = MOONCAKE_DURATION * this.getBuffDurationMultiplier()
          this.audio.playMooncake()
          this.spawnCollectBurst(pu.x + 7, bobY + 7, '#ffd85c', 14)
          this.floatingTexts.push({
            x: pu.x + 7,
            y: bobY - 3,
            vy: -20,
            text: 'KUE BULAN!',
            color: '#ffe680',
            life: 1.15,
            maxLife: 1.15
          })
        } else if (pu.kind === 'yarn') {
          p.yarnTimer = YARN_DURATION * this.getBuffDurationMultiplier()
          this.audio.playYarn()
          this.spawnCollectBurst(pu.x + 6, bobY + 6, '#d4b3ff', 12)
          this.floatingTexts.push({
            x: pu.x + 6,
            y: bobY - 3,
            vy: -20,
            text: 'LOMPAT x3!',
            color: '#e6ccff',
            life: 1.15,
            maxLife: 1.15
          })
        } else if (pu.kind === 'mochi') {
          p.mochiTimer = MOCHI_DURATION * this.getBuffDurationMultiplier()
          this.audio.playMochi()
          this.spawnCollectBurst(pu.x + 6, bobY + 6, '#ffb5d8', 12)
          this.floatingTexts.push({
            x: pu.x + 6,
            y: bobY - 3,
            vy: -20,
            text: 'MOCHI 2x!',
            color: '#ffd1e8',
            life: 1.15,
            maxLife: 1.15
          })
        } else if (pu.kind === 'candy') {
          p.candyTimer = CANDY_DURATION * this.getBuffDurationMultiplier()
          p.dashCooldownTimer = 0
          p.airDashUsed = false
          p.airDashCount = 0
          this.audio.playCandy()
          this.spawnCollectBurst(pu.x + 6, bobY + 6, '#9ef5cf', 14)
          this.floatingTexts.push({
            x: pu.x + 6,
            y: bobY - 3,
            vy: -20,
            text: 'DASH PELANGI!',
            color: '#fff2a6',
            life: 1.15,
            maxLife: 1.15
          })
        } else if (pu.kind === 'pearl') {
          p.pearlTimer = PEARL_DURATION * this.getBuffDurationMultiplier()
          this.audio.playPearl()
          this.spawnCollectBurst(pu.x + 6, bobY + 6, '#b8f0ff', 12)
          this.floatingTexts.push({
            x: pu.x + 6,
            y: bobY - 3,
            vy: -20,
            text: 'MUTIARA AIR!',
            color: '#d4f6ff',
            life: 1.15,
            maxLife: 1.15
          })
        } else if (pu.kind === 'crystalElixir') {
          p.crystalElixirTimer = CRYSTAL_ELIXIR_DURATION * this.getBuffDurationMultiplier()
          this.audio.playPearl()
          this.spawnCollectBurst(pu.x + 6, bobY + 6, '#76f7eb', 14)
          this.floatingTexts.push({
            x: pu.x + 6,
            y: bobY - 3,
            vy: -20,
            text: 'KRISTAL SPORA!',
            color: '#a8fff7',
            life: 1.2,
            maxLife: 1.2
          })
        } else if (pu.kind === 'chronoGear') {
          p.chronoGearTimer = CHRONO_GEAR_DURATION * this.getBuffDurationMultiplier()
          p.dashCooldownTimer = 0
          this.audio.playBell()
          this.spawnCollectBurst(pu.x + 6, bobY + 6, '#ffe475', 14)
          this.floatingTexts.push({
            x: pu.x + 6,
            y: bobY - 3,
            vy: -20,
            text: 'RODA WAKTU!',
            color: '#fff0a6',
            life: 1.2,
            maxLife: 1.2
          })
        } else if (pu.kind === 'starNectar') {
          this.audio.playMilk()
          this.triggerPlayerEmote('heart', 1.8)
          p.invincibleTimer = Math.max(p.invincibleTimer, 2.5)
          this.spawnCollectBurst(pu.x + 6, bobY + 6, '#ff7aa8', 16)
          if (p.hearts < p.maxHearts) {
            p.hearts = Math.min(p.maxHearts, p.hearts + 2)
            this.floatingTexts.push({
              x: pu.x + 6,
              y: bobY - 3,
              vy: -20,
              text: 'NEKTAR +2 ♥!',
              color: '#ff9ec4',
              life: 1.3,
              maxLife: 1.3
            })
          } else {
            p.hasBubbleShield = true
            this.levelScore += 200
            this.totalRunScore += 200
            this.updateHighScoreIfNeeded()
            this.floatingTexts.push({
              x: pu.x + 6,
              y: bobY - 3,
              vy: -20,
              text: 'PERISAI +200!',
              color: '#ffe885',
              life: 1.3,
              maxLife: 1.3
            })
          }
        } else if (pu.kind === 'eclipseShard') {
          p.eclipseShardTimer = ECLIPSE_SHARD_DURATION * this.getBuffDurationMultiplier()
          p.starlightPulseCooldown = 0
          this.audio.playCandy()
          this.spawnCollectBurst(pu.x + 6, bobY + 6, '#ff5c8a', 14)
          this.floatingTexts.push({
            x: pu.x + 6,
            y: bobY - 3,
            vy: -20,
            text: 'GERHANA +1 DMG!',
            color: '#ff8cb2',
            life: 1.25,
            maxLife: 1.25
          })
        }
        this.emitHud()
      }
    }
  }

  private updateMagnetAndCollectibles(dt: number): void {
    const p = this.player
    const px = p.x + p.w / 2
    const py = p.y + p.h / 2
    let changed = false

    for (const item of this.collectibles) {
      if (item.collected) continue

      // Golden Bell pulls Stars & Fish; Moonlit Pearl pulls Golden Fish; Sun Bear (Special) has +35% permanent magnet!
      const isSunBear = this.progress.selectedCharacter === 'bear-sun'
      const shouldPull =
        p.magnetTimer > 0 || (p.pearlTimer > 0 && item.kind === 'fish') || isSunBear
      if (shouldPull) {
        const baseRadius =
          p.magnetTimer > 0
            ? MAGNET_RADIUS
            : p.pearlTimer > 0 && item.kind === 'fish'
              ? PEARL_FISH_RADIUS
              : 32
        const radius = isSunBear ? Math.round(baseRadius * 1.35) : baseRadius
        const dx = px - (item.curX + 6)
        const dy = py - (item.curY + 6)
        const dist = Math.hypot(dx, dy)
        if (dist > 1 && dist <= radius) {
          const pull = (p.magnetTimer > 0 || p.pearlTimer > 0 ? 175 : 108) * dt
          item.curX += (dx / dist) * pull
          item.curY += (dy / dist) * pull
        }
      }

      const bobY = item.curY + Math.round(Math.sin(this.worldTime * 1.4 + item.phase) * 1.5)
      const iw = item.kind === 'bigStar' ? 16 : item.kind === 'fish' ? 14 : 12
      const ih = item.kind === 'bigStar' ? 16 : item.kind === 'fish' ? 10 : 12
      const reachPad = p.mooncakeTimer > 0 ? 5 : 1

      if (
        this.aabbOverlap(
          p.x - reachPad,
          p.y - reachPad,
          p.w + reachPad * 2,
          p.h + reachPad * 2,
          item.curX,
          bobY,
          iw,
          ih
        )
      ) {
        item.collected = true

        if (item.kind === 'fish') {
          this.levelScore += 50
          this.totalRunScore += 50
          this.progress.fishBank += 1
          this.progress.totalFishEarned += 1
          this.syncCurrentLevelBestRecords()
          this.persistSave(true)
          this.incrementDailyQuest('collect-fish-4', 1)
          this.audio.playFish()
          this.spawnCollectBurst(item.curX + iw / 2, bobY + ih / 2, '#ffd84d', 12)
          this.floatingTexts.push({
            x: item.curX + 4,
            y: bobY - 2,
            vy: -22,
            text: '+50 🐟',
            color: '#ffe46b',
            life: 0.95,
            maxLife: 0.95
          })
          this.checkAchievements()
        } else if (item.kind === 'bigStar') {
          let bigPts = p.mochiTimer > 0 ? 200 : 100
          if (p.chronoGearTimer > 0) bigPts = Math.round(bigPts * 1.5)
          if (this.progress.selectedCharacter === 'cat-calico') bigPts = Math.round(bigPts * 1.15)
          const pts = this.nightEvent === 'pinkMoon' ? Math.round(bigPts * 1.25) : bigPts
          this.levelScore += pts
          this.totalRunScore += pts
          this.audio.playBigStar()
          this.incrementDailyQuest('stars-any-20', 2)
          if (this.level.biome === 'sakura') {
            this.incrementDailyQuest('stars-sakura', 2)
          } else if (this.level.biome === 'rooftops') {
            this.incrementDailyQuest('stars-rooftops', 2)
          }
          this.spawnCollectBurst(item.curX + iw / 2, bobY + ih / 2, '#ffe46b', 16)
          this.floatingTexts.push({
            x: item.curX + 6,
            y: bobY - 3,
            vy: -22,
            text: `+${pts} ★`,
            color: '#ffe875',
            life: 1.15,
            maxLife: 1.15
          })
        } else {
          // Star Chain Combo (Calico gets +35% longer combo window & +15% star score; Chrono Gear +50%!)
          const isCalico = this.progress.selectedCharacter === 'cat-calico'
          if (this.starComboTimer > 0) {
            this.starComboCount += 1
          } else {
            this.starComboCount = 1
          }
          this.starComboTimer = isCalico ? STAR_COMBO_WINDOW * 1.35 : STAR_COMBO_WINDOW
          const comboMult = Math.min(5, this.starComboCount)
          const isStarDouble = p.mochiTimer > 0
          let basePts = (isStarDouble ? 20 : 10) * comboMult
          if (p.chronoGearTimer > 0) basePts = Math.round(basePts * 1.5)
          if (isCalico) basePts = Math.round(basePts * 1.15)
          const pts = this.nightEvent === 'pinkMoon' ? Math.round(basePts * 1.25) : basePts
          this.levelScore += pts
          this.totalRunScore += pts

          this.audio.playStar(this.starComboCount)
          this.incrementDailyQuest('stars-any-20', 1)
          if (this.level.biome === 'sakura') {
            this.incrementDailyQuest('stars-sakura', 1)
          } else if (this.level.biome === 'rooftops') {
            this.incrementDailyQuest('stars-rooftops', 1)
          }
          this.spawnCollectBurst(item.curX + iw / 2, bobY + ih / 2, isStarDouble ? '#ffb5d8' : '#fff5a8', 7)
          this.floatingTexts.push({
            x: item.curX + 2,
            y: bobY - 2,
            vy: -20,
            text: comboMult >= 2 ? `+${pts} x${comboMult}!` : isStarDouble ? '+20 🍡' : '+10',
            color: comboMult >= 3 ? '#ffe475' : isStarDouble ? '#ffd4ea' : '#fff9cc',
            life: 0.82,
            maxLife: 0.82
          })
        }
        changed = true
      }
    }

    if (changed) {
      const levelRecChanged = this.syncCurrentLevelBestRecords()
      const highChanged = this.updateHighScoreIfNeeded()
      if (levelRecChanged && !highChanged) {
        this.persistSave(false)
      }
      this.emitHud()
    }
  }

  private checkNpcGreeting(): void {
    if (this.npcGreeted) return
    const npc = this.level.npc
    const distX = Math.abs(this.player.x + this.player.w / 2 - (npc.x + 8))
    const distY = Math.abs(this.player.y - npc.y)
    if (distX <= 82 && distY <= 60) {
      this.npcGreeted = true
      const species = getCharacterById(this.progress.selectedCharacter).species
      this.audio.playSpeciesVoice(species)
    }
  }

  private updateShards(): void {
    const p = this.player
    const reachPad = p.mooncakeTimer > 0 ? 5 : 2
    for (const sh of this.shards) {
      if (sh.collected) continue
      const bobY = sh.y + Math.round(Math.sin(this.worldTime * 2.1 + sh.phase) * 2)
      if (
        this.aabbOverlap(
          p.x - reachPad,
          p.y - reachPad,
          p.w + reachPad * 2,
          p.h + reachPad * 2,
          sh.x,
          bobY,
          12,
          14
        )
      ) {
        sh.collected = true
        this.incrementDailyQuest('collect-shard-1', 1)
        this.triggerPlayerEmote('star', 1.6)
        const pts = sh.previouslyCollected ? 30 : 60
        this.levelScore += pts
        this.totalRunScore += pts
        this.updateHighScoreIfNeeded()
        this.audio.playShardCollect()
        this.spawnCollectBurst(sh.x + 6, bobY + 7, '#a8efff', 14)
        this.spawnCollectBurst(sh.x + 6, bobY + 7, '#ffe885', 8)
        const nowCount = this.shards.filter((s) => s.collected || s.previouslyCollected).length
        this.floatingTexts.push({
          x: sh.x + 6,
          y: bobY - 4,
          vy: -18,
          text: `💎 SHARD ${nowCount}/3!`,
          color: '#b8f3ff',
          life: 1.25,
          maxLife: 1.25
        })
        this.emitHud()
      }
    }
  }

  private bashEnemyWithMooncake(cx: number, cy: number): void {
    this.touchedEnemyThisLevel = true
    this.levelScore += 50
    this.totalRunScore += 50
    this.updateHighScoreIfNeeded()
    this.audio.playMooncakeBash()
    this.spawnCollectBurst(cx, cy, '#ffe26b', 14)
    this.floatingTexts.push({
      x: cx,
      y: cy - 6,
      vy: -24,
      text: '+50 🥮',
      color: '#ffe680',
      life: 0.95,
      maxLife: 0.95
    })
    this.emitHud()
  }

  private checkHazards(): void {
    const p = this.player
    const isGiant = p.mooncakeTimer > 0
    const pad = isGiant ? 4 : 0
    const px = p.x + 1 - pad
    const py = p.y + 2 - pad
    const pw = p.w - 2 + pad * 2
    const ph = p.h - 3 + pad * 2

    // 1. Patrol Crows (Golden Mooncake bashes for +50!)
    for (const crow of this.crows) {
      if (crow.defeated) continue
      if (this.aabbOverlap(px, py, pw, ph, crow.curX + 3, crow.curY + 3, 12, 8)) {
        if (isGiant) {
          crow.defeated = true
          this.bashEnemyWithMooncake(crow.curX + 9, crow.curY + 7)
          continue
        }
        if (p.invincibleTimer > 0) return
        const knockDir = p.x + p.w / 2 < crow.curX + 9 ? -1 : 1
        this.damagePlayer(knockDir * 95, -140)
        return
      }
    }

    // 2. Sakura Forest Hedgehogs (Mooncake-bashable!)
    for (const hh of this.hedgehogs) {
      if (hh.defeated) continue
      if (this.aabbOverlap(px, py, pw, ph, hh.curX + 2, hh.y + 2, 10, 9)) {
        if (isGiant) {
          hh.defeated = true
          this.bashEnemyWithMooncake(hh.curX + 7, hh.y + 6)
          continue
        }
        if (p.invincibleTimer > 0) return
        const knockDir = p.x + p.w / 2 < hh.curX + 7 ? -1 : 1
        this.damagePlayer(knockDir * 90, -140)
        return
      }
    }

    // 3. Cloudland Swooping Crows (Mooncake-bashable!)
    for (const sw of this.swoopCrows) {
      if (sw.defeated) continue
      if (this.aabbOverlap(px, py, pw, ph, sw.curX + 3, sw.curY + 3, 12, 8)) {
        if (isGiant) {
          sw.defeated = true
          this.bashEnemyWithMooncake(sw.curX + 9, sw.curY + 7)
          continue
        }
        if (p.invincibleTimer > 0) return
        const knockDir = p.x + p.w / 2 < sw.curX + 9 ? -1 : 1
        this.damagePlayer(knockDir * 95, -140)
        return
      }
    }

    // 4. Harbor Agile Pier Crabs (Mooncake-bashable!)
    for (const cr of this.crabs) {
      if (cr.defeated) continue
      if (this.aabbOverlap(px, py, pw, ph, cr.curX + 2, cr.curY + 2, 10, 8)) {
        if (isGiant) {
          cr.defeated = true
          this.bashEnemyWithMooncake(cr.curX + 7, cr.curY + 5)
          continue
        }
        if (p.invincibleTimer > 0) return
        const knockDir = p.x + p.w / 2 < cr.curX + 7 ? -1 : 1
        this.damagePlayer(knockDir * 95, -140)
        return
      }
    }

    // 5. Harbor Floating Lantern Wisps (Mooncake-bashable!)
    for (const w of this.wisps) {
      if (w.defeated) continue
      if (this.aabbOverlap(px, py, pw, ph, w.x + 2, w.curY + 2, 8, 10)) {
        if (isGiant) {
          w.defeated = true
          this.bashEnemyWithMooncake(w.x + 6, w.curY + 7)
          continue
        }
        if (p.invincibleTimer > 0) return
        const knockDir = p.x + p.w / 2 < w.x + 6 ? -1 : 1
        this.damagePlayer(knockDir * 90, -140)
        return
      }
    }

    if (p.invincibleTimer > 0 || isGiant) return

    // 6. Rooftop Steam Chimneys (active vertical steam column)
    for (const sv of this.steamVents) {
      if (sv.phase !== 'active') continue
      if (this.aabbOverlap(p.x + 2, p.y + 2, p.w - 4, p.h - 2, sv.x - 4, sv.y - 34, 14, 34)) {
        this.damagePlayer(p.facing === 1 ? -75 : 75, -145)
        return
      }
    }

    // 7. Cloudland Mini Storm Clouds (brief lightning bolt below)
    for (const sc of this.stormClouds) {
      if (sc.phase !== 'zap') continue
      if (this.aabbOverlap(p.x + 2, p.y + 2, p.w - 4, p.h - 2, sc.x + 7, sc.y + 10, 10, 44)) {
        this.damagePlayer(p.facing === 1 ? -80 : 80, -135)
        return
      }
    }

    // 8. Water puddles check (Moonlit Pearl or Giant Mooncake walks safely across!)
    for (const pud of this.level.puddles) {
      if (this.aabbOverlap(p.x + 2, p.y + 6, p.w - 4, p.h - 6, pud.x + 3, pud.y + 2, pud.w - 6, 6)) {
        if (p.pearlTimer > 0) {
          if (Math.random() < 0.25) {
            this.particles.push({
              x: p.x + p.w / 2 + (Math.random() - 0.5) * 6,
              y: pud.y + 2,
              vx: (Math.random() - 0.5) * 16,
              vy: -10 - Math.random() * 10,
              life: 0.28,
              maxLife: 0.28,
              size: 1,
              color: '#e0f7ff',
              kind: 'glint'
            })
          }
          continue
        }
        this.spawnSplash(p.x + p.w / 2, pud.y + 3)
        this.damagePlayer(p.facing === 1 ? -75 : 75, -145)
        return
      }
    }
  }

  private damagePlayer(knockVx: number, knockVy: number): void {
    const p = this.player

    // Astral Aegis barrier negates hits completely during Boss Fights!
    if (p.astralAegisTimer > 0) {
      p.starlightPulseCooldown = 0
      this.audio.playAstralAegis(true)
      this.spawnCollectBurst(p.x + p.w / 2, p.y + p.h / 2, '#9ef0ff', 10)
      this.emitHud()
      return
    }

    // Polar Bear Passive — Arctic Resilience: 1 free Frost Shield per level (does NOT break Pacifist Run!)
    if (p.hasFrostShield) {
      p.hasFrostShield = false
      p.invincibleTimer = INVINCIBLE_DURATION
      p.vx = knockVx * 0.55
      p.vy = knockVy * 0.7
      this.knockbackTimer = 0.1
      this.audio.playFrostShieldBreak()
      this.spawnCollectBurst(p.x + p.w / 2, p.y + p.h / 2, '#a8f2ff', 14)
      this.floatingTexts.push({
        x: p.x + p.w / 2,
        y: p.y - 6,
        vy: -18,
        text: '❄️ FROST SHIELD!',
        color: '#b8f7ff',
        life: 1.05,
        maxLife: 1.05
      })
      this.emitHud()
      return
    }

    // Moon Bubble Shield absorbs 1 hazard collision cleanly!
    if (p.hasBubbleShield) {
      p.hasBubbleShield = false
      p.invincibleTimer = INVINCIBLE_DURATION
      p.vx = knockVx * 0.65
      p.vy = knockVy * 0.75
      this.knockbackTimer = 0.12
      this.audio.playBubblePop()
      this.spawnBubblePop(p.x + p.w / 2, p.y + p.h / 2)
      this.floatingTexts.push({
        x: p.x + p.w / 2,
        y: p.y - 4,
        vy: -18,
        text: 'TERLINDUNGI!',
        color: '#c4f0ff',
        life: 0.95,
        maxLife: 0.95
      })
      this.emitHud()
      return
    }

    // Black Bear Passive — Sturdy Paws: reduced knockback; Midnight Cat Passive: +45% invincibility!
    const knockScale = this.progress.selectedCharacter === 'bear-black' ? 0.62 : 1.0
    const invincScale = this.progress.selectedCharacter === 'cat-midnight' ? 1.45 : 1.0

    p.hearts = Math.max(0, p.hearts - 1)
    this.tookDamageThisLevel = true
    p.invincibleTimer = INVINCIBLE_DURATION * invincScale
    p.dashTimer = 0
    p.coyoteTimer = 0
    p.vx = knockVx * knockScale
    p.vy = knockVy * (knockScale < 1 ? 0.82 : 1)
    this.knockbackTimer = knockScale < 1 ? 0.1 : 0.16
    p.onGround = false
    p.standingMovingPlatformIdx = -1
    this.hurtPulseCount += 1
    this.audio.playHurt()

    this.spawnCollectBurst(p.x + p.w / 2, p.y + p.h / 2, '#ff8cb2', 8)

    if (p.hearts <= 0) {
      this.triggerGameOver()
    } else {
      this.emitHud()
    }
  }

  private handlePitFall(): void {
    const p = this.player
    p.hearts = Math.max(0, p.hearts - 1)
    this.tookDamageThisLevel = true
    this.hurtPulseCount += 1
    this.progress.totalFalls += 1
    this.persistSave(false)
    this.checkAchievements()
    this.audio.playHurt()

    if (p.hearts <= 0) {
      this.triggerGameOver()
      return
    }

    const activeCp = this.activeCheckpointIdx >= 0 ? this.checkpoints[this.activeCheckpointIdx] : null
    if (activeCp && activeCp.activated) {
      p.x = activeCp.x + 1
      p.y = activeCp.y + 6
    } else {
      p.x = p.safeX
      p.y = p.safeY
    }
    p.vx = 0
    p.vy = 0
    this.knockbackTimer = 0
    p.dashTimer = 0
    p.airDashUsed = false
    p.onGround = false
    p.jumpsUsed = 0
    p.invincibleTimer = INVINCIBLE_DURATION
    this.spawnDoubleJumpStars(p.x + p.w / 2, p.y + p.h / 2)
    this.emitHud()
  }

  private triggerGameOver(): void {
    this.syncCurrentLevelBestRecords()
    this.updateHighScoreIfNeeded()
    this.persistSave(false)
    this.screen = 'gameOver'
    this.clearAllInputs()
    this.audio.playGameOver()
    this.emitHud()
  }

  private checkPortal(): void {
    const p = this.player
    const portal = this.level.portal
    // Boss Stages lock the Moon Portal until the Boss is defeated!
    if (this.bossController && !this.bossController.defeated) {
      return
    }
    if (this.aabbOverlap(p.x, p.y, p.w, p.h, portal.x + 6, portal.y + 8, 20, 30)) {
      const prevRankSCount = countRankSLevels(this.progress)
      const species = getCharacterById(this.progress.selectedCharacter).species
      this.audio.playSpeciesVoice(species)
      this.audio.playLevelClear()
      this.spawnCollectBurst(portal.x + 16, portal.y + 20, '#9be8ff', 18)
      this.spawnCollectBurst(portal.x + 16, portal.y + 20, '#ffe46b', 14)

      const heartBonus = p.hearts * 25
      this.levelScore += heartBonus
      this.totalRunScore += heartBonus

      const starsCollected = this.collectibles.filter((c) => c.kind === 'star' && c.collected).length
      const totalStars = this.collectibles.filter((c) => c.kind === 'star').length
      const fishCollected = this.collectibles.filter((c) => c.kind === 'fish' && c.collected).length
      const totalFish = this.collectibles.filter((c) => c.kind === 'fish').length

      const starRatio = totalStars > 0 ? starsCollected / totalStars : 1
      const rating: 1 | 2 | 3 =
        this.bossController?.defeated
          ? 3
          : starRatio >= 0.8 && fishCollected >= Math.min(2, totalFish)
            ? 3
            : starRatio >= 0.5 || fishCollected >= 1
              ? 2
              : 1
      this.lastStageRating = rating

      if (!this.level.isSecretFinale) {
        const nextUnlock = Math.min(MAIN_LEVEL_COUNT, this.level.id + 1)
        if (nextUnlock > this.progress.unlockedLevel) {
          this.progress.unlockedLevel = nextUnlock
        }
      }
      this.progress.lastPlayedLevel = this.level.id

      const prevBest = this.progress.bestLevelScores[this.level.id] ?? 0
      if (this.levelScore > prevBest) {
        this.progress.bestLevelScores[this.level.id] = this.levelScore
      }

      const prevRec = this.progress.levelRecords[this.level.id]
      const alreadyClearedBefore = (prevRec?.rating ?? 0) >= 1
      const alreadyClaimedBonus = Boolean(prevRec?.threeStarBonusClaimed)
      const earnThreeStarBonus = rating === 3 && !alreadyClaimedBonus
      this.justEarnedThreeStarBonus = earnThreeStarBonus
      this.returnedFromClear = true
      this.triggerPlayerEmote('music', 1.8)

      // Rebalanced fishCoins economy:
      // 1) In-level stars conversion: 1 🐟 per 10 stars collected (capped at 5 🐟 per run)
      const starsCoins = Math.min(5, Math.floor(starsCollected / 10))
      // 2) One-time First Clear bonus: +5 🐟 per standard level (Levels 1–12)
      const firstClearCoins = !alreadyClearedBefore && !this.level.isSecretFinale ? 5 : 0
      // 3) One-time 3★ bonus: +1 🐟
      const threeStarCoins = earnThreeStarBonus ? 1 : 0
      // 4) Boss Stage Rewards: L13 +25 first / +5 replay; L14 +40 first / +8 replay!
      let bossCoins = 0
      if (this.level.bossConfig) {
        const bCfg = this.level.bossConfig
        const replayBossCoins = this.level.id === 14 ? 8 : 5
        bossCoins = alreadyClearedBefore ? replayBossCoins : bCfg.rewardCoins
        let unlockedBossCosmetic = false
        if (bCfg.cosmeticSlot === 'head_acc' && !this.progress.ownedHeadAccs.includes(bCfg.cosmeticId as HeadAccId)) {
          this.progress.ownedHeadAccs.push(bCfg.cosmeticId as HeadAccId)
          unlockedBossCosmetic = true
        } else if (bCfg.cosmeticSlot === 'cape' && !this.progress.ownedCapes.includes(bCfg.cosmeticId as CapeId)) {
          this.progress.ownedCapes.push(bCfg.cosmeticId as CapeId)
          unlockedBossCosmetic = true
        }
        if (unlockedBossCosmetic) {
          this.showToast({
            icon: '👑',
            label: `HADIAH BOSS (+${bCfg.rewardCoins} 🐟)!`,
            title: bCfg.cosmeticName
          })
        }
      }
      // 5) Sun Bear Passive — Sweet Forager: clean +1 🐟 flat bonus when >= 15 stars collected!
      const foragerCoins =
        this.progress.selectedCharacter === 'bear-sun' && starsCollected >= 15 ? 1 : 0

      const baseStageCoins = starsCoins + firstClearCoins + threeStarCoins + bossCoins + foragerCoins
      if (baseStageCoins > 0) {
        this.progress.fishBank += baseStageCoins
        this.progress.totalFishEarned += baseStageCoins
      }

      this.progress.levelRecords[this.level.id] = {
        bestScore: Math.max(prevRec?.bestScore ?? 0, this.levelScore),
        bestStars: Math.max(prevRec?.bestStars ?? 0, starsCollected),
        totalStars,
        bestFish: Math.max(prevRec?.bestFish ?? 0, fishCollected),
        totalFish,
        rating: Math.max(prevRec?.rating ?? 0, rating) as 0 | 1 | 2 | 3,
        threeStarBonusClaimed: alreadyClaimedBonus || earnThreeStarBonus
      }

      // Persist Starlight Shards collected during this level & unlock Biome Exclusive Cosmetic at 6/6 biome shards!
      const prevShards: ShardTuple = this.progress.collectedShards[this.level.id] ?? [false, false, false]
      const mergedShards: ShardTuple = [
        prevShards[0] || Boolean(this.shards.find((s) => s.index === 0)?.collected),
        prevShards[1] || Boolean(this.shards.find((s) => s.index === 1)?.collected),
        prevShards[2] || Boolean(this.shards.find((s) => s.index === 2)?.collected)
      ]
      this.progress.collectedShards[this.level.id] = mergedShards

      if (
        this.level.biome !== 'eclipse' &&
        this.level.biome !== 'citadel' &&
        countBiomeCollectedShards(this.level.biome, this.progress) >= 6
      ) {
        const reward = BIOME_SHARD_REWARDS[this.level.biome as MainBiomeId]
        let unlockedNow = false
        if (reward.slot === 'hat' && !this.progress.ownedHats.includes(reward.id as HatId)) {
          this.progress.ownedHats.push(reward.id as HatId)
          unlockedNow = true
        } else if (reward.slot === 'cape' && !this.progress.ownedCapes.includes(reward.id as CapeId)) {
          this.progress.ownedCapes.push(reward.id as CapeId)
          unlockedNow = true
        } else if (reward.slot === 'scarf' && !this.progress.ownedScarves.includes(reward.id as ScarfColorId)) {
          this.progress.ownedScarves.push(reward.id as ScarfColorId)
          unlockedNow = true
        }
        if (unlockedNow) {
          this.showToast({
            icon: '💎',
            label: 'BIOME REWARD TERBUKA! (6/6 SHARD)',
            title: reward.name
          })
        }
      }

      // Daily Quest: Clear 2 Levels + No-Hit Level Clear & Stamp Book Pacifist Run
      this.incrementDailyQuest('clear-2-levels', 1)
      if (!this.tookDamageThisLevel) {
        this.incrementDailyQuest('no-hit-clear', 1)
        if (!this.touchedEnemyThisLevel) {
          this.progress.pacifistClears += 1
        }
      }

      // Always record Speedrun Best Time, S/A/B/C Rank, & One-Time Smart Tier Roll-Up Coin Rewards!
      const finalRunMs = Math.max(1000, Math.round(this.runElapsedMs))
      const runRank = calculateSpeedrunRank(this.level.id, finalRunMs)
      this.lastSpeedrunRank = runRank
      const prevBestTime = this.progress.bestTimes[this.level.id]
      const beatBest = !prevBestTime || finalRunMs < prevBestTime
      this.isNewBestTime = beatBest
      if (beatBest) {
        this.progress.bestTimes[this.level.id] = finalRunMs
      }
      const prevRank = this.progress.levelRanks[this.level.id]
      if (rankOrder(runRank) > rankOrder(prevRank)) {
        this.progress.levelRanks[this.level.id] = runRank
      }

      // Celebrate unlocking ★ SECRET FINALE when reaching Rank S >= 3!
      const nextRankSCount = countRankSLevels(this.progress)
      if (prevRankSCount < 3 && nextRankSCount >= 3) {
        this.showToast({
          icon: '★',
          label: 'SECRET FINALE TERBUKA! (3 RANK S)',
          title: 'Level 13 & 14 Boss Stages!'
        })
      }

      const rankRewardRes = claimSpeedrunRankRewards(
        runRank,
        this.progress.claimedRankRewards[this.level.id]
      )
      this.progress.claimedRankRewards[this.level.id] = rankRewardRes.nextClaimed
      this.lastRankRewardBreakdown = rankRewardRes.grants
      this.lastRankRewardTotal = rankRewardRes.totalCoins
      if (rankRewardRes.totalCoins > 0) {
        this.progress.fishBank += rankRewardRes.totalCoins
        this.progress.totalFishEarned += rankRewardRes.totalCoins
      }

      this.lastCoinBreakdown = {
        starsCoins,
        firstClearCoins,
        rankCoins: rankRewardRes.totalCoins,
        foragerCoins,
        bossCoins,
        threeStarCoins,
        totalCoins: baseStageCoins + rankRewardRes.totalCoins
      }

      // Time Trial / Speedrun record & medal persistence
      if (this.isTimeTrial) {
        const finalMs = Math.max(1000, Math.round(this.timeTrialElapsedMs))
        const medal = evaluateTimeTrialMedal(this.level.id, finalMs)
        this.lastTimeTrialMedal = medal
        const prevTt = this.progress.timeTrials[this.level.id]
        const isFaster = !prevTt || finalMs < prevTt.bestTimeMs
        this.isNewTimeRecord = isFaster
        const bestMedal =
          prevTt && rankMedal(prevTt.medal) > rankMedal(medal) ? prevTt.medal : medal
        this.progress.timeTrials[this.level.id] = {
          bestTimeMs: isFaster ? finalMs : prevTt.bestTimeMs,
          medal: bestMedal
        }
      } else {
        this.lastTimeTrialMedal = 'none'
        this.isNewTimeRecord = false
      }

      this.updateHighScoreIfNeeded()
      this.persistSave(true)
      this.checkAchievements()

      this.clearAllInputs()
      // Always show Stage Clear card first (even after Level 8, which then leads into the Epilogue Cutscene!)
      this.screen = 'levelClear'
      this.emitHud()
    }
  }

  private updateHighScoreIfNeeded(): boolean {
    if (this.totalRunScore > this.progress.highScore) {
      this.progress.highScore = this.totalRunScore
      this.persistSave(false)
      return true
    }
    return false
  }

  private updateCamera(dt: number): void {
    const maxCamX = Math.max(0, this.level.width - this.viewW)
    const playerCenterX = this.player.x + this.player.w / 2
    const isPortraitView = this.viewW < 280
    const anchorRatio = isPortraitView ? 0.36 : 0.44
    const deadzone = isPortraitView ? 10 : CAMERA_DEADZONE_HALF_W
    const screenAnchorX = this.cameraX + this.viewW * anchorRatio

    let targetX = this.cameraX
    if (playerCenterX > screenAnchorX + deadzone) {
      targetX = playerCenterX - (this.viewW * anchorRatio + deadzone)
    } else if (playerCenterX < screenAnchorX - deadzone) {
      targetX = playerCenterX - (this.viewW * anchorRatio - deadzone)
    }

    const clampedTargetX = Math.max(0, Math.min(maxCamX, targetX))
    const smoothFactor = 1 - Math.exp(-6.5 * dt)
    this.cameraX += (clampedTargetX - this.cameraX) * smoothFactor
    if (Math.abs(clampedTargetX - this.cameraX) < 0.15) {
      this.cameraX = clampedTargetX
    }

    const maxCamY = Math.max(0, this.level.height - VIEW_H)
    if (maxCamY === 0) {
      this.cameraTargetY = 0
      this.cameraY = 0
    } else if (this.player.onGround) {
      const desiredY = Math.max(0, Math.min(maxCamY, this.player.y - VIEW_H * 0.62))
      if (Math.abs(desiredY - this.cameraTargetY) > 28) {
        this.cameraTargetY = desiredY
      }
      this.cameraY += (this.cameraTargetY - this.cameraY) * (1 - Math.exp(-3.0 * dt))
    }
  }

  // ============================================================================
  // PARTICLES, BIOME AMBIENT VFX & AFTERIMAGES
  // ============================================================================

  private spawnJumpDust(x: number, y: number): void {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y - 1,
        vx: (Math.random() - 0.5) * 38,
        vy: -8 - Math.random() * 18,
        life: 0.28 + Math.random() * 0.14,
        maxLife: 0.42,
        size: 2,
        color: i % 2 === 0 ? '#e6dbfa' : '#a890d1',
        kind: 'dust'
      })
    }
  }

  private spawnBouncePuffs(x: number, y: number): void {
    const colors = ['#ffffff', '#ffd4ea', '#ffe7a8']
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 18,
        y,
        vx: (Math.random() - 0.5) * 44,
        vy: -12 - Math.random() * 24,
        life: 0.35 + Math.random() * 0.18,
        maxLife: 0.53,
        size: 2,
        color: colors[i % colors.length]!,
        kind: 'dust'
      })
    }
  }

  private spawnBubblePop(x: number, y: number): void {
    const colors = ['#ffffff', '#b8ecff', '#7ec8ff']
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12
      const speed = 30 + Math.random() * 35
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.35 + Math.random() * 0.2,
        maxLife: 0.55,
        size: i % 2 === 0 ? 2 : 1,
        color: colors[i % colors.length]!,
        kind: 'bubble'
      })
    }
  }

  private spawnDoubleJumpStars(x: number, y: number): void {
    const scarf = getScarfById(this.progress.selectedScarf)
    const colors = ['#fff9b0', '#ffd84d', scarf.spark, '#ffffff']
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * i) / 10 + Math.random() * 0.25
      const speed = 28 + Math.random() * 44
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y - 1,
        vx: Math.cos(angle) * speed * (i % 2 === 0 ? 1 : -1),
        vy: 14 + Math.random() * 28,
        life: 0.35 + Math.random() * 0.22,
        maxLife: 0.57,
        size: i % 3 === 0 ? 3 : 2,
        color: colors[i % colors.length]!,
        kind: 'star'
      })
    }
  }

  private spawnDashBurst(x: number, y: number, dir: 1 | -1, rainbow = false): void {
    const scarf = getScarfById(this.progress.selectedScarf)
    const colors = rainbow
      ? ['#ffb3d9', '#ffe38f', '#9ef5cf', '#9ee6ff', '#d4b3ff']
      : ['#ffffff', scarf.spark, '#ffe484', scarf.light]
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: x - dir * 4 + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 10,
        vx: -dir * (38 + Math.random() * 68),
        vy: (Math.random() - 0.5) * 42,
        life: 0.24 + Math.random() * 0.18,
        maxLife: 0.42,
        size: i % 3 === 0 ? 3 : 2,
        color: colors[i % colors.length]!,
        kind: 'star'
      })
    }
  }

  private spawnDashTrailSpark(x: number, y: number, dir: 1 | -1, rainbow = false): void {
    const scarf = getScarfById(this.progress.selectedScarf)
    const colors = rainbow
      ? ['#ffb3d9', '#ffe38f', '#9ef5cf', '#9ee6ff', '#d4b3ff']
      : ['#fff5fa', scarf.spark, '#ffe382']
    this.particles.push({
      x,
      y,
      vx: -dir * (18 + Math.random() * 26),
      vy: (Math.random() - 0.5) * 18,
      life: 0.22 + Math.random() * 0.14,
      maxLife: 0.36,
      size: Math.random() > 0.45 ? 3 : 1,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      kind: 'star'
    })
  }

  private spawnCollectBurst(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3
      const speed = 26 + Math.random() * 52
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 12,
        life: 0.32 + Math.random() * 0.24,
        maxLife: 0.56,
        size: i % 2 === 0 ? 2 : 1,
        color: i % 3 === 0 ? '#ffffff' : color,
        kind: 'spark'
      })
    }
  }

  private spawnSplash(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y,
        vx: (Math.random() - 0.5) * 65,
        vy: -45 - Math.random() * 45,
        life: 0.35 + Math.random() * 0.15,
        maxLife: 0.5,
        size: 2,
        color: i % 2 === 0 ? '#7cc4ff' : '#d6f2ff',
        kind: 'splash'
      })
    }
  }

  private spawnEpilogueParticles(): void {
    if (this.particles.length > 60) return
    // Gentle golden harbor fireflies rising slowly above the moonlit pier
    if (Math.random() < 0.08) {
      this.particles.push({
        x: 18 + Math.random() * (this.viewW - 36),
        y: 120 + Math.random() * 58,
        vx: (Math.random() - 0.5) * 4,
        vy: -2.2 - Math.random() * 3.5,
        life: 2.4 + Math.random() * 1.4,
        maxLife: 3.8,
        size: Math.random() > 0.65 ? 2 : 1,
        color: Math.random() > 0.35 ? '#ffe885' : '#ffb8dc',
        kind: 'ambient'
      })
    }
    // Delicate shimmering star motes near the full moon
    if (Math.random() < 0.04) {
      this.particles.push({
        x: 244 + (Math.random() - 0.5) * 90,
        y: 44 + (Math.random() - 0.5) * 34,
        vx: (Math.random() - 0.5) * 2,
        vy: -1.5 - Math.random() * 2,
        life: 1.8 + Math.random() * 0.9,
        maxLife: 2.7,
        size: Math.random() > 0.7 ? 3 : 1,
        color: '#fff9d1',
        kind: 'glint'
      })
    }
  }

  private spawnAmbientWorldParticles(): void {
    if (this.screen === 'victory') return
    const isModern = this.progress.graphicsStyle === 'modern'
    if (this.particles.length > (isModern ? 130 : 105)) return
    const camLeft = this.cameraX - 24
    const camRight = this.cameraX + this.viewW + 24
    const biome = this.level.biome

    // Modern 16-Bit extra subtle varied-size glowing night dust & firefly micro-particles
    if (isModern && Math.random() < 0.16) {
      const microColor =
        biome === 'sakura'
          ? '#ffd1e8'
          : biome === 'harbor'
            ? '#ffe985'
            : biome === 'cloudland'
              ? '#f2e0ff'
              : '#fff0ba'
      this.particles.push({
        x: camLeft + Math.random() * (this.viewW + 48),
        y: 20 + Math.random() * 165,
        vx: (Math.random() - 0.5) * 3.0,
        vy: -1.8 - Math.random() * 3.0,
        life: 2.4 + Math.random() * 1.4,
        maxLife: 3.8,
        size: Math.random() > 0.6 ? 2 : 1,
        color: microColor,
        kind: Math.random() > 0.72 ? 'glint' : 'ambient'
      })
    }

    // Biome-specific atmospheric particles!
    if (biome === 'sakura' && Math.random() < 0.14) {
      // Gently falling pink sakura petals
      this.particles.push({
        x: camLeft + Math.random() * (this.viewW + 48),
        y: -4,
        vx: -8 - Math.random() * 6,
        vy: 14 + Math.random() * 10,
        life: 6.5,
        maxLife: 6.5,
        size: Math.random() > 0.45 ? 2 : 1,
        color: Math.random() > 0.35 ? '#ffb5d8' : '#ffe3f0',
        kind: 'petal'
      })
    } else if (biome === 'cloudland' && Math.random() < 0.08) {
      // Calm shimmering pastel crystal star motes
      this.particles.push({
        x: camLeft + Math.random() * (this.viewW + 48),
        y: 16 + Math.random() * 160,
        vx: (Math.random() - 0.5) * 3,
        vy: -2 - Math.random() * 3,
        life: 1.8 + Math.random() * 1.2,
        maxLife: 3.0,
        size: Math.random() > 0.65 ? 3 : 1,
        color: Math.random() > 0.5 ? '#fff8d4' : '#e0ccff',
        kind: 'glint'
      })
    } else if (biome === 'harbor' && Math.random() < 0.09) {
      // Slow golden fireflies drifting over the harbor pier
      this.particles.push({
        x: camLeft + Math.random() * (this.viewW + 48),
        y: 78 + Math.random() * 98,
        vx: (Math.random() - 0.5) * 5,
        vy: -2 - Math.random() * 3.5,
        life: 2.2 + Math.random() * 1.4,
        maxLife: 3.6,
        size: Math.random() > 0.6 ? 2 : 1,
        color: Math.random() > 0.3 ? '#ffe87c' : '#96ffda',
        kind: 'ambient'
      })
    }

    for (const lan of this.level.lanterns) {
      if (lan.x < camLeft || lan.x > camRight) continue
      if (Math.random() < 0.035) {
        this.particles.push({
          x: lan.x + 6 + (Math.random() - 0.5) * 16,
          y: lan.y + 6 + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 3.2,
          vy: -2.8 - Math.random() * 4.2,
          life: 1.2 + Math.random() * 0.85,
          maxLife: 2.05,
          size: Math.random() > 0.72 ? 2 : 1,
          color: Math.random() > 0.35 ? '#ffe899' : '#ffb866',
          kind: 'ambient'
        })
      }
    }

    for (const cp of this.checkpoints) {
      if (cp.activated && cp.x > camLeft && cp.x < camRight && Math.random() < 0.05) {
        this.particles.push({
          x: cp.x + 7 + (Math.random() - 0.5) * 14,
          y: cp.y + 7,
          vx: (Math.random() - 0.5) * 3,
          vy: -3.5 - Math.random() * 4,
          life: 1.0 + Math.random() * 0.6,
          maxLife: 1.6,
          size: 1,
          color: Math.random() > 0.4 ? '#ffaad2' : '#ffe885',
          kind: 'ambient'
        })
      }
    }

    for (const item of this.collectibles) {
      if (item.collected) continue
      if (item.curX < camLeft || item.curX > camRight) continue
      if (Math.random() < 0.02) {
        const bobY = item.curY + Math.round(Math.sin(this.worldTime * 1.4 + item.phase) * 1.5)
        this.particles.push({
          x: item.curX + 6 + (Math.random() - 0.5) * 12,
          y: bobY + 5 + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 3,
          vy: -2.2 - Math.random() * 3.8,
          life: 0.85 + Math.random() * 0.55,
          maxLife: 1.4,
          size: 1,
          color: item.kind === 'fish' ? '#ffd84d' : '#fff9cc',
          kind: 'ambient'
        })
      }
    }

    for (const pud of this.level.puddles) {
      if (pud.x < camLeft || pud.x > camRight) continue
      if (Math.random() < 0.045) {
        this.particles.push({
          x: pud.x + 4 + Math.random() * (pud.w - 8),
          y: pud.y + 2 + Math.random() * 3,
          vx: 0,
          vy: -2,
          life: 0.28 + Math.random() * 0.2,
          maxLife: 0.48,
          size: 1,
          color: Math.random() > 0.4 ? '#e6f7ff' : '#85ccff',
          kind: 'glint'
        })
      }
    }

    if (Math.random() < 0.2) {
      const portal = this.level.portal
      if (portal.x > camLeft - 40 && portal.x < camRight + 40) {
        this.particles.push({
          x: portal.x + 8 + Math.random() * 16,
          y: portal.y + 10 + Math.random() * 24,
          vx: (Math.random() - 0.5) * 10,
          vy: -12 - Math.random() * 14,
          life: 0.6 + Math.random() * 0.4,
          maxLife: 1.0,
          size: Math.random() > 0.5 ? 2 : 1,
          color: Math.random() > 0.45 ? '#b3f0ff' : '#ffe680',
          kind: 'portal'
        })
      }
    }
  }

  private updateParticles(dt: number): void {
    const camLeft = this.cameraX - 48
    const camRight = this.cameraX + this.viewW + 48
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i]!
      pt.x += pt.vx * dt
      pt.y += pt.vy * dt
      if (pt.kind === 'splash') {
        pt.vy += 240 * dt
      } else if (pt.kind === 'star' || pt.kind === 'spark' || pt.kind === 'bubble') {
        pt.vx *= 0.94
        pt.vy *= 0.94
      } else if (pt.kind === 'ambient') {
        pt.x += Math.sin(this.worldTime * 2.0 + i) * 3 * dt
      } else if (pt.kind === 'petal') {
        pt.x += Math.sin(this.worldTime * 1.5 + i) * 9 * dt
      }
      pt.life -= dt
      const outOfBounds =
        pt.x < camLeft || pt.x > camRight || pt.y < -36 || pt.y > VIEW_H + 20
      if (pt.life <= 0 || outOfBounds) {
        this.particles.splice(i, 1)
      }
    }
  }

  private updateAfterimages(dt: number): void {
    const camLeft = this.cameraX - 48
    const camRight = this.cameraX + this.viewW + 48
    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      const img = this.afterimages[i]!
      img.life -= dt
      if (img.life <= 0 || img.x < camLeft || img.x > camRight) {
        this.afterimages.splice(i, 1)
      }
    }
  }

  private updateFloatingTexts(dt: number): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i]!
      ft.y += ft.vy * dt
      ft.life -= dt
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1)
      }
    }
  }

  private aabbOverlap(
    ax: number,
    ay: number,
    aw: number,
    ah: number,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
  }

  // ============================================================================
  // PIXEL-CRISP MOTION-COMFORT RENDERER (4 BIOMES + POWER-UPS + DIEGETIC SIGNS)
  // ============================================================================

  private drawCircularGlow(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    innerColor: string,
    midColor: string,
    outerColor: string
  ): void {
    const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, radius)
    grad.addColorStop(0, innerColor)
    grad.addColorStop(0.48, midColor)
    grad.addColorStop(1, outerColor)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  private render(): void {
    const ctx = this.ctx
    ctx.imageSmoothingEnabled = false

    if (this.screen === 'victory') {
      this.renderEndingCutscene(ctx)
      return
    }

    this.syncViewportWidthForCurrentScreen()

    const isHomeMenuScreen =
      this.screen === 'title' ||
      this.screen === 'levelSelect' ||
      this.screen === 'characters' ||
      this.screen === 'shop' ||
      this.screen === 'achievements' ||
      this.screen === 'photoStudio' ||
      this.screen === 'guidebook' ||
      this.screen === 'settings'

    if (isHomeMenuScreen) {
      this.renderHomeCampScene(ctx)
      return
    }

    const camX = Math.round(this.cameraX)
    const camY = Math.round(this.cameraY)

    this.renderNightSky(ctx)
    this.renderStars(ctx, camX)
    this.renderMoon(ctx, camX)
    this.renderClouds(ctx, camX)
    this.renderBiomeBackdrop(ctx, camX)

    ctx.save()
    ctx.translate(-camX, -camY)

    this.renderPlatforms(ctx, camX)
    this.renderTutorialSigns(ctx, camX)
    this.renderRooftopProps(ctx, camX)
    this.renderCritters(ctx, camX)
    this.renderPowerWires(ctx, camX)
    this.renderFragileBranches(ctx, camX)
    this.renderFloatingBoats(ctx, camX)
    this.renderMovingPlatforms(ctx)
    this.renderNewBiomeMechanics(ctx, camX)
    this.renderBounceClouds(ctx)
    this.renderLanterns(ctx, camX)
    this.renderCheckpoint(ctx)
    this.renderPuddles(ctx)
    this.renderWindVortices(ctx, camX)
    this.renderSteamVents(ctx, camX)
    if (!this.bossController || this.bossController.defeated) {
      this.renderPortal(ctx)
    }
    this.renderNpc(ctx)
    this.renderPowerUps(ctx)
    this.renderCollectibles(ctx)
    this.renderShards(ctx)
    this.renderStarRingChallenge(ctx, camX)
    this.renderFallingEventStars(ctx)
    this.renderSecretAlcoves(ctx, camX)
    this.renderCrows(ctx)
    this.renderBiomeEnemies(ctx, camX)
    if (this.bossController) {
      this.bossController.render(ctx, this.progress.reduceMotion)
    }
    this.renderDashAfterimages(ctx)
    if (this.screen === 'title') {
      this.renderTitleCampProps(ctx)
    }
    this.renderPlayer(ctx)
    this.renderCosmeticTrailParticles(ctx)
    this.renderParticles(ctx)
    if (this.progress.graphicsStyle === 'modern') {
      this.renderModernAdditiveLighting(ctx, camX)
    }
    this.renderFloatingTexts(ctx)

    ctx.restore()

    // Photo Mode Decorative Pixel Postcard Frame overlay (baked directly into canvas for exact PNG snap!)
    if (this.screen === 'photoMode' && this.photoModeFrame) {
      this.renderPhotoModePostcardFrame(ctx)
    }

    // Brief gentle transition veil when switching Classic <-> Modern graphics style
    if (this.styleFadeTimer > 0) {
      const fadeAlpha = Math.min(0.45, (this.styleFadeTimer / 0.16) * 0.45)
      ctx.fillStyle = `rgba(10, 5, 22, ${fadeAlpha.toFixed(3)})`
      ctx.fillRect(0, 0, this.viewW, VIEW_H)
    }
  }

  /**
   * Rich 3-Layer Parallax Scenic Home Camp Backdrop (NO Level 1 tutorial signs!).
   * - Enlarged ~1.7x foreground camp framing for warm, prominent character detail.
   * - Lounging unlocked friends relaxing in cozy biome spots & clickable with SFX.
   * - Crisp `imageSmoothingEnabled = false` and full `settings.reduceMotion` support.
   */
  private renderHomeCampScene(ctx: CanvasRenderingContext2D): void {
    const biome = this.getActiveHomeBiome()
    const isModern = this.isModern
    const t = this.progress.reduceMotion ? 0 : this.worldTime

    // =========================================================================
    // LAYER 1: SKY PARALLAX (Sky gradient, stars, moon, drifting clouds)
    // =========================================================================
    const palettes: Record<BiomeId, [string, string, string, string]> = {
      rooftops: ['#0d0720', '#191038', '#2a1a54', '#402672'],
      sakura: ['#140d33', '#23164d', '#3b2366', '#5e3475'],
      cloudland: ['#2c2566', '#463f94', '#6962bd', '#9b95de'],
      harbor: ['#051524', '#0a253a', '#123b54', '#1d556e'],
      cavern: ['#06101f', '#0d2038', '#153457', '#214b73'],
      observatory: ['#0a0c26', '#161b47', '#262b66', '#3e3d82'],
      eclipse: ['#170514', '#2e0b24', '#4a1436', '#6b1d4a'],
      citadel: ['#08051f', '#150f42', '#261c6b', '#3c2b91']
    }
    const [c0, c1, c2, c3] = palettes[biome]
    if (!isModern) {
      ctx.fillStyle = c0
      ctx.fillRect(0, 0, this.viewW, 56)
      ctx.fillStyle = c1
      ctx.fillRect(0, 56, this.viewW, 54)
      ctx.fillStyle = c2
      ctx.fillRect(0, 110, this.viewW, 54)
      ctx.fillStyle = c3
      ctx.fillRect(0, 164, this.viewW, VIEW_H - 164)
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H)
      grad.addColorStop(0, c0)
      grad.addColorStop(0.35, c1)
      grad.addColorStop(0.7, c2)
      grad.addColorStop(1, c3)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, this.viewW, VIEW_H)
    }

    // Twinkling stars + occasional diagonal shooting star across full width
    this.renderStars(ctx, 0)

    // Seamless left-side ambient silhouette extension for ultrawide mobile landscape screens
    const campShiftX = Math.max(0, this.viewW - VIEW_W)
    if (campShiftX > 0) {
      if (biome === 'rooftops') {
        for (let lx = 0; lx < campShiftX + 150; lx += 34) {
          const bh = 72 + ((lx * 13) % 44)
          ctx.fillStyle = (lx / 34) % 2 === 0 ? '#160d2e' : '#1d113b'
          ctx.fillRect(lx, VIEW_H - bh, 32, bh)
          for (let wy = VIEW_H - bh + 10; wy < VIEW_H - 22; wy += 12) {
            for (let wx = lx + 6; wx < lx + 24; wx += 9) {
              if ((wx + wy) % 3 !== 0) {
                ctx.fillStyle = '#c49d56'
                ctx.fillRect(wx, wy, 3, 4)
              }
            }
          }
        }
        ctx.fillStyle = '#241338'
        ctx.fillRect(0, 164, campShiftX + 184, 52)
        ctx.fillStyle = '#5e2f52'
        ctx.fillRect(0, 164, campShiftX + 184, 7)
        ctx.fillStyle = '#8c466e'
        ctx.fillRect(0, 164, campShiftX + 184, 2)
      } else if (biome === 'sakura') {
        ctx.fillStyle = '#1b1640'
        ctx.fillRect(0, 150, campShiftX + 160, 66)
      } else if (biome === 'cloudland') {
        ctx.fillStyle = '#4e2d78'
        ctx.fillRect(0, 156, campShiftX + 160, 60)
      } else if (biome === 'harbor') {
        ctx.fillStyle = '#082530'
        ctx.fillRect(0, 156, campShiftX + 160, 60)
      }
    }

    ctx.save()
    ctx.translate(campShiftX, 0)

    // Biome-specific Sky Moon + Parallax Cloud Bands
    const moonX = biome === 'cloudland' ? 286 : 302
    const moonY = 24
    if (biome !== 'cloudland') {
      if (isModern) {
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'
        this.drawCircularGlow(
          ctx,
          moonX + 16,
          moonY + 16,
          48,
          biome === 'sakura'
            ? 'rgba(255, 226, 240, 0.28)'
            : 'rgba(255, 240, 186, 0.30)',
          'rgba(255, 214, 166, 0.09)',
          'rgba(0, 0, 0, 0)'
        )
        ctx.restore()
      }
      ctx.fillStyle = biome === 'sakura' ? '#fff0f6' : '#fff5c4'
      ctx.beginPath()
      ctx.arc(moonX + 16, moonY + 16, 15, 0, Math.PI * 2)
      ctx.fill()
      if (biome === 'rooftops') {
        ctx.fillStyle = c0
        ctx.beginPath()
        ctx.arc(moonX + 22, moonY + 13, 13, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // =========================================================================
    // LAYER 2 & 3: MIDGROUND PARALLAX + ENLARGED FOREGROUND CAMP PER BIOME
    // =========================================================================
    if (biome === 'rooftops') {
      // Sky Parallax: 2 slow-drifting purple-blue cloud layers
      const skyClouds = [
        { bx: 150, y: 44, w: 58, h: 10, spd: 3.0, c: 'rgba(82, 58, 132, 0.45)' },
        { bx: 280, y: 58, w: 66, h: 12, spd: 4.5, c: 'rgba(104, 74, 160, 0.42)' },
        { bx: 210, y: 76, w: 52, h: 9, spd: 5.5, c: 'rgba(92, 66, 146, 0.38)' }
      ]
      for (const cl of skyClouds) {
        const cx = 135 + (((cl.bx - 135 + Math.floor(t * cl.spd)) % 270) + 270) % 270 - 20
        ctx.fillStyle = cl.c
        ctx.fillRect(cx, cl.y, cl.w, cl.h)
        ctx.fillRect(cx + 8, cl.y - 4, cl.w - 16, 4)
      }

      // Midground: Multi-tiered city rooftops + twinkling windows + water tower + TV antennas
      const buildings = [
        { x: 142, y: 112, w: 36, h: 104, ant: true },
        { x: 182, y: 98, w: 42, h: 118, ant: false },
        { x: 228, y: 116, w: 38, h: 100, ant: true },
        { x: 270, y: 90, w: 46, h: 126, ant: false },
        { x: 320, y: 106, w: 40, h: 110, ant: true },
        { x: 362, y: 94, w: 26, h: 122, ant: false }
      ]
      for (let bi = 0; bi < buildings.length; bi++) {
        const b = buildings[bi]!
        ctx.fillStyle = bi % 2 === 0 ? '#180f33' : '#211442'
        ctx.fillRect(b.x, b.y, b.w, b.h)
        if (b.ant) {
          ctx.fillStyle = '#382561'
          ctx.fillRect(b.x + Math.floor(b.w / 2), b.y - 12, 1, 12)
          ctx.fillRect(b.x + Math.floor(b.w / 2) - 4, b.y - 9, 9, 1)
          ctx.fillRect(b.x + Math.floor(b.w / 2) - 2, b.y - 6, 5, 1)
        }
        // Softly twinkling golden pixel windows
        for (let wy = b.y + 8; wy < 162; wy += 11) {
          for (let wx = b.x + 6; wx < b.x + b.w - 8; wx += 9) {
            if ((wx * 3 + wy) % 5 === 0) continue
            const dim = Math.floor(t * 0.8 + wx + wy) % 7 === 0
            ctx.fillStyle = dim ? '#8c6848' : '#ffd875'
            ctx.fillRect(wx, wy, 4, 5)
          }
        }
      }

      // Pixel Water Tower Silhouette on mid-left building (x = 188)
      ctx.fillStyle = '#150d2b'
      ctx.fillRect(191, 86, 2, 12)
      ctx.fillRect(205, 86, 2, 12)
      ctx.fillRect(193, 91, 12, 1)
      ctx.fillStyle = '#251745'
      ctx.fillRect(189, 72, 20, 14)
      ctx.fillStyle = '#321f59'
      ctx.fillRect(187, 70, 24, 3)
      ctx.fillRect(191, 66, 16, 4)
      ctx.fillRect(196, 63, 6, 3)

      // Overhead Power Lines with tiny perched pixel birds!
      ctx.strokeStyle = '#2c1e4a'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(156, 102)
      ctx.quadraticCurveTo(256, 120, 368, 96)
      ctx.stroke()
      const birdSpots = [
        { x: 224, y: 109 },
        { x: 234, y: 110 },
        { x: 306, y: 105 }
      ]
      for (let i = 0; i < birdSpots.length; i++) {
        const bs = birdSpots[i]!
        const bob = Math.floor(t * 2 + i) % 4 === 0 ? -1 : 0
        ctx.fillStyle = '#140b24'
        ctx.fillRect(bs.x, bs.y - 3 + bob, 4, 3)
        ctx.fillRect(bs.x + 3, bs.y - 4 + bob, 2, 2)
        ctx.fillStyle = '#ffd573'
        ctx.fillRect(bs.x + 5, bs.y - 3 + bob, 1, 1)
      }

      // Foreground Enlarged Brick Rooftop Camp Perch (y = 164)
      ctx.fillStyle = '#241338'
      ctx.fillRect(180, 164, 204, 52)
      ctx.fillStyle = '#5e2f52'
      ctx.fillRect(180, 164, 204, 7)
      ctx.fillStyle = '#8c466e'
      ctx.fillRect(180, 164, 204, 2)
      ctx.fillStyle = '#381c4a'
      for (let by = 175; by < 216; by += 8) {
        const off = (by / 8) % 2 === 0 ? 0 : 8
        for (let bx = 184 + off; bx < 382; bx += 16) {
          ctx.fillRect(bx, by, 12, 4)
        }
      }

      // Right-side Cozy Brick Chimney (lounge spot for unlocked friend!)
      ctx.fillStyle = '#2e1642'
      ctx.fillRect(334, 128, 30, 36)
      ctx.fillStyle = '#733a5e'
      ctx.fillRect(330, 126, 38, 6)
      ctx.fillStyle = '#99537b'
      ctx.fillRect(330, 126, 38, 2)
      for (let i = 0; i < 3; i++) {
        const sy = 118 - ((Math.floor(t * 8) + i * 10) % 26)
        const sx = 346 + Math.round(Math.sin(t * 1.4 + i) * 3)
        ctx.fillStyle = 'rgba(218, 200, 245, 0.34)'
        ctx.fillRect(sx, sy, 4, 3)
      }

      // Small Brass & Indigo Stargazing Telescope next to perch (x = 242, y = 148)
      ctx.fillStyle = '#1b0d2c'
      ctx.fillRect(246, 155, 2, 9)
      ctx.fillRect(243, 158, 2, 6)
      ctx.fillRect(249, 158, 2, 6)
      ctx.fillStyle = '#5c4b8a'
      ctx.fillRect(242, 150, 9, 4)
      ctx.fillRect(248, 148, 7, 3)
      ctx.fillStyle = '#ffcf5c'
      ctx.fillRect(241, 151, 2, 2)
      ctx.fillRect(254, 147, 2, 4)
      ctx.fillStyle = '#9ef0ff'
      ctx.fillRect(256, 148, 1, 2)

      // Subtle warm golden firefly specks drifting over rooftop
      for (let i = 0; i < 7; i++) {
        const fx = 192 + ((i * 29 + Math.round(Math.sin(t * 0.9 + i) * 8)) % 180)
        const fy = 128 + ((i * 17 + Math.round(Math.cos(t * 1.1 + i) * 6)) % 34)
        const fa = 0.35 + (Math.sin(t * 2.4 + i * 1.3) * 0.5 + 0.5) * 0.55
        ctx.fillStyle = `rgba(255, 224, 118, ${fa.toFixed(2)})`
        ctx.fillRect(fx, fy, 2, 2)
      }
    } else if (biome === 'sakura') {
      // Sky Parallax: thin drifting mist clouds passing pale full moon
      for (let i = 0; i < 3; i++) {
        const mx = 140 + (((i * 92 + Math.floor(t * (3 + i))) % 270) + 270) % 270 - 20
        ctx.fillStyle = 'rgba(222, 198, 245, 0.16)'
        ctx.fillRect(mx, 34 + i * 14, 72, 6)
      }

      // Midground: Layered distant sakura tree silhouettes + traditional pixel Torii Shrine Gate!
      ctx.fillStyle = '#251547'
      ctx.fillRect(0, 150, this.viewW, 66)
      // Distant dark sakura silhouettes
      ctx.fillStyle = '#331d59'
      ctx.fillRect(172, 116, 46, 26)
      ctx.fillRect(190, 134, 8, 22)
      ctx.fillRect(258, 122, 54, 24)
      ctx.fillRect(280, 138, 8, 20)

      // Traditional Crimson Torii Shrine Gate (midground center-right x = 224)
      const tx = 226
      const ty = 114
      ctx.fillStyle = '#b82c48'
      ctx.fillRect(tx + 6, ty + 8, 4, 38)
      ctx.fillRect(tx + 32, ty + 8, 4, 38)
      ctx.fillRect(tx + 2, ty + 14, 38, 4)
      ctx.fillStyle = '#e03e5c'
      ctx.fillRect(tx - 2, ty + 4, 46, 5)
      ctx.fillStyle = '#1f0f2e'
      ctx.fillRect(tx - 4, ty + 2, 50, 3)
      // Swaying shimenawa sacred rope + paper zigzags
      const ropeSway = Math.round(Math.sin(t * 1.6) * 1)
      ctx.fillStyle = '#ffe4a3'
      ctx.fillRect(tx + 12 + ropeSway, ty + 18, 18, 2)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(tx + 15 + ropeSway, ty + 20, 2, 3)
      ctx.fillRect(tx + 25 + ropeSway, ty + 20, 2, 3)

      // Gently rising green-gold forest fireflies
      for (let i = 0; i < 8; i++) {
        const fx = 164 + ((i * 27 + Math.round(Math.sin(t + i) * 6)) % 210)
        const fy = 152 - ((Math.floor(t * 7) + i * 19) % 90)
        ctx.fillStyle = i % 2 === 0 ? 'rgba(184, 255, 168, 0.72)' : 'rgba(255, 240, 148, 0.65)'
        ctx.fillRect(fx, fy, 2, 2)
      }

      // Foreground Camp: Framing Sakura Tree Trunk & Overhanging Blossom Branches on right
      ctx.fillStyle = '#361b36'
      ctx.fillRect(340, 74, 24, 94)
      ctx.fillRect(314, 98, 30, 10)
      ctx.fillRect(284, 88, 36, 9)
      ctx.fillStyle = '#4f2848'
      ctx.fillRect(344, 78, 6, 86)
      const swayB = Math.round(Math.sin(t * 1.2) * 1)
      const blossoms = [
        { x: 244 + swayB, y: 54, w: 72, h: 28, c: '#c9578e' },
        { x: 284 + swayB, y: 38, w: 98, h: 40, c: '#eb78b0' },
        { x: 262 + swayB, y: 66, w: 112, h: 26, c: '#ff9ec9' },
        { x: 304 + swayB, y: 48, w: 78, h: 22, c: '#ffd4e8' }
      ]
      for (const bl of blossoms) {
        ctx.fillStyle = bl.c
        ctx.fillRect(bl.x, bl.y, bl.w, bl.h)
      }

      // Foreground Mossy Shrine Deck (y = 164)
      ctx.fillStyle = '#2b193d'
      ctx.fillRect(180, 164, 204, 52)
      ctx.fillStyle = '#5c334f'
      ctx.fillRect(180, 164, 204, 7)
      ctx.fillStyle = '#804569'
      ctx.fillRect(180, 164, 204, 2)

      // Small Wooden Camp Bench on left of perch (x = 204, y = 156)
      ctx.fillStyle = '#3d1e2b'
      ctx.fillRect(208, 160, 3, 6)
      ctx.fillRect(236, 160, 3, 6)
      ctx.fillStyle = '#874c45'
      ctx.fillRect(204, 156, 39, 4)
      ctx.fillStyle = '#b5705c'
      ctx.fillRect(204, 156, 39, 2)

      // Warmly lit Stone Lantern (Ishi-doro) at x = 316, y = 136
      const lx = 316
      const ly = 136
      ctx.fillStyle = '#6c5c82'
      ctx.fillRect(lx + 4, ly + 15, 6, 13)
      ctx.fillRect(lx + 1, ly + 9, 12, 6)
      ctx.fillStyle = '#9685b0'
      ctx.fillRect(lx - 2, ly + 5, 18, 4)
      ctx.fillRect(lx + 3, ly + 2, 8, 3)
      ctx.fillStyle = '#ffe894'
      ctx.fillRect(lx + 4, ly + 10, 6, 4)
      if (isModern) {
        this.drawCircularGlow(ctx, lx + 7, ly + 12, 24, 'rgba(255, 224, 148, 0.30)', 'rgba(255, 166, 206, 0.10)', 'rgba(0,0,0,0)')
      }

      // Gently swaying sine-wave drifting pink sakura petals
      for (let i = 0; i < 14; i++) {
        const px = 152 + ((i * 25 + Math.floor(t * 13) + Math.round(Math.sin(t * 2 + i) * 7)) % 232)
        const py = 26 + ((i * 17 + Math.floor(t * 11)) % 150)
        ctx.fillStyle = i % 2 === 0 ? '#ffb3d6' : '#ffe3f1'
        ctx.fillRect(px, py, 2, 3)
      }
    } else if (biome === 'cloudland') {
      // Sky Parallax: Multicolored twinkling pixel stars + 3 layered drifting cotton-cloud bands
      const starColors = ['#fff5b8', '#ffb8e0', '#a8f0ff', '#ffffff', '#d4b8ff']
      for (let i = 0; i < 16; i++) {
        const sx = 154 + ((i * 29) % 218)
        const sy = 18 + ((i * 19) % 88)
        const tw = Math.floor(this.worldTime * 2.4 + i) % 3 !== 0
        if (tw) {
          ctx.fillStyle = starColors[i % starColors.length]!
          if (i % 3 === 0) {
            ctx.fillRect(sx, sy - 1, 1, 3)
            ctx.fillRect(sx - 1, sy, 3, 1)
          } else {
            ctx.fillRect(sx, sy, 2, 2)
          }
        }
      }

      // Midground: Faint softly pulsing pastel rainbow arc
      const rbAlpha = 0.13 + (Math.sin(t * 1.1) * 0.5 + 0.5) * 0.08
      const rbColors = ['#ff9ec4', '#ffe08a', '#a8f5d4', '#9ee6ff', '#d0b0ff']
      ctx.save()
      ctx.globalAlpha = rbAlpha
      for (let r = 0; r < rbColors.length; r++) {
        ctx.strokeStyle = rbColors[r]!
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(286, 168, 108 - r * 3, Math.PI * 1.06, Math.PI * 1.94)
        ctx.stroke()
      }
      ctx.restore()

      // 3 Layered drifting cotton-cloud bands + floating distant cloud islands
      const bands = [
        { bx: 150, y: 60, w: 66, h: 12, spd: 3, c: '#a9a0e8' },
        { bx: 280, y: 74, w: 78, h: 14, spd: 4.5, c: '#c4bcf5' },
        { bx: 196, y: 102, w: 88, h: 16, spd: 6, c: '#dcd6ff' },
        { bx: 316, y: 112, w: 68, h: 14, spd: 5.5, c: '#ece8ff' }
      ]
      for (const cl of bands) {
        const cx = 135 + (((cl.bx - 135 + Math.floor(t * cl.spd)) % 275) + 275) % 275 - 24
        ctx.fillStyle = cl.c
        ctx.fillRect(cx, cl.y, cl.w, cl.h)
        ctx.fillRect(cx + 10, cl.y - 5, cl.w - 20, 6)
      }

      // Smaller gently bobbing companion clouds (lounging spots for unlocked friends!)
      const bob1 = Math.round(Math.sin(t * 1.6) * 2)
      const bob2 = Math.round(Math.sin(t * 1.4 + 1.8) * 2)
      ctx.fillStyle = '#dcd6ff'
      ctx.fillRect(194, 144 + bob1, 44, 12)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(200, 142 + bob1, 32, 6)

      ctx.fillStyle = '#dcd6ff'
      ctx.fillRect(326, 134 + bob2, 42, 12)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(332, 132 + bob2, 30, 6)

      // Foreground Enlarged Fluffy Cloud Island Perch (y = 164)
      ctx.fillStyle = '#c4baf2'
      ctx.fillRect(216, 164, 148, 28)
      ctx.fillRect(230, 158, 120, 10)
      ctx.fillStyle = '#eef4ff'
      ctx.fillRect(222, 162, 136, 14)
      ctx.fillRect(236, 158, 108, 8)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(242, 159, 96, 4)

      // Tiny Golden Starlight Stepladder resting against the cloud island (x = 248, y = 166)
      ctx.fillStyle = '#c48a2b'
      ctx.fillRect(246, 162, 2, 26)
      ctx.fillRect(256, 162, 2, 26)
      ctx.fillStyle = '#ffe478'
      ctx.fillRect(248, 166, 8, 2)
      ctx.fillRect(248, 173, 8, 2)
      ctx.fillRect(248, 180, 8, 2)

      // Floating pastel stardust sparkles
      for (let i = 0; i < 8; i++) {
        const sx = 196 + ((i * 23 + Math.round(Math.sin(t * 1.2 + i) * 5)) % 176)
        const sy = 112 + ((i * 17 + Math.round(Math.cos(t + i) * 4)) % 56)
        ctx.fillStyle = i % 2 === 0 ? '#fff5b8' : '#b8f0ff'
        ctx.fillRect(sx, sy, 2, 2)
      }
    } else if (biome === 'harbor') {
      // BIOME 4: LANTERN HARBOR
      // Sky Parallax: thin horizon cloud wisps
      for (let i = 0; i < 3; i++) {
        const wx = 148 + (((i * 88 + Math.floor(t * (2.5 + i))) % 260) + 260) % 260 - 20
        ctx.fillStyle = 'rgba(130, 198, 214, 0.16)'
        ctx.fillRect(wx, 56 + i * 16, 68, 5)
      }

      // Midground: Distant Harbor Lighthouse with rotating warm beam + distant rocking sailboat!
      ctx.fillStyle = '#091f2c'
      ctx.fillRect(160, 134, 72, 24)
      ctx.fillStyle = '#ddebf2'
      ctx.fillRect(184, 102, 11, 32)
      ctx.fillStyle = '#d9485b'
      ctx.fillRect(184, 110, 11, 6)
      ctx.fillRect(184, 122, 11, 6)
      ctx.fillStyle = '#ffe885'
      ctx.fillRect(186, 98, 7, 4)

      const beamSweep = Math.sin(t * 0.9)
      const beamAlpha = 0.08 + Math.abs(beamSweep) * 0.12
      ctx.fillStyle = `rgba(255, 240, 170, ${beamAlpha.toFixed(3)})`
      ctx.beginPath()
      ctx.moveTo(192, 100)
      ctx.lineTo(330, 68 + Math.round(beamSweep * 16))
      ctx.lineTo(330, 118 + Math.round(beamSweep * 16))
      ctx.closePath()
      ctx.fill()

      // Distant Sailboat Silhouette gently bobbing on bay (x = 258, y = 146)
      const sbY = 146 + Math.round(Math.sin(t * 1.5) * 1)
      ctx.fillStyle = '#0d2b3b'
      ctx.fillRect(256, sbY + 6, 18, 4)
      ctx.fillRect(264, sbY - 8, 2, 14)
      ctx.fillStyle = '#47768c'
      ctx.beginPath()
      ctx.moveTo(266, sbY - 7)
      ctx.lineTo(274, sbY + 5)
      ctx.lineTo(266, sbY + 5)
      ctx.closePath()
      ctx.fill()

      // Shimmering Harbor Bay Water + Animated Reflections & Ripples beneath pier
      ctx.fillStyle = '#092736'
      ctx.fillRect(0, 156, this.viewW, 60)
      ctx.fillStyle = '#124052'
      ctx.fillRect(0, 156, this.viewW, 4)
      for (let i = 0; i < 12; i++) {
        const ry = 162 + i * 4
        const rx = 200 + ((i * 21 + Math.round(Math.sin(t * 1.6 + i) * 4)) % 168)
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 234, 160, 0.34)' : 'rgba(130, 238, 224, 0.28)'
        ctx.fillRect(rx, ry, 18 - (i % 4) * 3, 2)
      }

      // Foreground Warm Wooden Pier Deck + Mooring Bollards (y = 164)
      ctx.fillStyle = '#2e1824'
      ctx.fillRect(204, 171, 10, 45)
      ctx.fillRect(276, 171, 10, 45)
      ctx.fillRect(348, 171, 10, 45)
      ctx.fillStyle = '#5e353d'
      ctx.fillRect(184, 164, 200, 9)
      ctx.fillStyle = '#8f5556'
      ctx.fillRect(184, 164, 200, 3)
      // Mooring Bollards (x = 204 & x = 350)
      for (const bx of [204, 348]) {
        ctx.fillStyle = '#382230'
        ctx.fillRect(bx, 154, 10, 10)
        ctx.fillStyle = '#634354'
        ctx.fillRect(bx - 1, 152, 12, 3)
        ctx.fillStyle = '#d9b482'
        ctx.fillRect(bx + 1, 158, 8, 2)
      }

      // Overhead String of Gently Swaying Crimson-and-Gold Festival Lanterns!
      ctx.fillStyle = '#361c2a'
      ctx.fillRect(194, 104, 4, 60)
      ctx.fillRect(366, 100, 4, 64)
      ctx.strokeStyle = '#5c3c4c'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(196, 108)
      ctx.quadraticCurveTo(280, 124, 368, 104)
      ctx.stroke()

      const festivalLanterns = [
        { x: 224, y: 113 },
        { x: 256, y: 117 },
        { x: 294, y: 117 },
        { x: 332, y: 112 }
      ]
      for (let i = 0; i < festivalLanterns.length; i++) {
        const fl = festivalLanterns[i]!
        const sway = Math.round(Math.sin(t * 1.9 + i * 0.9) * 1.5)
        const lx = fl.x + sway
        const ly = fl.y + 3
        ctx.fillStyle = '#ffd873'
        ctx.fillRect(fl.x + 2, fl.y, 1, 3)
        ctx.fillStyle = '#290e20'
        ctx.fillRect(lx - 1, ly, 7, 9)
        ctx.fillStyle = i % 2 === 0 ? '#e03c52' : '#ff9f3b'
        ctx.fillRect(lx, ly + 1, 5, 7)
        ctx.fillStyle = '#fff3ad'
        ctx.fillRect(lx + 1, ly + 2, 3, 4)
        if (isModern) {
          this.drawCircularGlow(ctx, lx + 2, ly + 4, 19, 'rgba(255, 206, 118, 0.24)', 'rgba(255, 112, 92, 0.08)', 'rgba(0,0,0,0)')
        }
      }
    } else if (biome === 'cavern') {
      // Crystal Mushroom Cavern Camp Hub!
      ctx.fillStyle = '#0c1c36'
      ctx.fillRect(184, 164, 200, 52)
      ctx.fillStyle = '#3ba3a8'
      ctx.fillRect(184, 164, 200, 4)
      ctx.fillStyle = '#76f5e8'
      ctx.fillRect(184, 164, 200, 2)
      // Glowing camp mushrooms & crystals
      ctx.fillStyle = '#254463'
      ctx.fillRect(212, 146, 5, 18)
      ctx.fillStyle = '#5ef2e6'
      ctx.fillRect(202, 139, 24, 8)
      ctx.fillStyle = '#33285e'
      ctx.fillRect(344, 148, 5, 16)
      ctx.fillStyle = '#c48cff'
      ctx.fillRect(336, 142, 20, 7)
      for (let i = 0; i < 7; i++) {
        const sx = 196 + ((i * 27 + Math.round(Math.sin(t + i) * 6)) % 176)
        const sy = 152 - ((Math.floor(t * 7) + i * 18) % 86)
        ctx.fillStyle = i % 2 === 0 ? 'rgba(116, 250, 238, 0.72)' : 'rgba(202, 152, 255, 0.65)'
        ctx.fillRect(sx, sy, 2, 2)
      }
    } else if (biome === 'observatory' || biome === 'eclipse' || biome === 'citadel') {
      // Clockwork Observatory Camp Hub!
      const rot = t * 0.45
      ctx.strokeStyle = 'rgba(224, 174, 72, 0.34)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(286, 98, 28, 0, Math.PI * 2)
      ctx.stroke()
      for (let s = 0; s < 6; s++) {
        const a = rot + (s * Math.PI) / 3
        ctx.fillStyle = '#ffe68c'
        ctx.fillRect(Math.round(286 + Math.cos(a) * 30) - 2, Math.round(98 + Math.sin(a) * 30) - 2, 4, 4)
      }
      ctx.fillStyle = '#262754'
      ctx.fillRect(184, 164, 200, 52)
      ctx.fillStyle = '#d9a441'
      ctx.fillRect(184, 164, 200, 4)
      ctx.fillStyle = '#fff0a6'
      ctx.fillRect(184, 164, 200, 1)
    }

    // =========================================================================
    // CAMP CHARACTERS: Lounging Unlocked Friends + Enlarged (~1.67x) Selected Character
    // =========================================================================
    this.renderHomeCampFriends(ctx, biome)
    this.renderTitleCampProps(ctx)
    this.renderPlayer(ctx)
    this.renderBespokeCampAccent(
      ctx,
      this.progress.selectedCharacter,
      this.player.x + this.player.w / 2,
      this.player.y + this.player.h,
      this.campReactionTimer > 0,
      true
    )
    this.renderCosmeticTrailParticles(ctx)
    this.renderParticles(ctx)
    this.renderFloatingTexts(ctx)
    ctx.restore()

    // Brief gentle transition veil when switching Classic <-> Modern graphics style
    if (this.styleFadeTimer > 0) {
      const fadeAlpha = Math.min(0.45, (this.styleFadeTimer / 0.16) * 0.45)
      ctx.fillStyle = `rgba(10, 5, 22, ${fadeAlpha.toFixed(3)})`
      ctx.fillRect(0, 0, this.viewW, VIEW_H)
    }
  }

  /**
   * Renders bespoke pixel props, idle animations & click visual accents for all 9 Camp Hub character personas.
   * Preserves crisp pixel edges (`imageSmoothingEnabled = false`) and respects `reduceMotion`.
   */
  private renderBespokeCampAccent(
    ctx: CanvasRenderingContext2D,
    charId: CharacterId,
    cx: number,
    footY: number,
    isReacting: boolean,
    isHero: boolean
  ): void {
    const calm = this.progress.reduceMotion
    const t = this.worldTime
    const s = isHero ? 1 : 0.85

    if (charId === 'bear-sun') {
      // Tiny golden pixel honey pot held in front; raises happily on click!
      const lift = isReacting ? -5 : calm ? 0 : Math.round(Math.sin(t * 2.2) * 1)
      const hx = Math.round(cx + (isHero ? 7 : 5))
      const hy = Math.round(footY - Math.round(12 * s) + lift)
      ctx.fillStyle = '#24101c'
      ctx.fillRect(hx - 1, hy - 1, 9, 9)
      ctx.fillStyle = '#d98a2b'
      ctx.fillRect(hx, hy + 1, 7, 6)
      ctx.fillStyle = '#ffcf4d'
      ctx.fillRect(hx + 1, hy, 5, 2)
      ctx.fillStyle = '#fff5b8'
      ctx.fillRect(hx + 1, hy + 2, 2, 2)
      if (isReacting) {
        // Golden honey droplets floating upward
        ctx.fillStyle = '#ffd84d'
        ctx.fillRect(hx + 2, hy - 4, 2, 2)
        ctx.fillRect(hx + 6, hy - 7, 2, 2)
      }
      return
    }

    if (charId === 'bear-polar') {
      // Soft ice-blue frost mist beneath belly-lounging Polar Bear + snowflakes on click
      ctx.fillStyle = 'rgba(182, 232, 255, 0.28)'
      ctx.fillRect(Math.round(cx - 11), Math.round(footY - 2), 22, 3)
      if (isReacting) {
        const drift = calm ? 0 : Math.round(Math.sin(t * 5) * 2)
        ctx.fillStyle = '#d6f7ff'
        ctx.fillRect(Math.round(cx - 10 + drift), Math.round(footY - 22), 2, 2)
        ctx.fillRect(Math.round(cx + 8 - drift), Math.round(footY - 26), 2, 2)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(Math.round(cx + 2), Math.round(footY - 29), 1, 3)
        ctx.fillRect(Math.round(cx + 1), Math.round(footY - 28), 3, 1)
      }
      return
    }

    if (charId === 'bear-black') {
      // Highlights signature warm-cream crescent chest mark with gold sparkles on click
      if (isReacting) {
        const px = Math.round(cx)
        const py = Math.round(footY - Math.round(14 * s))
        ctx.fillStyle = '#fff5c2'
        ctx.fillRect(px - 2, py, 5, 2)
        ctx.fillStyle = '#ffe475'
        ctx.fillRect(px - 8, py - 8, 1, 3)
        ctx.fillRect(px - 9, py - 7, 3, 1)
        ctx.fillRect(px + 8, py - 10, 1, 3)
        ctx.fillRect(px + 7, py - 9, 3, 1)
      }
      return
    }

    if (charId === 'fox-brown') {
      // Periodic ear-twitch pixel spark & floating leaf/note when hopping on click
      if (!calm && Math.floor(t * 1.8) % 5 === 0) {
        ctx.fillStyle = '#fff4e3'
        ctx.fillRect(Math.round(cx + 5), Math.round(footY - Math.round(32 * s)), 2, 1)
      }
      if (isReacting) {
        ctx.fillStyle = '#8ce696'
        ctx.fillRect(Math.round(cx - 11), Math.round(footY - 24), 3, 2)
        ctx.fillStyle = '#ffe875'
        ctx.fillRect(Math.round(cx + 9), Math.round(footY - 28), 2, 4)
        ctx.fillRect(Math.round(cx + 11), Math.round(footY - 28), 2, 1)
      }
      return
    }

    if (charId === 'fox-kitsune') {
      // Summons 3 floating blue-gold pixel kitsunebi wisps drifting upward on click (1 gentle orb on idle)
      const orbCount = isReacting ? 3 : 1
      for (let i = 0; i < orbCount; i++) {
        const ang = (calm ? 0.8 : t * 2.4) + i * 2.1
        const ox = Math.round(cx + Math.cos(ang) * (isReacting ? 14 : 11))
        const oy = Math.round(
          footY - Math.round(20 * s) + Math.sin(ang * 1.3) * 4 - (isReacting ? i * 4 : 0)
        )
        ctx.fillStyle = '#7eeeff'
        ctx.fillRect(ox - 1, oy - 1, 3, 3)
        ctx.fillStyle = '#ffe875'
        ctx.fillRect(ox, oy, 1, 1)
      }
      return
    }

    if (charId === 'dog-samoyed') {
      // Cute pink panting tongue pixel + floating bone on click
      const pant = calm ? 0 : Math.floor(t * 4) % 2
      ctx.fillStyle = '#ff7ca8'
      ctx.fillRect(Math.round(cx + 2), Math.round(footY - Math.round(18 * s) + pant), 2, 2)
      if (isReacting) {
        const bx = Math.round(cx + 9)
        const by = Math.round(footY - 26)
        ctx.fillStyle = '#fff5e0'
        ctx.fillRect(bx, by, 5, 2)
        ctx.fillRect(bx - 1, by - 1, 2, 4)
        ctx.fillRect(bx + 4, by - 1, 2, 4)
      }
      return
    }

    if (charId === 'bunny-starlight') {
      // Nose/ear wiggle + clover sparkle on click
      if (isReacting) {
        ctx.fillStyle = '#9ef5b8'
        ctx.fillRect(Math.round(cx - 10), Math.round(footY - 25), 3, 3)
        ctx.fillStyle = '#ffe875'
        ctx.fillRect(Math.round(cx + 9), Math.round(footY - 28), 2, 2)
      }
      return
    }

    if (charId === 'dog-shiba') {
      // Proud lookout starlight glints on click
      if (isReacting) {
        ctx.fillStyle = '#ffe475'
        ctx.fillRect(Math.round(cx - 9), Math.round(footY - 28), 1, 3)
        ctx.fillRect(Math.round(cx - 10), Math.round(footY - 27), 3, 1)
        ctx.fillRect(Math.round(cx + 9), Math.round(footY - 26), 2, 2)
      }
      return
    }

    // Cats: cozy cushion under camp friends too + pink heart sparkle on click
    if (!isHero) {
      ctx.fillStyle = '#75335c'
      ctx.fillRect(Math.round(cx - 9), Math.round(footY - 2), 18, 2)
      ctx.fillStyle = '#ff9ec4'
      ctx.fillRect(Math.round(cx - 7), Math.round(footY - 2), 14, 1)
    }
    if (isReacting) {
      ctx.fillStyle = '#ff8cb8'
      ctx.fillRect(Math.round(cx + 8), Math.round(footY - 26), 3, 2)
      ctx.fillRect(Math.round(cx + 9), Math.round(footY - 24), 1, 1)
    }
  }

  private renderHomeCampFriends(ctx: CanvasRenderingContext2D, biome: BiomeId): void {
    const slots = this.getCampFriendSlots(biome)
    const calm = this.progress.reduceMotion
    for (let i = 0; i < Math.min(this.campFriends.length, slots.length); i++) {
      const fr = this.campFriends[i]!
      const slot = slots[i]!
      const dir = slot.facing === 1 ? fr.sprites.right : fr.sprites.left
      const blinkCycle = (this.worldTime + fr.blinkOffset) % 3.6
      const isReacting = fr.reactionTimer > 0
      let sprite = dir.sit0
      if (fr.reaction === 'hop' && isReacting) {
        sprite = dir.jumpUp
      } else if (fr.reaction === 'nap' && isReacting) {
        sprite = dir.sitBlink
      } else if (fr.id === 'bear-polar') {
        // Polar Bear lounges cozily on belly with sleepy breathing
        sprite = blinkCycle < 1.8 ? dir.sitBlink : dir.sit0
      } else if (fr.id === 'fox-kitsune' && isReacting) {
        sprite = dir.sitBlink
      } else if (!calm && (fr.id === 'dog-samoyed' || fr.id === 'fox-brown') && Math.floor(this.worldTime * 2.5 + i) % 3 === 0) {
        sprite = dir.idleSpecial
      } else {
        sprite = blinkCycle < 0.18 ? dir.sitBlink : dir.sit0
      }

      const size = 32
      const idleBob =
        calm || isReacting
          ? 0
          : fr.id === 'bear-sun' || fr.id === 'bunny-starlight'
            ? Math.round(Math.sin(this.worldTime * 2.8 + i) * 1)
            : 0
      const dx = Math.round(slot.x - size / 2)
      const dy = Math.round(slot.y - size + 3 - fr.hopOffset + idleBob)
      ctx.fillStyle = 'rgba(12, 6, 28, 0.34)'
      ctx.fillRect(Math.round(slot.x - 8), Math.round(slot.y - 1), 16, 2)

      // Polar Bear belly-lounging pose: slightly wider/lower cozy horizontal rest
      if (fr.id === 'bear-polar' && !isReacting) {
        ctx.drawImage(sprite, 0, 0, 24, 24, dx - 2, dy + 4, size + 4, size - 4)
      } else {
        ctx.drawImage(sprite, dx, dy, size, size)
      }
      this.renderBespokeCampAccent(ctx, fr.id, slot.x, slot.y, isReacting, false)
      // Periodic cute ambient pixel emote bubble exchanged by lounging Camp Hub friends!
      if (this.campFriendEmoteTimer > 0 && this.campFriendEmoteIdx === i && this.campFriendEmote !== 'none') {
        const floatY = this.progress.reduceMotion ? 0 : Math.round(Math.sin(this.worldTime * 4) * 1.5)
        drawPixelEmoteBubble(ctx, slot.x, dy - 12 + floatY, this.campFriendEmote)
      }
    }
  }

  private renderEndingCutscene(ctx: CanvasRenderingContext2D): void {
    const isModern = this.isModern

    // 1. Serene Twilight-Harbor Night Sky
    if (!isModern) {
      ctx.fillStyle = '#081024'
      ctx.fillRect(0, 0, this.viewW, 74)
      ctx.fillStyle = '#122442'
      ctx.fillRect(0, 74, this.viewW, 64)
    } else {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 138)
      skyGrad.addColorStop(0, '#081024')
      skyGrad.addColorStop(0.35, '#112445')
      skyGrad.addColorStop(0.7, '#1d3c63')
      skyGrad.addColorStop(1, '#2b6182')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, this.viewW, 138)
    }

    // 2. Twinkling Night Stars & Occasional Shooting Star
    this.renderStars(ctx, 0)

    // 3. Large Radiant Full Moon centered over the harbor horizon
    const moonX = 248
    const moonY = 24
    if (isModern) {
      const moonBreath = Math.sin(this.worldTime * 1.2) * 2
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      this.drawCircularGlow(
        ctx,
        moonX + 22,
        moonY + 22,
        Math.round(62 + moonBreath),
        'rgba(255, 246, 200, 0.34)',
        'rgba(255, 224, 158, 0.14)',
        'rgba(0, 0, 0, 0)'
      )
      ctx.restore()
    }
    ctx.drawImage(this.sprites.fullMoon, moonX, moonY)

    // 4. Calm Midnight Ocean + Shimmering Full Moon Water Reflection (gentle 1-2px ripples)
    const seaTop = 136
    ctx.fillStyle = '#092430'
    ctx.fillRect(0, seaTop, this.viewW, VIEW_H - seaTop)
    ctx.fillStyle = '#113a4a'
    ctx.fillRect(0, seaTop, this.viewW, 3)

    // Distant horizon silhouette & gentle harbor lighthouse on the left
    const lhX = 44
    ctx.fillStyle = '#081c26'
    ctx.fillRect(0, 128, 86, 10)
    ctx.fillRect(14, 122, 54, 8)
    ctx.fillStyle = '#113240'
    ctx.fillRect(lhX, 94, 12, 30)
    ctx.fillStyle = '#1b4a59'
    ctx.fillRect(lhX + 2, 88, 8, 6)
    ctx.fillStyle = '#ffe994'
    ctx.fillRect(lhX + 4, 89, 4, 4)
    if (isModern) {
      const beaconAlpha = 0.24 + Math.sin(this.worldTime * 1.1) * 0.05
      this.drawCircularGlow(
        ctx,
        lhX + 6,
        91,
        26,
        `rgba(255, 242, 176, ${beaconAlpha.toFixed(3)})`,
        `rgba(255, 212, 120, ${(beaconAlpha * 0.4).toFixed(3)})`,
        'rgba(255, 212, 120, 0)'
      )

      // Calm shimmering golden reflection column beneath the Full Moon
      const moonCenterX = moonX + 22
      for (let row = 0; row < 6; row++) {
        const rw = Math.max(10, 44 - row * 5)
        const shift = Math.round(Math.sin(this.worldTime * 1.1 + row * 0.9) * 1.5)
        const ry = seaTop + 5 + row * 5
        ctx.fillStyle = row < 2 ? 'rgba(255, 244, 190, 0.34)' : 'rgba(255, 232, 160, 0.22)'
        ctx.fillRect(Math.round(moonCenterX - rw / 2 + shift), ry, rw, 2)
      }
    }

    // Distant cozy lantern sailboat silhouette gliding slowly
    const boatX = Math.round(138 + Math.sin(this.worldTime * 0.18) * 6)
    ctx.fillStyle = '#0b222c'
    ctx.fillRect(boatX, 132, 22, 5)
    ctx.fillRect(boatX + 10, 114, 2, 18)
    ctx.fillStyle = '#194552'
    ctx.fillRect(boatX + 12, 116, 8, 12)
    ctx.fillStyle = '#ffda75'
    ctx.fillRect(boatX + 5, 133, 2, 2)

    // 5. Cozy Wooden Harbor Pier Foreground (respects 8-Bit Classic vs 16-Bit Modern tiles!)
    const pierY = 174
    const tileSet = isModern ? this.sprites.modernTiles : this.sprites.tiles
    // Vertical support pilings extending into water
    ctx.fillStyle = '#291722'
    for (let px = 16; px < this.viewW; px += 64) {
      ctx.fillRect(px, pierY + 12, 8, VIEW_H - (pierY + 12))
      ctx.fillStyle = '#472a36'
      ctx.fillRect(px + 2, pierY + 12, 4, VIEW_H - (pierY + 12))
      ctx.fillStyle = '#291722'
    }

    for (let ty = 0; ty < 48; ty += 16) {
      for (let tx = 0; tx < this.viewW; tx += 16) {
        const tile = ty === 0 ? tileSet.harborTop : tileSet.harborBody
        ctx.drawImage(tile, tx, pierY + ty)
      }
    }

    // Modern mooring posts & warm hanging harbor lanterns framing the pier
    if (isModern) {
      ctx.drawImage(this.sprites.props.harborPost, 14, pierY - 10)
      ctx.drawImage(this.sprites.props.harborPost, 356, pierY - 10)
    }

    const lanternFrame = Math.floor(this.worldTime * 2) % 2 as 0 | 1
    const lanternPositions = [
      { x: 34, y: pierY - 20 },
      { x: 334, y: pierY - 20 }
    ]
    for (const lp of lanternPositions) {
      if (isModern) {
        const breath = Math.sin(this.worldTime * 1.5 + lp.x * 0.05)
        this.drawCircularGlow(
          ctx,
          lp.x + 6,
          lp.y + 7,
          30 + breath * 1.5,
          'rgba(255, 232, 142, 0.42)',
          'rgba(255, 162, 64, 0.18)',
          'rgba(255, 140, 40, 0)'
        )
      }
      ctx.drawImage(this.sprites.lantern[lanternFrame], lp.x, lp.y)
    }

    // Friendly Night Owl perched peacefully beside the left lantern
    const owlBlink = this.worldTime % 4.0 > 3.82 ? 1 : 0
    ctx.drawImage(this.sprites.npc.owl[owlBlink], 54, pierY - 14)

    // 6. Active Character + 5 Animal Friends sitting side-by-side gazing at the Full Moon!
    const sitY = pierY - 23
    const seatSlots = [
      { x: 86, isPlayer: false, friendIdx: 0, facing: 'right' as const },
      { x: 118, isPlayer: false, friendIdx: 1, facing: 'right' as const },
      { x: 154, isPlayer: true, friendIdx: -1, facing: 'right' as const },
      { x: 190, isPlayer: false, friendIdx: 2, facing: 'right' as const },
      { x: 224, isPlayer: false, friendIdx: 3, facing: 'right' as const },
      { x: 264, isPlayer: false, friendIdx: 4, facing: 'left' as const }
    ]

    for (const slot of seatSlots) {
      // Soft grounding shadow on the wooden pier planks
      ctx.fillStyle = 'rgba(12, 6, 28, 0.42)'
      ctx.fillRect(slot.x + 6, pierY - 1, 12, 2)

      if (slot.isPlayer) {
        if (isModern) {
          this.drawCircularGlow(
            ctx,
            slot.x + 12,
            sitY + 12,
            18,
            'rgba(255, 240, 185, 0.24)',
            'rgba(255, 198, 224, 0.08)',
            'rgba(255, 198, 224, 0)'
          )
        }
        const dirBank = this.playerSprites[slot.facing]
        const spr = this.player.blinkTimer <= 0 ? dirBank.sitBlink : dirBank.sit0
        ctx.drawImage(spr, slot.x, sitY)
      } else {
        const friend = this.epilogueFriends[slot.friendIdx]
        if (!friend) continue
        const dirBank = friend.sprites[slot.facing]
        const fBlink = (this.worldTime + friend.blinkOffset) % 3.8 > 3.64
        ctx.drawImage(fBlink ? dirBank.sitBlink : dirBank.sit0, slot.x, sitY)
      }
    }

    // Gentle floating pixel heart & music note rising softly above the seated friends
    const notePhase = (this.worldTime * 0.42) % 1
    const noteAlpha = Math.sin(notePhase * Math.PI) * 0.9
    const noteY = Math.round(sitY - 4 - notePhase * 16)
    ctx.globalAlpha = noteAlpha
    ctx.font = 'bold 7px "Silkscreen", "Courier New", monospace'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffaad2'
    ctx.fillText('♥', 166 + Math.round(Math.sin(this.worldTime * 1.8) * 2), noteY)
    ctx.fillStyle = '#ffe88a'
    ctx.fillText('♪', 202 + Math.round(Math.cos(this.worldTime * 1.5) * 2), noteY + 5)
    ctx.globalAlpha = 1

    // 7. Gentle Fireflies + Additive Lantern Warmth in Modern 16-Bit Mode
    this.renderParticles(ctx)
    if (isModern) {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      for (const lp of lanternPositions) {
        this.drawCircularGlow(
          ctx,
          lp.x + 6,
          lp.y + 8,
          36,
          'rgba(255, 210, 126, 0.22)',
          'rgba(235, 130, 52, 0.08)',
          'rgba(0, 0, 0, 0)'
        )
      }
      ctx.restore()
    }

    // Smooth fade-in from twilight when entering Epilogue Cutscene (~0.7s)
    if (this.epilogueTimer < 0.7) {
      const fadeAlpha = Math.max(0, 1 - this.epilogueTimer / 0.7)
      ctx.fillStyle = `rgba(10, 5, 22, ${fadeAlpha.toFixed(3)})`
      ctx.fillRect(0, 0, this.viewW, VIEW_H)
    }
  }

  private renderModernAdditiveLighting(ctx: CanvasRenderingContext2D, camX: number): void {
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'

    // Warm lanterns cast rich additive light pools onto nearby roof tiles, moss & branches!
    for (const lan of this.lanterns) {
      if (lan.x < camX - 56 || lan.x > camX + this.viewW + 56) continue
      const lx = Math.round(lan.x + 6 + lan.swayOffset)
      const ly = Math.round(lan.y + 8)
      const pulse = Math.sin(this.worldTime * 1.6 + lx * 0.05) * 0.03
      this.drawCircularGlow(
        ctx,
        lx,
        ly,
        42,
        this.level.biome === 'sakura'
          ? `rgba(255, 196, 224, ${(0.32 + pulse).toFixed(3)})`
          : `rgba(255, 214, 124, ${(0.34 + pulse).toFixed(3)})`,
        this.level.biome === 'sakura' ? 'rgba(220, 128, 178, 0.13)' : 'rgba(245, 140, 52, 0.14)',
        'rgba(0, 0, 0, 0)'
      )
      // Illuminated warm light spill directly on the roof/platform surface below the lantern
      this.drawCircularGlow(
        ctx,
        lx,
        ly + 14,
        24,
        'rgba(255, 224, 146, 0.24)',
        'rgba(255, 172, 76, 0.09)',
        'rgba(0, 0, 0, 0)'
      )
    }

    // Lit checkpoints additive bloom
    for (const cp of this.checkpoints) {
      if (!cp.activated || cp.x < camX - 48 || cp.x > camX + this.viewW + 48) continue
      this.drawCircularGlow(
        ctx,
        Math.round(cp.x + 7),
        Math.round(cp.y + 8),
        34,
        'rgba(255, 200, 226, 0.24)',
        'rgba(255, 220, 130, 0.09)',
        'rgba(0, 0, 0, 0)'
      )
    }

    // Moon Portal additive moonlight bloom
    this.drawCircularGlow(
      ctx,
      Math.round(this.level.portal.x + 16),
      Math.round(this.level.portal.y + 20),
      40,
      'rgba(155, 232, 255, 0.24)',
      'rgba(186, 146, 255, 0.10)',
      'rgba(0, 0, 0, 0)'
    )

    // Subtle additive starlight halo on visible collectibles & power-ups
    for (const item of this.collectibles) {
      if (item.collected || item.curX < camX - 20 || item.curX > camX + this.viewW + 20) continue
      const iy = Math.round(item.curY + Math.round(Math.sin(this.worldTime * 1.4 + item.phase) * 1.5))
      this.drawCircularGlow(
        ctx,
        Math.round(item.curX + 6),
        iy + 6,
        item.kind === 'fish' ? 15 : 12,
        'rgba(255, 236, 150, 0.16)',
        'rgba(255, 204, 88, 0.05)',
        'rgba(0, 0, 0, 0)'
      )
    }

    for (const pu of this.powerUps) {
      if (pu.collected || pu.x < camX - 20 || pu.x > camX + this.viewW + 20) continue
      const py = Math.round(pu.y + Math.round(Math.sin(this.worldTime * 1.4 + pu.phase) * 1.5))
      this.drawCircularGlow(
        ctx,
        Math.round(pu.x + 6),
        py + 6,
        16,
        'rgba(255, 240, 210, 0.20)',
        'rgba(220, 180, 255, 0.06)',
        'rgba(0, 0, 0, 0)'
      )
    }

    ctx.restore()
  }

  private renderNightSky(ctx: CanvasRenderingContext2D): void {
    const bands = this.level.skyTint.bands
    if (!this.isModern) {
      // CLASSIC 8-BIT: Crisp flat 2-band retro dark night sky (zero gradients, zero atmospheric bloom!)
      ctx.fillStyle = bands[0]!
      ctx.fillRect(0, 0, this.viewW, 118)
      ctx.fillStyle = bands[1]!
      ctx.fillRect(0, 118, this.viewW, VIEW_H - 118)
      return
    }

    // MODERN 16-BIT: Rich smooth atmospheric twilight gradient + warm horizon mist + starry nebula wash!
    const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H)
    grad.addColorStop(0, bands[0]!)
    grad.addColorStop(0.28, bands[1]!)
    grad.addColorStop(0.56, bands[2]!)
    grad.addColorStop(0.82, bands[3]!)
    grad.addColorStop(1, bands[4]!)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, this.viewW, VIEW_H)

    // Subtle soft twilight nebula / warm horizon glow behind distant silhouettes
    const biome = this.level.biome
    const horizonGlow =
      biome === 'sakura'
        ? 'rgba(255, 162, 208, 0.16)'
        : biome === 'cloudland'
          ? 'rgba(255, 206, 240, 0.22)'
          : biome === 'harbor'
            ? 'rgba(110, 224, 212, 0.14)'
            : 'rgba(255, 178, 120, 0.16)'
    const hGrad = ctx.createLinearGradient(0, 110, 0, VIEW_H)
    hGrad.addColorStop(0, 'rgba(0, 0, 0, 0)')
    hGrad.addColorStop(1, horizonGlow)
    ctx.fillStyle = hGrad
    ctx.fillRect(0, 110, this.viewW, VIEW_H - 110)

    // Soft pastel starlight nebula pocket in upper sky
    this.drawCircularGlow(
      ctx,
      118,
      52,
      86,
      biome === 'harbor' ? 'rgba(90, 200, 215, 0.12)' : 'rgba(198, 130, 255, 0.14)',
      'rgba(145, 90, 220, 0.05)',
      'rgba(0, 0, 0, 0)'
    )

    // Rare Night Event: Soft Pink Full Moon atmospheric rose sky wash!
    if (this.nightEvent === 'pinkMoon') {
      ctx.fillStyle = 'rgba(255, 130, 190, 0.18)'
      ctx.fillRect(0, 0, this.viewW, VIEW_H)
    }
  }

  private renderStars(ctx: CanvasRenderingContext2D, camX: number): void {
    const parallax = Math.round(camX * 0.02)
    const isModern = this.isModern
    for (const st of this.bgStars) {
      const sx = Math.floor((((st.x - parallax) % (this.viewW + 40)) + (this.viewW + 40)) % (this.viewW + 40) - 20)
      if (!isModern) {
        // Classic 8-Bit: crisp flat 1px binary retro stars (zero soft alpha pulse)
        ctx.fillStyle = st.size === 2 ? '#fff4b8' : '#b8b0e6'
        ctx.fillRect(sx, st.y, 1, 1)
        continue
      }
      const twinkle = (Math.sin(this.worldTime * st.speed + st.phase) + 1) * 0.5
      ctx.globalAlpha = 0.5 + twinkle * 0.5
      ctx.fillStyle = st.color
      if (st.cross && twinkle > 0.65) {
        ctx.fillRect(sx, st.y - 1, 1, 3)
        ctx.fillRect(sx - 1, st.y, 3, 1)
      } else {
        ctx.fillRect(sx, st.y, st.size, st.size)
      }
    }
    ctx.globalAlpha = 1

    if (isModern && this.shootingStar) {
      const s = this.shootingStar
      const alpha = Math.max(0, s.life / s.maxLife)
      ctx.fillStyle = `rgba(255, 248, 196, ${alpha.toFixed(2)})`
      const x = Math.round(s.x)
      const y = Math.round(s.y)
      ctx.fillRect(x, y, 2, 2)
      ctx.fillStyle = `rgba(255, 199, 229, ${(alpha * 0.65).toFixed(2)})`
      ctx.fillRect(x - 4, y - 1, 3, 1)
      ctx.fillRect(x - 8, y - 2, 3, 1)
    }
  }

  private renderMoon(ctx: CanvasRenderingContext2D, camX: number): void {
    const rightMargin = this.viewW < 280 ? 58 : 80
    const moonX = Math.round(this.viewW - rightMargin - camX * 0.025)
    const moonY = 14
    const isPinkMoon = this.nightEvent === 'pinkMoon'
    const isFull = this.level.biome === 'cloudland' || isPinkMoon
    if (this.isModern || isPinkMoon) {
      // Modern 16-Bit / Pink Full Moon Event: lush layered additive moonlight halo!
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      this.drawCircularGlow(
        ctx,
        moonX + 22,
        moonY + 22,
        isFull ? 68 : 58,
        isPinkMoon
          ? 'rgba(255, 168, 214, 0.44)'
          : isFull
            ? 'rgba(255, 224, 245, 0.36)'
            : 'rgba(255, 240, 178, 0.34)',
        isPinkMoon
          ? 'rgba(255, 118, 186, 0.20)'
          : isFull
            ? 'rgba(220, 170, 255, 0.16)'
            : 'rgba(255, 206, 128, 0.14)',
        'rgba(0, 0, 0, 0)'
      )
      ctx.restore()
    }
    ctx.drawImage(isFull ? this.sprites.fullMoon : this.sprites.moon, moonX, moonY)
    if (isPinkMoon) {
      // Soft rose tint overlay directly on full moon during Pink Moon event
      ctx.fillStyle = 'rgba(255, 135, 198, 0.22)'
      ctx.beginPath()
      ctx.arc(moonX + 22, moonY + 22, 16, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private renderClouds(ctx: CanvasRenderingContext2D, camX: number): void {
    const wrapW = this.viewW + 220
    const biome = this.level.biome
    const isModern = this.isModern

    for (const c of this.bgClouds) {
      const drift = this.worldTime * c.speed + camX * (c.tier === 'high' ? 0.04 : 0.06)
      const cx = Math.round((((c.x - drift) % wrapW) + wrapW) % wrapW - 80)
      const cy = c.y

      if (!isModern) {
        // Classic 8-Bit: flat solid 1-color retro pixel clouds
        ctx.fillStyle = biome === 'cloudland' ? '#5e388a' : biome === 'harbor' ? '#173e4d' : '#2d1c54'
        ctx.fillRect(cx + 8, cy, c.w - 16, 4)
        ctx.fillRect(cx + 2, cy + 4, c.w - 4, 6)
        continue
      }

      // Modern 16-Bit: Volumetric 3-tone shaded clouds with creamy moonlight top rim & deep underside
      const highFill =
        biome === 'cloudland'
          ? 'rgba(255, 218, 242, 0.42)'
          : biome === 'harbor'
            ? 'rgba(42, 114, 128, 0.44)'
            : 'rgba(84, 54, 140, 0.48)'
      const lowFill =
        biome === 'cloudland'
          ? 'rgba(218, 168, 224, 0.46)'
          : biome === 'harbor'
            ? 'rgba(24, 78, 92, 0.50)'
            : 'rgba(60, 36, 110, 0.52)'
      const rimFill =
        biome === 'cloudland'
          ? 'rgba(255, 250, 232, 0.52)'
          : 'rgba(255, 238, 200, 0.34)'

      ctx.fillStyle = c.tier === 'high' ? highFill : lowFill
      ctx.fillRect(cx + 8, cy, c.w - 16, 4)
      ctx.fillRect(cx + 4, cy + 3, c.w - 8, 5)
      ctx.fillRect(cx, cy + 6, c.w, Math.max(4, c.h - 6))
      ctx.fillRect(cx + 14, cy - 3, Math.floor(c.w * 0.42), 4)

      // Luminous top moonlight silver-gold rim
      ctx.fillStyle = rimFill
      ctx.fillRect(cx + 15, cy - 3, Math.floor(c.w * 0.38), 2)
      ctx.fillRect(cx + 8, cy, c.w - 18, 1)
      // Deep shaded cloud underside
      ctx.fillStyle = 'rgba(18, 10, 38, 0.28)'
      ctx.fillRect(cx + 2, cy + Math.max(8, c.h - 2), c.w - 4, 2)
    }
  }

  private renderBiomeBackdrop(ctx: CanvasRenderingContext2D, camX: number): void {
    const biome = this.level.biome
    if (biome === 'rooftops') {
      this.renderCityLayer(ctx, this.deepBuildings, Math.round(camX * 0.05), '#24164a', '#2e1d5c', 820)
      this.renderCityLayer(ctx, this.farBuildings, Math.round(camX * 0.08), '#1a1038', '#25174d', 900)
      this.renderCityLayer(ctx, this.midBuildings, Math.round(camX * 0.12), '#110826', '#1c0f3b', 1120)
    } else if (biome === 'sakura') {
      this.renderSakuraBackdrop(ctx, camX)
    } else if (biome === 'cloudland') {
      this.renderCloudlandBackdrop(ctx, camX)
    } else if (biome === 'harbor') {
      this.renderHarborBackdrop(ctx, camX)
    } else if (biome === 'cavern') {
      this.renderCavernBackdrop(ctx, camX)
    } else if (biome === 'observatory') {
      this.renderObservatoryBackdrop(ctx, camX)
    } else if (biome === 'eclipse') {
      this.renderEclipseBackdrop(ctx, camX)
    } else if (biome === 'citadel') {
      this.renderCitadelBackdrop(ctx, camX)
    }
  }

  private renderCavernBackdrop(ctx: CanvasRenderingContext2D, camX: number): void {
    const o1 = Math.round(camX * 0.08)
    const wrap = Math.max(520, this.viewW + 160)
    const count = Math.ceil(wrap / 74) + 1
    // Stalactites & glowing crystal pillars
    for (let i = 0; i < count; i++) {
      const cx = Math.round((((i * 74 - o1) % wrap) + wrap) % wrap - 40)
      ctx.fillStyle = '#0e1d36'
      ctx.fillRect(cx, 0, 14, 24 + (i % 3) * 10)
      ctx.fillRect(cx + 3, 24 + (i % 3) * 10, 8, 12)
      ctx.fillStyle = i % 2 === 0 ? '#244b6e' : '#322966'
      ctx.fillRect(cx + 22, 134, 10, 82)
      ctx.fillStyle = i % 2 === 0 ? 'rgba(110, 245, 232, 0.45)' : 'rgba(190, 140, 255, 0.45)'
      ctx.fillRect(cx + 24, 136, 4, 20)
    }
    if (!this.progress.reduceMotion) {
      for (let i = 0; i < 12; i++) {
        const sx = (i * 53 + Math.round(Math.sin(this.worldTime * 0.8 + i) * 10)) % this.viewW
        const sy = 40 + ((i * 29 - Math.round(this.worldTime * 6)) % 140 + 140) % 140
        ctx.fillStyle = i % 2 === 0 ? 'rgba(120, 250, 238, 0.65)' : 'rgba(202, 152, 255, 0.6)'
        ctx.fillRect(sx, sy, 2, 2)
      }
    }
  }

  private renderObservatoryBackdrop(ctx: CanvasRenderingContext2D, camX: number): void {
    const o1 = Math.round(camX * 0.06)
    const wrap = Math.max(540, this.viewW + 180)
    const count = Math.ceil(wrap / 110) + 1
    const rot = this.progress.reduceMotion ? 0 : this.worldTime * 0.35
    for (let i = 0; i < count; i++) {
      const gx = Math.round((((i * 110 - o1) % wrap) + wrap) % wrap - 30)
      const gy = 98 + (i % 2) * 28
      const r = i % 2 === 0 ? 26 : 18
      ctx.strokeStyle = 'rgba(224, 174, 72, 0.28)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(gx, gy, r, 0, Math.PI * 2)
      ctx.stroke()
      // Gear spokes
      for (let s = 0; s < 4; s++) {
        const a = rot * (i % 2 === 0 ? 1 : -1.3) + (s * Math.PI) / 2
        ctx.fillStyle = 'rgba(255, 224, 132, 0.32)'
        ctx.fillRect(Math.round(gx + Math.cos(a) * (r + 2)) - 2, Math.round(gy + Math.sin(a) * (r + 2)) - 2, 4, 4)
      }
    }
    // Starlight stained-glass beams
    ctx.fillStyle = 'rgba(148, 220, 255, 0.07)'
    ctx.fillRect(60, 0, 36, VIEW_H)
    ctx.fillRect(Math.round(this.viewW * 0.62), 0, 44, VIEW_H)
  }

  private renderEclipseBackdrop(ctx: CanvasRenderingContext2D, _camX: number): void {
    // Crimson-violet solar/lunar eclipse corona!
    const ex = Math.round(this.viewW * 0.56)
    const ey = 52
    ctx.fillStyle = 'rgba(255, 86, 128, 0.25)'
    ctx.beginPath()
    ctx.arc(ex, ey, 34, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ff6e91'
    ctx.beginPath()
    ctx.arc(ex, ey, 22, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1a0616'
    ctx.beginPath()
    ctx.arc(ex, ey, 19, 0, Math.PI * 2)
    ctx.fill()
    // Distant temple columns
    ctx.fillStyle = '#290d26'
    for (let x = 24; x < this.viewW; x += 72) {
      ctx.fillRect(x, 122, 12, 94)
      ctx.fillRect(x - 3, 120, 18, 4)
    }
  }

  private renderCitadelBackdrop(ctx: CanvasRenderingContext2D, _camX: number): void {
    // Cosmic rotating star-rings & nebula glow!
    const cx = Math.round(this.viewW * 0.54)
    const cy = 78
    ctx.strokeStyle = 'rgba(156, 140, 255, 0.34)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, 46, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(255, 226, 117, 0.3)'
    ctx.beginPath()
    ctx.arc(cx, cy, 30, 0, Math.PI * 2)
    ctx.stroke()
    if (!this.progress.reduceMotion) {
      for (let i = 0; i < 6; i++) {
        const a = this.worldTime * 0.6 + (i * Math.PI) / 3
        ctx.fillStyle = i % 2 === 0 ? '#ffe680' : '#9ef0ff'
        ctx.fillRect(Math.round(cx + Math.cos(a) * 46) - 2, Math.round(cy + Math.sin(a) * 46) - 2, 4, 4)
      }
    }
  }

  private renderNewBiomeMechanics(ctx: CanvasRenderingContext2D, camX: number): void {
    const t = this.progress.reduceMotion ? 0 : this.worldTime

    // 1. Rooftops Updraft Chimney Vents
    if (this.level.updrafts) {
      for (const ud of this.level.updrafts) {
        if (ud.x + ud.w < camX - 24 || ud.x > camX + this.viewW + 24) continue
        ctx.fillStyle = 'rgba(168, 228, 255, 0.12)'
        ctx.fillRect(Math.round(ud.x), Math.round(ud.y), Math.round(ud.w), Math.round(ud.h))
        for (let i = 0; i < 4; i++) {
          const sx = Math.round(ud.x + 5 + ((i * 8) % Math.max(8, ud.w - 8)))
          const sy = Math.round(ud.y + ud.h - (((t * 78 + i * 26) % ud.h) + ud.h) % ud.h)
          ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 246, 186, 0.68)' : 'rgba(182, 236, 255, 0.68)'
          ctx.fillRect(sx, sy, 2, 10)
        }
      }
    }

    // 2. Cloudland Phasing Star Clouds
    for (const pc of this.phasingClouds) {
      if (pc.x + pc.w < camX - 16 || pc.x > camX + this.viewW + 16) continue
      const alpha = pc.phase === 'solid' ? 0.95 : pc.phase === 'warn' ? (Math.floor(this.worldTime * 14) % 2 === 0 ? 0.8 : 0.35) : 0.16
      ctx.globalAlpha = alpha
      ctx.fillStyle = pc.phase === 'warn' ? '#ffe6a8' : '#e8d9ff'
      ctx.fillRect(Math.round(pc.x), Math.round(pc.y), Math.round(pc.w), 9)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(Math.round(pc.x + 3), Math.round(pc.y + 1), Math.round(pc.w - 6), 3)
      ctx.globalAlpha = 1
    }

    // 3. Harbor Swinging Lantern Perches
    for (const sp of this.swingingPerches) {
      if (sp.curX + sp.w < camX - 48 || sp.curX > camX + this.viewW + 48) continue
      ctx.strokeStyle = '#c49652'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(Math.round(sp.anchorX), Math.round(sp.anchorY))
      ctx.lineTo(Math.round(sp.curX + sp.w / 2), Math.round(sp.curY))
      ctx.stroke()
      ctx.fillStyle = '#261224'
      ctx.fillRect(Math.round(sp.curX) - 1, Math.round(sp.curY) - 1, Math.round(sp.w) + 2, 10)
      ctx.fillStyle = '#8c5338'
      ctx.fillRect(Math.round(sp.curX), Math.round(sp.curY), Math.round(sp.w), 8)
      ctx.fillStyle = '#ffe275'
      ctx.fillRect(Math.round(sp.curX + sp.w / 2 - 3), Math.round(sp.curY + 2), 6, 4)
    }

    // 4. Cavern Proximity Crystals & Elastic Glow-Mushrooms
    for (const cr of this.proximityCrystals) {
      if (cr.x < camX - cr.radius || cr.x > camX + this.viewW + cr.radius) continue
      const col = cr.tint === 'violet' ? '194, 138, 255' : cr.tint === 'gold' ? '255, 224, 118' : '108, 245, 236'
      this.drawCircularGlow(
        ctx,
        cr.x,
        cr.y,
        Math.round(cr.radius * (0.45 + cr.glow * 0.55)),
        `rgba(${col}, ${(0.12 + cr.glow * 0.34).toFixed(2)})`,
        `rgba(${col}, ${(0.05 + cr.glow * 0.14).toFixed(2)})`,
        `rgba(${col}, 0)`
      )
      ctx.fillStyle = cr.tint === 'violet' ? '#cf9eff' : cr.tint === 'gold' ? '#ffe680' : '#7ef7ec'
      ctx.fillRect(Math.round(cr.x - 3), Math.round(cr.y - 7), 6, 12)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(Math.round(cr.x - 1), Math.round(cr.y - 5), 2, 5)
    }

    for (const gm of this.glowMushrooms) {
      if (gm.x + gm.w < camX - 16 || gm.x > camX + this.viewW + 16) continue
      const squish = gm.squishTimer > 0 ? 3 : 0
      const mx = Math.round(gm.x)
      const my = Math.round(gm.y + squish)
      ctx.fillStyle = '#223854'
      ctx.fillRect(mx + Math.round(gm.w / 2) - 4, my + 7, 8, 12 - squish)
      ctx.fillStyle = gm.tint === 'violet' ? '#b87dff' : '#5ef2e6'
      ctx.fillRect(mx, my, Math.round(gm.w), 8)
      ctx.fillStyle = '#ebffff'
      ctx.fillRect(mx + 4, my + 2, 5, 2)
      ctx.fillRect(mx + Math.round(gm.w) - 10, my + 3, 4, 2)
    }

    // 5. Observatory Astral Low-Gravity Zones & Rotating Gear Platforms
    if (this.level.lowGravityZones) {
      for (const lg of this.level.lowGravityZones) {
        if (lg.x + lg.w < camX - 24 || lg.x > camX + this.viewW + 24) continue
        ctx.fillStyle = 'rgba(130, 178, 255, 0.11)'
        ctx.fillRect(Math.round(lg.x), Math.round(lg.y), Math.round(lg.w), Math.round(lg.h))
        ctx.strokeStyle = 'rgba(168, 224, 255, 0.36)'
        ctx.lineWidth = 1
        ctx.strokeRect(Math.round(lg.x) + 0.5, Math.round(lg.y) + 0.5, Math.round(lg.w) - 1, Math.round(lg.h) - 1)
        for (let i = 0; i < 4; i++) {
          const sx = Math.round(lg.x + 12 + ((i * 44) % Math.max(16, lg.w - 20)))
          const sy = Math.round(lg.y + lg.h - (((t * 24 + i * 31) % lg.h) + lg.h) % lg.h)
          ctx.fillStyle = 'rgba(218, 240, 255, 0.72)'
          ctx.fillRect(sx, sy, 2, 2)
        }
      }
    }

    for (const gp of this.gearPlatforms) {
      if (gp.centerX + gp.orbitRadius + gp.w < camX - 24 || gp.centerX - gp.orbitRadius > camX + this.viewW + 24) continue
      // Brass orbit ring & center hub
      ctx.strokeStyle = 'rgba(217, 164, 65, 0.42)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(Math.round(gp.centerX), Math.round(gp.centerY), gp.orbitRadius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = '#d9a441'
      ctx.fillRect(Math.round(gp.centerX - 4), Math.round(gp.centerY - 4), 8, 8)
      // Rim carriage platform
      ctx.fillStyle = '#181838'
      ctx.fillRect(Math.round(gp.curX) - 1, Math.round(gp.curY) - 1, Math.round(gp.w) + 2, 10)
      ctx.fillStyle = '#d9a441'
      ctx.fillRect(Math.round(gp.curX), Math.round(gp.curY), Math.round(gp.w), 8)
      ctx.fillStyle = '#fff0a6'
      ctx.fillRect(Math.round(gp.curX + 2), Math.round(gp.curY + 1), Math.round(gp.w - 4), 2)
    }
  }

  private renderSakuraBackdrop(ctx: CanvasRenderingContext2D, camX: number): void {
    // Layer 1: Distant indigo mountain silhouettes (0.05x)
    const o1 = Math.round(camX * 0.05)
    const wrap1 = Math.max(560, this.viewW + 180)
    const count1 = Math.ceil(wrap1 / 94) + 1
    ctx.fillStyle = '#1b204d'
    for (let i = 0; i < count1; i++) {
      const hx = Math.round((((i * 94 - o1) % wrap1) + wrap1) % wrap1 - 70)
      ctx.fillRect(hx, 152, 88, 64)
      ctx.fillRect(hx + 12, 140, 64, 14)
      ctx.fillRect(hx + 26, 130, 36, 12)
    }

    // Layer 2: Distant sakura tree canopies + torii shrine gate (0.08x)
    const o2 = Math.round(camX * 0.08)
    const wrap2 = Math.max(564, this.viewW + 188)
    const count2 = Math.ceil(wrap2 / 94) + 1
    for (let i = 0; i < count2; i++) {
      const tx = Math.round((((i * 94 - o2) % wrap2) + wrap2) % wrap2 - 60)
      // Trunk
      ctx.fillStyle = '#171738'
      ctx.fillRect(tx + 18, 154, 8, 62)
      // Sakura canopy with subtle dusky-pink rim
      ctx.fillStyle = '#2b2454'
      ctx.fillRect(tx + 2, 134, 42, 24)
      ctx.fillRect(tx + 8, 124, 30, 12)
      ctx.fillStyle = '#5c3c6e'
      ctx.fillRect(tx + 8, 124, 28, 3)

      // Torii Shrine Gate every 2nd slot
      if (i % 2 === 1) {
        const gx = tx + 52
        ctx.fillStyle = '#291a45'
        ctx.fillRect(gx, 144, 34, 4)
        ctx.fillRect(gx + 3, 151, 28, 3)
        ctx.fillRect(gx + 6, 148, 4, 68)
        ctx.fillRect(gx + 24, 148, 4, 68)
        ctx.fillStyle = '#75385c'
        ctx.fillRect(gx - 2, 142, 38, 2)
      }
    }

    // Layer 3: Closer dark silhouette tree trunks & soft blossom tufts (0.12x)
    const o3 = Math.round(camX * 0.12)
    const wrap3 = Math.max(580, this.viewW + 196)
    const count3 = Math.ceil(wrap3 / 116) + 1
    for (let i = 0; i < count3; i++) {
      const nx = Math.round((((i * 116 - o3) % wrap3) + wrap3) % wrap3 - 60)
      ctx.fillStyle = '#120e2b'
      ctx.fillRect(nx + 22, 168, 10, 48)
      ctx.fillStyle = '#1c153d'
      ctx.fillRect(nx + 4, 150, 48, 22)
      ctx.fillRect(nx + 12, 142, 32, 10)
      ctx.fillStyle = '#75467d'
      ctx.fillRect(nx + 12, 142, 30, 2)
    }
  }

  private renderCloudlandBackdrop(ctx: CanvasRenderingContext2D, camX: number): void {
    // Layer 1: Distant pastel lavender cloud peaks (0.05x)
    const o1 = Math.round(camX * 0.05)
    const wrap1 = Math.max(552, this.viewW + 170)
    const count1 = Math.ceil(wrap1 / 92) + 1
    for (let i = 0; i < count1; i++) {
      const cx = Math.round((((i * 92 - o1) % wrap1) + wrap1) % wrap1 - 60)
      ctx.fillStyle = '#4e2f78'
      ctx.fillRect(cx, 156, 86, 60)
      ctx.fillRect(cx + 12, 144, 62, 14)
      ctx.fillRect(cx + 24, 134, 38, 12)
      ctx.fillStyle = 'rgba(255, 212, 240, 0.25)'
      ctx.fillRect(cx + 24, 134, 38, 2)
    }

    // Layer 2: Floating dream crystal islands (0.08x)
    const o2 = Math.round(camX * 0.08)
    const wrap2 = Math.max(536, this.viewW + 160)
    const count2 = Math.ceil(wrap2 / 134) + 1
    for (let i = 0; i < count2; i++) {
      const ix = Math.round((((i * 134 - o2) % wrap2) + wrap2) % wrap2 - 50)
      const iy = 94 + (i % 2) * 20
      ctx.fillStyle = '#6c4296'
      ctx.fillRect(ix + 4, iy, 36, 8)
      ctx.fillRect(ix + 10, iy + 8, 24, 6)
      ctx.fillRect(ix + 16, iy + 14, 12, 5)
      ctx.fillStyle = '#ffdaef'
      ctx.fillRect(ix + 4, iy, 36, 2)
    }

    // Layer 3: Nearer soft cloud bank silhouette at bottom (0.12x)
    const o3 = Math.round(camX * 0.12)
    const wrap3 = Math.max(528, this.viewW + 150)
    const count3 = Math.ceil(wrap3 / 88) + 1
    for (let i = 0; i < count3; i++) {
      const cx = Math.round((((i * 88 - o3) % wrap3) + wrap3) % wrap3 - 50)
      ctx.fillStyle = '#381e5c'
      ctx.fillRect(cx, 178, 82, 38)
      ctx.fillRect(cx + 10, 170, 62, 10)
      ctx.fillStyle = 'rgba(255, 224, 244, 0.2)'
      ctx.fillRect(cx + 10, 170, 62, 2)
    }
  }

  private renderHarborBackdrop(ctx: CanvasRenderingContext2D, camX: number): void {
    // Distant dark emerald-teal sea surface at bottom
    ctx.fillStyle = '#072730'
    ctx.fillRect(0, 172, this.viewW, 44)
    ctx.fillStyle = '#0c3742'
    ctx.fillRect(0, 172, this.viewW, 3)

    // Modern 16-Bit warm additive glow pools & reflections across the harbor water!
    if (this.isModern) {
      const rippleShift = Math.round(Math.sin(this.worldTime * 1.1) * 1.5)
      const moonRefX = Math.max(80, this.viewW - (this.viewW < 280 ? 64 : 86))
      ctx.fillStyle = 'rgba(255, 242, 184, 0.34)'
      ctx.fillRect(moonRefX + rippleShift, 178, 36, 2)
      ctx.fillRect(moonRefX + 8 - rippleShift, 184, 22, 2)
      ctx.fillRect(moonRefX + 12 + rippleShift, 190, 14, 1)

      const wave1 = Math.round(Math.sin(this.worldTime * 1.25) * 1.5)
      const wave2 = Math.round(Math.cos(this.worldTime * 1.05) * 1.5)
      const refCount = Math.max(5, Math.ceil(this.viewW / 74))
      for (let i = 0; i < refCount; i++) {
        const rx = 38 + i * 74
        ctx.fillStyle = 'rgba(255, 214, 118, 0.28)'
        ctx.fillRect(rx + wave1, 179 + (i % 2) * 3, 14, 1)
        ctx.fillStyle = 'rgba(130, 232, 224, 0.22)'
        ctx.fillRect(rx + 2 + wave2, 185 + (i % 2) * 4, 10, 1)
        ctx.fillRect(rx + 4 - wave1, 192, 6, 1)
      }
    }

    // Layer 1: Distant coastal cliff & glowing Lighthouse (0.06x)
    const o1 = Math.round(camX * 0.06)
    const lhX = Math.round((((110 - o1) % 480) + 480) % 480 - 40)
    // Cliff rock
    ctx.fillStyle = '#092129'
    ctx.fillRect(lhX - 18, 152, 58, 22)
    ctx.fillRect(lhX - 10, 144, 40, 10)
    // Lighthouse tower
    ctx.fillStyle = '#11343e'
    ctx.fillRect(lhX + 4, 106, 14, 40)
    ctx.fillStyle = '#1b4a57'
    ctx.fillRect(lhX + 6, 100, 10, 6)
    ctx.fillStyle = '#ffe994'
    ctx.fillRect(lhX + 8, 101, 6, 4)
    // Calm breathing lighthouse beacon glow in Modern 16-Bit only (flat pixel lantern in Classic 8-Bit!)
    if (this.isModern) {
      const beaconAlpha = 0.26 + Math.sin(this.worldTime * 1.3) * 0.06
      this.drawCircularGlow(
        ctx,
        lhX + 11,
        103,
        30,
        `rgba(255, 242, 176, ${beaconAlpha.toFixed(3)})`,
        `rgba(255, 212, 120, ${(beaconAlpha * 0.45).toFixed(3)})`,
        'rgba(255, 212, 120, 0)'
      )
    }

    // Layer 2: Distant sailboats gliding calmly on horizon (0.11x)
    const o2 = Math.round(camX * 0.11)
    for (let i = 0; i < 3; i++) {
      const bx = Math.round((((200 + i * 168 - o2) % 520) + 520) % 520 - 40)
      const by = 166
      // Boat hull
      ctx.fillStyle = '#0b222b'
      ctx.fillRect(bx, by, 26, 6)
      ctx.fillRect(bx + 3, by + 6, 20, 2)
      // Mast & sail
      ctx.fillRect(bx + 12, by - 22, 2, 22)
      ctx.fillStyle = '#184752'
      ctx.fillRect(bx + 14, by - 19, 10, 14)
      ctx.fillRect(bx + 14, by - 21, 6, 3)
      // Little warm cabin lantern dot
      ctx.fillStyle = '#ffda75'
      ctx.fillRect(bx + 6, by + 1, 2, 2)
    }
  }

  private renderCityLayer(
    ctx: CanvasRenderingContext2D,
    buildings: BgBuilding[],
    offsetX: number,
    fill: string,
    edge: string,
    wrapW: number
  ): void {
    for (const b of buildings) {
      const bx = Math.round((((b.x - offsetX) % wrapW) + wrapW) % wrapW - 60)
      if (bx + b.w < 0 || bx > this.viewW) continue
      const by = VIEW_H - b.h

      ctx.fillStyle = fill
      ctx.fillRect(bx, by, b.w, b.h)
      ctx.fillStyle = edge
      ctx.fillRect(bx, by, b.w, 2)

      if (b.roof === 'gable') {
        ctx.fillStyle = fill
        const steps = Math.min(8, Math.floor(b.w / 4))
        for (let s = 1; s <= steps; s++) {
          ctx.fillRect(bx + s * 2, by - s * 2, b.w - s * 4, 2)
        }
      } else if (b.roof === 'spire') {
        const cx = bx + Math.floor(b.w / 2)
        ctx.fillStyle = fill
        ctx.fillRect(cx - 4, by - 6, 8, 6)
        ctx.fillRect(cx - 2, by - 12, 4, 6)
        ctx.fillRect(cx, by - 18, 1, 6)
      }

      const isModern = this.isModern
      for (const win of b.windows) {
        if (isModern) {
          // Soft warm amber halo around distant glowing city windows in 16-bit Modern Mode
          ctx.fillStyle = 'rgba(255, 212, 110, 0.28)'
          ctx.fillRect(bx + win.rx - 1, by + win.ry - 1, 4, 5)
        }
        ctx.fillStyle = win.color
        ctx.fillRect(bx + win.rx, by + win.ry, 2, 3)
      }
    }
  }

  private getPlatformTiles(style: PlatformStyle): [HTMLCanvasElement, HTMLCanvasElement] {
    const t = this.progress.graphicsStyle === 'modern' ? this.sprites.modernTiles : this.sprites.tiles
    switch (style) {
      case 'wood':
        return [t.woodTop, t.woodBody]
      case 'sakura':
        return [t.sakuraTop, t.sakuraBody]
      case 'cloud':
        return [t.cloudTop, t.cloudBody]
      case 'harbor':
        return [t.harborTop, t.harborBody]
      case 'cavern':
        return [t.cavernTop, t.cavernBody]
      case 'observatory':
        return [t.observatoryTop, t.observatoryBody]
      case 'eclipse':
        return [t.eclipseTop, t.eclipseBody]
      case 'citadel':
        return [t.citadelTop, t.citadelBody]
      case 'brick':
      default:
        return [t.brickTop, t.brickBody]
    }
  }

  private renderPlatforms(ctx: CanvasRenderingContext2D, camX: number): void {
    for (const plat of this.level.platforms) {
      if (plat.x + plat.w < camX - 24 || plat.x > camX + this.viewW + 24) continue

      const [topTile, bodyTile] = this.getPlatformTiles(plat.style)

      if (plat.chimneys) {
        for (const offset of plat.chimneys) {
          const cx = Math.round(plat.x + offset)
          const cy = Math.round(plat.y - 14)
          ctx.fillStyle = '#20102e'
          ctx.fillRect(cx - 1, cy - 1, 12, 15)
          ctx.fillStyle = '#4e2d59'
          ctx.fillRect(cx, cy, 10, 14)
          ctx.fillStyle = '#6c417a'
          ctx.fillRect(cx, cy, 3, 14)
          ctx.fillStyle = '#734882'
          ctx.fillRect(cx - 2, cy - 2, 14, 3)
          ctx.fillStyle = '#996ba8'
          ctx.fillRect(cx - 2, cy - 2, 14, 1)

          const puff = (this.worldTime * 7 + offset) % 18
          ctx.fillStyle = 'rgba(202, 188, 235, 0.32)'
          ctx.fillRect(cx + 3 + Math.round(Math.sin(this.worldTime * 1.4 + offset) * 1.5), Math.round(cy - 4 - puff), 3, 2)
        }
      }

      for (let ty = 0; ty < plat.h; ty += 16) {
        for (let tx = 0; tx < plat.w; tx += 16) {
          const drawW = Math.min(16, plat.w - tx)
          const drawH = Math.min(16, plat.h - ty)
          const tile = ty === 0 ? topTile : bodyTile
          ctx.drawImage(tile, 0, 0, drawW, drawH, Math.round(plat.x + tx), Math.round(plat.y + ty), drawW, drawH)
        }
      }

      if (plat.style !== 'cloud') {
        ctx.fillStyle = '#180d29'
        ctx.fillRect(Math.round(plat.x), Math.round(plat.y), 1, Math.round(plat.h))
        ctx.fillRect(Math.round(plat.x + plat.w - 1), Math.round(plat.y), 1, Math.round(plat.h))
        ctx.fillStyle = 'rgba(15, 7, 26, 0.28)'
        ctx.fillRect(Math.round(plat.x + plat.w - 3), Math.round(plat.y + 4), 2, Math.max(0, Math.round(plat.h - 4)))
      }
    }
  }

  private renderTutorialSigns(ctx: CanvasRenderingContext2D, camX: number): void {
    const signs = this.level.tutorialSigns
    if (!signs || signs.length === 0) return

    // High-contrast enlarged wooden signboards with crisp 7x9 bitmap pixel glyphs + hard 1px #1a0f1d drop shadows!
    for (const sign of signs) {
      const topW = measurePixelText(sign.topText, 1, 1)
      const botW = measurePixelText(sign.bottomText, 1, 1)
      const boardW = Math.max(topW, botW) + 14
      const boardH = 26
      const sx = Math.max(4, Math.min(this.level.width - boardW - 4, Math.round(sign.x)))
      const sy = Math.round(sign.y)
      if (sx + boardW < camX - 16 || sx > camX + this.viewW + 16) continue

      const postX = sx + Math.floor(boardW / 2) - 3

      // Sturdy wooden post anchoring the signboard cleanly into the rooftop
      ctx.fillStyle = '#1a0f1d'
      ctx.fillRect(postX - 1, sy + boardH, 8, 18)
      ctx.fillStyle = '#5e352d'
      ctx.fillRect(postX, sy + boardH, 6, 17)
      ctx.fillStyle = '#875142'
      ctx.fillRect(postX + 1, sy + boardH, 2, 16)

      // Outer dark pixel outline + warm wood frame + deep high-contrast dark chocolate interior
      ctx.fillStyle = '#1a0f1d'
      ctx.fillRect(sx - 2, sy - 2, boardW + 4, boardH + 4)
      ctx.fillStyle = '#995e49'
      ctx.fillRect(sx - 1, sy - 1, boardW + 2, boardH + 2)
      ctx.fillStyle = '#3b1e21'
      ctx.fillRect(sx + 1, sy + 1, boardW - 2, boardH - 2)
      ctx.fillStyle = '#2d151b'
      ctx.fillRect(sx + 2, sy + 2, boardW - 4, boardH - 4)

      // Subtle top wooden highlight & brass corner rivets
      ctx.fillStyle = '#c9886b'
      ctx.fillRect(sx, sy - 1, boardW, 1)
      ctx.fillStyle = '#ffd873'
      ctx.fillRect(sx + 2, sy + 2, 1, 1)
      ctx.fillRect(sx + boardW - 3, sy + 2, 1, 1)
      ctx.fillRect(sx + 2, sy + boardH - 3, 1, 1)
      ctx.fillRect(sx + boardW - 3, sy + boardH - 3, 1, 1)

      // Crisp 7x9 pixel text: bright yellow top keybind + pure white bottom label with 1px #1a0f1d drop shadow
      const centerX = sx + Math.floor(boardW / 2)
      drawPixelText(ctx, sign.topText, centerX, sy + 4, '#ffe875', {
        align: 'center',
        scale: 1,
        letterSpacing: 1,
        shadowColor: '#1a0f1d'
      })
      drawPixelText(ctx, sign.bottomText, centerX, sy + 15, '#ffffff', {
        align: 'center',
        scale: 1,
        letterSpacing: 1,
        shadowColor: '#1a0f1d'
      })
    }
  }

  private renderCritters(ctx: CanvasRenderingContext2D, camX: number): void {
    for (const cr of this.critters) {
      if (cr.gone) continue
      if (cr.x < camX - 24 || cr.x > camX + this.viewW + 24) continue
      const cx = Math.round(cr.x)
      const cy = Math.round(cr.y + (cr.state === 'perched' && cr.kind === 'butterfly' ? Math.round(Math.sin(this.worldTime * 3 + cr.phase)) : 0))
      const flap = Math.floor(this.worldTime * (cr.state === 'flying' ? 12 : 3.5) + cr.phase) % 2 === 0

      if (cr.kind === 'butterfly') {
        if (this.isModern) {
          this.drawCircularGlow(ctx, cx + 2, cy + 2, 7, 'rgba(255, 224, 245, 0.25)', 'rgba(255, 190, 230, 0.08)', 'rgba(0,0,0,0)')
        }
        ctx.fillStyle = cr.color
        if (flap) {
          ctx.fillRect(cx - 2, cy, 2, 3)
          ctx.fillRect(cx + 2, cy, 2, 3)
        } else {
          ctx.fillRect(cx - 1, cy - 1, 2, 2)
          ctx.fillRect(cx + 1, cy - 1, 2, 2)
        }
        ctx.fillStyle = cr.accent
        ctx.fillRect(cx, cy + 1, 2, 2)
      } else {
        // Cozy small night bird (perched calmly or gently flying upward)
        ctx.fillStyle = '#140b24'
        ctx.fillRect(cx - 1, cy, 7, 5)
        ctx.fillStyle = cr.color
        ctx.fillRect(cx, cy + 1, 5, 3)
        ctx.fillRect(cx + (cr.facing === 1 ? 3 : 0), cy - 1, 3, 3)
        // Tiny golden eye + beak
        ctx.fillStyle = cr.accent
        ctx.fillRect(cx + (cr.facing === 1 ? 5 : -1), cy, 1, 1)
        if (cr.state === 'flying') {
          ctx.fillStyle = cr.color
          if (flap) {
            ctx.fillRect(cx, cy - 3, 4, 2)
          } else {
            ctx.fillRect(cx, cy + 3, 4, 2)
          }
        }
      }
    }
  }

  private renderRooftopProps(ctx: CanvasRenderingContext2D, camX: number): void {
    const isModern = this.progress.graphicsStyle === 'modern'
    for (const prop of this.rooftopProps) {
      if (prop.modernOnly && !isModern) continue
      if (prop.x < camX - 24 || prop.x > camX + this.viewW + 24) continue
      const sprite = this.sprites.props[prop.kind]
      ctx.drawImage(sprite, Math.round(prop.x), Math.round(prop.y))
    }

    // Hanging sakura blossom branches in Modern 16-Bit Mode
    if (isModern && this.sakuraBranches.length > 0) {
      for (const br of this.sakuraBranches) {
        if (br.x < camX - 24 || br.x > camX + this.viewW + 24) continue
        ctx.drawImage(this.sprites.props.sakuraBranch, Math.round(br.x), Math.round(br.y))
      }
    }
  }

  private renderMovingPlatforms(ctx: CanvasRenderingContext2D): void {
    const tiles = this.sprites.tiles
    const isCloud = this.level.biome === 'cloudland'
    const cloudTile = this.isModern ? this.sprites.modernTiles.cloudTop : this.sprites.tiles.cloudTop
    for (const mp of this.movingPlatforms) {
      const x = Math.round(mp.curX)
      const y = Math.round(mp.curY)
      const cols = Math.max(2, Math.round(mp.w / 16))

      if (this.isModern) {
        this.drawCircularGlow(
          ctx,
          x + mp.w / 2,
          y + 9,
          18,
          isCloud ? 'rgba(255, 224, 245, 0.28)' : 'rgba(255, 224, 118, 0.30)',
          isCloud ? 'rgba(216, 174, 245, 0.10)' : 'rgba(255, 178, 72, 0.11)',
          'rgba(255, 178, 72, 0)'
        )
      }

      for (let c = 0; c < cols; c++) {
        if (isCloud) {
          ctx.drawImage(cloudTile, 0, 0, 16, 10, x + c * 16, y, 16, 10)
        } else {
          const seg = c === 0 ? tiles.movingLeft : c === cols - 1 ? tiles.movingRight : tiles.movingMid
          ctx.drawImage(seg, x + c * 16, y)
        }
      }
    }
  }

  private renderBounceClouds(ctx: CanvasRenderingContext2D): void {
    for (const bc of this.bounceClouds) {
      const bx = Math.round(bc.x)
      const by = Math.round(bc.y)
      const sprite = bc.squishTimer > 0 ? this.sprites.bounceCloud.squish : this.sprites.bounceCloud.normal

      if (this.isModern) {
        this.drawCircularGlow(
          ctx,
          bx + 14,
          by + 6,
          20,
          'rgba(255, 214, 238, 0.24)',
          'rgba(255, 180, 220, 0.08)',
          'rgba(255, 180, 220, 0)'
        )
      }
      ctx.drawImage(sprite, bx, by)
    }
  }

  private renderLanterns(ctx: CanvasRenderingContext2D, camX: number): void {
    const frame = Math.floor(this.worldTime * 2) % 2 as 0 | 1
    const isStone = this.level.biome === 'sakura'
    const sprite = isStone ? this.sprites.stoneLantern[frame] : this.sprites.lantern[frame]

    for (const lan of this.lanterns) {
      if (lan.x < camX - 42 || lan.x > camX + this.viewW + 42) continue
      const sway = Math.round(lan.swayOffset)
      const lx = Math.round(lan.x) + sway
      const ly = Math.round(lan.y)

      // Modern 16-Bit ONLY: lush warm ambient lantern glow (Classic 8-Bit renders crisp flat bare sprite!)
      if (this.isModern) {
        const breath = Math.sin(this.worldTime * 1.6 + lx * 0.07)
        const glowRadius = 32 + breath * 1.5
        this.drawCircularGlow(
          ctx,
          lx + 6,
          ly + 7,
          glowRadius,
          isStone
            ? `rgba(255, 212, 228, ${(0.42 + breath * 0.03).toFixed(3)})`
            : `rgba(255, 234, 140, ${(0.46 + breath * 0.03).toFixed(3)})`,
          isStone
            ? `rgba(255, 166, 198, ${(0.20 + breath * 0.015).toFixed(3)})`
            : `rgba(255, 162, 58, ${(0.22 + breath * 0.015).toFixed(3)})`,
          'rgba(255, 140, 40, 0)'
        )
      }

      ctx.drawImage(sprite, lx, ly)
    }
  }

  private renderPowerWires(ctx: CanvasRenderingContext2D, camX: number): void {
    for (const pw of this.powerWires) {
      if (pw.x + pw.w < camX - 24 || pw.x > camX + this.viewW + 24) continue
      const x0 = Math.round(pw.x)
      const y0 = Math.round(pw.y)
      const w = Math.round(pw.w)
      // End insulator posts
      ctx.fillStyle = '#1b0f29'
      ctx.fillRect(x0 - 2, y0 - 4, 4, 10)
      ctx.fillRect(x0 + w - 2, y0 - 4, 4, 10)
      ctx.fillStyle = '#ffd873'
      ctx.fillRect(x0 - 1, y0 - 3, 2, 2)
      ctx.fillRect(x0 + w - 1, y0 - 3, 2, 2)
      // Curved bouncing pixel cable (sagging softly in the middle!)
      const midSag = 3 + pw.sag
      for (let i = 0; i <= w; i += 2) {
        const t = i / w
        const curve = Math.sin(t * Math.PI) * midSag
        const cy = Math.round(y0 + curve)
        ctx.fillStyle = '#180c24'
        ctx.fillRect(x0 + i, cy + 1, 2, 2)
        ctx.fillStyle = pw.sag > 1 ? '#ffe875' : '#8f72b8'
        ctx.fillRect(x0 + i, cy, 2, 1)
      }
    }
  }

  private renderFragileBranches(ctx: CanvasRenderingContext2D, camX: number): void {
    for (const fb of this.fragileBranches) {
      if (fb.state === 'gone') continue
      if (fb.x + fb.w < camX - 16 || fb.x > camX + this.viewW + 16) continue
      const jitterX = fb.state === 'shaking' ? (Math.floor(this.worldTime * 22) % 2 === 0 ? -1 : 1) : 0
      const bx = Math.round(fb.x) + jitterX
      const by = Math.round(fb.curY)
      const bw = Math.round(fb.w)
      ctx.globalAlpha = fb.state === 'falling' ? Math.max(0.25, fb.timer) : 1
      ctx.fillStyle = '#1e1024'
      ctx.fillRect(bx - 1, by - 1, bw + 2, 10)
      ctx.fillStyle = fb.state === 'shaking' ? '#9e5062' : '#6e3f4e'
      ctx.fillRect(bx, by, bw, 8)
      ctx.fillStyle = '#4a2634'
      ctx.fillRect(bx + 2, by + 5, bw - 4, 3)
      // Pink sakura blossoms & crack accents showing fragility
      ctx.fillStyle = '#ffaad2'
      ctx.fillRect(bx + 4, by, 6, 2)
      ctx.fillRect(bx + bw - 12, by, 7, 2)
      ctx.fillStyle = '#241224'
      ctx.fillRect(bx + Math.floor(bw / 2), by + 2, 2, 4)
      ctx.globalAlpha = 1
    }
  }

  private renderFloatingBoats(ctx: CanvasRenderingContext2D, camX: number): void {
    for (const bo of this.floatingBoats) {
      if (bo.curX + bo.w < camX - 24 || bo.curX > camX + this.viewW + 24) continue
      const bx = Math.round(bo.curX)
      const by = Math.round(bo.curY)
      const bw = Math.round(bo.w)
      // Calm water ripples under boat
      ctx.fillStyle = 'rgba(150, 232, 240, 0.35)'
      ctx.fillRect(bx - 2, by + 11, bw + 4, 2)
      // Wooden boat hull
      ctx.fillStyle = '#141d26'
      ctx.fillRect(bx, by, bw, 11)
      ctx.fillStyle = this.isModern ? '#b57b5c' : '#855540'
      ctx.fillRect(bx + 1, by + 1, bw - 2, 4)
      ctx.fillStyle = '#6e4234'
      ctx.fillRect(bx + 3, by + 5, bw - 6, 5)
      // Cute prow lantern dot on front of boat
      ctx.fillStyle = '#ffe475'
      ctx.fillRect(bx + bw - 6, by - 2, 3, 3)
      if (this.isModern) {
        this.drawCircularGlow(ctx, bx + bw - 4, by - 1, 10, 'rgba(255, 224, 128, 0.3)', 'rgba(255, 170, 68, 0.08)', 'rgba(0,0,0,0)')
      }
    }
  }

  private renderWindVortices(ctx: CanvasRenderingContext2D, camX: number): void {
    if (!this.level.windVortices) return
    const isModern = this.isModern
    for (const wv of this.level.windVortices) {
      if (wv.x + wv.w < camX - 24 || wv.x > camX + this.viewW + 24) continue
      const wx = Math.round(wv.x)
      const wy = Math.round(wv.y)
      const dir = wv.pushX < 0 ? -1 : 1

      // Soft feathered breeze air shimmer (zero harsh rectangular box!)
      if (isModern) {
        const cx = wx + wv.w * 0.5
        const cy = wy + wv.h * 0.5
        const rad = Math.max(wv.w, wv.h) * 0.52
        this.drawCircularGlow(
          ctx,
          cx,
          cy,
          rad,
          'rgba(255, 206, 232, 0.09)',
          'rgba(216, 188, 255, 0.04)',
          'rgba(216, 188, 255, 0)'
        )
      }

      // Flowing curved pixel wind ribbons sweeping smoothly in the push direction
      const ribbonCount = 5
      for (let i = 0; i < ribbonCount; i++) {
        const speed = 0.72 + (i % 3) * 0.14
        const prog = (this.worldTime * speed + i * 0.21) % 1
        // Smooth fade-in and fade-out at both ends of the gust (no hard clipping edge)
        const edgeFade = Math.sin(prog * Math.PI)
        if (edgeFade <= 0.05) continue

        const headX = dir < 0 ? wx + wv.w - prog * wv.w : wx + prog * wv.w
        const laneRatio = (i + 0.5) / ribbonCount
        const baseY = wy + 6 + laneRatio * Math.max(12, wv.h - 12)
        const ribbonLen = 14 + (i % 2) * 5

        ctx.globalAlpha = Number((edgeFade * (isModern ? 0.62 : 0.72)).toFixed(2))
        ctx.fillStyle = i % 2 === 0 ? '#ffdcf0' : '#dceeff'
        for (let seg = 0; seg < ribbonLen; seg += 2) {
          const sx = Math.round(headX - dir * seg)
          const wave = Math.sin(this.worldTime * 5.2 + i * 1.4 - seg * 0.28) * 2.2
          // Subtle upward curl at the leading tip of each wind gust
          const curl = seg < 4 ? -Math.round((4 - seg) * 0.45) : 0
          const sy = Math.round(baseY + wave + curl)
          ctx.fillRect(sx, sy, 2, 1)
        }
        // Tiny pixel swirl curl dot at the trailing edge
        const curlX = Math.round(headX - dir * (ribbonLen + 1))
        const curlY = Math.round(
          baseY + Math.sin(this.worldTime * 5.2 + i * 1.4 - ribbonLen * 0.28) * 2.2 - 1
        )
        ctx.fillRect(curlX, curlY, 1, 1)
      }

      // Organic drifting sakura petals tumbling softly inside the breeze
      const petalCount = 7
      for (let i = 0; i < petalCount; i++) {
        const prog = (this.worldTime * (0.58 + (i % 3) * 0.12) + i * 0.145) % 1
        const edgeFade = Math.sin(prog * Math.PI)
        if (edgeFade <= 0.06) continue

        const px = Math.round(dir < 0 ? wx + wv.w - prog * wv.w : wx + prog * wv.w)
        const py = Math.round(
          wy +
            5 +
            (((i * 17 + 7) % Math.max(14, wv.h - 10))) +
            Math.sin(this.worldTime * 4.4 + i * 1.9) * 3.2
        )
        const tilt = Math.floor(this.worldTime * 5 + i) % 2 === 0
        ctx.globalAlpha = Number((edgeFade * 0.92).toFixed(2))
        ctx.fillStyle = i % 3 === 0 ? '#fff2f8' : i % 3 === 1 ? '#ffc2e0' : '#ff9bc9'
        if (tilt) {
          ctx.fillRect(px, py, 2, 1)
          ctx.fillRect(px + 1, py + 1, 2, 1)
        } else {
          ctx.fillRect(px + 1, py, 2, 1)
          ctx.fillRect(px, py + 1, 2, 1)
        }
      }

      ctx.globalAlpha = 1
    }
  }

  private renderSteamVents(ctx: CanvasRenderingContext2D, camX: number): void {
    for (const sv of this.steamVents) {
      if (sv.x < camX - 24 || sv.x > camX + this.viewW + 24) continue
      const sx = Math.round(sv.x)
      const sy = Math.round(sv.y)
      // Iron vent pipe cap on rooftop
      ctx.fillStyle = '#1b0f29'
      ctx.fillRect(sx - 5, sy - 6, 14, 7)
      ctx.fillStyle = sv.phase === 'warn' ? '#d98a4a' : '#6b537a'
      ctx.fillRect(sx - 4, sy - 5, 12, 5)
      ctx.fillStyle = '#a389b5'
      ctx.fillRect(sx - 3, sy - 5, 10, 1)

      if (sv.phase === 'warn') {
        // Clear vibrating thin telegraph smoke wisps before steam burst!
        const j = Math.floor(this.worldTime * 18) % 2 === 0 ? -1 : 1
        ctx.fillStyle = 'rgba(255, 228, 168, 0.72)'
        ctx.fillRect(sx + j, sy - 12, 4, 5)
        ctx.fillRect(sx + 1 - j, sy - 18, 2, 4)
      } else if (sv.phase === 'active') {
        // Vertical hot steam column
        const pulse = Math.floor(this.worldTime * 14) % 2
        ctx.fillStyle = 'rgba(235, 240, 255, 0.78)'
        ctx.fillRect(sx - 3 + pulse, sy - 34, 10, 28)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(sx - 1, sy - 32, 6, 24)
      }
    }
  }

  private renderSecretAlcoves(ctx: CanvasRenderingContext2D, camX: number): void {
    for (const sa of this.secretAlcoves) {
      if (sa.x + sa.w < camX - 20 || sa.x > camX + this.viewW + 20) continue
      const sx = Math.round(sa.x)
      const sy = Math.round(sa.y)
      ctx.save()
      ctx.globalAlpha = Math.max(0.14, Math.min(1, sa.alpha))
      if (sa.kind === 'chimney') {
        ctx.fillStyle = '#1d0e29'
        ctx.fillRect(sx, sy, sa.w, sa.h)
        ctx.fillStyle = '#573363'
        ctx.fillRect(sx + 1, sy + 1, sa.w - 2, sa.h - 2)
        ctx.fillStyle = '#754885'
        ctx.fillRect(sx + 1, sy + 1, sa.w - 2, 3)
      } else if (sa.kind === 'canopy') {
        ctx.fillStyle = '#2d1c4a'
        ctx.fillRect(sx, sy + 2, sa.w, sa.h - 2)
        ctx.fillStyle = '#a85a8e'
        ctx.fillRect(sx + 2, sy, sa.w - 4, sa.h - 4)
        ctx.fillStyle = '#ffaad2'
        ctx.fillRect(sx + 6, sy + 2, sa.w - 12, 4)
      } else if (sa.kind === 'cloud') {
        ctx.fillStyle = '#b481cf'
        ctx.fillRect(sx, sy + 3, sa.w, sa.h - 3)
        ctx.fillStyle = '#fff0fa'
        ctx.fillRect(sx + 4, sy, sa.w - 8, sa.h - 6)
      } else {
        // Harbor sail curtain
        ctx.fillStyle = '#162d38'
        ctx.fillRect(sx, sy, sa.w, sa.h)
        ctx.fillStyle = '#d9ccb2'
        ctx.fillRect(sx + 2, sy + 2, sa.w - 4, sa.h - 4)
        ctx.fillStyle = '#b89f82'
        ctx.fillRect(sx + 2, sy + Math.floor(sa.h / 2), sa.w - 4, 2)
      }
      // Subtle sparkling star hint on the alcove edge so observant players spot secrets!
      if (!sa.discovered && Math.floor(this.worldTime * 3) % 2 === 0) {
        ctx.fillStyle = '#ffe885'
        ctx.fillRect(sx + sa.w - 6, sy + 4, 2, 2)
      }
      ctx.restore()
    }
  }

  private renderBiomeEnemies(ctx: CanvasRenderingContext2D, camX: number): void {
    const stepFrame = Math.floor(this.worldTime * 6.5) % 2 as 0 | 1

    // 1. Sakura Forest Hedgehogs
    for (const hh of this.hedgehogs) {
      if (hh.defeated || hh.curX < camX - 24 || hh.curX > camX + this.viewW + 24) continue
      const spr = hh.facing === 1 ? this.sprites.hedgehog.right[stepFrame] : this.sprites.hedgehog.left[stepFrame]
      ctx.drawImage(spr, Math.round(hh.curX), Math.round(hh.y))
    }

    // 2. Cloudland Mini Storm Clouds (calm -> bright yellow warning -> crisp electric spark!)
    for (const sc of this.stormClouds) {
      if (sc.x < camX - 30 || sc.x > camX + this.viewW + 30) continue
      const sx = Math.round(sc.x)
      const sy = Math.round(sc.y)
      const flash = sc.phase === 'warn' && Math.floor(this.worldTime * 10) % 2 === 0
      const spr =
        sc.phase === 'zap'
          ? this.sprites.stormCloud.zap
          : flash
            ? this.sprites.stormCloud.warn
            : this.sprites.stormCloud.calm
      ctx.drawImage(spr, sx, sy)
      if (sc.phase === 'zap') {
        // Crisp zig-zag pixel lightning bolt below cloud
        const bx = sx + 11
        ctx.fillStyle = '#9cecff'
        ctx.fillRect(bx - 1, sy + 10, 4, 14)
        ctx.fillRect(bx - 3, sy + 24, 4, 14)
        ctx.fillRect(bx - 1, sy + 38, 4, 14)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(bx, sy + 10, 2, 14)
        ctx.fillRect(bx - 2, sy + 24, 2, 14)
        ctx.fillRect(bx, sy + 38, 2, 14)
      }
    }

    // 3. Cloudland Swooping Crows
    const crowFrame = Math.floor(this.worldTime * 8) % 2 as 0 | 1
    for (const sw of this.swoopCrows) {
      if (sw.defeated || sw.curX < camX - 30 || sw.curX > camX + this.viewW + 30) continue
      const set = sw.dir === 1 ? this.sprites.crow.right : this.sprites.crow.left
      const sx = Math.round(sw.curX)
      const sy = Math.round(sw.curY)
      ctx.drawImage(set[crowFrame], sx, sy)
      if (sw.state === 'warn') {
        // Crisp yellow warning "!" telegraph above swooping crow
        ctx.fillStyle = '#ffe875'
        ctx.fillRect(sx + 8, sy - 7, 2, 4)
        ctx.fillRect(sx + 8, sy - 2, 2, 1)
      }
    }

    // 4. Harbor Agile Pier Crabs
    const crabFrame = Math.floor(this.worldTime * 8.5) % 2 as 0 | 1
    for (const cr of this.crabs) {
      if (cr.defeated || cr.curX < camX - 24 || cr.curX > camX + this.viewW + 24) continue
      ctx.drawImage(this.sprites.crab[crabFrame], Math.round(cr.curX), Math.round(cr.curY))
    }

    // 5. Harbor Floating Lantern Wisps
    const wispFrame = Math.floor(this.worldTime * 5) % 2 as 0 | 1
    for (const w of this.wisps) {
      if (w.defeated || w.x < camX - 24 || w.x > camX + this.viewW + 24) continue
      const wx = Math.round(w.x)
      const wy = Math.round(w.curY)
      if (this.isModern) {
        this.drawCircularGlow(ctx, wx + 6, wy + 6, 15, 'rgba(130, 238, 255, 0.34)', 'rgba(255, 224, 120, 0.12)', 'rgba(0,0,0,0)')
      }
      ctx.drawImage(this.sprites.wisp[wispFrame], wx, wy)
    }
  }

  private renderCheckpoint(ctx: CanvasRenderingContext2D): void {
    for (const cp of this.checkpoints) {
      const cx = Math.round(cp.x)
      const cy = Math.round(cp.y)

      if (cp.activated) {
        if (this.isModern) {
          const breath = Math.sin(this.worldTime * 2.0)
          this.drawCircularGlow(
            ctx,
            cx + 7,
            cy + 7,
            32 + breath * 1.5,
            `rgba(255, 226, 168, ${(0.44 + breath * 0.03).toFixed(3)})`,
            `rgba(255, 150, 196, ${(0.22 + breath * 0.02).toFixed(3)})`,
            'rgba(255, 150, 196, 0)'
          )
        }
        const sprite = Math.floor(this.worldTime * 2.5) % 2 === 0 ? this.sprites.checkpoint.on0 : this.sprites.checkpoint.on1
        ctx.drawImage(sprite, cx, cy)
      } else {
        ctx.drawImage(this.sprites.checkpoint.off, cx, cy)
      }
    }
  }

  private renderPuddles(ctx: CanvasRenderingContext2D): void {
    const frame = Math.floor(this.worldTime * 2.4) % 2 as 0 | 1
    const sprite = this.sprites.puddle[frame]
    for (const pud of this.level.puddles) {
      const px = Math.round(pud.x)
      const py = Math.round(pud.y)
      ctx.drawImage(sprite, px, py)

      const shimmerPhase = Math.floor(this.worldTime * 3.5 + px) % 3
      ctx.fillStyle = '#ebf9ff'
      if (shimmerPhase === 0) {
        ctx.fillRect(px + 6, py + 3, 2, 1)
      } else if (shimmerPhase === 1) {
        ctx.fillRect(px + 14, py + 4, 2, 1)
      } else {
        ctx.fillRect(px + 10, py + 2, 1, 1)
      }
    }
  }

  private renderPortal(ctx: CanvasRenderingContext2D): void {
    const frame = Math.floor(this.worldTime * 3.5) % 2 as 0 | 1
    const px = Math.round(this.level.portal.x)
    const py = Math.round(this.level.portal.y)

    if (this.isModern) {
      const pulse = Math.sin(this.worldTime * 2.0) * 0.04
      this.drawCircularGlow(
        ctx,
        px + 16,
        py + 20,
        38,
        `rgba(168, 240, 255, ${(0.34 + pulse).toFixed(3)})`,
        `rgba(196, 150, 255, ${(0.16 + pulse * 0.4).toFixed(3)})`,
        'rgba(160, 120, 255, 0)'
      )
    }

    ctx.drawImage(this.sprites.portal[frame], px, py)
  }

  private renderNpc(ctx: CanvasRenderingContext2D): void {
    const npc = this.level.npc
    const nx = Math.round(npc.x)
    const ny = Math.round(npc.y)

    const blinkCycle = this.worldTime % 3.6
    const frame = blinkCycle > 3.4 ? 1 : 0
    const sprite = this.sprites.npc[npc.kind][frame]
    ctx.drawImage(sprite, nx, ny)

    if (this.screen === 'playing') {
      const distX = Math.abs(this.player.x + this.player.w / 2 - (nx + 8))
      const distY = Math.abs(this.player.y - ny)
      if (distX <= 82 && distY <= 60) {
        this.renderSpeechBubble(ctx, nx + 8, ny - 6, npc.lines)
      }
    }
  }

  private renderSpeechBubble(ctx: CanvasRenderingContext2D, anchorX: number, bottomY: number, lines: [string, string]): void {
    ctx.font = 'bold 6.5px "Silkscreen", "Courier New", monospace'
    const w1 = ctx.measureText(lines[0]).width
    const w2 = ctx.measureText(lines[1]).width
    const boxW = Math.ceil(Math.max(w1, w2)) + 12
    const boxH = 22

    const rawX = Math.round(anchorX - boxW * 0.72)
    const minX = Math.round(this.cameraX) + 4
    const maxX = Math.round(this.cameraX) + this.viewW - boxW - 4
    const bx = Math.max(minX, Math.min(maxX, rawX))
    const by = Math.max(24, Math.round(bottomY - boxH))

    ctx.fillStyle = '#1d0e2e'
    ctx.fillRect(bx - 1, by - 1, boxW + 2, boxH + 2)
    ctx.fillStyle = '#f7a8ca'
    ctx.fillRect(bx, by, boxW, boxH)
    ctx.fillStyle = '#2d1742'
    ctx.fillRect(bx + 1, by + 1, boxW - 2, boxH - 2)

    const tailX = Math.max(bx + 6, Math.min(bx + boxW - 8, Math.round(anchorX)))
    ctx.fillStyle = '#f7a8ca'
    ctx.fillRect(tailX - 2, by + boxH, 5, 2)
    ctx.fillRect(tailX - 1, by + boxH + 2, 3, 2)
    ctx.fillStyle = '#2d1742'
    ctx.fillRect(tailX - 1, by + boxH - 1, 3, 2)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#fff5e8'
    ctx.fillText(lines[0], bx + Math.floor(boxW / 2), by + 9)
    ctx.fillStyle = '#ffe48c'
    ctx.fillText(lines[1], bx + Math.floor(boxW / 2), by + 18)
  }

  private renderPowerUps(ctx: CanvasRenderingContext2D): void {
    for (const pu of this.powerUps) {
      if (pu.collected) continue
      const px = Math.round(pu.x)
      const py = Math.round(pu.y + Math.round(Math.sin(this.worldTime * 1.4 + pu.phase) * 1.5))

      const glowColor =
        pu.kind === 'milk'
          ? 'rgba(255, 198, 224, 0.30)'
          : pu.kind === 'feather'
            ? 'rgba(224, 184, 255, 0.32)'
            : pu.kind === 'bell' || pu.kind === 'mooncake'
              ? 'rgba(255, 226, 108, 0.34)'
              : pu.kind === 'yarn'
                ? 'rgba(206, 166, 255, 0.34)'
                : pu.kind === 'mochi'
                  ? 'rgba(255, 174, 212, 0.34)'
                  : pu.kind === 'candy'
                    ? 'rgba(176, 245, 220, 0.34)'
                    : 'rgba(155, 224, 255, 0.34)'

      if (this.isModern) {
        this.drawCircularGlow(ctx, px + 6, py + 6, 15, glowColor, 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0)')
      }
      ctx.drawImage(this.sprites.powerUps[pu.kind], px, py)
    }
  }

  private renderStarRingChallenge(ctx: CanvasRenderingContext2D, camX: number): void {
    const bell = this.level.starRingBell
    if (!bell) return
    const bx = Math.round(bell.x)
    const by = Math.round(bell.y)

    if (bx > camX - 60 && bx < camX + this.viewW + 60) {
      // Golden Star Ring Bell pedestal & shimmering bell icon
      if (this.starRingState === 'ready' || this.starRingState === 'active') {
        const bob = Math.round(Math.sin(this.worldTime * 2.2) * 1.5)
        if (this.isModern) {
          this.drawCircularGlow(
            ctx,
            bx + 6,
            by + 6 + bob,
            16,
            this.starRingState === 'active' ? 'rgba(158, 240, 255, 0.34)' : 'rgba(255, 232, 118, 0.36)',
            'rgba(255, 200, 82, 0.10)',
            'rgba(0,0,0,0)'
          )
        }
        ctx.drawImage(this.sprites.powerUps.bell, bx, by + bob)
      } else if (this.starRingState === 'cooldown') {
        ctx.globalAlpha = 0.35
        ctx.drawImage(this.sprites.powerUps.bell, bx, by)
        ctx.globalAlpha = 1
      }
    }

    // Active circular formation of 8 Glowing Ring Stars!
    if (this.starRingState === 'active') {
      const frame = Math.floor(this.worldTime * 4) % 2 as 0 | 1
      for (const st of this.starRingStars) {
        if (st.collected) continue
        const sx = Math.round(st.x)
        const sy = Math.round(st.y + Math.sin(this.worldTime * 3 + st.phase))
        if (this.isModern) {
          this.drawCircularGlow(ctx, sx + 6, sy + 6, 13, 'rgba(255, 246, 168, 0.36)', 'rgba(255, 200, 90, 0.12)', 'rgba(0,0,0,0)')
        }
        ctx.drawImage(this.sprites.star[frame], sx, sy)
      }
    }
  }

  private renderFallingEventStars(ctx: CanvasRenderingContext2D): void {
    if (this.fallingEventStars.length === 0) return
    const frame = Math.floor(this.worldTime * 5) % 2 as 0 | 1
    for (const fs of this.fallingEventStars) {
      if (fs.collected) continue
      const sx = Math.round(fs.x)
      const sy = Math.round(fs.y)
      // Soft comet tail
      ctx.fillStyle = 'rgba(255, 236, 150, 0.45)'
      ctx.fillRect(sx - 3, sy - 6, 2, 4)
      ctx.fillStyle = 'rgba(255, 196, 232, 0.35)'
      ctx.fillRect(sx - 5, sy - 10, 2, 3)
      if (this.isModern) {
        this.drawCircularGlow(ctx, sx + 6, sy + 6, 14, 'rgba(255, 246, 180, 0.36)', 'rgba(255, 198, 224, 0.12)', 'rgba(0,0,0,0)')
      }
      ctx.drawImage(this.sprites.star[frame], sx, sy)
    }
  }

  private renderCollectibles(ctx: CanvasRenderingContext2D): void {
    const frame = Math.floor(this.worldTime * 2.2) % 2 as 0 | 1
    const isModern = this.isModern
    for (const item of this.collectibles) {
      if (item.collected) continue
      const ix = Math.round(item.curX)
      const iy = Math.round(item.curY + Math.round(Math.sin(this.worldTime * 1.4 + item.phase) * 1.5))

      if (item.kind === 'fish') {
        if (isModern) {
          this.drawCircularGlow(
            ctx,
            ix + 7,
            iy + 5,
            15,
            'rgba(255, 224, 102, 0.32)',
            'rgba(255, 180, 60, 0.12)',
            'rgba(255, 180, 60, 0)'
          )
        }
        ctx.drawImage(this.sprites.fish[frame], ix, iy)
      } else if (item.kind === 'bigStar') {
        if (isModern) {
          this.drawCircularGlow(
            ctx,
            ix + 8,
            iy + 8,
            19,
            'rgba(255, 244, 156, 0.42)',
            'rgba(255, 206, 86, 0.16)',
            'rgba(255, 206, 86, 0)'
          )
        }
        ctx.drawImage(this.sprites.bigStar[frame], ix, iy)
      } else {
        if (isModern) {
          this.drawCircularGlow(
            ctx,
            ix + 6,
            iy + 6,
            13,
            'rgba(255, 248, 176, 0.32)',
            'rgba(255, 218, 92, 0.11)',
            'rgba(255, 218, 92, 0)'
          )
        }
        ctx.drawImage(this.sprites.star[frame], ix, iy)
      }
    }
  }

  private renderCrows(ctx: CanvasRenderingContext2D): void {
    const frame = Math.floor(this.worldTime * 7.0) % 2 as 0 | 1
    for (const crow of this.crows) {
      if (crow.defeated) continue
      const spriteSet = crow.facing === 1 ? this.sprites.crow.right : this.sprites.crow.left
      ctx.drawImage(spriteSet[frame], Math.round(crow.curX), Math.round(crow.curY))
    }
  }

  private renderDashAfterimages(ctx: CanvasRenderingContext2D): void {
    for (const ghost of this.afterimages) {
      const alpha = Math.max(0, (ghost.life / ghost.maxLife) * 0.58)
      const dirBank = ghost.facing === 1 ? this.playerSprites.right : this.playerSprites.left
      const sprite =
        ghost.tint === 'rainbow'
          ? dirBank.dashGhostRainbow[(ghost.rainbowIdx ?? 0) % dirBank.dashGhostRainbow.length]!
          : ghost.tint === 'scarf'
            ? dirBank.dashGhostScarf
            : dirBank.dashGhostWhite
      const drawSize = ghost.scale && ghost.scale > 1 ? Math.round(24 * ghost.scale) : 24
      const gx = drawSize > 24 ? Math.round(ghost.x - 10) : Math.round(ghost.x - 6)
      const gy = drawSize > 24 ? Math.round(ghost.y - 15) : Math.round(ghost.y - 7)
      ctx.globalAlpha = alpha
      ctx.drawImage(sprite, gx, gy, drawSize, drawSize)
    }
    ctx.globalAlpha = 1
  }

  private getActiveBiomeJumpLayer(): BiomeCosmeticJumpKind | null {
    // Anti-clutter priority: Hat > Cape > Scarf
    if (this.progress.selectedHat === 'hat-astral-clockwork') return 'hat-astral-clockwork'
    if (this.progress.selectedHat === 'beret-starlight') return 'beret-starlight'
    if (this.progress.selectedCape === 'cape-nebula-sovereign') return 'cape-nebula-sovereign'
    if (this.progress.selectedCape === 'cape-crystal-glow') return 'cape-crystal-glow'
    if (this.progress.selectedCape === 'cape-sakura-petal') return 'cape-sakura-petal'
    if (this.progress.selectedCape === 'wings-cloud-pastel') return 'wings-cloud-pastel'
    if (this.progress.selectedScarf === 'lantern-gold') return 'lantern-gold'
    return null
  }

  private pushCosmeticParticle(pt: CosmeticTrailParticle): void {
    // Strict cap of max 15 active cosmetic particles per character
    if (this.cosmeticParticles.length >= 15) {
      this.cosmeticParticles.shift()
    }
    this.cosmeticParticles.push(pt)
  }

  private triggerBiomeCosmeticJumpAccent(): void {
    const layer = this.getActiveBiomeJumpLayer()
    if (layer) {
      this.audio.playBiomeCosmeticJumpLayer(layer)
    }

    // Cloud Wings Cape jump burst (3-4 fluffy pastel cloud puffs, respecting reduceMotion)
    if (this.progress.selectedCape === 'wings-cloud-pastel' && !this.progress.reduceMotion) {
      const p = this.player
      const cx = p.x + p.w / 2
      const cy = p.y + p.h - 2
      const count = 3 + (Math.random() > 0.5 ? 1 : 0)
      for (let i = 0; i < count; i++) {
        this.pushCosmeticParticle({
          kind: 'cloudPuff',
          x: cx + (Math.random() - 0.5) * 10,
          y: cy + (Math.random() - 0.5) * 3,
          vx: (Math.random() - 0.5) * 26,
          vy: 6 + Math.random() * 14,
          life: 0.45 + Math.random() * 0.2,
          maxLife: 0.65,
          size: 2,
          color: i % 2 === 0 ? '#f4fbff' : '#bae8ff',
          phase: Math.random() * Math.PI * 2
        })
      }
    }
  }

  private updateCosmeticTrailParticles(dt: number): void {
    const isVisibleScreen = this.screen === 'playing' || this.screen === 'title'
    if (!isVisibleScreen) return

    if (this.progress.reduceMotion) {
      if (this.cosmeticParticles.length > 0) {
        this.cosmeticParticles = []
      }
      return
    }

    const p = this.player
    const isMoving = Math.abs(p.vx) > 10 || !p.onGround
    const liftY = this.screen === 'title' ? this.campHopOffset : 0

    // 1. Starlight Beret OR Astral Clockwork Hat sparkles!
    if (
      this.progress.selectedHat === 'beret-starlight' ||
      this.progress.selectedHat === 'hat-astral-clockwork'
    ) {
      const isClock = this.progress.selectedHat === 'hat-astral-clockwork'
      this.cosmeticHatTimer -= dt
      if (this.cosmeticHatTimer <= 0) {
        this.cosmeticHatTimer = 0.34
        this.pushCosmeticParticle({
          kind: isClock ? 'clockworkSpark' : 'starlightGlint',
          x: p.x + 2 + Math.random() * 8,
          y: p.y - 4 - liftY + Math.random() * 3,
          vx: (Math.random() - 0.5) * 6,
          vy: -8 - Math.random() * 5,
          life: 0.65,
          maxLife: 0.65,
          size: isClock ? 2 : 1,
          color: isClock
            ? Math.random() > 0.4
              ? '#ffd452'
              : '#fff5c2'
            : Math.random() > 0.4
              ? '#ffe475'
              : '#ffffff',
          phase: Math.random() * Math.PI * 2,
          cross: Math.random() > 0.45
        })
      }
    }

    // 2. Biome & Boss Reward Capes (Sakura Petal / Cloud Wings / Crystal Glow / Nebula Sovereign)
    if (this.progress.selectedCape === 'cape-crystal-glow') {
      this.cosmeticCapeTimer -= dt
      if (this.cosmeticCapeTimer <= 0) {
        this.cosmeticCapeTimer = isMoving ? 0.16 : 0.46
        this.pushCosmeticParticle({
          kind: 'crystalShard',
          x: p.x + p.w / 2 - p.facing * 5 + (Math.random() - 0.5) * 4,
          y: p.y + 6 - liftY + Math.random() * 5,
          vx: -p.facing * (8 + Math.random() * 8),
          vy: -4 + Math.random() * 10,
          life: 0.6,
          maxLife: 0.6,
          size: 2,
          color: Math.random() > 0.45 ? '#76f7eb' : '#c294ff',
          phase: Math.random() * Math.PI * 2,
          cross: true
        })
      }
    } else if (this.progress.selectedCape === 'cape-nebula-sovereign') {
      this.cosmeticCapeTimer -= dt
      if (this.cosmeticCapeTimer <= 0) {
        this.cosmeticCapeTimer = isMoving ? 0.15 : 0.42
        this.pushCosmeticParticle({
          kind: 'nebulaSwirl',
          x: p.x + p.w / 2 - p.facing * 6 + (Math.random() - 0.5) * 6,
          y: p.y + 5 - liftY + Math.random() * 6,
          vx: -p.facing * (6 + Math.random() * 10),
          vy: -8 + Math.random() * 10,
          life: 0.72,
          maxLife: 0.72,
          size: 2,
          color: Math.random() > 0.5 ? '#ffe275' : '#a875ff',
          phase: Math.random() * Math.PI * 2,
          cross: Math.random() > 0.5
        })
      }
    } else if (this.progress.selectedCape === 'cape-sakura-petal') {
      this.cosmeticCapeTimer -= dt
      const interval = isMoving ? 0.16 : 0.48
      if (this.cosmeticCapeTimer <= 0) {
        this.cosmeticCapeTimer = interval
        this.pushCosmeticParticle({
          kind: 'sakuraPetal',
          x: p.x + p.w / 2 - p.facing * 5 + (Math.random() - 0.5) * 3,
          y: p.y + 6 - liftY + Math.random() * 4,
          vx: -p.facing * (isMoving ? 10 : 4),
          vy: 10 + Math.random() * 6,
          life: 0.95,
          maxLife: 0.95,
          size: 2,
          color: Math.random() > 0.35 ? '#ffb3d6' : '#ffdff0',
          phase: Math.random() * Math.PI * 2
        })
      }
    } else if (this.progress.selectedCape === 'wings-cloud-pastel') {
      // 3. Cloud Wings Cape: light floating pastel cloud wisps while airborne (and gentle idle wisps on Title)
      this.cosmeticCapeTimer -= dt
      const shouldEmit = !p.onGround || this.screen === 'title'
      if (shouldEmit && this.cosmeticCapeTimer <= 0) {
        this.cosmeticCapeTimer = !p.onGround ? 0.15 : 0.45
        this.pushCosmeticParticle({
          kind: 'cloudPuff',
          x: p.x + p.w / 2 - p.facing * 4 + (Math.random() - 0.5) * 5,
          y: p.y + 6 - liftY + Math.random() * 4,
          vx: -p.facing * 6 + (Math.random() - 0.5) * 6,
          vy: -4 + Math.random() * 5,
          life: 0.58,
          maxLife: 0.58,
          size: 2,
          color: Math.random() > 0.45 ? '#f5fbff' : '#bae8ff',
          phase: Math.random() * Math.PI * 2
        })
      }
    }

    // 4. Golden Lantern Scarf: warm amber-gold embers flowing from scarf tail & rising softly
    if (this.progress.selectedScarf === 'lantern-gold') {
      this.cosmeticScarfTimer -= dt
      const interval = isMoving ? 0.14 : 0.38
      if (this.cosmeticScarfTimer <= 0) {
        this.cosmeticScarfTimer = interval
        this.pushCosmeticParticle({
          kind: 'lanternEmber',
          x: p.x + p.w / 2 - p.facing * 5 + (Math.random() - 0.5) * 2,
          y: p.y + 7 - liftY + Math.random() * 3,
          vx: -p.facing * (isMoving ? 14 : 5) + (Math.random() - 0.5) * 4,
          vy: -10 - Math.random() * 7,
          life: 0.72,
          maxLife: 0.72,
          size: Math.random() > 0.45 ? 2 : 1,
          color: Math.random() > 0.4 ? '#ffbe3b' : '#fff099',
          phase: Math.random() * Math.PI * 2
        })
      }
    }

    for (let i = this.cosmeticParticles.length - 1; i >= 0; i--) {
      const pt = this.cosmeticParticles[i]!
      pt.life -= dt
      if (pt.life <= 0) {
        this.cosmeticParticles.splice(i, 1)
        continue
      }
      if (pt.kind === 'sakuraPetal') {
        pt.x += (pt.vx + Math.sin(this.worldTime * 5 + pt.phase) * 14) * dt
        pt.y += pt.vy * dt
      } else {
        pt.x += pt.vx * dt
        pt.y += pt.vy * dt
      }
    }
  }

  private renderCosmeticTrailParticles(ctx: CanvasRenderingContext2D): void {
    const p = this.player
    const liftY = this.screen === 'title' ? this.campHopOffset : 0

    // Accessibility: when reduceMotion is active, draw only a minimal slow-pulse stationary shimmer glint
    if (this.progress.reduceMotion) {
      const hasBiomeCosmetic =
        this.progress.selectedHat === 'beret-starlight' ||
        this.progress.selectedCape === 'cape-sakura-petal' ||
        this.progress.selectedCape === 'wings-cloud-pastel' ||
        this.progress.selectedScarf === 'lantern-gold'
      if (!hasBiomeCosmetic) return
      const pulse = 0.25 + (Math.sin(this.worldTime * 2.0) * 0.5 + 0.5) * 0.55
      ctx.save()
      ctx.globalAlpha = pulse
      if (this.progress.selectedHat === 'beret-starlight') {
        const hx = Math.round(p.x + p.w / 2 + p.facing * 2)
        const hy = Math.round(p.y - 3 - liftY)
        ctx.fillStyle = '#ffe885'
        ctx.fillRect(hx, hy - 1, 1, 3)
        ctx.fillRect(hx - 1, hy, 3, 1)
      }
      if (this.progress.selectedCape === 'cape-sakura-petal') {
        ctx.fillStyle = '#ffb8dc'
        ctx.fillRect(Math.round(p.x + p.w / 2 - p.facing * 5), Math.round(p.y + 7 - liftY), 2, 2)
      }
      if (this.progress.selectedCape === 'wings-cloud-pastel') {
        ctx.fillStyle = '#e8f7ff'
        ctx.fillRect(Math.round(p.x + p.w / 2 - p.facing * 5), Math.round(p.y + 6 - liftY), 2, 2)
      }
      if (this.progress.selectedScarf === 'lantern-gold') {
        ctx.fillStyle = '#ffcf54'
        ctx.fillRect(Math.round(p.x + p.w / 2 - p.facing * 4), Math.round(p.y + 8 - liftY), 2, 2)
      }
      ctx.restore()
      return
    }

    if (this.cosmeticParticles.length === 0) return
    ctx.save()
    for (const pt of this.cosmeticParticles) {
      const alpha = Math.max(0, Math.min(1, pt.life / pt.maxLife))
      const px = Math.round(pt.x)
      const py = Math.round(pt.y)
      ctx.globalAlpha = alpha
      ctx.fillStyle = pt.color
      if (pt.kind === 'starlightGlint' && pt.cross) {
        // Crisp 3x3 pixel cross sparkle
        ctx.fillRect(px, py - 1, 1, 3)
        ctx.fillRect(px - 1, py, 3, 1)
      } else if (pt.kind === 'sakuraPetal') {
        // Soft 2x3 pixel sakura petal
        ctx.fillRect(px, py, 2, 3)
      } else {
        ctx.fillRect(px, py, pt.size, pt.size)
      }
    }
    ctx.restore()
  }

  private renderShards(ctx: CanvasRenderingContext2D): void {
    for (const sh of this.shards) {
      if (sh.collected) continue
      const x = Math.round(sh.x)
      const bobAmp = this.progress.reduceMotion ? 1 : 2
      const y = Math.round(sh.y + Math.sin(this.worldTime * 2.1 + sh.phase) * bobAmp)

      ctx.save()
      // Already-collected shards appear translucent/ghosted on replays!
      if (sh.previouslyCollected) {
        ctx.globalAlpha = 0.36
      }

      if (this.isModern && !sh.previouslyCollected) {
        this.drawCircularGlow(
          ctx,
          x + 6,
          y + 7,
          13,
          'rgba(162, 236, 255, 0.32)',
          'rgba(216, 178, 255, 0.12)',
          'rgba(216, 178, 255, 0)'
        )
      }

      // Crisp 10x12 pixel Starlight Shard crystal diamond
      ctx.fillStyle = '#1d1236'
      ctx.fillRect(x + 4, y, 4, 1)
      ctx.fillRect(x + 3, y + 1, 6, 2)
      ctx.fillRect(x + 2, y + 3, 8, 6)
      ctx.fillRect(x + 3, y + 9, 6, 2)
      ctx.fillRect(x + 4, y + 11, 4, 1)

      ctx.fillStyle = '#74d9ff'
      ctx.fillRect(x + 5, y + 1, 2, 10)
      ctx.fillRect(x + 4, y + 2, 4, 8)
      ctx.fillRect(x + 3, y + 4, 6, 4)

      ctx.fillStyle = '#d6f8ff'
      ctx.fillRect(x + 4, y + 3, 2, 5)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x + 4, y + 3, 1, 2)

      // Gentle orbiting pixel sparkle glint
      if (!sh.previouslyCollected && Math.floor(this.worldTime * 4 + sh.phase) % 2 === 0) {
        ctx.fillStyle = '#fff5b8'
        ctx.fillRect(x + 1, y + 1, 1, 1)
        ctx.fillRect(x + 10, y + 9, 1, 1)
      }
      ctx.restore()
    }
  }

  private renderTitleCampProps(ctx: CanvasRenderingContext2D): void {
    // Cozy starlit rooftop resting cushion & warm lantern beside the Title Camp character
    const rx = Math.round(this.player.x - 4)
    const ry = Math.round(this.player.y + this.player.h)
    // Cozy stitched pixel cushion
    ctx.fillStyle = '#241038'
    ctx.fillRect(rx - 1, ry - 2, 22, 4)
    ctx.fillStyle = '#b54c7a'
    ctx.fillRect(rx, ry - 1, 20, 2)
    ctx.fillStyle = '#ff9ec4'
    ctx.fillRect(rx + 2, ry - 1, 16, 1)

    // Warm mini camp lantern right beside the resting spot
    const lx = rx + 24
    const ly = ry - 8
    if (this.isModern) {
      this.drawCircularGlow(
        ctx,
        lx + 3,
        ly + 4,
        18,
        'rgba(255, 222, 130, 0.28)',
        'rgba(255, 164, 92, 0.1)',
        'rgba(255, 164, 92, 0)'
      )
    }
    ctx.fillStyle = '#241038'
    ctx.fillRect(lx, ly, 6, 8)
    ctx.fillStyle = '#ffbf59'
    ctx.fillRect(lx + 1, ly + 2, 4, 4)
    ctx.fillStyle = '#fff8c9'
    ctx.fillRect(lx + 2, ly + 3, 2, 2)
    ctx.fillStyle = '#5c3c7a'
    ctx.fillRect(lx + 1, ly + 1, 4, 1)
    ctx.fillRect(lx + 1, ly + 6, 4, 1)
  }

  private renderPhotoModePostcardFrame(ctx: CanvasRenderingContext2D): void {
    const biome = BIOMES[this.level.biome]
    // Crisp retro pixel double border around the 384x216 frame
    ctx.fillStyle = 'rgba(18, 9, 34, 0.88)'
    ctx.fillRect(0, 0, this.viewW, 14)
    ctx.fillRect(0, VIEW_H - 16, this.viewW, 16)
    ctx.fillRect(0, 0, 6, VIEW_H)
    ctx.fillRect(this.viewW - 6, 0, 6, VIEW_H)

    ctx.strokeStyle = '#ffe082'
    ctx.lineWidth = 1
    ctx.strokeRect(5.5, 5.5, this.viewW - 11, VIEW_H - 11)
    ctx.strokeStyle = '#ff9ec4'
    ctx.strokeRect(7.5, 13.5, this.viewW - 15, VIEW_H - 29)

    // Header: STARLIGHT STRAY logo + Biome English Name in crisp bitmap pixel font
    drawPixelText(ctx, 'STARLIGHT STRAY', 12, 3, '#ffe885', { scale: 1, shadowColor: '#1a0b28' })
    const biomeLabel = biome.englishName.toUpperCase()
    const bw = measurePixelText(biomeLabel, 1)
    drawPixelText(ctx, biomeLabel, this.viewW - 12 - bw, VIEW_H - 12, '#d8f6ff', { scale: 1, shadowColor: '#1a0b28' })
    drawPixelText(ctx, `LVL ${this.level.id}`, 12, VIEW_H - 12, '#ffb8dc', { scale: 1, shadowColor: '#1a0b28' })
  }

  private renderPlayer(ctx: CanvasRenderingContext2D): void {
    const p = this.player
    const dirBank = p.facing === 1 ? this.playerSprites.right : this.playerSprites.left
    let sprite: HTMLCanvasElement

    const softHurtTintActive = p.invincibleTimer > 0 && Math.floor(p.invincibleTimer * 5) % 2 === 0

    if (this.screen === 'photoMode') {
      if (this.photoModePose === 'happyHop') {
        sprite = dirBank.jumpUp
      } else if (this.photoModePose === 'sitting') {
        sprite = dirBank.sit0
      } else if (this.photoModePose === 'lookingAtStars') {
        sprite = dirBank.idleSpecial
      } else {
        sprite = dirBank.idle0
      }
    } else if (
      this.screen === 'title' ||
      this.screen === 'characters' ||
      this.screen === 'shop' ||
      this.screen === 'levelSelect' ||
      this.screen === 'achievements' ||
      this.screen === 'settings'
    ) {
      if (this.screen === 'title' && this.campReaction === 'hop') {
        sprite = dirBank.jumpUp
      } else if (this.screen === 'title' && this.campReaction === 'nap') {
        sprite = dirBank.sitBlink
      } else {
        sprite = p.blinkTimer <= 0 ? dirBank.sitBlink : dirBank.sit0
      }
    } else if (p.dashTimer > 0) {
      sprite = dirBank.dash
    } else if (!p.onGround) {
      sprite = p.vy < 0 ? dirBank.jumpUp : dirBank.jumpFall
    } else if (this.landingTimer > 0 && this.progress.graphicsStyle === 'modern') {
      sprite = dirBank.land
    } else if (Math.abs(p.vx) > 8) {
      const runFrames =
        this.progress.graphicsStyle === 'modern'
          ? [dirBank.run0, dirBank.run3, dirBank.run1, dirBank.run4, dirBank.run2]
          : [dirBank.run0, dirBank.run1, dirBank.run2]
      const rate = this.progress.graphicsStyle === 'modern' ? 12 : 10
      const idx = Math.floor(p.animTimer * rate) % runFrames.length
      sprite = runFrames[idx]!
    } else if (p.blinkTimer <= 0) {
      sprite = dirBank.idleBlink
    } else if (p.idleDuration > 2.0) {
      sprite = Math.floor(p.animTimer * 2.2) % 2 === 0 ? dirBank.idleSpecial : dirBank.idle0
    } else {
      sprite = Math.floor(p.animTimer * 2.0) % 2 === 0 ? dirBank.idle0 : dirBank.idle1
    }

    // Enlarged ~1.67x closer camp framing on Home screens (40x40 px), 1.35x Golden Mooncake in-level (32x32 px)
    const isHomeStage =
      this.screen === 'title' ||
      this.screen === 'characters' ||
      this.screen === 'shop' ||
      this.screen === 'levelSelect' ||
      this.screen === 'achievements' ||
      this.screen === 'photoStudio' ||
      this.screen === 'guidebook' ||
      this.screen === 'settings'
    const isGiant = p.mooncakeTimer > 0 && this.screen === 'playing'
    const drawSize = isHomeStage ? 40 : isGiant ? Math.round(24 * 1.35) : 24
    const campLift = this.screen === 'title' ? this.campHopOffset : this.screen === 'photoMode' && this.photoModePose === 'happyHop' ? 5 : 0
    const drawX = isHomeStage
      ? Math.round(p.x + p.w / 2 - drawSize / 2)
      : isGiant
        ? Math.round(p.x - 10)
        : Math.round(p.x - 6)
    const drawY = (isHomeStage
      ? Math.round(p.y + p.h - drawSize + 3)
      : isGiant
        ? Math.round(p.y - 15)
        : Math.round(p.y - 7)) - campLift
    const centerX = Math.round(p.x + p.w / 2)
    const centerY = isHomeStage
      ? Math.round(p.y + p.h - 18 - campLift)
      : isGiant
        ? Math.round(p.y + p.h / 2 - 4)
        : Math.round(p.y + p.h / 2)

    // Modern 16-Bit gentle moonlight rim aura behind the character (both Title Screen & in-level!)
    if (this.isModern) {
      this.drawCircularGlow(
        ctx,
        centerX,
        centerY,
        isHomeStage ? 28 : isGiant ? 23 : 17,
        'rgba(255, 244, 198, 0.22)',
        'rgba(255, 192, 226, 0.08)',
        'rgba(255, 192, 226, 0)'
      )
    }

    // Moonlit Pearl soft blue-silver aquatic glow
    if (p.pearlTimer > 0 && this.screen === 'playing') {
      this.drawCircularGlow(
        ctx,
        centerX,
        centerY + 2,
        18,
        'rgba(186, 240, 255, 0.28)',
        'rgba(130, 200, 240, 0.10)',
        'rgba(130, 200, 240, 0)'
      )
    }

    // Golden Mooncake warm golden halo
    if (isGiant) {
      this.drawCircularGlow(
        ctx,
        centerX,
        centerY,
        21,
        'rgba(255, 228, 128, 0.26)',
        'rgba(255, 190, 72, 0.08)',
        'rgba(255, 190, 72, 0)'
      )
    }

    // Golden Bell Magnet thin golden aura ring around character
    if (p.magnetTimer > 0 && this.screen === 'playing') {
      const ringAlpha = 0.42 + Math.sin(this.worldTime * 3.0) * 0.14
      ctx.strokeStyle = `rgba(255, 224, 102, ${ringAlpha.toFixed(2)})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(centerX, centerY, isGiant ? 21 : 17, 0, Math.PI * 2)
      ctx.stroke()
    }

    if (p.onGround && p.dashTimer <= 0) {
      ctx.fillStyle = 'rgba(12, 6, 28, 0.4)'
      ctx.fillRect(Math.round(p.x - (isGiant ? 2 : 0)), Math.round(p.y + p.h - 1), p.w + (isGiant ? 4 : 0), 2)
    }

    if (softHurtTintActive) {
      ctx.globalAlpha = 0.85
      ctx.drawImage(dirBank.hurtTint, drawX, drawY, drawSize, drawSize)
      ctx.globalAlpha = 1
    } else {
      ctx.drawImage(sprite, drawX, drawY, drawSize, drawSize)
    }

    // Sakura Mochi: 4 slow calmly orbiting pink sakura petals around character!
    if (p.mochiTimer > 0 && this.screen === 'playing') {
      for (let i = 0; i < 4; i++) {
        const ang = this.worldTime * 1.8 + (Math.PI * 2 * i) / 4
        const ox = Math.round(centerX + Math.cos(ang) * 14)
        const oy = Math.round(centerY + Math.sin(ang) * 10)
        ctx.fillStyle = i % 2 === 0 ? '#ffb5d8' : '#ffe3f0'
        ctx.fillRect(ox, oy, 2, 2)
      }
    }

    // Moon Bubble Shield wrapping the character in translucent pastel blue
    if (p.hasBubbleShield && this.screen === 'playing') {
      const r = isGiant ? 17 : 13
      ctx.fillStyle = 'rgba(135, 212, 255, 0.18)'
      ctx.beginPath()
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = 'rgba(196, 238, 255, 0.72)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = 'rgba(255, 255, 255, 0.82)'
      ctx.fillRect(centerX - 6, centerY - 8, 3, 2)
      ctx.fillRect(centerX - 8, centerY - 6, 2, 2)
    }

    // Polar Bear Passive: Frost Shield crystalline aura!
    if (p.hasFrostShield && this.screen === 'playing') {
      const r = isGiant ? 18 : 14
      ctx.strokeStyle = 'rgba(130, 245, 255, 0.85)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = '#e0ffff'
      ctx.fillRect(centerX - 1, centerY - r - 2, 2, 4)
      ctx.fillRect(centerX - 1, centerY + r - 2, 2, 4)
    }

    // Boss Combat Skill: Astral Aegis protective barrier!
    if (p.astralAegisTimer > 0 && this.screen === 'playing') {
      const r = isGiant ? 20 : 16
      ctx.fillStyle = 'rgba(138, 224, 255, 0.24)'
      ctx.beginPath()
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ffe875'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Contextual / Manual In-Game Pixel Emote Speech Bubble above Player!
    if (this.screen === 'playing' && this.playerEmoteTimer > 0 && this.playerEmote !== 'none') {
      const floatY = this.progress.reduceMotion ? 0 : Math.round(Math.sin(this.worldTime * 5) * 1.5)
      drawPixelEmoteBubble(ctx, centerX, Math.round(p.y - 20 + floatY), this.playerEmote)
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    for (const pt of this.particles) {
      const alpha = Math.max(0, Math.min(1, pt.life / pt.maxLife))
      ctx.globalAlpha = pt.kind === 'ambient' || pt.kind === 'petal' ? alpha * 0.85 : alpha
      ctx.fillStyle = pt.color
      const x = Math.round(pt.x)
      const y = Math.round(pt.y)
      if ((pt.kind === 'star' || pt.kind === 'glint') && pt.size >= 3) {
        ctx.fillRect(x, y - 1, 1, 3)
        ctx.fillRect(x - 1, y, 3, 1)
      } else {
        ctx.fillRect(x, y, pt.size, pt.size)
      }
    }
    ctx.globalAlpha = 1
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D): void {
    ctx.font = 'bold 7.5px "Silkscreen", "Courier New", monospace'
    ctx.textAlign = 'center'
    for (const ft of this.floatingTexts) {
      const alpha = Math.max(0, Math.min(1, ft.life / ft.maxLife))
      ctx.globalAlpha = alpha
      const x = Math.round(ft.x)
      const y = Math.round(ft.y)
      ctx.fillStyle = '#140926'
      ctx.fillText(ft.text, x + 1, y + 1)
      ctx.fillStyle = ft.color
      ctx.fillText(ft.text, x, y)
    }
    ctx.globalAlpha = 1
  }

  // ============================================================================
  // HUD SNAPSHOT EMITTER
  // ============================================================================

  private emitHud(): void {
    const starsCollected = this.collectibles.filter((c) => c.kind === 'star' && c.collected).length
    const totalStars = this.collectibles.filter((c) => c.kind === 'star').length
    const fishCollected = this.collectibles.filter((c) => c.kind === 'fish' && c.collected).length
    const totalFish = this.collectibles.filter((c) => c.kind === 'fish').length

    const dashReady = this.isDashReady()
    const dashCharge =
      this.player.candyTimer > 0
        ? 1
        : this.player.dashCooldownTimer > 0
          ? Math.max(0, Math.min(1, 1 - this.player.dashCooldownTimer / DASH_COOLDOWN))
          : this.player.airDashUsed && !this.player.onGround
            ? 0
            : 1

    const ttTargets = getTimeTrialTargets(this.level.id)
    this.onHudUpdate({
      screen: this.screen,
      levelId: this.level.id,
      levelName: this.level.name,
      biome: this.level.biome,
      hearts: this.player.hearts,
      maxHearts: this.player.maxHearts,
      score: this.totalRunScore,
      levelScore: this.levelScore,
      starsCollected,
      totalStars,
      fishCollected,
      totalFish,
      stageRating: this.lastStageRating,
      justEarnedThreeStarBonus: this.justEarnedThreeStarBonus,
      isTimeTrial: this.isTimeTrial,
      timeTrialElapsedMs: this.timeTrialElapsedMs,
      timeTrialGoldMs: ttTargets.goldMs,
      timeTrialSilverMs: ttTargets.silverMs,
      timeTrialBronzeMs: ttTargets.bronzeMs,
      lastTimeTrialMedal: this.lastTimeTrialMedal,
      isNewTimeRecord: this.isNewTimeRecord,
      runElapsedMs: this.runElapsedMs,
      lastSpeedrunRank: this.lastSpeedrunRank,
      isNewBestTime: this.isNewBestTime,
      lastRankRewardBreakdown: this.lastRankRewardBreakdown,
      lastRankRewardTotal: this.lastRankRewardTotal,
      lastCoinBreakdown: { ...this.lastCoinBreakdown },
      celebrationCharId: this.celebrationCharId,
      showSpeedrunTimer: this.progress.showSpeedrunTimer,
      shardsCollected: this.shards.filter((s) => s.collected || s.previouslyCollected).length,
      shardStatus: [
        Boolean(this.shards.find((s) => s.index === 0)?.collected || this.shards.find((s) => s.index === 0)?.previouslyCollected),
        Boolean(this.shards.find((s) => s.index === 1)?.collected || this.shards.find((s) => s.index === 1)?.previouslyCollected),
        Boolean(this.shards.find((s) => s.index === 2)?.collected || this.shards.find((s) => s.index === 2)?.previouslyCollected)
      ],
      photoModePose: this.photoModePose,
      photoModeFrame: this.photoModeFrame,
      homeBiome: this.getActiveHomeBiome(),
      homeBackdropMode: this.progress.homeBackdropMode,
      hasUnseenStamps: this.progress.hasUnseenStamps,
      highScore: this.progress.highScore,
      fishBank: this.progress.fishBank,
      unlockedLevel: this.progress.unlockedLevel,
      selectedCharacter: this.progress.selectedCharacter,
      selectedScarf: this.progress.selectedScarf,
      selectedHat: this.progress.selectedHat,
      selectedCape: this.progress.selectedCape,
      selectedHeadAcc: this.progress.selectedHeadAcc,
      selectedFaceAcc: this.progress.selectedFaceAcc,
      graphicsStyle: this.progress.graphicsStyle,
      touchControlsMode: this.progress.touchControlsMode,
      checkpointReached: this.activeCheckpointIdx >= 0,
      starComboCount: this.starComboCount,
      starComboTimer: this.starComboTimer,
      starComboMax:
        this.progress.selectedCharacter === 'cat-calico'
          ? STAR_COMBO_WINDOW * 1.35
          : STAR_COMBO_WINDOW,
      starRingActive: this.starRingState === 'active',
      starRingCollected: this.starRingStars.filter((s) => s.collected).length,
      starRingTotal: this.starRingStars.length || 8,
      starRingTimer: this.starRingState === 'active' ? this.starRingTimer : 0,
      nightEvent: this.nightEvent,
      nightEventBanner:
        this.nightEventBannerTimer > 0 && this.screen === 'playing'
          ? this.nightEvent === 'meteorShower'
            ? '🌠 PERISTIWA LANGKA: HUJAN BINTANG JATUH! Tangkap bintang jatuh di tengah map!'
            : this.nightEvent === 'pinkMoon'
              ? '🌸 PERISTIWA LANGKA: BULAN PURNAMA MERAH MUDA! Semua poin bintang +25%!'
              : null
          : null,
      meteorShowerActive: this.meteorShowerTimer > 0,
      meteorShowerTimer: this.meteorShowerTimer,
      isMuted: this.audio.isMuted(),
      dashReady,
      dashCharge,
      isDashing: this.player.dashTimer > 0,
      featherTimer: this.player.featherTimer,
      featherMax: FEATHER_DURATION,
      magnetTimer: this.player.magnetTimer,
      magnetMax: MAGNET_DURATION,
      hasBubbleShield: this.player.hasBubbleShield,
      hasFrostShield: this.player.hasFrostShield,
      mooncakeTimer: this.player.mooncakeTimer,
      mooncakeMax: MOONCAKE_DURATION,
      yarnTimer: this.player.yarnTimer,
      yarnMax: YARN_DURATION,
      mochiTimer: this.player.mochiTimer,
      mochiMax: MOCHI_DURATION,
      candyTimer: this.player.candyTimer,
      candyMax: CANDY_DURATION,
      pearlTimer: this.player.pearlTimer,
      pearlMax: PEARL_DURATION * this.getBuffDurationMultiplier(),
      crystalElixirTimer: this.player.crystalElixirTimer,
      crystalElixirMax: CRYSTAL_ELIXIR_DURATION * this.getBuffDurationMultiplier(),
      chronoGearTimer: this.player.chronoGearTimer,
      chronoGearMax: CHRONO_GEAR_DURATION * this.getBuffDurationMultiplier(),
      eclipseShardTimer: this.player.eclipseShardTimer,
      eclipseShardMax: ECLIPSE_SHARD_DURATION * this.getBuffDurationMultiplier(),
      cometChargeTimer: this.player.cometChargeTimer,
      cometChargeMax: 6.0 * this.getBuffDurationMultiplier(),
      moonlightFeatherTimer: this.player.moonlightFeatherTimer,
      moonlightFeatherMax: 10.0 * this.getBuffDurationMultiplier(),
      isBossStage: Boolean(this.bossController),
      bossActive: Boolean(this.bossController?.active),
      bossDefeated: Boolean(this.bossController?.defeated),
      bossName: this.bossController?.config.name ?? '',
      bossSubtitle: this.bossController?.config.subtitle ?? '',
      bossHp: this.bossController?.hp ?? 0,
      bossMaxHp: this.bossController?.maxHp ?? 1,
      bossPhase: this.bossController?.phase ?? 1,
      bossCoreExposed: Boolean(this.bossController?.coreExposed),
      pulseReady: this.player.cometChargeTimer > 0 || this.player.starlightPulseCooldown <= 0,
      pulseCharge:
        this.player.cometChargeTimer > 0
          ? 1
          : Math.max(0, Math.min(1, 1 - this.player.starlightPulseCooldown / 1.2)),
      aegisReady: this.player.astralAegisCooldown <= 0,
      aegisCharge: Math.max(0, Math.min(1, 1 - this.player.astralAegisCooldown / 5.0)),
      aegisActive: this.player.astralAegisTimer > 0,
      novaReady: this.player.starfallNovaCooldown <= 0,
      novaCharge: Math.max(
        0,
        Math.min(1, 1 - this.player.starfallNovaCooldown / STARFALL_NOVA_COOLDOWN)
      ),
      mendReady: this.player.lunarMendUsesLeft > 0 && this.player.lunarMendCooldown <= 0,
      mendCharge:
        this.player.lunarMendUsesLeft <= 0
          ? 0
          : Math.max(0, Math.min(1, 1 - this.player.lunarMendCooldown / LUNAR_MEND_COOLDOWN)),
      mendUsesLeft: this.player.lunarMendUsesLeft,
      hurtPulseCount: this.hurtPulseCount,
      recentToast: this.recentToast,
      autoSavePulse: this.autoSavePulse
    })
  }
}
