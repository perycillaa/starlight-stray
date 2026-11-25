import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null
let schemaInitPromise: Promise<void> | null = null

const FORBIDDEN_SYSTEM_DBS = new Set([
  'sys',
  'mysql',
  'information_schema',
  'performance_schema',
  'metrics_schema'
])

function sanitizeDbName(raw: string): string {
  const cleaned = raw.trim().replace(/[^a-zA-Z0-9_]/g, '')
  if (!cleaned || FORBIDDEN_SYSTEM_DBS.has(cleaned.toLowerCase())) {
    return 'starlight_stray'
  }
  return cleaned
}

export function getTiDBDatabaseName(): string {
  const config = useRuntimeConfig()
  return sanitizeDbName(String(config.tidbDatabase || 'starlight_stray'))
}

export function isTiDBConfigured(): boolean {
  const config = useRuntimeConfig()
  return Boolean(config.tidbHost && config.tidbUser && config.tidbPassword)
}

export function getTiDBPool(): mysql.Pool {
  if (!pool) {
    const config = useRuntimeConfig()
    if (!config.tidbHost || !config.tidbUser || !config.tidbPassword) {
      throw new Error(
        'TiDB environment variables (TIDB_HOST, TIDB_USER, TIDB_PASSWORD) are not configured.'
      )
    }
    pool = mysql.createPool({
      host: String(config.tidbHost),
      port: Number(config.tidbPort || 4000),
      user: String(config.tidbUser),
      password: String(config.tidbPassword),
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
      },
      waitForConnections: true,
      connectionLimit: 6,
      maxIdle: 3,
      idleTimeout: 60000,
      enableKeepAlive: true
    })
  }
  return pool
}

export const STARLIGHT_TABLES = [
  'players',
  'player_level_progress',
  'player_inventory',
  'player_achievements',
  'crud_activity_logs'
] as const

/**
 * Ensures the dedicated `starlight_stray` database (never `sys`) and all 5 normalized
 * CRUD tables exist on TiDB Cloud Serverless. Runs once per server instance.
 */
export async function ensureStarlightSchema(): Promise<void> {
  if (schemaInitPromise) return schemaInitPromise

  schemaInitPromise = (async () => {
    const db = getTiDBDatabaseName()
    const conn = getTiDBPool()

    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${db}\``)

    // 1. Master Player Profiles & Settings
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`${db}\`.players (
        player_id VARCHAR(64) PRIMARY KEY,
        display_name VARCHAR(64) NOT NULL DEFAULT 'Starlight Traveler',
        selected_character VARCHAR(32) NOT NULL DEFAULT 'cat-mochi',
        selected_scarf VARCHAR(32) NOT NULL DEFAULT 'pink',
        selected_hat VARCHAR(32) NOT NULL DEFAULT 'none',
        selected_cape VARCHAR(32) NOT NULL DEFAULT 'none',
        fish_coins INT NOT NULL DEFAULT 0,
        total_fish_earned INT NOT NULL DEFAULT 0,
        high_score INT NOT NULL DEFAULT 0,
        unlocked_level TINYINT NOT NULL DEFAULT 1,
        last_played_level TINYINT NOT NULL DEFAULT 1,
        graphics_style VARCHAR(16) NOT NULL DEFAULT 'modern',
        home_backdrop_mode VARCHAR(16) NOT NULL DEFAULT 'auto',
        reduce_motion TINYINT(1) NOT NULL DEFAULT 1,
        show_speedrun_timer TINYINT(1) NOT NULL DEFAULT 0,
        muted TINYINT(1) NOT NULL DEFAULT 0,
        settings_json JSON NOT NULL,
        raw_save_json JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // 2. Per-Level Records, 3 Starlight Shards, Speedrun Best Time & Ranks, Time Trials
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`${db}\`.player_level_progress (
        player_id VARCHAR(64) NOT NULL,
        level_id TINYINT NOT NULL,
        best_score INT NOT NULL DEFAULT 0,
        best_stars TINYINT NOT NULL DEFAULT 0,
        shard_1 TINYINT(1) NOT NULL DEFAULT 0,
        shard_2 TINYINT(1) NOT NULL DEFAULT 0,
        shard_3 TINYINT(1) NOT NULL DEFAULT 0,
        best_time_ms INT NULL,
        speedrun_rank VARCHAR(4) NULL,
        claimed_rank_b TINYINT(1) NOT NULL DEFAULT 0,
        claimed_rank_a TINYINT(1) NOT NULL DEFAULT 0,
        claimed_rank_s TINYINT(1) NOT NULL DEFAULT 0,
        time_trial_best_ms INT NULL,
        time_trial_medal VARCHAR(16) NOT NULL DEFAULT 'none',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (player_id, level_id),
        INDEX idx_level_progress_rank (level_id, best_score)
      )
    `)

    // 3. Player Inventory (Unlocked Characters + Owned Scarves, Hats, Capes)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`${db}\`.player_inventory (
        player_id VARCHAR(64) NOT NULL,
        item_type VARCHAR(16) NOT NULL,
        item_id VARCHAR(48) NOT NULL,
        is_equipped TINYINT(1) NOT NULL DEFAULT 0,
        acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (player_id, item_type, item_id),
        INDEX idx_inventory_player_type (player_id, item_type)
      )
    `)

    // 4. Pixel Stamp Book Achievements
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`${db}\`.player_achievements (
        player_id VARCHAR(64) NOT NULL,
        achievement_id VARCHAR(48) NOT NULL,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (player_id, achievement_id)
      )
    `)

    // 5. Complete CRUD Activity Audit Logs (CREATE / READ / UPDATE / DELETE)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`${db}\`.crud_activity_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        player_id VARCHAR(64) NOT NULL,
        action_type VARCHAR(16) NOT NULL,
        entity_name VARCHAR(32) NOT NULL,
        summary VARCHAR(255) NOT NULL,
        metadata_json JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_crud_logs_player_time (player_id, created_at)
      )
    `)
  })().catch((err) => {
    schemaInitPromise = null
    throw err
  })

  return schemaInitPromise
}
