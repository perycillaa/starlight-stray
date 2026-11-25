import { isTiDBConfigured } from '../utils/tidb'
import { getFullPlayerState, validatePlayerId } from '../utils/starlightRepo'

export default defineEventHandler(async (event) => {
  if (!isTiDBConfigured()) {
    return { ok: false, found: false, error: 'TiDB not configured' }
  }

  const query = getQuery(event)
  const playerId = validatePlayerId(query.playerId)
  if (!playerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid playerId format'
    })
  }

  try {
    const result = await getFullPlayerState(playerId)
    if (!result.found || !result.player) {
      return { ok: true, found: false, playerId }
    }

    return {
      ok: true,
      found: true,
      playerId: result.player.playerId,
      displayName: result.player.displayName,
      data: result.saveData,
      updatedAt: result.player.updatedAt
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load cloud save'
    return { ok: false, found: false, error: message }
  }
})
