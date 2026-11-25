import type { RowDataPacket } from 'mysql2/promise'
import {
  STARLIGHT_TABLES,
  ensureStarlightSchema,
  getTiDBDatabaseName,
  getTiDBPool,
  isTiDBConfigured
} from '../utils/tidb'

export default defineEventHandler(async () => {
  if (!isTiDBConfigured()) {
    return {
      ok: false,
      configured: false,
      error: 'TiDB credentials not configured in .env'
    }
  }

  try {
    await ensureStarlightSchema()
    const pool = getTiDBPool()
    const db = getTiDBDatabaseName()
    const [rows] = await pool.query<RowDataPacket[]>('SELECT VERSION() AS version')

    const tableCounts: Record<string, number> = {}
    for (const table of STARLIGHT_TABLES) {
      const [cRows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS cnt FROM \`${db}\`.\`${table}\``
      )
      tableCounts[table] = Number(cRows[0]?.cnt ?? 0)
    }

    return {
      ok: true,
      configured: true,
      database: db,
      serverVersion: String(rows[0]?.version ?? 'TiDB'),
      tables: tableCounts
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database connection failed'
    return {
      ok: false,
      configured: true,
      error: message
    }
  }
})
