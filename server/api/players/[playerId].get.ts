import { isTiDBConfigured } from '../../utils/tidb'
import { getCrudLogs, getFullPlayerState, validatePlayerId } from '../../utils/starlightRepo'

export default defineEventHandler(async (event) => {
  if (!isTiDBConfigured()) {
    return { ok: false, found: false, error: 'TiDB not configured' }
  }

  const playerId = validatePlayerId(getRouterParam(event, 'playerId'))
  if (!playerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid playerId parameter'
    })
  }

  try {
    const result = await getFullPlayerState(playerId)
    if (!result.found) {
      return { ok: true, found: false, playerId }
    }

    const recentLogs = await getCrudLogs(playerId, 10)
    return {
      ok: true,
      found: true,
      player: result.player,
      saveData: result.saveData,
      levels: result.levels,
      inventory: result.inventory,
      achievements: result.achievements,
      recentLogs
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to read player profile'
    return { ok: false, found: false, error: message }
  }
})
