import type {
  ArenaBattleItemKind,
  ArenaBattleItemState,
  BossConfig,
  BossKind,
  PlayerState
} from './types'

export interface PlayerPulseShot {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  isSpread?: boolean
}

export interface BossProjectile {
  kind: 'feather' | 'eclipseOrb' | 'meteor' | 'astralSphere' | 'starWave' | 'gearDrone'
  x: number
  y: number
  vx: number
  vy: number
  r: number
  life: number
  deflectable: boolean
  deflected: boolean
  phase: number
}

export interface BossBeamHazard {
  y: number
  h: number
  timer: number
  maxWarn: number
  activeDuration: number
  state: 'warn' | 'fire'
}

export interface BossCallbacks {
  onDamagePlayer: (knockVx: number, knockVy: number) => void
  onAegisBlock: (x: number, y: number) => void
  onBossHit: (x: number, y: number, dmg: number, critical: boolean, deflected: boolean) => void
  onBossPhaseChange: (phase: 2 | 3) => void
  onBossDefeated: (x: number, y: number) => void
  onPlayBossSfx: (kind: 'cue' | 'beam' | 'swoop' | 'deflect' | 'hit' | 'phase' | 'defeat') => void
  onSpawnParticle: (x: number, y: number, color: string, count: number) => void
  onFloatingText: (x: number, y: number, text: string, color: string) => void
}

export class BossEncounterController {
  public readonly config: BossConfig
  public active = false
  public defeated = false
  public hp: number
  public maxHp: number
  public phase: 1 | 2 | 3 = 1

  public x: number
  public y: number
  public w = 36
  public h = 34
  public facing: 1 | -1 = -1
  public hurtFlash = 0
  public staggerTimer = 0
  public coreExposed = false
  public coreExposeTimer = 0

  // Umbra Owl state
  public windGustTimer = 0
  public windGustDir: 1 | -1 = -1
  public swoopState: 'idle' | 'warn' | 'dive' | 'rest' = 'idle'
  public swoopTimer = 0
  public swoopTargetX = 0
  public swoopTargetY = 0

  // Chronos Leviathan state
  public flankSide: 1 | -1 = 1
  public attackTimer = 1.6
  public secondaryTimer = 3.2
  public itemSpawnTimer = 9.0
  public animTime = 0

  public playerShots: PlayerPulseShot[] = []
  public bossProjectiles: BossProjectile[] = []
  public beams: BossBeamHazard[] = []
  public arenaItems: ArenaBattleItemState[] = []
  private nextItemId = 9500

  constructor(config: BossConfig, initialItems?: { x: number; y: number; kind: ArenaBattleItemKind }[]) {
    this.config = config
    this.hp = config.maxHp
    this.maxHp = config.maxHp
    this.x = config.spawnX
    this.y = config.spawnY
    this.arenaItems = (initialItems ?? []).map((it) => ({
      ...it,
      id: this.nextItemId++,
      collected: false,
      respawnTimer: 0,
      phase: Math.random() * Math.PI * 2
    }))
  }

  public get kind(): BossKind {
    return this.config.kind
  }

  public firePlayerPulse(px: number, py: number, facing: 1 | -1, spread: boolean): void {
    const speed = 228
    if (spread) {
      const angles = [-0.2, 0, 0.2]
      for (const a of angles) {
        this.playerShots.push({
          x: px,
          y: py,
          vx: Math.cos(a) * speed * facing,
          vy: Math.sin(a) * speed,
          life: 1.5,
          isSpread: true
        })
      }
    } else {
      this.playerShots.push({
        x: px,
        y: py,
        vx: speed * facing,
        vy: 0,
        life: 1.5
      })
    }
  }

  public update(
    dt: number,
    player: PlayerState,
    reduceMotion: boolean,
    cb: BossCallbacks
  ): { windPushX: number; collectedItem: ArenaBattleItemKind | null } {
    this.animTime += dt
    if (this.hurtFlash > 0) this.hurtFlash = Math.max(0, this.hurtFlash - dt)

    let collectedItem: ArenaBattleItemKind | null = null
    // Check arena battle item pickups (both approach items & spawned boss arena items)
    for (const item of this.arenaItems) {
      if (item.collected) continue
      const bobY = item.y + Math.sin(this.animTime * 3.4 + item.phase) * 2.5
      if (
        player.x < item.x + 14 &&
        player.x + player.w > item.x &&
        player.y < bobY + 14 &&
        player.y + player.h > bobY
      ) {
        item.collected = true
        collectedItem = item.kind
      }
    }

    // Activate boss encounter when player enters the arena
    if (!this.active && !this.defeated && player.x >= this.config.triggerX) {
      this.active = true
      this.attackTimer = 1.15
      this.secondaryTimer = 3.0
      cb.onPlayBossSfx('phase')
      cb.onFloatingText(
        this.x + this.w / 2,
        this.y - 8,
        `${this.config.name} MUNCUL!`,
        '#ffe475'
      )
    }

    // Update player Starlight Pulse projectiles even before boss triggers
    this.updatePlayerShots(dt, cb)

    if (!this.active || this.defeated) {
      return { windPushX: 0, collectedItem }
    }

    // Periodically spawn arena battle items during fight (capped at 2 active in arena)
    this.itemSpawnTimer -= dt
    if (this.itemSpawnTimer <= 0) {
      this.itemSpawnTimer = 10.5
      const activeArenaCount = this.arenaItems.filter(
        (it) => !it.collected && it.x >= this.config.arenaMinX
      ).length
      if (activeArenaCount < 2 && this.config.arenaItemSpots.length > 0) {
        const spot =
          this.config.arenaItemSpots[Math.floor(Math.random() * this.config.arenaItemSpots.length)]!
        const pool: ArenaBattleItemKind[] =
          player.hearts <= 1
            ? ['starBerry', 'starBerry', 'cometCharge', 'moonlightFeather']
            : ['starBerry', 'cometCharge', 'moonlightFeather']
        const kind = pool[Math.floor(Math.random() * pool.length)]!
        this.arenaItems.push({
          id: this.nextItemId++,
          x: spot.x,
          y: spot.y,
          kind,
          collected: false,
          respawnTimer: 0,
          phase: Math.random() * Math.PI * 2
        })
        cb.onSpawnParticle(spot.x + 6, spot.y + 6, '#ffe885', reduceMotion ? 4 : 8)
      }
    }

    // Check phase transitions (Phase 2 <= 66%, Phase 3 <= 33%)
    const hpRatio = this.hp / Math.max(1, this.maxHp)
    const desiredPhase: 1 | 2 | 3 = hpRatio <= 0.34 ? 3 : hpRatio <= 0.67 ? 2 : 1
    if (desiredPhase > this.phase && (desiredPhase === 2 || desiredPhase === 3)) {
      this.phase = desiredPhase
      this.staggerTimer = 0.55
      cb.onBossPhaseChange(desiredPhase)
      cb.onPlayBossSfx('phase')
      cb.onSpawnParticle(this.x + this.w / 2, this.y + this.h / 2, '#ff8cb8', reduceMotion ? 8 : 16)
      cb.onFloatingText(
        this.x + this.w / 2,
        this.y - 10,
        `FASE ${desiredPhase}!`,
        '#ff88b2'
      )
    }

    if (this.staggerTimer > 0) {
      this.staggerTimer = Math.max(0, this.staggerTimer - dt)
    }

    let windPushX = 0
    if (this.config.kind === 'umbra-owl') {
      windPushX = this.updateUmbraOwl(dt, player, cb)
    } else {
      this.updateChronosLeviathan(dt, player, cb)
    }

    this.updateBossProjectiles(dt, player, cb)
    this.updateBeams(dt, player, cb)

    // Direct contact damage with boss body (unless player has Astral Aegis or invincibility)
    if (
      player.invincibleTimer <= 0 &&
      player.x < this.x + this.w - 4 &&
      player.x + player.w > this.x + 4 &&
      player.y < this.y + this.h - 4 &&
      player.y + player.h > this.y + 4
    ) {
      if (player.astralAegisTimer > 0) {
        cb.onAegisBlock(player.x + player.w / 2, player.y + player.h / 2)
      } else {
        const knockDir = player.x + player.w / 2 < this.x + this.w / 2 ? -1 : 1
        cb.onDamagePlayer(knockDir * 105, -140)
      }
    }

    return { windPushX, collectedItem }
  }

  private updateUmbraOwl(dt: number, player: PlayerState, cb: BossCallbacks): number {
    const midX = (this.config.arenaMinX + this.config.arenaMaxX) * 0.5
    const halfSpan = (this.config.arenaMaxX - this.config.arenaMinX) * 0.34
    const pCx = player.x + player.w / 2
    const pCy = player.y + player.h / 2
    this.facing = pCx < this.x + this.w / 2 ? -1 : 1

    let windPushX = 0
    if (this.windGustTimer > 0) {
      this.windGustTimer = Math.max(0, this.windGustTimer - dt)
      // Horizontal wind gust across lower floor (y > 122), encouraging upper shifting platforms!
      if (player.y + player.h > 126) {
        windPushX = this.windGustDir * 68
      }
    }

    if (this.staggerTimer > 0) {
      return windPushX
    }

    if (this.swoopState === 'warn') {
      this.swoopTimer -= dt
      if (this.swoopTimer <= 0) {
        this.swoopState = 'dive'
        this.swoopTimer = 0.88
        this.swoopTargetX = Math.max(
          this.config.arenaMinX + 20,
          Math.min(this.config.arenaMaxX - this.w - 20, pCx - this.w / 2)
        )
        this.swoopTargetY = 128
        cb.onPlayBossSfx('swoop')
      }
      return windPushX
    }

    if (this.swoopState === 'dive') {
      this.swoopTimer -= dt
      this.x += (this.swoopTargetX - this.x) * Math.min(1, dt * 4.8)
      this.y += (this.swoopTargetY - this.y) * Math.min(1, dt * 5.2)
      if (this.swoopTimer <= 0) {
        this.swoopState = 'rest'
        this.swoopTimer = 1.25
        cb.onFloatingText(this.x + this.w / 2, this.y - 8, 'SERANG!', '#ffe475')
      }
      return windPushX
    }

    if (this.swoopState === 'rest') {
      this.swoopTimer -= dt
      if (this.swoopTimer <= 0) {
        this.swoopState = 'idle'
      }
      return windPushX
    }

    // Normal hovering sweep across upper arena
    const sweepSpeed = this.phase === 3 ? 1.55 : this.phase === 2 ? 1.25 : 1.0
    const targetX = midX - this.w / 2 + Math.sin(this.animTime * sweepSpeed) * halfSpan
    const targetY = 36 + Math.sin(this.animTime * 2.3) * 11
    this.x += (targetX - this.x) * Math.min(1, dt * 4.2)
    this.y += (targetY - this.y) * Math.min(1, dt * 4.2)

    this.attackTimer -= dt
    if (this.attackTimer <= 0) {
      this.attackTimer = this.phase === 3 ? 1.45 : this.phase === 2 ? 1.8 : 2.1
      const cx = this.x + this.w / 2
      const cy = this.y + this.h - 4
      const baseAngle = Math.atan2(pCy - cy, pCx - cx)
      const count = this.phase === 3 ? 5 : 3
      const spread = this.phase === 3 ? 0.24 : 0.3
      const half = (count - 1) / 2
      for (let i = 0; i < count; i++) {
        const ang = baseAngle + (i - half) * spread
        const spd = this.phase === 3 ? 116 : 98
        this.bossProjectiles.push({
          kind: 'feather',
          x: cx,
          y: cy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          r: 4,
          life: 3.4,
          deflectable: false,
          deflected: false,
          phase: i
        })
      }
      cb.onPlayBossSfx('cue')
    }

    this.secondaryTimer -= dt
    if (this.secondaryTimer <= 0 && this.phase >= 2) {
      if (this.phase === 2) {
        this.secondaryTimer = 3.8
        // Alternate wind gust & deflectable golden Eclipse Orb!
        if (Math.random() < 0.48) {
          this.windGustTimer = 2.6
          this.windGustDir = Math.random() > 0.5 ? 1 : -1
          cb.onFloatingText(midX, 136, '🌪️ ANGIN GERHANA! NAIK!', '#ffb8d4')
          cb.onPlayBossSfx('swoop')
        } else {
          this.spawnDeflectableOrb('eclipseOrb', pCx, pCy, cb)
        }
      } else {
        // Phase 3: alternate telegraphed dive-swoop & golden Eclipse Orb
        this.secondaryTimer = 4.2
        if (Math.random() < 0.52) {
          this.swoopState = 'warn'
          this.swoopTimer = 0.65
          cb.onFloatingText(this.x + this.w / 2, this.y - 10, '⚠️ TUKIKAN!', '#ff6e91')
          cb.onPlayBossSfx('cue')
        } else {
          this.spawnDeflectableOrb('eclipseOrb', pCx, pCy, cb)
        }
      }
    }

    return windPushX
  }

  private updateChronosLeviathan(dt: number, player: PlayerState, cb: BossCallbacks): void {
    const midX = (this.config.arenaMinX + this.config.arenaMaxX) * 0.5
    const pCx = player.x + player.w / 2
    const pCy = player.y + player.h / 2
    this.facing = pCx < this.x + this.w / 2 ? -1 : 1

    if (this.coreExposeTimer > 0) {
      this.coreExposeTimer = Math.max(0, this.coreExposeTimer - dt)
      this.coreExposed = this.coreExposeTimer > 0
    } else {
      this.coreExposed = false
    }

    if (this.staggerTimer > 0) return

    // Hovering position: Phase 1 center-high, Phase 2 alternating flanks, Phase 3 center overdrive
    const desiredX =
      this.phase === 2
        ? midX - this.w / 2 + this.flankSide * 138
        : midX - this.w / 2 + Math.sin(this.animTime * 0.95) * 96
    const desiredY = this.coreExposed ? 78 : 42 + Math.sin(this.animTime * 1.9) * 10
    this.x += (desiredX - this.x) * Math.min(1, dt * 3.1)
    this.y += (desiredY - this.y) * Math.min(1, dt * 3.5)

    this.attackTimer -= dt
    if (this.attackTimer <= 0) {
      if (this.phase === 1) {
        this.attackTimer = 2.4
        // Telegraphed horizontal star-beam across floor tier + 2 crystalline meteor drops
        const tierY = Math.random() > 0.5 ? 150 : 104
        this.beams.push({
          y: tierY,
          h: 14,
          timer: 0,
          maxWarn: 0.9,
          activeDuration: 0.6,
          state: 'warn'
        })
        cb.onPlayBossSfx('cue')
        for (let i = 0; i < 2; i++) {
          const mx =
            this.config.arenaMinX + 36 + Math.random() * (this.config.arenaMaxX - this.config.arenaMinX - 72)
          this.bossProjectiles.push({
            kind: 'meteor',
            x: mx,
            y: -6 - i * 18,
            vx: (Math.random() - 0.5) * 18,
            vy: 86 + Math.random() * 24,
            r: 5,
            life: 3.2,
            deflectable: false,
            deflected: false,
            phase: i
          })
        }
      } else if (this.phase === 2) {
        this.attackTimer = 2.5
        this.flankSide = this.flankSide === 1 ? -1 : 1
        // Orbiting gear drones + deflectable Astral Sphere
        for (let i = 0; i < 2; i++) {
          this.bossProjectiles.push({
            kind: 'gearDrone',
            x: this.x + this.w / 2,
            y: this.y + this.h / 2 + (i === 0 ? -12 : 12),
            vx: -this.flankSide * 86,
            vy: (i === 0 ? -1 : 1) * 18,
            r: 5,
            life: 3.6,
            deflectable: false,
            deflected: false,
            phase: i * 1.5
          })
        }
        this.spawnDeflectableOrb('astralSphere', pCx, pCy, cb)
      } else {
        // Phase 3 Overdrive: rhythmic star-wave pulses + periodic Core Expose!
        this.attackTimer = 2.15
        const cx = this.x + this.w / 2
        const cy = this.y + this.h / 2
        for (let i = 0; i < 6; i++) {
          const ang = (Math.PI * 2 * i) / 6 + this.animTime * 0.4
          this.bossProjectiles.push({
            kind: 'starWave',
            x: cx,
            y: cy,
            vx: Math.cos(ang) * 92,
            vy: Math.sin(ang) * 92,
            r: 4,
            life: 3.2,
            deflectable: false,
            deflected: false,
            phase: i
          })
        }
        cb.onPlayBossSfx('cue')
      }
    }

    this.secondaryTimer -= dt
    if (this.secondaryTimer <= 0) {
      if (this.phase === 3) {
        this.secondaryTimer = 5.4
        this.coreExposeTimer = 3.2
        this.coreExposed = true
        cb.onFloatingText(this.x + this.w / 2, this.y - 10, '✦ CORE EXPOSE! 2X DMG!', '#ffe875')
        cb.onPlayBossSfx('phase')
      } else if (this.phase === 2) {
        this.secondaryTimer = 4.0
        this.beams.push({
          y: 148,
          h: 14,
          timer: 0,
          maxWarn: 0.9,
          activeDuration: 0.55,
          state: 'warn'
        })
        cb.onPlayBossSfx('cue')
      } else {
        this.secondaryTimer = 3.8
        this.spawnDeflectableOrb('astralSphere', pCx, pCy, cb)
      }
    }
  }

  private spawnDeflectableOrb(
    kind: 'eclipseOrb' | 'astralSphere',
    targetX: number,
    targetY: number,
    cb: BossCallbacks
  ): void {
    const cx = this.x + this.w / 2
    const cy = this.y + this.h / 2
    const ang = Math.atan2(targetY - cy, targetX - cx)
    const spd = 84
    this.bossProjectiles.push({
      kind,
      x: cx,
      y: cy,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      r: 7,
      life: 4.5,
      deflectable: true,
      deflected: false,
      phase: 0
    })
    cb.onFloatingText(cx, cy - 10, '✦ PANTULKAN BOLA EMAS!', '#ffe675')
    cb.onPlayBossSfx('cue')
  }

  private updatePlayerShots(dt: number, cb: BossCallbacks): void {
    for (let i = this.playerShots.length - 1; i >= 0; i--) {
      const s = this.playerShots[i]!
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.life -= dt

      let consumed = false
      // Check deflection against golden boss orbs!
      for (const bp of this.bossProjectiles) {
        if (!bp.deflectable || bp.deflected) continue
        const dx = bp.x - s.x
        const dy = bp.y - s.y
        if (dx * dx + dy * dy <= (bp.r + 8) * (bp.r + 8)) {
          bp.deflected = true
          const bx = this.x + this.w / 2
          const by = this.y + this.h / 2
          const ang = Math.atan2(by - bp.y, bx - bp.x)
          bp.vx = Math.cos(ang) * 210
          bp.vy = Math.sin(ang) * 210
          bp.life = 2.4
          consumed = true
          cb.onPlayBossSfx('deflect')
          cb.onSpawnParticle(bp.x, bp.y, '#ffe875', 10)
          cb.onFloatingText(bp.x, bp.y - 8, 'PANTUL! ✦', '#fff29e')
          break
        }
      }

      // Check direct hit against active Boss
      if (
        !consumed &&
        this.active &&
        !this.defeated &&
        s.x >= this.x - 4 &&
        s.x <= this.x + this.w + 4 &&
        s.y >= this.y - 4 &&
        s.y <= this.y + this.h + 4
      ) {
        consumed = true
        const isCrit = this.coreExposed
        const dmg = isCrit ? 2 : 1
        this.damageBoss(dmg, s.x, s.y, isCrit, false, cb)
      }

      if (consumed || s.life <= 0 || s.x < 0 || s.x > this.config.arenaMaxX + 120) {
        this.playerShots.splice(i, 1)
      }
    }
  }

  private updateBossProjectiles(dt: number, player: PlayerState, cb: BossCallbacks): void {
    const pCx = player.x + player.w / 2
    const pCy = player.y + player.h / 2

    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const bp = this.bossProjectiles[i]!
      bp.life -= dt
      if (bp.kind === 'gearDrone' && !bp.deflected) {
        bp.vy = Math.sin(this.animTime * 4.5 + bp.phase) * 44
      }
      bp.x += bp.vx * dt
      bp.y += bp.vy * dt

      if (bp.deflected) {
        // Deflected golden orb flies back into the boss for +3 bonus stun damage!
        const bx = this.x + this.w / 2
        const by = this.y + this.h / 2
        const dx = bp.x - bx
        const dy = bp.y - by
        if (dx * dx + dy * dy <= 24 * 24) {
          this.staggerTimer = Math.max(this.staggerTimer, 1.35)
          this.damageBoss(3, bp.x, bp.y, true, true, cb)
          this.bossProjectiles.splice(i, 1)
          continue
        }
      } else {
        // Check collision with player
        const dx = bp.x - pCx
        const dy = bp.y - pCy
        const hitR = bp.r + 6
        if (dx * dx + dy * dy <= hitR * hitR) {
          if (player.astralAegisTimer > 0) {
            // Astral Aegis blocks projectile and restores Starlight Pulse cooldown!
            if (bp.deflectable) {
              bp.deflected = true
              const ang = Math.atan2(this.y + this.h / 2 - bp.y, this.x + this.w / 2 - bp.x)
              bp.vx = Math.cos(ang) * 210
              bp.vy = Math.sin(ang) * 210
              bp.life = 2.4
            } else {
              this.bossProjectiles.splice(i, 1)
            }
            cb.onAegisBlock(bp.x, bp.y)
            continue
          } else if (player.invincibleTimer <= 0) {
            const knockDir = bp.vx >= 0 ? 1 : -1
            cb.onDamagePlayer(knockDir * 90, -135)
            this.bossProjectiles.splice(i, 1)
            continue
          }
        }
      }

      if (
        bp.life <= 0 ||
        bp.x < this.config.arenaMinX - 48 ||
        bp.x > this.config.arenaMaxX + 48 ||
        bp.y > 236
      ) {
        this.bossProjectiles.splice(i, 1)
      }
    }
  }

  private updateBeams(dt: number, player: PlayerState, cb: BossCallbacks): void {
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const bm = this.beams[i]!
      bm.timer += dt
      if (bm.state === 'warn' && bm.timer >= bm.maxWarn) {
        bm.state = 'fire'
        bm.timer = 0
        cb.onPlayBossSfx('beam')
      } else if (bm.state === 'fire') {
        if (
          player.y + player.h > bm.y &&
          player.y < bm.y + bm.h
        ) {
          if (player.astralAegisTimer > 0) {
            cb.onAegisBlock(player.x + player.w / 2, bm.y + bm.h / 2)
          } else if (player.invincibleTimer <= 0) {
            cb.onDamagePlayer(player.facing * -80, -135)
          }
        }
        if (bm.timer >= bm.activeDuration) {
          this.beams.splice(i, 1)
        }
      }
    }
  }

  private damageBoss(
    dmg: number,
    hx: number,
    hy: number,
    critical: boolean,
    deflected: boolean,
    cb: BossCallbacks
  ): void {
    if (this.defeated) return
    this.hp = Math.max(0, this.hp - dmg)
    this.hurtFlash = 0.2
    cb.onBossHit(hx, hy, dmg, critical, deflected)
    cb.onPlayBossSfx(deflected ? 'deflect' : 'hit')
    if (this.hp <= 0) {
      this.defeated = true
      this.active = false
      this.bossProjectiles = []
      this.beams = []
      this.windGustTimer = 0
      cb.onPlayBossSfx('defeat')
      cb.onBossDefeated(this.x + this.w / 2, this.y + this.h / 2)
    }
  }

  public render(ctx: CanvasRenderingContext2D, reduceMotion: boolean): void {
    // 1. Render Arena Battle Items
    for (const item of this.arenaItems) {
      if (item.collected) continue
      const ix = Math.round(item.x)
      const iy = Math.round(item.y + (reduceMotion ? 0 : Math.sin(this.animTime * 3.4 + item.phase) * 2))
      ctx.fillStyle = 'rgba(18, 9, 36, 0.72)'
      ctx.fillRect(ix - 1, iy - 1, 14, 14)
      if (item.kind === 'starBerry') {
        ctx.fillStyle = '#ff5e8f'
        ctx.fillRect(ix + 2, iy + 3, 8, 7)
        ctx.fillStyle = '#ffb8d2'
        ctx.fillRect(ix + 3, iy + 4, 3, 2)
        ctx.fillStyle = '#6cf2b4'
        ctx.fillRect(ix + 4, iy + 1, 4, 2)
      } else if (item.kind === 'cometCharge') {
        ctx.fillStyle = '#ffe266'
        ctx.fillRect(ix + 3, iy + 2, 6, 8)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(ix + 5, iy + 4, 2, 4)
        ctx.fillStyle = '#ff9654'
        ctx.fillRect(ix + 1, iy + 5, 2, 2)
      } else {
        ctx.fillStyle = '#9ee8ff'
        ctx.fillRect(ix + 3, iy + 1, 6, 10)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(ix + 5, iy + 2, 2, 6)
        ctx.fillStyle = '#d9b5ff'
        ctx.fillRect(ix + 2, iy + 6, 2, 3)
      }
    }

    // 2. Render Horizontal Wind Gust visual (Umbra Owl Phase 2)
    if (this.windGustTimer > 0 && !reduceMotion) {
      ctx.fillStyle = 'rgba(255, 168, 206, 0.22)'
      for (let i = 0; i < 6; i++) {
        const wy = 130 + i * 6
        const wx =
          this.config.arenaMinX +
          (((this.animTime * 190 * this.windGustDir + i * 68) % 420) + 420) % 420
        ctx.fillRect(Math.round(wx), wy, 28, 2)
      }
    }

    // 3. Render Star Beams (Chronos Leviathan)
    for (const bm of this.beams) {
      const x0 = this.config.arenaMinX
      const bw = this.config.arenaMaxX - this.config.arenaMinX
      if (bm.state === 'warn') {
        const blink = Math.floor(this.animTime * 14) % 2 === 0
        ctx.fillStyle = blink ? 'rgba(255, 224, 102, 0.45)' : 'rgba(255, 104, 152, 0.25)'
        ctx.fillRect(x0, bm.y + 5, bw, 4)
      } else {
        ctx.fillStyle = 'rgba(130, 226, 255, 0.6)'
        ctx.fillRect(x0, bm.y, bw, bm.h)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(x0, bm.y + 4, bw, bm.h - 8)
      }
    }

    // 4. Render Boss Sprite (crisp pixel art!)
    if (!this.defeated) {
      const bx = Math.round(this.x)
      const by = Math.round(this.y)
      const flash = this.hurtFlash > 0 && Math.floor(this.animTime * 30) % 2 === 0

      if (this.config.kind === 'umbra-owl') {
        const wingFlap = reduceMotion ? 0 : Math.round(Math.sin(this.animTime * 9) * 3)
        // Crimson lunar eclipse aura
        ctx.fillStyle = 'rgba(255, 76, 122, 0.22)'
        ctx.fillRect(bx - 4, by - 4, this.w + 8, this.h + 8)
        // Spread dark wings
        ctx.fillStyle = flash ? '#ffffff' : '#2d1138'
        ctx.fillRect(bx - 12, by + 8 + wingFlap, 14, 12)
        ctx.fillRect(bx + this.w - 2, by + 8 - wingFlap, 14, 12)
        ctx.fillStyle = flash ? '#ffe8f0' : '#ff4f79'
        ctx.fillRect(bx - 10, by + 17 + wingFlap, 10, 3)
        ctx.fillRect(bx + this.w, by + 17 - wingFlap, 10, 3)
        // Main Owl Body
        ctx.fillStyle = flash ? '#ffffff' : '#3d194d'
        ctx.fillRect(bx + 4, by + 4, this.w - 8, this.h - 6)
        // Ear tufts
        ctx.fillStyle = '#ff6e91'
        ctx.fillRect(bx + 5, by, 5, 5)
        ctx.fillRect(bx + this.w - 10, by, 5, 5)
        // Golden Eclipse Crescent Crest
        ctx.fillStyle = '#ffe066'
        ctx.fillRect(bx + 14, by + 3, 8, 3)
        // Piercing glowing eyes + beak
        ctx.fillStyle = '#ffe475'
        ctx.fillRect(bx + 10, by + 11, 5, 4)
        ctx.fillRect(bx + 21, by + 11, 5, 4)
        ctx.fillStyle = '#ff3b6b'
        ctx.fillRect(bx + 12, by + 12, 2, 2)
        ctx.fillRect(bx + 23, by + 12, 2, 2)
        ctx.fillStyle = '#ffb84d'
        ctx.fillRect(bx + 16, by + 16, 4, 4)
      } else {
        // Chronos Leviathan: Cosmic Starlight Automaton!
        ctx.fillStyle = this.coreExposed ? 'rgba(255, 232, 117, 0.34)' : 'rgba(130, 112, 255, 0.24)'
        ctx.fillRect(bx - 6, by - 6, this.w + 12, this.h + 12)
        // Orbiting brass star-ring segments
        const ringOff = reduceMotion ? 0 : Math.round(Math.sin(this.animTime * 4) * 4)
        ctx.fillStyle = '#e0ae48'
        ctx.fillRect(bx - 10, by + 12 + ringOff, 8, 10)
        ctx.fillRect(bx + this.w + 2, by + 12 - ringOff, 8, 10)
        // Automaton chassis
        ctx.fillStyle = flash ? '#ffffff' : '#2b2466'
        ctx.fillRect(bx + 2, by + 2, this.w - 4, this.h - 4)
        ctx.fillStyle = flash ? '#ffffff' : '#d9a441'
        ctx.fillRect(bx + 2, by + 2, this.w - 4, 3)
        ctx.fillRect(bx + 2, by + this.h - 5, this.w - 4, 3)
        // Crown sensors
        ctx.fillStyle = '#8ef0ff'
        ctx.fillRect(bx + 9, by + 9, 6, 4)
        ctx.fillRect(bx + 21, by + 9, 6, 4)
        // Chest Core (glows bright gold/white during Core Expose!)
        ctx.fillStyle = this.coreExposed ? '#ffffff' : '#6c5ce7'
        ctx.fillRect(bx + 12, by + 17, 12, 10)
        ctx.fillStyle = this.coreExposed ? '#ffe466' : '#a8efff'
        ctx.fillRect(bx + 14, by + 19, 8, 6)
      }
    }

    // 5. Render Player Starlight Pulse Shots
    for (const s of this.playerShots) {
      const sx = Math.round(s.x)
      const sy = Math.round(s.y)
      ctx.fillStyle = s.isSpread ? '#ff9ed2' : '#7ee8ff'
      ctx.fillRect(sx - 5, sy - 3, 10, 6)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(sx - 3, sy - 1, 6, 2)
    }

    // 6. Render Boss Projectiles
    for (const bp of this.bossProjectiles) {
      const px = Math.round(bp.x)
      const py = Math.round(bp.y)
      if (bp.deflectable) {
        ctx.fillStyle = bp.deflected ? '#8ef5ff' : '#ffd447'
        ctx.fillRect(px - 6, py - 6, 12, 12)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(px - 3, py - 3, 6, 6)
      } else if (bp.kind === 'feather') {
        ctx.fillStyle = '#381242'
        ctx.fillRect(px - 4, py - 3, 8, 6)
        ctx.fillStyle = '#ff5e8c'
        ctx.fillRect(px - 2, py - 1, 4, 2)
      } else if (bp.kind === 'meteor') {
        ctx.fillStyle = '#997aff'
        ctx.fillRect(px - 4, py - 5, 8, 10)
        ctx.fillStyle = '#e0f7ff'
        ctx.fillRect(px - 2, py - 3, 4, 5)
      } else if (bp.kind === 'gearDrone') {
        ctx.fillStyle = '#d9a441'
        ctx.fillRect(px - 5, py - 5, 10, 10)
        ctx.fillStyle = '#1b1d45'
        ctx.fillRect(px - 2, py - 2, 4, 4)
      } else {
        ctx.fillStyle = '#ff94d2'
        ctx.fillRect(px - 4, py - 4, 8, 8)
        ctx.fillStyle = '#fff5cc'
        ctx.fillRect(px - 2, py - 2, 4, 4)
      }
    }
  }
}
