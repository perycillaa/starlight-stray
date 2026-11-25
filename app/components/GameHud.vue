<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { BIOMES } from '~/game/achievements'
import { formatSpeedrunTime, formatTimeTrial } from '~/game/dailyQuest'
import type { HudSnapshot } from '~/game/types'

const props = defineProps<{
  hud: HudSnapshot
  showTouchPad: boolean
  mobilePauseVisible?: boolean
}>()

defineEmits<{
  (e: 'toggleMute'): void
  (e: 'togglePause'): void
  (e: 'restart'): void
  (e: 'toggleTouchPad'): void
}>()

const biomeMeta = computed(() => BIOMES[props.hud.biome])
const hasActiveBuffs = computed(
  () =>
    props.hud.featherTimer > 0 ||
    props.hud.magnetTimer > 0 ||
    props.hud.hasBubbleShield ||
    props.hud.mooncakeTimer > 0 ||
    props.hud.yarnTimer > 0 ||
    props.hud.mochiTimer > 0 ||
    props.hud.candyTimer > 0 ||
    props.hud.pearlTimer > 0 ||
    props.hud.starComboCount >= 2 ||
    props.hud.starRingActive ||
    props.hud.meteorShowerActive ||
    props.hud.nightEvent === 'pinkMoon'
)

// Soft, non-shaking luminous glow pulse on the heart frame when hurt
const heartFlash = ref(false)
let flashTimer: number | null = null

watch(
  () => props.hud.hurtPulseCount,
  (nextVal, prevVal) => {
    if (nextVal > (prevVal ?? 0)) {
      heartFlash.value = true
      if (flashTimer !== null) window.clearTimeout(flashTimer)
      flashTimer = window.setTimeout(() => {
        heartFlash.value = false
        flashTimer = null
      }, 480)
    }
  }
)

onBeforeUnmount(() => {
  if (flashTimer !== null) window.clearTimeout(flashTimer)
})
</script>

<template>
  <header
    class="hud-bar"
    :class="[
      hud.graphicsStyle === 'modern' ? 'hud-bar--modern' : 'hud-bar--classic',
      { 'hud-bar--mobile-pause': mobilePauseVisible }
    ]"
    aria-label="Informasi Permainan"
  >
    <!-- Left Column: Hearts, Dash, Level Ribbon + Active Power-Up Status Pills below Hearts -->
    <div class="hud-left-col">
      <div class="hud-cluster">
        <!-- Kawaii Warm Night-Wood/Pink Heart Frame -->
        <div
          class="kawaii-frame kawaii-hearts"
          :class="{ 'kawaii-hearts--flash': heartFlash }"
          :aria-label="`Nyawa ${hud.hearts} dari ${hud.maxHearts}`"
        >
          <span
            v-for="idx in hud.maxHearts"
            :key="idx"
            class="pixel-heart"
            :class="{ 'pixel-heart--empty': idx > hud.hearts }"
          >
            <svg viewBox="0 0 11 10" width="18" height="16" aria-hidden="true">
              <path
                d="M2 0h2v1h1v1h1V1h1V0h2v1h1v1h1v3h-1v1H9v1H8v1H7v1H6v1H5V9H4V8H3V7H2V6H1V5H0V2h1V1h1V0z"
                :fill="idx <= hud.hearts ? '#ff628c' : '#3a224d'"
              />
              <rect v-if="idx <= hud.hearts" x="2" y="2" width="2" height="1" fill="#ffd6e5" />
              <rect v-if="idx <= hud.hearts" x="2" y="3" width="1" height="1" fill="#fff2f7" />
            </svg>
          </span>
        </div>

        <!-- Mini Dash Readiness Indicator -->
        <div
          class="kawaii-frame kawaii-dash"
          :class="{
            'kawaii-dash--ready': hud.dashReady,
            'kawaii-dash--active': hud.isDashing
          }"
          :title="hud.dashReady ? 'Dash Siap (Shift / X)' : 'Dash Cooldown'"
        >
          <svg viewBox="0 0 12 12" width="14" height="14" class="dash-bolt" aria-hidden="true">
            <path
              d="M6 0h3L7 4h3L4 12h-1l2-5H2L6 0z"
              :fill="hud.dashReady ? '#ffe46b' : '#856c9c'"
            />
            <rect v-if="hud.dashReady" x="6" y="1" width="1" height="3" fill="#ffffff" />
          </svg>
          <div class="dash-bar-track" aria-hidden="true">
            <div class="dash-bar-fill" :style="{ width: `${Math.round(hud.dashCharge * 100)}%` }" />
          </div>
        </div>

        <!-- Level + Biome Ribbon -->
        <div class="kawaii-frame kawaii-level">
          <span class="level-tag">LVL {{ hud.levelId }}</span>
          <span class="level-sep">{{ biomeMeta.icon }}</span>
          <span class="level-title">{{ hud.levelName }}</span>
        </div>

        <!-- Optional Speedrun Timer (MM:SS.ms) toggled in Settings -->
        <div
          v-if="hud.showSpeedrunTimer && !hud.isTimeTrial"
          class="kawaii-frame kawaii-speedrun"
          aria-label="Timer Speedrun"
        >
          <span class="sr-clock">⏱️ {{ formatSpeedrunTime(hud.runElapsedMs) }}</span>
        </div>

        <!-- Time Trial Stopwatch & Medal Targets -->
        <div v-if="hud.isTimeTrial" class="kawaii-frame kawaii-timetrial" aria-label="Timer Tantangan Waktu">
          <span class="tt-clock">⏱️ {{ formatTimeTrial(hud.timeTrialElapsedMs) }}</span>
          <span class="tt-targets">
            🥇{{ Math.round(hud.timeTrialGoldMs / 1000) }}s
            🥈{{ Math.round(hud.timeTrialSilverMs / 1000) }}s
            🥉{{ Math.round(hud.timeTrialBronzeMs / 1000) }}s
          </span>
        </div>
      </div>

      <!-- Calm Active Power-Up Status Row below Hearts -->
      <div v-if="hasActiveBuffs" class="buff-row" aria-label="Status Power-Up Aktif">
        <div v-if="hud.mooncakeTimer > 0" class="buff-pill buff-pill--mooncake" title="Kue Bulan Emas: Besar 1.35x & Kebal Gagak">
          <span>🥮</span>
          <div class="buff-bar-track">
            <div
              class="buff-bar-fill buff-bar-fill--mooncake"
              :style="{ width: `${Math.round((hud.mooncakeTimer / hud.mooncakeMax) * 100)}%` }"
            />
          </div>
          <span class="buff-sec">{{ Math.ceil(hud.mooncakeTimer) }}s</span>
        </div>

        <div v-if="hud.yarnTimer > 0" class="buff-pill buff-pill--yarn" title="Bola Benang Bintang: Triple Jump & Lincah">
          <span>🧶</span>
          <div class="buff-bar-track">
            <div
              class="buff-bar-fill buff-bar-fill--yarn"
              :style="{ width: `${Math.round((hud.yarnTimer / hud.yarnMax) * 100)}%` }"
            />
          </div>
          <span class="buff-sec">{{ Math.ceil(hud.yarnTimer) }}s</span>
        </div>

        <div v-if="hud.mochiTimer > 0" class="buff-pill buff-pill--mochi" title="Mochi Sakura: Melayang & Bintang 2x">
          <span>🍡</span>
          <div class="buff-bar-track">
            <div
              class="buff-bar-fill buff-bar-fill--mochi"
              :style="{ width: `${Math.round((hud.mochiTimer / hud.mochiMax) * 100)}%` }"
            />
          </div>
          <span class="buff-sec">{{ Math.ceil(hud.mochiTimer) }}s</span>
        </div>

        <div v-if="hud.candyTimer > 0" class="buff-pill buff-pill--candy" title="Permen Pelangi: Dash Tanpa Cooldown">
          <span>🍬</span>
          <div class="buff-bar-track">
            <div
              class="buff-bar-fill buff-bar-fill--candy"
              :style="{ width: `${Math.round((hud.candyTimer / hud.candyMax) * 100)}%` }"
            />
          </div>
          <span class="buff-sec">{{ Math.ceil(hud.candyTimer) }}s</span>
        </div>

        <div v-if="hud.pearlTimer > 0" class="buff-pill buff-pill--pearl" title="Mutiara Bulan: Jalan di Air & Magnet Ikan">
          <span>🦪</span>
          <div class="buff-bar-track">
            <div
              class="buff-bar-fill buff-bar-fill--pearl"
              :style="{ width: `${Math.round((hud.pearlTimer / hud.pearlMax) * 100)}%` }"
            />
          </div>
          <span class="buff-sec">{{ Math.ceil(hud.pearlTimer) }}s</span>
        </div>

        <div v-if="hud.featherTimer > 0" class="buff-pill buff-pill--feather" title="Bulu Bintang: Melayang Lembut">
          <span>🪶</span>
          <div class="buff-bar-track">
            <div
              class="buff-bar-fill buff-bar-fill--feather"
              :style="{ width: `${Math.round((hud.featherTimer / hud.featherMax) * 100)}%` }"
            />
          </div>
          <span class="buff-sec">{{ Math.ceil(hud.featherTimer) }}s</span>
        </div>

        <div v-if="hud.magnetTimer > 0" class="buff-pill buff-pill--bell" title="Lonceng Magnet: Menarik Bintang & Ikan">
          <span>🔔</span>
          <div class="buff-bar-track">
            <div
              class="buff-bar-fill buff-bar-fill--bell"
              :style="{ width: `${Math.round((hud.magnetTimer / hud.magnetMax) * 100)}%` }"
            />
          </div>
          <span class="buff-sec">{{ Math.ceil(hud.magnetTimer) }}s</span>
        </div>

        <div v-if="hud.hasBubbleShield" class="buff-pill buff-pill--bubble" title="Gelembung Bulan: Melindungi 1 Tabrakan">
          <span>🫧</span>
          <span class="buff-sec">PERISAI</span>
        </div>

        <!-- Star Chain Combo Indicator (< 2.5s chain) -->
        <div v-if="hud.starComboCount >= 2" class="buff-pill buff-pill--combo" title="Kombo Bintang Berantai">
          <span>⭐ x{{ Math.min(5, hud.starComboCount) }}</span>
          <div class="buff-bar-track">
            <div
              class="buff-bar-fill buff-bar-fill--combo"
              :style="{ width: `${Math.round((hud.starComboTimer / hud.starComboMax) * 100)}%` }"
            />
          </div>
        </div>

        <!-- Star Ring Mini-Challenge Timer (8 stars in 6s -> +1 Golden Fish) -->
        <div
          v-if="hud.starRingActive"
          class="buff-pill buff-pill--starring"
          title="Tantangan Lonceng Bintang: Kumpulkan 8 bintang dalam 6 detik untuk +1 Ikan Emas!"
        >
          <span>🔔 {{ hud.starRingCollected }}/{{ hud.starRingTotal }}</span>
          <div class="buff-bar-track">
            <div
              class="buff-bar-fill buff-bar-fill--starring"
              :style="{ width: `${Math.min(100, Math.round((hud.starRingTimer / 6) * 100))}%` }"
            />
          </div>
          <span class="buff-sec">{{ Math.ceil(hud.starRingTimer) }}s</span>
        </div>

        <!-- Rare Night Event: Meteor Shower Active -->
        <div
          v-if="hud.meteorShowerActive"
          class="buff-pill buff-pill--meteor"
          title="Hujan Bintang Jatuh: Tangkap bintang jatuh untuk +25 poin!"
        >
          <span>🌠</span>
          <div class="buff-bar-track">
            <div
              class="buff-bar-fill buff-bar-fill--meteor"
              :style="{ width: `${Math.min(100, Math.round((hud.meteorShowerTimer / 15) * 100))}%` }"
            />
          </div>
          <span class="buff-sec">{{ Math.ceil(hud.meteorShowerTimer) }}s</span>
        </div>

        <!-- Rare Night Event: Pink Full Moon (+25% Star Score) -->
        <div
          v-if="hud.nightEvent === 'pinkMoon'"
          class="buff-pill buff-pill--pinkmoon"
          title="Bulan Purnama Merah Muda: Semua Bintang bernilai +25% skor!"
        >
          <span>🌸</span>
          <span class="buff-sec">+25% ⭐</span>
        </div>
      </div>
    </div>

    <!-- Right: Cute Score Plaque & Transparent Box-Free Utility Icons -->
    <div class="hud-cluster hud-cluster--right">
      <div class="kawaii-frame kawaii-score" title="Skor Bintang & Ikan Emas">
        <svg viewBox="0 0 12 12" width="15" height="15" aria-hidden="true">
          <path d="M5 0h2v3h3v2H8v2h1v3H7V8H5v2H3V7h1V5H2V3h3V0z" fill="#ffd84d" />
          <rect x="5" y="3" width="2" height="2" fill="#fffbe0" />
        </svg>
        <span class="score-val">{{ hud.score }}</span>
        <span class="score-dot">•</span>
        <svg viewBox="0 0 14 10" width="17" height="12" class="cute-fish-icon" aria-hidden="true">
          <path d="M5 0h4v1H5z" fill="#ff9638" />
          <path d="M1 2h2v1h1V2h6v1h1v1h1v2h-1v1h-1v1H4V7H3v1H1V6h1V4H1V2z" fill="#ffbe2e" />
          <rect x="5" y="3" width="4" height="2" fill="#fff08a" />
          <rect x="10" y="4" width="1" height="1" fill="#1d1030" />
          <rect x="11" y="3" width="1" height="1" fill="#ffffff" />
        </svg>
        <span class="fish-val">{{ hud.fishCollected }}/{{ hud.totalFish }}</span>
        <span class="score-dot">•</span>
        <span class="shard-val" title="Starlight Shards Tersembunyi">💎 {{ hud.shardsCollected }}/3</span>
      </div>

      <!-- Box-free Floating Pixel Action Icons -->
      <div class="hud-icon-bar">
        <button
          type="button"
          class="floating-icon-btn hud-touch-toggle"
          :class="{ 'floating-icon-btn--on': showTouchPad }"
          :title="showTouchPad ? 'Sembunyikan tombol sentuh' : 'Tampilkan tombol sentuh'"
          aria-label="Toggle Kontrol Sentuh"
          @click="$emit('toggleTouchPad')"
        >
          <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
            <path d="M3 4h10v1h1v6h-1v1h-2v-1H5v1H3v-1H2V5h1V4z" fill="currentColor" opacity="0.22" />
            <path d="M3 4h10v1h1v6h-1v1h-2v-1h2V5H3v6h2v1H3v-1H2V5h1V4zm2 2h1v1h1v1H6v1H5V8H4V7h1V6zm5 1h1v1h-1V7zm2 1h1v1h-1V8z" fill="currentColor" />
          </svg>
        </button>

        <button
          type="button"
          class="floating-icon-btn"
          :class="{ 'floating-icon-btn--muted': hud.isMuted }"
          :title="hud.isMuted ? 'Nyalakan Audio 8-Bit (M)' : 'Bisukan Audio 8-Bit (M)'"
          :aria-label="hud.isMuted ? 'Nyalakan Audio' : 'Bisukan Audio'"
          @click="$emit('toggleMute')"
        >
          <svg v-if="!hud.isMuted" viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
            <path d="M2 6h3l3-3h1v10H8l-3-3H2V6zm9-1h1v1h1v4h-1v1h-1V9h1V7h-1V5zm2-2h1v1h1v8h-1v1h-1v-2h1V5h-1V3z" fill="currentColor" />
          </svg>
          <svg v-else viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
            <path d="M2 6h3l3-3h1v10H8l-3-3H2V6zm9 0h1v1h1V6h1v1h-1v2h1v1h-1V9h-1v1h-1V9h1V7h-1V6z" fill="currentColor" />
          </svg>
        </button>

        <button
          type="button"
          class="floating-icon-btn"
          title="Ulang Level (R)"
          aria-label="Ulang Level"
          @click="$emit('restart')"
        >
          <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
            <path d="M6 3h4v1h2v2h1v4h-1v2h-2v1H6v-1H4v-2h2v1h4v-1h1V6h-1V5H6v2H3V3h2v1h1V3z" fill="currentColor" />
          </svg>
        </button>

        <button
          v-if="!mobilePauseVisible"
          type="button"
          class="floating-icon-btn"
          title="Jeda (P / Esc)"
          aria-label="Jeda Permainan"
          @click="$emit('togglePause')"
        >
          <svg v-if="hud.screen === 'paused'" viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
            <path d="M4 3h2v1h2v1h2v1h2v4h-2v1H8v1H6v1H4V3z" fill="currentColor" />
          </svg>
          <svg v-else viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
            <path d="M4 3h3v10H4V3zm5 0h3v10H9V3z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Calm Non-Shaking Top Banner for Rare Night Sky Events -->
    <div
      v-if="hud.nightEventBanner"
      class="night-event-banner"
      :class="hud.nightEvent === 'pinkMoon' ? 'night-event-banner--pink' : 'night-event-banner--meteor'"
      role="status"
      aria-live="polite"
    >
      {{ hud.nightEventBanner }}
    </div>
  </header>
</template>

<style scoped>
.hud-bar {
  position: absolute;
  inset: 0 0 auto 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  padding:
    max(9px, env(safe-area-inset-top))
    max(12px, env(safe-area-inset-right))
    6px
    max(12px, env(safe-area-inset-left));
  pointer-events: none;
  z-index: 20;
}

.hud-bar--mobile-pause {
  padding-right: calc(max(12px, env(safe-area-inset-right)) + 52px);
}

.hud-left-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
}

.hud-cluster {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
  pointer-events: auto;
}

.hud-cluster--right {
  justify-content: flex-end;
}

.kawaii-frame {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: linear-gradient(180deg, rgba(64, 33, 74, 0.9) 0%, rgba(40, 20, 52, 0.92) 100%);
  border: 2px solid #f7a8ca;
  box-shadow:
    0 0 0 2px #1c0c29,
    0 3px 0 1px rgba(15, 6, 26, 0.85),
    inset 0 2px 0 rgba(255, 224, 240, 0.25),
    inset 0 -2px 0 rgba(24, 9, 36, 0.5);
  color: #fff6ea;
  font-size: 11.5px;
  font-weight: 700;
}

/* CLASSIC 8-BIT HUD: crisp flat thin retro pixel boxes (no gradients, no glow, no gold bevels) */
.hud-bar--classic .kawaii-frame {
  background: #120822;
  border: 2px solid #cfc4f2;
  box-shadow: 0 0 0 2px #090412;
  padding: 4px 8px;
}

.hud-bar--classic .kawaii-hearts,
.hud-bar--classic .kawaii-level,
.hud-bar--classic .kawaii-score,
.hud-bar--classic .kawaii-dash--ready {
  border-color: #cfc4f2;
  box-shadow: 0 0 0 2px #090412;
}

.hud-bar--classic .level-tag {
  background: #cfc4f2;
  color: #120822;
}

/* MODERN 16-BIT COZY HUD: rich textured warm night-wood panels with ornate beveled gold trim! */
.hud-bar--modern .kawaii-frame {
  background:
    repeating-linear-gradient(
      90deg,
      rgba(255, 216, 115, 0.04) 0px,
      rgba(255, 216, 115, 0.04) 6px,
      rgba(0, 0, 0, 0.06) 6px,
      rgba(0, 0, 0, 0.06) 12px
    ),
    linear-gradient(180deg, rgba(78, 42, 68, 0.94) 0%, rgba(44, 21, 52, 0.96) 100%);
  border: 2px solid #ffd873;
  box-shadow:
    0 0 0 2px #24102e,
    0 4px 0 1px rgba(14, 6, 26, 0.9),
    0 0 12px rgba(255, 212, 112, 0.22),
    inset 0 2px 0 rgba(255, 245, 200, 0.36),
    inset 0 -2px 0 rgba(28, 10, 34, 0.68);
}

.hud-bar--modern .kawaii-hearts {
  border-color: #ffb8d2;
}

.kawaii-hearts {
  gap: 5px;
  border-color: #ff9ec4;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}

.kawaii-hearts--flash {
  border-color: #fff2f6;
  background: linear-gradient(180deg, rgba(140, 48, 86, 0.92) 0%, rgba(84, 24, 52, 0.94) 100%);
  box-shadow:
    0 0 0 2px #1c0c29,
    0 3px 0 1px rgba(15, 6, 26, 0.85),
    0 0 14px rgba(255, 138, 178, 0.72),
    inset 0 2px 0 rgba(255, 240, 246, 0.45);
}

.pixel-heart {
  display: inline-flex;
  filter: drop-shadow(0 1px 0 #1f0d2b);
  transition: transform 0.15s ease, opacity 0.2s ease;
}

.pixel-heart--empty {
  opacity: 0.45;
  transform: scale(0.88);
}

/* Active Power-Up Status Pills below Hearts */
.buff-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  pointer-events: none;
  max-width: 340px;
}

.buff-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 7px;
  background: rgba(34, 17, 50, 0.88);
  border: 2px solid #d5b3ff;
  box-shadow: 0 2px 0 rgba(14, 6, 26, 0.85);
  font-size: 9.5px;
  font-weight: 700;
  color: #fff7ee;
}

.buff-pill--mooncake {
  border-color: #ffd85c;
}

.buff-pill--yarn {
  border-color: #caa6ff;
}

.buff-pill--mochi {
  border-color: #ffaad2;
}

.buff-pill--candy {
  border-color: #9ef5cf;
}

.buff-pill--pearl {
  border-color: #9ee6ff;
}

.buff-pill--feather {
  border-color: #ddb8ff;
}

.buff-pill--bell {
  border-color: #ffe270;
}

.buff-pill--bubble {
  border-color: #96deff;
  color: #d6f5ff;
}

.buff-pill--combo {
  border-color: #ffe475;
  color: #fff5b8;
  background: rgba(68, 34, 88, 0.92);
}

.buff-bar-fill--combo {
  background: linear-gradient(90deg, #ff9ec4, #ffe475, #ffffff);
}

.buff-pill--starring {
  border-color: #ffe875;
  color: #fff6c2;
  background: rgba(74, 42, 22, 0.94);
}

.buff-bar-fill--starring {
  background: linear-gradient(90deg, #ffae3b, #ffe97a, #ffffff);
}

.buff-pill--meteor {
  border-color: #8eeeff;
  color: #dffbff;
  background: rgba(24, 42, 74, 0.92);
}

.buff-bar-fill--meteor {
  background: linear-gradient(90deg, #74d9ff, #fff3a1);
}

.buff-pill--pinkmoon {
  border-color: #ffb2d4;
  color: #ffe2f0;
  background: rgba(84, 28, 66, 0.92);
}

.night-event-banner {
  position: absolute;
  left: 50%;
  top: calc(max(9px, env(safe-area-inset-top)) + 40px);
  transform: translateX(-50%);
  padding: 5px 12px;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.03em;
  white-space: nowrap;
  pointer-events: none;
  border: 2px solid #ffe48a;
  box-shadow: 0 0 0 2px #1c0c29, 0 4px 10px rgba(10, 4, 22, 0.65);
  z-index: 25;
}

.night-event-banner--meteor {
  background: rgba(26, 36, 74, 0.92);
  border-color: #8eeeff;
  color: #e8fcff;
}

.night-event-banner--pink {
  background: rgba(88, 28, 68, 0.92);
  border-color: #ffb4d6;
  color: #ffeaf4;
}

.buff-bar-track {
  width: 28px;
  height: 5px;
  background: #1b0c29;
  border: 1px solid rgba(255, 255, 255, 0.28);
  overflow: hidden;
}

.buff-bar-fill {
  height: 100%;
  transition: width 0.08s linear;
}

.buff-bar-fill--mooncake {
  background: linear-gradient(90deg, #ff9d2e, #fff3a8);
}

.buff-bar-fill--yarn {
  background: linear-gradient(90deg, #a874ff, #ffe382);
}

.buff-bar-fill--mochi {
  background: linear-gradient(90deg, #ff8cb8, #9ef5cf);
}

.buff-bar-fill--candy {
  background: linear-gradient(90deg, #ff9ec4, #ffe375, #9ef5cf, #8ee6ff);
}

.buff-bar-fill--pearl {
  background: linear-gradient(90deg, #7cc8ff, #ffffff);
}

.buff-bar-fill--feather {
  background: linear-gradient(90deg, #c99eff, #fff2b2);
}

.buff-bar-fill--bell {
  background: linear-gradient(90deg, #ffae42, #fff194);
}

.buff-sec {
  font-size: 9px;
  min-width: 16px;
}

/* Dash Readiness Pill */
.kawaii-dash {
  gap: 5px;
  padding: 5px 8px;
  border-color: #7c6099;
  opacity: 0.72;
  transition: opacity 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease;
}

.kawaii-dash--ready {
  opacity: 1;
  border-color: #ffe075;
  box-shadow:
    0 0 0 2px #1c0c29,
    0 3px 0 1px rgba(15, 6, 26, 0.85),
    0 0 10px rgba(255, 224, 117, 0.35),
    inset 0 2px 0 rgba(255, 249, 209, 0.28);
}

.kawaii-dash--active {
  border-color: #ffb8dc;
  box-shadow:
    0 0 0 2px #1c0c29,
    0 0 14px rgba(255, 168, 214, 0.65);
}

.dash-bolt {
  filter: drop-shadow(0 1px 0 #1b0c29);
}

.dash-bar-track {
  width: 24px;
  height: 6px;
  background: #211030;
  border: 1px solid rgba(255, 212, 232, 0.45);
  overflow: hidden;
}

.dash-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff9ec4 0%, #ffe375 100%);
  transition: width 0.06s linear;
}

.kawaii-level {
  border-color: #ffd873;
}

.level-tag {
  background: #ffd873;
  color: #251033;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.level-sep {
  font-size: 11px;
}

.level-title {
  color: #fff3e6;
  font-size: 11px;
}

.kawaii-timetrial {
  border-color: #7ee8ff !important;
  gap: 8px;
}

.kawaii-speedrun {
  border-color: #9ef5cf !important;
  padding: 5px 9px;
}

.sr-clock {
  color: #c4ffe6;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.shard-val {
  color: #a8eeff;
  font-size: 10.5px;
}

.tt-clock {
  color: #9ef2ff;
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}

.tt-targets {
  font-size: 8.5px;
  color: #ffe8a3;
  letter-spacing: 0.02em;
}

.kawaii-score {
  border-color: #ffd873;
}

.score-val {
  color: #ffe478;
  min-width: 28px;
  font-size: 12px;
}

.score-dot {
  color: #ff9ec4;
  font-size: 10px;
}

.cute-fish-icon {
  filter: drop-shadow(0 1px 0 #1c0c29);
}

.fish-val {
  color: #ffe7b8;
  font-size: 11px;
}

.hud-icon-bar {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.floating-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  background: transparent;
  border: none;
  color: #fff3d6;
  cursor: pointer;
  filter: drop-shadow(0 2px 0 #160926) drop-shadow(0 0 6px rgba(255, 216, 115, 0.35));
  transition: transform 0.08s ease, color 0.12s ease, filter 0.12s ease;
}

.floating-icon-btn:hover {
  color: #ffe375;
  transform: translateY(-1px) scale(1.08);
  filter: drop-shadow(0 2px 0 #160926) drop-shadow(0 0 8px rgba(255, 190, 224, 0.7));
}

.floating-icon-btn:active {
  transform: translateY(1px) scale(0.95);
}

.floating-icon-btn--on {
  color: #ff9ec4;
}

.floating-icon-btn--muted {
  color: #b098cc;
  opacity: 0.78;
}

@media (max-width: 720px) {
  .level-title,
  .hud-touch-toggle {
    display: none;
  }
  .kawaii-frame {
    padding: 4px 7px;
    font-size: 10.5px;
  }
  .dash-bar-track {
    width: 18px;
  }
}
</style>
