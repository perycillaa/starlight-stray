import { isTiDBConfigured } from '../utils/tidb'
import { upsertFullPlayerState, validatePlayerId } from '../utils/starlightRepo'

interface SavePostBody {
  playerId?: string
  displayName?: string
  saveData?: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  if (!isTiDBConfigured()) {
    return { ok: false, error: 'TiDB not configured' }
  }

  const body = (await readBody<SavePostBody>(event)) || {}
  const playerId = validatePlayerId(body.playerId)
  if (!playerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid playerId format'
    })
  }

  const saveData = body.saveData
  if (!saveData || typeof saveData !== 'object' || Array.isArray(saveData)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing or invalid saveData object'
    })
  }

  if (JSON.stringify(saveData).length > 100_000) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Save payload too large'
    })
  }

  try {
    const res = await upsertFullPlayerState({
      playerId,
      displayName: body.displayName,
      saveData
    })

    return {
      ok: true,
      action: res.created ? 'CREATE' : 'UPDATE',
      playerId,
      displayName: res.displayName,
      savedAt: res.savedAt
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save to TiDB'
    return { ok: false, error: message }
  }
})
