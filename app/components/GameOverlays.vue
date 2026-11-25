<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ACHIEVEMENTS, BIOMES } from '~/game/achievements'
import {
  CAPES,
  CHARACTERS,
  FACE_ACCS,
  HATS,
  HEAD_ACCS,
  SCARF_COLORS,
  getCapeById,
  getCharacterById,
  getCharacterMissionProgress,
  getFaceAccById,
  getHatById,
  getHeadAccById,
  getScarfById
} from '~/game/characters'
import { ALL_DAILY_BONUS_FISH, formatSpeedrunTime, formatTimeTrial, getDailyQuestDef } from '~/game/dailyQuest'
import {
  countBiomeCollectedShards,
  countRankSLevels,
  countTotalCollectedShards
} from '~/composables/useAchievements'
import { exportPostcardHdDataUrl, renderPostcardPreview } from '~/game/photoStudio'
import {
  getCapeIconDataUrl,
  getCharacterPreviewDataUrl,
  getFaceAccIconDataUrl,
  getHatIconDataUrl,
  getHeadAccIconDataUrl,
  getPowerUpIconDataUrl,
  getScarfIconDataUrl
} from '~/game/sprites'
import type { CloudCrudLog, CloudPlayerProfile } from '~/composables/useGameSave'
import type {
  AchievementId,
  AudioSettings,
  BiomeId,
  CapeId,
  CharacterId,
  FaceAccId,
  GraphicsStyle,
  HatId,
  HeadAccId,
  HudSnapshot,
  LevelDefinition,
  PostcardEmoteId,
  PostcardPoseId,
  PowerUpKind,
  SaveProgress,
  ScarfColorId,
  TimeTrialMedal,
  TouchControlsMode,
  TouchLayoutConfig
} from '~/game/types'

const props = defineProps<{
  hud: HudSnapshot
  levels: LevelDefinition[]
  progress: SaveProgress
  importFeedback?: string
  playerId?: string
  playerName?: string
  cloudSyncStatus?: 'idle' | 'syncing' | 'synced' | 'offline'
  cloudProfiles?: CloudPlayerProfile[]
  recentCrudLogs?: CloudCrudLog[]
}>()

const emit = defineEmits<{
  (e: 'startNew'): void
  (e: 'openLevelSelect'): void
  (e: 'openCharacters'): void
  (e: 'openShop'): void
  (e: 'openAchievements'): void
  (e: 'openPhotoStudio'): void
  (e: 'openGuidebook'): void
  (e: 'openSettings'): void
  (e: 'openTitle'): void
  (e: 'openEnding'): void
  (e: 'selectLevel', id: number): void
  (e: 'startTimeTrial', id: number): void
  (e: 'claimDailyQuest', slotIndex?: number): void
  (e: 'continueCheckpoint'): void
  (e: 'selectCharacter', id: CharacterId): void
  (e: 'unlockCharacter', id: CharacterId): void
  (e: 'buyOrEquipScarf', id: ScarfColorId): void
  (e: 'buyOrEquipHat', id: HatId): void
  (e: 'buyOrEquipCape', id: CapeId): void
  (e: 'buyOrEquipHeadAcc', id: HeadAccId): void
  (e: 'buyOrEquipFaceAcc', id: FaceAccId): void
  (e: 'updateAudio', partial: Partial<AudioSettings>): void
  (e: 'setGraphicsStyle', style: GraphicsStyle): void
  (e: 'setTouchControlsMode', mode: TouchControlsMode): void
  (e: 'setTouchLayout', nextLayout: TouchLayoutConfig): void
  (e: 'openTouchEditor'): void
  (e: 'setShowSpeedrunTimer', enabled: boolean): void
  (e: 'setReduceMotion', enabled: boolean): void
  (e: 'cycleHomeBackdrop'): void
  (e: 'triggerCampReaction'): void
  (e: 'dismissCelebration'): void
  (e: 'equipCelebration', openStudio?: boolean): void
  (e: 'openPhotoMode'): void
  (e: 'exportJson'): void
  (e: 'importJson', text: string): void
  (e: 'resetSave'): void
  (e: 'syncCloudNow'): void
  (e: 'switchPlayerId', code: string): void
  (e: 'createProfile', displayName: string): void
  (e: 'renameProfile', nextName: string): void
  (e: 'deleteProfile', targetId: string): void
  (e: 'nextLevel'): void
  (e: 'restart'): void
  (e: 'resume'): void
  (e: 'toggleMute'): void
}>()

type ShopTab = 'scarf' | 'hat' | 'cape' | 'head_acc' | 'face'
const activeShopTab = ref<ShopTab>('scarf')
const activeGuideTab = ref<'items' | 'worlds'>('items')
const fileInputRef = ref<HTMLInputElement | null>(null)
const confirmReset = ref(false)
const cloudCodeDraft = ref('')
const cloudNameDraft = ref('')
const newProfileNameDraft = ref('')
const showCrudPanel = ref(false)
const confirmDeleteProfileId = ref<string | null>(null)
const cloudCopied = ref(false)
const campHeartBurst = ref<string | null>(null)
const campBounceActive = ref(false)
let campUiTimer: number | null = null
let campUiCount = 0

watch(
  () => props.playerId,
  (nextId) => {
    if (nextId) cloudCodeDraft.value = nextId
  },
  { immediate: true }
)

watch(
  () => props.playerName,
  (nextName) => {
    if (nextName) cloudNameDraft.value = nextName
  },
  { immediate: true }
)

const cloudStatusLabel = computed(() => {
  if (props.cloudSyncStatus === 'syncing') return '⏳ Sinkron TiDB...'
  if (props.cloudSyncStatus === 'synced') return '☁️ TiDB: starlight_stray'
  if (props.cloudSyncStatus === 'offline') return '⚠️ Mode Lokal (Offline)'
  return '☁️ TiDB Siap'
})

function handleCopyPlayerId() {
  const code = (cloudCodeDraft.value || props.playerId || '').trim()
  if (!code || typeof navigator === 'undefined' || !navigator.clipboard) return
  void navigator.clipboard.writeText(code).then(() => {
    cloudCopied.value = true
    window.setTimeout(() => {
      cloudCopied.value = false
    }, 1400)
  })
}

function handleApplyCloudCode() {
  const trimmed = cloudCodeDraft.value.trim().toUpperCase()
  if (!trimmed) return
  if (trimmed === (props.playerId || '').toUpperCase()) {
    emit('syncCloudNow')
  } else {
    emit('switchPlayerId', trimmed)
  }
}

function handleSaveDisplayName() {
  const trimmed = cloudNameDraft.value.trim()
  if (!trimmed) return
  emit('renameProfile', trimmed)
}

function handleCreateNewProfile() {
  const trimmed = newProfileNameDraft.value.trim() || `Petualang ${(props.cloudProfiles?.length || 0) + 1}`
  newProfileNameDraft.value = ''
  emit('createProfile', trimmed)
}

function handleConfirmDeleteProfile(id: string) {
  confirmDeleteProfileId.value = null
  emit('deleteProfile', id)
}

function handleConfirmReset() {
  confirmReset.value = false
  emit('resetSave')
}

function handleTitleHeroClick() {
  emit('triggerCampReaction')
  const badges = ['★ HOP!', '♥ ♪', 'zZz']
  campHeartBurst.value = badges[campUiCount % badges.length]!
  campUiCount += 1
  if (!props.progress.reduceMotion) {
    campBounceActive.value = true
  }
  if (campUiTimer !== null) window.clearTimeout(campUiTimer)
  campUiTimer = window.setTimeout(() => {
    campHeartBurst.value = null
    campBounceActive.value = false
    campUiTimer = null
  }, 900)
}

function getLevelShardTuple(lvlId: number): [boolean, boolean, boolean] {
  return props.progress.collectedShards[lvlId] ?? [false, false, false]
}

const totalShardsCollected = computed(() => countTotalCollectedShards(props.progress))

const dailyMissionCards = computed(() =>
  props.progress.dailyMissions.missions.map((slot, index) => {
    const def = getDailyQuestDef(slot.questId)
    const clamped = Math.min(slot.progress, def.target)
    const pct = Math.min(100, Math.round((clamped / Math.max(1, def.target)) * 100))
    return {
      index,
      slot,
      def,
      clamped,
      pct,
      filledSegs: Math.round((clamped / Math.max(1, def.target)) * 10),
      completed: slot.progress >= def.target
    }
  })
)

const dailyClaimedCount = computed(
  () => props.progress.dailyMissions.missions.filter((m) => m.claimed).length
)

const mainLevels = computed(() => props.levels.filter((l) => !l.isSecretFinale))
const secretFinaleLevels = computed(() => props.levels.filter((l) => l.isSecretFinale))
const rankSCount = computed(() => countRankSLevels(props.progress))
const secretFinaleUnlocked = computed(() => rankSCount.value >= 3)

const homeBackdropBadgeLabel = computed(() => {
  const mode = props.hud.homeBackdropMode
  if (mode === 'auto') return 'BG: AUTO'
  if (mode === 'rooftops') return 'BG: ATAP'
  if (mode === 'sakura') return 'BG: SAKURA'
  if (mode === 'cloudland') return 'BG: AWAN'
  if (mode === 'harbor') return 'BG: DERMAGA'
  if (mode === 'cavern') return 'BG: GUA'
  return 'BG: OBSERV'
})

const GUIDE_ITEMS: { kind: PowerUpKind; name: string; tag: string; desc: string }[] = [
  { kind: 'mooncake', name: 'Kue Bulan Emas', tag: 'Spesial Semua Map • 8 dtk', desc: 'Membesar 1.35x, kebal rintangan, & menghancurkan semua musuh (+50 poin).' },
  { kind: 'milk', name: 'Botol Susu Hangat', tag: 'Item Dasar', desc: 'Memulihkan +1 Hati yang hilang (atau +100 poin jika hati sudah penuh).' },
  { kind: 'feather', name: 'Bulu Bintang', tag: 'Item Dasar • 8 dtk', desc: 'Tahan tombol Lompat di udara untuk melayang turun secara lembut.' },
  { kind: 'bell', name: 'Lonceng Magnet', tag: 'Item Dasar • 10 dtk', desc: 'Menarik otomatis Bintang dan Ikan Emas di sekitar karakter.' },
  { kind: 'bubble', name: 'Gelembung Bulan', tag: 'Item Dasar', desc: 'Perisai gelembung yang menahan 1 kali tabrakan musuh atau rintangan.' },
  { kind: 'yarn', name: 'Bola Benang Bintang', tag: 'Eksklusif Atap Kota • 10 dtk', desc: 'Membuka Triple Jump (lompat 3x) dan menambah kelincahan gerak.' },
  { kind: 'mochi', name: 'Mochi Sakura', tag: 'Eksklusif Hutan Sakura • 8 dtk', desc: 'Melayang lembut disertai kelopak sakura & skor Bintang menjadi 2x lipat.' },
  { kind: 'candy', name: 'Permen Pelangi', tag: 'Eksklusif Negeri Awan • 7 dtk', desc: 'Menghapus cooldown Dash & membuka Air-Dash tanpa batas berjejak pelangi.' },
  { kind: 'pearl', name: 'Mutiara Bulan', tag: 'Eksklusif Dermaga • 10 dtk', desc: 'Aman berjalan di atas genangan air & menarik Ikan Emas dari jauh.' }
]

const GUIDE_WORLDS = [
  {
    icon: '🏙️',
    name: 'Atap Kota Malam (Lvl 1–2)',
    platform: 'Kabel Listrik Membal (memantul tinggi)',
    hazards: 'Gagak Patroli & Cerobong Uap Berkala (ada asap peringatan)',
    secret: 'Dinding cerobong palsu tersembunyi'
  },
  {
    icon: '🌸',
    name: 'Hutan Sakura Malam (Lvl 3–4)',
    platform: 'Dahan Pohon Rapuh (bergetar 1 dtk lalu turun pelan)',
    hazards: 'Landak Duri patroli & Pusaran Angin Kelopak pendorong',
    secret: 'Balik kanopi daun sakura'
  },
  {
    icon: '☁️',
    name: 'Negeri Awan Pastel (Lvl 5–6)',
    platform: 'Awan Bergerak maju-mundur & Awan Memantul',
    hazards: 'Awan Petir Kecil (kedip kuning 1 dtk) & Gagak Peluncur',
    secret: 'Balik gumpalan awan pastel'
  },
  {
    icon: '⚓',
    name: 'Dermaga Lampion (Lvl 7–8)',
    platform: 'Lentera Berayun & Perahu Kayu Mengapung di atas ombak',
    hazards: 'Kepiting Dermaga Gesit & Api Lentera Melayang (sinus)',
    secret: 'Balik layar perahu dermaga'
  },
  {
    icon: '🍄',
    name: 'Gua Jamur Kristal (Lvl 9–10)',
    platform: 'Jamur Bioluminesen Elastis & Kristal Gua berpendar saat didekati',
    hazards: 'Api Spora Gua, Gagak Gua & Landak Kristal',
    secret: 'Ruang gua kristal tersembunyi (6/6 Shard -> Crystal Glow Cape)'
  },
  {
    icon: '⚙️',
    name: 'Observatorium Roda Jam (Lvl 11–12)',
    platform: 'Roda Gigi Berputar & Zona Gravitasi Ringan Astral',
    hazards: 'Gagak Astronomi & Api Bintang (6/6 Shard -> Astral Clockwork Hat)',
    secret: 'Ruang roda kuningan rahasia'
  },
  {
    icon: '🌘',
    name: '★ SECRET FINALE (Lvl 13–14 • 3 Rank S)',
    platform: 'Arena Boss Umbra Owl & Chronos Leviathan (3 Fase + Item Arena)',
    hazards: 'Gunakan Starlight Pulse [C/J atau ✦] & Astral Aegis [V/K atau ◈]!',
    secret: 'Hadiah +250/+500 🐟, Eclipse Halo & Nebula Sovereign Cape!'
  }
]

const powerUpIcons = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  for (const item of GUIDE_ITEMS) {
    map[item.kind] = getPowerUpIconDataUrl(item.kind)
  }
  return map
})

// ============================================================================
// DAILY QUEST COMPUTED + PHOTO STUDIO (4x HD POSTCARD) STATE
// ============================================================================
const dailyQuestDef = computed(() => getDailyQuestDef(props.progress.dailyQuest.questId))
const dailyQuestCompleted = computed(
  () => props.progress.dailyQuest.progress >= dailyQuestDef.value.target
)
const dailyQuestPct = computed(() =>
  Math.min(100, Math.round((props.progress.dailyQuest.progress / dailyQuestDef.value.target) * 100))
)

const postcardCanvasRef = ref<HTMLCanvasElement | null>(null)
const photoBiome = ref<BiomeId>('rooftops')
const photoPose = ref<PostcardPoseId>('sit')
const photoEmote = ref<PostcardEmoteId>('none')
const photoStyle = ref<GraphicsStyle>('modern')
const photoSavedNotice = ref('')

const celebrationCharDef = computed(() =>
  props.hud.celebrationCharId ? getCharacterById(props.hud.celebrationCharId) : null
)

const celebrationPreviewUrl = computed(() => {
  if (!props.hud.celebrationCharId || typeof document === 'undefined') return ''
  return getCharacterPreviewDataUrl(
    props.hud.celebrationCharId,
    props.progress.selectedScarf,
    props.progress.selectedHat,
    props.progress.selectedCape,
    'right',
    0,
    props.progress.graphicsStyle,
    props.progress.selectedHeadAcc,
    props.progress.selectedFaceAcc
  )
})

const PHOTO_BIOMES: { id: BiomeId; label: string }[] = [
  { id: 'rooftops', label: '🏙️ Atap Bulan' },
  { id: 'sakura', label: '🌸 Hutan Sakura' },
  { id: 'cloudland', label: '☁️ Negeri Awan' },
  { id: 'harbor', label: '⚓ Dermaga' },
  { id: 'cavern', label: '🍄 Gua Kristal' },
  { id: 'observatory', label: '⚙️ Observatorium' },
  { id: 'eclipse', label: '🌘 Kuil Gerhana' },
  { id: 'citadel', label: '🌌 Inti Bintang' }
]

const PHOTO_POSES: { id: PostcardPoseId; label: string }[] = [
  { id: 'sit', label: '🐾 Duduk Manis' },
  { id: 'jump', label: '✨ Melompat Ceria' },
  { id: 'sleep', label: '💤 Tidur Melingkar' },
  { id: 'wave', label: '💖 Melambai' },
  { id: 'hero', label: '⚔️ Berdiri Gagah' },
  { id: 'snack', label: '🍯 Makan Camilan' },
  { id: 'peek', label: '👀 Mengintip Malu' },
  { id: 'victory', label: '🏆 Pose Kemenangan' }
]

const PHOTO_EMOTES: { id: PostcardEmoteId; label: string }[] = [
  { id: 'none', label: '∅ Polos' },
  { id: 'heart', label: '♥ Heart' },
  { id: 'star', label: '★ Star' },
  { id: 'music', label: '♪ Musik' },
  { id: 'sleep', label: 'zZz Ngantuk' },
  { id: 'alert', label: '! Kaget' },
  { id: 'sweat', label: '💧 Malu' }
]

function redrawPostcard() {
  if (props.hud.screen !== 'photoStudio' || !postcardCanvasRef.value) return
  renderPostcardPreview(postcardCanvasRef.value, {
    biome: photoBiome.value,
    pose: photoPose.value,
    emote: photoEmote.value,
    style: photoStyle.value,
    characterId: props.progress.selectedCharacter,
    scarfId: props.progress.selectedScarf,
    hatId: props.progress.selectedHat,
    capeId: props.progress.selectedCape,
    headAccId: props.progress.selectedHeadAcc,
    faceAccId: props.progress.selectedFaceAcc
  })
}

function handleDownloadPostcardHd() {
  const dataUrl = exportPostcardHdDataUrl({
    biome: photoBiome.value,
    pose: photoPose.value,
    emote: photoEmote.value,
    style: photoStyle.value,
    characterId: props.progress.selectedCharacter,
    scarfId: props.progress.selectedScarf,
    hatId: props.progress.selectedHat,
    capeId: props.progress.selectedCape,
    headAccId: props.progress.selectedHeadAcc,
    faceAccId: props.progress.selectedFaceAcc
  })
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `starlight-stray-${props.progress.selectedCharacter}-${photoBiome.value}-4xHD.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  photoSavedNotice.value = 'Kartu Pos 4x HD (960×600 .PNG) berhasil disimpan!'
}

function medalLabel(medal: TimeTrialMedal): string {
  if (medal === 'gold') return '🥇 MEDALI EMAS'
  if (medal === 'silver') return '🥈 MEDALI PERAK'
  if (medal === 'bronze') return '🥉 MEDALI PERUNGGU'
  return '⏱️ SELESAI'
}

function medalIcon(medal?: TimeTrialMedal): string {
  if (medal === 'gold') return '🥇'
  if (medal === 'silver') return '🥈'
  if (medal === 'bronze') return '🥉'
  return ''
}

// ============================================================================
// LIVE TRY-ON PREVIEW STATE (Accessory Shop & Character Select)
// ============================================================================
const previewScarf = ref<ScarfColorId | null>(null)
const previewHat = ref<HatId | null>(null)
const previewCape = ref<CapeId | null>(null)
const previewHeadAcc = ref<HeadAccId | null>(null)
const previewFaceAcc = ref<FaceAccId | null>(null)
const shopPreviewFacing = ref<'right' | 'left'>('right')

const previewChar = ref<CharacterId | null>(null)
const charPreviewFacing = ref<'right' | 'left'>('right')

// Calm 2-frame idle animation for live preview boxes
const previewIdleFrame = ref<0 | 1>(0)
let previewAnimInterval: number | null = null

onMounted(() => {
  previewAnimInterval = window.setInterval(() => {
    if (props.hud.screen === 'shop' || props.hud.screen === 'characters') {
      previewIdleFrame.value = previewIdleFrame.value === 0 ? 1 : 0
    }
  }, 650)
})

onBeforeUnmount(() => {
  if (previewAnimInterval !== null) {
    window.clearInterval(previewAnimInterval)
    previewAnimInterval = null
  }
})

function resetShopPreview() {
  previewScarf.value = null
  previewHat.value = null
  previewCape.value = null
  previewHeadAcc.value = null
  previewFaceAcc.value = null
  shopPreviewFacing.value = 'right'
}

function resetCharPreview() {
  previewChar.value = null
  charPreviewFacing.value = 'right'
}

// Auto-clear all previews when leaving Shop or Character Select screens + sync Photo Studio preview
watch(
  () => props.hud.screen,
  (nextScreen) => {
    if (nextScreen !== 'shop') resetShopPreview()
    if (nextScreen !== 'characters') resetCharPreview()
    if (nextScreen !== 'settings') confirmReset.value = false
    if (nextScreen === 'photoStudio') {
      photoStyle.value = props.hud.graphicsStyle
      photoSavedNotice.value = ''
      nextTick(() => redrawPostcard())
    }
  }
)

watch(
  [
    photoBiome,
    photoPose,
    photoEmote,
    photoStyle,
    () => props.progress.selectedCharacter,
    () => props.progress.selectedScarf,
    () => props.progress.selectedHat,
    () => props.progress.selectedCape,
    () => props.progress.selectedHeadAcc,
    () => props.progress.selectedFaceAcc
  ],
  () => {
  photoSavedNotice.value = ''
  nextTick(() => redrawPostcard())
})

const regularCharacters = computed(() => CHARACTERS.filter((c) => c.unlockMode === 'regular'))
const specialCharacters = computed(() => CHARACTERS.filter((c) => c.unlockMode === 'mission'))

const activeCharacter = computed(() => getCharacterById(props.progress.selectedCharacter))

// Effective values shown in Shop Live Preview
const effectiveShopScarfId = computed(() => previewScarf.value ?? props.progress.selectedScarf)
const effectiveShopHatId = computed(() => previewHat.value ?? props.progress.selectedHat)
const effectiveShopCapeId = computed(() => previewCape.value ?? props.progress.selectedCape)
const effectiveShopHeadAccId = computed(() => previewHeadAcc.value ?? props.progress.selectedHeadAcc)
const effectiveShopFaceAccId = computed(() => previewFaceAcc.value ?? props.progress.selectedFaceAcc)

const effectiveShopScarf = computed(() => getScarfById(effectiveShopScarfId.value))
const effectiveShopHat = computed(() => getHatById(effectiveShopHatId.value))
const effectiveShopCape = computed(() => getCapeById(effectiveShopCapeId.value))
const effectiveShopHeadAcc = computed(() => getHeadAccById(effectiveShopHeadAccId.value))
const effectiveShopFaceAcc = computed(() => getFaceAccById(effectiveShopFaceAccId.value))

const hasShopPreviewChanges = computed(
  () =>
    effectiveShopScarfId.value !== props.progress.selectedScarf ||
    effectiveShopHatId.value !== props.progress.selectedHat ||
    effectiveShopCapeId.value !== props.progress.selectedCape ||
    effectiveShopHeadAccId.value !== props.progress.selectedHeadAcc ||
    effectiveShopFaceAccId.value !== props.progress.selectedFaceAcc
)

const hasUnownedShopPreview = computed(
  () =>
    !props.progress.ownedScarves.includes(effectiveShopScarfId.value) ||
    !props.progress.ownedHats.includes(effectiveShopHatId.value) ||
    !props.progress.ownedCapes.includes(effectiveShopCapeId.value) ||
    !props.progress.ownedHeadAccs.includes(effectiveShopHeadAccId.value) ||
    !props.progress.ownedFaceAccs.includes(effectiveShopFaceAccId.value)
)

// Effective values shown in Character Select Live Preview
const effectiveCharPreviewId = computed(() => previewChar.value ?? props.progress.selectedCharacter)
const effectiveCharPreviewDef = computed(() => getCharacterById(effectiveCharPreviewId.value))
const isCharPreviewLocked = computed(() => !props.progress.unlockedCharacters.includes(effectiveCharPreviewId.value))
const hasCharPreviewChange = computed(() => effectiveCharPreviewId.value !== props.progress.selectedCharacter)

// Live preview data URLs (single source of truth: props.hud.graphicsStyle!)
const titleHeroPreview = computed(() =>
  getCharacterPreviewDataUrl(
    props.progress.selectedCharacter,
    props.progress.selectedScarf,
    props.progress.selectedHat,
    props.progress.selectedCape,
    'right',
    0,
    props.hud.graphicsStyle,
    props.progress.selectedHeadAcc,
    props.progress.selectedFaceAcc
  )
)

const shopLivePreviewUrl = computed(() =>
  getCharacterPreviewDataUrl(
    props.progress.selectedCharacter,
    effectiveShopScarfId.value,
    effectiveShopHatId.value,
    effectiveShopCapeId.value,
    shopPreviewFacing.value,
    previewIdleFrame.value,
    props.hud.graphicsStyle,
    effectiveShopHeadAccId.value,
    effectiveShopFaceAccId.value
  )
)

const charLivePreviewUrl = computed(() =>
  getCharacterPreviewDataUrl(
    effectiveCharPreviewId.value,
    props.progress.selectedScarf,
    props.progress.selectedHat,
    props.progress.selectedCape,
    charPreviewFacing.value,
    previewIdleFrame.value,
    props.hud.graphicsStyle,
    props.progress.selectedHeadAcc,
    props.progress.selectedFaceAcc
  )
)

function tryOnScarf(id: ScarfColorId) {
  previewScarf.value = id === props.progress.selectedScarf ? null : id
}

function tryOnHat(id: HatId) {
  previewHat.value = id === props.progress.selectedHat ? null : id
}

function tryOnCape(id: CapeId) {
  previewCape.value = id === props.progress.selectedCape ? null : id
}

function tryOnHeadAcc(id: HeadAccId) {
  previewHeadAcc.value = id === props.progress.selectedHeadAcc ? null : id
}

function tryOnFaceAcc(id: FaceAccId) {
  previewFaceAcc.value = id === props.progress.selectedFaceAcc ? null : id
}

function tryOnCharacter(id: CharacterId) {
  previewChar.value = id === props.progress.selectedCharacter ? null : id
}

function handleActionScarf(id: ScarfColorId) {
  emit('buyOrEquipScarf', id)
  if (previewScarf.value === id) previewScarf.value = null
}

function handleActionHat(id: HatId) {
  emit('buyOrEquipHat', id)
  if (previewHat.value === id) previewHat.value = null
}

function handleActionCape(id: CapeId) {
  emit('buyOrEquipCape', id)
  if (previewCape.value === id) previewCape.value = null
}

function handleActionHeadAcc(id: HeadAccId) {
  emit('buyOrEquipHeadAcc', id)
  if (previewHeadAcc.value === id) previewHeadAcc.value = null
}

function handleActionFaceAcc(id: FaceAccId) {
  emit('buyOrEquipFaceAcc', id)
  if (previewFaceAcc.value === id) previewFaceAcc.value = null
}

function handleActionSelectChar(id: CharacterId) {
  emit('selectCharacter', id)
  if (previewChar.value === id) previewChar.value = null
}

function handleActionUnlockChar(id: CharacterId) {
  emit('unlockCharacter', id)
  if (previewChar.value === id) previewChar.value = null
}

// Character card previews (each animal shown wearing player's equipped accessories & active graphics style)
const characterPreviews = computed<Record<string, string>>(() => {
  const scarf = props.progress.selectedScarf
  const hat = props.progress.selectedHat
  const cape = props.progress.selectedCape
  const headAcc = props.progress.selectedHeadAcc
  const faceAcc = props.progress.selectedFaceAcc
  const style = props.hud.graphicsStyle
  const map: Record<string, string> = {}
  for (const ch of CHARACTERS) {
    map[ch.id] = getCharacterPreviewDataUrl(ch.id, scarf, hat, cape, 'right', 0, style, headAcc, faceAcc)
  }
  return map
})

const scarfIcons = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  for (const s of SCARF_COLORS) map[s.id] = getScarfIconDataUrl(s.id)
  return map
})

const hatIcons = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  for (const h of HATS) map[h.id] = getHatIconDataUrl(h.id)
  return map
})

const capeIcons = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  for (const c of CAPES) map[c.id] = getCapeIconDataUrl(c.id)
  return map
})

const headAccIcons = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  for (const h of HEAD_ACCS) map[h.id] = getHeadAccIconDataUrl(h.id)
  return map
})

const faceAccIcons = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  for (const f of FACE_ACCS) map[f.id] = getFaceAccIconDataUrl(f.id)
  return map
})

function isCharUnlocked(id: CharacterId): boolean {
  return props.progress.unlockedCharacters.includes(id)
}

function getMissionInfo(id: CharacterId) {
  return getCharacterMissionProgress(id, props.progress)
}

function isAchievementUnlocked(id: AchievementId): boolean {
  return props.progress.unlockedAchievements.includes(id)
}

function getLevelTotal(lvl: LevelDefinition, kind: 'star' | 'fish'): number {
  return lvl.collectibles.filter((c) => c.kind === kind).length
}

function onVolumeInput(key: keyof AudioSettings, e: Event) {
  const raw = Number((e.target as HTMLInputElement).value)
  emit('updateAudio', { [key]: Math.max(0, Math.min(1, raw / 100)) })
}

function onTouchOpacityInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  if (!Number.isFinite(val)) return
  emit('setTouchLayout', {
    ...props.progress.touchLayout,
    opacity: Math.max(0, Math.min(1, val / 100))
  })
}

function triggerImportClick() {
  fileInputRef.value?.click()
}

function leaveCharacters(target: 'openTitle' | 'openShop' | 'startNew') {
  resetCharPreview()
  if (target === 'openTitle') emit('openTitle')
  else if (target === 'openShop') emit('openShop')
  else emit('startNew')
}

function leaveShop(target: 'openTitle' | 'openCharacters' | 'startNew') {
  resetShopPreview()
  if (target === 'openTitle') emit('openTitle')
  else if (target === 'openCharacters') emit('openCharacters')
  else emit('startNew')
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      emit('importJson', reader.result)
    }
    input.value = ''
  }
  reader.readAsText(file)
}
</script>

<template>
  <!-- Calm Non-Shaking Toast Banner (Achievements & Special Character Unlocks) -->
  <div v-if="hud.recentToast" class="ach-toast" role="status" aria-live="polite">
    <span class="ach-toast__icon">{{ hud.recentToast.icon }}</span>
    <div class="ach-toast__text">
      <span class="ach-toast__label">{{ hud.recentToast.label }}</span>
      <span class="ach-toast__name">{{ hud.recentToast.title }}</span>
    </div>
  </div>

  <!-- ====================================================================== -->
  <!-- 1. ASYMMETRIC MODERN PIXEL HOME SCREEN (Left Panel + Top-Right Bar + Open Right Stage) -->
  <!-- ====================================================================== -->
  <div v-if="hud.screen === 'title'" class="home-asymmetric-shell">
    <!-- Top-Right Floating Status & Utility Bar (outside main menu panel) -->
    <div class="home-floating-bar" aria-label="Status dan Pengaturan Cepat">
      <span class="highscore-chip">★ BEST: {{ hud.highScore }}</span>
      <span class="fish-chip">🐟 {{ progress.fishBank }}</span>
      <button
        type="button"
        class="pixel-btn pixel-btn--ghost home-tool-pill"
        :title="`Ganti latar biome Home (Aktif: ${BIOMES[hud.homeBiome].englishName})`"
        @click="$emit('cycleHomeBackdrop')"
      >
        {{ BIOMES[hud.homeBiome].icon }} {{ homeBackdropBadgeLabel }}
      </button>
      <button
        type="button"
        class="pixel-btn pixel-btn--ghost home-tool-pill"
        :title="hud.graphicsStyle === 'modern' ? 'Beralih ke Mode Klasik (8-Bit)' : 'Beralih ke Mode Modern (16-Bit)'"
        @click="$emit('setGraphicsStyle', hud.graphicsStyle === 'modern' ? 'classic' : 'modern')"
      >
        {{ hud.graphicsStyle === 'modern' ? '16-BIT' : '8-BIT' }}
      </button>
      <button
        type="button"
        class="pixel-btn pixel-btn--ghost home-icon-pill"
        :title="hud.isMuted ? 'Nyalakan Audio (M)' : 'Bisukan Audio (M)'"
        @click="$emit('toggleMute')"
      >
        {{ hud.isMuted ? '🔇' : '🔊' }}
      </button>
      <button
        type="button"
        class="pixel-btn pixel-btn--ghost home-icon-pill"
        title="Pengaturan Audio, Speedrun & Cadangan Data"
        aria-label="Pengaturan"
        @click="$emit('openSettings')"
      >
        ⚙️
      </button>
    </div>

    <!-- Left Creative Column (~40% width): Floating Oversized Title Crest + Hanging Chains + Ornamental Panel -->
    <div class="home-left-column">
      <!-- 1. Floating Oversized Pixel Title Logo in Upper-Left Sky -->
      <header class="home-floating-crest" aria-label="Starlight Stray">
        <div class="crest-emblem-row" aria-hidden="true">
          <!-- Decorative Pixel Crescent Moon + Twinkling Stars Emblem -->
          <svg viewBox="0 0 28 18" width="34" height="22" class="crest-moon-svg">
            <!-- Golden Pixel Crescent Moon -->
            <path d="M10 1h5v2h-2v2h-1v6h1v2h2v2h-5v-1H8v-2H7V4h1V2h2V1z" fill="#ffe678" />
            <path d="M10 2h2v2h-1v8h1v2h-2v-1H9V3h1V2z" fill="#fff9d6" />
            <!-- Twinkling Pixel Cross Stars -->
            <path
              class="crest-star-a"
              d="M21 2h1v2h2v1h-2v2h-1V5h-2V4h2V2z"
              fill="#fff7cc"
            />
            <path
              class="crest-star-b"
              d="M3 6h1v1h1v1H4v1H3V8H2V7h1V6z"
              fill="#a8efff"
            />
            <rect x="24" y="11" width="2" height="2" fill="#ffb8dc" />
          </svg>
          <span class="crest-tagline">NOCTURNAL PIXEL ADVENTURE</span>
        </div>
        <h1 class="home-crest-title" data-text="STARLIGHT STRAY">STARLIGHT STRAY</h1>
      </header>

      <!-- 2. Two Pixel Hanging Chains Connecting Floating Crest to Menu Panel -->
      <div class="home-chains-row" aria-hidden="true">
        <svg viewBox="0 0 8 18" width="10" height="20" class="home-chain-svg">
          <rect x="2" y="0" width="4" height="6" fill="#201036" />
          <rect x="3" y="1" width="2" height="4" fill="#d9a452" />
          <rect x="3" y="4" width="2" height="5" fill="#ffe694" />
          <rect x="2" y="8" width="4" height="6" fill="#201036" />
          <rect x="3" y="9" width="2" height="4" fill="#d9a452" />
          <rect x="2" y="14" width="4" height="4" fill="#ffe694" />
        </svg>
        <svg viewBox="0 0 8 18" width="10" height="20" class="home-chain-svg">
          <rect x="2" y="0" width="4" height="6" fill="#201036" />
          <rect x="3" y="1" width="2" height="4" fill="#d9a452" />
          <rect x="3" y="4" width="2" height="5" fill="#ffe694" />
          <rect x="2" y="8" width="4" height="6" fill="#201036" />
          <rect x="3" y="9" width="2" height="4" fill="#d9a452" />
          <rect x="2" y="14" width="4" height="4" fill="#ffe694" />
        </svg>
      </div>

      <!-- 3. Non-Rigid Stepped Ornamental Pixel Menu Panel -->
      <aside class="home-ornamental-panel" aria-label="Menu Utama Starlight Stray">
        <!-- Cute Perched Pixel Cat Silhouette on Top-Right Border (Swaying Tail!) -->
        <svg
          viewBox="0 0 26 20"
          width="42"
          height="32"
          class="home-perched-cat"
          :class="{ 'home-perched-cat--calm': progress.reduceMotion }"
          aria-hidden="true"
        >
          <!-- Gently Swaying Pixel Tail -->
          <g class="perched-cat-tail">
            <path d="M17 16h3v-2h2v-4h-2v3h-1v2h-2v1z" fill="#170a2b" />
            <path d="M18 15h2v-2h1v-2h-1v2h-2v2z" fill="#321854" />
          </g>
          <!-- Cat Body & Pointed Ears Silhouette -->
          <path d="M6 3h2v2h4V3h2v4h1v4h-1v2h2v5H5v-6h1v-2H5V6h1V3z" fill="#170a2b" />
          <path d="M7 5h1v1h4V5h1v3h1v3h-1v2h2v4H6v-5h1V5z" fill="#2c164a" />
          <!-- Warm Glowing Pixel Eyes -->
          <rect x="7" y="8" width="2" height="2" fill="#ffe478" />
          <rect x="11" y="8" width="2" height="2" fill="#ffe478" />
          <!-- Tiny Scarf Collar Accent -->
          <rect x="6" y="11" width="8" height="2" fill="#ff9ec4" />
        </svg>

        <!-- Corner Golden Star Rivets -->
        <span class="home-corner-star home-corner-star--tl" aria-hidden="true">✦</span>
        <span class="home-corner-star home-corner-star--tr" aria-hidden="true">✦</span>
        <span class="home-corner-star home-corner-star--bl" aria-hidden="true">✦</span>
        <span class="home-corner-star home-corner-star--br" aria-hidden="true">✦</span>

        <!-- 3A. Active Character Framed Avatar Header & Collection Pills -->
        <div class="home-char-header">
          <div class="home-avatar-frame" :title="activeCharacter.name">
            <img
              v-if="titleHeroPreview"
              :src="titleHeroPreview"
              :alt="activeCharacter.name"
              class="home-avatar-img"
            />
          </div>
          <div class="home-char-meta">
            <div class="home-char-name">{{ activeCharacter.name.toUpperCase() }}</div>
            <div class="home-char-biome">
              {{ BIOMES[hud.homeBiome].icon }} {{ BIOMES[hud.homeBiome].englishName }}
            </div>
            <div class="home-pill-row" aria-label="Ringkasan Koleksi">
              <span class="home-stat-pill home-stat-pill--shard">★ {{ totalShardsCollected }}/24 SHARDS</span>
              <span class="home-stat-pill home-stat-pill--stamp">🏆 {{ progress.unlockedAchievements.length }}/{{ ACHIEVEMENTS.length }} STAMPS</span>
            </div>
          </div>
        </div>

        <!-- 4. Expressive Hero Primary CTA with Periodic Pixel Shimmer Sweep -->
        <button
          type="button"
          class="pixel-btn home-cta-btn"
          :class="{ 'home-cta-btn--calm': progress.reduceMotion }"
          @click="$emit('startNew')"
        >
          <span class="home-cta-shimmer" aria-hidden="true" />
          <svg viewBox="0 0 16 16" width="16" height="16" class="home-cta-icon" aria-hidden="true">
            <path d="M4 2h2v1h2v1h2v1h2v2h1v2h-1v2h-2v1H8v1H6v1H4V2z" fill="#241033" />
            <path d="M5 4h2v1h2v1h2v4H9v1H7v1H5V4z" fill="#fff8d6" />
          </svg>
          <span>MULAI MAIN</span>
          <span class="home-cta-glint" aria-hidden="true">✦</span>
        </button>

        <!-- Expressive 2-Column Navigation Grid with Crisp 16x16 Colored Pixel-Art SVG Icons -->
        <nav class="home-nav-grid" aria-label="Navigasi Game">
          <button
            type="button"
            class="pixel-btn pixel-btn--secondary home-nav-btn"
            @click="$emit('openLevelSelect')"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" class="nav-px-icon" aria-hidden="true">
              <path d="M2 2h4v1h4V2h4v11h-4v1H6v-1H2V2z" fill="#201036" />
              <path d="M3 3h3v9H3V3zm4 1h2v9H7V4zm3-1h3v9h-3V3z" fill="#ffe08a" />
              <rect x="4" y="5" width="2" height="2" fill="#ff6b98" />
              <rect x="7" y="7" width="2" height="2" fill="#59c2ff" />
              <rect x="11" y="9" width="2" height="2" fill="#5cdba8" />
            </svg>
            <span>PILIH LEVEL</span>
          </button>

          <button
            type="button"
            class="pixel-btn pixel-btn--secondary home-nav-btn"
            @click="$emit('openCharacters')"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" class="nav-px-icon" aria-hidden="true">
              <rect x="3" y="3" width="3" height="3" fill="#ffb3d6" />
              <rect x="10" y="3" width="3" height="3" fill="#ffb3d6" />
              <rect x="1" y="7" width="3" height="3" fill="#ffb3d6" />
              <rect x="12" y="7" width="3" height="3" fill="#ffb3d6" />
              <path d="M5 7h6v2h1v4h-2v1H6v-1H4V9h1V7z" fill="#ff7eb3" />
              <rect x="6" y="9" width="4" height="3" fill="#ffe6f2" />
            </svg>
            <span>KARAKTER</span>
          </button>

          <button
            type="button"
            class="pixel-btn pixel-btn--secondary home-nav-btn"
            @click="$emit('openShop')"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" class="nav-px-icon" aria-hidden="true">
              <path d="M7 1h2v2h2v3h1v4h2v2H2v-2h2V6h1V3h2V1z" fill="#7d4cc2" />
              <path d="M7 2h2v3h1v4H6V5h1V2z" fill="#a874ff" />
              <rect x="4" y="9" width="8" height="2" fill="#ffe066" />
              <rect x="7" y="9" width="2" height="2" fill="#ffffff" />
            </svg>
            <span>TOKO AKSESORIS</span>
          </button>

          <button
            type="button"
            class="pixel-btn pixel-btn--secondary home-nav-btn home-nav-btn--stamps"
            @click="$emit('openAchievements')"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" class="nav-px-icon" aria-hidden="true">
              <path d="M4 2h8v2h2v4h-2v2H9v4l-1-1-1 1v-4H4V8H2V4h2V2z" fill="#ffbe3b" />
              <rect x="5" y="4" width="6" height="4" fill="#fff5b8" />
              <rect x="7" y="5" width="2" height="2" fill="#ff784f" />
            </svg>
            <span>PENCAPAIAN</span>
            <span
              v-if="hud.hasUnseenStamps"
              class="stamp-notif-dot"
              :class="{ 'stamp-notif-dot--calm': progress.reduceMotion }"
              title="Stempel baru terbuka!"
              aria-label="Stempel baru tersedia"
            />
          </button>

          <button
            type="button"
            class="pixel-btn pixel-btn--secondary home-nav-btn"
            @click="$emit('openPhotoStudio')"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" class="nav-px-icon" aria-hidden="true">
              <path d="M5 3h6v1h3v9H2V4h3V3z" fill="#4f74b8" />
              <rect x="3" y="5" width="10" height="7" fill="#7ab8ff" />
              <rect x="6" y="6" width="4" height="5" fill="#1d183b" />
              <rect x="7" y="7" width="2" height="3" fill="#9ef2ff" />
              <rect x="11" y="6" width="1" height="1" fill="#ffe875" />
            </svg>
            <span>STUDIO FOTO</span>
          </button>

          <button
            type="button"
            class="pixel-btn pixel-btn--secondary home-nav-btn"
            @click="$emit('openGuidebook')"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" class="nav-px-icon" aria-hidden="true">
              <path d="M2 3h5v1h2V3h5v10H9v1H7v-1H2V3z" fill="#2d7a66" />
              <rect x="3" y="4" width="4" height="8" fill="#fff6d6" />
              <rect x="9" y="4" width="4" height="8" fill="#ffecc2" />
              <rect x="4" y="6" width="2" height="1" fill="#7d5285" />
              <rect x="4" y="8" width="2" height="1" fill="#7d5285" />
              <rect x="10" y="6" width="2" height="1" fill="#7d5285" />
              <rect x="10" y="8" width="2" height="1" fill="#7d5285" />
            </svg>
            <span>BUKU PANDUAN</span>
          </button>
        </nav>

        <!-- 5. Protruding Notched Quest Scroll Banner (3 Simultaneous Daily Missions + 3/3 Bonus!) -->
        <div class="home-quest-scroll" aria-label="3 Misi Hari Ini">
          <div class="quest-scroll-notch quest-scroll-notch--left" aria-hidden="true" />
          <div class="quest-scroll-notch quest-scroll-notch--right" aria-hidden="true" />

          <div class="home-daily-top">
            <span class="daily-quest-tag">📜 MISI HARI INI ({{ dailyClaimedCount }}/3)</span>
            <span
              class="daily-bonus-pill"
              :class="{ 'daily-bonus-pill--done': progress.dailyMissions.bonusClaimed }"
              :title="`Total Misi Harian selesai: ${progress.totalDailyMissionsCompleted}`"
            >
              {{
                progress.dailyMissions.bonusClaimed
                  ? `✓ Bonus +${ALL_DAILY_BONUS_FISH}🐟`
                  : `3/3 Bonus (+${ALL_DAILY_BONUS_FISH}🐟)`
              }}
            </span>
          </div>

          <div class="home-daily-list">
            <div v-for="m in dailyMissionCards" :key="m.slot.questId" class="home-daily-row">
              <div class="home-daily-left">
                <div class="home-daily-title-row">
                  <span class="home-daily-title">{{ m.def.icon }} {{ m.def.title }}</span>
                  <span class="daily-quest-count">{{ m.clamped }}/{{ m.def.target }}</span>
                </div>
                <div
                  class="quest-seg-bar"
                  role="progressbar"
                  :aria-valuenow="m.pct"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <span
                    v-for="seg in 10"
                    :key="seg"
                    class="quest-seg-block"
                    :class="{ 'quest-seg-block--filled': seg <= m.filledSegs }"
                  />
                </div>
              </div>
              <button
                v-if="m.completed && !m.slot.claimed"
                type="button"
                class="pixel-btn daily-claim-btn"
                @click="$emit('claimDailyQuest', m.index)"
              >
                🎁 +{{ m.def.rewardFish }}🐟
              </button>
              <span v-else-if="m.slot.claimed" class="daily-claimed-chip">✓</span>
              <span v-else class="daily-reward-chip">+{{ m.def.rewardFish }}🐟</span>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Subtle bottom-right interactive Camp hint (clicks pass straight to canvas characters!) -->
    <div class="home-camp-hint" aria-hidden="true">
      🐾 Klik karakter di camp untuk menyapa
    </div>
  </div>

  <!-- ====================================================================== -->
  <!-- 2. LEVEL SELECT SCREEN (12 Levels Across 6 Biomes + Secret Finale Bosses) -->
  <!-- ====================================================================== -->
  <div v-else-if="hud.screen === 'levelSelect'" class="overlay-backdrop">
    <div class="pixel-panel modal-card modal-card--levels">
      <div class="modal-header">
        <h2 class="modal-title">🗺️ PILIH LEVEL (12 TAHAP • 6 DUNIA)</h2>
        <div class="title-badges">
          <span class="highscore-chip">★ {{ hud.highScore }}</span>
          <span class="fish-chip">🐟 {{ progress.fishBank }}</span>
        </div>
      </div>

      <div class="level-select-scroll">
        <div class="level-grid">
          <div
            v-for="lvl in mainLevels"
            :key="lvl.id"
            class="level-card"
            :class="{ 'level-card--locked': lvl.id > progress.unlockedLevel }"
            @click="lvl.id <= progress.unlockedLevel && $emit('selectLevel', lvl.id)"
          >
            <div class="level-card__top">
              <span class="level-num">LVL {{ lvl.id }}</span>
              <span
                class="biome-pill"
                :style="{
                  backgroundColor: BIOMES[lvl.biome].badgeBg,
                  borderColor: BIOMES[lvl.biome].badgeBorder
                }"
              >
                {{ BIOMES[lvl.biome].icon }} {{ BIOMES[lvl.biome].name }}
              </span>
            </div>

            <div class="level-card__name-row">
              <span class="level-card__name">{{ lvl.name }}</span>
              <span v-if="lvl.id > progress.unlockedLevel" class="lock-badge">🔒</span>
              <span v-else class="rating-stars">
                <span
                  v-for="s in 3"
                  :key="s"
                  :class="s <= (progress.levelRecords[lvl.id]?.rating ?? 0) ? 'star-on' : 'star-off'"
                >★</span>
              </span>
            </div>

            <div class="level-card__sub">{{ lvl.subtitle }}</div>

            <div class="level-card__records">
              <span>⭐ {{ progress.levelRecords[lvl.id]?.bestStars ?? 0 }}/{{ getLevelTotal(lvl, 'star') }}</span>
              <span>🐟 {{ progress.levelRecords[lvl.id]?.bestFish ?? 0 }}/{{ getLevelTotal(lvl, 'fish') }}</span>
              <span class="level-shards-strip" title="Starlight Shards (3 per level)">
                <span class="shard-bracket">[</span>
                <span
                  v-for="(found, sIdx) in getLevelShardTuple(lvl.id)"
                  :key="sIdx"
                  class="shard-gem"
                  :class="found ? 'shard-gem--on' : 'shard-gem--off'"
                >{{ found ? '★' : '☆' }}</span>
                <span class="shard-bracket">]</span>
              </span>
            </div>

            <!-- Best Speedrun Time & Rank (S / A / B) -->
            <div v-if="progress.bestTimes[lvl.id]" class="level-speedrun-row">
              <span class="level-best-time">⏱️ {{ formatSpeedrunTime(progress.bestTimes[lvl.id]!) }}</span>
              <span
                v-if="progress.levelRanks[lvl.id]"
                class="rank-badge"
                :class="`rank-badge--${progress.levelRanks[lvl.id]}`"
              >
                RANK {{ progress.levelRanks[lvl.id] }}
              </span>
            </div>

            <!-- Time Trial Mode Button for Cleared Levels -->
            <div v-if="(progress.levelRecords[lvl.id]?.rating ?? 0) >= 1" class="level-tt-row">
              <button
                type="button"
                class="level-tt-btn"
                @click.stop="$emit('startTimeTrial', lvl.id)"
              >
                ⏱️ Tantangan Waktu
                <span v-if="progress.timeTrials[lvl.id]" class="level-tt-best">
                  {{ medalIcon(progress.timeTrials[lvl.id]?.medal) }} {{ formatTimeTrial(progress.timeTrials[lvl.id]!.bestTimeMs) }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- ★ SECRET FINALE SECTION (Levels 13 & 14 • Unlocked at Rank S >= 3) -->
        <div class="secret-finale-section">
          <div class="secret-finale-header">
            <span class="secret-finale-title">★ SECRET FINALE • BOSS STAGES</span>
            <span
              class="secret-finale-badge"
              :class="secretFinaleUnlocked ? 'secret-finale-badge--open' : 'secret-finale-badge--locked'"
            >
              {{ secretFinaleUnlocked ? `✓ TERBUKA • Rank S: ${rankSCount}` : `🔒 Rank S: ${rankSCount}/3` }}
            </span>
          </div>

          <div class="secret-finale-grid">
            <div
              v-for="lvl in secretFinaleLevels"
              :key="lvl.id"
              class="level-card level-card--boss"
              :class="{ 'level-card--locked': !secretFinaleUnlocked }"
              @click="secretFinaleUnlocked && $emit('selectLevel', lvl.id)"
            >
              <div class="level-card__top">
                <span class="level-num">BOSS LVL {{ lvl.id }}</span>
                <span
                  class="biome-pill"
                  :style="{
                    backgroundColor: BIOMES[lvl.biome].badgeBg,
                    borderColor: BIOMES[lvl.biome].badgeBorder
                  }"
                >
                  {{ BIOMES[lvl.biome].icon }} {{ BIOMES[lvl.biome].name }}
                </span>
              </div>

              <div class="level-card__name-row">
                <span class="level-card__name">{{ lvl.name }}</span>
                <span v-if="!secretFinaleUnlocked" class="lock-badge">🔒</span>
                <span v-else class="rating-stars">
                  <span
                    v-for="s in 3"
                    :key="s"
                    :class="s <= (progress.levelRecords[lvl.id]?.rating ?? 0) ? 'star-on' : 'star-off'"
                  >★</span>
                </span>
              </div>

              <div class="level-card__sub">{{ lvl.subtitle }}</div>
              <div class="boss-reward-hint">
                {{ lvl.id === 13 ? '🎁 +250 🐟 • Eclipse Halo' : '🎁 +500 🐟 • Nebula Sovereign Cape' }}
              </div>

              <div v-if="progress.bestTimes[lvl.id]" class="level-speedrun-row">
                <span class="level-best-time">⏱️ {{ formatSpeedrunTime(progress.bestTimes[lvl.id]!) }}</span>
                <span
                  v-if="progress.levelRanks[lvl.id]"
                  class="rank-badge"
                  :class="`rank-badge--${progress.levelRanks[lvl.id]}`"
                >
                  RANK {{ progress.levelRanks[lvl.id] }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer modal-footer--between">
        <button type="button" class="pixel-btn pixel-btn--secondary" @click="$emit('openTitle')">
          ◀ Menu Utama
        </button>
        <button
          v-if="(progress.levelRecords[12]?.rating ?? 0) >= 1 || (progress.levelRecords[8]?.rating ?? 0) >= 1"
          type="button"
          class="pixel-btn"
          @click="$emit('openEnding')"
        >
          🌕 Putar Epilog Tamat
        </button>
      </div>
    </div>
  </div>

  <!-- ====================================================================== -->
  <!-- 3. DEDICATED CHARACTER SELECTION SCREEN (🐾 Karakter + Live Try-On Preview) -->
  <!-- ====================================================================== -->
  <div v-else-if="hud.screen === 'characters'" class="overlay-backdrop">
    <div class="pixel-panel modal-card modal-card--wide">
      <div class="modal-header">
        <h2 class="modal-title">🐾 PILIH KARAKTER HEWAN</h2>
        <div class="title-badges">
          <span class="fish-chip fish-chip--lg">🐟 {{ progress.fishBank }} Ikan Emas</span>
        </div>
      </div>

      <!-- Panel Live Preview Karakter (with currently equipped Scarf + Hat + Cape & idle animation) -->
      <div class="shop-preview-bar" :class="{ 'shop-preview-bar--tryon': hasCharPreviewChange }">
        <div class="live-preview-box" :class="{ 'live-preview-box--tryon': hasCharPreviewChange }">
          <img
            v-if="charLivePreviewUrl"
            :src="charLivePreviewUrl"
            :alt="effectiveCharPreviewDef.name"
            class="live-preview-img"
          />
        </div>

        <div class="live-preview-details">
          <div class="preview-title-row">
            <span class="live-preview-name">{{ effectiveCharPreviewDef.name }}</span>
            <span v-if="isCharPreviewLocked" class="tryon-badge">👁️ PRATINJAU (BELUM DIMILIKI)</span>
            <span v-else-if="hasCharPreviewChange" class="tryon-badge tryon-badge--owned">👁️ PRATINJAU</span>
          </div>
          <div class="live-preview-tip">{{ effectiveCharPreviewDef.description }}</div>
          <div class="live-preview-perk">
            <span class="perk-pill-tag">✨ {{ effectiveCharPreviewDef.perkTitle }}</span>
            <span class="perk-pill-desc">{{ effectiveCharPreviewDef.perkDesc }}</span>
          </div>
          <div class="preview-controls-row">
            <button
              type="button"
              class="pixel-btn pixel-btn--ghost preview-mini-btn"
              @click="charPreviewFacing = charPreviewFacing === 'right' ? 'left' : 'right'"
            >
              🔄 Balik Arah
            </button>
            <button
              v-if="hasCharPreviewChange"
              type="button"
              class="pixel-btn pixel-btn--ghost preview-mini-btn"
              @click="resetCharPreview"
            >
              ↺ Reset
            </button>
            <span class="preview-hint-inline">Klik kartu hewan mana saja untuk coba lihat!</span>
          </div>
        </div>
      </div>

      <div class="char-scroll-area">
        <!-- Category 1: Regular Characters (Buy with Golden Fish) -->
        <div class="section-heading">
          <span>🐱 KARAKTER REGULER</span>
          <span class="section-sub">Klik kartu untuk pratinjau • Beli dengan Ikan Emas</span>
        </div>
        <div class="char-grid char-grid--five">
          <div
            v-for="ch in regularCharacters"
            :key="ch.id"
            class="char-card char-card--clickable"
            :class="{
              'char-card--selected': progress.selectedCharacter === ch.id,
              'char-card--locked': !isCharUnlocked(ch.id),
              'char-card--preview': previewChar === ch.id
            }"
            @click="tryOnCharacter(ch.id)"
          >
            <div class="char-card__head">
              <span class="char-cat">{{ ch.category }}</span>
              <span v-if="previewChar === ch.id" class="char-status char-status--preview">COBA</span>
              <span v-else-if="progress.selectedCharacter === ch.id" class="char-status char-status--active">DIPAKAI</span>
              <span v-else-if="isCharUnlocked(ch.id)" class="char-status char-status--owned">TERBUKA</span>
              <span v-else class="char-status char-status--cost">🐟 {{ ch.cost }}</span>
            </div>

            <div class="char-sprite-stage">
              <img
                v-if="characterPreviews[ch.id]"
                :src="characterPreviews[ch.id]"
                :alt="ch.name"
                class="char-sprite-img"
              />
            </div>

            <div class="char-name">{{ ch.name }}</div>
            <p class="char-desc">{{ ch.description }}</p>
            <div class="char-perk-badge" :title="ch.perkDesc">✨ {{ ch.perkTitle }}</div>
            <p class="char-perk-desc-mini">{{ ch.perkDesc }}</p>

            <button
              v-if="progress.selectedCharacter === ch.id"
              type="button"
              class="pixel-btn char-action-btn"
              disabled
              @click.stop
            >
              ✓ Aktif
            </button>
            <button
              v-else-if="isCharUnlocked(ch.id)"
              type="button"
              class="pixel-btn pixel-btn--secondary char-action-btn"
              @click.stop="handleActionSelectChar(ch.id)"
            >
              Pilih
            </button>
            <button
              v-else
              type="button"
              class="pixel-btn char-action-btn"
              :disabled="progress.fishBank < ch.cost"
              @click.stop="handleActionUnlockChar(ch.id)"
            >
              {{ progress.fishBank >= ch.cost ? `Beli (🐟 ${ch.cost})` : `Perlu 🐟 ${ch.cost}` }}
            </button>
          </div>
        </div>

        <!-- Category 2: Special Mission Characters -->
        <div class="section-heading section-heading--special">
          <span>🏆 KARAKTER SPESIAL (MISI KHUSUS)</span>
          <span class="section-sub">Klik kartu untuk pratinjau • Terbuka otomatis via misi</span>
        </div>
        <div class="char-grid char-grid--three">
          <div
            v-for="ch in specialCharacters"
            :key="ch.id"
            class="char-card char-card--special char-card--clickable"
            :class="{
              'char-card--selected': progress.selectedCharacter === ch.id,
              'char-card--locked': !isCharUnlocked(ch.id),
              'char-card--preview': previewChar === ch.id
            }"
            @click="tryOnCharacter(ch.id)"
          >
            <div class="char-card__head">
              <span class="mission-trophy-badge">🏆 MISI KHUSUS</span>
              <span v-if="previewChar === ch.id" class="char-status char-status--preview">COBA</span>
              <span v-else-if="progress.selectedCharacter === ch.id" class="char-status char-status--active">DIPAKAI</span>
              <span v-else-if="isCharUnlocked(ch.id)" class="char-status char-status--owned">SELESAI</span>
              <span v-else class="char-status char-status--mission">TERKUNCI</span>
            </div>

            <div class="special-card-mid">
              <div class="char-sprite-stage char-sprite-stage--sm">
                <img
                  v-if="characterPreviews[ch.id]"
                  :src="characterPreviews[ch.id]"
                  :alt="ch.name"
                  class="char-sprite-img"
                />
              </div>
              <div class="special-card-info">
                <div class="char-name">{{ ch.name }}</div>
                <div class="mission-desc">{{ ch.missionDesc }}</div>
                <div class="char-perk-badge char-perk-badge--inline" :title="ch.perkDesc">✨ {{ ch.perkTitle }}</div>
                <p class="char-perk-desc-mini">{{ ch.perkDesc }}</p>
              </div>
            </div>

            <div class="mission-progress-wrap">
              <div class="mission-progress-track">
                <div
                  class="mission-progress-fill"
                  :style="{
                    width: `${Math.min(100, Math.round((getMissionInfo(ch.id).current / getMissionInfo(ch.id).target) * 100))}%`
                  }"
                />
              </div>
              <div class="mission-progress-label">{{ getMissionInfo(ch.id).label }}</div>
            </div>

            <button
              v-if="progress.selectedCharacter === ch.id"
              type="button"
              class="pixel-btn char-action-btn"
              disabled
              @click.stop
            >
              ✓ Aktif
            </button>
            <button
              v-else-if="isCharUnlocked(ch.id)"
              type="button"
              class="pixel-btn pixel-btn--secondary char-action-btn"
              @click.stop="handleActionSelectChar(ch.id)"
            >
              Pilih Karakter
            </button>
            <button v-else type="button" class="pixel-btn pixel-btn--ghost char-action-btn" disabled @click.stop>
              🔒 {{ getMissionInfo(ch.id).label }}
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer modal-footer--between">
        <button type="button" class="pixel-btn pixel-btn--secondary" @click="leaveCharacters('openTitle')">◀ Menu Utama</button>
        <div class="title-tools">
          <button type="button" class="pixel-btn pixel-btn--secondary" @click="leaveCharacters('openShop')">🎩 Toko Aksesoris</button>
          <button type="button" class="pixel-btn" @click="leaveCharacters('startNew')">▶ Main</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ====================================================================== -->
  <!-- 4. DEDICATED ACCESSORY SHOP (🎩 Toko Aksesoris + Live Try-On Preview!) -->
  <!-- ====================================================================== -->
  <div v-else-if="hud.screen === 'shop'" class="overlay-backdrop">
    <div class="pixel-panel modal-card modal-card--wide">
      <div class="modal-header">
        <h2 class="modal-title">🎩 TOKO AKSESORIS</h2>
        <span class="fish-chip fish-chip--lg">🐟 {{ progress.fishBank }} Ikan Emas</span>
      </div>

      <!-- Live Try-On Character Preview Box -->
      <div class="shop-preview-bar" :class="{ 'shop-preview-bar--tryon': hasShopPreviewChanges }">
        <div class="live-preview-box" :class="{ 'live-preview-box--tryon': hasShopPreviewChanges }">
          <img
            v-if="shopLivePreviewUrl"
            :src="shopLivePreviewUrl"
            :alt="activeCharacter.name"
            class="live-preview-img"
          />
        </div>

        <div class="live-preview-details">
          <div class="preview-title-row">
            <span class="live-preview-name">{{ activeCharacter.name }}</span>
            <span v-if="hasUnownedShopPreview" class="tryon-badge">👁️ PRATINJAU (BELUM DIMILIKI)</span>
            <span v-else-if="hasShopPreviewChanges" class="tryon-badge tryon-badge--owned">👁️ PRATINJAU</span>
          </div>

          <div class="equipped-tags">
            <span class="eq-tag" :class="{ 'eq-tag--tryon': previewScarf !== null }">🧣 {{ effectiveShopScarf.name }}</span>
            <span class="eq-tag" :class="{ 'eq-tag--tryon': previewHat !== null }">🎩 {{ effectiveShopHat.name }}</span>
            <span class="eq-tag" :class="{ 'eq-tag--tryon': previewCape !== null }">🧥 {{ effectiveShopCape.name }}</span>
            <span class="eq-tag" :class="{ 'eq-tag--tryon': previewHeadAcc !== null }">🌿 {{ effectiveShopHeadAcc.name }}</span>
            <span class="eq-tag" :class="{ 'eq-tag--tryon': previewFaceAcc !== null }">🕶️ {{ effectiveShopFaceAcc.name }}</span>
          </div>

          <div class="preview-controls-row">
            <button
              type="button"
              class="pixel-btn pixel-btn--ghost preview-mini-btn"
              @click="shopPreviewFacing = shopPreviewFacing === 'right' ? 'left' : 'right'"
            >
              🔄 Balik Arah
            </button>
            <button
              v-if="hasShopPreviewChanges"
              type="button"
              class="pixel-btn pixel-btn--ghost preview-mini-btn"
              @click="resetShopPreview"
            >
              ↺ Reset
            </button>
            <span class="preview-hint-inline">Klik gambar kartu mana saja untuk coba pakai!</span>
          </div>
        </div>

        <button
          type="button"
          class="pixel-btn pixel-btn--ghost shop-switch-char-btn"
          @click="leaveShop('openCharacters')"
        >
          🐾 Ganti Hewan
        </button>
      </div>

      <!-- 5 Separate Section Tabs (Scarf, Hat, Cape, Head Acc, Face/Eyewear) -->
      <div class="shop-tabs shop-tabs--five" role="tablist" aria-label="Kategori Aksesoris">
        <button
          type="button"
          role="tab"
          class="shop-tab-btn"
          :class="{ 'shop-tab-btn--active': activeShopTab === 'scarf' }"
          :aria-selected="activeShopTab === 'scarf'"
          @click="activeShopTab = 'scarf'"
        >
          🧣 Syal ({{ progress.ownedScarves.length }}/{{ SCARF_COLORS.length }})
        </button>
        <button
          type="button"
          role="tab"
          class="shop-tab-btn"
          :class="{ 'shop-tab-btn--active': activeShopTab === 'hat' }"
          :aria-selected="activeShopTab === 'hat'"
          @click="activeShopTab = 'hat'"
        >
          🎩 Topi ({{ progress.ownedHats.length - 1 }}/{{ HATS.length - 1 }})
        </button>
        <button
          type="button"
          role="tab"
          class="shop-tab-btn"
          :class="{ 'shop-tab-btn--active': activeShopTab === 'cape' }"
          :aria-selected="activeShopTab === 'cape'"
          @click="activeShopTab = 'cape'"
        >
          🧥 Jubah ({{ progress.ownedCapes.length - 1 }}/{{ CAPES.length - 1 }})
        </button>
        <button
          type="button"
          role="tab"
          class="shop-tab-btn"
          :class="{ 'shop-tab-btn--active': activeShopTab === 'head_acc' }"
          :aria-selected="activeShopTab === 'head_acc'"
          @click="activeShopTab = 'head_acc'"
        >
          🌿 Kepala ({{ progress.ownedHeadAccs.length - 1 }}/{{ HEAD_ACCS.length - 1 }})
        </button>
        <button
          type="button"
          role="tab"
          class="shop-tab-btn"
          :class="{ 'shop-tab-btn--active': activeShopTab === 'face' }"
          :aria-selected="activeShopTab === 'face'"
          @click="activeShopTab = 'face'"
        >
          🕶️ Wajah ({{ progress.ownedFaceAccs.length - 1 }}/{{ FACE_ACCS.length - 1 }})
        </button>
      </div>

      <!-- SECTION 1: SCARVES -->
      <div v-if="activeShopTab === 'scarf'" class="shop-item-grid">
        <div
          v-for="scarf in SCARF_COLORS"
          :key="scarf.id"
          class="shop-card shop-card--clickable"
          :class="{
            'shop-card--equipped': progress.selectedScarf === scarf.id,
            'shop-card--owned': progress.ownedScarves.includes(scarf.id),
            'shop-card--preview': previewScarf === scarf.id
          }"
          @click="tryOnScarf(scarf.id)"
        >
          <div class="shop-card__top">
            <span class="swatch-dot" :style="{ backgroundColor: scarf.swatch }" />
            <span v-if="previewScarf === scarf.id" class="char-status char-status--preview">COBA</span>
            <span v-else-if="progress.selectedScarf === scarf.id" class="char-status char-status--active">DIPAKAI</span>
            <span v-else-if="progress.ownedScarves.includes(scarf.id)" class="char-status char-status--owned">DIMILIKI</span>
            <span v-else-if="scarf.unlockStampId" class="char-status char-status--shard">⚡ 8 RANK S</span>
            <span v-else-if="scarf.shardUnlockBiome" class="char-status char-status--shard">💎 BIOME REWARD</span>
            <span v-else class="char-status char-status--cost">🐟 {{ scarf.cost }}</span>
          </div>

          <div class="shop-icon-stage">
            <img v-if="scarfIcons[scarf.id]" :src="scarfIcons[scarf.id]" :alt="scarf.name" class="shop-icon-img" />
          </div>

          <div class="shop-item-name">{{ scarf.name }}</div>
          <div class="shop-item-sub">
            {{ scarf.unlockStampId ? 'Mastery Speedrun' : scarf.shardUnlockBiome ? 'Biome Reward • Dermaga' : 'Jejak Dash serasi' }}
          </div>

          <button
            v-if="progress.selectedScarf === scarf.id"
            type="button"
            class="pixel-btn char-action-btn"
            disabled
            @click.stop
          >
            ✓ Dipakai
          </button>
          <button
            v-else-if="progress.ownedScarves.includes(scarf.id)"
            type="button"
            class="pixel-btn pixel-btn--secondary char-action-btn"
            @click.stop="handleActionScarf(scarf.id)"
          >
            Pakai
          </button>
          <button
            v-else-if="scarf.unlockStampId"
            type="button"
            class="pixel-btn pixel-btn--ghost char-action-btn"
            disabled
            @click.stop
          >
            🔒 Stamp: Lightning
          </button>
          <button
            v-else-if="scarf.shardUnlockBiome"
            type="button"
            class="pixel-btn pixel-btn--ghost char-action-btn"
            disabled
            @click.stop
          >
            🔒 6 Shard {{ BIOMES[scarf.shardUnlockBiome].icon }} ({{ countBiomeCollectedShards(scarf.shardUnlockBiome, progress) }}/6)
          </button>
          <button
            v-else
            type="button"
            class="pixel-btn char-action-btn"
            :disabled="progress.fishBank < scarf.cost"
            @click.stop="handleActionScarf(scarf.id)"
          >
            {{ progress.fishBank >= scarf.cost ? `Beli (🐟 ${scarf.cost})` : `Perlu 🐟 ${scarf.cost}` }}
          </button>
        </div>
      </div>

      <!-- SECTION 2: HATS -->
      <div v-else-if="activeShopTab === 'hat'" class="shop-item-grid">
        <div
          v-for="hat in HATS"
          :key="hat.id"
          class="shop-card shop-card--clickable"
          :class="{
            'shop-card--equipped': progress.selectedHat === hat.id,
            'shop-card--owned': progress.ownedHats.includes(hat.id),
            'shop-card--preview': previewHat === hat.id
          }"
          @click="tryOnHat(hat.id)"
        >
          <div class="shop-card__top">
            <span class="swatch-dot" :style="{ backgroundColor: hat.swatch }" />
            <span v-if="previewHat === hat.id" class="char-status char-status--preview">COBA</span>
            <span v-else-if="progress.selectedHat === hat.id" class="char-status char-status--active">DIPAKAI</span>
            <span v-else-if="progress.ownedHats.includes(hat.id)" class="char-status char-status--owned">DIMILIKI</span>
            <span v-else-if="hat.shardUnlockBiome" class="char-status char-status--shard">💎 BIOME REWARD</span>
            <span v-else class="char-status char-status--cost">🐟 {{ hat.cost }}</span>
          </div>

          <div class="shop-icon-stage">
            <img v-if="hatIcons[hat.id]" :src="hatIcons[hat.id]" :alt="hat.name" class="shop-icon-img" />
            <span v-else class="none-icon">∅</span>
          </div>

          <div class="shop-item-name">{{ hat.name }}</div>
          <div class="shop-item-sub">{{ hat.groupName }}</div>

          <button
            v-if="progress.selectedHat === hat.id"
            type="button"
            class="pixel-btn char-action-btn"
            disabled
            @click.stop
          >
            ✓ Dipakai
          </button>
          <button
            v-else-if="progress.ownedHats.includes(hat.id)"
            type="button"
            class="pixel-btn pixel-btn--secondary char-action-btn"
            @click.stop="handleActionHat(hat.id)"
          >
            Pakai
          </button>
          <button
            v-else-if="hat.shardUnlockBiome"
            type="button"
            class="pixel-btn pixel-btn--ghost char-action-btn"
            disabled
            @click.stop
          >
            🔒 6 Shard {{ BIOMES[hat.shardUnlockBiome].icon }} ({{ countBiomeCollectedShards(hat.shardUnlockBiome, progress) }}/6)
          </button>
          <button
            v-else
            type="button"
            class="pixel-btn char-action-btn"
            :disabled="progress.fishBank < hat.cost"
            @click.stop="handleActionHat(hat.id)"
          >
            {{ progress.fishBank >= hat.cost ? `Beli (🐟 ${hat.cost})` : `Perlu 🐟 ${hat.cost}` }}
          </button>
        </div>
      </div>

      <!-- SECTION 3: CAPES -->
      <div v-else-if="activeShopTab === 'cape'" class="shop-item-grid">
        <div
          v-for="cape in CAPES"
          :key="cape.id"
          class="shop-card shop-card--clickable"
          :class="{
            'shop-card--equipped': progress.selectedCape === cape.id,
            'shop-card--owned': progress.ownedCapes.includes(cape.id),
            'shop-card--preview': previewCape === cape.id
          }"
          @click="tryOnCape(cape.id)"
        >
          <div class="shop-card__top">
            <span class="swatch-dot" :style="{ backgroundColor: cape.swatch }" />
            <span v-if="previewCape === cape.id" class="char-status char-status--preview">COBA</span>
            <span v-else-if="progress.selectedCape === cape.id" class="char-status char-status--active">DIPAKAI</span>
            <span v-else-if="progress.ownedCapes.includes(cape.id)" class="char-status char-status--owned">DIMILIKI</span>
            <span v-else-if="cape.shardUnlockBiome" class="char-status char-status--shard">💎 BIOME REWARD</span>
            <span v-else-if="cape.bossUnlockLevelId" class="char-status char-status--shard">👑 BOSS LVL {{ cape.bossUnlockLevelId }}</span>
            <span v-else class="char-status char-status--cost">🐟 {{ cape.cost }}</span>
          </div>

          <div class="shop-icon-stage">
            <img v-if="capeIcons[cape.id]" :src="capeIcons[cape.id]" :alt="cape.name" class="shop-icon-img" />
            <span v-else class="none-icon">∅</span>
          </div>

          <div class="shop-item-name">{{ cape.name }}</div>
          <div class="shop-item-sub">{{ cape.groupName }}</div>

          <button
            v-if="progress.selectedCape === cape.id"
            type="button"
            class="pixel-btn char-action-btn"
            disabled
            @click.stop
          >
            ✓ Dipakai
          </button>
          <button
            v-else-if="progress.ownedCapes.includes(cape.id)"
            type="button"
            class="pixel-btn pixel-btn--secondary char-action-btn"
            @click.stop="handleActionCape(cape.id)"
          >
            Pakai
          </button>
          <button
            v-else-if="cape.shardUnlockBiome"
            type="button"
            class="pixel-btn pixel-btn--ghost char-action-btn"
            disabled
            @click.stop
          >
            🔒 6 Shard {{ BIOMES[cape.shardUnlockBiome].icon }} ({{ countBiomeCollectedShards(cape.shardUnlockBiome, progress) }}/6)
          </button>
          <button
            v-else-if="cape.bossUnlockLevelId"
            type="button"
            class="pixel-btn pixel-btn--ghost char-action-btn"
            disabled
            @click.stop
          >
            🔒 Kalahkan Boss Lvl {{ cape.bossUnlockLevelId }}
          </button>
          <button
            v-else
            type="button"
            class="pixel-btn char-action-btn"
            :disabled="progress.fishBank < cape.cost"
            @click.stop="handleActionCape(cape.id)"
          >
            {{ progress.fishBank >= cape.cost ? `Beli (🐟 ${cape.cost})` : `Perlu 🐟 ${cape.cost}` }}
          </button>
        </div>
      </div>

      <!-- SECTION 4: HEAD ACCESSORIES (`head_acc`) -->
      <div v-else-if="activeShopTab === 'head_acc'" class="shop-item-grid">
        <div
          v-for="acc in HEAD_ACCS"
          :key="acc.id"
          class="shop-card shop-card--clickable"
          :class="{
            'shop-card--equipped': progress.selectedHeadAcc === acc.id,
            'shop-card--owned': progress.ownedHeadAccs.includes(acc.id),
            'shop-card--preview': previewHeadAcc === acc.id
          }"
          @click="tryOnHeadAcc(acc.id)"
        >
          <div class="shop-card__top">
            <span class="swatch-dot" :style="{ backgroundColor: acc.swatch }" />
            <span v-if="previewHeadAcc === acc.id" class="char-status char-status--preview">COBA</span>
            <span v-else-if="progress.selectedHeadAcc === acc.id" class="char-status char-status--active">DIPAKAI</span>
            <span v-else-if="progress.ownedHeadAccs.includes(acc.id)" class="char-status char-status--owned">DIMILIKI</span>
            <span v-else-if="acc.bossUnlockLevelId" class="char-status char-status--shard">👑 BOSS LVL {{ acc.bossUnlockLevelId }}</span>
            <span v-else class="char-status char-status--cost">🐟 {{ acc.cost }}</span>
          </div>

          <div class="shop-icon-stage">
            <img v-if="headAccIcons[acc.id]" :src="headAccIcons[acc.id]" :alt="acc.name" class="shop-icon-img" />
            <span v-else class="none-icon">∅</span>
          </div>

          <div class="shop-item-name">{{ acc.name }}</div>
          <div class="shop-item-sub">{{ acc.groupName }}</div>

          <button
            v-if="progress.selectedHeadAcc === acc.id"
            type="button"
            class="pixel-btn char-action-btn"
            disabled
            @click.stop
          >
            ✓ Dipakai
          </button>
          <button
            v-else-if="progress.ownedHeadAccs.includes(acc.id)"
            type="button"
            class="pixel-btn pixel-btn--secondary char-action-btn"
            @click.stop="handleActionHeadAcc(acc.id)"
          >
            Pakai
          </button>
          <button
            v-else-if="acc.bossUnlockLevelId"
            type="button"
            class="pixel-btn pixel-btn--ghost char-action-btn"
            disabled
            @click.stop
          >
            🔒 Kalahkan Boss Lvl {{ acc.bossUnlockLevelId }}
          </button>
          <button
            v-else
            type="button"
            class="pixel-btn char-action-btn"
            :disabled="progress.fishBank < acc.cost"
            @click.stop="handleActionHeadAcc(acc.id)"
          >
            {{ progress.fishBank >= acc.cost ? `Beli (🐟 ${acc.cost})` : `Perlu 🐟 ${acc.cost}` }}
          </button>
        </div>
      </div>

      <!-- SECTION 5: FACE / EYEWEAR (`face`) -->
      <div v-else class="shop-item-grid">
        <div
          v-for="face in FACE_ACCS"
          :key="face.id"
          class="shop-card shop-card--clickable"
          :class="{
            'shop-card--equipped': progress.selectedFaceAcc === face.id,
            'shop-card--owned': progress.ownedFaceAccs.includes(face.id),
            'shop-card--preview': previewFaceAcc === face.id
          }"
          @click="tryOnFaceAcc(face.id)"
        >
          <div class="shop-card__top">
            <span class="swatch-dot" :style="{ backgroundColor: face.swatch }" />
            <span v-if="previewFaceAcc === face.id" class="char-status char-status--preview">COBA</span>
            <span v-else-if="progress.selectedFaceAcc === face.id" class="char-status char-status--active">DIPAKAI</span>
            <span v-else-if="progress.ownedFaceAccs.includes(face.id)" class="char-status char-status--owned">DIMILIKI</span>
            <span v-else class="char-status char-status--cost">🐟 {{ face.cost }}</span>
          </div>

          <div class="shop-icon-stage">
            <img v-if="faceAccIcons[face.id]" :src="faceAccIcons[face.id]" :alt="face.name" class="shop-icon-img" />
            <span v-else class="none-icon">∅</span>
          </div>

          <div class="shop-item-name">{{ face.name }}</div>
          <div class="shop-item-sub">{{ face.groupName }}</div>

          <button
            v-if="progress.selectedFaceAcc === face.id"
            type="button"
            class="pixel-btn char-action-btn"
            disabled
            @click.stop
          >
            ✓ Dipakai
          </button>
          <button
            v-else-if="progress.ownedFaceAccs.includes(face.id)"
            type="button"
            class="pixel-btn pixel-btn--secondary char-action-btn"
            @click.stop="handleActionFaceAcc(face.id)"
          >
            Pakai
          </button>
          <button
            v-else
            type="button"
            class="pixel-btn char-action-btn"
            :disabled="progress.fishBank < face.cost"
            @click.stop="handleActionFaceAcc(face.id)"
          >
            {{ progress.fishBank >= face.cost ? `Beli (🐟 ${face.cost})` : `Perlu 🐟 ${face.cost}` }}
          </button>
        </div>
      </div>

      <div class="modal-footer modal-footer--between">
        <button type="button" class="pixel-btn pixel-btn--secondary" @click="leaveShop('openTitle')">◀ Menu Utama</button>
        <button type="button" class="pixel-btn" @click="leaveShop('startNew')">▶ Main Sekarang</button>
      </div>
    </div>
  </div>

  <!-- ====================================================================== -->
  <!-- 5. PIXEL STAMP BOOK MODAL (Modular Achievement System) -->
  <!-- ====================================================================== -->
  <StampBookModal
    v-else-if="hud.screen === 'achievements'"
    :progress="progress"
    @close="$emit('openTitle')"
  />

  <!-- ====================================================================== -->
  <!-- 5B. HD PIXEL POSTCARD PHOTO STUDIO (📸 Studio Foto • 4x HD .PNG!) -->
  <!-- ====================================================================== -->
  <div v-else-if="hud.screen === 'photoStudio'" class="overlay-backdrop">
    <div class="pixel-panel modal-card modal-card--wide">
      <div class="modal-header">
        <h2 class="modal-title">📸 STUDIO FOTO KARTU POS HD</h2>
        <span class="highscore-chip">4x HD • 960×600 PNG</span>
      </div>

      <div class="photo-studio-layout">
        <div class="photo-preview-col">
          <canvas
            ref="postcardCanvasRef"
            class="pixel-canvas postcard-preview-canvas"
            width="480"
            height="300"
            aria-label="Pratinjau Kartu Pos Starlight Stray"
          />
          <p v-if="photoSavedNotice" class="backup-feedback">{{ photoSavedNotice }}</p>
        </div>

        <div class="photo-controls-col">
          <div class="photo-ctrl-group">
            <div class="photo-ctrl-label">🌌 Latar Belakang:</div>
            <div class="photo-chip-grid">
              <button
                v-for="b in PHOTO_BIOMES"
                :key="b.id"
                type="button"
                class="style-option-btn photo-chip-btn"
                :class="{ 'style-option-btn--active': photoBiome === b.id }"
                @click="photoBiome = b.id"
              >
                {{ b.label }}
              </button>
            </div>
          </div>

          <div class="photo-ctrl-group">
            <div class="photo-ctrl-label">🐾 Pose {{ activeCharacter.name }}:</div>
            <div class="photo-chip-grid">
              <button
                v-for="ps in PHOTO_POSES"
                :key="ps.id"
                type="button"
                class="style-option-btn photo-chip-btn"
                :class="{ 'style-option-btn--active': photoPose === ps.id }"
                @click="photoPose = ps.id"
              >
                {{ ps.label }}
              </button>
            </div>
          </div>

          <div class="photo-ctrl-group">
            <div class="photo-ctrl-label">💬 Gelembung Emote:</div>
            <div class="photo-chip-grid photo-chip-grid--emotes">
              <button
                v-for="em in PHOTO_EMOTES"
                :key="em.id"
                type="button"
                class="style-option-btn photo-chip-btn"
                :class="{ 'style-option-btn--active': photoEmote === em.id }"
                @click="photoEmote = em.id"
              >
                {{ em.label }}
              </button>
            </div>
          </div>

          <div class="photo-ctrl-group">
            <div class="photo-ctrl-label">🎨 Gaya Grafik Kartu Pos:</div>
            <div class="style-switcher-row">
              <button
                type="button"
                class="style-option-btn photo-chip-btn"
                :class="{ 'style-option-btn--active': photoStyle === 'classic' }"
                @click="photoStyle = 'classic'"
              >
                8-Bit Klasik
              </button>
              <button
                type="button"
                class="style-option-btn photo-chip-btn"
                :class="{ 'style-option-btn--active': photoStyle === 'modern' }"
                @click="photoStyle = 'modern'"
              >
                16-Bit Modern
              </button>
            </div>
          </div>

          <button type="button" class="pixel-btn photo-save-btn" @click="handleDownloadPostcardHd">
            💾 Unduh Kartu Pos (.PNG)
          </button>
        </div>
      </div>

      <div class="modal-footer modal-footer--between">
        <button type="button" class="pixel-btn pixel-btn--secondary" @click="$emit('openTitle')">◀ Menu Utama</button>
        <div class="title-tools">
          <button type="button" class="pixel-btn pixel-btn--ghost" @click="$emit('openCharacters')">🐾 Ganti Hewan</button>
          <button type="button" class="pixel-btn pixel-btn--ghost" @click="$emit('openShop')">🎩 Ganti Aksesoris</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ====================================================================== -->
  <!-- 5C. GUIDEBOOK ENCYCLOPEDIA MODAL (📜 BUKU PANDUAN) -->
  <!-- ====================================================================== -->
  <div v-else-if="hud.screen === 'guidebook'" class="overlay-backdrop">
    <div class="pixel-panel modal-card modal-card--wide">
      <div class="modal-header">
        <h2 class="modal-title">📜 BUKU PANDUAN STARLIGHT STRAY</h2>
        <span class="highscore-chip">9 Item • 4 Dunia • 3 Misi</span>
      </div>

      <div class="shop-tabs guide-tabs" role="tablist" aria-label="Kategori Buku Panduan">
        <button
          type="button"
          role="tab"
          class="shop-tab-btn"
          :class="{ 'shop-tab-btn--active': activeGuideTab === 'items' }"
          :aria-selected="activeGuideTab === 'items'"
          @click="activeGuideTab = 'items'"
        >
          ✨ Ensiklopedia Item &amp; Power-Up
        </button>
        <button
          type="button"
          role="tab"
          class="shop-tab-btn"
          :class="{ 'shop-tab-btn--active': activeGuideTab === 'worlds' }"
          :aria-selected="activeGuideTab === 'worlds'"
          @click="activeGuideTab = 'worlds'"
        >
          🗺️ Karakter Spesial &amp; Mekanik Map
        </button>
      </div>

      <!-- TAB 1: CONTROLS + ENCYCLOPEDIA OF ALL 9 POWER-UPS -->
      <div v-if="activeGuideTab === 'items'" class="guide-items-wrap">
        <div class="guide-controls-strip" aria-label="Kontrol Permainan">
          <span class="guide-ctrl-title">🎮 KONTROL:</span>
          <span><span class="key-chip">A/D</span> / <span class="key-chip">←/→</span> Gerak</span>
          <span><span class="key-chip">Spasi/W</span> Lompat &amp; Melayang</span>
          <span><span class="key-chip">Shift/X</span> Dash ⚡</span>
          <span><span class="key-chip">P/Esc</span> Jeda &amp; Photo Mode</span>
          <span><span class="key-chip">R</span> Ulangi</span>
          <span><span class="key-chip">M</span> Suara</span>
        </div>
        <div class="guide-grid">
          <div
            v-for="item in GUIDE_ITEMS"
            :key="item.kind"
            class="guide-item-card"
            :class="{ 'guide-item-card--featured': item.kind === 'mooncake' }"
          >
            <div class="guide-icon-box">
              <img
                v-if="powerUpIcons[item.kind]"
                :src="powerUpIcons[item.kind]"
                :alt="item.name"
                class="guide-icon-img"
              />
            </div>
            <div class="guide-item-text">
              <div class="guide-item-head">
                <span class="guide-item-name">{{ item.name }}</span>
                <span class="guide-item-tag">{{ item.tag }}</span>
              </div>
              <p class="guide-item-desc">{{ item.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: SIGNATURE ANIMAL PERKS + SPECIAL CHARACTERS + BIOME MECHANICS + NIGHT EVENTS -->
      <div v-else class="guide-worlds-scroll">
        <div class="section-heading">
          <span>🐾 KEMAMPUAN PASIF UNIK SPESIES HEWAN</span>
          <span class="section-sub">Keunggulan seimbang setiap karakter</span>
        </div>
        <div class="guide-perks-grid">
          <div class="guide-perk-card">
            <div class="guide-item-name">🐱 Kucing (Semua Varian)</div>
            <p class="guide-item-desc">Kontrol gerak di udara lebih lincah (+12%) &amp; transisi belok lebih cepat dan responsif.</p>
          </div>
          <div class="guide-perk-card">
            <div class="guide-item-name">🐰 Kelinci Putih</div>
            <p class="guide-item-desc">Tinggi lompatan dasar +10% lebih tinggi untuk menjangkau pijakan tinggi dengan nyaman.</p>
          </div>
          <div class="guide-perk-card">
            <div class="guide-item-name">🐕 Shiba Inu &amp; Anjing Putih</div>
            <p class="guide-item-desc">Jarak Dash +18% lebih jauh serta kebal terhadap dorongan pusaran angin kelopak.</p>
          </div>
        </div>

        <div class="section-heading">
          <span>🔔 LONCENG BINTANG &amp; 🌠 PERISTIWA LANGIT MALAM</span>
          <span class="section-sub">Kejutan dinamis &amp; bonus Ikan Emas</span>
        </div>
        <div class="guide-events-grid">
          <div class="guide-world-card">
            <div class="guide-world-title">🔔 Tantangan Lonceng Bintang</div>
            <p class="guide-item-desc">Tersedia 1 Lonceng Emas di setiap level. Sentuh untuk memunculkan 8 Bintang melingkar selama 6 detik — kumpulkan semuanya untuk hadiah <strong>+1 Ikan Emas</strong>!</p>
          </div>
          <div class="guide-world-card">
            <div class="guide-world-title">🌠 Peristiwa Langit Malam Langka (25%)</div>
            <p class="guide-item-desc"><strong>Hujan Bintang Jatuh:</strong> Bintang bonus (+25 poin) turun perlahan selama 15 detik. <strong>Bulan Purnama Merah Muda:</strong> Langit pastel merah muda + bonus skor <strong>+25%</strong> semua bintang!</p>
          </div>
        </div>

        <div class="section-heading section-heading--special">
          <span>🏆 CARA MEMBUKA 3 KARAKTER SPESIAL</span>
          <span class="section-sub">Otomatis terbuka saat syarat tercapai</span>
        </div>
        <div class="guide-special-grid">
          <div v-for="ch in specialCharacters" :key="ch.id" class="guide-special-card">
            <div class="guide-item-name">{{ ch.name }}</div>
            <p class="guide-item-desc">{{ ch.missionDesc }}</p>
            <div class="guide-mission-status">{{ getMissionInfo(ch.id).label }}</div>
          </div>
        </div>

        <div class="section-heading">
          <span>🌍 PIJAKAN KHUSUS, MUSUH &amp; AREA RAHASIA PER DUNIA</span>
          <span class="section-sub">⭐ Kombo Bintang &lt; 2.5 dtk = x2–x5!</span>
        </div>
        <div class="guide-world-grid">
          <div v-for="w in GUIDE_WORLDS" :key="w.name" class="guide-world-card">
            <div class="guide-world-title">{{ w.icon }} {{ w.name }}</div>
            <div class="guide-world-line"><strong>Pijakan:</strong> {{ w.platform }}</div>
            <div class="guide-world-line"><strong>Rintangan:</strong> {{ w.hazards }}</div>
            <div class="guide-world-line"><strong>Rahasia:</strong> {{ w.secret }}</div>
          </div>
        </div>
      </div>

      <div class="modal-footer modal-footer--between">
        <button type="button" class="pixel-btn pixel-btn--secondary" @click="$emit('openTitle')">◀ Menu Utama</button>
        <button type="button" class="pixel-btn" @click="$emit('startNew')">▶ Mulai Petualangan</button>
      </div>
    </div>
  </div>

  <!-- ====================================================================== -->
  <!-- 6. SETTINGS & JSON BACKUP MODAL -->
  <!-- ====================================================================== -->
  <div v-else-if="hud.screen === 'settings'" class="overlay-backdrop overlay-backdrop--settings">
    <div class="pixel-panel modal-card modal-card--settings">
      <div class="modal-header">
        <h2 class="modal-title">⚙️ PENGATURAN &amp; DATA</h2>
        <button type="button" class="pixel-btn pixel-btn--ghost" @click="$emit('toggleMute')">
          {{ hud.isMuted ? '🔇 MUTE' : '🔊 AKTIF' }}
        </button>
      </div>

      <!-- Visual Style Switcher (Classic 8-Bit vs Modern 16-Bit Cozy) -->
      <div class="style-switcher-box">
        <div class="style-switcher-title">🎨 GAYA GRAFIK:</div>
        <div class="style-switcher-row" role="radiogroup" aria-label="Pilih Gaya Grafik">
          <button
            type="button"
            role="radio"
            class="style-option-btn"
            :class="{ 'style-option-btn--active': hud.graphicsStyle === 'classic' }"
            :aria-checked="hud.graphicsStyle === 'classic'"
            @click="$emit('setGraphicsStyle', 'classic')"
          >
            <span class="style-radio-mark">{{ hud.graphicsStyle === 'classic' ? '●' : '○' }}</span>
            <span>Mode Klasik (8-Bit)</span>
          </button>
          <button
            type="button"
            role="radio"
            class="style-option-btn"
            :class="{ 'style-option-btn--active': hud.graphicsStyle === 'modern' }"
            :aria-checked="hud.graphicsStyle === 'modern'"
            @click="$emit('setGraphicsStyle', 'modern')"
          >
            <span class="style-radio-mark">{{ hud.graphicsStyle === 'modern' ? '●' : '○' }}</span>
            <span>Mode Modern (16-Bit)</span>
          </button>
        </div>
        <div class="style-switcher-note">
          {{
            hud.graphicsStyle === 'modern'
              ? '16-Bit Cozy: Langit gradasi bercahaya, genteng tanah liat & lumut, pendaran aditif bulan/lampion, rim-lighting karakter & HUD emas.'
              : '8-Bit Klasik: Langit datar 2-warna, blok piksel datar retro, karakter & mata flat tanpa rim-light, tanpa efek glow & HUD garis tipis.'
          }}
        </div>
      </div>

      <!-- Mobile Touch Controls Overlay Option (Floating Joystick + Invisible Zones + Opacity + Layout Editor) -->
      <div class="style-switcher-box style-switcher-box--touch">
        <div class="style-switcher-title">📱 KONTROL LAYAR SENTUH:</div>
        <div class="style-switcher-row style-switcher-row--four" role="radiogroup" aria-label="Mode Kontrol Sentuh">
          <button
            type="button"
            role="radio"
            class="style-option-btn"
            :class="{ 'style-option-btn--active': progress.touchControlsMode === 'invisible' }"
            :aria-checked="progress.touchControlsMode === 'invisible'"
            @click="$emit('setTouchControlsMode', 'invisible')"
          >
            <span class="style-radio-mark">{{ progress.touchControlsMode === 'invisible' ? '●' : '○' }}</span>
            <span>Kasat Mata</span>
          </button>
          <button
            type="button"
            role="radio"
            class="style-option-btn"
            :class="{ 'style-option-btn--active': progress.touchControlsMode === 'translucent' }"
            :aria-checked="progress.touchControlsMode === 'translucent'"
            @click="$emit('setTouchControlsMode', 'translucent')"
          >
            <span class="style-radio-mark">{{ progress.touchControlsMode === 'translucent' ? '●' : '○' }}</span>
            <span>Transparan</span>
          </button>
          <button
            type="button"
            role="radio"
            class="style-option-btn"
            :class="{ 'style-option-btn--active': progress.touchControlsMode === 'visible' }"
            :aria-checked="progress.touchControlsMode === 'visible'"
            @click="$emit('setTouchControlsMode', 'visible')"
          >
            <span class="style-radio-mark">{{ progress.touchControlsMode === 'visible' ? '●' : '○' }}</span>
            <span>Terlihat</span>
          </button>
          <button
            type="button"
            role="radio"
            class="style-option-btn"
            :class="{ 'style-option-btn--active': progress.touchControlsMode === 'off' }"
            :aria-checked="progress.touchControlsMode === 'off'"
            @click="$emit('setTouchControlsMode', 'off')"
          >
            <span class="style-radio-mark">{{ progress.touchControlsMode === 'off' ? '●' : '○' }}</span>
            <span>Nonaktif</span>
          </button>
        </div>

        <div class="touch-opacity-row">
          <div class="slider-head">
            <span>👁️ Opasitas Tombol Sentuh</span>
            <span>{{ Math.round(progress.touchLayout.opacity * 100) }}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            :value="Math.round(progress.touchLayout.opacity * 100)"
            class="pixel-slider"
            @input="onTouchOpacityInput"
          />
        </div>

        <button
          type="button"
          class="pixel-btn pixel-btn--secondary touch-customize-btn"
          @click="$emit('openTouchEditor')"
        >
          🎛️ ATUR TOMBOL (POSISI &amp; UKURAN)
        </button>

        <div class="style-switcher-note">
          {{
            progress.touchControlsMode === 'invisible'
              ? 'Kasat Mata (Default HP): Joystick virtual kiri & zona sentuh kanan aktif penuh tanpa kotak penghalang layar!'
              : progress.touchControlsMode === 'translucent'
                ? 'Transparan: Joystick melingkar minimal & tombol aksi mengikuti slider opasitas.'
                : progress.touchControlsMode === 'visible'
                  ? 'Terlihat: Joystick virtual piksel & tombol aksi tampak jelas di layar.'
                  : 'Kontrol layar sentuh dinonaktifkan sepenuhnya.'
          }}
        </div>
      </div>

      <div class="settings-section">
        <div class="slider-row">
          <div class="slider-head">
            <span>🎵 Musik Lo-Fi</span>
            <span>{{ Math.round(progress.audio.bgmVolume * 100) }}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            :value="Math.round(progress.audio.bgmVolume * 100)"
            class="pixel-slider"
            @input="onVolumeInput('bgmVolume', $event)"
          />
        </div>

        <div class="slider-row">
          <div class="slider-head">
            <span>🍃 Suara Alam (Ambience)</span>
            <span>{{ Math.round(progress.audio.ambienceVolume * 100) }}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            :value="Math.round(progress.audio.ambienceVolume * 100)"
            class="pixel-slider"
            @input="onVolumeInput('ambienceVolume', $event)"
          />
        </div>

        <div class="slider-row">
          <div class="slider-head">
            <span>✨ Efek Suara (SFX)</span>
            <span>{{ Math.round(progress.audio.sfxVolume * 100) }}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            :value="Math.round(progress.audio.sfxVolume * 100)"
            class="pixel-slider"
            @input="onVolumeInput('sfxVolume', $event)"
          />
        </div>
      </div>

      <div class="settings-toggles-row">
        <button
          type="button"
          class="style-option-btn settings-toggle-pill"
          :class="{ 'style-option-btn--active': progress.showSpeedrunTimer }"
          @click="$emit('setShowSpeedrunTimer', !progress.showSpeedrunTimer)"
        >
          <span>⏱️ Timer Speedrun: {{ progress.showSpeedrunTimer ? 'ON' : 'OFF' }}</span>
        </button>
        <button
          type="button"
          class="style-option-btn settings-toggle-pill"
          :class="{ 'style-option-btn--active': progress.reduceMotion }"
          @click="$emit('setReduceMotion', !progress.reduceMotion)"
        >
          <span>🌿 Reduce Motion: {{ progress.reduceMotion ? 'ON' : 'OFF' }}</span>
        </button>
      </div>

      <div class="backup-box">
        <div class="autosave-status-note">✓ Progres &amp; pengaturan tersimpan otomatis di browser &amp; TiDB Cloud</div>

        <!-- TiDB Cloud Relational CRUD Manager (`starlight_stray`) -->
        <div class="cloud-sync-box">
          <div class="cloud-sync-head">
            <span class="cloud-sync-title">☁️ DATABASE TiDB (CRUD)</span>
            <span
              class="cloud-sync-pill"
              :class="`cloud-sync-pill--${cloudSyncStatus || 'idle'}`"
            >
              {{ cloudStatusLabel }}
            </span>
          </div>

          <!-- UPDATE: Edit Active Player Name -->
          <div class="cloud-sync-row">
            <input
              v-model="cloudNameDraft"
              type="text"
              maxlength="48"
              class="cloud-code-input"
              placeholder="Nama Profil Pemain..."
              aria-label="Nama Profil Pemain"
              @keyup.enter="handleSaveDisplayName"
            />
            <button
              type="button"
              class="pixel-btn pixel-btn--secondary cloud-action-btn"
              title="UPDATE nama profil ke TiDB"
              @click="handleSaveDisplayName"
            >
              ✏️ Ubah Nama
            </button>
          </div>

          <!-- READ / SYNC: Player Sync Code -->
          <div class="cloud-sync-row">
            <input
              v-model="cloudCodeDraft"
              type="text"
              maxlength="64"
              class="cloud-code-input"
              placeholder="STRAY-XXXX-XXXX"
              aria-label="Kode Sinkronisasi Player TiDB Cloud"
              @keyup.enter="handleApplyCloudCode"
            />
            <button
              type="button"
              class="pixel-btn pixel-btn--ghost cloud-action-btn"
              title="Salin kode untuk perangkat lain"
              @click="handleCopyPlayerId"
            >
              {{ cloudCopied ? '✓ Salin' : '📋' }}
            </button>
            <button
              type="button"
              class="pixel-btn pixel-btn--secondary cloud-action-btn"
              title="Sinkronkan atau muat profil dari TiDB"
              @click="handleApplyCloudCode"
            >
              🔄 Sinkron
            </button>
            <button
              type="button"
              class="pixel-btn pixel-btn--ghost cloud-action-btn"
              title="Kelola Daftar Profil (Create/Read/Delete) & Log CRUD TiDB"
              @click="showCrudPanel = !showCrudPanel"
            >
              {{ showCrudPanel ? '▲ Tutup' : `🗄️ Profil (${cloudProfiles?.length || 0})` }}
            </button>
          </div>

          <!-- Collapsible CRUD Profiles & Audit Log Drawer -->
          <div v-if="showCrudPanel" class="crud-drawer">
            <!-- CREATE New Profile -->
            <div class="cloud-sync-row">
              <input
                v-model="newProfileNameDraft"
                type="text"
                maxlength="48"
                class="cloud-code-input"
                placeholder="Buat profil baru (CREATE)..."
                aria-label="Nama Profil Baru"
                @keyup.enter="handleCreateNewProfile"
              />
              <button
                type="button"
                class="pixel-btn cloud-action-btn"
                @click="handleCreateNewProfile"
              >
                ➕ Profil Baru
              </button>
            </div>

            <!-- READ & DELETE Saved Profiles -->
            <div v-if="cloudProfiles && cloudProfiles.length" class="crud-list">
              <div
                v-for="prof in cloudProfiles"
                :key="prof.playerId"
                class="crud-profile-row"
                :class="{ 'crud-profile-row--active': prof.playerId === playerId }"
              >
                <div class="crud-profile-info">
                  <span class="crud-profile-name">
                    {{ prof.displayName }}
                    <span v-if="prof.playerId === playerId" class="crud-active-tag">AKTIF</span>
                  </span>
                  <span class="crud-profile-meta">
                    {{ prof.playerId }} • Lvl {{ prof.unlockedLevel }} • ★ {{ prof.highScore }} • 🐟 {{ prof.fishCoins }} • ✦ {{ prof.shardsCount }}/24
                  </span>
                </div>
                <div class="crud-profile-actions">
                  <button
                    v-if="prof.playerId !== playerId"
                    type="button"
                    class="pixel-btn pixel-btn--secondary cloud-mini-btn"
                    title="READ / Muat profil ini dari TiDB"
                    @click="$emit('switchPlayerId', prof.playerId)"
                  >
                    📂 Muat
                  </button>
                  <button
                    v-if="confirmDeleteProfileId !== prof.playerId"
                    type="button"
                    class="pixel-btn pixel-btn--ghost cloud-mini-btn cloud-mini-btn--danger"
                    title="DELETE profil ini dari semua tabel TiDB"
                    @click="confirmDeleteProfileId = prof.playerId"
                  >
                    🗑️
                  </button>
                  <template v-else>
                    <button
                      type="button"
                      class="pixel-btn cloud-mini-btn cloud-mini-btn--danger"
                      @click="handleConfirmDeleteProfile(prof.playerId)"
                    >
                      Ya
                    </button>
                    <button
                      type="button"
                      class="pixel-btn pixel-btn--ghost cloud-mini-btn"
                      @click="confirmDeleteProfileId = null"
                    >
                      Batal
                    </button>
                  </template>
                </div>
              </div>
            </div>

            <!-- Live CRUD Activity Audit Trail -->
            <div v-if="recentCrudLogs && recentCrudLogs.length" class="crud-log-box">
              <div class="crud-log-title">📜 LOG AKTIVITAS CRUD (starlight_stray.crud_activity_logs)</div>
              <div v-for="log in recentCrudLogs.slice(0, 5)" :key="log.id" class="crud-log-row">
                <span class="crud-badge" :class="`crud-badge--${log.actionType.toLowerCase()}`">
                  {{ log.actionType }}
                </span>
                <span class="crud-log-text">{{ log.summary }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="menu-row">
          <button type="button" class="pixel-btn pixel-btn--secondary backup-btn" @click="$emit('exportJson')">
            💾 Unduh Cadangan (.JSON)
          </button>
          <button type="button" class="pixel-btn pixel-btn--secondary backup-btn" @click="triggerImportClick">
            📂 Muat Cadangan (.JSON)
          </button>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          accept=".json,application/json"
          class="hidden-file-input"
          @change="handleFileChange"
        />
        <p v-if="importFeedback" class="backup-feedback">{{ importFeedback }}</p>

        <!-- 2-Step Confirmed Progress Reset -->
        <div class="reset-save-row">
          <button
            v-if="!confirmReset"
            type="button"
            class="pixel-btn pixel-btn--ghost reset-trigger-btn"
            @click="confirmReset = true"
          >
            🗑️ Reset Semua Progres
          </button>
          <div v-else class="reset-confirm-strip" role="alertdialog" aria-label="Konfirmasi Reset Progres">
            <span class="reset-confirm-text">Hapus semua progres tersimpan?</span>
            <div class="reset-confirm-actions">
              <button type="button" class="pixel-btn reset-danger-btn" @click="handleConfirmReset">
                ✓ Ya, Reset
              </button>
              <button type="button" class="pixel-btn pixel-btn--ghost reset-cancel-btn" @click="confirmReset = false">
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="pixel-btn" @click="$emit('openTitle')">◀ Kembali</button>
      </div>
    </div>
  </div>

  <!-- ====================================================================== -->
  <!-- 7. PAUSED OVERLAY -->
  <!-- ====================================================================== -->
  <div v-else-if="hud.screen === 'paused'" class="overlay-backdrop overlay-backdrop--settings">
    <div class="pixel-panel modal-card">
      <h2 class="modal-title">DIJEDA</h2>
      <p class="modal-sub">{{ BIOMES[hud.biome].icon }} Level {{ hud.levelId }} — {{ hud.levelName }}</p>

      <!-- Live In-Level Graphics Style Switcher -->
      <div class="style-switcher-row" role="radiogroup" aria-label="Ganti Gaya Grafik Langsung">
        <button
          type="button"
          role="radio"
          class="style-option-btn"
          :class="{ 'style-option-btn--active': hud.graphicsStyle === 'classic' }"
          :aria-checked="hud.graphicsStyle === 'classic'"
          @click="$emit('setGraphicsStyle', 'classic')"
        >
          <span class="style-radio-mark">{{ hud.graphicsStyle === 'classic' ? '●' : '○' }}</span>
          <span>8-Bit Klasik</span>
        </button>
        <button
          type="button"
          role="radio"
          class="style-option-btn"
          :class="{ 'style-option-btn--active': hud.graphicsStyle === 'modern' }"
          :aria-checked="hud.graphicsStyle === 'modern'"
          @click="$emit('setGraphicsStyle', 'modern')"
        >
          <span class="style-radio-mark">{{ hud.graphicsStyle === 'modern' ? '●' : '○' }}</span>
          <span>16-Bit Modern</span>
        </button>
      </div>

      <div class="menu-actions">
        <button type="button" class="pixel-btn" @click="$emit('resume')">▶ Lanjutkan</button>
        <button type="button" class="pixel-btn pixel-btn--secondary" @click="$emit('openPhotoMode')">📸 Photo Mode</button>
        <button type="button" class="pixel-btn pixel-btn--secondary" @click="$emit('restart')">↺ Ulangi Level</button>
        <button type="button" class="pixel-btn pixel-btn--secondary" @click="$emit('openLevelSelect')">🗺️ Pilih Level</button>
        <button type="button" class="pixel-btn pixel-btn--ghost" @click="$emit('openTitle')">⌂ Menu Utama</button>
      </div>
    </div>
  </div>

  <!-- ====================================================================== -->
  <!-- 8. STAGE CLEAR OVERLAY -->
  <!-- ====================================================================== -->
  <div v-else-if="hud.screen === 'levelClear'" class="overlay-backdrop">
    <div class="pixel-panel modal-card">
      <div class="clear-badge">🌙 STAGE CLEAR!</div>
      <h2 class="modal-title">LEVEL {{ hud.levelId }} SELESAI</h2>
      <p class="modal-sub">{{ BIOMES[hud.biome].icon }} {{ hud.levelName }}</p>

      <div class="stage-stars" :aria-label="`Peringkat ${hud.stageRating} dari 3 bintang`">
        <span
          v-for="s in 3"
          :key="s"
          class="stage-star-big"
          :class="s <= hud.stageRating ? 'stage-star-big--on' : 'stage-star-big--off'"
        >★</span>
      </div>

      <div v-if="hud.justEarnedThreeStarBonus" class="three-star-bonus-pill">
        ✨ BONUS SEMPURNA 3 BINTANG: +1 🐟 IKAN EMAS!
      </div>

      <!-- Speedrun Rank & Best Time Summary (Always tracked!) -->
      <div class="speedrun-result-strip">
        <span class="sr-result-time">⏱️ {{ formatSpeedrunTime(hud.runElapsedMs) }}</span>
        <span class="rank-badge" :class="`rank-badge--${hud.lastSpeedrunRank}`">
          RANK {{ hud.lastSpeedrunRank }}
        </span>
        <span v-if="hud.isNewBestTime" class="tt-record-chip">✨ NEW BEST!</span>
        <span class="sr-result-shards">💎 {{ hud.shardsCollected }}/3</span>
      </div>

      <!-- Rebalanced fishCoins Breakdown (Stars, First Clear, Speedrun Rank, Sweet Forager, Boss Clear) -->
      <div v-if="hud.lastCoinBreakdown && hud.lastCoinBreakdown.totalCoins > 0" class="coin-breakdown-box">
        <div class="coin-breakdown-title">🐟 RINCIAN KOIN IKAN DIPEROLEH (+{{ hud.lastCoinBreakdown.totalCoins }} 🐟)</div>
        <div class="coin-breakdown-pills">
          <span v-if="hud.lastCoinBreakdown.starsCoins > 0" class="rank-reward-pill">
            ⭐ Bintang +{{ hud.lastCoinBreakdown.starsCoins }}🐟
          </span>
          <span v-if="hud.lastCoinBreakdown.firstClearCoins > 0" class="rank-reward-pill">
            🏁 First Clear +{{ hud.lastCoinBreakdown.firstClearCoins }}🐟
          </span>
          <span v-if="hud.lastCoinBreakdown.bossCoins > 0" class="rank-reward-pill">
            👑 Boss Clear +{{ hud.lastCoinBreakdown.bossCoins }}🐟
          </span>
          <span
            v-for="item in hud.lastRankRewardBreakdown"
            :key="item.rank"
            class="rank-reward-pill"
          >
            🏅 Rank {{ item.rank }} +{{ item.coins }}🐟
          </span>
          <span v-if="hud.lastCoinBreakdown.foragerCoins > 0" class="rank-reward-pill">
            🍯 Sweet Forager +{{ hud.lastCoinBreakdown.foragerCoins }}🐟
          </span>
          <span v-if="hud.lastCoinBreakdown.threeStarCoins > 0" class="rank-reward-pill">
            ✨ 3★ Bonus +{{ hud.lastCoinBreakdown.threeStarCoins }}🐟
          </span>
        </div>
      </div>

      <!-- Time Trial Medal Summary -->
      <div v-if="hud.isTimeTrial" class="tt-result-box">
        <div class="tt-result-top">
          <span class="tt-result-medal">{{ medalLabel(hud.lastTimeTrialMedal) }}</span>
          <span v-if="hud.isNewTimeRecord" class="tt-record-chip">✨ REKOR BARU!</span>
        </div>
        <div class="tt-result-time">⏱️ {{ formatTimeTrial(hud.timeTrialElapsedMs) }}</div>
        <div class="tt-result-targets">
          🥇 ≤ {{ Math.round(hud.timeTrialGoldMs / 1000) }}s •
          🥈 ≤ {{ Math.round(hud.timeTrialSilverMs / 1000) }}s •
          🥉 ≤ {{ Math.round(hud.timeTrialBronzeMs / 1000) }}s
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Bintang</span>
          <span class="stat-val">⭐ {{ hud.starsCollected }}/{{ hud.totalStars }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Ikan Emas</span>
          <span class="stat-val">🐟 {{ hud.fishCollected }}/{{ hud.totalFish }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Skor Level</span>
          <span class="stat-val stat-val--gold">{{ hud.levelScore }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Tabungan Ikan</span>
          <span class="stat-val stat-val--gold">🐟 {{ progress.fishBank }}</span>
        </div>
      </div>

      <div class="menu-actions">
        <button type="button" class="pixel-btn" @click="$emit('nextLevel')">
          {{ hud.levelId >= levels.length ? '🌕 Lihat Epilog Tamat ➔' : 'Level Berikutnya ➔' }}
        </button>
        <div class="menu-row">
          <button type="button" class="pixel-btn pixel-btn--secondary" @click="$emit('restart')">↺ Ulangi</button>
          <button type="button" class="pixel-btn pixel-btn--ghost" @click="$emit('openTitle')">⌂ Menu Utama</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ====================================================================== -->
  <!-- 9. GENTLE GAME OVER OVERLAY -->
  <!-- ====================================================================== -->
  <div v-else-if="hud.screen === 'gameOver'" class="overlay-backdrop">
    <div class="pixel-panel modal-card">
      <div class="clear-badge clear-badge--sleepy">💤 WAKTUNYA ISTIRAHAT</div>
      <h2 class="modal-title">GAME OVER</h2>
      <p class="modal-sub modal-sub--sleepy">"Petualang kecilnya tertidur kelelahan..."</p>

      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Skor Saat Ini</span>
          <span class="stat-val stat-val--gold">{{ hud.score }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">High Score</span>
          <span class="stat-val">★ {{ hud.highScore }}</span>
        </div>
      </div>

      <div class="menu-actions">
        <button
          v-if="hud.checkpointReached"
          type="button"
          class="pixel-btn"
          @click="$emit('continueCheckpoint')"
        >
          🏮 Lanjut dari Pos Lentera
        </button>
        <button
          type="button"
          class="pixel-btn"
          :class="{ 'pixel-btn--secondary': hud.checkpointReached }"
          @click="$emit('restart')"
        >
          ↺ {{ hud.checkpointReached ? 'Ulang dari Awal (R)' : 'Coba Lagi (R)' }}
        </button>
        <button type="button" class="pixel-btn pixel-btn--ghost" @click="$emit('openTitle')">⌂ Menu Utama</button>
      </div>
    </div>
  </div>

  <!-- ====================================================================== -->
  <!-- 10. LEVEL 8 EPILOGUE CUTSCENE OVERLAY (Unobstructed Full Moon Pier Scene!) -->
  <!-- ====================================================================== -->
  <div v-else-if="hud.screen === 'victory'" class="overlay-backdrop overlay-backdrop--epilogue">
    <div class="epilogue-top-banner">
      <div class="epilogue-head-row">
        <span class="clear-badge">🌕 EPILOG TAMAT • MALAM PURNAMA DI DERMAGA</span>
        <span class="epilogue-music-pill">♪ Melodi Kotak Musik Penutup</span>
      </div>
      <h2 class="epilogue-title title-glow">TERIMA KASIH TELAH BERMAIN!</h2>
      <p class="epilogue-message">
        {{ activeCharacter.name }} dan para sahabat malam kini duduk tenang di tepi dermaga,
        memandang bulan purnama setelah menaklukkan seluruh 8 tahap petualangan bintang. ✨
      </p>
      <div class="epilogue-stats-inline">
        <span>★ Skor: {{ hud.score }}</span>
        <span>•</span>
        <span>🐟 Tabungan Ikan: {{ progress.fishBank }}</span>
        <span>•</span>
        <span>🏆 Lencana: {{ progress.unlockedAchievements.length }}/{{ ACHIEVEMENTS.length }}</span>
      </div>
    </div>

    <div class="epilogue-bottom-bar">
      <button type="button" class="pixel-btn epilogue-btn" @click="$emit('openShop')">
        🎩 Toko Aksesoris
      </button>
      <button type="button" class="pixel-btn pixel-btn--secondary epilogue-btn" @click="$emit('openCharacters')">
        🐾 Karakter
      </button>
      <button type="button" class="pixel-btn pixel-btn--secondary epilogue-btn" @click="$emit('startNew')">
        ↺ Main Lagi
      </button>
      <button type="button" class="pixel-btn pixel-btn--ghost epilogue-btn" @click="$emit('openTitle')">
        ⌂ Menu Utama
      </button>
    </div>
  </div>

  <!-- ====================================================================== -->
  <!-- 11. INTERACTIVE CHARACTER UNLOCK CELEBRATION SPOTLIGHT OVERLAY -->
  <!-- ====================================================================== -->
  <div
    v-if="celebrationCharDef"
    class="overlay-backdrop celebration-backdrop"
    role="dialog"
    aria-modal="true"
    aria-label="Perayaan Karakter Baru Terbuka"
  >
    <div class="pixel-panel modal-card celebration-card">
      <div class="celebration-confetti" aria-hidden="true">
        <span class="conf-star conf-star--1">★</span>
        <span class="conf-star conf-star--2">♥</span>
        <span class="conf-star conf-star--3">✦</span>
        <span class="conf-star conf-star--4">★</span>
      </div>
      <div class="clear-badge">🎉 KARAKTER BARU TERBUKA!</div>
      <div class="celebration-stage">
        <div class="celebration-emote-bubble" aria-hidden="true">★ ♥</div>
        <img
          v-if="celebrationPreviewUrl"
          :src="celebrationPreviewUrl"
          :alt="celebrationCharDef.name"
          class="celebration-sprite-img"
        />
      </div>
      <h2 class="modal-title">{{ celebrationCharDef.name }}</h2>
      <p class="modal-sub">{{ celebrationCharDef.description }}</p>
      <div class="char-perk-badge">✨ {{ celebrationCharDef.perkTitle }}</div>
      <p class="char-perk-desc-mini">{{ celebrationCharDef.perkDesc }}</p>

      <div class="celebration-actions">
        <button
          type="button"
          class="pixel-btn"
          @click="$emit('equipCelebration', false)"
        >
          🐾 PAKAI SEKARANG
        </button>
        <button
          type="button"
          class="pixel-btn pixel-btn--secondary"
          @click="$emit('equipCelebration', true)"
        >
          📸 BUKA DI STUDIO FOTO
        </button>
        <button
          type="button"
          class="pixel-btn pixel-btn--ghost"
          @click="$emit('dismissCelebration')"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ach-toast {
  position: absolute;
  top: 52px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 45;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  background: linear-gradient(180deg, rgba(66, 33, 84, 0.96) 0%, rgba(36, 17, 50, 0.98) 100%);
  border: 2px solid #ffe169;
  box-shadow: 0 0 0 2px #1a0b28, 0 6px 18px rgba(0, 0, 0, 0.55);
  pointer-events: none;
}

.ach-toast__icon {
  font-size: 18px;
}

.ach-toast__text {
  display: flex;
  flex-direction: column;
  text-align: left;
  gap: 1px;
}

.ach-toast__label {
  font-size: 8.5px;
  color: #ffe375;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.ach-toast__name {
  font-size: 11px;
  color: #ffffff;
  font-weight: 700;
}

.overlay-backdrop {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding:
    max(10px, env(safe-area-inset-top))
    max(10px, env(safe-area-inset-right))
    max(10px, env(safe-area-inset-bottom))
    max(10px, env(safe-area-inset-left));
  background: radial-gradient(circle at center, rgba(20, 10, 38, 0.34), rgba(10, 5, 22, 0.74));
  z-index: 30;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

.overlay-backdrop--title {
  background: linear-gradient(180deg, rgba(16, 8, 32, 0.14) 0%, rgba(12, 6, 26, 0.42) 100%);
}

.overlay-backdrop--settings {
  background: radial-gradient(circle at center, rgba(16, 8, 34, 0.24), rgba(10, 5, 22, 0.52));
}

.style-quick-pill {
  font-size: 9.5px;
  padding: 5px 8px;
}

.modal-card {
  width: min(440px, 100%);
  max-height: min(90dvh, calc(100% - 8px));
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  padding: 14px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.modal-card *,
.modal-card > * {
  touch-action: pan-y;
}

.modal-card--title {
  width: min(500px, 100%);
}

.modal-card--levels {
  width: min(740px, 100%);
}

.modal-card--wide {
  width: min(790px, 100%);
}

.modal-card--settings {
  width: min(480px, 100%);
}

.title-top-row,
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.title-badges,
.title-tools {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.highscore-chip,
.fish-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  background: rgba(255, 215, 107, 0.16);
  border: 2px solid #ffd873;
  color: #ffe685;
  font-size: 10px;
  font-weight: 700;
}

.fish-chip {
  background: rgba(255, 158, 196, 0.16);
  border-color: #ff9ec4;
  color: #ffe6b8;
}

.fish-chip--lg {
  padding: 5px 12px;
  font-size: 11px;
}

.title-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.hero-preview-sprite {
  width: 60px;
  height: 60px;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  filter: drop-shadow(0 3px 0 #1c0c2b);
  flex-shrink: 0;
}

.title-heading-group {
  text-align: left;
}

.game-title {
  margin: 0;
  font-size: clamp(18px, 3.5vw, 27px);
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #fff6cc;
  line-height: 1.2;
}

.game-subtitle {
  margin: 4px 0 0;
  font-size: 10.5px;
  letter-spacing: 0.04em;
  color: #ffc7df;
}

.modal-title {
  margin: 0;
  font-family: var(--font-pixel-display);
  font-size: 13px;
  letter-spacing: 0.05em;
  color: #fff5c8;
  line-height: 1.35;
}

.modal-sub {
  margin: -4px 0 2px;
  font-size: 11px;
  color: #e6cceb;
  line-height: 1.45;
}

.modal-sub--sleepy {
  color: #ffd6e8;
  font-style: italic;
}

.clear-badge {
  align-self: center;
  padding: 4px 12px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #1f0e30;
  background: #96f2cc;
  border: 2px solid #e0fff2;
}

.clear-badge--sleepy {
  color: #fff2f8;
  background: #6c3b7a;
  border-color: #f7a8ca;
}

.stage-stars {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.stage-star-big {
  font-size: 26px;
  line-height: 1;
}

.stage-star-big--on {
  color: #ffe169;
  text-shadow: 0 3px 0 #3d1d4d, 0 0 12px rgba(255, 225, 105, 0.55);
}

.stage-star-big--off {
  color: #462a5c;
  text-shadow: 0 2px 0 #1c0c2b;
}

.menu-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-btn-lg {
  width: 100%;
  padding: 11px 16px;
  font-size: 12.5px;
}

.menu-btn-sm {
  padding: 8px 8px;
  font-size: 10px;
}

.menu-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.controls-box {
  padding: 7px 10px;
  background: rgba(20, 9, 34, 0.72);
  border: 2px solid rgba(255, 179, 211, 0.38);
  font-size: 9.5px;
  color: #eadbf5;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.controls-row--tips {
  padding-top: 4px;
  border-top: 1px dashed rgba(255, 179, 211, 0.32);
  color: #ffe285;
}

.key-chip {
  display: inline-block;
  padding: 1px 4px;
  background: #462359;
  border: 1px solid #f7a8ca;
  color: #ffffff;
  font-weight: 700;
  font-size: 9px;
}

/* 8-Level Grid */
.level-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 2px;
}

.level-card {
  text-align: left;
  padding: 8px;
  font-family: inherit;
  color: #fff3fa;
  background: rgba(49, 24, 66, 0.88);
  border: 2px solid #f7a8ca;
  box-shadow: 0 3px 0 #180926;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: transform 0.08s ease, border-color 0.1s ease;
}

.level-card:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: #ffe375;
}

.level-card--locked {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #6c4d85;
}

.level-card__top {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.level-num {
  color: #ffd76b;
  font-size: 9.5px;
  font-weight: 700;
}

.biome-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 5px;
  border: 1px solid #f7a8ca;
  font-size: 8px;
  color: #fff5fb;
  width: fit-content;
}

.level-card__name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}

.level-card__name {
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
}

.lock-badge {
  font-size: 11px;
}

.rating-stars {
  font-size: 10.5px;
  letter-spacing: 1px;
  flex-shrink: 0;
}

.star-on {
  color: #ffe169;
}

.star-off {
  color: #54376b;
}

.level-card__sub {
  font-size: 8.5px;
  color: #ffbd96;
  flex: 1;
}

.level-card__records {
  display: flex;
  justify-content: space-between;
  padding-top: 4px;
  border-top: 1px dashed rgba(247, 168, 202, 0.35);
  font-size: 9px;
  color: #ffe99e;
  font-weight: 700;
}

/* Character Page (Regular + Special Mission Sections) */
.char-scroll-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 230px;
  overflow-y: auto;
  padding-right: 3px;
}

.char-card--clickable,
.shop-card--clickable {
  cursor: pointer;
  transition: border-color 0.12s ease, box-shadow 0.12s ease;
}

.char-card--clickable:hover,
.shop-card--clickable:hover {
  border-color: #9cecff;
}

.char-card--preview,
.shop-card--preview {
  border-color: #66e3ff !important;
  box-shadow:
    0 0 0 1px #66e3ff,
    0 0 10px rgba(102, 227, 255, 0.45),
    0 3px 0 #180926 !important;
}

.char-status--preview {
  background: #66e3ff;
  color: #102033;
}

.shop-preview-bar--tryon {
  border-color: #66e3ff !important;
  box-shadow: 0 0 12px rgba(102, 227, 255, 0.25);
}

.live-preview-box--tryon {
  border-color: #66e3ff !important;
}

.preview-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.tryon-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: rgba(102, 227, 255, 0.2);
  border: 1px solid #66e3ff;
  color: #b8f4ff;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.tryon-badge--owned {
  background: rgba(150, 242, 204, 0.18);
  border-color: #96f2cc;
  color: #d4fff0;
}

.eq-tag--tryon {
  border-color: #66e3ff !important;
  color: #c2f5ff !important;
  background: rgba(34, 82, 108, 0.72) !important;
}

.preview-controls-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

.preview-mini-btn {
  padding: 3px 7px !important;
  font-size: 8.5px !important;
}

.preview-hint-inline {
  font-size: 8px;
  color: #c9b5de;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: rgba(24, 11, 40, 0.78);
  border-left: 4px solid #ff9ec4;
  font-size: 9.5px;
  font-weight: 700;
  color: #ffe699;
  text-align: left;
}

.section-heading--special {
  border-left-color: #ffe169;
  margin-top: 2px;
}

.section-sub {
  font-size: 8.5px;
  color: #d9c2ed;
  font-weight: 400;
}

.char-grid {
  display: grid;
  gap: 7px;
}

.char-grid--five {
  grid-template-columns: repeat(4, 1fr);
}

.char-grid--three {
  grid-template-columns: repeat(3, 1fr);
}

.char-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 7px;
  text-align: center;
  background: rgba(45, 22, 62, 0.9);
  border: 2px solid #9e74ba;
  box-shadow: 0 3px 0 #180926;
}

.char-card--special {
  text-align: left;
  background: linear-gradient(180deg, rgba(64, 30, 82, 0.94) 0%, rgba(40, 18, 56, 0.96) 100%);
  border-color: #d6a2ff;
}

.char-card--selected {
  border-color: #ffe375;
  background: rgba(74, 36, 98, 0.98);
}

.char-card--locked {
  border-color: #63447a;
}

.char-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 8px;
  font-weight: 700;
  gap: 4px;
}

.char-cat {
  color: #ffc7df;
}

.mission-trophy-badge {
  color: #ffe478;
  font-size: 8px;
}

.char-status {
  padding: 1px 4px;
  font-size: 7.5px;
}

.char-status--active {
  background: #ffe375;
  color: #210e30;
}

.char-status--owned {
  background: #3f7d6a;
  color: #e8fff6;
}

.char-status--cost {
  background: #4e275e;
  color: #ffe48c;
}

.char-status--mission {
  background: #4a2863;
  color: #d7beed;
}

.char-sprite-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 46px;
  background: radial-gradient(circle, rgba(255, 224, 150, 0.14) 0%, rgba(18, 9, 32, 0.45) 75%);
  border: 1px solid rgba(255, 199, 223, 0.25);
}

.char-sprite-stage--sm {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.char-sprite-img {
  width: 44px;
  height: 44px;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.char-name {
  font-size: 9.5px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.25;
}

.char-desc {
  margin: 0;
  font-size: 7.8px;
  line-height: 1.3;
  color: #d9c4e8;
  flex: 1;
}

.special-card-mid {
  display: flex;
  align-items: center;
  gap: 8px;
}

.special-card-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}

.mission-desc {
  font-size: 8px;
  line-height: 1.35;
  color: #e9d6f7;
}

.mission-progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 2px;
}

.mission-progress-track {
  width: 100%;
  height: 6px;
  background: #1b0c29;
  border: 1px solid rgba(255, 224, 117, 0.45);
  overflow: hidden;
}

.mission-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff9ec4, #ffe375);
}

.mission-progress-label {
  font-size: 8px;
  color: #ffe899;
  font-weight: 700;
}

.char-action-btn {
  width: 100%;
  padding: 5px 6px;
  font-size: 8.5px;
}

/* Dedicated Accessory Shop */
.shop-preview-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: linear-gradient(180deg, rgba(32, 16, 48, 0.9) 0%, rgba(20, 9, 34, 0.92) 100%);
  border: 2px solid #ffd873;
  text-align: left;
}

.live-preview-box {
  width: 68px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, rgba(255, 226, 152, 0.22) 0%, rgba(16, 8, 30, 0.72) 78%);
  border: 2px solid #f7a8ca;
  flex-shrink: 0;
}

.live-preview-img {
  width: 60px;
  height: 60px;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.live-preview-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}

.live-preview-name {
  font-size: 12px;
  font-weight: 700;
  color: #fff6cc;
}

.equipped-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.eq-tag {
  padding: 2px 6px;
  background: rgba(72, 36, 94, 0.85);
  border: 1px solid rgba(247, 168, 202, 0.55);
  font-size: 8.5px;
  color: #fff0f7;
}

.live-preview-tip {
  font-size: 8.5px;
  color: #d5bee8;
}

.shop-switch-char-btn {
  font-size: 9.5px;
  white-space: nowrap;
}

.shop-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.shop-tabs--five {
  grid-template-columns: repeat(5, 1fr);
  gap: 5px;
}

.home-daily-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.home-daily-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.daily-bonus-pill {
  padding: 1px 6px;
  font-size: 7.4px;
  font-weight: 700;
  color: #ffe896;
  background: rgba(102, 54, 138, 0.85);
  border: 1px solid #ffd873;
  white-space: nowrap;
}

.daily-bonus-pill--done {
  color: #b8ffe0;
  background: rgba(24, 82, 62, 0.85);
  border-color: #6ee6b8;
}

.shop-tab-btn {
  padding: 7px 8px;
  font-family: inherit;
  font-size: 9.5px;
  font-weight: 700;
  color: #dfcaf0;
  background: rgba(38, 19, 54, 0.88);
  border: 2px solid #6e4a8c;
  cursor: pointer;
}

.shop-tab-btn--active {
  color: #210e30;
  background: linear-gradient(180deg, #ffe68f 0%, #ffc857 100%);
  border-color: #fff6d1;
}

.shop-item-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-height: 205px;
  overflow-y: auto;
  padding-right: 3px;
}

.shop-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 7px;
  text-align: center;
  background: rgba(45, 22, 62, 0.9);
  border: 2px solid #7f579e;
  box-shadow: 0 3px 0 #180926;
}

.shop-card--owned {
  border-color: #6ab59b;
}

.shop-card--equipped {
  border-color: #ffe375;
  background: rgba(74, 36, 98, 0.96);
}

.shop-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.swatch-dot {
  width: 11px;
  height: 11px;
  border: 1px solid #1a0b28;
  display: inline-block;
}

.shop-icon-stage {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 9, 34, 0.55);
  border: 1px solid rgba(255, 199, 223, 0.2);
}

.shop-icon-img {
  width: 34px;
  height: 30px;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.none-icon {
  font-size: 18px;
  color: #9e82bd;
}

.shop-item-name {
  font-size: 9px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.25;
}

.shop-item-sub {
  font-size: 7.8px;
  color: #d6bfe8;
  flex: 1;
}

/* Achievements Scrapbook */
.ach-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  max-height: 245px;
  overflow-y: auto;
}

.ach-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  text-align: left;
  background: rgba(34, 17, 50, 0.85);
  border: 2px solid #5c3e75;
  opacity: 0.7;
}

.ach-card--unlocked {
  opacity: 1;
  background: rgba(58, 28, 82, 0.94);
  border-color: #ffe169;
  box-shadow: 0 3px 0 #180926;
}

.ach-card__icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: rgba(255, 225, 105, 0.16);
  border: 2px solid #ffd873;
  flex-shrink: 0;
}

.ach-card__icon--locked {
  background: rgba(24, 12, 38, 0.7);
  border-color: #5c3e75;
  font-size: 16px;
}

.ach-card__body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}

.ach-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}

.ach-card__name {
  font-size: 10.5px;
  font-weight: 700;
  color: #ffffff;
}

.ach-badge {
  font-size: 7.5px;
  padding: 1px 4px;
  background: #3d2454;
  color: #bda6d4;
}

.ach-badge--open {
  background: #8ef0c8;
  color: #190d29;
}

.ach-card__desc {
  margin: 0;
  font-size: 8.5px;
  line-height: 1.35;
  color: #decaf0;
}

.ach-stats-strip {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 14px;
  padding: 6px 10px;
  background: rgba(20, 9, 34, 0.7);
  border: 1px dashed rgba(247, 168, 202, 0.4);
  font-size: 9.5px;
  color: #ffe699;
}

/* Visual Style Switcher inside Settings */
.style-switcher-box {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 10px 12px;
  background: rgba(26, 12, 42, 0.84);
  border: 2px solid #ffd873;
  text-align: left;
}

.style-switcher-title {
  font-size: 10px;
  font-weight: 700;
  color: #ffe699;
  letter-spacing: 0.04em;
}

.style-switcher-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}

.style-switcher-row--three {
  grid-template-columns: repeat(3, 1fr);
}

.style-switcher-box--touch {
  border-color: rgba(158, 232, 255, 0.72);
}

.style-option-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 8px;
  font-family: inherit;
  font-size: 9.5px;
  font-weight: 700;
  color: #e4d1f5;
  background: rgba(45, 22, 64, 0.9);
  border: 2px solid #7d5799;
  cursor: pointer;
  transition: border-color 0.12s ease, background-color 0.12s ease;
}

.style-option-btn:hover {
  border-color: #f7a8ca;
}

.style-option-btn--active {
  color: #210e30;
  background: linear-gradient(180deg, #ffe68f 0%, #ffc857 100%);
  border-color: #fff6d1;
  box-shadow: 0 0 10px rgba(255, 224, 117, 0.35);
}

.style-radio-mark {
  font-size: 11px;
  line-height: 1;
}

.style-switcher-note {
  font-size: 8.5px;
  line-height: 1.35;
  color: #d7c0ec;
}

/* Settings & JSON Backup */
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 10px 12px;
  background: rgba(20, 9, 34, 0.72);
  border: 2px solid rgba(255, 179, 211, 0.38);
}

.slider-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slider-head {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #fff2fa;
}

.pixel-slider {
  width: 100%;
  accent-color: #ffd873;
  cursor: pointer;
}

.accessibility-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
  padding: 7px 10px;
  background: rgba(34, 74, 70, 0.45);
  border: 2px solid #8ef0c8;
  font-size: 9.5px;
}

.acc-badge {
  color: #9ef7d4;
  font-weight: 700;
}

.acc-note {
  color: #dffcf0;
  font-size: 8.5px;
}

.backup-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(20, 9, 34, 0.72);
  border: 2px solid rgba(255, 216, 115, 0.42);
}

.backup-btn {
  padding: 7px 10px;
  font-size: 9px;
}

.replay-bonus-tag {
  padding: 1px 4px;
  background: rgba(255, 216, 115, 0.18);
  border: 1px solid #ffd873;
  color: #ffe885;
  font-size: 7.8px;
}

.replay-bonus-tag--done {
  background: rgba(110, 224, 178, 0.18);
  border-color: #7ee8bd;
  color: #a8fce0;
}

.three-star-bonus-pill {
  padding: 5px 10px;
  background: linear-gradient(90deg, rgba(255, 212, 92, 0.24), rgba(255, 158, 196, 0.24));
  border: 2px solid #ffe169;
  color: #fff3b0;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.03em;
}

/* Cozy Daily Request Panel on Title Screen */
.daily-quest-box {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 7px 10px;
  text-align: left;
  background: rgba(24, 11, 42, 0.84);
  border: 2px solid #ffd873;
  box-shadow: 0 3px 0 #160926;
}

.daily-quest-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 8.5px;
  font-weight: 700;
}

.daily-quest-tag {
  color: #ffe685;
  letter-spacing: 0.05em;
}

.daily-quest-count {
  color: #b8f4ff;
}

.daily-quest-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.daily-quest-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.daily-quest-title {
  font-size: 9px;
  color: #fff6ed;
  line-height: 1.3;
}

.daily-quest-bar {
  width: 100%;
  height: 6px;
  background: #140924;
  border: 1px solid rgba(255, 216, 115, 0.48);
  overflow: hidden;
}

.daily-quest-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff9ec4, #ffe375);
  transition: width 0.2s ease;
}

.daily-claim-btn {
  padding: 5px 9px !important;
  font-size: 8.5px !important;
  white-space: nowrap;
}

.daily-reward-chip,
.daily-claimed-chip {
  padding: 3px 7px;
  font-size: 8.5px;
  font-weight: 700;
  white-space: nowrap;
  border: 1px solid #ff9ec4;
  color: #ffe6b8;
  background: rgba(255, 158, 196, 0.16);
}

.daily-claimed-chip {
  border-color: #7ee8bd;
  color: #a8fce0;
  background: rgba(110, 224, 178, 0.16);
}

/* Time Trial Button & Result Box */
.level-tt-row {
  padding-top: 4px;
}

.level-tt-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 4px 6px;
  font-family: inherit;
  font-size: 8px;
  font-weight: 700;
  color: #c2f5ff;
  background: rgba(22, 56, 82, 0.85);
  border: 1px solid #66d9ff;
  cursor: pointer;
}

.level-tt-btn:hover {
  background: rgba(34, 82, 118, 0.96);
  border-color: #ffffff;
}

.level-tt-best {
  color: #ffe885;
}

.tt-result-box {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 7px 10px;
  background: rgba(18, 44, 68, 0.88);
  border: 2px solid #66e3ff;
}

.tt-result-top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tt-result-medal {
  font-size: 10.5px;
  font-weight: 700;
  color: #ffe885;
}

.tt-record-chip {
  padding: 1px 5px;
  font-size: 8px;
  font-weight: 700;
  background: #ffe375;
  color: #1f0e30;
}

.tt-result-time {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
}

.tt-result-targets {
  font-size: 8.5px;
  color: #c9f2ff;
}

/* HD Pixel Postcard Photo Studio */
.photo-studio-layout {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 12px;
  align-items: start;
}

.photo-preview-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.postcard-preview-canvas {
  width: 100%;
  max-width: 420px;
  height: auto;
  aspect-ratio: 16 / 10;
  border: 3px solid #ffd873;
  box-shadow: 0 0 0 3px #180926, 0 8px 24px rgba(0, 0, 0, 0.65);
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.photo-controls-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.photo-ctrl-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.photo-ctrl-label {
  font-size: 9px;
  font-weight: 700;
  color: #ffe699;
}

.photo-chip-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
}

.photo-chip-btn {
  padding: 5px 6px !important;
  font-size: 8.5px !important;
}

.photo-save-btn {
  width: 100%;
  margin-top: 2px;
  padding: 9px 12px !important;
  font-size: 10px !important;
}

/* Title Screen 3x2 Symmetrical 6-Button Grid */
.menu-row--grid6 {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr);
  gap: 7px;
  width: 100%;
}

/* Guidebook Encyclopedia Modal */
.guide-tabs {
  grid-template-columns: repeat(2, 1fr) !important;
}

.guide-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 7px;
  max-height: 255px;
  overflow-y: auto;
  padding-right: 3px;
  text-align: left;
}

.guide-item-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  background: rgba(34, 17, 50, 0.88);
  border: 2px solid #754e96;
}

.guide-item-card--featured {
  grid-column: 1 / -1;
  border-color: #ffd873;
  background: linear-gradient(90deg, rgba(78, 42, 74, 0.92), rgba(44, 22, 60, 0.94));
}

.guide-icon-box {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(18, 8, 32, 0.72);
  border: 2px solid rgba(255, 216, 115, 0.52);
  flex-shrink: 0;
}

.guide-icon-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.guide-item-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.guide-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px;
}

.guide-item-name {
  font-size: 9.5px;
  font-weight: 700;
  color: #fff6cc;
}

.guide-item-tag {
  font-size: 7.5px;
  padding: 1px 4px;
  background: rgba(255, 158, 196, 0.2);
  border: 1px solid rgba(255, 179, 214, 0.55);
  color: #ffd9ec;
}

.guide-item-desc {
  margin: 0;
  font-size: 8.2px;
  line-height: 1.35;
  color: #e4d2f5;
}

.guide-worlds-scroll {
  display: flex;
  flex-direction: column;
  gap: 7px;
  max-height: 255px;
  overflow-y: auto;
  padding-right: 3px;
  text-align: left;
}

.guide-special-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.guide-special-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 7px;
  background: rgba(54, 25, 72, 0.9);
  border: 2px solid #d6a2ff;
}

.guide-mission-status {
  margin-top: auto;
  font-size: 8px;
  font-weight: 700;
  color: #ffe885;
}

.guide-world-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 7px;
}

.guide-world-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 7px 8px;
  background: rgba(34, 17, 50, 0.88);
  border: 2px solid #754e96;
}

.guide-world-title {
  font-size: 9.5px;
  font-weight: 700;
  color: #ffe699;
}

.guide-world-line {
  font-size: 8.2px;
  line-height: 1.35;
  color: #e4d2f5;
}

.guide-world-line strong {
  color: #ffb8dc;
}

/* Level 8 Epilogue Cutscene Cinema Frame (keeps full moon & seated pier friends clearly visible!) */
.overlay-backdrop--epilogue {
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px 12px;
  background: linear-gradient(
    180deg,
    rgba(8, 14, 34, 0.72) 0%,
    rgba(8, 14, 34, 0.12) 34%,
    rgba(8, 14, 34, 0) 68%,
    rgba(8, 14, 34, 0.58) 100%
  );
  pointer-events: none;
}

.epilogue-top-banner {
  width: min(560px, 100%);
  padding: 9px 14px;
  background: rgba(24, 15, 44, 0.76);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 2px solid rgba(255, 216, 115, 0.75);
  box-shadow:
    0 0 0 2px rgba(14, 7, 28, 0.85),
    0 6px 18px rgba(0, 0, 0, 0.48);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  pointer-events: auto;
}

.epilogue-head-row {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
}

.epilogue-music-pill {
  font-size: 8.5px;
  padding: 2px 7px;
  background: rgba(124, 216, 255, 0.16);
  border: 1px solid rgba(158, 232, 255, 0.65);
  color: #d6f6ff;
}

.epilogue-title {
  margin: 0;
  font-size: clamp(11px, 2vw, 15px);
  color: #fff6d1;
  letter-spacing: 0.04em;
}

.epilogue-message {
  margin: 0;
  font-size: 9.5px;
  line-height: 1.45;
  color: #f4e6ff;
}

.epilogue-stats-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 9px;
  color: #ffe699;
  font-weight: 700;
}

.epilogue-bottom-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  pointer-events: auto;
}

.epilogue-btn {
  padding: 7px 12px;
  font-size: 9.5px;
}

.hidden-file-input {
  display: none;
}

.backup-feedback {
  margin: 0;
  font-size: 9.5px;
  color: #96f2cc;
}

.autosave-status-note {
  font-size: 8.5px;
  color: #b7f5da;
  text-align: center;
  margin-bottom: 5px;
}

.reset-save-row {
  margin-top: 7px;
  padding-top: 7px;
  border-top: 1px dashed rgba(255, 179, 211, 0.28);
  display: flex;
  justify-content: center;
}

.reset-trigger-btn {
  font-size: 8.5px;
  padding: 5px 10px;
  color: #ffb6c9;
  border-color: rgba(255, 130, 166, 0.55);
}

.reset-confirm-strip {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 8px;
  background: rgba(74, 18, 42, 0.72);
  border: 1px solid #ff7ca3;
}

.reset-confirm-text {
  font-size: 8.5px;
  color: #ffdce7;
  font-weight: 700;
}

.reset-confirm-actions {
  display: inline-flex;
  gap: 6px;
}

.reset-danger-btn {
  font-size: 8.5px;
  padding: 4px 8px;
  background: linear-gradient(180deg, #ff5d8f 0%, #c92a5b 100%);
  border-color: #ffc2d4;
  color: #ffffff;
}

.reset-cancel-btn {
  font-size: 8.5px;
  padding: 4px 8px;
}

.camp-hero-btn {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  background: rgba(34, 17, 56, 0.72);
  border: 2px solid #f7c583;
  padding: 4px 8px 3px;
  cursor: pointer;
  box-shadow: 0 3px 0 #150824;
  transition: transform 0.14s ease, border-color 0.14s ease;
}

.camp-hero-btn:hover {
  border-color: #ffe885;
}

.camp-hero-btn--hop {
  transform: translateY(-5px);
}

.camp-reaction-pop {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 8.5px;
  font-weight: 700;
  color: #ffe896;
  text-shadow: 0 1px 0 #160926;
  pointer-events: none;
}

.camp-tap-hint {
  font-size: 7.5px;
  color: #ffb8dc;
  margin-top: 1px;
}

.level-shards-strip {
  display: inline-flex;
  gap: 1px;
  align-items: center;
}

.shard-bracket {
  font-size: 9px;
  color: #9e86bd;
}

.shard-gem {
  font-size: 10px;
}

.shard-gem--on {
  color: #7eeeff;
  text-shadow: 0 0 6px rgba(126, 238, 255, 0.65);
}

.shard-gem--off {
  color: #543d70;
}

.level-speedrun-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-top: 3px;
  padding-top: 3px;
  border-top: 1px dashed rgba(255, 224, 150, 0.22);
}

.level-best-time {
  font-size: 8.5px;
  color: #c4ffe6;
  font-variant-numeric: tabular-nums;
}

.rank-badge {
  padding: 1px 6px;
  font-size: 8px;
  font-weight: 700;
  border: 1px solid currentColor;
  letter-spacing: 0.04em;
}

.rank-badge--S {
  color: #ffe46b;
  background: rgba(110, 74, 14, 0.72);
}

.rank-badge--A {
  color: #8eeeff;
  background: rgba(18, 66, 86, 0.72);
}

.rank-badge--B {
  color: #dfbfff;
  background: rgba(64, 34, 94, 0.72);
}

.rank-badge--C {
  color: #c9bfd6;
  background: rgba(44, 32, 60, 0.72);
}

.rank-reward-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 5px 8px;
  background: rgba(74, 48, 16, 0.78);
  border: 2px solid #ffd873;
  font-size: 8.5px;
}

.rank-reward-label {
  color: #ffe896;
  font-weight: 700;
}

.rank-reward-pill {
  padding: 1px 5px;
  background: rgba(24, 12, 38, 0.75);
  border: 1px solid rgba(255, 224, 128, 0.55);
  color: #fff4c2;
}

.rank-reward-total {
  color: #96f2cc;
  font-weight: 700;
}

/* ============================================================================
   ASYMMETRIC MODERN PIXEL HOME LAYOUT
   ============================================================================ */
.home-asymmetric-shell {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 25;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding:
    max(14px, env(safe-area-inset-top))
    max(22px, env(safe-area-inset-right))
    max(14px, env(safe-area-inset-bottom))
    max(22px, env(safe-area-inset-left));
}

.home-floating-bar {
  position: absolute;
  top: max(10px, env(safe-area-inset-top));
  right: max(12px, env(safe-area-inset-right));
  pointer-events: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  padding: 5px 8px;
  background: rgba(20, 10, 38, 0.84);
  border: 2px solid #f2c478;
  box-shadow: 0 0 0 2px #140824, 0 4px 14px rgba(0, 0, 0, 0.55);
}

.home-tool-pill {
  padding: 3px 7px;
  font-size: 8px;
  letter-spacing: 0.03em;
}

.home-icon-pill {
  padding: 3px 6px;
  font-size: 10px;
}

/* Left Column Wrapper: Floating Crest + Hanging Chains + Ornamental Panel */
.home-left-column {
  pointer-events: none;
  width: clamp(295px, 41%, 426px);
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

/* 1. Floating Oversized Pixel Title Crest */
.home-floating-crest {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 2px;
  padding: 0 4px 2px;
  pointer-events: none;
}

.crest-emblem-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.crest-moon-svg {
  image-rendering: pixelated;
  filter: drop-shadow(0 2px 0 #18082b) drop-shadow(0 0 8px rgba(255, 232, 120, 0.55));
}

.crest-tagline {
  font-size: 7.5px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: #e9d2ff;
  text-shadow: 0 2px 0 #160726;
}

.home-crest-title {
  margin: 0;
  font-size: clamp(19px, 2.8vw, 27px);
  line-height: 1.12;
  letter-spacing: 0.06em;
  background: linear-gradient(180deg, #fffbe0 0%, #ffe375 56%, #f09e38 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter:
    drop-shadow(0 2px 0 #4d224f)
    drop-shadow(0 4px 0 #150726)
    drop-shadow(0 0 12px rgba(255, 224, 117, 0.42));
}

/* 2. Hanging Pixel Chains */
.home-chains-row {
  display: flex;
  justify-content: space-between;
  padding: 0 20%;
  margin: -1px 0 -4px;
  position: relative;
  z-index: 2;
}

.home-chain-svg {
  image-rendering: pixelated;
  filter: drop-shadow(0 2px 0 rgba(12, 4, 24, 0.8));
}

/* 3. Stepped Ornamental Pixel Bevel Panel */
.home-ornamental-panel {
  position: relative;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: 11px;
  padding: 15px 18px 14px;
  background: linear-gradient(180deg, rgba(31, 14, 56, 0.90) 0%, rgba(19, 9, 36, 0.93) 100%);
  border: 3px solid #f7c583;
  box-shadow:
    0 0 0 3px #160826,
    0 0 0 5px rgba(247, 197, 131, 0.32),
    0 14px 30px rgba(0, 0, 0, 0.72),
    inset 0 2px 0 rgba(255, 244, 204, 0.25),
    inset 0 -3px 0 rgba(14, 6, 28, 0.65);
  text-align: left;
}

/* Perched Animated Pixel Cat Silhouette on Top-Right Border */
.home-perched-cat {
  position: absolute;
  top: -28px;
  right: 12px;
  image-rendering: pixelated;
  pointer-events: none;
  z-index: 4;
  filter: drop-shadow(0 2px 0 rgba(10, 4, 20, 0.85));
}

.perched-cat-tail {
  transform-origin: 18px 16px;
  animation: catTailSway 2.4s ease-in-out infinite alternate;
}

.home-perched-cat--calm .perched-cat-tail {
  animation: none;
}

@keyframes catTailSway {
  from {
    transform: rotate(-8deg);
  }
  to {
    transform: rotate(10deg);
  }
}

.home-corner-star {
  position: absolute;
  font-size: 9px;
  line-height: 1;
  color: #ffe885;
  text-shadow: 0 1px 0 #140821;
  pointer-events: none;
}

.home-corner-star--tl {
  top: 4px;
  left: 5px;
}

.home-corner-star--tr {
  top: 4px;
  right: 5px;
}

.home-corner-star--bl {
  bottom: 4px;
  left: 5px;
}

.home-corner-star--br {
  bottom: 4px;
  right: 5px;
}

/* Active Character Avatar Header & Collection Pills */
.home-char-header {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 7px 9px;
  background: rgba(15, 7, 30, 0.76);
  border: 2px solid rgba(247, 197, 131, 0.42);
}

.home-avatar-frame {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 40%, #3d2169 0%, #190c30 85%);
  border: 2px solid #ffe082;
  box-shadow: 0 2px 0 #120621;
}

.home-avatar-img {
  width: 38px;
  height: 38px;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.home-char-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
}

.home-char-name {
  font-size: 9.5px;
  font-weight: 700;
  color: #ffe894;
  letter-spacing: 0.04em;
}

.home-char-biome {
  font-size: 8px;
  color: #dfc6f7;
}

.home-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 1px;
}

.home-stat-pill {
  padding: 2px 6px;
  font-size: 7.4px;
  font-weight: 700;
  letter-spacing: 0.03em;
  border: 1px solid;
  white-space: nowrap;
}

.home-stat-pill--shard {
  color: #cff8ff;
  background: rgba(20, 56, 78, 0.8);
  border-color: rgba(132, 232, 255, 0.55);
}

.home-stat-pill--stamp {
  color: #fff2b8;
  background: rgba(74, 46, 20, 0.8);
  border-color: rgba(255, 218, 115, 0.55);
}

/* 4. Expressive Hero Primary CTA with Periodic Shimmer Sweep */
.home-cta-btn {
  position: relative;
  overflow: hidden;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.07em;
  color: #241033;
  background: linear-gradient(180deg, #fff08a 0%, #f5b638 100%);
  border: 2px solid #fff9d6;
  box-shadow: 0 4px 0 #7a4a12, 0 0 14px rgba(255, 224, 117, 0.36);
  transition: transform 0.08s ease, box-shadow 0.08s ease;
}

.home-cta-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 5px 0 #7a4a12, 0 0 18px rgba(255, 232, 130, 0.55);
}

.home-cta-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #7a4a12;
}

.home-cta-shimmer {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -40%;
  width: 32%;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.55) 50%, transparent 100%);
  transform: skewX(-20deg);
  pointer-events: none;
  animation: ctaShimmer 3.8s ease-in-out infinite;
}

.home-cta-btn--calm .home-cta-shimmer {
  display: none;
}

@keyframes ctaShimmer {
  0%, 62% {
    left: -45%;
  }
  88%, 100% {
    left: 125%;
  }
}

.home-cta-icon {
  image-rendering: pixelated;
  transition: transform 0.14s ease;
}

.home-cta-btn:not(.home-cta-btn--calm):hover .home-cta-icon {
  transform: translateX(3px);
}

.home-cta-glint {
  color: #ffffff;
  font-size: 11px;
  opacity: 0.8;
}

/* Expressive 2-Column Navigation Grid + 16x16 Pixel Icons */
.home-nav-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.home-nav-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 7px;
  padding: 9px 10px;
  font-size: 8.6px;
  letter-spacing: 0.03em;
  white-space: nowrap;
  box-shadow: 0 3px 0 #160826;
  transition: transform 0.08s ease, box-shadow 0.08s ease, border-color 0.12s ease;
}

.home-nav-btn:hover {
  transform: translateY(-1px);
  border-color: #ffe382;
  box-shadow: 0 4px 0 #160826;
}

.home-nav-btn:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 #160826;
}

.nav-px-icon {
  flex-shrink: 0;
  image-rendering: pixelated;
  filter: drop-shadow(0 1px 0 #140821);
}

.stamp-notif-dot {
  position: absolute;
  top: 4px;
  right: 5px;
  width: 7px;
  height: 7px;
  background: #ffe366;
  border: 1px solid #2b133d;
  box-shadow: 0 0 6px rgba(255, 227, 102, 0.85);
  animation: stampDotPulse 1.1s ease-in-out infinite alternate;
}

.stamp-notif-dot--calm {
  animation: none;
}

@keyframes stampDotPulse {
  from {
    opacity: 0.55;
  }
  to {
    opacity: 1;
  }
}

/* 5. Protruding Notched Pixel Quest Scroll Banner (MISI HARI INI) */
.home-quest-scroll {
  position: relative;
  margin: 4px -26px -6px;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: linear-gradient(180deg, #3b1f5c 0%, #261240 100%);
  border: 2px solid #ffe082;
  box-shadow:
    0 0 0 2px #140821,
    0 6px 14px rgba(0, 0, 0, 0.65),
    inset 0 2px 0 rgba(255, 240, 186, 0.22);
}

.quest-scroll-notch {
  position: absolute;
  top: 50%;
  width: 8px;
  height: 12px;
  margin-top: -6px;
  background: #140821;
  border: 2px solid #ffe082;
}

.quest-scroll-notch--left {
  left: -5px;
  border-left: none;
}

.quest-scroll-notch--right {
  right: -5px;
  border-right: none;
}

.home-daily-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.home-daily-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.home-daily-left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.home-daily-title {
  font-size: 7.4px;
  color: #fff3d6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Chunky 10-Segment Pixel Progress Bar */
.quest-seg-bar {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 2px;
  height: 6px;
  padding: 1px;
  background: #150826;
  border: 1px solid rgba(255, 224, 140, 0.45);
}

.quest-seg-block {
  background: rgba(94, 62, 128, 0.45);
}

.quest-seg-block--filled {
  background: linear-gradient(180deg, #fff099 0%, #ff9ec4 100%);
}

.home-camp-hint {
  position: absolute;
  right: 14px;
  bottom: 10px;
  padding: 3px 8px;
  font-size: 8px;
  color: #ffe8c8;
  background: rgba(18, 9, 34, 0.68);
  border: 1px solid rgba(255, 224, 150, 0.4);
  pointer-events: none;
}

.guide-items-wrap {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.guide-controls-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px 10px;
  padding: 6px 9px;
  background: rgba(20, 10, 38, 0.85);
  border: 2px solid rgba(255, 216, 115, 0.45);
  font-size: 8.2px;
  color: #f2e2ff;
}

/* Hide keyboard controls guide on mobile/touch devices — show only on PC desktop */
@media (pointer: coarse), (hover: none), (max-width: 900px), (max-height: 540px) {
  .guide-controls-strip {
    display: none !important;
  }
}

.guide-ctrl-title {
  color: #ffe375;
  font-weight: 700;
}

/* ============================================================================
   MOBILE MODAL SCROLL FIX (Fixes Character Select, Accessory Shop, Guidebook,
   and Level Select being squished to 0px behind the Live Preview on phones!)
   ============================================================================ */
@media (max-width: 960px), (max-height: 580px) {
  .overlay-backdrop {
    align-items: center;
    padding:
      max(6px, env(safe-area-inset-top))
      max(8px, env(safe-area-inset-right))
      max(6px, env(safe-area-inset-bottom))
      max(8px, env(safe-area-inset-left));
  }

  .modal-card {
    max-height: min(92dvh, calc(100% - 4px));
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    padding: 10px 12px;
    gap: 7px;
  }

  /* Prevent Flexbox from squishing item grids/scroll areas behind the preview bar! */
  .modal-card > * {
    flex-shrink: 0;
  }

  .char-scroll-area,
  .shop-item-grid,
  .guide-worlds-scroll,
  .guide-grid,
  .level-grid {
    max-height: none !important;
    overflow: visible !important;
    padding-right: 0 !important;
  }

  /* Compact Live Preview bar so items & characters appear immediately below it */
  .shop-preview-bar {
    flex-direction: row !important;
    text-align: left !important;
    padding: 6px 8px;
    gap: 8px;
  }

  .live-preview-box {
    width: 48px;
    height: 48px;
  }

  .live-preview-img {
    width: 42px;
    height: 42px;
  }

  .live-preview-details {
    gap: 3px;
  }

  .live-preview-name {
    font-size: 10px;
  }

  .live-preview-tip,
  .perk-pill-desc {
    font-size: 7.5px;
    line-height: 1.25;
  }

  .preview-hint-inline {
    display: none;
  }

  .equipped-tags {
    justify-content: flex-start !important;
    gap: 3px;
  }

  .eq-tag {
    font-size: 7.4px;
    padding: 1px 4px;
  }

  .shop-tabs {
    display: flex !important;
    flex-wrap: nowrap;
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    gap: 5px;
    padding-bottom: 2px;
  }

  .shop-tab-btn {
    flex: 0 0 auto;
    padding: 6px 10px;
    font-size: 8px;
    white-space: nowrap;
  }

  .shop-item-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }

  .char-grid--five,
  .char-grid--three {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }

  .modal-footer {
    padding-top: 2px;
  }
}

@media (max-width: 520px) {
  .char-grid--five,
  .char-grid--three {
    grid-template-columns: 1fr;
  }
}

/* ============================================================================
   MOBILE LANDSCAPE OPTIMIZATION (Primary Mobile Play Mode, e.g. 667x375 / 844x390)
   ============================================================================ */
@media (orientation: landscape) and (max-height: 540px) {
  .home-asymmetric-shell {
    align-items: flex-start;
    padding:
      max(6px, env(safe-area-inset-top))
      max(12px, env(safe-area-inset-right))
      max(6px, env(safe-area-inset-bottom))
      max(12px, env(safe-area-inset-left));
  }
  .home-floating-bar {
    top: max(6px, env(safe-area-inset-top));
    right: max(10px, env(safe-area-inset-right));
    padding: 3px 6px;
    gap: 4px;
  }
  .home-floating-bar .highscore-chip,
  .home-floating-bar .fish-chip {
    padding: 2px 6px;
    font-size: 8px;
  }
  .home-tool-pill {
    padding: 2px 5px;
    font-size: 7.2px;
  }
  .home-icon-pill {
    padding: 2px 5px;
    font-size: 9px;
  }
  .home-left-column {
    width: clamp(232px, 44%, 336px);
    max-height: calc(100dvh - max(12px, env(safe-area-inset-top) + env(safe-area-inset-bottom)));
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    pointer-events: auto;
    padding: 2px 4px 12px;
  }
  .home-left-column * {
    touch-action: pan-y;
  }
  .crest-emblem-row {
    gap: 4px;
  }
  .crest-moon-svg {
    width: 20px;
    height: 13px;
  }
  .crest-tagline {
    font-size: 5.8px;
  }
  .home-crest-title {
    font-size: clamp(13px, 2.2vw, 17px);
  }
  .home-chains-row {
    display: none;
  }
  .home-ornamental-panel {
    margin-top: 4px;
    padding: 8px 10px 8px;
    gap: 5px;
  }
  .home-perched-cat {
    display: none;
  }
  .home-char-header {
    gap: 6px;
    padding: 4px 6px;
  }
  .home-avatar-frame {
    width: 32px;
    height: 32px;
  }
  .home-avatar-img {
    width: 28px;
    height: 28px;
  }
  .home-char-name {
    font-size: 8.2px;
  }
  .home-char-biome {
    font-size: 6.8px;
  }
  .home-stat-pill {
    font-size: 6.4px;
    padding: 1px 4px;
  }
  .home-cta-btn {
    padding: 6px 10px;
    font-size: 9.5px;
  }
  .home-nav-grid {
    gap: 4px;
  }
  .home-nav-btn {
    padding: 5px 6px;
    font-size: 7.2px;
    gap: 4px;
  }
  .nav-px-icon {
    width: 12px;
    height: 12px;
  }
  .home-quest-scroll {
    margin: 2px -2px 0;
    padding: 5px 8px;
    gap: 3px;
  }
  .home-daily-title {
    font-size: 7px;
  }
  .quest-seg-bar {
    height: 6px;
  }
  .home-camp-hint {
    font-size: 7px;
    padding: 2px 6px;
    bottom: max(6px, env(safe-area-inset-bottom));
    right: max(10px, env(safe-area-inset-right));
  }
}

/* ============================================================================
   MOBILE PORTRAIT ADAPTATION (Big Zoomed Camp Preview Top 42% + Docked Scrollable Menu Bottom 58%)
   ============================================================================ */
@media (max-width: 768px) and (orientation: portrait) {
  .home-asymmetric-shell {
    align-items: flex-end;
    justify-content: center;
    padding: 0;
  }
  .home-floating-bar {
    top: max(6px, env(safe-area-inset-top));
    left: max(8px, env(safe-area-inset-left));
    right: max(8px, env(safe-area-inset-right));
    justify-content: center;
    padding: 4px 6px;
    gap: 4px;
  }
  .home-floating-bar .highscore-chip,
  .home-floating-bar .fish-chip {
    padding: 2px 6px;
    font-size: 8.5px;
  }
  .home-left-column {
    width: 100%;
    max-width: 100%;
    height: 58dvh;
    max-height: 58dvh;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    pointer-events: auto;
    background: linear-gradient(180deg, rgba(25, 11, 44, 0.96) 0%, #130724 100%);
    border-top: 3px solid #ffd873;
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.65);
    padding:
      10px
      max(12px, env(safe-area-inset-right))
      max(18px, env(safe-area-inset-bottom))
      max(12px, env(safe-area-inset-left));
    gap: 6px;
  }
  .home-left-column * {
    touch-action: pan-y;
  }
  .home-floating-crest {
    padding-bottom: 4px;
  }
  .home-crest-title {
    font-size: clamp(17px, 5.4vw, 23px);
  }
  .home-chains-row,
  .home-perched-cat {
    display: none;
  }
  .home-ornamental-panel {
    padding: 12px;
    gap: 9px;
  }
  .home-cta-btn {
    padding: 11px 14px;
    font-size: 12px;
  }
  .home-nav-btn {
    padding: 9px 8px;
    font-size: 8.5px;
  }
  .home-quest-scroll {
    margin: 4px 0 0;
    padding: 8px 10px;
  }
  .home-camp-hint {
    display: none;
  }

  /* Portrait modals: comfortable 2-column grids for Shop & Characters */
  .shop-item-grid,
  .char-grid--five {
    grid-template-columns: repeat(2, 1fr);
  }
  .char-grid--three {
    grid-template-columns: 1fr;
  }
  .shop-switch-char-btn {
    display: none;
  }
}

@media (max-width: 680px) and (min-height: 541px) {
  .home-asymmetric-shell {
    padding:
      max(8px, env(safe-area-inset-top))
      max(8px, env(safe-area-inset-right))
      max(10px, env(safe-area-inset-bottom))
      max(8px, env(safe-area-inset-left));
  }
  .home-left-column {
    width: min(100%, 360px);
  }
  .home-ornamental-panel {
    padding: 10px 12px;
    gap: 7px;
  }
  .home-quest-scroll {
    margin: 2px -6px -4px;
    padding: 6px 10px;
  }
  .home-perched-cat {
    width: 32px;
    height: 24px;
    top: -21px;
  }
  .home-camp-hint {
    display: none;
  }
}

.char-status--shard {
  background: rgba(24, 62, 86, 0.9);
  border-color: #7eeeff;
  color: #cff8ff;
}

.settings-toggles-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.settings-toggle-pill {
  justify-content: center;
  font-size: 8.5px;
  padding: 6px 8px;
}

.cloud-sync-box {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 7px 9px;
  background: rgba(16, 12, 34, 0.85);
  border: 1.5px solid rgba(130, 218, 255, 0.45);
}

.cloud-sync-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.cloud-sync-title {
  font-size: 8.5px;
  font-weight: 700;
  color: #bceeff;
  letter-spacing: 0.04em;
}

.cloud-sync-pill {
  padding: 2px 6px;
  font-size: 7.8px;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #e6d7ff;
  background: rgba(45, 26, 74, 0.8);
}

.cloud-sync-pill--synced {
  color: #b4ffde;
  border-color: #62e3a8;
  background: rgba(20, 74, 56, 0.72);
}

.cloud-sync-pill--syncing {
  color: #fff0a8;
  border-color: #ffd866;
  background: rgba(84, 62, 18, 0.72);
}

.cloud-sync-pill--offline {
  color: #ffd0cc;
  border-color: #ff8e85;
  background: rgba(88, 28, 34, 0.72);
}

.cloud-sync-row {
  display: flex;
  align-items: center;
  gap: 5px;
}

.cloud-code-input {
  flex: 1;
  min-width: 0;
  padding: 5px 7px;
  font-family: inherit;
  font-size: 8.8px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #fff7d6;
  background: #140924;
  border: 1.5px solid #6b4894;
  outline: none;
}

.cloud-code-input:focus {
  border-color: #82daff;
}

.cloud-action-btn {
  padding: 5px 8px !important;
  font-size: 8.2px !important;
  white-space: nowrap;
}

.crud-drawer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 3px;
  padding-top: 6px;
  border-top: 1px dashed rgba(130, 218, 255, 0.35);
}

.crud-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 112px;
  overflow-y: auto;
}

.crud-profile-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 5px 7px;
  background: rgba(24, 14, 46, 0.88);
  border: 1px solid rgba(154, 114, 204, 0.4);
  text-align: left;
}

.crud-profile-row--active {
  border-color: #ffe375;
  background: rgba(46, 26, 78, 0.92);
}

.crud-profile-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.crud-profile-name {
  font-size: 8.4px;
  font-weight: 700;
  color: #fff6d6;
  display: flex;
  align-items: center;
  gap: 5px;
}

.crud-active-tag {
  padding: 1px 4px;
  font-size: 7px;
  color: #211033;
  background: #ffe375;
}

.crud-profile-meta {
  font-size: 7.4px;
  color: #c8b8e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.crud-profile-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.cloud-mini-btn {
  padding: 3px 6px !important;
  font-size: 7.5px !important;
}

.cloud-mini-btn--danger {
  border-color: #ff8e85 !important;
  color: #ffd0cc !important;
}

.crud-log-box {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 5px 7px;
  background: rgba(11, 8, 24, 0.85);
  border: 1px solid rgba(122, 186, 255, 0.28);
  text-align: left;
}

.crud-log-title {
  font-size: 7.4px;
  font-weight: 700;
  color: #9de2ff;
  letter-spacing: 0.04em;
  margin-bottom: 1px;
}

.crud-log-row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 7.4px;
  color: #e4d8f5;
}

.crud-badge {
  padding: 1px 4px;
  font-size: 6.8px;
  font-weight: 700;
  flex-shrink: 0;
}

.crud-badge--create {
  background: #1d6b4b;
  color: #b8ffe0;
}

.crud-badge--update {
  background: #30558a;
  color: #c8e6ff;
}

.crud-badge--delete {
  background: #7a2634;
  color: #ffd0d6;
}

.crud-badge--read {
  background: #4e3478;
  color: #ebd6ff;
}

.crud-log-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.speedrun-result-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(22, 11, 40, 0.8);
  border: 2px solid rgba(142, 238, 255, 0.55);
}

.sr-result-time {
  font-size: 10.5px;
  font-weight: 700;
  color: #c4ffe6;
  font-variant-numeric: tabular-nums;
}

.sr-result-shards {
  font-size: 9.5px;
  font-weight: 700;
  color: #9eeeff;
}

.modal-footer {
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  flex-wrap: wrap;
}

.modal-footer--between {
  justify-content: space-between;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.stat-item {
  padding: 7px 10px;
  background: rgba(20, 9, 34, 0.72);
  border: 2px solid rgba(255, 179, 211, 0.42);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stat-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #ddb8e8;
}

.stat-val {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
}

.stat-val--gold {
  color: #ffe375;
}

.live-preview-perk {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.perk-pill-tag {
  padding: 2px 6px;
  font-size: 8px;
  font-weight: 700;
  color: #fff6c2;
  background: rgba(94, 52, 128, 0.92);
  border: 1px solid #ffd873;
  white-space: nowrap;
}

.perk-pill-desc {
  font-size: 8.5px;
  color: #d6f5ff;
  line-height: 1.3;
}

.char-perk-badge {
  padding: 2px 5px;
  font-size: 7.5px;
  font-weight: 700;
  color: #dff7ff;
  background: rgba(34, 62, 92, 0.72);
  border: 1px solid rgba(138, 224, 255, 0.55);
  line-height: 1.25;
}

.char-perk-badge--inline {
  margin-top: 3px;
  display: inline-block;
}

.char-perk-desc-mini {
  margin: 2px 0 0;
  font-size: 7.4px;
  line-height: 1.3;
  color: #d6c8eb;
}

.level-select-scroll {
  flex: 1 1 auto;
  min-height: 0;
  max-height: 68dvh;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding-right: 4px;
  touch-action: pan-y;
}

.secret-finale-section {
  margin-top: 12px;
  padding: 10px;
  background: linear-gradient(180deg, rgba(64, 16, 48, 0.72), rgba(26, 12, 54, 0.85));
  border: 2px solid #ff7ca8;
  box-shadow: 0 3px 0 #140724;
}

.secret-finale-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.secret-finale-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #ffe475;
  text-shadow: 0 2px 0 #160926;
}

.secret-finale-badge {
  padding: 2px 7px;
  font-size: 8.2px;
  font-weight: 700;
  border: 1px solid #ff9ec4;
}

.secret-finale-badge--open {
  background: rgba(32, 92, 74, 0.85);
  border-color: #8ef0c8;
  color: #d9fff0;
}

.secret-finale-badge--locked {
  background: rgba(54, 18, 48, 0.85);
  border-color: #ff8cb8;
  color: #ffd4e6;
}

.secret-finale-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.level-card--boss {
  border-color: #ff7ca8;
  background: rgba(44, 14, 52, 0.82);
}

.boss-reward-hint {
  font-size: 7.8px;
  color: #ffe885;
  margin-top: 2px;
}

@media (orientation: landscape) and (max-height: 500px) {
  .quest-claim-btn {
    min-height: 40px;
    padding: 4px 10px;
  }
  .home-daily-row {
    gap: 4px;
  }
  .home-daily-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

@media (max-width: 640px) {
  .secret-finale-grid {
    grid-template-columns: 1fr;
  }
}

.coin-breakdown-box {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 7px 10px;
  background: rgba(34, 18, 56, 0.88);
  border: 2px solid #ffd866;
}

.coin-breakdown-title {
  font-size: 8.8px;
  font-weight: 700;
  color: #ffe475;
  letter-spacing: 0.04em;
}

.coin-breakdown-pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
}

.photo-chip-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
}

.photo-chip-grid--emotes {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.photo-controls-col {
  max-height: 58dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-right: 4px;
}

.celebration-backdrop {
  z-index: 60;
  background: radial-gradient(circle at center, rgba(46, 18, 72, 0.72), rgba(10, 4, 24, 0.88));
}

.celebration-card {
  position: relative;
  max-width: 390px;
  border-color: #ffe466;
  box-shadow: 0 0 0 2px #1a0b2e, 0 0 28px rgba(255, 224, 102, 0.35);
}

.celebration-confetti {
  position: absolute;
  inset: 8px 12px auto 12px;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  font-size: 14px;
}

.conf-star--1,
.conf-star--4 {
  color: #ffe466;
}

.conf-star--2 {
  color: #ff8cb8;
}

.conf-star--3 {
  color: #8ef0ff;
}

.celebration-stage {
  position: relative;
  margin: 4px auto;
  width: 92px;
  height: 92px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, rgba(255, 228, 128, 0.25), rgba(34, 16, 56, 0.78));
  border: 2px solid #ffe475;
}

.celebration-emote-bubble {
  position: absolute;
  top: -11px;
  right: -10px;
  padding: 2px 6px;
  font-size: 9px;
  font-weight: 700;
  color: #ff4f8b;
  background: #fff8ee;
  border: 2px solid #1a0c2e;
}

.celebration-sprite-img {
  width: 72px;
  height: 72px;
  image-rendering: pixelated;
  animation: celebrationHop 0.9s ease-in-out infinite;
}

@keyframes celebrationHop {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-7px);
  }
}

.celebration-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.style-switcher-row--four {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
}

.touch-opacity-row {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.touch-customize-btn {
  margin-top: 4px;
  width: 100%;
  font-size: 9px;
  padding: 7px 10px;
}

.guide-perks-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 7px;
  margin-bottom: 4px;
}

.guide-perk-card {
  padding: 7px 9px;
  text-align: left;
  background: rgba(36, 52, 82, 0.85);
  border: 2px solid #84d6ff;
  box-shadow: 0 3px 0 #160926;
}

.guide-events-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 7px;
  margin-bottom: 4px;
}

@media (max-width: 720px) {
  .level-grid,
  .shop-item-grid,
  .char-grid--five {
    grid-template-columns: repeat(2, 1fr);
  }
  .char-grid--three,
  .ach-grid,
  .photo-studio-layout,
  .guide-grid,
  .guide-perks-grid,
  .guide-events-grid,
  .guide-special-grid,
  .guide-world-grid {
    grid-template-columns: 1fr;
  }
  .title-hero {
    flex-direction: column;
    gap: 6px;
  }
  .title-heading-group {
    text-align: center;
  }
}
</style>
