import type { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { ensureStarlightSchema, getTiDBDatabaseName, getTiDBPool } from './tidb'

export const PLAYER_ID_PATTERN = /^[a-zA-Z0-9_-]{4,64}$/

export type CrudActionType = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'

export interface PlayerSummaryRow {
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

export interface CrudLogRow {
  id: number
  playerId: string
  actionType: CrudActionType
  entityName: string
  summary: string
  metadata: Record<string, unknown> | null
  createdAt: number
}

export function validatePlayerId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim().toUpperCase()
  if (!PLAYER_ID_PATTERN.test(trimmed)) return null
  return trimmed
}

export function sanitizeDisplayName(raw: unknown, fallback = 'Starlight Traveler'): string {
  if (typeof raw !== 'string') return fallback
  const cleaned = raw.trim().replace(/\s+/g, ' ').slice(0, 48)
  return cleaned.length > 0 ? cleaned : fallback
}

function parseJsonSafe<T>(val: unknown, fallback: T): T {
  if (val === null || val === undefined) return fallback
  if (typeof val === 'string') {
    try {
      return JSON.parse(val) as T
    } catch {
      return fallback
    }
  }
  return val as T
}

export async function logCrudActivity(
  executor: PoolConnection | ReturnType<typeof getTiDBPool>,
  entry: {
    playerId: string
    actionType: CrudActionType
    entityName: string
    summary: string
    metadata?: Record<string, unknown> | null
  }
): Promise<void> {
  const db = getTiDBDatabaseName()
  await executor.execute(
    `INSERT INTO \`${db}\`.crud_activity_logs
       (player_id, action_type, entity_name, summary, metadata_json)
     VALUES (?, ?, ?, ?, ?)`,
    [
      entry.playerId,
      entry.actionType,
      entry.entityName,
      entry.summary.slice(0, 250),
      entry.metadata ? JSON.stringify(entry.metadata) : null
    ]
  )
}

/**
 * Full transactional UPSERT across all 5 relational tables inside `starlight_stray`:
 * `players`, `player_level_progress`, `player_inventory`, `player_achievements`, and `crud_activity_logs`.
 */
export async function upsertFullPlayerState(params: {
  playerId: string
  displayName?: string
  saveData: Record<string, unknown>
  entityName?: string
  summaryOverride?: string
}): Promise<{ created: boolean; savedAt: number; displayName: string }> {
  await ensureStarlightSchema()
  const db = getTiDBDatabaseName()
  const pool = getTiDBPool()
  const conn = await pool.getConnection()

  const save = params.saveData
  const selectedCharacter = String(save.selectedCharacter || 'cat-mochi').slice(0, 32)
  const selectedScarf = String(save.selectedScarf || 'pink').slice(0, 32)
  const selectedHat = String(save.selectedHat || 'none').slice(0, 32)
  const selectedCape = String(save.selectedCape || 'none').slice(0, 32)
  const fishCoins = Math.max(0, Math.floor(Number(save.fishBank ?? save.fishCoins) || 0))
  const totalFishEarned = Math.max(fishCoins, Math.floor(Number(save.totalFishEarned) || 0))
  const highScore = Math.max(0, Math.floor(Number(save.highScore) || 0))
  const unlockedLevel = Math.max(1, Math.min(14, Math.floor(Number(save.unlockedLevel) || 1)))
  const lastPlayedLevel = Math.max(1, Math.min(14, Math.floor(Number(save.lastPlayedLevel) || 1)))
  const graphicsStyle = save.graphicsStyle === 'classic' ? 'classic' : 'modern'
  const homeBackdropMode = String(save.homeBackdropMode || 'auto').slice(0, 16)
  const reduceMotion = save.reduceMotion === false ? 0 : 1
  const showSpeedrunTimer = save.showSpeedrunTimer === true ? 1 : 0
  const muted = save.muted === true ? 1 : 0

  const settingsPayload = {
    audio: save.audio ?? { bgmVolume: 0.65, ambienceVolume: 0.65, sfxVolume: 0.8 },
    touchControlsMode: save.touchControlsMode ?? 'auto',
    dailyQuest: save.dailyQuest ?? null,
    visitedBiomes: Array.isArray(save.visitedBiomes) ? save.visitedBiomes : ['rooftops'],
    totalDashes: Math.max(0, Math.floor(Number(save.totalDashes) || 0)),
    totalFalls: Math.max(0, Math.floor(Number(save.totalFalls) || 0)),
    pacifistClears: Math.max(0, Math.floor(Number(save.pacifistClears) || 0))
  }

  try {
    await conn.beginTransaction()

    const [existingRows] = await conn.execute<RowDataPacket[]>(
      `SELECT display_name FROM \`${db}\`.players WHERE player_id = ? LIMIT 1`,
      [params.playerId]
    )
    const isNewPlayer = existingRows.length === 0
    const resolvedName = params.displayName
      ? sanitizeDisplayName(params.displayName)
      : existingRows[0]?.display_name
        ? String(existingRows[0].display_name)
        : `Petualang ${params.playerId.slice(-4)}`

    // 1. Upsert master row in `players`
    await conn.execute(
      `INSERT INTO \`${db}\`.players (
         player_id, display_name, selected_character, selected_scarf, selected_hat, selected_cape,
         fish_coins, total_fish_earned, high_score, unlocked_level, last_played_level,
         graphics_style, home_backdrop_mode, reduce_motion, show_speedrun_timer, muted,
         settings_json, raw_save_json
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         display_name = VALUES(display_name),
         selected_character = VALUES(selected_character),
         selected_scarf = VALUES(selected_scarf),
         selected_hat = VALUES(selected_hat),
         selected_cape = VALUES(selected_cape),
         fish_coins = VALUES(fish_coins),
         total_fish_earned = VALUES(total_fish_earned),
         high_score = VALUES(high_score),
         unlocked_level = VALUES(unlocked_level),
         last_played_level = VALUES(last_played_level),
         graphics_style = VALUES(graphics_style),
         home_backdrop_mode = VALUES(home_backdrop_mode),
         reduce_motion = VALUES(reduce_motion),
         show_speedrun_timer = VALUES(show_speedrun_timer),
         muted = VALUES(muted),
         settings_json = VALUES(settings_json),
         raw_save_json = VALUES(raw_save_json),
         updated_at = CURRENT_TIMESTAMP`,
      [
        params.playerId,
        resolvedName,
        selectedCharacter,
        selectedScarf,
        selectedHat,
        selectedCape,
        fishCoins,
        totalFishEarned,
        highScore,
        unlockedLevel,
        lastPlayedLevel,
        graphicsStyle,
        homeBackdropMode,
        reduceMotion,
        showSpeedrunTimer,
        muted,
        JSON.stringify(settingsPayload),
        JSON.stringify(save)
      ]
    )

    // 2. Sync per-level rows into `player_level_progress`
    const bestLevelScores = (save.bestLevelScores ?? {}) as Record<string, unknown>
    const levelRecords = (save.levelRecords ?? {}) as Record<string, Record<string, unknown>>
    const collectedShards = (save.collectedShards ?? {}) as Record<string, unknown[]>
    const bestTimes = (save.bestTimes ?? {}) as Record<string, unknown>
    const levelRanks = (save.levelRanks ?? {}) as Record<string, unknown>
    const claimedRankRewards = (save.claimedRankRewards ?? {}) as Record<
      string,
      Record<string, unknown>
    >
    const timeTrials = (save.timeTrials ?? {}) as Record<string, Record<string, unknown>>

    let totalShardsCount = 0
    for (let lvl = 1; lvl <= 14; lvl++) {
      const key = String(lvl)
      const rec = levelRecords[key] ?? {}
      const bestScore = Math.max(
        0,
        Math.floor(Number(bestLevelScores[key] ?? rec.bestScore) || 0)
      )
      const bestStars = Math.max(0, Math.min(3, Math.floor(Number(rec.bestStars) || 0)))
      const shardArr = Array.isArray(collectedShards[key]) ? collectedShards[key] : []
      const s1 = shardArr[0] ? 1 : 0
      const s2 = shardArr[1] ? 1 : 0
      const s3 = shardArr[2] ? 1 : 0
      totalShardsCount += s1 + s2 + s3

      const rawTime = Number(bestTimes[key])
      const bestTimeMs = Number.isFinite(rawTime) && rawTime > 0 ? Math.floor(rawTime) : null
      const speedrunRank =
        typeof levelRanks[key] === 'string' ? String(levelRanks[key]).slice(0, 4) : null
      const claimed = claimedRankRewards[key] ?? {}
      const tt = timeTrials[key] ?? {}
      const rawTtMs = Number(tt.bestTimeMs)
      const ttBestMs = Number.isFinite(rawTtMs) && rawTtMs > 0 ? Math.floor(rawTtMs) : null
      const ttMedal = typeof tt.bestMedal === 'string' ? tt.bestMedal.slice(0, 16) : 'none'

      const hasAnyLevelData =
        lvl <= unlockedLevel ||
        bestScore > 0 ||
        bestStars > 0 ||
        s1 + s2 + s3 > 0 ||
        bestTimeMs !== null ||
        ttBestMs !== null

      if (hasAnyLevelData) {
        await conn.execute(
          `INSERT INTO \`${db}\`.player_level_progress (
             player_id, level_id, best_score, best_stars, shard_1, shard_2, shard_3,
             best_time_ms, speedrun_rank, claimed_rank_b, claimed_rank_a, claimed_rank_s,
             time_trial_best_ms, time_trial_medal
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             best_score = VALUES(best_score),
             best_stars = VALUES(best_stars),
             shard_1 = VALUES(shard_1),
             shard_2 = VALUES(shard_2),
             shard_3 = VALUES(shard_3),
             best_time_ms = VALUES(best_time_ms),
             speedrun_rank = VALUES(speedrun_rank),
             claimed_rank_b = VALUES(claimed_rank_b),
             claimed_rank_a = VALUES(claimed_rank_a),
             claimed_rank_s = VALUES(claimed_rank_s),
             time_trial_best_ms = VALUES(time_trial_best_ms),
             time_trial_medal = VALUES(time_trial_medal),
             updated_at = CURRENT_TIMESTAMP`,
          [
            params.playerId,
            lvl,
            bestScore,
            bestStars,
            s1,
            s2,
            s3,
            bestTimeMs,
            speedrunRank,
            claimed.B ? 1 : 0,
            claimed.A ? 1 : 0,
            claimed.S ? 1 : 0,
            ttBestMs,
            ttMedal
          ]
        )
      }
    }

    // 3. Sync owned characters & cosmetics into `player_inventory`
    const inventoryItems: Array<{ type: string; id: string; equipped: number }> = []
    const addItems = (type: string, list: unknown, equippedId: string, fallback: string) => {
      const unique = new Set<string>()
      if (Array.isArray(list)) {
        for (const raw of list) {
          if (typeof raw === 'string' && raw.trim()) unique.add(raw.trim().slice(0, 48))
        }
      }
      unique.add(fallback)
      unique.add(equippedId)
      for (const id of unique) {
        inventoryItems.push({ type, id, equipped: id === equippedId ? 1 : 0 })
      }
    }

    addItems('character', save.unlockedCharacters, selectedCharacter, 'cat-mochi')
    addItems('scarf', save.ownedScarves, selectedScarf, 'pink')
    addItems('hat', save.ownedHats, selectedHat, 'none')
    addItems('cape', save.ownedCapes, selectedCape, 'none')
    addItems('head_acc', save.ownedHeadAccs, String(save.selectedHeadAcc || 'none'), 'none')
    addItems('face', save.ownedFaceAccs, String(save.selectedFaceAcc || 'none'), 'none')

    await conn.execute(`DELETE FROM \`${db}\`.player_inventory WHERE player_id = ?`, [
      params.playerId
    ])
    for (const item of inventoryItems) {
      await conn.execute(
        `INSERT INTO \`${db}\`.player_inventory (player_id, item_type, item_id, is_equipped)
         VALUES (?, ?, ?, ?)`,
        [params.playerId, item.type, item.id, item.equipped]
      )
    }

    // 4. Sync stamps into `player_achievements`
    const achievements = Array.isArray(save.unlockedAchievements)
      ? Array.from(
          new Set(
            save.unlockedAchievements
              .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
              .map((x) => x.trim().slice(0, 48))
          )
        )
      : []

    await conn.execute(`DELETE FROM \`${db}\`.player_achievements WHERE player_id = ?`, [
      params.playerId
    ])
    for (const achId of achievements) {
      await conn.execute(
        `INSERT INTO \`${db}\`.player_achievements (player_id, achievement_id)
         VALUES (?, ?)`,
        [params.playerId, achId]
      )
    }

    // 5. Record audit entry in `crud_activity_logs`
    const actionType: CrudActionType = isNewPlayer ? 'CREATE' : 'UPDATE'
    const summary =
      params.summaryOverride ||
      (isNewPlayer
        ? `Profil baru "${resolvedName}" dibuat di TiDB (Lvl ${unlockedLevel}, ${fishCoins} koin)`
        : `Sinkron progres "${resolvedName}" (Skor ${highScore}, ${fishCoins} koin, ${totalShardsCount}/24 shard)`)

    await logCrudActivity(conn, {
      playerId: params.playerId,
      actionType,
      entityName: params.entityName || (isNewPlayer ? 'player' : 'save_sync'),
      summary,
      metadata: {
        highScore,
        fishCoins,
        unlockedLevel,
        shardsCount: totalShardsCount,
        stampsCount: achievements.length,
        inventoryCount: inventoryItems.length
      }
    })

    await conn.commit()
    return { created: isNewPlayer, savedAt: Date.now(), displayName: resolvedName }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export async function getFullPlayerState(playerId: string): Promise<{
  found: boolean
  player?: {
    playerId: string
    displayName: string
    highScore: number
    fishCoins: number
    unlockedLevel: number
    selectedCharacter: string
    createdAt: number
    updatedAt: number
  }
  saveData?: Record<string, unknown>
  levels?: RowDataPacket[]
  inventory?: RowDataPacket[]
  achievements?: string[]
}> {
  await ensureStarlightSchema()
  const db = getTiDBDatabaseName()
  const pool = getTiDBPool()

  const [playerRows] = await pool.execute<RowDataPacket[]>(
    `SELECT player_id, display_name, selected_character, fish_coins, high_score, unlocked_level,
            raw_save_json,
            UNIX_TIMESTAMP(created_at) * 1000 AS created_ms,
            UNIX_TIMESTAMP(updated_at) * 1000 AS updated_ms
     FROM \`${db}\`.players
     WHERE player_id = ?
     LIMIT 1`,
    [playerId]
  )

  if (!playerRows.length) {
    return { found: false }
  }

  const row = playerRows[0]!
  const [levelRows] = await pool.execute<RowDataPacket[]>(
    `SELECT level_id, best_score, best_stars, shard_1, shard_2, shard_3,
            best_time_ms, speedrun_rank, time_trial_best_ms, time_trial_medal
     FROM \`${db}\`.player_level_progress
     WHERE player_id = ?
     ORDER BY level_id ASC`,
    [playerId]
  )

  const [inventoryRows] = await pool.execute<RowDataPacket[]>(
    `SELECT item_type, item_id, is_equipped
     FROM \`${db}\`.player_inventory
     WHERE player_id = ?
     ORDER BY item_type ASC, item_id ASC`,
    [playerId]
  )

  const [achRows] = await pool.execute<RowDataPacket[]>(
    `SELECT achievement_id
     FROM \`${db}\`.player_achievements
     WHERE player_id = ?
     ORDER BY unlocked_at ASC`,
    [playerId]
  )

  const saveData = parseJsonSafe<Record<string, unknown>>(row.raw_save_json, {})

  return {
    found: true,
    player: {
      playerId: String(row.player_id),
      displayName: String(row.display_name),
      selectedCharacter: String(row.selected_character),
      fishCoins: Number(row.fish_coins || 0),
      highScore: Number(row.high_score || 0),
      unlockedLevel: Number(row.unlocked_level || 1),
      createdAt: Number(row.created_ms || Date.now()),
      updatedAt: Number(row.updated_ms || Date.now())
    },
    saveData,
    levels: levelRows,
    inventory: inventoryRows,
    achievements: achRows.map((a) => String(a.achievement_id))
  }
}

export async function listAllPlayers(limit = 20): Promise<PlayerSummaryRow[]> {
  await ensureStarlightSchema()
  const db = getTiDBDatabaseName()
  const pool = getTiDBPool()
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)))

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       p.player_id,
       p.display_name,
       p.selected_character,
       p.fish_coins,
       p.high_score,
       p.unlocked_level,
       UNIX_TIMESTAMP(p.created_at) * 1000 AS created_ms,
       UNIX_TIMESTAMP(p.updated_at) * 1000 AS updated_ms,
       COALESCE((
         SELECT SUM(lp.shard_1 + lp.shard_2 + lp.shard_3)
         FROM \`${db}\`.player_level_progress lp
         WHERE lp.player_id = p.player_id
       ), 0) AS shards_count,
       COALESCE((
         SELECT COUNT(*)
         FROM \`${db}\`.player_achievements pa
         WHERE pa.player_id = p.player_id
       ), 0) AS stamps_count,
       COALESCE((
         SELECT COUNT(*)
         FROM \`${db}\`.player_inventory pi
         WHERE pi.player_id = p.player_id
       ), 0) AS inventory_count
     FROM \`${db}\`.players p
     ORDER BY p.updated_at DESC, p.high_score DESC
     LIMIT ${safeLimit}`
  )

  return rows.map((r) => ({
    playerId: String(r.player_id),
    displayName: String(r.display_name),
    selectedCharacter: String(r.selected_character),
    fishCoins: Number(r.fish_coins || 0),
    highScore: Number(r.high_score || 0),
    unlockedLevel: Number(r.unlocked_level || 1),
    shardsCount: Number(r.shards_count || 0),
    stampsCount: Number(r.stamps_count || 0),
    inventoryCount: Number(r.inventory_count || 0),
    createdAt: Number(r.created_ms || Date.now()),
    updatedAt: Number(r.updated_ms || Date.now())
  }))
}

export async function updatePlayerDisplayName(
  playerId: string,
  displayName: string
): Promise<{ found: boolean; displayName: string }> {
  await ensureStarlightSchema()
  const db = getTiDBDatabaseName()
  const pool = getTiDBPool()
  const cleanName = sanitizeDisplayName(displayName)

  const [res] = await pool.execute(
    `UPDATE \`${db}\`.players
     SET display_name = ?, updated_at = CURRENT_TIMESTAMP
     WHERE player_id = ?`,
    [cleanName, playerId]
  )

  const affected = Number((res as { affectedRows?: number }).affectedRows || 0)
  if (affected > 0) {
    await logCrudActivity(pool, {
      playerId,
      actionType: 'UPDATE',
      entityName: 'player',
      summary: `Nama profil diperbarui menjadi "${cleanName}"`,
      metadata: { displayName: cleanName }
    })
  }

  return { found: affected > 0, displayName: cleanName }
}

export async function deletePlayerCompletely(
  playerId: string,
  reason = 'Profil pemain dihapus permanen dari TiDB'
): Promise<{ deleted: boolean }> {
  await ensureStarlightSchema()
  const db = getTiDBDatabaseName()
  const pool = getTiDBPool()
  const conn = await pool.getConnection()

  try {
    await conn.beginTransaction()

    const [existing] = await conn.execute<RowDataPacket[]>(
      `SELECT display_name FROM \`${db}\`.players WHERE player_id = ? LIMIT 1`,
      [playerId]
    )

    await conn.execute(`DELETE FROM \`${db}\`.player_level_progress WHERE player_id = ?`, [
      playerId
    ])
    await conn.execute(`DELETE FROM \`${db}\`.player_inventory WHERE player_id = ?`, [playerId])
    await conn.execute(`DELETE FROM \`${db}\`.player_achievements WHERE player_id = ?`, [playerId])
    await conn.execute(`DELETE FROM \`${db}\`.players WHERE player_id = ?`, [playerId])

    const existed = existing.length > 0
    if (existed) {
      const oldName = String(existing[0]?.display_name || playerId)
      await logCrudActivity(conn, {
        playerId,
        actionType: 'DELETE',
        entityName: 'player',
        summary: `${reason}: "${oldName}" (${playerId})`,
        metadata: { deletedPlayerId: playerId, displayName: oldName }
      })
    }

    await conn.commit()
    return { deleted: existed }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export async function getCrudLogs(playerId?: string, limit = 15): Promise<CrudLogRow[]> {
  await ensureStarlightSchema()
  const db = getTiDBDatabaseName()
  const pool = getTiDBPool()
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)))

  const [rows] = playerId
    ? await pool.execute<RowDataPacket[]>(
        `SELECT id, player_id, action_type, entity_name, summary, metadata_json,
                UNIX_TIMESTAMP(created_at) * 1000 AS created_ms
         FROM \`${db}\`.crud_activity_logs
         WHERE player_id = ?
         ORDER BY id DESC
         LIMIT ${safeLimit}`,
        [playerId]
      )
    : await pool.query<RowDataPacket[]>(
        `SELECT id, player_id, action_type, entity_name, summary, metadata_json,
                UNIX_TIMESTAMP(created_at) * 1000 AS created_ms
         FROM \`${db}\`.crud_activity_logs
         ORDER BY id DESC
         LIMIT ${safeLimit}`
      )

  return rows.map((r) => ({
    id: Number(r.id),
    playerId: String(r.player_id),
    actionType: String(r.action_type) as CrudActionType,
    entityName: String(r.entity_name),
    summary: String(r.summary),
    metadata: parseJsonSafe<Record<string, unknown> | null>(r.metadata_json, null),
    createdAt: Number(r.created_ms || Date.now())
  }))
}
