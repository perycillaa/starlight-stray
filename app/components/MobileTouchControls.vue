<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createDefaultTouchLayout } from '~/game/storage'
import type { TouchControlsMode, TouchLayoutConfig, TouchZoneId } from '~/game/types'

export type TouchControlKey = 'left' | 'right' | 'jump' | 'dash' | 'pulse' | 'aegis' | 'nova' | 'mend'

const props = defineProps<{
  mode?: TouchControlsMode
  layout?: TouchLayoutConfig
  levelId?: number
  dashReady?: boolean
  dashCharge?: number
  isPaused?: boolean
  isBossStage?: boolean
  pulseReady?: boolean
  pulseCharge?: number
  aegisReady?: boolean
  aegisCharge?: number
  aegisActive?: boolean
  novaReady?: boolean
  novaCharge?: number
  mendReady?: boolean
  mendCharge?: number
  mendUsesLeft?: number
  cometChargeActive?: boolean
}>()

const emit = defineEmits<{
  (e: 'input', control: TouchControlKey, pressed: boolean): void
  (e: 'pause'): void
}>()

const isTouchCapableOrCompact = ref(false)
const layerRef = ref<HTMLElement | null>(null)

function detectTouchViewport() {
  if (typeof window === 'undefined') return
  const hasTouch =
    'ontouchstart' in window ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
    window.matchMedia('(pointer: coarse)').matches
  const isCompactViewport = window.innerWidth < 900
  isTouchCapableOrCompact.value = hasTouch || isCompactViewport
}

const activeMode = computed<TouchControlsMode>(() => props.mode ?? 'invisible')
const cfg = computed<TouchLayoutConfig>(() => props.layout ?? createDefaultTouchLayout())

const isVisible = computed(() => {
  if (activeMode.value === 'off') return false
  if (activeMode.value === 'translucent' || activeMode.value === 'visible') return true
  // 'invisible' mode is active automatically on touch devices or compact screens (<900px)
  return isTouchCapableOrCompact.value
})

const isInvisibleMode = computed(() => activeMode.value === 'invisible')
const isClassicVisible = computed(() => activeMode.value === 'visible')

const effectiveOpacity = computed(() => {
  if (isInvisibleMode.value) return 0
  if (isClassicVisible.value) return Math.max(0.2, Math.min(1, cfg.value.opacity))
  return Math.max(0, Math.min(1, cfg.value.opacity))
})

// Brief 2.5s onboarding hint when entering a level in Invisible mode
const showOnboardingHint = ref(false)
let onboardingTimer: number | null = null

function triggerOnboardingHint() {
  if (onboardingTimer !== null) {
    window.clearTimeout(onboardingTimer)
    onboardingTimer = null
  }
  if (!isVisible.value || !isInvisibleMode.value) {
    showOnboardingHint.value = false
    return
  }
  showOnboardingHint.value = true
  onboardingTimer = window.setTimeout(() => {
    showOnboardingHint.value = false
    onboardingTimer = null
  }, 2500)
}

watch(
  () => [props.levelId, activeMode.value, isVisible.value] as const,
  () => {
    if (typeof window !== 'undefined') {
      triggerOnboardingHint()
    }
  }
)

// ============================================================================
// FLOATING VIRTUAL JOYSTICK (Left Control Zone, 12px Deadzone, 40-85px Radius)
// ============================================================================
const joystickPointerId = ref<number | null>(null)
const joyOriginX = ref(0)
const joyOriginY = ref(0)
const joyKnobX = ref(0)
const joyKnobY = ref(0)
const joyActive = ref(false)

// Independent multi-touch tracking for right-side action tap zones
const actionPointers = new Map<number, 'jump' | 'dash' | 'pulse' | 'aegis' | 'nova' | 'mend'>()

const pressedState = ref<Record<TouchControlKey, boolean>>({
  left: false,
  right: false,
  jump: false,
  dash: false,
  pulse: false,
  aegis: false,
  nova: false,
  mend: false
})

function setControlPressed(control: TouchControlKey, down: boolean) {
  if (pressedState.value[control] !== down) {
    pressedState.value[control] = down
    emit('input', control, down)
  }
}

function updateJoystickDirection(clientX: number, clientY: number) {
  const layer = layerRef.value
  if (!layer) return
  const rect = layer.getBoundingClientRect()
  const localX = clientX - rect.left
  const localY = clientY - rect.top
  const dx = localX - joyOriginX.value
  const dy = localY - joyOriginY.value
  const radius = cfg.value.joystickRadius
  const deadzone = cfg.value.joystickDeadzone

  const dist = Math.hypot(dx, dy)
  if (dist > radius && dist > 0) {
    joyKnobX.value = (dx / dist) * radius
    joyKnobY.value = (dy / dist) * radius
  } else {
    joyKnobX.value = dx
    joyKnobY.value = dy
  }

  if (Math.abs(dx) < deadzone) {
    setControlPressed('left', false)
    setControlPressed('right', false)
  } else if (dx < 0) {
    setControlPressed('left', true)
    setControlPressed('right', false)
  } else {
    setControlPressed('left', false)
    setControlPressed('right', true)
  }
}

function handleJoystickDown(e: PointerEvent) {
  e.preventDefault()
  if (joystickPointerId.value !== null) return
  const target = e.currentTarget as HTMLElement | null
  if (target && target.setPointerCapture) {
    try {
      target.setPointerCapture(e.pointerId)
    } catch {
      // Ignore if pointer capture is unsupported
    }
  }
  const layer = layerRef.value
  if (!layer) return
  const rect = layer.getBoundingClientRect()
  joystickPointerId.value = e.pointerId
  joyOriginX.value = e.clientX - rect.left
  joyOriginY.value = e.clientY - rect.top
  joyKnobX.value = 0
  joyKnobY.value = 0
  joyActive.value = true
  // Wait until thumb drags beyond deadzone (12px) so initial thumb rest never jitters!
  setControlPressed('left', false)
  setControlPressed('right', false)
}

function handleJoystickMove(e: PointerEvent) {
  if (e.pointerId !== joystickPointerId.value) return
  e.preventDefault()
  updateJoystickDirection(e.clientX, e.clientY)
}

function handleJoystickRelease(e: PointerEvent) {
  if (e.pointerId !== joystickPointerId.value) return
  e.preventDefault()
  joystickPointerId.value = null
  joyActive.value = false
  joyKnobX.value = 0
  joyKnobY.value = 0
  setControlPressed('left', false)
  setControlPressed('right', false)
}

function syncActionControl(control: 'jump' | 'dash' | 'pulse' | 'aegis' | 'nova' | 'mend') {
  let down = false
  for (const mapped of actionPointers.values()) {
    if (mapped === control) {
      down = true
      break
    }
  }
  setControlPressed(control, down)
}

function handleActionPointerDown(
  control: 'jump' | 'dash' | 'pulse' | 'aegis' | 'nova' | 'mend',
  e: PointerEvent
) {
  e.preventDefault()
  const target = e.currentTarget as HTMLElement | null
  if (target && target.setPointerCapture) {
    try {
      target.setPointerCapture(e.pointerId)
    } catch {
      // Ignore if pointer capture is unsupported
    }
  }
  actionPointers.set(e.pointerId, control)
  syncActionControl(control)
}

function handleActionPointerRelease(e: PointerEvent) {
  e.preventDefault()
  const prev = actionPointers.get(e.pointerId)
  if (!prev) return
  actionPointers.delete(e.pointerId)
  syncActionControl(prev)
}

function handlePausePointerDown(e: PointerEvent) {
  e.preventDefault()
  releaseAll()
  emit('pause')
}

function releaseAll() {
  joystickPointerId.value = null
  joyActive.value = false
  joyKnobX.value = 0
  joyKnobY.value = 0
  actionPointers.clear()
  for (const key of ['left', 'right', 'jump', 'dash', 'pulse', 'aegis', 'nova', 'mend'] as TouchControlKey[]) {
    setControlPressed(key, false)
  }
}

function getZoneStyle(zoneId: TouchZoneId, baseW: number, baseH: number) {
  const z = cfg.value.zones[zoneId]
  const w = Math.round(baseW * z.scale)
  const h = Math.round(baseH * z.scale)
  return {
    left: `${z.xPct}%`,
    top: `${z.yPct}%`,
    width: `${w}px`,
    height: `${h}px`
  }
}

const joystickZoneStyle = computed(() => {
  const z = cfg.value.zones.joystick
  const wPct = Math.min(54, Math.max(24, Math.round(38 * z.scale)))
  const hPct = Math.min(78, Math.max(38, Math.round(60 * z.scale)))
  return {
    left: `${z.xPct}%`,
    top: `${z.yPct}%`,
    width: `${wPct}%`,
    height: `${hPct}%`
  }
})

const jumpZoneStyle = computed(() => getZoneStyle('jump', 112, 112))
const dashZoneStyle = computed(() => getZoneStyle('dash', 88, 88))
const pulseZoneStyle = computed(() => getZoneStyle('pulse', 76, 76))
const aegisZoneStyle = computed(() => getZoneStyle('aegis', 76, 76))
const novaZoneStyle = computed(() => getZoneStyle('nova', 72, 72))
const mendZoneStyle = computed(() => getZoneStyle('mend', 72, 72))

onMounted(() => {
  detectTouchViewport()
  triggerOnboardingHint()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', detectTouchViewport, { passive: true })
    window.addEventListener('orientationchange', detectTouchViewport, { passive: true })
    window.addEventListener('blur', releaseAll)
    document.addEventListener('visibilitychange', releaseAll)
  }
})

onBeforeUnmount(() => {
  if (onboardingTimer !== null) window.clearTimeout(onboardingTimer)
  releaseAll()
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', detectTouchViewport)
    window.removeEventListener('orientationchange', detectTouchViewport)
    window.removeEventListener('blur', releaseAll)
    document.removeEventListener('visibilitychange', releaseAll)
  }
})
</script>

<template>
  <div
    v-if="isVisible"
    ref="layerRef"
    class="mobile-touch-layer"
    :class="[
      `mobile-touch-layer--${activeMode}`,
      { 'mobile-touch-layer--onboarding': showOnboardingHint }
    ]"
    aria-label="Kontrol Sentuh Virtual"
    @contextmenu.prevent
  >
    <!-- Top-Right Finger-Friendly Pause Button (min 44x44px touch target) -->
    <button
      type="button"
      class="mobile-pause-btn"
      title="Jeda Permainan"
      aria-label="Jeda Permainan"
      @pointerdown="handlePausePointerDown"
      @contextmenu.prevent
    >
      <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true">
        <path d="M4 3h3v10H4V3zm5 0h3v10H9V3z" fill="currentColor" />
      </svg>
    </button>

    <!-- LEFT: Floating Virtual Joystick Activation Zone (38% x 60% scalable) -->
    <div
      class="touch-zone touch-zone--joystick"
      :style="joystickZoneStyle"
      role="application"
      aria-label="Joystick Gerak Kiri dan Kanan"
      @pointerdown="handleJoystickDown"
      @pointermove="handleJoystickMove"
      @pointerup="handleJoystickRelease"
      @pointercancel="handleJoystickRelease"
      @lostpointercapture="handleJoystickRelease"
      @contextmenu.prevent
    >
      <!-- Faint 2.5s Onboarding Hint Outline in Invisible Mode -->
      <div v-if="showOnboardingHint" class="onboarding-outline">
        <span class="onboarding-tag">◀ JOYSTICK ▶</span>
      </div>

      <!-- Resting Minimal Circular Joystick Indicator (Translucent / Classic Visible modes) -->
      <div
        v-if="!isInvisibleMode && !joyActive"
        class="joy-ring joy-ring--idle"
        :style="{
          width: `${cfg.joystickRadius * 2}px`,
          height: `${cfg.joystickRadius * 2}px`,
          opacity: effectiveOpacity
        }"
      >
        <span class="joy-dir-tick joy-dir-tick--l">◀</span>
        <span class="joy-dir-tick joy-dir-tick--r">▶</span>
        <div class="joy-knob" />
      </div>
    </div>

    <!-- Floating Active Joystick Visual Anchored at Exact Touch Origin -->
    <template v-if="joyActive">
      <!-- Invisible Mode: optional ultra-subtle 6px faint thumb-origin dot (hidden if opacity = 0%) -->
      <div
        v-if="isInvisibleMode && cfg.opacity > 0"
        class="joy-invisible-dot"
        :style="{
          left: `${joyOriginX}px`,
          top: `${joyOriginY}px`,
          opacity: Math.min(0.32, cfg.opacity * 0.4)
        }"
        aria-hidden="true"
      />
      <!-- Translucent / Classic Visible Mode: Live Floating Joystick Ring + Thumb Knob -->
      <div
        v-else-if="!isInvisibleMode"
        class="joy-ring joy-ring--floating"
        :class="{
          'joy-ring--left': pressedState.left,
          'joy-ring--right': pressedState.right
        }"
        :style="{
          left: `${joyOriginX}px`,
          top: `${joyOriginY}px`,
          width: `${cfg.joystickRadius * 2}px`,
          height: `${cfg.joystickRadius * 2}px`,
          opacity: effectiveOpacity
        }"
        aria-hidden="true"
      >
        <span class="joy-dir-tick joy-dir-tick--l" :class="{ 'joy-dir-tick--on': pressedState.left }">◀</span>
        <span class="joy-dir-tick joy-dir-tick--r" :class="{ 'joy-dir-tick--on': pressedState.right }">▶</span>
        <div
          class="joy-knob joy-knob--active"
          :style="{ transform: `translate(${joyKnobX}px, ${joyKnobY}px)` }"
        />
      </div>
    </template>

    <!-- RIGHT: Generous Jump / Double Jump Tap Zone (112x112 default) -->
    <button
      type="button"
      class="touch-zone touch-zone--action touch-zone--jump"
      :class="{ 'touch-zone--pressed': pressedState.jump }"
      :style="jumpZoneStyle"
      aria-label="Lompat dan Lompat Ganda"
      @pointerdown="handleActionPointerDown('jump', $event)"
      @pointerup="handleActionPointerRelease"
      @pointercancel="handleActionPointerRelease"
      @lostpointercapture="handleActionPointerRelease"
      @contextmenu.prevent
    >
      <span v-if="showOnboardingHint" class="onboarding-outline">
        <span class="onboarding-tag">▲ LOMPAT</span>
      </span>
      <span
        v-if="!isInvisibleMode"
        class="action-disc action-disc--jump"
        :class="{ 'action-disc--active': pressedState.jump }"
        :style="{ opacity: effectiveOpacity }"
      >
        <span class="touch-glyph" aria-hidden="true">▲</span>
        <span class="touch-label">LOMPAT</span>
      </span>
    </button>

    <!-- RIGHT: Dash Tap Zone (88x88 default) -->
    <button
      type="button"
      class="touch-zone touch-zone--action touch-zone--dash"
      :class="{
        'touch-zone--pressed': pressedState.dash,
        'touch-zone--cooldown': dashReady === false
      }"
      :style="dashZoneStyle"
      aria-label="Dash Cepat"
      @pointerdown="handleActionPointerDown('dash', $event)"
      @pointerup="handleActionPointerRelease"
      @pointercancel="handleActionPointerRelease"
      @lostpointercapture="handleActionPointerRelease"
      @contextmenu.prevent
    >
      <span v-if="showOnboardingHint" class="onboarding-outline">
        <span class="onboarding-tag">⚡ DASH</span>
      </span>
      <span
        v-if="!isInvisibleMode"
        class="action-disc action-disc--dash"
        :class="{
          'action-disc--active': pressedState.dash,
          'action-disc--cd': dashReady === false
        }"
        :style="{ opacity: effectiveOpacity }"
      >
        <span class="touch-glyph" aria-hidden="true">⚡</span>
        <span class="touch-label">DASH</span>
        <span
          v-if="dashReady === false"
          class="disc-cd-bar"
          :style="{ width: `${Math.round((dashCharge ?? 0) * 100)}%` }"
          aria-hidden="true"
        />
      </span>
    </button>

    <!-- BOSS STAGES (Levels 13 & 14): Starlight Pulse (✦) & Astral Aegis (◈) Tap Zones (76x76 default) -->
    <template v-if="isBossStage">
      <button
        type="button"
        class="touch-zone touch-zone--action touch-zone--pulse"
        :class="{ 'touch-zone--pressed': pressedState.pulse }"
        :style="pulseZoneStyle"
        aria-label="Starlight Pulse"
        @pointerdown="handleActionPointerDown('pulse', $event)"
        @pointerup="handleActionPointerRelease"
        @pointercancel="handleActionPointerRelease"
        @lostpointercapture="handleActionPointerRelease"
        @contextmenu.prevent
      >
        <span v-if="showOnboardingHint" class="onboarding-outline">
          <span class="onboarding-tag">✦ PULSE</span>
        </span>
        <span
          v-if="!isInvisibleMode"
          class="action-disc action-disc--pulse"
          :class="{
            'action-disc--active': pressedState.pulse,
            'action-disc--cd': pulseReady === false,
            'action-disc--comet': cometChargeActive
          }"
          :style="{ opacity: effectiveOpacity }"
        >
          <span class="touch-glyph" aria-hidden="true">✦</span>
          <span class="touch-label">PULSE</span>
          <span
            v-if="pulseReady === false"
            class="disc-cd-bar"
            :style="{ width: `${Math.round((pulseCharge ?? 0) * 100)}%` }"
            aria-hidden="true"
          />
        </span>
      </button>

      <button
        type="button"
        class="touch-zone touch-zone--action touch-zone--aegis"
        :class="{ 'touch-zone--pressed': pressedState.aegis || aegisActive }"
        :style="aegisZoneStyle"
        aria-label="Astral Aegis"
        @pointerdown="handleActionPointerDown('aegis', $event)"
        @pointerup="handleActionPointerRelease"
        @pointercancel="handleActionPointerRelease"
        @lostpointercapture="handleActionPointerRelease"
        @contextmenu.prevent
      >
        <span v-if="showOnboardingHint" class="onboarding-outline">
          <span class="onboarding-tag">◈ AEGIS</span>
        </span>
        <span
          v-if="!isInvisibleMode"
          class="action-disc action-disc--aegis"
          :class="{
            'action-disc--active': pressedState.aegis || aegisActive,
            'action-disc--cd': aegisReady === false && !aegisActive
          }"
          :style="{ opacity: effectiveOpacity }"
        >
          <span class="touch-glyph" aria-hidden="true">◈</span>
          <span class="touch-label">AEGIS</span>
          <span
            v-if="aegisReady === false && !aegisActive"
            class="disc-cd-bar"
            :style="{ width: `${Math.round((aegisCharge ?? 0) * 100)}%` }"
            aria-hidden="true"
          />
        </span>
      </button>

      <button
        type="button"
        class="touch-zone touch-zone--action touch-zone--nova"
        :class="{ 'touch-zone--pressed': pressedState.nova }"
        :style="novaZoneStyle"
        aria-label="Starfall Nova"
        @pointerdown="handleActionPointerDown('nova', $event)"
        @pointerup="handleActionPointerRelease"
        @pointercancel="handleActionPointerRelease"
        @lostpointercapture="handleActionPointerRelease"
        @contextmenu.prevent
      >
        <span v-if="showOnboardingHint" class="onboarding-outline">
          <span class="onboarding-tag">☄ NOVA</span>
        </span>
        <span
          v-if="!isInvisibleMode"
          class="action-disc action-disc--nova"
          :class="{
            'action-disc--active': pressedState.nova,
            'action-disc--cd': novaReady === false
          }"
          :style="{ opacity: effectiveOpacity }"
        >
          <span class="touch-glyph" aria-hidden="true">☄</span>
          <span class="touch-label">NOVA</span>
          <span
            v-if="novaReady === false"
            class="disc-cd-bar"
            :style="{ width: `${Math.round((novaCharge ?? 0) * 100)}%` }"
            aria-hidden="true"
          />
        </span>
      </button>

      <button
        type="button"
        class="touch-zone touch-zone--action touch-zone--mend"
        :class="{ 'touch-zone--pressed': pressedState.mend }"
        :style="mendZoneStyle"
        aria-label="Lunar Mend Penyembuh"
        @pointerdown="handleActionPointerDown('mend', $event)"
        @pointerup="handleActionPointerRelease"
        @pointercancel="handleActionPointerRelease"
        @lostpointercapture="handleActionPointerRelease"
        @contextmenu.prevent
      >
        <span v-if="showOnboardingHint" class="onboarding-outline">
          <span class="onboarding-tag">♥ MEND</span>
        </span>
        <span
          v-if="!isInvisibleMode"
          class="action-disc action-disc--mend"
          :class="{
            'action-disc--active': pressedState.mend,
            'action-disc--cd': mendReady === false
          }"
          :style="{ opacity: effectiveOpacity }"
        >
          <span class="touch-glyph" aria-hidden="true">♥</span>
          <span class="touch-label">MEND {{ mendUsesLeft ?? 0 }}</span>
          <span
            v-if="mendReady === false && (mendUsesLeft ?? 0) > 0"
            class="disc-cd-bar"
            :style="{ width: `${Math.round((mendCharge ?? 0) * 100)}%` }"
            aria-hidden="true"
          />
        </span>
      </button>
    </template>
  </div>
</template>

<style scoped>
.mobile-touch-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 26;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

/* Top-Right Compact Pause Button (min 44x44px comfortable tap target with safe-area) */
.mobile-pause-btn {
  position: absolute;
  top: max(8px, env(safe-area-inset-top));
  right: max(10px, env(safe-area-inset-right));
  min-width: 44px;
  min-height: 44px;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #fff6d1;
  background: rgba(34, 16, 54, 0.72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 2px solid rgba(255, 216, 115, 0.85);
  box-shadow:
    0 0 0 2px rgba(16, 7, 28, 0.8),
    0 3px 0 rgba(16, 7, 28, 0.85);
  pointer-events: auto;
  cursor: pointer;
  z-index: 30;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.mobile-pause-btn:active {
  transform: translateY(2px) scale(0.95);
  background: rgba(255, 214, 112, 0.85);
  color: #241033;
}

/* Base Touch Hit-Area Zones */
.touch-zone {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  pointer-events: auto;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

.touch-zone--joystick {
  z-index: 26;
}

.touch-zone--action {
  z-index: 27;
}

/* Brief 2.5s Onboarding Hint Outlines (Invisible Mode) */
.onboarding-outline {
  position: absolute;
  inset: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(255, 226, 140, 0.62);
  border-radius: 14px;
  background: rgba(28, 12, 46, 0.22);
  pointer-events: none;
  animation: onboardingFade 2.5s ease-out forwards;
}

.onboarding-tag {
  padding: 3px 7px;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #fff6cf;
  background: rgba(20, 9, 34, 0.72);
  border: 1px solid rgba(255, 216, 115, 0.55);
  text-shadow: 0 1px 0 #140824;
  white-space: nowrap;
}

@keyframes onboardingFade {
  0% {
    opacity: 0;
  }
  12% {
    opacity: 0.92;
  }
  72% {
    opacity: 0.78;
  }
  100% {
    opacity: 0;
  }
}

/* Invisible Mode: Ultra-Subtle 6px Thumb-Origin Dot While Actively Dragging */
.joy-invisible-dot {
  position: absolute;
  width: 6px;
  height: 6px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: #fff4cc;
  box-shadow: 0 0 6px rgba(255, 224, 130, 0.55);
  pointer-events: none;
  z-index: 28;
}

/* Translucent & Classic Visible Circular Pixel Joystick */
.joy-ring {
  position: relative;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(34, 16, 56, 0.36);
  border: 2px solid rgba(247, 174, 212, 0.75);
  box-shadow:
    inset 0 0 0 2px rgba(20, 8, 36, 0.55),
    0 3px 10px rgba(10, 4, 22, 0.45);
  pointer-events: none;
}

.mobile-touch-layer--visible .joy-ring {
  background: rgba(42, 20, 68, 0.62);
  border-width: 3px;
  border-color: rgba(255, 212, 138, 0.9);
}

.joy-ring--floating {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 28;
}

.joy-ring--left,
.joy-ring--right {
  border-color: #ffe885;
}

.joy-dir-tick {
  position: absolute;
  font-size: 10px;
  color: rgba(255, 232, 245, 0.5);
  pointer-events: none;
}

.joy-dir-tick--l {
  left: 8px;
}

.joy-dir-tick--r {
  right: 8px;
}

.joy-dir-tick--on {
  color: #ffe875;
  text-shadow: 0 0 8px rgba(255, 224, 102, 0.85);
}

.joy-knob {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fff6e0, #f5a6d0 55%, #8a4ca6 100%);
  border: 2px solid #fff7e6;
  box-shadow:
    0 0 0 2px rgba(22, 8, 38, 0.8),
    0 3px 6px rgba(0, 0, 0, 0.45);
  transition: transform 0.03s linear;
}

.joy-knob--active {
  background: radial-gradient(circle at 35% 35%, #ffffff, #ffe375 55%, #ff8cb8 100%);
}

/* Circular Minimal Action Buttons (Translucent & Visible Modes) */
.action-disc {
  position: relative;
  overflow: hidden;
  width: 78%;
  height: 78%;
  min-width: 48px;
  min-height: 48px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #fff6fa;
  background: rgba(44, 21, 64, 0.46);
  border: 2px solid rgba(247, 168, 202, 0.78);
  box-shadow:
    0 0 0 2px rgba(18, 7, 32, 0.68),
    0 3px 0 rgba(18, 7, 32, 0.75);
  font-family: inherit;
  pointer-events: none;
  transition: transform 0.05s ease, background-color 0.08s ease;
}

.mobile-touch-layer--visible .action-disc {
  background: rgba(52, 24, 78, 0.78);
  border-width: 3px;
}

.action-disc--jump {
  color: #fff7cc;
  border-color: rgba(255, 219, 112, 0.88);
}

.action-disc--dash {
  color: #ffe98a;
  border-color: rgba(255, 179, 216, 0.88);
}

.action-disc--pulse {
  color: #a8f4ff;
  border-color: rgba(132, 232, 255, 0.9);
}

.action-disc--comet {
  border-color: #ffe466;
  box-shadow: 0 0 14px rgba(255, 224, 102, 0.72);
}

.action-disc--aegis {
  color: #ffe894;
  border-color: rgba(255, 214, 112, 0.88);
}

.action-disc--nova {
  color: #ffbe75;
  border-color: rgba(255, 162, 102, 0.9);
}

.action-disc--mend {
  color: #9ef5c8;
  border-color: rgba(126, 240, 184, 0.9);
}

.action-disc--cd {
  filter: saturate(0.45) brightness(0.75);
}

.action-disc--active {
  transform: scale(0.92);
  background: rgba(255, 206, 98, 0.85);
  color: #241033;
  border-color: #ffffff;
}

.disc-cd-bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 4px;
  background: linear-gradient(90deg, #ff9ec4, #ffe375);
  transition: width 0.06s linear;
}

.touch-glyph {
  font-size: 18px;
  line-height: 1;
  text-shadow: 0 2px 0 rgba(16, 7, 28, 0.85);
}

.touch-label {
  font-size: 7.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  line-height: 1;
  text-shadow: 0 1px 0 rgba(16, 7, 28, 0.9);
}
</style>
