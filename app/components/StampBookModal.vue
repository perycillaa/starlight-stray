<script setup lang="ts">
import { computed, ref } from 'vue'
import { ACHIEVEMENTS } from '~/game/achievements'
import { countRankSLevels, countTotalCollectedShards, getStampProgress } from '~/composables/useAchievements'
import type { AchievementId, SaveProgress } from '~/game/types'

const props = defineProps<{
  progress: SaveProgress
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'claim', id: AchievementId): void
}>()

const activeFilter = ref<'all' | 'claimable' | 'unlocked' | 'locked'>('all')

const stampEntries = computed(() => {
  const claimedSet = new Set(props.progress.claimedAchievements ?? [])
  const list = ACHIEVEMENTS.map((def) => {
    const unlocked = props.progress.unlockedAchievements.includes(def.id)
    const claimed = unlocked && claimedSet.has(def.id)
    const canClaim = unlocked && !claimed
    const prog = getStampProgress(def.id, props.progress)
    return {
      ...def,
      unlocked,
      claimed,
      canClaim,
      prog,
      pct: Math.min(100, Math.round((prog.current / Math.max(1, prog.target)) * 100))
    }
  })
  // Always surface ready-to-claim rewards at the very top so players never miss them!
  return list.sort((a, b) => Number(b.canClaim) - Number(a.canClaim))
})

const unclaimedCount = computed(() => stampEntries.value.filter((s) => s.canClaim).length)

const filteredStamps = computed(() => {
  if (activeFilter.value === 'claimable') return stampEntries.value.filter((s) => s.canClaim)
  if (activeFilter.value === 'unlocked') return stampEntries.value.filter((s) => s.unlocked)
  if (activeFilter.value === 'locked') return stampEntries.value.filter((s) => !s.unlocked)
  return stampEntries.value
})

const unlockedCount = computed(() => stampEntries.value.filter((s) => s.unlocked).length)
const totalShards = computed(() => countTotalCollectedShards(props.progress))
const totalSRanks = computed(() => countRankSLevels(props.progress))

function getStampSvgPath(id: AchievementId): string {
  switch (id) {
    case 'first-step':
      return 'M3 4h2v2H3V4zm6 0h2v2H9V4zM2 7h2v2H2V7zm8 0h2v2h-2V7zM4 8h6v3H9v1H5v-1H4V8z'
    case 'rooftop-sprinter':
      return 'M5 1h4v2H5V1zM3 4h8v1h1v6h-1v1H3v-1H2V5h1V4zm3 2v3h3V8H7V6H6z'
    case 'biome-explorer':
      return 'M6 1h2v2h2v2h2v2h-2v2H8v2H6V9H4V7H2V5h2V3h2V1zm0 4v2h2V5H6z'
    case 'starlight-collector':
      return 'M6 0h2v3h2v1h3v2h-3v1H9v3H7V8H5v2H4V7H1V5h3V4h2V0z'
    case 'fashionista-stray':
      return 'M4 3h6v3h2v2H2V6h2V3zm1 1v2h4V4H5zm-2 5h8v2H3V9z'
    case 'full-squad':
      return 'M2 3h2v2h2V3h2v2h2V3h2v6h-1v2H3V9H2V3zm2 4v1h1V7H4zm5 0v1h1V7H9z'
    case 'pacifist-run':
      return 'M2 6h3V4h3V2h3v3h1v3h-2v2H6v1H3V9H2V6zm5-2v2h2V4H7z'
    case 'nine-lives':
      return 'M5 1h4v2H7v1H6v4h1v1h2v2H5v-1H3V8H2V4h1V2h2V1z'
    case 'swift-paws':
      return 'M1 4h6v2H1V4zm2 3h8v2H3V7zm-1 3h6v2H2v-2zm8-7h3v2h-3V3z'
    case 'starlight-speedster':
      return 'M6 0h2v3h3v2H9v2h2v2H8v3H6V9H3V7h2V5H3V3h3V0z'
    case 'lightning-stray':
      return 'M7 0h4L8 5h4L5 13H4l2-6H2L7 0z'
    default:
      return 'M4 1h6v1h2v2h1v4h-1v2h-2v1H4v-1H2V8H1V4h1V2h2V1zm1 2v2h2V3H5zm3 3v2h2V6H8z'
  }
}
</script>

<template>
  <div class="overlay-backdrop">
    <div class="pixel-panel stampbook-modal">
      <div class="stampbook-header">
        <div class="stampbook-title-group">
          <h2 class="stampbook-title">📔 STAMP BOOK</h2>
          <span class="stampbook-sub">Buku Stempel Petualangan • Klik Tombol Klaim Untuk Mengambil Hadiah Ikan Emas!</span>
        </div>
        <div class="stampbook-counters">
          <span class="stamp-chip">🏆 {{ unlockedCount }}/{{ stampEntries.length }}</span>
          <span class="stamp-chip stamp-chip--shard">💎 {{ totalShards }}/36</span>
        </div>
      </div>

      <!-- Filter Pills for Easy Browsing across all 36 Achievements -->
      <div class="stamp-filter-row" role="tablist" aria-label="Filter Pencapaian">
        <button
          type="button"
          class="stamp-filter-btn"
          :class="{ 'stamp-filter-btn--active': activeFilter === 'all' }"
          @click="activeFilter = 'all'"
        >
          Semua ({{ stampEntries.length }})
        </button>
        <button
          v-if="unclaimedCount > 0"
          type="button"
          class="stamp-filter-btn stamp-filter-btn--claimable"
          :class="{ 'stamp-filter-btn--active': activeFilter === 'claimable' }"
          @click="activeFilter = 'claimable'"
        >
          🎁 Siap Klaim ({{ unclaimedCount }})
        </button>
        <button
          type="button"
          class="stamp-filter-btn"
          :class="{ 'stamp-filter-btn--active': activeFilter === 'unlocked' }"
          @click="activeFilter = 'unlocked'"
        >
          ✓ Tercapai ({{ unlockedCount }})
        </button>
        <button
          type="button"
          class="stamp-filter-btn"
          :class="{ 'stamp-filter-btn--active': activeFilter === 'locked' }"
          @click="activeFilter = 'locked'"
        >
          🔒 Belum ({{ stampEntries.length - unlockedCount }})
        </button>
      </div>

      <!-- Notebook Binding Dots -->
      <div class="notebook-spine" aria-hidden="true">
        <span v-for="n in 12" :key="n" class="spine-ring" />
      </div>

      <div class="stamp-grid">
        <div
          v-for="st in filteredStamps"
          :key="st.id"
          class="stamp-card"
          :class="{
            'stamp-card--unlocked': st.unlocked,
            'stamp-card--claimable': st.canClaim
          }"
        >
          <div
            class="stamp-seal"
            :class="{ 'stamp-seal--locked': !st.unlocked }"
            :style="st.unlocked ? { borderColor: st.stampColor, color: st.stampColor } : undefined"
          >
            <svg viewBox="0 0 14 13" width="22" height="20" class="stamp-pixel-svg" aria-hidden="true">
              <path :d="getStampSvgPath(st.id)" fill="currentColor" />
            </svg>
          </div>

          <div class="stamp-body">
            <div class="stamp-head">
              <span class="stamp-name">{{ st.icon }} {{ st.name }}</span>
              <span
                v-if="!st.canClaim"
                class="stamp-reward"
                :class="{ 'stamp-reward--claimed': st.claimed }"
              >
                {{ st.claimed ? `✓ +${st.rewardFish}🐟` : `+${st.rewardFish}🐟` }}
                <template v-if="st.rewardCosmeticLabel"> + {{ st.rewardCosmeticLabel }}</template>
              </span>
            </div>
            <p class="stamp-desc">{{ st.description }}</p>
            <button
              v-if="st.canClaim"
              type="button"
              class="stamp-claim-btn"
              @click="$emit('claim', st.id)"
            >
              🎁 KLAIM +{{ st.rewardFish }} 🐟
              <template v-if="st.rewardCosmeticLabel"> + {{ st.rewardCosmeticLabel }}</template>
            </button>
            <div v-else-if="!st.unlocked" class="stamp-prog-row">
              <div class="stamp-prog-track">
                <div class="stamp-prog-fill" :style="{ width: `${st.pct}%` }" />
              </div>
              <span class="stamp-prog-label">{{ st.prog.label }}</span>
            </div>
            <div v-else class="stamp-ink-mark" :style="{ color: st.stampColor }">
              ★ HADIAH DIKLAIM • {{ st.subtitle }}
            </div>
          </div>
        </div>
      </div>

      <div class="stampbook-stats">
        <span>💎 Shard: {{ totalShards }}/36</span>
        <span>•</span>
        <span>⚡ Rank S: {{ totalSRanks }}/12</span>
        <span>•</span>
        <span>🐟 Ikan: {{ progress.totalFishEarned }}</span>
        <span>•</span>
        <span>🌙 Jatuh: {{ progress.totalFalls }}</span>
      </div>

      <div class="stampbook-footer">
        <button type="button" class="pixel-btn pixel-btn--secondary" @click="$emit('close')">
          ◀ Menu Utama
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  background: rgba(11, 6, 24, 0.72);
  z-index: 32;
}

.stampbook-modal {
  width: min(94%, 640px);
  max-height: min(90dvh, calc(100% - 8px));
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  background: linear-gradient(180deg, #2b183d 0%, #1d102b 100%);
  border: 3px solid #f7c583;
  box-shadow:
    0 0 0 3px #140821,
    0 12px 32px rgba(0, 0, 0, 0.72),
    inset 0 2px 0 rgba(255, 236, 194, 0.25);
  color: #fff6e8;
}

.stampbook-modal *,
.stampbook-modal > * {
  touch-action: pan-y;
}

.stampbook-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.stampbook-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}

.stampbook-title {
  margin: 0;
  font-size: 13px;
  color: #ffe382;
  letter-spacing: 0.05em;
  text-shadow: 0 2px 0 #140821;
}

.stampbook-sub {
  font-size: 8.5px;
  color: #dec7ee;
}

.stampbook-counters {
  display: inline-flex;
  gap: 6px;
}

.stamp-chip {
  padding: 3px 8px;
  font-size: 9px;
  font-weight: 700;
  background: rgba(24, 11, 38, 0.85);
  border: 2px solid #ffd873;
  color: #ffe896;
}

.stamp-chip--shard {
  border-color: #9ee8ff;
  color: #c9f4ff;
}

.notebook-spine {
  display: flex;
  justify-content: space-around;
  padding: 2px 6px;
  border-top: 2px dashed rgba(247, 197, 131, 0.35);
  border-bottom: 2px dashed rgba(247, 197, 131, 0.35);
}

.spine-ring {
  width: 8px;
  height: 4px;
  background: rgba(255, 224, 150, 0.45);
}

.stamp-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.stamp-filter-btn {
  padding: 4px 9px;
  font-family: inherit;
  font-size: 8.5px;
  font-weight: 700;
  color: #e2cef2;
  background: rgba(24, 11, 38, 0.78);
  border: 2px solid #5f4280;
  cursor: pointer;
}

.stamp-filter-btn--claimable {
  border-color: #ff9ec4;
  color: #ffd6e8;
}

.stamp-filter-btn--active {
  color: #210e30;
  background: #ffd873;
  border-color: #fff2b0;
}

.stamp-card--claimable {
  opacity: 1;
  background: linear-gradient(180deg, rgba(84, 38, 112, 0.96) 0%, rgba(52, 22, 76, 0.96) 100%);
  border: 2px solid #ffe466;
  box-shadow: 0 0 12px rgba(255, 224, 102, 0.35), 0 3px 0 #140821;
}

.stamp-claim-btn {
  margin-top: 4px;
  align-self: flex-start;
  padding: 5px 10px;
  font-family: inherit;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #241033;
  background: linear-gradient(180deg, #fff099 0%, #ffcb47 100%);
  border: 2px solid #fffbe0;
  box-shadow: 0 2px 0 #160926;
  cursor: pointer;
}

.stamp-claim-btn:hover {
  filter: brightness(1.06);
  transform: translateY(-1px);
}

.stamp-claim-btn:active {
  transform: translateY(1px);
}

.stamp-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
  max-height: 245px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 3px;
}

@media (max-width: 960px), (max-height: 580px) {
  .stampbook-modal > * {
    flex-shrink: 0;
  }
  .stamp-grid {
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
}

@media (max-width: 600px) {
  .stamp-grid {
    grid-template-columns: 1fr;
  }
}

.stamp-card {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 8px 9px;
  text-align: left;
  background: rgba(34, 19, 52, 0.86);
  border: 2px dashed #6b4b8a;
  opacity: 0.78;
  min-width: 0;
  overflow: hidden;
}

.stamp-card--unlocked {
  opacity: 1;
  background: rgba(58, 30, 80, 0.94);
  border: 2px solid #ffd873;
  box-shadow: 0 3px 0 #140821;
}

.stamp-seal {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 245, 220, 0.08);
  border: 2px dashed #ffe375;
  transform: rotate(-4deg);
}

.stamp-seal--locked {
  color: #7c6296;
  border-color: #5b4075;
  background: rgba(18, 9, 30, 0.7);
  transform: none;
}

.stamp-pixel-svg {
  image-rendering: pixelated;
  filter: drop-shadow(0 1px 0 #140821);
}

.stamp-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.stamp-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px;
}

.stamp-name {
  font-size: 9px;
  font-weight: 700;
  color: #ffffff;
  word-break: break-word;
}

.stamp-reward {
  font-size: 7.5px;
  font-weight: 700;
  padding: 1px 5px;
  background: rgba(255, 216, 115, 0.14);
  border: 1px solid rgba(255, 216, 115, 0.55);
  color: #ffe375;
  white-space: normal;
  max-width: 100%;
  word-break: break-word;
}

.stamp-reward--claimed {
  background: rgba(110, 230, 184, 0.18);
  border-color: #7de8c2;
  color: #b4ffe3;
}

.stamp-desc {
  margin: 0;
  font-size: 8px;
  line-height: 1.35;
  color: #e2cef2;
}

.stamp-prog-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.stamp-prog-track {
  flex: 1;
  height: 5px;
  background: #170a26;
  border: 1px solid rgba(255, 255, 255, 0.22);
  overflow: hidden;
}

.stamp-prog-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff9ec4, #ffe375);
}

.stamp-prog-label {
  font-size: 7.5px;
  color: #ccb6e0;
  white-space: nowrap;
}

.stamp-ink-mark {
  font-size: 7.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-top: 1px;
}

.stampbook-stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 7px;
  font-size: 8.5px;
  color: #e6d1f7;
  padding: 5px 8px;
  background: rgba(18, 9, 31, 0.65);
  border: 1px solid rgba(255, 216, 115, 0.35);
}

.stampbook-footer {
  display: flex;
  justify-content: flex-start;
}

@media (max-width: 680px) {
  .stamp-grid {
    grid-template-columns: 1fr;
  }
}
</style>
