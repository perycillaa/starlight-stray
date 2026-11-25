import { isTiDBConfigured } from '../../utils/tidb'
import { listAllPlayers } from '../../utils/starlightRepo'

export default defineEventHandler(async (event) => {
  if (!isTiDBConfigured()) {
    return { ok: false, players: [], error: 'TiDB not configured' }
  }

  const query = getQuery(event)
  const limit = Number(query.limit) || 20

  try {
    const players = await listAllPlayers(limit)
    return {
      ok: true,
      count: players.length,
      players
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list players'
    return { ok: false, players: [], error: message }
  }
})
