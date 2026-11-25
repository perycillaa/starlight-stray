import { isTiDBConfigured } from '../utils/tidb'
import { deletePlayerCompletely, validatePlayerId } from '../utils/starlightRepo'

export default defineEventHandler(async (event) => {
  if (!isTiDBConfigured()) {
    return { ok: false, error: 'TiDB not configured' }
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
    const res = await deletePlayerCompletely(playerId, 'Reset progres pemain')
    return {
      ok: true,
      action: 'DELETE',
      playerId,
      deleted: res.deleted
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete save from TiDB'
    return { ok: false, error: message }
  }
})
