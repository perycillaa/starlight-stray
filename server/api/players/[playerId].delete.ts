import { isTiDBConfigured } from '../../utils/tidb'
import { deletePlayerCompletely, validatePlayerId } from '../../utils/starlightRepo'

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

  try {
    const res = await deletePlayerCompletely(playerId)
    return {
      ok: true,
      action: 'DELETE',
      playerId,
      deleted: res.deleted
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete player'
    return { ok: false, error: message }
  }
})
