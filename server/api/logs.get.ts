import { isTiDBConfigured } from '../utils/tidb'
import { getCrudLogs, validatePlayerId } from '../utils/starlightRepo'

export default defineEventHandler(async (event) => {
  if (!isTiDBConfigured()) {
    return { ok: false, logs: [], error: 'TiDB not configured' }
  }

  const query = getQuery(event)
  const rawPlayerId = typeof query.playerId === 'string' && query.playerId.trim() ? query.playerId : undefined
  const playerId = rawPlayerId ? validatePlayerId(rawPlayerId) ?? undefined : undefined
  const limit = Number(query.limit) || 15

  try {
    const logs = await getCrudLogs(playerId, limit)
    return {
      ok: true,
      count: logs.length,
      logs
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load CRUD logs'
    return { ok: false, logs: [], error: message }
  }
})
