<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { MoonpawGameEngine } from '~/game/engine'
import { LEVELS } from '~/game/levels'
import type {
  AudioSettings,
  CapeId,
  CharacterId,
  GraphicsStyle,
  HatId,
  HudSnapshot,
  PhotoModePose,
  ScarfColorId,
  TouchControlsMode
} from '~/game/types'
import type { TouchControlKey } from '~/components/MobileTouchControls.vue'

const {
  saveState: progress,
  saveIndicatorVisible,
  playerId,
  playerName,
  cloudSyncStatus,
  cloudProfiles,
  recentCrudLogs,
  loadGame,
  syncToCloud,
  loadFromCloud,
  createCloudProfile,
  updatePlayerName,
  deleteCloudProfile,
  switchPlayerId,
  refreshCloudData,
  syncFromEngine,
  triggerSaveIndicator,
  exportSaveData,
  importSaveData,
  resetSaveData
} = useGameSave()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const importFeedback = ref('')
const isStyleFading = ref(false)
const rotateBannerDismissed = ref(false)
const isTouchOrCompact = ref(false)
let styleFadeTimeout: number | null = null

const isMobileControlsVisible = computed(() => {
  const mode = progress.value.touchControlsMode
  if (mode === 'off') return false
  if (mode === 'on') return true
  return isTouchOrCompact.value
})

function updateTouchViewportDetection() {
  if (typeof window === 'undefined') return
  const hasTouch =
    'ontouchstart' in window ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
    window.matchMedia('(pointer: coarse)').matches
  isTouchOrCompact.value = hasTouch || window.innerWidth < 900
}

let audioUnlocked = false
function handleFirstGestureAudioUnlock() {
  if (audioUnlocked) return
  audioUnlocked = true
  engine?.unlockAudio()
  window.removeEventListener('pointerdown', handleFirstGestureAudioUnlock, true)
  window.removeEventListener('touchstart', handleFirstGestureAudioUnlock, true)
  window.removeEventListener('keydown', handleFirstGestureAudioUnlock, true)
}

const hud = ref<HudSnapshot>({
  screen: 'title',
  levelId: 1,
  levelName: LEVELS[0]!.name,
  biome: LEVELS[0]!.biome,
  hearts: 3,
  maxHearts: 3,
  score: 0,
  levelScore: 0,
  starsCollected: 0,
  totalStars: 0,
  fishCollected: 0,
  totalFish: 0,
  stageRating: 1,
  justEarnedThreeStarBonus: false,
  isTimeTrial: false,
  timeTrialElapsedMs: 0,
  timeTrialGoldMs: 24000,
  timeTrialSilverMs: 32000,
  timeTrialBronzeMs: 44000,
  lastTimeTrialMedal: 'none',
  isNewTimeRecord: false,
  runElapsedMs: 0,
  lastSpeedrunRank: 'C',
  isNewBestTime: false,
  lastRankRewardBreakdown: [],
  lastRankRewardTotal: 0,
  showSpeedrunTimer: progress.value.showSpeedrunTimer,
  shardsCollected: 0,
  shardStatus: [false, false, false],
  photoModePose: 'idle',
  photoModeFrame: true,
  homeBiome: 'rooftops',
  homeBackdropMode: progress.value.homeBackdropMode,
  hasUnseenStamps: progress.value.hasUnseenStamps,
  highScore: progress.value.highScore,
  fishBank: progress.value.fishBank,
  unlockedLevel: progress.value.unlockedLevel,
  selectedCharacter: progress.value.selectedCharacter,
  selectedScarf: progress.value.selectedScarf,
  selectedHat: progress.value.selectedHat,
  selectedCape: progress.value.selectedCape,
  graphicsStyle: progress.value.graphicsStyle,
  touchControlsMode: progress.value.touchControlsMode,
  checkpointReached: false,
  starComboCount: 0,
  starComboTimer: 0,
  starComboMax: 2.5,
  isMuted: progress.value.muted,
  dashReady: true,
  dashCharge: 1,
  isDashing: false,
  featherTimer: 0,
  featherMax: 8,
  magnetTimer: 0,
  magnetMax: 10,
  hasBubbleShield: false,
  mooncakeTimer: 0,
  mooncakeMax: 8,
  yarnTimer: 0,
  yarnMax: 10,
  mochiTimer: 0,
  mochiMax: 8,
  candyTimer: 0,
  candyMax: 7,
  pearlTimer: 0,
  pearlMax: 10,
  hurtPulseCount: 0,
  recentToast: null,
  starRingActive: false,
  starRingCollected: 0,
  starRingTotal: 8,
  starRingTimer: 0,
  nightEvent: 'none',
  nightEventBanner: null,
  meteorShowerActive: false,
  meteorShowerTimer: 0,
  autoSavePulse: 0
})

// Subtle ~1.15s non-intrusive pixel-art save indicator + background TiDB Cloud sync
watch(
  () => hud.value.autoSavePulse,
  (nextVal, prevVal) => {
    if (nextVal > (prevVal ?? 0)) {
      triggerSaveIndicator(engine?.getProgress())
    }
  }
)

let engine: MoonpawGameEngine | null = null

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  updateTouchViewportDetection()
  window.addEventListener('resize', updateTouchViewportDetection, { passive: true })
  window.addEventListener('orientationchange', updateTouchViewportDetection, { passive: true })

  // One-time global first-touch / first-gesture Web Audio API unlock for iOS Safari & Android Chrome
  window.addEventListener('pointerdown', handleFirstGestureAudioUnlock, { capture: true, passive: true })
  window.addEventListener('touchstart', handleFirstGestureAudioUnlock, { capture: true, passive: true })
  window.addEventListener('keydown', handleFirstGestureAudioUnlock, { capture: true, passive: true })

  // SSR-safe client hydration from localStorage before starting game loop
  const loadedProgress = loadGame()
  engine = new MoonpawGameEngine(
    canvas,
    (snapshot) => {
      hud.value = snapshot
      if (engine) {
        syncFromEngine(engine.getProgress())
      }
    },
    loadedProgress
  )
  engine.startLoop()

  // Non-blocking background sync with TiDB Cloud Serverless
  void loadFromCloud().then((res) => {
    if (res.applied && res.progress && engine) {
      engine.applyProgress(res.progress, false)
    }
  })
})

onBeforeUnmount(() => {
  if (styleFadeTimeout !== null) window.clearTimeout(styleFadeTimeout)
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateTouchViewportDetection)
    window.removeEventListener('orientationchange', updateTouchViewportDetection)
    window.removeEventListener('pointerdown', handleFirstGestureAudioUnlock, true)
    window.removeEventListener('touchstart', handleFirstGestureAudioUnlock, true)
    window.removeEventListener('keydown', handleFirstGestureAudioUnlock, true)
  }
  engine?.destroy()
  engine = null
})

function handleTouchInput(control: TouchControlKey, pressed: boolean) {
  engine?.setTouchInput(control, pressed)
}

function handleStartNew() {
  engine?.startNewGame()
}

function handleOpenLevelSelect() {
  engine?.openLevelSelect()
}

function handleOpenCharacters() {
  engine?.openCharacters()
}

function handleOpenShop() {
  engine?.openShop()
}

function handleOpenAchievements() {
  engine?.openAchievements()
}

function handleOpenPhotoStudio() {
  engine?.openPhotoStudio()
}

function handleOpenGuidebook() {
  engine?.openGuidebook()
}

function handleContinueCheckpoint() {
  engine?.continueFromCheckpoint()
}

function handleClaimDailyQuest() {
  engine?.claimDailyQuestReward()
}

function handleStartTimeTrial(id: number) {
  engine?.startTimeTrial(id)
}

function handleOpenSettings() {
  importFeedback.value = ''
  engine?.openSettings()
  void refreshCloudData()
}

function handleOpenTitle() {
  engine?.openTitle()
}

function handleOpenEnding() {
  engine?.openEndingCutscene()
}

function handleSetTouchControlsMode(mode: TouchControlsMode) {
  engine?.setTouchControlsMode(mode)
}

function handleSetShowSpeedrunTimer(enabled: boolean) {
  engine?.setShowSpeedrunTimer(enabled)
}

function handleSetReduceMotion(enabled: boolean) {
  engine?.setReduceMotion(enabled)
}

function handleCycleHomeBackdrop() {
  engine?.cycleHomeBackdropMode()
}

function handleTriggerCampReaction() {
  engine?.triggerCampReaction()
}

function handleOpenPhotoMode() {
  engine?.openPhotoMode()
}

function handleExitPhotoMode() {
  engine?.exitPhotoMode()
}

function handleCyclePhotoModePose(pose: PhotoModePose) {
  engine?.setPhotoModePose(pose)
}

function handleTogglePhotoModeFrame() {
  engine?.togglePhotoModeFrame()
}

function handleSnapPhotoModePostcard() {
  if (!engine) return
  const dataUrl = engine.snapPhotoModePostcard()
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `starlight-stray-postcard-lvl${hud.value.levelId}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function handleToggleTouchPad() {
  const cur = progress.value.touchControlsMode
  const next: TouchControlsMode = cur === 'on' ? 'off' : 'on'
  engine?.setTouchControlsMode(next)
}

function handleSelectLevel(id: number) {
  engine?.startLevel(id)
}

function handleSelectCharacter(id: CharacterId) {
  engine?.selectCharacter(id)
}

function handleUnlockCharacter(id: CharacterId) {
  engine?.unlockCharacter(id)
}

function handleBuyOrEquipScarf(id: ScarfColorId) {
  engine?.buyOrEquipScarf(id)
}

function handleBuyOrEquipHat(id: HatId) {
  engine?.buyOrEquipHat(id)
}

function handleBuyOrEquipCape(id: CapeId) {
  engine?.buyOrEquipCape(id)
}

function handleUpdateAudio(partial: Partial<AudioSettings>) {
  engine?.updateAudioSettings(partial)
}

function handleSetGraphicsStyle(style: GraphicsStyle) {
  if (!engine || hud.value.graphicsStyle === style) return
  isStyleFading.value = true
  engine.setGraphicsStyle(style)
  if (styleFadeTimeout !== null) window.clearTimeout(styleFadeTimeout)
  styleFadeTimeout = window.setTimeout(() => {
    isStyleFading.value = false
    styleFadeTimeout = null
  }, 150)
}

function handleExportJson() {
  if (engine) {
    syncFromEngine(engine.getProgress())
  }
  const json = exportSaveData()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'starlight-stray-save.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  importFeedback.value = 'Cadangan starlight-stray-save.json berhasil diunduh!'
}

function handleImportJson(rawText: string) {
  const res = importSaveData(rawText)
  if (!res.ok) {
    importFeedback.value = res.error
    return
  }
  engine?.applyProgress(res.progress, true)
  importFeedback.value = 'Data simpanan berhasil dimuat dan langsung tersimpan!'
}

function handleResetSave() {
  resetSaveData()
  engine?.resetProgress()
  importFeedback.value = 'Progres telah direset ke kondisi awal (lokal & TiDB Cloud).'
}

async function handleSyncCloudNow() {
  const latest = engine ? engine.getProgress() : progress.value
  const ok = await syncToCloud(latest, { immediate: true })
  if (ok) await refreshCloudData()
  importFeedback.value = ok
    ? `UPDATE tersimpan ke TiDB (${playerId.value})!`
    : 'Gagal terhubung ke TiDB Cloud — data tetap aman tersimpan lokal.'
}

async function handleSwitchPlayerId(nextCode: string) {
  const res = await switchPlayerId(nextCode)
  if (!res.ok) {
    importFeedback.value = res.error || 'Gagal mengganti kode Cloud Sync.'
    return
  }
  if (res.mode === 'loaded' && res.progress) {
    engine?.applyProgress(res.progress, false)
    importFeedback.value = `READ berhasil: profil ${res.playerId} dimuat dari TiDB!`
  } else {
    importFeedback.value = `CREATE berhasil: kode ${res.playerId} disimpan ke TiDB!`
  }
}

async function handleCreateProfile(displayName: string) {
  const res = await createCloudProfile(displayName)
  if (!res.ok) {
    importFeedback.value = res.error || 'Gagal membuat profil baru di TiDB.'
    return
  }
  if (res.progress) {
    engine?.applyProgress(res.progress, false)
  }
  importFeedback.value = `CREATE berhasil: profil "${res.displayName}" (${res.playerId}) dibuat di TiDB!`
}

async function handleRenameProfile(nextName: string) {
  const res = await updatePlayerName(nextName)
  if (!res.ok) {
    importFeedback.value = res.error || 'Gagal mengubah nama profil.'
    return
  }
  importFeedback.value = `UPDATE berhasil: nama diubah menjadi "${res.displayName}" di TiDB!`
}

async function handleDeleteProfile(targetId: string) {
  const res = await deleteCloudProfile(targetId)
  if (!res.ok) {
    importFeedback.value = res.error || 'Gagal menghapus profil dari TiDB.'
    return
  }
  if (res.deletedActive && res.nextProgress) {
    engine?.applyProgress(res.nextProgress, false)
  }
  importFeedback.value = `DELETE berhasil: profil ${targetId} dihapus dari semua tabel TiDB!`
}

function handleNextLevel() {
  engine?.nextLevel()
}

function handleRestart() {
  engine?.restartLevel()
}

function handleTogglePause() {
  engine?.togglePause()
}

function handleToggleMute() {
  engine?.toggleMute()
}
</script>

<template>
  <main class="game-shell">
    <div class="game-cabinet">
      <div class="stage-frame">
        <canvas
          ref="canvasRef"
          class="pixel-canvas game-canvas"
          width="384"
          height="216"
          aria-label="Kanvas Permainan Starlight Stray 2D Pixel Platformer"
        />

        <!-- Top Retro Kawaii HUD visible during active play / pause -->
        <GameHud
          v-if="hud.screen === 'playing' || hud.screen === 'paused'"
          :hud="hud"
          :show-touch-pad="progress.touchControlsMode === 'on'"
          :mobile-pause-visible="isMobileControlsVisible && hud.screen === 'playing'"
          @toggle-mute="handleToggleMute"
          @toggle-pause="handleTogglePause"
          @restart="handleRestart"
          @toggle-touch-pad="handleToggleTouchPad"
        />

        <!-- Subtle, Dismissible Portrait Landscape Suggestion Pill (never blocks gameplay!) -->
        <div
          v-if="!rotateBannerDismissed && (hud.screen === 'title' || hud.screen === 'playing')"
          class="portrait-rotate-pill"
          role="status"
          aria-live="polite"
        >
          <span>Putar HP ke Landscape untuk pengalaman terbaik 🔄</span>
          <button
            type="button"
            class="portrait-rotate-close"
            aria-label="Tutup saran orientasi"
            @click="rotateBannerDismissed = true"
          >
            ✕
          </button>
        </div>

        <!-- Menus, Level Select, Karakter, Toko Aksesoris, Scrapbook, Settings, Clear, Epilogue & Game Over -->
        <GameOverlays
          :hud="hud"
          :levels="LEVELS"
          :progress="progress"
          :import-feedback="importFeedback"
          :player-id="playerId"
          :player-name="playerName"
          :cloud-sync-status="cloudSyncStatus"
          :cloud-profiles="cloudProfiles"
          :recent-crud-logs="recentCrudLogs"
          @start-new="handleStartNew"
          @open-level-select="handleOpenLevelSelect"
          @open-characters="handleOpenCharacters"
          @open-shop="handleOpenShop"
          @open-achievements="handleOpenAchievements"
          @open-photo-studio="handleOpenPhotoStudio"
          @open-guidebook="handleOpenGuidebook"
          @open-settings="handleOpenSettings"
          @open-title="handleOpenTitle"
          @open-ending="handleOpenEnding"
          @select-level="handleSelectLevel"
          @start-time-trial="handleStartTimeTrial"
          @claim-daily-quest="handleClaimDailyQuest"
          @continue-checkpoint="handleContinueCheckpoint"
          @select-character="handleSelectCharacter"
          @unlock-character="handleUnlockCharacter"
          @buy-or-equip-scarf="handleBuyOrEquipScarf"
          @buy-or-equip-hat="handleBuyOrEquipHat"
          @buy-or-equip-cape="handleBuyOrEquipCape"
          @update-audio="handleUpdateAudio"
          @set-graphics-style="handleSetGraphicsStyle"
          @set-touch-controls-mode="handleSetTouchControlsMode"
          @set-show-speedrun-timer="handleSetShowSpeedrunTimer"
          @set-reduce-motion="handleSetReduceMotion"
          @cycle-home-backdrop="handleCycleHomeBackdrop"
          @trigger-camp-reaction="handleTriggerCampReaction"
          @open-photo-mode="handleOpenPhotoMode"
          @export-json="handleExportJson"
          @import-json="handleImportJson"
          @reset-save="handleResetSave"
          @sync-cloud-now="handleSyncCloudNow"
          @switch-player-id="handleSwitchPlayerId"
          @create-profile="handleCreateProfile"
          @rename-profile="handleRenameProfile"
          @delete-profile="handleDeleteProfile"
          @next-level="handleNextLevel"
          @restart="handleRestart"
          @resume="handleTogglePause"
          @toggle-mute="handleToggleMute"
        />

        <!-- Multi-touch Virtual Controls (automatically hidden during Pause, Photo Mode, Stamp Book & all modals) -->
        <MobileTouchControls
          v-if="hud.screen === 'playing'"
          :mode="progress.touchControlsMode"
          :dash-ready="hud.dashReady"
          :dash-charge="hud.dashCharge"
          @input="handleTouchInput"
          @pause="handleTogglePause"
        />

        <!-- Pause-Menu In-Level Photo Mode & Pixel Postcard Exporter -->
        <PhotoModeOverlay
          v-if="hud.screen === 'photoMode'"
          :hud="hud"
          @cycle-pose="handleCyclePhotoModePose"
          @toggle-frame="handleTogglePhotoModeFrame"
          @snap-postcard="handleSnapPhotoModePostcard"
          @exit-photo-mode="handleExitPhotoMode"
        />

        <!-- Smooth 0.2s Fade-to-Black Transition Curtain for Visual Style Switcher -->
        <div
          class="style-fade-curtain"
          :class="{ 'style-fade-curtain--active': isStyleFading }"
          aria-hidden="true"
        />

        <!-- Subtle Calm Pixel-Art Save Indicator (~1.15s on saves, zero screen shake) -->
        <div
          class="autosave-badge"
          :class="{
            'autosave-badge--visible': saveIndicatorVisible,
            'autosave-badge--playing': hud.screen === 'playing' || hud.screen === 'paused'
          }"
          role="status"
          aria-live="polite"
        >
          <svg
            viewBox="0 0 12 12"
            width="12"
            height="12"
            class="autosave-icon"
            aria-hidden="true"
          >
            <path d="M1 1h8l2 2v8H1V1zm2 1v3h5V2H3zm3 0h1v2H6V2zM3 7v3h6V7H3z" fill="#ffe478" />
          </svg>
          <span>SAVED</span>
        </div>
      </div>

      <!-- Desktop-Only Retro Pixel Control Hint Bar (shown only during active play/pause to keep Home clean!) -->
      <footer
        v-if="hud.screen === 'playing' || hud.screen === 'paused'"
        class="desktop-hint-bar"
        aria-label="Petunjuk Kontrol Keyboard"
      >
        <span><kbd>A/D</kbd> atau <kbd>←/→</kbd> Gerak</span>
        <span class="hint-sep">•</span>
        <span><kbd>W/Spasi/↑</kbd> Lompat</span>
        <span class="hint-sep">•</span>
        <span><kbd>Shift/X</kbd> Dash</span>
        <span class="hint-sep">•</span>
        <span><kbd>P/Esc</kbd> Jeda</span>
        <span class="hint-sep">•</span>
        <span><kbd>R</kbd> Ulangi</span>
        <span class="hint-sep">•</span>
        <span><kbd>M</kbd> Suara</span>
      </footer>
    </div>
  </main>
</template>

<style scoped>
.game-shell {
  width: 100vw;
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #241247 0%, #0b0618 75%);
  overflow: hidden;
  padding: 0;
}

.game-cabinet {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  max-width: calc((100dvh - 34px) * 16 / 9);
}

.stage-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: calc(100dvh - 34px);
  background: #120a24;
  border: 3px solid #593373;
  box-shadow:
    0 0 0 3px #180a29,
    0 18px 54px rgba(0, 0, 0, 0.72);
  overflow: hidden;
}

.game-canvas {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  aspect-ratio: 16 / 9;
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.style-fade-curtain {
  position: absolute;
  inset: 0;
  background: #0a0516;
  opacity: 0;
  pointer-events: none;
  z-index: 50;
  transition: opacity 0.11s ease-in-out;
}

.style-fade-curtain--active {
  opacity: 0.85;
}

.autosave-badge {
  position: absolute;
  right: 12px;
  bottom: 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  background: rgba(24, 11, 40, 0.86);
  border: 1px solid rgba(255, 224, 120, 0.62);
  box-shadow: 0 2px 0 rgba(12, 5, 24, 0.85);
  color: #fff3c4;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  pointer-events: none;
  z-index: 46;
  opacity: 0;
  transition: opacity 0.22s ease;
}

.autosave-badge--playing {
  bottom: auto;
  top: calc(max(9px, env(safe-area-inset-top)) + 38px);
}

.autosave-badge--visible {
  opacity: 0.94;
}

.autosave-icon {
  image-rendering: pixelated;
  animation: autosaveTwinkle 0.55s ease-in-out infinite alternate;
}

@keyframes autosaveTwinkle {
  from {
    opacity: 0.65;
  }
  to {
    opacity: 1;
  }
}

.desktop-hint-bar {
  display: none;
  width: 100%;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px 12px;
  background: linear-gradient(180deg, #2d1740 0%, #1c0d2b 100%);
  border: 2px solid #593373;
  border-top: none;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.55);
  font-size: 10.5px;
  color: #ebd9f7;
  letter-spacing: 0.03em;
}

@media (min-width: 768px) {
  .desktop-hint-bar {
    display: flex;
  }
}

.desktop-hint-bar kbd {
  display: inline-block;
  padding: 1px 5px;
  margin-right: 2px;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  color: #fff6cc;
  background: #48235e;
  border: 1px solid #f7a8ca;
  box-shadow: 0 1px 0 #160926;
}

.hint-sep {
  color: #ff9ec4;
}

/* Subtle, dismissible portrait suggestion pill (hidden on landscape & desktop) */
.portrait-rotate-pill {
  display: none;
  position: absolute;
  left: 50%;
  top: calc(max(8px, env(safe-area-inset-top)) + 44px);
  transform: translateX(-50%);
  align-items: center;
  gap: 8px;
  max-width: calc(100vw - 24px);
  padding: 5px 10px;
  background: rgba(24, 11, 44, 0.88);
  border: 2px solid #ffd873;
  box-shadow: 0 0 0 2px #140824, 0 4px 12px rgba(0, 0, 0, 0.55);
  color: #fff6d6;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  z-index: 28;
  pointer-events: auto;
}

.portrait-rotate-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  color: #ffd6e6;
  background: rgba(74, 34, 96, 0.85);
  border: 1px solid #ff9ec4;
  cursor: pointer;
  flex-shrink: 0;
}

@media (max-width: 767px), (orientation: landscape) and (max-height: 540px) {
  .game-cabinet {
    max-width: 100vw;
    width: 100vw;
    height: 100dvh;
  }

  .stage-frame {
    max-height: 100dvh;
    width: 100vw;
    height: 100dvh;
    aspect-ratio: auto;
    border: none;
    box-shadow: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .game-canvas {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .desktop-hint-bar {
    display: none !important;
  }
}

@media (max-width: 768px) and (orientation: portrait) {
  .portrait-rotate-pill {
    display: inline-flex;
  }

  .stage-frame {
    width: 100vw;
    height: 100dvh;
    aspect-ratio: auto;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: max(46px, calc(env(safe-area-inset-top) + 38px));
  }

  .game-canvas {
    width: 100vw;
    height: auto;
    max-height: 46dvh;
    aspect-ratio: 16 / 9;
  }
}
</style>
