<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { TouchControlsMode } from '~/game/types'

export type TouchControlKey = 'left' | 'right' | 'jump' | 'dash'

const emit = defineEmits<{
  (e: 'input', control: TouchControlKey, pressed: boolean): void
}>()

defineProps<{
  mode?: TouchControlsMode
  dashReady?: boolean
  dashCharge?: number
}>()

const hasTouchDevice = ref(false)

onMounted(() => {
  if (typeof window !== 'undefined') {
    hasTouchDevice.value =
      'ontouchstart' in window ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
      window.matchMedia('(pointer: coarse)').matches
  }
})

// Track active pointers independently so multi-touch (e.g., holding Right + tapping Jump or Dash) works seamlessly
const activePointers = new Map<number, TouchControlKey>()
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

function handlePointerDown(control: TouchControlKey, e: PointerEvent) {
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

function handlePointerRelease(e: PointerEvent) {
  e.preventDefault()
  const prev = activePointers.get(e.pointerId)
  if (!prev) return
  activePointers.delete(e.pointerId)
  syncControl(prev)
}

function releaseAll() {
  activePointers.clear()
  for (const key of ['left', 'right', 'jump', 'dash'] as TouchControlKey[]) {
    if (pressedState.value[key]) {
      pressedState.value[key] = false
      emit('input', key, false)
    }
  }
}

onBeforeUnmount(() => {
  releaseAll()
})
</script>

<template>
  <div
    class="touch-controls"
    :class="{
      'touch-controls--visible': mode === 'on' || (mode !== 'off' && hasTouchDevice),
      'touch-controls--hidden': mode === 'off',
      'touch-controls--auto': !mode || mode === 'auto'
    }"
    aria-label="Kontrol Sentuh Virtual"
  >
    <div class="touch-group touch-group--dpad">
      <button
        type="button"
        class="touch-btn"
        :class="{ 'touch-btn--active': pressedState.left }"
        aria-label="Gerak Kiri"
        @pointerdown="handlePointerDown('left', $event)"
        @pointerup="handlePointerRelease"
        @pointercancel="handlePointerRelease"
        @lostpointercapture="handlePointerRelease"
        @contextmenu.prevent
      >
        <span class="touch-glyph" aria-hidden="true">◀</span>
        <span class="touch-label">KIRI</span>
      </button>

      <button
        type="button"
        class="touch-btn"
        :class="{ 'touch-btn--active': pressedState.right }"
        aria-label="Gerak Kanan"
        @pointerdown="handlePointerDown('right', $event)"
        @pointerup="handlePointerRelease"
        @pointercancel="handlePointerRelease"
        @lostpointercapture="handlePointerRelease"
        @contextmenu.prevent
      >
        <span class="touch-glyph" aria-hidden="true">▶</span>
        <span class="touch-label">KANAN</span>
      </button>
    </div>

    <!-- Right-side action buttons: Dash (⚡) to the left of Jump (▲) -->
    <div class="touch-group touch-group--action">
      <button
        type="button"
        class="touch-btn touch-btn--dash"
        :class="{
          'touch-btn--active': pressedState.dash,
          'touch-btn--cooldown': dashReady === false
        }"
        aria-label="Dash Cepat"
        @pointerdown="handlePointerDown('dash', $event)"
        @pointerup="handlePointerRelease"
        @pointercancel="handlePointerRelease"
        @lostpointercapture="handlePointerRelease"
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
        @pointerdown="handlePointerDown('jump', $event)"
        @pointerup="handlePointerRelease"
        @pointercancel="handlePointerRelease"
        @lostpointercapture="handlePointerRelease"
        @contextmenu.prevent
      >
        <span class="touch-glyph" aria-hidden="true">▲</span>
        <span class="touch-label">LOMPAT</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.touch-controls {
  position: absolute;
  inset: auto 0 0 0;
  display: none;
  justify-content: space-between;
  align-items: flex-end;
  padding: 12px 16px max(14px, env(safe-area-inset-bottom));
  pointer-events: none;
  z-index: 25;
}

.touch-controls--visible {
  display: flex;
}

.touch-controls--hidden {
  display: none !important;
}

/* Automatically display on touch screens or compact mobile/tablet viewports when mode is 'auto' */
@media (pointer: coarse), (max-width: 900px) {
  .touch-controls--auto {
    display: flex;
  }
}

.touch-group {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  pointer-events: auto;
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
  background: rgba(44, 21, 64, 0.5);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 3px solid rgba(247, 168, 202, 0.65);
  box-shadow:
    0 0 0 2px rgba(18, 7, 32, 0.72),
    0 4px 0 rgba(18, 7, 32, 0.75),
    inset 0 2px 0 rgba(255, 232, 245, 0.24);
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  font-family: inherit;
  transition: transform 0.05s ease, background-color 0.08s ease, opacity 0.12s ease;
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
  background: rgba(164, 92, 204, 0.75);
  border-color: #ffffff;
  box-shadow:
    0 0 0 2px rgba(18, 7, 32, 0.8),
    0 1px 0 rgba(18, 7, 32, 0.85),
    0 0 14px rgba(255, 179, 216, 0.6);
}

.touch-btn--dash.touch-btn--active {
  background: rgba(255, 158, 196, 0.78);
  color: #241033;
}

.touch-btn--jump.touch-btn--active {
  background: rgba(255, 206, 86, 0.78);
  color: #241033;
  box-shadow:
    0 0 0 2px rgba(18, 7, 32, 0.8),
    0 1px 0 rgba(18, 7, 32, 0.85),
    0 0 18px rgba(255, 216, 77, 0.65);
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

@media (max-width: 480px) {
  .touch-controls {
    padding: 10px 10px max(12px, env(safe-area-inset-bottom));
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
</style>
