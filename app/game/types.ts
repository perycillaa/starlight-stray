export type GameScreen =
  | 'title'
  | 'levelSelect'
  | 'characters'
  | 'shop'
  | 'achievements'
  | 'photoStudio'
  | 'photoMode'
  | 'guidebook'
  | 'settings'
  | 'playing'
  | 'paused'
  | 'levelClear'
  | 'gameOver'
  | 'victory'

export type PostcardPoseId = 'sit' | 'jump' | 'sleep' | 'wave'

export type PhotoModePose = 'idle' | 'happyHop' | 'sitting' | 'lookingAtStars'

export type SpeedrunRank = 'S' | 'A' | 'B' | 'C'

export type RankRewardTier = 'B' | 'A' | 'S'

export interface ClaimedRankRewards {
  B?: boolean
  A?: boolean
  S?: boolean
}

export interface RankRewardBreakdownItem {
  rank: RankRewardTier
  coins: number
}

export type ShardTuple = [boolean, boolean, boolean]

export interface ShardDef {
  index: 0 | 1 | 2
  x: number
  y: number
}

export interface ShardState extends ShardDef {
  collected: boolean
  previouslyCollected: boolean
  phase: number
}

export type DailyQuestId =
  | 'stars-sakura'
  | 'stars-rooftops'
  | 'clear-2-levels'
  | 'no-hit-clear'
  | 'dash-10'
  | 'collect-fish-4'
  | 'stars-any-20'
  | 'powerup-3'
  | 'collect-shard-1'

export interface DailyQuestDef {
  id: DailyQuestId
  title: string
  icon: string
  target: number
  rewardFish: number
}

export interface DailyQuestState {
  dateKey: string
  questId: DailyQuestId
  progress: number
  claimed: boolean
}

export interface DailyMissionSlot {
  questId: DailyQuestId
  progress: number
  claimed: boolean
}

export interface DailyMissionsState {
  dateKey: string
  missions: [DailyMissionSlot, DailyMissionSlot, DailyMissionSlot]
  bonusClaimed: boolean
}

export type TimeTrialMedal = 'none' | 'bronze' | 'silver' | 'gold'

export interface TimeTrialRecord {
  bestTimeMs: number
  medal: TimeTrialMedal
}

export type BiomeId =
  | 'rooftops'
  | 'sakura'
  | 'cloudland'
  | 'harbor'
  | 'cavern'
  | 'observatory'
  | 'eclipse'
  | 'citadel'

export type MainBiomeId = 'rooftops' | 'sakura' | 'cloudland' | 'harbor' | 'cavern' | 'observatory'

export type HomeBackdropMode = 'auto' | MainBiomeId

export type GraphicsStyle = 'classic' | 'modern'

export type TouchControlsMode = 'auto' | 'on' | 'off'

export interface BiomeMeta {
  id: BiomeId
  name: string
  englishName: string
  icon: string
  badgeBg: string
  badgeBorder: string
}

export type CharacterId =
  | 'cat-mochi'
  | 'cat-calico'
  | 'cat-ginger'
  | 'cat-midnight'
  | 'cat-blue'
  | 'bunny-starlight'
  | 'dog-samoyed'
  | 'dog-shiba'
  | 'bear-black'
  | 'bear-sun'
  | 'bear-polar'
  | 'fox-brown'
  | 'fox-kitsune'

export type AnimalSpecies = 'cat' | 'bunny' | 'samoyed' | 'shiba' | 'bear' | 'fox'

export type ScarfColorId = 'pink' | 'sky' | 'gold' | 'purple' | 'mint' | 'ruby' | 'lightning' | 'lantern-gold'

export type HatModel = 'none' | 'beret' | 'witch' | 'clip' | 'crown' | 'clockwork'

export type HatId =
  | 'none'
  | 'beret-pink'
  | 'beret-sky'
  | 'beret-cream'
  | 'beret-starlight'
  | 'witch-purple'
  | 'witch-blackgold'
  | 'witch-starblue'
  | 'clip-sprout'
  | 'clip-sakura'
  | 'crown-gold'
  | 'crown-silver'
  | 'hat-astral-clockwork'

export type CapeModel = 'none' | 'cloak' | 'royal' | 'wings' | 'crystal' | 'nebula'

export type CapeId =
  | 'none'
  | 'cloak-navy'
  | 'cloak-emerald'
  | 'cloak-brown'
  | 'royal-maroon'
  | 'royal-purple'
  | 'wings-pink'
  | 'wings-crystal'
  | 'cape-sakura-petal'
  | 'wings-cloud-pastel'
  | 'cape-crystal-glow'
  | 'cape-nebula-sovereign'

export type HeadAccModel = 'none' | 'sprout' | 'sakura' | 'antlers' | 'headphones' | 'starlightCrown' | 'halo'

export type HeadAccId =
  | 'none'
  | 'sprout-green'
  | 'sprout-gold'
  | 'sakura-pink'
  | 'sakura-white'
  | 'antlers-warm'
  | 'antlers-frost'
  | 'headphones-lofi'
  | 'headphones-mint'
  | 'crown-starlight'
  | 'crown-moon'
  | 'halo-eclipse'

export type FaceAccModel = 'none' | 'eyepatch' | 'glasses' | 'bandage'

export type FaceAccId =
  | 'none'
  | 'eyepatch-gold'
  | 'eyepatch-crimson'
  | 'glasses-round'
  | 'glasses-gold'
  | 'bandage-star'
  | 'bandage-pink'

export type BiomeCosmeticJumpKind =
  | 'beret-starlight'
  | 'cape-sakura-petal'
  | 'wings-cloud-pastel'
  | 'lantern-gold'
  | 'cape-crystal-glow'
  | 'hat-astral-clockwork'
  | 'cape-nebula-sovereign'

export interface CosmeticTrailParticle {
  kind:
    | 'starlightGlint'
    | 'sakuraPetal'
    | 'cloudPuff'
    | 'lanternEmber'
    | 'crystalShard'
    | 'clockworkSpark'
    | 'nebulaSwirl'
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  phase: number
  cross?: boolean
}

export type CharacterUnlockMode = 'regular' | 'mission'

export interface CharacterDef {
  id: CharacterId
  name: string
  species: AnimalSpecies
  category: 'Kucing' | 'Kelinci' | 'Anjing' | 'Beruang' | 'Rubah'
  description: string
  perkTitle: string
  perkDesc: string
  unlockMode: CharacterUnlockMode
  /** Fish cost for regular characters (0 for free default / mission characters) */
  cost: number
  /** Short mission description for special characters */
  missionTitle?: string
  missionDesc?: string
}

export type NightEventKind = 'none' | 'meteorShower' | 'pinkMoon'

export interface StarRingBellDef {
  x: number
  y: number
}

export interface StarRingStar {
  x: number
  y: number
  collected: boolean
  phase: number
}

export interface FallingEventStar {
  x: number
  y: number
  vx: number
  vy: number
  phase: number
  collected: boolean
}

export interface MissionProgressInfo {
  completed: boolean
  current: number
  target: number
  label: string
}

export interface ScarfColorDef {
  id: ScarfColorId
  name: string
  cost: number
  main: string
  dark: string
  light: string
  ghost: string
  spark: string
  swatch: string
  /** If set, unlocked automatically upon earning this Stamp Book achievement */
  unlockStampId?: AchievementId
  /** If set, unlocked automatically upon collecting all 6 Starlight Shards in this biome */
  shardUnlockBiome?: BiomeId
}

export interface HatDef {
  id: HatId
  model: HatModel
  groupName: string
  colorName: string
  name: string
  cost: number
  primary: string
  secondary: string
  accent: string
  outline: string
  swatch: string
  /** If set, unlocked automatically upon collecting all 6 Starlight Shards in this biome */
  shardUnlockBiome?: BiomeId
}

export interface CapeDef {
  id: CapeId
  model: CapeModel
  groupName: string
  colorName: string
  name: string
  cost: number
  primary: string
  secondary: string
  accent: string
  outline: string
  swatch: string
  /** If set, unlocked automatically upon collecting 6 Starlight Shards in this biome */
  shardUnlockBiome?: MainBiomeId
  /** If set, unlocked automatically upon defeating this Boss Level (e.g. 14) */
  bossUnlockLevelId?: number
}

export interface HeadAccDef {
  id: HeadAccId
  model: HeadAccModel
  groupName: string
  colorName: string
  name: string
  cost: number
  primary: string
  secondary: string
  accent: string
  outline: string
  swatch: string
  /** If set, unlocked automatically upon defeating this Boss Level (e.g. 13) */
  bossUnlockLevelId?: number
}

export interface FaceAccDef {
  id: FaceAccId
  model: FaceAccModel
  groupName: string
  colorName: string
  name: string
  cost: number
  primary: string
  secondary: string
  accent: string
  outline: string
  swatch: string
}

export type AchievementId =
  | 'first-step'
  | 'rooftop-sprinter'
  | 'biome-explorer'
  | 'starlight-collector'
  | 'fashionista-stray'
  | 'full-squad'
  | 'pacifist-run'
  | 'nine-lives'
  | 'swift-paws'
  | 'starlight-speedster'
  | 'lightning-stray'
  | 'eclipse-conqueror'
  | 'starlight-legend'
  | 'fish-collector'
  | 'dash-master'
  | 'all-friends'
  | 'world-explorer'
  | 'perfect-stars'

export interface AchievementDef {
  id: AchievementId
  name: string
  subtitle: string
  icon: string
  description: string
  rewardFish: number
  stampColor: string
  rewardCosmeticLabel?: string
}

export interface ToastNotice {
  icon: string
  label: string
  title: string
}

export type PlatformStyle =
  | 'brick'
  | 'wood'
  | 'sakura'
  | 'cloud'
  | 'harbor'
  | 'cavern'
  | 'observatory'
  | 'eclipse'
  | 'citadel'

export interface StaticPlatform {
  x: number
  y: number
  w: number
  h: number
  style: PlatformStyle
  chimneys?: number[]
}

export interface MovingPlatformDef {
  x: number
  y: number
  w: number
  h: number
  dx: number
  dy: number
  speed: number
  phase?: number
}

export interface MovingPlatformState extends MovingPlatformDef {
  curX: number
  curY: number
  prevX: number
  prevY: number
  time: number
}

export interface BounceCloudDef {
  x: number
  y: number
  w: number
}

export interface BounceCloudState extends BounceCloudDef {
  squishTimer: number
}

export interface CheckpointDef {
  x: number
  y: number
}

export interface CheckpointState extends CheckpointDef {
  activated: boolean
}

export interface NpcDef {
  x: number
  y: number
  name: string
  kind: 'owl' | 'kitten' | 'bunny'
  lines: [string, string]
}

export interface TutorialSignDef {
  x: number
  y: number
  topText: string
  bottomText: string
}

export type CollectibleKind = 'star' | 'fish' | 'bigStar'

export interface SecretAlcoveDef {
  x: number
  y: number
  w: number
  h: number
  kind: 'chimney' | 'canopy' | 'cloud' | 'sail' | 'crystal' | 'gear'
}

export interface SecretAlcoveState extends SecretAlcoveDef {
  alpha: number
  discovered: boolean
}

export interface SteamVentDef {
  x: number
  y: number
  period: number
  offset?: number
}

export interface SteamVentState extends SteamVentDef {
  timer: number
  phase: 'calm' | 'warn' | 'active'
}

export interface HedgehogDef {
  x: number
  y: number
  minX: number
  maxX: number
  speed: number
}

export interface HedgehogState extends HedgehogDef {
  curX: number
  facing: 1 | -1
  defeated: boolean
}

export interface WindVortexDef {
  x: number
  y: number
  w: number
  h: number
  pushX: number
}

export interface StormCloudDef {
  x: number
  y: number
  period: number
  offset?: number
}

export interface StormCloudState extends StormCloudDef {
  timer: number
  phase: 'calm' | 'warn' | 'zap'
}

export interface SwoopCrowDef {
  x: number
  y: number
  dir: 1 | -1
}

export interface SwoopCrowState extends SwoopCrowDef {
  curX: number
  curY: number
  state: 'hover' | 'warn' | 'swoop' | 'recover'
  stateTimer: number
  defeated: boolean
}

export interface CrabDef {
  x: number
  y: number
  minX: number
  maxX: number
  speed: number
}

export interface CrabState extends CrabDef {
  curX: number
  curY: number
  vy: number
  facing: 1 | -1
  hopCooldown: number
  defeated: boolean
}

export interface WispDef {
  x: number
  y: number
  ampY: number
  speed: number
  phase?: number
}

export interface WispState extends WispDef {
  curY: number
  time: number
  defeated: boolean
}

export interface PowerWireDef {
  x: number
  y: number
  w: number
}

export interface PowerWireState extends PowerWireDef {
  sag: number
  sagVel: number
}

export interface FragileBranchDef {
  x: number
  y: number
  w: number
}

export interface FragileBranchState extends FragileBranchDef {
  curY: number
  state: 'solid' | 'shaking' | 'falling' | 'gone'
  timer: number
}

export interface FloatingBoatDef {
  x: number
  y: number
  w: number
  dx: number
  speed: number
  phase?: number
}

export interface FloatingBoatState extends FloatingBoatDef {
  curX: number
  curY: number
  prevX: number
  prevY: number
  time: number
}

// ============================================================================
// BIOME-SPECIFIC ENVIRONMENTAL MECHANICS (Biomes 1–6)
// ============================================================================

export interface UpdraftVentDef {
  x: number
  y: number
  w: number
  h: number
  liftVy?: number
}

export interface PhasingCloudDef {
  x: number
  y: number
  w: number
  period: number
  offset?: number
}

export interface PhasingCloudState extends PhasingCloudDef {
  timer: number
  phase: 'solid' | 'warn' | 'phased'
}

export interface SwingingPerchDef {
  anchorX: number
  anchorY: number
  ropeLen: number
  w: number
  ampAngle: number
  speed: number
  phase?: number
}

export interface SwingingPerchState extends SwingingPerchDef {
  curX: number
  curY: number
  prevX: number
  prevY: number
  angle: number
  time: number
}

export interface GlowMushroomDef {
  x: number
  y: number
  w: number
  bounceVy?: number
  tint?: 'teal' | 'violet'
}

export interface GlowMushroomState extends GlowMushroomDef {
  squishTimer: number
  glowPulse: number
}

export interface ProximityCrystalDef {
  x: number
  y: number
  radius: number
  tint?: 'cyan' | 'violet' | 'gold'
}

export interface ProximityCrystalState extends ProximityCrystalDef {
  glow: number
}

export interface GearPlatformDef {
  centerX: number
  centerY: number
  orbitRadius: number
  w: number
  speed: number
  phase?: number
}

export interface GearPlatformState extends GearPlatformDef {
  curX: number
  curY: number
  prevX: number
  prevY: number
  angle: number
}

export interface LowGravityZoneDef {
  x: number
  y: number
  w: number
  h: number
  gravityScale?: number
}

// ============================================================================
// ENDGAME BOSS STAGES (Levels 13 & 14) & COMBAT ITEMS
// ============================================================================

export type BossKind = 'umbra-owl' | 'chronos-leviathan'

export type ArenaBattleItemKind = 'starBerry' | 'cometCharge' | 'moonlightFeather'

export interface ArenaBattleItemDef {
  x: number
  y: number
  kind: ArenaBattleItemKind
}

export interface ArenaBattleItemState extends ArenaBattleItemDef {
  id: number
  collected: boolean
  respawnTimer: number
  phase: number
}

export interface BossConfig {
  kind: BossKind
  name: string
  subtitle: string
  maxHp: number
  arenaMinX: number
  arenaMaxX: number
  triggerX: number
  spawnX: number
  spawnY: number
  rewardCoins: number
  achievementId: AchievementId
  cosmeticSlot: 'head_acc' | 'cape'
  cosmeticId: string
  cosmeticName: string
  arenaItemSpots: { x: number; y: number }[]
}

export interface CollectibleDef {
  x: number
  y: number
  kind: CollectibleKind
}

export interface CollectibleState extends CollectibleDef {
  id: number
  curX: number
  curY: number
  collected: boolean
  phase: number
}

export type PowerUpKind =
  | 'milk'
  | 'feather'
  | 'bell'
  | 'bubble'
  | 'mooncake'
  | 'yarn'
  | 'mochi'
  | 'candy'
  | 'pearl'

export interface PowerUpDef {
  x: number
  y: number
  kind: PowerUpKind
}

export interface PowerUpState extends PowerUpDef {
  id: number
  collected: boolean
  phase: number
}

export interface PuddleDef {
  x: number
  y: number
  w: number
}

export interface CrowDef {
  x: number
  y: number
  rangeX: number
  speed: number
  waveAmp?: number
  phase?: number
}

export interface CrowState extends CrowDef {
  curX: number
  curY: number
  facing: 1 | -1
  time: number
  defeated: boolean
}

export interface LanternDef {
  x: number
  y: number
  mount: 'post' | 'hanging'
}

export interface LanternState extends LanternDef {
  swayOffset: number
  swayVel: number
  sparkCooldown: number
}

export interface AmbientCritter {
  x: number
  y: number
  baseY: number
  kind: 'bird' | 'butterfly'
  state: 'perched' | 'flying'
  vx: number
  vy: number
  facing: 1 | -1
  phase: number
  color: string
  accent: string
  gone: boolean
}

export interface PortalDef {
  x: number
  y: number
}

export interface LevelDefinition {
  id: number
  biome: BiomeId
  name: string
  subtitle: string
  description: string
  width: number
  height: number
  spawn: { x: number; y: number }
  portal: PortalDef
  platforms: StaticPlatform[]
  movingPlatforms: MovingPlatformDef[]
  bounceClouds: BounceCloudDef[]
  checkpoint: CheckpointDef
  checkpoints?: CheckpointDef[]
  starRingBell?: StarRingBellDef
  shards?: [ShardDef, ShardDef, ShardDef]
  secretAlcoves?: SecretAlcoveDef[]
  steamVents?: SteamVentDef[]
  hedgehogs?: HedgehogDef[]
  windVortices?: WindVortexDef[]
  stormClouds?: StormCloudDef[]
  swoopCrows?: SwoopCrowDef[]
  crabs?: CrabDef[]
  wisps?: WispDef[]
  powerWires?: PowerWireDef[]
  fragileBranches?: FragileBranchDef[]
  floatingBoats?: FloatingBoatDef[]
  updrafts?: UpdraftVentDef[]
  phasingClouds?: PhasingCloudDef[]
  swingingPerches?: SwingingPerchDef[]
  glowMushrooms?: GlowMushroomDef[]
  proximityCrystals?: ProximityCrystalDef[]
  gearPlatforms?: GearPlatformDef[]
  lowGravityZones?: LowGravityZoneDef[]
  bossConfig?: BossConfig
  arenaBattleItems?: ArenaBattleItemDef[]
  isSecretFinale?: boolean
  npc: NpcDef
  tutorialSigns?: TutorialSignDef[]
  collectibles: CollectibleDef[]
  powerUps: PowerUpDef[]
  puddles: PuddleDef[]
  crows: CrowDef[]
  lanterns: LanternDef[]
  skyTint: {
    bands: [string, string, string, string, string]
  }
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  kind: 'star' | 'spark' | 'dust' | 'splash' | 'portal' | 'ambient' | 'glint' | 'petal' | 'bubble'
}

export interface DashAfterimage {
  x: number
  y: number
  facing: 1 | -1
  life: number
  maxLife: number
  tint: 'scarf' | 'white' | 'rainbow'
  rainbowIdx?: number
  scale?: number
}

export interface FloatingText {
  x: number
  y: number
  vy: number
  text: string
  color: string
  life: number
  maxLife: number
}

export interface PlayerState {
  x: number
  y: number
  w: number
  h: number
  vx: number
  vy: number
  facing: 1 | -1
  onGround: boolean
  coyoteTimer: number
  jumpBufferTimer: number
  jumpsUsed: number
  maxJumps: number
  dashTimer: number
  dashCooldownTimer: number
  airDashUsed: boolean
  afterimageSpawnTimer: number
  featherTimer: number
  magnetTimer: number
  hasBubbleShield: boolean
  hasFrostShield: boolean
  mooncakeTimer: number
  yarnTimer: number
  mochiTimer: number
  candyTimer: number
  pearlTimer: number
  cometChargeTimer: number
  moonlightFeatherTimer: number
  starlightPulseCooldown: number
  astralAegisTimer: number
  astralAegisCooldown: number
  idleDuration: number
  hearts: number
  maxHearts: number
  invincibleTimer: number
  animTimer: number
  blinkTimer: number
  safeX: number
  safeY: number
  standingMovingPlatformIdx: number
}

export interface InputState {
  left: boolean
  right: boolean
  jumpHeld: boolean
  jumpJustPressed: boolean
  dashHeld: boolean
  dashJustPressed: boolean
  pulseJustPressed: boolean
  aegisJustPressed: boolean
}

export interface LevelRecord {
  bestScore: number
  bestStars: number
  totalStars: number
  bestFish: number
  totalFish: number
  rating: 0 | 1 | 2 | 3
  threeStarBonusClaimed?: boolean
}

export interface AudioSettings {
  bgmVolume: number
  ambienceVolume: number
  sfxVolume: number
}

export interface HudSnapshot {
  screen: GameScreen
  levelId: number
  levelName: string
  biome: BiomeId
  hearts: number
  maxHearts: number
  score: number
  levelScore: number
  starsCollected: number
  totalStars: number
  fishCollected: number
  totalFish: number
  stageRating: 1 | 2 | 3
  justEarnedThreeStarBonus: boolean
  isTimeTrial: boolean
  timeTrialElapsedMs: number
  timeTrialGoldMs: number
  timeTrialSilverMs: number
  timeTrialBronzeMs: number
  lastTimeTrialMedal: TimeTrialMedal
  isNewTimeRecord: boolean
  runElapsedMs: number
  lastSpeedrunRank: SpeedrunRank
  isNewBestTime: boolean
  lastRankRewardBreakdown: RankRewardBreakdownItem[]
  lastRankRewardTotal: number
  showSpeedrunTimer: boolean
  shardsCollected: number
  shardStatus: ShardTuple
  photoModePose: PhotoModePose
  photoModeFrame: boolean
  homeBiome: BiomeId
  homeBackdropMode: HomeBackdropMode
  hasUnseenStamps: boolean
  highScore: number
  fishBank: number
  unlockedLevel: number
  selectedCharacter: CharacterId
  selectedScarf: ScarfColorId
  selectedHat: HatId
  selectedCape: CapeId
  selectedHeadAcc: HeadAccId
  selectedFaceAcc: FaceAccId
  graphicsStyle: GraphicsStyle
  touchControlsMode: TouchControlsMode
  checkpointReached: boolean
  starComboCount: number
  starComboTimer: number
  starComboMax: number
  starRingActive: boolean
  starRingCollected: number
  starRingTotal: number
  starRingTimer: number
  nightEvent: NightEventKind
  nightEventBanner: string | null
  meteorShowerActive: boolean
  meteorShowerTimer: number
  isMuted: boolean
  dashReady: boolean
  dashCharge: number
  isDashing: boolean
  featherTimer: number
  featherMax: number
  magnetTimer: number
  magnetMax: number
  hasBubbleShield: boolean
  hasFrostShield: boolean
  mooncakeTimer: number
  mooncakeMax: number
  yarnTimer: number
  yarnMax: number
  mochiTimer: number
  mochiMax: number
  candyTimer: number
  candyMax: number
  pearlTimer: number
  pearlMax: number
  cometChargeTimer: number
  cometChargeMax: number
  moonlightFeatherTimer: number
  moonlightFeatherMax: number
  isBossStage: boolean
  bossActive: boolean
  bossDefeated: boolean
  bossName: string
  bossSubtitle: string
  bossHp: number
  bossMaxHp: number
  bossPhase: 1 | 2 | 3
  bossCoreExposed: boolean
  pulseReady: boolean
  pulseCharge: number
  aegisReady: boolean
  aegisCharge: number
  aegisActive: boolean
  hurtPulseCount: number
  recentToast: ToastNotice | null
  autoSavePulse: number
}

export interface SaveProgress {
  unlockedLevel: number
  lastPlayedLevel: number
  homeBackdropMode: HomeBackdropMode
  hasUnseenStamps: boolean
  highScore: number
  fishBank: number
  totalFishEarned: number
  totalDashes: number
  visitedBiomes: BiomeId[]
  selectedCharacter: CharacterId
  selectedScarf: ScarfColorId
  selectedHat: HatId
  selectedCape: CapeId
  selectedHeadAcc: HeadAccId
  selectedFaceAcc: FaceAccId
  unlockedCharacters: CharacterId[]
  ownedScarves: ScarfColorId[]
  ownedHats: HatId[]
  ownedCapes: CapeId[]
  ownedHeadAccs: HeadAccId[]
  ownedFaceAccs: FaceAccId[]
  unlockedAchievements: AchievementId[]
  bestLevelScores: Record<number, number>
  levelRecords: Record<number, LevelRecord>
  collectedShards: Record<number, ShardTuple>
  bestTimes: Record<number, number>
  levelRanks: Record<number, SpeedrunRank>
  claimedRankRewards: Record<number, ClaimedRankRewards>
  totalFalls: number
  pacifistClears: number
  timeTrials: Record<number, TimeTrialRecord>
  dailyQuest: DailyQuestState
  dailyMissions: DailyMissionsState
  totalDailyMissionsCompleted: number
  muted: boolean
  reduceMotion: boolean
  showSpeedrunTimer: boolean
  graphicsStyle: GraphicsStyle
  touchControlsMode: TouchControlsMode
  audio: AudioSettings
}

export interface EquippedCosmetics {
  scarf: ScarfColorId
  hat: HatId
  cape: CapeId
  head_acc: HeadAccId
  face: FaceAccId
}

export interface GameSaveSettings {
  classicVisuals: boolean
  reduceMotion: boolean
  showSpeedrunTimer: boolean
  muted: boolean
  bgmVolume: number
  ambienceVolume: number
  sfxVolume: number
  touchControlsMode: TouchControlsMode
}

export interface GameSavePayload extends SaveProgress {
  version: 1
  savedAt: number
  fishCoins: number
  unlockedLevels: number[]
  levelHighScores: Record<number, number>
  ownedCosmetics: string[]
  equippedCosmetics: EquippedCosmetics
  settings: GameSaveSettings
}
