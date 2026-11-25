<script setup lang="ts">
import { computed, ref } from 'vue'
import { createDefaultTouchLayout, sanitizeTouchLayout } from '~/game/storage'
import type { TouchLayoutConfig, TouchZoneId } from '~/game/types'

const props = defineProps<{
  layout: TouchLayoutConfig
}>()

const emit = defineEmits<{
  (e: 'save', nextLayout: TouchLayoutConfig): void
  (e: 'cancel'): void
}>()

const editorRef = ref<HTMLElement | null>(null)
const draft = ref<TouchLayoutConfig>(sanitizeTouchLayout(JSON.parse(JSON.stringify(props.layout))))
const selectedZone = ref<TouchZoneId>('joystick')
const draggingZone = ref<TouchZoneId | null>(null)
let dragPointerId: number | null = null

const ZONE_META: Record<TouchZoneId, { label: string; icon: string; baseW: number; baseH: number }> = {
  joystick: { label: 'JOYSTICK', icon: '🕹️', baseW: 0, baseH: 0 },
  jump: { label: 'LOMPAT', icon: '▲', baseW: 112, baseH: 112 },
  dash: { label: 'DASH', icon: '⚡', baseW: 88, baseH: 88 },
  pulse: { label: 'BOSS PULSE', icon: '✦', baseW: 76, baseH: 76 },
  aegis: { label: 'BOSS AEGIS', icon: '◈', baseW: 76, baseH: 76 }
}

const ALL_ZONE_IDS: TouchZoneId[] = ['joystick', 'jump', 'dash', 'pulse', 'aegis']

const activeZoneObj = computed(() => draft.value.zones[selectedZone.value])
const activeZoneMeta = computed(() => ZONE_META[selectedZone.value])

function getEditorZoneStyle(id: TouchZoneId) {
  const z = draft.value.zones[id]
  if (id === 'joystick') {
    const wPct = Math.min(54, Math.max(24, Math.round(38 * z.scale)))
    const hPct = Math.min(78, Math.max(38, Math.round(60 * z.scale)))
    return {
      left: `${z.xPct}%`,
      top: `${z.yPct}%`,
      width: `${wPct}%`,
      height: `${hPct}%`
    }
  }
  const meta = ZONE_META[id]
  return {
    left: `${z.xPct}%`,
    top: `${z.yPct}%`,
    width: `${Math.round(meta.baseW * z.scale)}px`,
    height: `${Math.round(meta.baseH * z.scale)}px`
  }
}

function handleZonePointerDown(id: TouchZoneId, e: PointerEvent) {
  e.preventDefault()
  e.stopPropagation()
  selectedZone.value = id
  draggingZone.value = id
  dragPointerId = e.pointerId
  const target = e.currentTarget as HTMLElement | null
  if (target && target.setPointerCapture) {
    try {
      target.setPointerCapture(e.pointerId)
    } catch {
      // Ignore if pointer capture is unsupported
    }
  }
}

function handleZonePointerMove(id: TouchZoneId, e: PointerEvent) {
  if (draggingZone.value !== id || e.pointerId !== dragPointerId) return
  e.preventDefault()
  const el = editorRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return

  const rawXPct = ((e.clientX - rect.left) / rect.width) * 100
  const rawYPct = ((e.clientY - rect.top) / rect.height) * 100

  // Safely clamp inside viewport bounds & safe-area insets
  draft.value.zones[id].xPct = Math.round(Math.max(8, Math.min(92, rawXPct)) * 10) / 10
  draft.value.zones[id].yPct = Math.round(Math.max(18, Math.min(90, rawYPct)) * 10) / 10
}

function handleZonePointerUp(id: TouchZoneId, e: PointerEvent) {
  if (draggingZone.value !== id || e.pointerId !== dragPointerId) return
  e.preventDefault()
  draggingZone.value = null
  dragPointerId = null
}

function onScaleInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  if (!Number.isFinite(val)) return
  draft.value.zones[selectedZone.value].scale = Math.max(0.7, Math.min(1.5, val / 100))
}

function onRadiusInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  if (!Number.isFinite(val)) return
  draft.value.joystickRadius = Math.max(40, Math.min(85, Math.round(val)))
}

function onOpacityInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  if (!Number.isFinite(val)) return
  draft.value.opacity = Math.max(0, Math.min(1, val / 100))
}

function handleResetDefault() {
  draft.value = createDefaultTouchLayout()
}

function handleSave() {
  emit('save', sanitizeTouchLayout(draft.value))
}
</script>

<template>
  <div
    ref="editorRef"
    class="layout-editor-backdrop"
    role="dialog"
    aria-modal="true"
    aria-label="Atur Tata Letak dan Ukuran Tombol Sentuh"
    @contextmenu.prevent
  >
    <!-- Top Compact Floating Toolbar -->
    <div class="editor-toolbar">
      <div class="editor-toolbar__head">
        <span class="editor-title">🎛️ ATUR TOMBOL • GESER ZONA DI LAYAR</span>
        <div class="editor-toolbar__actions">
          <button type="button" class="ed-btn ed-btn--reset" @click="handleResetDefault">
            ↺ RESET DEFAULT
          </button>
          <button type="button" class="ed-btn ed-btn--cancel" @click="$emit('cancel')">
            ✕ BATAL
          </button>
          <button type="button" class="ed-btn ed-btn--save" @click="handleSave">
            💾 SIMPAN
          </button>
        </div>
      </div>

      <div class="editor-sliders-row">
        <div class="ed-slider-box">
          <div class="ed-slider-label">
            <span>{{ activeZoneMeta.icon }} Ukuran {{ activeZoneMeta.label }}</span>
            <span>{{ Math.round(activeZoneObj.scale * 100) }}%</span>
          </div>
          <input
            type="range"
            min="70"
            max="150"
            step="5"
            :value="Math.round(activeZoneObj.scale * 100)"
            class="ed-range"
            @input="onScaleInput"
          />
        </div>

        <div v-if="selectedZone === 'joystick'" class="ed-slider-box">
          <div class="ed-slider-label">
            <span>⭕ Radius Geser Joystick</span>
            <span>{{ draft.joystickRadius }}px</span>
          </div>
          <input
            type="range"
            min="40"
            max="85"
            step="1"
            :value="draft.joystickRadius"
            class="ed-range"
            @input="onRadiusInput"
          />
        </div>

        <div class="ed-slider-box">
          <div class="ed-slider-label">
            <span>👁️ Opasitas Tombol</span>
            <span>{{ Math.round(draft.opacity * 100) }}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            :value="Math.round(draft.opacity * 100)"
            class="ed-range"
            @input="onOpacityInput"
          />
        </div>
      </div>
    </div>

    <!-- Draggable Live Touch Zone Previews -->
    <div
      v-for="zoneId in ALL_ZONE_IDS"
      :key="zoneId"
      class="ed-zone"
      :class="[
        `ed-zone--${zoneId}`,
        {
          'ed-zone--selected': selectedZone === zoneId,
          'ed-zone--dragging': draggingZone === zoneId
        }
      ]"
      :style="getEditorZoneStyle(zoneId)"
      @pointerdown="handleZonePointerDown(zoneId, $event)"
      @pointermove="handleZonePointerMove(zoneId, $event)"
      @pointerup="handleZonePointerUp(zoneId, $event)"
      @pointercancel="handleZonePointerUp(zoneId, $event)"
      @lostpointercapture="handleZonePointerUp(zoneId, $event)"
    >
      <div
        v-if="zoneId === 'joystick'"
        class="ed-joy-radius-preview"
        :style="{
          width: `${draft.joystickRadius * 2}px`,
          height: `${draft.joystickRadius * 2}px`,
          opacity: Math.max(0.25, draft.opacity)
        }"
      >
        <div class="ed-joy-deadzone" />
      </div>
      <div
        v-else
        class="ed-disc-preview"
        :style="{ opacity: Math.max(0.22, draft.opacity) }"
      />
      <span class="ed-zone-tag">
        {{ ZONE_META[zoneId].icon }} {{ ZONE_META[zoneId].label }}
        <small>{{ Math.round(draft.zones[zoneId].scale * 100) }}%</small>
      </span>
    </div>
  </div>
</template>

<style scoped>
.layout-editor-backdrop {
  position: absolute;
  inset: 0;
  z-index: 65;
  background: rgba(12, 5, 26, 0.72);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.editor-toolbar {
  position: absolute;
  top: max(6px, env(safe-area-inset-top));
  left: max(8px, env(safe-area-inset-left));
  right: max(8px, env(safe-area-inset-right));
  z-index: 70;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 7px 10px;
  background: rgba(26, 12, 46, 0.94);
  border: 2px solid #ffd866;
  box-shadow: 0 3px 0 #120624;
}

.editor-toolbar__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
}

.editor-title {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #ffe885;
}

.editor-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 5px;
}

.ed-btn {
  padding: 5px 8px;
  font-family: inherit;
  font-size: 8.5px;
  font-weight: 700;
  color: #fff6fa;
  background: #4e2870;
  border: 2px solid #d4a6ff;
  cursor: pointer;
}

.ed-btn--save {
  background: #ffd452;
  border-color: #fff5c2;
  color: #241033;
}

.ed-btn--reset {
  background: #352154;
  border-color: #9ce6ff;
  color: #d9f6ff;
}

.ed-btn--cancel {
  background: #4a1c36;
  border-color: #ff8cb8;
}

.editor-sliders-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
}

.ed-slider-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ed-slider-label {
  display: flex;
  justify-content: space-between;
  font-size: 8px;
  color: #f4e6ff;
}

.ed-range {
  width: 100%;
  accent-color: #ffe466;
  cursor: pointer;
}

.ed-zone {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(255, 224, 130, 0.72);
  border-radius: 14px;
  background: rgba(54, 24, 86, 0.28);
  cursor: grab;
  touch-action: none;
  z-index: 66;
}

.ed-zone--selected {
  border-style: solid;
  border-color: #ffe875;
  background: rgba(112, 54, 158, 0.36);
  box-shadow: 0 0 16px rgba(255, 228, 117, 0.45);
  z-index: 68;
}

.ed-zone--dragging {
  cursor: grabbing;
  border-color: #ffffff;
}

.ed-joy-radius-preview {
  position: relative;
  border-radius: 50%;
  border: 2px solid #9ef0ff;
  background: rgba(110, 224, 255, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.ed-joy-deadzone {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px dashed rgba(255, 255, 255, 0.6);
}

.ed-disc-preview {
  width: 76%;
  height: 76%;
  border-radius: 50%;
  border: 2px solid rgba(255, 219, 112, 0.85);
  background: rgba(74, 34, 110, 0.45);
  pointer-events: none;
}

.ed-zone-tag {
  position: absolute;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 2px 6px;
  font-size: 8px;
  font-weight: 700;
  color: #fff9e6;
  background: rgba(18, 8, 32, 0.86);
  border: 1px solid rgba(255, 224, 130, 0.65);
  pointer-events: none;
  white-space: nowrap;
}

.ed-zone-tag small {
  font-size: 7px;
  color: #a8f0ff;
}
</style>
