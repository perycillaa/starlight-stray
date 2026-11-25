<script setup lang="ts">
import { ref } from 'vue'
import { BIOMES } from '~/game/achievements'
import type { HudSnapshot, PhotoModePose } from '~/game/types'

const props = defineProps<{
  hud: HudSnapshot
}>()

const emit = defineEmits<{
  (e: 'cyclePose', pose: PhotoModePose): void
  (e: 'toggleFrame'): void
  (e: 'snapPostcard'): void
  (e: 'exitPhotoMode'): void
}>()

const POSES: { id: PhotoModePose; label: string; icon: string }[] = [
  { id: 'idle', label: 'Idle', icon: '🐾' },
  { id: 'happyHop', label: 'Happy Hop', icon: '✨' },
  { id: 'sitting', label: 'Sitting', icon: '🌙' },
  { id: 'lookingAtStars', label: 'Look at Stars', icon: '⭐' }
]

const collapsed = ref(false)
const flashActive = ref(false)
const snapNotice = ref('')

function handleNextPose() {
  const idx = POSES.findIndex((p) => p.id === props.hud.photoModePose)
  const next = POSES[(idx + 1) % POSES.length]!
  emit('cyclePose', next.id)
}

function handleSnap() {
  flashActive.value = true
  snapNotice.value = 'Kartu pos .PNG berhasil diunduh!'
  emit('snapPostcard')
  window.setTimeout(() => {
    flashActive.value = false
  }, 190)
  window.setTimeout(() => {
    snapNotice.value = ''
  }, 2200)
}

function currentPoseLabel(): string {
  const found = POSES.find((p) => p.id === props.hud.photoModePose) ?? POSES[0]!
  return `${found.icon} ${found.label}`
}
</script>

<template>
  <div class="photo-mode-layer" aria-label="Mode Foto">
    <!-- Calm non-shaking gentle white shutter flash -->
    <div class="shutter-flash" :class="{ 'shutter-flash--on': flashActive }" aria-hidden="true" />

    <!-- Top-right minimal collapse toggle so player can preview full canvas unobstructed -->
    <div class="photo-top-tools">
      <button
        type="button"
        class="pixel-btn pixel-btn--ghost photo-mini-btn"
        @click="collapsed = !collapsed"
      >
        {{ collapsed ? '📷 Tampilkan Kontrol' : '👁️ Sembunyikan UI' }}
      </button>
    </div>

    <!-- Snap confirmation pill -->
    <div v-if="snapNotice" class="photo-notice" role="status">{{ snapNotice }}</div>

    <!-- Minimal collapsible bottom pixel toolbar -->
    <div v-if="!collapsed" class="photo-toolbar">
      <div class="photo-meta">
        <span class="photo-tag">📸 PHOTO MODE</span>
        <span class="photo-biome">{{ BIOMES[hud.biome].icon }} {{ BIOMES[hud.biome].englishName }}</span>
      </div>

      <div class="photo-controls">
        <button type="button" class="pixel-btn pixel-btn--secondary photo-ctrl-btn" @click="handleNextPose">
          Pose: {{ currentPoseLabel() }}
        </button>

        <button
          type="button"
          class="pixel-btn pixel-btn--secondary photo-ctrl-btn"
          :class="{ 'photo-ctrl-btn--active': hud.photoModeFrame }"
          @click="$emit('toggleFrame')"
        >
          🖼️ Bingkai: {{ hud.photoModeFrame ? 'ON' : 'OFF' }}
        </button>

        <button type="button" class="pixel-btn photo-ctrl-btn photo-snap-btn" @click="handleSnap">
          📸 Snap Postcard
        </button>

        <button type="button" class="pixel-btn pixel-btn--ghost photo-ctrl-btn" @click="$emit('exitPhotoMode')">
          ◀ Kembali
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.photo-mode-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 30;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10px 12px;
}

.shutter-flash {
  position: absolute;
  inset: 0;
  background: #fffdf5;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease-out;
}

.shutter-flash--on {
  opacity: 0.55;
}

.photo-top-tools {
  display: flex;
  justify-content: flex-end;
  pointer-events: auto;
}

.photo-mini-btn {
  padding: 4px 9px;
  font-size: 8.5px;
  background: rgba(20, 9, 34, 0.82);
}

.photo-notice {
  align-self: center;
  padding: 4px 10px;
  background: rgba(20, 48, 44, 0.92);
  border: 2px solid #8ef5cf;
  color: #d9fff0;
  font-size: 9px;
  font-weight: 700;
}

.photo-toolbar {
  pointer-events: auto;
  align-self: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(22, 11, 38, 0.88);
  border: 2px solid #f7c583;
  box-shadow: 0 0 0 2px #140821, 0 6px 20px rgba(0, 0, 0, 0.65);
}

.photo-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 8.5px;
}

.photo-tag {
  color: #ffe375;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.photo-biome {
  color: #e6d1f7;
}

.photo-controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.photo-ctrl-btn {
  padding: 5px 9px;
  font-size: 8.5px;
}

.photo-ctrl-btn--active {
  border-color: #ffe375;
  color: #fff6c2;
}

.photo-snap-btn {
  background: linear-gradient(180deg, #ff9ec4 0%, #d95d8e 100%);
  border-color: #ffe2f0;
  color: #ffffff;
}
</style>
