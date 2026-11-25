import type {
  CollectibleDef,
  LevelDefinition,
  MovingPlatformDef,
  PlatformStyle,
  StaticPlatform
} from './types'

/**
 * Extends base Levels 1–8 by ~1.5x (+1260px to +1440px) with bespoke biome-specific
 * mid-to-late platforming segments, vertical high-routes, and mid-level Star Lantern checkpoints.
 * Preserves 100% of original Act 1–3 layouts & Shards while shifting the final portal platform cleanly.
 */
export function extendBaseLevel(base: LevelDefinition): LevelDefinition {
  // Find the rightmost platform (the portal landing platform) and shift it right cleanly
  const portalPlatIdx = base.platforms.reduce(
    (bestIdx, plat, idx, arr) => (plat.x > arr[bestIdx]!.x ? idx : bestIdx),
    0
  )
  const portalPlat = base.platforms[portalPlatIdx]!
  const insertStartX = portalPlat.x
  const extDelta = base.id <= 2 ? 1280 : base.id <= 4 ? 1320 : base.id <= 6 ? 1380 : 1440

  const style: PlatformStyle =
    base.biome === 'rooftops'
      ? 'brick'
      : base.biome === 'sakura'
        ? 'sakura'
        : base.biome === 'cloudland'
          ? 'cloud'
          : 'harbor'

  const altStyle: PlatformStyle = base.biome === 'rooftops' ? 'wood' : style

  // Clone and shift the final portal platform, portal, and NPC (plus any collectibles/lanterns on that final platform)
  const platforms: StaticPlatform[] = base.platforms.map((p, idx) =>
    idx === portalPlatIdx ? { ...p, x: p.x + extDelta } : { ...p }
  )

  const collectibles: CollectibleDef[] = base.collectibles.map((c) =>
    c.x >= insertStartX - 8 ? { ...c, x: c.x + extDelta } : { ...c }
  )

  const lanterns = base.lanterns.map((l) =>
    l.x >= insertStartX - 8 ? { ...l, x: l.x + extDelta } : { ...l }
  )

  const powerUps = base.powerUps.map((p) =>
    p.x >= insertStartX - 8 ? { ...p, x: p.x + extDelta } : { ...p }
  )

  const movingPlatforms: MovingPlatformDef[] = [...base.movingPlatforms]
  const bounceClouds = [...base.bounceClouds]
  const updrafts = [...(base.updrafts ?? [])]
  const fragileBranches = [...(base.fragileBranches ?? [])]
  const windVortices = [...(base.windVortices ?? [])]
  const phasingClouds = [...(base.phasingClouds ?? [])]
  const swingingPerches = [...(base.swingingPerches ?? [])]
  const floatingBoats = [...(base.floatingBoats ?? [])]
  const powerWires = [...(base.powerWires ?? [])]
  const crows = [...base.crows]
  const hedgehogs = [...(base.hedgehogs ?? [])]
  const crabs = [...(base.crabs ?? [])]
  const wisps = [...(base.wisps ?? [])]

  // Build rich biome-tailored Act 3.5 segment spanning [insertStartX .. insertStartX + extDelta - 40]
  const sx = insertStartX
  const segPlatforms: StaticPlatform[] = [
    { x: sx, y: 152, w: 144, h: 80, style },
    { x: sx + 208, y: 142, w: 136, h: 90, style: altStyle },
    { x: sx + 236, y: 88, w: 80, h: 14, style: altStyle }, // High bonus ledge
    { x: sx + 412, y: 156, w: 152, h: 76, style },
    { x: sx + 640, y: 138, w: 148, h: 94, style: altStyle },
    { x: sx + 860, y: 148, w: 152, h: 84, style },
    { x: sx + 896, y: 90, w: 80, h: 14, style: altStyle }, // High bonus ledge 2
    { x: sx + 1084, y: 144, w: Math.max(128, extDelta - 1140), h: 88, style }
  ]
  platforms.push(...segPlatforms)

  // Add biome-signature mechanics into the extended segment AND early/mid game!
  if (base.biome === 'rooftops') {
    // Biome 1 signature: Updraft Chimney Vents!
    updrafts.push(
      { x: 604, y: 66, w: 34, h: 108, liftVy: -158 },
      { x: sx + 158, y: 62, w: 36, h: 112, liftVy: -164 },
      { x: sx + 576, y: 62, w: 38, h: 112, liftVy: -168 },
      { x: sx + 802, y: 60, w: 36, h: 114, liftVy: -166 }
    )
    powerWires.push({ x: sx + 344, y: 150, w: 68 })
    crows.push(
      { x: sx + 492, y: 102, rangeX: 52, speed: 1.55, waveAmp: 3, phase: 0.4 },
      { x: sx + 972, y: 98, rangeX: 56, speed: 1.65, waveAmp: 4, phase: 1.3 }
    )
  } else if (base.biome === 'sakura') {
    // Biome 2 signature: Sakura Leaf Platforms (2.5s respawn) + Petal Breeze!
    fragileBranches.push(
      { x: sx + 152, y: 146, w: 48 },
      { x: sx + 576, y: 144, w: 50 },
      { x: sx + 800, y: 142, w: 48 }
    )
    windVortices.push(
      { x: sx + 432, y: 78, w: 96, h: 78, pushX: -32 },
      { x: sx + 880, y: 78, w: 96, h: 72, pushX: 30 }
    )
    hedgehogs.push(
      { x: sx + 454, y: 146, minX: sx + 424, maxX: sx + 544, speed: 34 },
      { x: sx + 912, y: 138, minX: sx + 872, maxX: sx + 992, speed: 38 }
    )
  } else if (base.biome === 'cloudland') {
    // Biome 3 signature: Bouncy Clouds + Phasing Star Clouds!
    bounceClouds.push(
      { x: sx + 224, y: 132, w: 28 },
      { x: sx + 872, y: 138, w: 28 }
    )
    phasingClouds.push(
      { x: 540, y: 126, w: 44, period: 3.6, offset: 0 },
      { x: sx + 150, y: 144, w: 48, period: 3.4, offset: 0 },
      { x: sx + 572, y: 142, w: 52, period: 3.4, offset: 1.1 },
      { x: sx + 798, y: 138, w: 48, period: 3.2, offset: 0.6 },
      { x: sx + 1024, y: 140, w: 48, period: 3.2, offset: 1.8 }
    )
    crows.push({ x: sx + 716, y: 92, rangeX: 56, speed: 1.7, waveAmp: 4, phase: 0.9 })
  } else {
    // Biome 4 signature: Swinging Lantern Perches + Harbor Rafts!
    swingingPerches.push(
      { anchorX: 676, anchorY: 42, ropeLen: 82, w: 42, ampAngle: 0.36, speed: 1.45, phase: 0 },
      { anchorX: sx + 178, anchorY: 38, ropeLen: 86, w: 44, ampAngle: 0.4, speed: 1.5, phase: 0.3 },
      { anchorX: sx + 602, anchorY: 38, ropeLen: 84, w: 44, ampAngle: 0.42, speed: 1.55, phase: 1.2 },
      { anchorX: sx + 1046, anchorY: 38, ropeLen: 84, w: 44, ampAngle: 0.38, speed: 1.6, phase: 2.1 }
    )
    floatingBoats.push({ x: sx + 788, y: 162, w: 54, dx: 52, speed: 1.45, phase: 0.6 })
    crabs.push(
      { x: sx + 458, y: 146, minX: sx + 422, maxX: sx + 544, speed: 54 },
      { x: sx + 1126, y: 134, minX: sx + 1094, maxX: sx + 1200, speed: 58 }
    )
    wisps.push({ x: sx + 374, y: 112, ampY: 22, speed: 2.1, phase: 0.5 })
  }

  // Smooth connector platform into the shifted final portal platform
  movingPlatforms.push({
    x: sx + extDelta - 84,
    y: 142,
    w: 44,
    h: 10,
    dx: 48,
    dy: -8,
    speed: 1.55,
    phase: 0.5
  })

  // Extended segment collectibles, power-ups & lanterns
  collectibles.push(
    { x: sx + 56, y: 128, kind: 'star' },
    { x: sx + 172, y: 108, kind: 'star' },
    { x: sx + 272, y: 66, kind: 'fish' },
    { x: sx + 368, y: 118, kind: 'star' },
    { x: sx + 486, y: 132, kind: 'star' },
    { x: sx + 596, y: 104, kind: 'star' },
    { x: sx + 712, y: 114, kind: 'star' },
    { x: sx + 818, y: 112, kind: 'star' },
    { x: sx + 932, y: 68, kind: 'fish' },
    { x: sx + 1044, y: 110, kind: 'star' },
    { x: sx + 1148, y: 120, kind: 'star' }
  )

  const biomeExclusive =
    base.biome === 'rooftops'
      ? 'yarn'
      : base.biome === 'sakura'
        ? 'mochi'
        : base.biome === 'cloudland'
          ? 'candy'
          : 'pearl'

  powerUps.push(
    { x: sx + 74, y: 128, kind: biomeExclusive },
    { x: sx + 272, y: 118, kind: 'bubble' },
    { x: sx + 444, y: 132, kind: base.biome === 'rooftops' ? 'feather' : 'bell' },
    { x: sx + 686, y: 114, kind: biomeExclusive },
    { x: sx + 914, y: 124, kind: 'milk' }
  )

  lanterns.push(
    { x: sx + 22, y: 132, mount: 'post' },
    { x: sx + 428, y: 136, mount: 'post' },
    { x: sx + 662, y: 118, mount: 'post' },
    { x: sx + 876, y: 128, mount: 'post' },
    { x: sx + 1102, y: 124, mount: 'post' }
  )

  // Ensure a reliable Star Lantern checkpoint near the halfway mark + late Act 3.5 checkpoint!
  const midCp = { x: sx + 680, y: 114 }
  const existingCps = base.checkpoints ? [...base.checkpoints] : [base.checkpoint]
  const checkpoints = [...existingCps, midCp]

  return {
    ...base,
    width: base.width + extDelta,
    portal: { x: base.portal.x + extDelta, y: base.portal.y },
    npc: { ...base.npc, x: base.npc.x + extDelta },
    platforms,
    movingPlatforms,
    bounceClouds,
    powerWires,
    fragileBranches,
    windVortices,
    floatingBoats,
    updrafts,
    phasingClouds,
    swingingPerches,
    crows,
    hedgehogs,
    crabs,
    wisps,
    checkpoints,
    collectibles,
    powerUps,
    lanterns
  }
}
