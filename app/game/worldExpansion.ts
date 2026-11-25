import type {
  CollectibleDef,
  GearPlatformDef,
  GlowMushroomDef,
  LanternDef,
  LevelDefinition,
  LowGravityZoneDef,
  MovingPlatformDef,
  PowerUpDef,
  ProximityCrystalDef,
  SecretAlcoveDef,
  ShardDef,
  StaticPlatform,
  WispDef
} from './types'

const SKY_CAVERN: [string, string, string, string, string] = [
  '#06101f',
  '#0b1b33',
  '#12294a',
  '#1b3a61',
  '#254d75'
]

const SKY_OBSERVATORY: [string, string, string, string, string] = [
  '#0a0c26',
  '#141842',
  '#21255e',
  '#323375',
  '#47438a'
]

const SKY_ECLIPSE: [string, string, string, string, string] = [
  '#170514',
  '#2b0a22',
  '#451234',
  '#611b44',
  '#7d2452'
]

const SKY_CITADEL: [string, string, string, string, string] = [
  '#08051f',
  '#130d3b',
  '#21185e',
  '#342582',
  '#4935a3'
]

// ============================================================================
// BIOME 5: CRYSTAL MUSHROOM CAVERN (Levels 9 & 10)
// ============================================================================

function buildCavernLevel(variant: 9 | 10): LevelDefinition {
  const isL10 = variant === 10
  const width = isL10 ? 4320 : 4080

  const platforms: StaticPlatform[] = [
    // Act 1: Cavern Entrance & Glow-Mushroom Intro
    { x: 0, y: 168, w: 192, h: 64, style: 'cavern' },
    { x: 256, y: 156, w: 168, h: 76, style: 'cavern' },
    { x: 488, y: 148, w: 152, h: 84, style: 'cavern' },
    { x: 524, y: 88, w: 84, h: 14, style: 'cavern' }, // Shard 1 High Path
    { x: 736, y: 160, w: 168, h: 72, style: 'cavern' },
    { x: 984, y: 144, w: 160, h: 88, style: 'cavern' },
    { x: 1236, y: 156, w: 176, h: 76, style: 'cavern' },
    // Act 2: Bioluminescent Mushroom Chasms + Secret Alcove (Shard 2)
    { x: 1516, y: 138, w: 152, h: 94, style: 'cavern' },
    { x: 1756, y: 152, w: 184, h: 80, style: 'cavern' },
    { x: 1808, y: 84, w: 84, h: 14, style: 'cavern' }, // Secret Crystal Alcove
    { x: 2020, y: 144, w: 176, h: 88, style: 'cavern' }, // Mid-Level Star Lantern Checkpoint!
    { x: 2296, y: 156, w: 156, h: 76, style: 'cavern' },
    { x: 2548, y: 136, w: 160, h: 96, style: 'cavern' },
    // Act 3: Deep Spore Cavern & Mechanic Check (Shard 3) + Moon Portal
    { x: 2812, y: 150, w: 168, h: 82, style: 'cavern' },
    { x: 3080, y: 138, w: 164, h: 94, style: 'cavern' },
    { x: 3120, y: 80, w: 80, h: 14, style: 'cavern' }, // Shard 3 Mechanic Check (safe drop return!)
    { x: 3340, y: 152, w: 160, h: 80, style: 'cavern' },
    { x: 3592, y: 140, w: 156, h: 92, style: 'cavern' },
    ...(isL10
      ? [
          { x: 3840, y: 148, w: 148, h: 84, style: 'cavern' as const },
          { x: 4076, y: 144, w: 244, h: 88, style: 'cavern' as const }
        ]
      : [{ x: 3844, y: 146, w: 236, h: 86, style: 'cavern' as const }])
  ]

  const glowMushrooms: GlowMushroomDef[] = [
    { x: 428, y: 160, w: 32, bounceVy: -292, tint: 'teal' },
    { x: 672, y: 162, w: 32, bounceVy: -296, tint: 'violet' },
    { x: 1172, y: 158, w: 32, bounceVy: -290, tint: 'teal' },
    { x: 1448, y: 156, w: 34, bounceVy: -306, tint: 'violet' },
    { x: 1768, y: 142, w: 30, bounceVy: -296, tint: 'teal' },
    { x: 2228, y: 158, w: 34, bounceVy: -298, tint: 'violet' },
    { x: 2480, y: 154, w: 34, bounceVy: -304, tint: 'teal' },
    { x: 2740, y: 154, w: 34, bounceVy: -300, tint: 'violet' },
    { x: 3012, y: 152, w: 34, bounceVy: -304, tint: 'teal' },
    { x: 3090, y: 128, w: 28, bounceVy: -286, tint: 'violet' },
    { x: 3524, y: 154, w: 34, bounceVy: -296, tint: 'teal' },
    ...(isL10 ? [{ x: 3774, y: 152, w: 34, bounceVy: -304, tint: 'violet' as const }] : [])
  ]

  const proximityCrystals: ProximityCrystalDef[] = [
    { x: 564, y: 74, radius: 96, tint: 'cyan' },
    { x: 1060, y: 124, radius: 110, tint: 'violet' },
    { x: 1848, y: 68, radius: 108, tint: 'cyan' },
    { x: 2624, y: 112, radius: 114, tint: 'violet' },
    { x: 3158, y: 66, radius: 104, tint: 'gold' },
    { x: 3670, y: 116, radius: 114, tint: 'cyan' }
  ]

  const movingPlatforms: MovingPlatformDef[] = [
    { x: 916, y: 146, w: 48, h: 10, dx: 44, dy: -10, speed: isL10 ? 1.65 : 1.4, phase: 0 },
    { x: 3260, y: 144, w: 48, h: 10, dx: 52, dy: -8, speed: isL10 ? 1.75 : 1.5, phase: 1.1 },
    ...(isL10
      ? [{ x: 3998, y: 142, w: 46, h: 10, dx: 46, dy: -10, speed: 1.8, phase: 0.4 }]
      : [])
  ]

  const shards: [ShardDef, ShardDef, ShardDef] = [
    { index: 0, x: 558, y: 66 }, // High Path
    { index: 1, x: 1842, y: 62 }, // Secret Alcove
    { index: 2, x: 3154, y: 58 } // Mechanic Check (Glow-Mushroom chain with safe floor below!)
  ]

  const secretAlcoves: SecretAlcoveDef[] = [
    { x: 1812, y: 54, w: 76, h: 30, kind: 'crystal' },
    { x: 3122, y: 50, w: 76, h: 30, kind: 'crystal' }
  ]

  const wisps: WispDef[] = [
    { x: 830, y: 118, ampY: 20, speed: isL10 ? 2.1 : 1.8, phase: 0 },
    { x: 1624, y: 108, ampY: 22, speed: isL10 ? 2.2 : 1.9, phase: 1.2 },
    { x: 2400, y: 116, ampY: 22, speed: isL10 ? 2.3 : 2.0, phase: 0.7 },
    { x: 2920, y: 112, ampY: 24, speed: isL10 ? 2.3 : 2.0, phase: 2.0 },
    { x: 3440, y: 112, ampY: 22, speed: isL10 ? 2.4 : 2.1, phase: 1.4 }
  ]

  const collectibles: CollectibleDef[] = [
    { x: 132, y: 144, kind: 'star' },
    { x: 316, y: 132, kind: 'star' },
    { x: 438, y: 112, kind: 'star' },
    { x: 558, y: 124, kind: 'star' },
    { x: 682, y: 110, kind: 'star' },
    { x: 812, y: 136, kind: 'fish' },
    { x: 1054, y: 120, kind: 'star' },
    { x: 1318, y: 132, kind: 'star' },
    { x: 1460, y: 102, kind: 'star' },
    { x: 1584, y: 114, kind: 'star' },
    { x: 1844, y: 128, kind: 'star' },
    { x: 1846, y: 66, kind: 'fish' },
    { x: 2116, y: 120, kind: 'star' },
    { x: 2240, y: 108, kind: 'star' },
    { x: 2376, y: 132, kind: 'star' },
    { x: 2618, y: 112, kind: 'fish' },
    { x: 2888, y: 126, kind: 'star' },
    { x: 3022, y: 100, kind: 'star' },
    { x: 3154, y: 114, kind: 'star' },
    { x: 3416, y: 128, kind: 'star' },
    { x: 3668, y: 116, kind: 'fish' },
    { x: width - 160, y: 120, kind: 'bigStar' }
  ]

  const powerUps: PowerUpDef[] = [
    { x: 368, y: 132, kind: 'bell' },
    { x: 1280, y: 132, kind: 'bubble' },
    { x: 2096, y: 120, kind: 'milk' },
    { x: 2864, y: 126, kind: 'feather' },
    { x: 3616, y: 116, kind: 'mooncake' }
  ]

  const lanterns: LanternDef[] = [
    { x: 64, y: 148, mount: 'post' },
    { x: 504, y: 128, mount: 'post' },
    { x: 1000, y: 124, mount: 'post' },
    { x: 1532, y: 118, mount: 'post' },
    { x: 2036, y: 124, mount: 'post' },
    { x: 2564, y: 116, mount: 'post' },
    { x: 3100, y: 118, mount: 'post' },
    { x: width - 196, y: 126, mount: 'post' }
  ]

  return {
    id: variant,
    biome: 'cavern',
    name: isL10 ? 'Lembah Spora Bercahaya' : 'Gua Jamur Kristal',
    subtitle: isL10 ? 'Jamur Elastis & Kristal Tersembunyi' : 'Bioluminesensi & Lompatan Jamur',
    description: isL10
      ? 'Menjelajahi kedalaman gua kristal dengan rantai jamur pegas elastis dan cahaya spora hangat.'
      : 'Melompati jamur bioluminesen yang membal dan menyalakan kristal gua yang berpendar saat didekati.',
    width,
    height: 216,
    spawn: { x: 28, y: 140 },
    portal: { x: width - 86, y: 106 },
    skyTint: { bands: SKY_CAVERN },
    platforms,
    movingPlatforms,
    bounceClouds: [],
    glowMushrooms,
    proximityCrystals,
    checkpoint: { x: 2056, y: 120 },
    checkpoints: [
      { x: 1018, y: 120 },
      { x: 2056, y: 120 },
      { x: 3112, y: 114 }
    ],
    starRingBell: { x: 1588, y: 114 },
    shards,
    secretAlcoves,
    wisps,
    crows: [
      { x: 1344, y: 98, rangeX: 54, speed: isL10 ? 1.8 : 1.55, waveAmp: 4, phase: 0.3 },
      { x: 2660, y: 88, rangeX: 58, speed: isL10 ? 1.95 : 1.7, waveAmp: 4, phase: 1.5 }
    ],
    hedgehogs: [
      { x: 786, y: 150, minX: 748, maxX: 882, speed: isL10 ? 44 : 36 },
      { x: 2348, y: 146, minX: 2310, maxX: 2432, speed: isL10 ? 48 : 40 }
    ],
    npc: {
      x: width - 132,
      y: 128,
      name: isL10 ? 'Lumi si Kelinci Kristal' : 'Spora si Burung Hantu Gua',
      kind: isL10 ? 'bunny' : 'owl',
      lines: isL10
        ? ['Menara jam bintang ada di atas sana!', 'Siapkan lompatan anggunmu~']
        : ['Jamur biru ini sangat empuk!', 'Dekati kristal gelap untuk menerangi jalan~']
    },
    collectibles,
    powerUps,
    puddles: [],
    lanterns
  }
}

// ============================================================================
// BIOME 6: CLOCKWORK OBSERVATORY (Levels 11 & 12)
// ============================================================================

function buildObservatoryLevel(variant: 11 | 12): LevelDefinition {
  const isL12 = variant === 12
  const width = isL12 ? 4760 : 4480

  const platforms: StaticPlatform[] = [
    // Act 1: Brass Gallery & First Rotating Gear
    { x: 0, y: 168, w: 184, h: 64, style: 'observatory' },
    { x: 256, y: 152, w: 160, h: 80, style: 'observatory' },
    { x: 584, y: 142, w: 160, h: 90, style: 'observatory' },
    { x: 622, y: 78, w: 84, h: 14, style: 'observatory' }, // Shard 1 High Path (via Low-G Zone!)
    { x: 860, y: 154, w: 168, h: 78, style: 'observatory' },
    { x: 1196, y: 142, w: 164, h: 90, style: 'observatory' },
    // Act 2: Astral Low-Gravity Hall + Interlocking Gears + Mid-Level Checkpoint
    { x: 1524, y: 150, w: 180, h: 82, style: 'observatory' },
    { x: 1572, y: 76, w: 84, h: 14, style: 'observatory' }, // Shard 2 Secret Gear Alcove
    { x: 1896, y: 140, w: 176, h: 92, style: 'observatory' },
    { x: 2224, y: 148, w: 192, h: 84, style: 'observatory' }, // Mid-Level Star Lantern Checkpoint!
    { x: 2588, y: 138, w: 164, h: 94, style: 'observatory' },
    { x: 2920, y: 150, w: 168, h: 82, style: 'observatory' },
    // Act 3: Telescope Dome Spire & Mechanic Check (Shard 3) + Moon Portal
    { x: 3260, y: 136, w: 168, h: 96, style: 'observatory' },
    { x: 3304, y: 74, w: 80, h: 14, style: 'observatory' }, // Shard 3 Mechanic Check (safe return!)
    { x: 3600, y: 148, w: 168, h: 84, style: 'observatory' },
    { x: 3932, y: 138, w: 164, h: 94, style: 'observatory' },
    ...(isL12
      ? [
          { x: 4240, y: 144, w: 144, h: 88, style: 'observatory' as const },
          { x: 4512, y: 138, w: 248, h: 94, style: 'observatory' as const }
        ]
      : [{ x: 4236, y: 140, w: 244, h: 92, style: 'observatory' as const }])
  ]

  const gearPlatforms: GearPlatformDef[] = [
    { centerX: 500, centerY: 142, orbitRadius: 34, w: 44, speed: isL12 ? 1.35 : 1.15, phase: 0 },
    { centerX: 1112, centerY: 144, orbitRadius: 36, w: 46, speed: isL12 ? -1.4 : -1.2, phase: 1.0 },
    { centerX: 1800, centerY: 138, orbitRadius: 36, w: 46, speed: isL12 ? 1.45 : 1.25, phase: 0.4 },
    { centerX: 2502, centerY: 140, orbitRadius: 38, w: 46, speed: isL12 ? -1.45 : -1.25, phase: 2.0 },
    { centerX: 3174, centerY: 140, orbitRadius: 38, w: 46, speed: isL12 ? 1.5 : 1.3, phase: 0.8 },
    { centerX: 3848, centerY: 138, orbitRadius: 38, w: 46, speed: isL12 ? -1.55 : -1.35, phase: 1.6 },
    ...(isL12
      ? [{ centerX: 4442, centerY: 138, orbitRadius: 34, w: 44, speed: 1.6, phase: 0.2 }]
      : [{ centerX: 4166, centerY: 138, orbitRadius: 32, w: 44, speed: 1.35, phase: 0.3 }])
  ]

  const lowGravityZones: LowGravityZoneDef[] = [
    { x: 560, y: 42, w: 188, h: 122, gravityScale: 0.5 },
    { x: 1364, y: 46, w: 220, h: 122, gravityScale: 0.48 },
    { x: 2076, y: 48, w: 168, h: 120, gravityScale: 0.5 },
    { x: 2756, y: 46, w: 180, h: 122, gravityScale: 0.48 },
    { x: 3238, y: 38, w: 204, h: 124, gravityScale: 0.48 },
    { x: 3432, y: 48, w: 184, h: 120, gravityScale: 0.5 }
  ]

  const movingPlatforms: MovingPlatformDef[] = [
    { x: 760, y: 146, w: 46, h: 10, dx: 48, dy: -10, speed: isL12 ? 1.7 : 1.5, phase: 0 },
    { x: 2102, y: 144, w: 46, h: 10, dx: 64, dy: -12, speed: isL12 ? 1.75 : 1.55, phase: 0.8 }
  ]

  const shards: [ShardDef, ShardDef, ShardDef] = [
    { index: 0, x: 656, y: 56 }, // High Path (Low-G lift!)
    { index: 1, x: 1606, y: 54 }, // Secret Gear Alcove
    { index: 2, x: 3336, y: 52 } // Mechanic Check (Gear -> Low-G Spire!)
  ]

  const secretAlcoves: SecretAlcoveDef[] = [
    { x: 1574, y: 46, w: 78, h: 30, kind: 'gear' },
    { x: 3304, y: 44, w: 78, h: 30, kind: 'gear' }
  ]

  const collectibles: CollectibleDef[] = [
    { x: 120, y: 144, kind: 'star' },
    { x: 324, y: 128, kind: 'star' },
    { x: 500, y: 96, kind: 'star' },
    { x: 660, y: 118, kind: 'star' },
    { x: 936, y: 130, kind: 'fish' },
    { x: 1112, y: 98, kind: 'star' },
    { x: 1272, y: 118, kind: 'star' },
    { x: 1448, y: 92, kind: 'star' },
    { x: 1608, y: 58, kind: 'fish' },
    { x: 1800, y: 94, kind: 'star' },
    { x: 1984, y: 116, kind: 'star' },
    { x: 2312, y: 124, kind: 'star' },
    { x: 2502, y: 94, kind: 'star' },
    { x: 2668, y: 114, kind: 'fish' },
    { x: 2844, y: 90, kind: 'star' },
    { x: 3000, y: 126, kind: 'star' },
    { x: 3174, y: 94, kind: 'star' },
    { x: 3340, y: 112, kind: 'star' },
    { x: 3520, y: 92, kind: 'star' },
    { x: 3684, y: 124, kind: 'fish' },
    { x: 3848, y: 94, kind: 'star' },
    { x: 4012, y: 114, kind: 'star' },
    { x: width - 168, y: 112, kind: 'bigStar' }
  ]

  const powerUps: PowerUpDef[] = [
    { x: 296, y: 128, kind: 'yarn' },
    { x: 1236, y: 118, kind: 'bubble' },
    { x: 2292, y: 124, kind: 'milk' },
    { x: 2956, y: 126, kind: 'candy' },
    { x: 3964, y: 114, kind: 'mooncake' }
  ]

  const lanterns: LanternDef[] = [
    { x: 56, y: 148, mount: 'post' },
    { x: 600, y: 122, mount: 'post' },
    { x: 1212, y: 122, mount: 'post' },
    { x: 1914, y: 120, mount: 'post' },
    { x: 2248, y: 128, mount: 'post' },
    { x: 2936, y: 130, mount: 'post' },
    { x: 3616, y: 128, mount: 'post' },
    { x: width - 208, y: 118, mount: 'post' }
  ]

  return {
    id: variant,
    biome: 'observatory',
    name: isL12 ? 'Menara Teleskop Bintang' : 'Observatorium Roda Jam',
    subtitle: isL12 ? 'Puncak Roda Kuningan & Gravitasi Astral' : 'Roda Gigi Berputar & Zona Gravitasi Ringan',
    description: isL12
      ? 'Puncak observatorium langit dengan roda gigi berputar cepat dan medan cahaya bintang ringan.'
      : 'Menapaki roda gigi kuningan yang berputar dan melayang anggun di medan gravitasi astral.',
    width,
    height: 216,
    spawn: { x: 28, y: 140 },
    portal: { x: width - 86, y: 98 },
    skyTint: { bands: SKY_OBSERVATORY },
    platforms,
    movingPlatforms,
    bounceClouds: [],
    gearPlatforms,
    lowGravityZones,
    checkpoint: { x: 2270, y: 124 },
    checkpoints: [
      { x: 1240, y: 118 },
      { x: 2270, y: 124 },
      { x: 3638, y: 124 }
    ],
    starRingBell: { x: 1966, y: 116 },
    shards,
    secretAlcoves,
    crows: [
      { x: 948, y: 102, rangeX: 54, speed: isL12 ? 1.95 : 1.7, waveAmp: 4, phase: 0 },
      { x: 2672, y: 92, rangeX: 58, speed: isL12 ? 2.05 : 1.85, waveAmp: 4, phase: 1.2 },
      { x: 3710, y: 98, rangeX: 58, speed: isL12 ? 2.15 : 1.9, waveAmp: 4, phase: 2.1 }
    ],
    wisps: [
      { x: 1456, y: 104, ampY: 22, speed: isL12 ? 2.3 : 2.0, phase: 0.4 },
      { x: 2848, y: 102, ampY: 24, speed: isL12 ? 2.4 : 2.1, phase: 1.5 }
    ],
    npc: {
      x: width - 134,
      y: 120,
      name: isL12 ? 'Astro si Penjaga Teleskop' : 'Gigi si Kucing Astronom',
      kind: isL12 ? 'owl' : 'kitten',
      lines: isL12
        ? ['Seluruh 6 dunia telah kau taklukkan!', 'Raih 3 Rank S untuk membuka Secret Finale~']
        : ['Zona bintang biru membuatmu melayang ringan!', 'Naiki roda kuningan mengikuti putarannya~']
    },
    collectibles,
    powerUps,
    puddles: [],
    lanterns
  }
}

// ============================================================================
// SECRET FINALE BOSS STAGES (Levels 13 & 14 • Unlocked at Rank S >= 3)
// ============================================================================

const LEVEL_13_ECLIPSE: LevelDefinition = {
  id: 13,
  biome: 'eclipse',
  isSecretFinale: true,
  name: 'Eclipse Sanctum',
  subtitle: 'Boss Rahasia I • Umbra Owl',
  description: 'Reruntuhan bulan merah gerhana! Gunakan Starlight Pulse [C/J] & Astral Aegis [V/K] untuk menaklukkan Umbra Owl.',
  width: 1280,
  height: 216,
  spawn: { x: 28, y: 140 },
  portal: { x: 1210, y: 124 },
  skyTint: { bands: SKY_ECLIPSE },
  platforms: [
    // Atmospheric ~25-35s Moonlit Floating Ruins Approach (0..820px)
    { x: 0, y: 168, w: 176, h: 64, style: 'eclipse' },
    { x: 232, y: 154, w: 128, h: 78, style: 'eclipse' },
    { x: 420, y: 140, w: 128, h: 92, style: 'eclipse' },
    { x: 604, y: 150, w: 144, h: 82, style: 'eclipse' },
    // Boss Arena Main Floor (820..1280px)
    { x: 804, y: 168, w: 476, h: 64, style: 'eclipse' }
  ],
  movingPlatforms: [
    // 3 Vertically Shifting Stone Platforms inside Eclipse Sanctum Boss Arena!
    { x: 878, y: 124, w: 54, h: 10, dx: 0, dy: -26, speed: 1.35, phase: 0 },
    { x: 1018, y: 106, w: 62, h: 10, dx: 0, dy: 24, speed: 1.2, phase: 1.4 },
    { x: 1164, y: 124, w: 54, h: 10, dx: 0, dy: -26, speed: 1.35, phase: 2.6 }
  ],
  bounceClouds: [],
  checkpoint: { x: 676, y: 126 },
  checkpoints: [{ x: 676, y: 126 }],
  arenaBattleItems: [
    { x: 476, y: 116, kind: 'moonlightFeather' },
    { x: 716, y: 126, kind: 'starBerry' }
  ],
  bossConfig: {
    kind: 'umbra-owl',
    name: 'UMBRA OWL',
    subtitle: 'Sovereign of Eclipse',
    maxHp: 24,
    arenaMinX: 824,
    arenaMaxX: 1264,
    triggerX: 848,
    spawnX: 1120,
    spawnY: 48,
    rewardCoins: 25,
    achievementId: 'eclipse-conqueror',
    cosmeticSlot: 'head_acc',
    cosmeticId: 'halo-eclipse',
    cosmeticName: 'Eclipse Halo',
    arenaItemSpots: [
      { x: 902, y: 142 },
      { x: 1044, y: 82 },
      { x: 1184, y: 142 }
    ]
  },
  npc: {
    x: 122,
    y: 150,
    name: 'Milo si Penjaga Gerhana',
    kind: 'owl',
    lines: ['Tekan [C/J] tembak Pulse & pantulkan bola emas!', 'Tekan [V/K] buka Aegis untuk menangkis bulu bayangan!']
  },
  collectibles: [
    { x: 196, y: 132, kind: 'star' },
    { x: 292, y: 130, kind: 'star' },
    { x: 388, y: 116, kind: 'star' },
    { x: 484, y: 116, kind: 'star' },
    { x: 572, y: 124, kind: 'star' },
    { x: 654, y: 126, kind: 'fish' }
  ],
  powerUps: [],
  puddles: [],
  crows: [],
  lanterns: [
    { x: 52, y: 148, mount: 'post' },
    { x: 252, y: 134, mount: 'post' },
    { x: 438, y: 120, mount: 'post' },
    { x: 834, y: 148, mount: 'post' },
    { x: 1236, y: 148, mount: 'post' }
  ]
}

const LEVEL_14_CITADEL: LevelDefinition = {
  id: 14,
  biome: 'citadel',
  isSecretFinale: true,
  name: 'Astral Core Citadel',
  subtitle: 'Boss Rahasia II • Chronos Leviathan',
  description: 'Benteng kosmik bintang! Hadapi Chronos Leviathan dalam 3 fase overdrive & serang Core Expose!',
  width: 1360,
  height: 216,
  spawn: { x: 28, y: 140 },
  portal: { x: 1288, y: 124 },
  skyTint: { bands: SKY_CITADEL },
  platforms: [
    // Cosmic Citadel Approach (0..880px)
    { x: 0, y: 168, w: 176, h: 64, style: 'citadel' },
    { x: 244, y: 152, w: 136, h: 80, style: 'citadel' },
    { x: 452, y: 138, w: 144, h: 94, style: 'citadel' },
    { x: 664, y: 148, w: 160, h: 84, style: 'citadel' },
    // Boss Arena Energy Citadel Floor (880..1360px)
    { x: 876, y: 168, w: 484, h: 64, style: 'citadel' },
    // Fixed Glowing Energy Bridges (upper flanks)
    { x: 928, y: 118, w: 72, h: 10, style: 'citadel' },
    { x: 1232, y: 118, w: 72, h: 10, style: 'citadel' }
  ],
  movingPlatforms: [
    // Center energy bridge shifting gently between mid & high tiers
    { x: 1076, y: 112, w: 78, h: 10, dx: 0, dy: -28, speed: 1.3, phase: 0.4 }
  ],
  lowGravityZones: [
    { x: 384, y: 50, w: 110, h: 116, gravityScale: 0.52 }
  ],
  bounceClouds: [],
  checkpoint: { x: 744, y: 124 },
  checkpoints: [{ x: 744, y: 124 }],
  arenaBattleItems: [
    { x: 516, y: 114, kind: 'cometCharge' },
    { x: 786, y: 124, kind: 'starBerry' }
  ],
  bossConfig: {
    kind: 'chronos-leviathan',
    name: 'CHRONOS LEVIATHAN',
    subtitle: 'Starlight Automaton',
    maxHp: 30,
    arenaMinX: 896,
    arenaMaxX: 1344,
    triggerX: 916,
    spawnX: 1112,
    spawnY: 50,
    rewardCoins: 40,
    achievementId: 'starlight-legend',
    cosmeticSlot: 'cape',
    cosmeticId: 'cape-nebula-sovereign',
    cosmeticName: 'Nebula Sovereign Cape',
    arenaItemSpots: [
      { x: 956, y: 94 },
      { x: 1112, y: 144 },
      { x: 1260, y: 94 }
    ]
  },
  npc: {
    x: 122,
    y: 150,
    name: 'Nori si Penjaga Kosmos',
    kind: 'kitten',
    lines: ['Saat inti dada Chronos terbuka, tembak Pulse untuk CRITICAL!', 'Tangkis sinar bintang dengan Aegis [V/K] dan raih kemenangan!']
  },
  collectibles: [
    { x: 204, y: 130, kind: 'star' },
    { x: 308, y: 128, kind: 'star' },
    { x: 422, y: 98, kind: 'star' },
    { x: 524, y: 114, kind: 'star' },
    { x: 628, y: 122, kind: 'star' },
    { x: 718, y: 124, kind: 'fish' }
  ],
  powerUps: [],
  puddles: [],
  crows: [],
  lanterns: [
    { x: 56, y: 148, mount: 'post' },
    { x: 264, y: 132, mount: 'post' },
    { x: 468, y: 118, mount: 'post' },
    { x: 904, y: 148, mount: 'post' },
    { x: 1316, y: 148, mount: 'post' }
  ]
}

export const EXPANSION_LEVELS: LevelDefinition[] = [
  buildCavernLevel(9),
  buildCavernLevel(10),
  buildObservatoryLevel(11),
  buildObservatoryLevel(12),
  LEVEL_13_ECLIPSE,
  LEVEL_14_CITADEL
]
