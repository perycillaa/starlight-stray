import { isTiDBConfigured } from '../../utils/tidb'
import {
  sanitizeDisplayName,
  upsertFullPlayerState,
  validatePlayerId
} from '../../utils/starlightRepo'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  const part = (n: number) =>
    Array.from({ length: n }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join(
      ''
    )
  return `STRAY-${part(4)}-${part(4)}`
}

interface CreatePlayerBody {
  playerId?: string
  displayName?: string
  saveData?: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  if (!isTiDBConfigured()) {
    return { ok: false, error: 'TiDB not configured' }
  }

  const body = (await readBody<CreatePlayerBody>(event)) || {}
  const playerId = body.playerId ? validatePlayerId(body.playerId) : generateCode()
  if (!playerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid playerId format'
    })
  }

  const displayName = sanitizeDisplayName(body.displayName, `Petualang ${playerId.slice(-4)}`)
  const defaultSave: Record<string, unknown> = body.saveData && typeof body.saveData === 'object'
    ? body.saveData
    : {
        version: 1,
        savedAt: Date.now(),
        unlockedLevel: 1,
        lastPlayedLevel: 1,
        highScore: 0,
        fishBank: 0,
        fishCoins: 0,
        totalFishEarned: 0,
        selectedCharacter: 'cat-mochi',
        selectedScarf: 'pink',
        selectedHat: 'none',
        selectedCape: 'none',
        unlockedCharacters: ['cat-mochi'],
        ownedScarves: ['pink'],
        ownedHats: ['none'],
        ownedCapes: ['none'],
        unlockedAchievements: [],
        collectedShards: {},
        bestLevelScores: {},
        levelRecords: {}
      }

  try {
    const res = await upsertFullPlayerState({
      playerId,
      displayName,
      saveData: defaultSave,
      entityName: 'player',
      summaryOverride: `Profil baru "${displayName}" (${playerId}) dibuat`
    })

    return {
      ok: true,
      action: 'CREATE',
      playerId,
      displayName: res.displayName,
      savedAt: res.savedAt
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create player profile'
    return { ok: false, error: message }
  }
})
