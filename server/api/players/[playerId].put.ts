import { isTiDBConfigured } from '../../utils/tidb'
import {
  sanitizeDisplayName,
  updatePlayerDisplayName,
  upsertFullPlayerState,
  validatePlayerId
} from '../../utils/starlightRepo'

interface UpdatePlayerBody {
  displayName?: string
  saveData?: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  if (!isTiDBConfigured()) {
    return { ok: false, error: 'TiDB not configured' }
  }

  const playerId = validatePlayerId(getRouterParam(event, 'playerId'))
  if (!playerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid playerId parameter'
    })
  }

  const body = (await readBody<UpdatePlayerBody>(event)) || {}
  if (!body.displayName && !body.saveData) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Provide displayName or saveData to update'
    })
  }

  try {
    if (body.saveData && typeof body.saveData === 'object') {
      const res = await upsertFullPlayerState({
        playerId,
        displayName: body.displayName,
        saveData: body.saveData,
        entityName: 'player'
      })
      return {
        ok: true,
        action: 'UPDATE',
        playerId,
        displayName: res.displayName,
        savedAt: res.savedAt
      }
    }

    const cleanName = sanitizeDisplayName(body.displayName)
    const updated = await updatePlayerDisplayName(playerId, cleanName)
    if (!updated.found) {
      return { ok: false, found: false, error: 'Player tidak ditemukan di TiDB' }
    }

    return {
      ok: true,
      action: 'UPDATE',
      playerId,
      displayName: updated.displayName
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update player'
    return { ok: false, error: message }
  }
})
