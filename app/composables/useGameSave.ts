import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  STORAGE_KEY,
  clearStoredGameData,
  createDefaultSave,
  defaultSaveData,
  exportProgressJson,
  importProgressJson,
  loadGameData,
  sanitizeProgress,
  saveGameData,
  toCanonicalSavePayload
} from '~/game/storage'
import type { GameSavePayload, SaveProgress } from '~/game/types'

export const SAVE_STORAGE_KEY = STORAGE_KEY
export const PLAYER_ID_STORAGE_KEY = 'starlight_stray_player_id'
export { defaultSaveData }

export type CloudSyncStatus = 'idle' | 'syncing' | 'synced' | 'offline'

export interface CloudPlayerProfile {
  playerId: string
  displayName: string
  selectedCharacter: string
  fishCoins: number
  highScore: number
  unlockedLevel: number
  shardsCount: number
  stampsCount: number
  inventoryCount: number
  createdAt: number
  updatedAt: number
}

export interface CloudCrudLog {
  id: number
  playerId: string
  actionType: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
  entityName: string
  summary: string
  createdAt: number
}

interface CloudSaveGetResponse {
  ok: boolean
  found: boolean
  playerId?: string
  displayName?: string
  data?: Record<string, unknown>
  updatedAt?: number
  error?: string
}

interface CloudSavePostResponse {
  ok: boolean
  action?: 'CREATE' | 'UPDATE'
  playerId?: string
  displayName?: string
  savedAt?: number
  error?: string
}

// Module-level shared reactive state so all components read one source of truth
const saveState = ref<SaveProgress>(createDefaultSave())
const saveIndicatorVisible = ref(false)
const lastSavedAt = ref<number | null>(null)
const isHydrated = ref(false)

const playerId = ref<string>('')
const playerName = ref<string>('Starlight Traveler')
const cloudSyncStatus = ref<CloudSyncStatus>('idle')
const cloudSyncError = ref<string>('')
const lastCloudSyncAt = ref<number | null>(null)
const cloudProfiles = ref<CloudPlayerProfile[]>([])
const recentCrudLogs = ref<CloudCrudLog[]>([])

let indicatorTimeout: number | null = null
let debounceTimeout: number | null = null
let cloudSyncTimeout: number | null = null
let isInternalSync = false
let watcherInitialized = false
let lifecycleHooksInitialized = false

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generatePlayerId(): string {
  const pick = (len: number) => {
    let out = ''
    for (let i = 0; i < len; i++) {
      out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
    }
    return out
  }
  return `STRAY-${pick(4)}-${pick(4)}`
}

export function normalizePlayerId(raw: string): string | null {
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
  if (cleaned.length < 4 || cleaned.length > 64) return null
  return cleaned
}

function ensurePlayerId(): string {
  if (!import.meta.client) return ''
  if (playerId.value) return playerId.value
  try {
    const existing = window.localStorage.getItem(PLAYER_ID_STORAGE_KEY)
    const valid = existing ? normalizePlayerId(existing) : null
    if (valid) {
      playerId.value = valid
      return valid
    }
    const created = generatePlayerId()
    window.localStorage.setItem(PLAYER_ID_STORAGE_KEY, created)
    playerId.value = created
    return created
  } catch {
    const fallback = generatePlayerId()
    playerId.value = fallback
    return fallback
  }
}

function persistPlayerId(nextId: string): void {
  playerId.value = nextId
  if (!import.meta.client) return
  try {
    window.localStorage.setItem(PLAYER_ID_STORAGE_KEY, nextId)
  } catch {
    // Ignore storage quota errors
  }
}

function getLocalSavedTimestamp(): number {
  if (!import.meta.client) return 0
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return 0
    const parsed = JSON.parse(raw) as { savedAt?: unknown }
    const ts = Number(parsed?.savedAt)
    return Number.isFinite(ts) && ts > 0 ? ts : 0
  } catch {
    return 0
  }
}

function scoreProgressRichness(p: SaveProgress): number {
  let shards = 0
  for (const tuple of Object.values(p.collectedShards)) {
    if (tuple[0]) shards += 1
    if (tuple[1]) shards += 1
    if (tuple[2]) shards += 1
  }
  return (
    shards * 250 +
    p.unlockedAchievements.length * 160 +
    (p.unlockedLevel - 1) * 140 +
    p.highScore +
    p.fishBank * 12 +
    p.totalFishEarned * 5 +
    (p.unlockedCharacters.length - 1) * 100 +
    (p.ownedScarves.length + p.ownedHats.length + p.ownedCapes.length - 3) * 40
  )
}

function showSaveBadge(): void {
  if (!import.meta.client) return
  saveIndicatorVisible.value = true
  if (indicatorTimeout !== null) {
    window.clearTimeout(indicatorTimeout)
  }
  indicatorTimeout = window.setTimeout(() => {
    saveIndicatorVisible.value = false
    indicatorTimeout = null
  }, 1150)
}

/**
 * SSR-safe localStorage + TiDB Cloud Relational CRUD persistence composable.
 *
 * - Persists all gameplay CRUD (CREATE/READ/UPDATE/DELETE) across the 5 dedicated tables
 *   inside database `starlight_stray` (never `sys`).
 * - Keeps `localStorage` (`starlight_stray_save_v1`) as the instant offline-first cache.
 */
export function useGameSave() {
  const canonicalSave = computed<GameSavePayload>(() => toCanonicalSavePayload(saveState.value))

  async function fetchCloudProfiles(): Promise<CloudPlayerProfile[]> {
    if (!import.meta.client) return []
    try {
      const res = await $fetch<{ ok: boolean; players?: CloudPlayerProfile[] }>('/api/players', {
        query: { limit: 15 }
      })
      if (res?.ok && Array.isArray(res.players)) {
        cloudProfiles.value = res.players
        const active = res.players.find((p) => p.playerId === playerId.value)
        if (active) {
          playerName.value = active.displayName
        }
        return res.players
      }
      return []
    } catch {
      return []
    }
  }

  async function fetchCrudLogs(limit = 10): Promise<CloudCrudLog[]> {
    if (!import.meta.client) return []
    try {
      const res = await $fetch<{ ok: boolean; logs?: CloudCrudLog[] }>('/api/logs', {
        query: { limit }
      })
      if (res?.ok && Array.isArray(res.logs)) {
        recentCrudLogs.value = res.logs
        return res.logs
      }
      return []
    } catch {
      return []
    }
  }

  async function refreshCloudData(): Promise<void> {
    await Promise.all([fetchCloudProfiles(), fetchCrudLogs(10)])
  }

  async function pushToTiDBNow(progressToPush: SaveProgress): Promise<boolean> {
    if (!import.meta.client) return false
    const id = ensurePlayerId()
    if (!id) return false

    cloudSyncStatus.value = 'syncing'
    cloudSyncError.value = ''
    try {
      const payload = toCanonicalSavePayload(progressToPush)
      const res = await $fetch<CloudSavePostResponse>('/api/save', {
        method: 'POST',
        body: {
          playerId: id,
          displayName: playerName.value || undefined,
          saveData: payload
        }
      })
      if (res?.ok) {
        if (res.displayName) playerName.value = res.displayName
        cloudSyncStatus.value = 'synced'
        lastCloudSyncAt.value = res.savedAt ?? Date.now()
        return true
      }
      cloudSyncStatus.value = 'offline'
      cloudSyncError.value = res?.error || 'TiDB tidak merespons'
      return false
    } catch (err) {
      cloudSyncStatus.value = 'offline'
      cloudSyncError.value = err instanceof Error ? err.message : 'Mode offline (tersimpan lokal)'
      return false
    }
  }

  function syncToCloud(
    nextProgress?: SaveProgress,
    options: { immediate?: boolean } = {}
  ): Promise<boolean> {
    if (!import.meta.client) return Promise.resolve(false)
    const snapshot = sanitizeProgress(nextProgress ?? saveState.value)

    if (cloudSyncTimeout !== null) {
      window.clearTimeout(cloudSyncTimeout)
      cloudSyncTimeout = null
    }

    if (options.immediate) {
      return pushToTiDBNow(snapshot)
    }

    return new Promise<boolean>((resolve) => {
      cloudSyncTimeout = window.setTimeout(() => {
        cloudSyncTimeout = null
        void pushToTiDBNow(snapshot).then(resolve)
      }, 750)
    })
  }

  async function loadFromCloud(
    options: { forceApply?: boolean; targetPlayerId?: string } = {}
  ): Promise<{
    ok: boolean
    applied: boolean
    found: boolean
    progress?: SaveProgress
    error?: string
  }> {
    if (!import.meta.client) {
      return { ok: false, applied: false, found: false }
    }

    const id = options.targetPlayerId ? normalizePlayerId(options.targetPlayerId) : ensurePlayerId()
    if (!id) {
      return { ok: false, applied: false, found: false, error: 'Kode Player tidak valid.' }
    }

    cloudSyncStatus.value = 'syncing'
    cloudSyncError.value = ''

    try {
      const res = await $fetch<CloudSaveGetResponse>('/api/save', {
        query: { playerId: id }
      })

      if (!res?.ok) {
        cloudSyncStatus.value = 'offline'
        cloudSyncError.value = res?.error || 'Gagal menghubungi TiDB Cloud'
        return { ok: false, applied: false, found: false, error: cloudSyncError.value }
      }

      if (!res.found || !res.data) {
        cloudSyncStatus.value = 'synced'
        void pushToTiDBNow(saveState.value).then(() => refreshCloudData())
        return { ok: true, applied: false, found: false }
      }

      if (res.displayName) {
        playerName.value = res.displayName
      }

      const cloudProgress = sanitizeProgress(res.data)
      const localProgress = sanitizeProgress(saveState.value)
      const cloudScore = scoreProgressRichness(cloudProgress)
      const localScore = scoreProgressRichness(localProgress)
      const cloudTs = Number(res.data.savedAt || res.updatedAt || 0)
      const localTs = getLocalSavedTimestamp()

      const shouldApply =
        Boolean(options.forceApply) ||
        cloudScore > localScore ||
        (cloudScore === localScore && cloudTs > localTs + 1500)

      if (shouldApply) {
        isInternalSync = true
        saveState.value = cloudProgress
        queueMicrotask(() => {
          isInternalSync = false
        })
        saveGameData(cloudProgress)
        lastSavedAt.value = Date.now()
        lastCloudSyncAt.value = Date.now()
        cloudSyncStatus.value = 'synced'
        return { ok: true, applied: true, found: true, progress: cloudProgress }
      }

      cloudSyncStatus.value = 'synced'
      lastCloudSyncAt.value = Date.now()
      if (localScore > cloudScore || localTs > cloudTs + 1500) {
        void pushToTiDBNow(localProgress)
      }
      return { ok: true, applied: false, found: true, progress: localProgress }
    } catch (err) {
      cloudSyncStatus.value = 'offline'
      cloudSyncError.value = err instanceof Error ? err.message : 'Mode offline'
      return { ok: false, applied: false, found: false, error: cloudSyncError.value }
    }
  }

  // CREATE: Create a brand-new player profile in TiDB and switch to it
  async function createCloudProfile(rawDisplayName: string): Promise<{
    ok: boolean
    playerId?: string
    displayName?: string
    progress?: SaveProgress
    error?: string
  }> {
    if (!import.meta.client) return { ok: false, error: 'Hanya tersedia di browser.' }
    const fresh = createDefaultSave()
    const cleanName = rawDisplayName.trim().slice(0, 48) || 'Petualang Baru'
    cloudSyncStatus.value = 'syncing'

    try {
      const res = await $fetch<{
        ok: boolean
        playerId?: string
        displayName?: string
        error?: string
      }>('/api/players', {
        method: 'POST',
        body: {
          displayName: cleanName,
          saveData: toCanonicalSavePayload(fresh)
        }
      })

      if (!res?.ok || !res.playerId) {
        cloudSyncStatus.value = 'offline'
        return { ok: false, error: res?.error || 'Gagal membuat profil baru di TiDB.' }
      }

      persistPlayerId(res.playerId)
      playerName.value = res.displayName || cleanName
      isInternalSync = true
      saveState.value = fresh
      queueMicrotask(() => {
        isInternalSync = false
      })
      saveGameData(fresh)
      lastSavedAt.value = Date.now()
      lastCloudSyncAt.value = Date.now()
      cloudSyncStatus.value = 'synced'
      await refreshCloudData()

      return {
        ok: true,
        playerId: res.playerId,
        displayName: playerName.value,
        progress: fresh
      }
    } catch (err) {
      cloudSyncStatus.value = 'offline'
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Gagal membuat profil di TiDB.'
      }
    }
  }

  // UPDATE: Rename active player profile directly in TiDB (`PUT /api/players/:id`)
  async function updatePlayerName(nextName: string): Promise<{
    ok: boolean
    displayName?: string
    error?: string
  }> {
    if (!import.meta.client) return { ok: false, error: 'Hanya tersedia di browser.' }
    const id = ensurePlayerId()
    const cleaned = nextName.trim().slice(0, 48)
    if (!cleaned) {
      return { ok: false, error: 'Nama profil tidak boleh kosong.' }
    }

    cloudSyncStatus.value = 'syncing'
    try {
      const res = await $fetch<{
        ok: boolean
        found?: boolean
        displayName?: string
        error?: string
      }>(`/api/players/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: {
          displayName: cleaned,
          saveData: toCanonicalSavePayload(saveState.value)
        }
      })

      if (!res?.ok) {
        cloudSyncStatus.value = 'offline'
        return { ok: false, error: res?.error || 'Gagal memperbarui nama di TiDB.' }
      }

      playerName.value = res.displayName || cleaned
      cloudSyncStatus.value = 'synced'
      lastCloudSyncAt.value = Date.now()
      await refreshCloudData()
      return { ok: true, displayName: playerName.value }
    } catch (err) {
      cloudSyncStatus.value = 'offline'
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Gagal memperbarui nama di TiDB.'
      }
    }
  }

  // DELETE: Permanently delete a player profile & all relational rows from TiDB
  async function deleteCloudProfile(targetId: string): Promise<{
    ok: boolean
    deletedActive: boolean
    nextProgress?: SaveProgress
    error?: string
  }> {
    if (!import.meta.client) {
      return { ok: false, deletedActive: false, error: 'Hanya tersedia di browser.' }
    }
    const normalized = normalizePlayerId(targetId)
    if (!normalized) {
      return { ok: false, deletedActive: false, error: 'Kode Player tidak valid.' }
    }

    cloudSyncStatus.value = 'syncing'
    try {
      const res = await $fetch<{ ok: boolean; deleted?: boolean; error?: string }>(
        `/api/players/${encodeURIComponent(normalized)}`,
        { method: 'DELETE' }
      )
      if (!res?.ok) {
        cloudSyncStatus.value = 'offline'
        return { ok: false, deletedActive: false, error: res?.error || 'Gagal menghapus profil.' }
      }

      const deletedActive = normalized === playerId.value
      let nextProgress: SaveProgress | undefined

      if (deletedActive) {
        const fresh = createDefaultSave()
        clearStoredGameData()
        saveGameData(fresh)
        isInternalSync = true
        saveState.value = fresh
        queueMicrotask(() => {
          isInternalSync = false
        })
        const newCode = generatePlayerId()
        persistPlayerId(newCode)
        playerName.value = `Petualang ${newCode.slice(-4)}`
        nextProgress = fresh
      }

      cloudSyncStatus.value = 'synced'
      await refreshCloudData()
      return { ok: true, deletedActive, nextProgress }
    } catch (err) {
      cloudSyncStatus.value = 'offline'
      return {
        ok: false,
        deletedActive: false,
        error: err instanceof Error ? err.message : 'Gagal menghapus profil dari TiDB.'
      }
    }
  }

  // READ + SWITCH: Link another Player ID and load its full relational state from TiDB
  async function switchPlayerId(rawCode: string): Promise<{
    ok: boolean
    mode?: 'loaded' | 'created'
    playerId?: string
    progress?: SaveProgress
    error?: string
  }> {
    if (!import.meta.client) return { ok: false, error: 'Hanya tersedia di browser.' }
    const normalized = normalizePlayerId(rawCode)
    if (!normalized) {
      return {
        ok: false,
        error: 'Kode minimal 4 karakter (huruf, angka, tanda - atau _).'
      }
    }

    persistPlayerId(normalized)
    const res = await loadFromCloud({ forceApply: true, targetPlayerId: normalized })
    if (!res.ok) {
      return { ok: false, error: res.error || 'Gagal menyinkronkan dengan TiDB Cloud.' }
    }

    if (res.found && res.progress) {
      await refreshCloudData()
      return { ok: true, mode: 'loaded', playerId: normalized, progress: res.progress }
    }

    await pushToTiDBNow(saveState.value)
    await refreshCloudData()
    return { ok: true, mode: 'created', playerId: normalized, progress: saveState.value }
  }

  function loadGame(): SaveProgress {
    if (!import.meta.client) {
      return createDefaultSave()
    }
    const id = ensurePlayerId()
    playerName.value = `Petualang ${id.slice(-4)}`
    const loaded = loadGameData()
    isInternalSync = true
    saveState.value = loaded
    isHydrated.value = true
    queueMicrotask(() => {
      isInternalSync = false
    })
    return loaded
  }

  function saveGame(
    nextProgress?: SaveProgress,
    options: { showIndicator?: boolean; syncCloud?: boolean; immediateCloud?: boolean } = {}
  ): boolean {
    if (!import.meta.client) return false
    const sanitized = sanitizeProgress(nextProgress ?? saveState.value)
    isInternalSync = true
    saveState.value = sanitized
    queueMicrotask(() => {
      isInternalSync = false
    })
    const ok = saveGameData(sanitized)
    if (ok) {
      lastSavedAt.value = Date.now()
      if (options.showIndicator !== false) {
        showSaveBadge()
      }
      if (options.syncCloud !== false) {
        void syncToCloud(sanitized, { immediate: options.immediateCloud })
      }
    }
    return ok
  }

  function syncFromEngine(engineProgress: SaveProgress): void {
    isInternalSync = true
    saveState.value = engineProgress
    queueMicrotask(() => {
      isInternalSync = false
    })
  }

  function triggerSaveIndicator(latestProgress?: SaveProgress): void {
    lastSavedAt.value = Date.now()
    showSaveBadge()
    void syncToCloud(latestProgress ?? saveState.value)
  }

  function exportSaveData(): string {
    return exportProgressJson(saveState.value)
  }

  function importSaveData(
    rawJson: string
  ): { ok: true; progress: SaveProgress } | { ok: false; error: string } {
    const res = importProgressJson(rawJson)
    if (!res.ok) return res
    saveGame(res.progress, { showIndicator: true, syncCloud: true, immediateCloud: true })
    return { ok: true, progress: res.progress }
  }

  function resetSaveData(): SaveProgress {
    const fresh = createDefaultSave()
    const activeId = ensurePlayerId()
    if (import.meta.client) {
      if (debounceTimeout !== null) {
        window.clearTimeout(debounceTimeout)
        debounceTimeout = null
      }
      if (cloudSyncTimeout !== null) {
        window.clearTimeout(cloudSyncTimeout)
        cloudSyncTimeout = null
      }
      clearStoredGameData()
    }
    isInternalSync = true
    saveState.value = fresh
    queueMicrotask(() => {
      isInternalSync = false
    })
    if (import.meta.client) {
      saveGameData(fresh)
      lastSavedAt.value = Date.now()
      showSaveBadge()
      // Execute real DELETE on TiDB first, then re-seed clean profile
      void $fetch('/api/save', { method: 'DELETE', query: { playerId: activeId } })
        .catch(() => null)
        .finally(() => {
          void pushToTiDBNow(fresh).then(() => refreshCloudData())
        })
    }
    return fresh
  }

  if (import.meta.client && !watcherInitialized) {
    watcherInitialized = true
    watch(
      saveState,
      (latest) => {
        if (isInternalSync || !isHydrated.value) return
        if (debounceTimeout !== null) {
          window.clearTimeout(debounceTimeout)
        }
        debounceTimeout = window.setTimeout(() => {
          debounceTimeout = null
          saveGameData(latest)
          lastSavedAt.value = Date.now()
          showSaveBadge()
          void syncToCloud(latest)
        }, 300)
      },
      { deep: true }
    )
  }

  function flushLocalSave(): boolean {
    if (!import.meta.client || !isHydrated.value) return false
    if (debounceTimeout !== null) {
      window.clearTimeout(debounceTimeout)
      debounceTimeout = null
    }
    const ok = saveGameData(saveState.value)
    if (ok) {
      lastSavedAt.value = Date.now()
    }
    return ok
  }

  // Mobile-resilient browser lifecycle flush (iOS Safari / Android Chrome often skip beforeunload)
  if (import.meta.client && !lifecycleHooksInitialized) {
    lifecycleHooksInitialized = true
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushLocalSave()
      }
    }
    const handlePageHide = () => {
      flushLocalSave()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
  }

  onBeforeUnmount(() => {
    flushLocalSave()
  })

  return {
    storageKey: SAVE_STORAGE_KEY,
    defaultSaveData,
    saveState,
    canonicalSave,
    isHydrated,
    lastSavedAt,
    saveIndicatorVisible,
    playerId,
    playerName,
    cloudSyncStatus,
    cloudSyncError,
    lastCloudSyncAt,
    cloudProfiles,
    recentCrudLogs,
    loadGame,
    saveGame,
    flushLocalSave,
    syncToCloud,
    loadFromCloud,
    createCloudProfile,
    updatePlayerName,
    deleteCloudProfile,
    switchPlayerId,
    fetchCloudProfiles,
    fetchCrudLogs,
    refreshCloudData,
    syncFromEngine,
    triggerSaveIndicator,
    exportSaveData,
    importSaveData,
    resetSaveData
  }
}
