<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { TouchControlsMode } from '~/game/types'

export type TouchControlKey = 'left' | 'right' | 'jump' | 'dash'

const props = defineProps<{
  mode?: TouchControlsMode
  dashReady?: boolean
  dashCharge?: number
  isPaused?: boolean
}>()

const emit = defineEmits<{
  (e: 'input', control: TouchControlKey, pressed: boolean): void
  (e: 'pause'): void
}>()

const isTouchCapableOrCompact = ref(false)
const dpadRef = ref<HTMLElement | null>(null)

function detectTouchViewport() {
  if (typeof window === 'undefined') return
  const hasTouch =
    'ontouchstart' in window ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
    window.matchMedia('(pointer: coarse)').matches
  const isCompactViewport = window.innerWidth < 900
  isTouchCapableOrCompact.value = hasTouch || isCompactViewport
}

const isVisible = computed(() => {
  if (props.mode === 'off') return false
  if (props.mode === 'on') return true
  return isTouchCapableOrCompact.value
})

// Independent pointer tracking for simultaneous multi-touch:
// Left thumb can slide smoothly between ◀ and ▶ while right thumb taps Jump (▲) or Dash (⚡).
const activePointers = new Map<number, TouchControlKey>()
const dpadPointerIds = new Set<number>()

const pressedState = ref<Record<TouchControlKey, boolean>>({
  left: false,
  right: false,
  jump: false,
  dash: false
})

function syncControl(control: TouchControlKey) {
  let isDown = false
  for (const mapped of activePointers.values()) {
    if (mapped === control) {
      isDown = true
      break
    }
  }
  if (pressedState.value[control] !== isDown) {
    pressedState.value[control] = isDown
    emit('input', control, isDown)
  }
}

function syncAllDirectional() {
  syncControl('left')
  syncControl('right')
}

function resolveDpadDirection(clientX: number): 'left' | 'right' | null {
  const el = dpadRef.value
  if (!el) return null
  const rect = el.getBoundingClientRect()
  if (rect.width <= 0) return null
  const midX = rect.left + rect.width / 2
  return clientX < midX ? 'left' : 'right'
}

function handleDpadPointerDown(e: PointerEvent) {
  e.preventDefault()
  const el = dpadRef.value
  if (el && el.setPointerCapture) {
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      // Ignore if pointer capture is unsupported
    }
  }
  const dir = resolveDpadDirection(e.clientX)
  if (!dir) return
  dpadPointerIds.add(e.pointerId)
  activePointers.set(e.pointerId, dir)
  syncAllDirectional()
}

function handleDpadPointerMove(e: PointerEvent) {
  if (!dpadPointerIds.has(e.pointerId)) return
  e.preventDefault()
  const nextDir = resolveDpadDirection(e.clientX)
  if (!nextDir) return
  const prevDir = activePointers.get(e.pointerId)
  if (prevDir !== nextDir) {
    activePointers.set(e.pointerId, nextDir)
    syncAllDirectional()
  }
}

function handleDpadPointerRelease(e: PointerEvent) {
  if (!dpadPointerIds.has(e.pointerId)) return
  e.preventDefault()
  dpadPointerIds.delete(e.pointerId)
  activePointers.delete(e.pointerId)
  syncAllDirectional()
}

function handleActionPointerDown(control: 'jump' | 'dash', e: PointerEvent) {
  e.preventDefault()
  const target = e.currentTarget as HTMLElement | null
  if (target && target.setPointerCapture) {
    try {
      target.setPointerCapture(e.pointerId)
    } catch {
      // Ignore if pointer capture is unsupported
    }
  }
  activePointers.set(e.pointerId, control)
  syncControl(control)
}

function handleActionPointerRelease(e: PointerEvent) {
  e.preventDefault()
  const prev = activePointers.get(e.pointerId)
  if (!prev) return
  activePointers.delete(e.pointerId)
  syncControl(prev)
}

function handlePausePointerDown(e: PointerEvent) {
  e.preventDefault()
  releaseAll()
  emit('pause')
}

function releaseAll() {
  activePointers.clear()
  dpadPointerIds.clear()
  for (const key of ['left', 'right', 'jump', 'dash'] as TouchControlKey[]) {
    if (pressedState.value[key]) {
      pressedState.value[key] = false
      emit('input', key, false)
    }
  }
}

function handleWindowBlurOrHide() {
  releaseAll()
}

onMounted(() => {
  detectTouchViewport()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', detectTouchViewport, { passive: true })
    window.addEventListener('orientationchange', detectTouchViewport, { passive: true })
    window.addEventListener('blur', handleWindowBlurOrHide)
    document.addEventListener('visibilitychange', handleWindowBlurOrHide)
  }
})

onBeforeUnmount(() => {
  releaseAll()
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', detectTouchViewport)
    window.removeEventListener('orientationchange', detectTouchViewport)
    window.removeEventListener('blur', handleWindowBlurOrHide)
    document.removeEventListener('visibilitychange', handleWindowBlurOrHide)
  }
})
</script>

<template>
  <div
    v-if="isVisible"
    class="mobile-touch-layer"
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

    <!-- Bottom Controls Bar: Left Slide-Enabled D-Pad + Right Action Buttons -->
    <div class="mobile-bottom-bar">
      <!-- Bottom-Left: Slide-between-directions D-Pad (◀ / ▶) -->
      <div
        ref="dpadRef"
        class="touch-group touch-group--dpad"
        role="group"
        aria-label="Tombol Arah Kiri dan Kanan"
        @pointerdown="handleDpadPointerDown"
        @pointermove="handleDpadPointerMove"
        @pointerup="handleDpadPointerRelease"
        @pointercancel="handleDpadPointerRelease"
        @lostpointercapture="handleDpadPointerRelease"
        @contextmenu.prevent
      >
        <div
          class="touch-btn touch-btn--dir"
          :class="{ 'touch-btn--active': pressedState.left }"
          role="button"
          aria-label="Gerak Kiri"
          :aria-pressed="pressedState.left"
        >
          <span class="touch-glyph" aria-hidden="true">◀</span>
          <span class="touch-label">KIRI</span>
        </div>

        <div
          class="touch-btn touch-btn--dir"
          :class="{ 'touch-btn--active': pressedState.right }"
          role="button"
          aria-label="Gerak Kanan"
          :aria-pressed="pressedState.right"
        >
          <span class="touch-glyph" aria-hidden="true">▶</span>
          <span class="touch-label">KANAN</span>
        </div>
      </div>

      <!-- Bottom-Right: Dash (⚡) & Jump / Double Jump (▲) -->
      <div class="touch-group touch-group--action" role="group" aria-label="Tombol Aksi">
        <button
          type="button"
          class="touch-btn touch-btn--dash"
          :class="{
            'touch-btn--active': pressedState.dash,
            'touch-btn--cooldown': dashReady === false
          }"
          aria-label="Dash Cepat"
          @pointerdown="handleActionPointerDown('dash', $event)"
          @pointerup="handleActionPointerRelease"
          @pointercancel="handleActionPointerRelease"
          @lostpointercapture="handleActionPointerRelease"
          @contextmenu.prevent
        >
          <span class="touch-glyph" aria-hidden="true">⚡</span>
          <span class="touch-label">DASH</span>
          <span
            v-if="dashReady === false"
            class="dash-cd-bar"
            :style="{ width: `${Math.round((dashCharge ?? 0) * 100)}%` }"
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          class="touch-btn touch-btn--jump"
          :class="{ 'touch-btn--active': pressedState.jump }"
          aria-label="Lompat"
          @pointerdown="handleActionPointerDown('jump', $event)"
          @pointerup="handleActionPointerRelease"
          @pointercancel="handleActionPointerRelease"
          @lostpointercapture="handleActionPointerRelease"
          @contextmenu.prevent
        >
          <span class="touch-glyph" aria-hidden="true">▲</span>
          <span class="touch-label">LOMPAT</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mobile-touch-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 26;
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
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  transition: transform 0.06s ease, background-color 0.08s ease;
}

.mobile-pause-btn:active {
  transform: translateY(2px) scale(0.95);
  background: rgba(255, 214, 112, 0.85);
  color: #241033;
}

.mobile-bottom-bar {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding:
    10px
    max(14px, env(safe-area-inset-right))
    max(14px, env(safe-area-inset-bottom))
    max(14px, env(safe-area-inset-left));
  pointer-events: none;
}

.touch-group {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  pointer-events: auto;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.touch-group--dpad {
  padding: 4px;
  border-radius: 2px;
}

.touch-btn {
  position: relative;
  overflow: hidden;
  width: 66px;
  height: 66px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #fff6fa;
  background: rgba(44, 21, 64, 0.52);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 3px solid rgba(247, 168, 202, 0.68);
  box-shadow:
    0 0 0 2px rgba(18, 7, 32, 0.74),
    0 4px 0 rgba(18, 7, 32, 0.78),
    inset 0 2px 0 rgba(255, 232, 245, 0.24);
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  font-family: inherit;
  transition: transform 0.05s ease, background-color 0.08s ease, opacity 0.12s ease;
}

.touch-btn--dir {
  pointer-events: none;
}

.touch-btn--dash {
  width: 64px;
  height: 64px;
  color: #ffe98a;
  background: rgba(94, 42, 108, 0.56);
  border-color: rgba(255, 179, 216, 0.85);
}

.touch-btn--cooldown {
  opacity: 0.44;
  filter: saturate(0.45);
  border-color: rgba(164, 134, 194, 0.5);
}

.dash-cd-bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 4px;
  background: linear-gradient(90deg, #ff9ec4, #ffe375);
  transition: width 0.06s linear;
}

.touch-btn--jump {
  width: 76px;
  height: 76px;
  color: #fff7cc;
  background: rgba(102, 48, 128, 0.58);
  border-color: rgba(255, 219, 112, 0.84);
}

.touch-btn--active {
  transform: translateY(3px) scale(0.96);
  background: rgba(164, 92, 204, 0.78);
  border-color: #ffffff;
  box-shadow:
    0 0 0 2px rgba(18, 7, 32, 0.8),
    0 1px 0 rgba(18, 7, 32, 0.85),
    0 0 14px rgba(255, 179, 216, 0.65);
}

.touch-btn--dash.touch-btn--active {
  background: rgba(255, 158, 196, 0.82);
  color: #241033;
}

.touch-btn--jump.touch-btn--active {
  background: rgba(255, 206, 86, 0.82);
  color: #241033;
  box-shadow:
    0 0 0 2px rgba(18, 7, 32, 0.8),
    0 1px 0 rgba(18, 7, 32, 0.85),
    0 0 18px rgba(255, 216, 77, 0.7);
}

.touch-glyph {
  font-size: 20px;
  line-height: 1;
  text-shadow: 0 2px 0 rgba(16, 7, 28, 0.85);
}

.touch-label {
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

/* Compact sizing on short landscape phones */
@media (orientation: landscape) and (max-height: 500px) {
  .mobile-bottom-bar {
    padding:
      6px
      max(12px, env(safe-area-inset-right))
      max(8px, env(safe-area-inset-bottom))
      max(12px, env(safe-area-inset-left));
  }
  .touch-btn {
    width: 58px;
    height: 58px;
  }
  .touch-btn--dash {
    width: 56px;
    height: 56px;
  }
  .touch-btn--jump {
    width: 66px;
    height: 66px;
  }
}

@media (max-width: 480px) {
  .mobile-bottom-bar {
    padding:
      8px
      max(10px, env(safe-area-inset-right))
      max(12px, env(safe-area-inset-bottom))
      max(10px, env(safe-area-inset-left));
  }
  .touch-group {
    gap: 8px;
  }
  .touch-btn {
    width: 58px;
    height: 58px;
  }
  .touch-btn--dash {
    width: 56px;
    height: 56px;
  }
  .touch-btn--jump {
    width: 68px;
    height: 68px;
  }
}

/* Portrait Handheld Control Deck: ergonomic thumb buttons anchored cleanly below the big canvas */
@media (max-width: 768px) and (orientation: portrait) {
  .mobile-bottom-bar {
    padding:
      10px
      max(14px, env(safe-area-inset-right))
      max(16px, env(safe-area-inset-bottom))
      max(14px, env(safe-area-inset-left));
  }
  .touch-group {
    gap: 10px;
  }
  .touch-btn {
    width: 66px;
    height: 66px;
    background: rgba(54, 26, 80, 0.88);
  }
  .touch-btn--dash {
    width: 64px;
    height: 64px;
    background: rgba(98, 44, 114, 0.9);
  }
  .touch-btn--jump {
    width: 76px;
    height: 76px;
    background: rgba(112, 52, 138, 0.92);
  }
  .touch-glyph {
    font-size: 21px;
  }
  .touch-label {
    font-size: 8.5px;
  }
}
</style>
