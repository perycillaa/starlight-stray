import { extendBaseLevel } from './levelExtensions'
import type { LevelDefinition } from './types'
import { EXPANSION_LEVELS } from './worldExpansion'

const SKY_ROOFTOPS: [string, string, string, string, string] = [
  '#120a24',
  '#180e33',
  '#221445',
  '#2d1a57',
  '#3a2266'
]

const SKY_SAKURA: [string, string, string, string, string] = [
  '#0d1233',
  '#141b45',
  '#1e2557',
  '#2d2c69',
  '#423575'
]

const SKY_CLOUDLAND: [string, string, string, string, string] = [
  '#221445',
  '#321d5c',
  '#472870',
  '#613682',
  '#7d4991'
]

const SKY_HARBOR: [string, string, string, string, string] = [
  '#061920',
  '#0a242d',
  '#0f333d',
  '#16444e',
  '#1d5761'
]

/**
 * 8 Expanded (+60%) 3-Act Handcrafted Levels across 4 Biomes:
 *  - Level 1–2: Atap Kota Malam (Patrol Crows, Steam Chimneys, Bouncy Power Wires, Secret Chimney Alcoves)
 *  - Level 3–4: Hutan Sakura Malam (Forest Hedgehogs, Petal Wind Vortices, Fragile Branches, Secret Canopies)
 *  - Level 5–6: Negeri Awan Pastel (Mini Storm Clouds, Swooping Crows, Moving Clouds, Secret Cloud Alcoves)
 *  - Level 7–8: Dermaga Lampion (Agile Pier Crabs, Lantern Wisps, Floating Wooden Boats, Secret Sails)
 */
const BASE_LEVELS: LevelDefinition[] = [
  // ==========================================================================
  // BIOME 1 — LEVEL 1: ATAP TENANG (2460 px • 3 Acts • 2 Checkpoints • 2 Secrets)
  // ==========================================================================
  {
    id: 1,
    biome: 'rooftops',
    name: 'Atap Tenang',
    subtitle: 'Pengenalan Atap & Kabel Membal',
    description: 'Jelajahi 3 babak atap malam, memantul di kabel listrik, hindari uap cerobong, dan temukan ruang rahasia.',
    width: 2460,
    height: 216,
    spawn: { x: 28, y: 140 },
    portal: { x: 2380, y: 112 },
    skyTint: { bands: SKY_ROOFTOPS },
    tutorialSigns: [
      { x: 64, y: 126, topText: '[A / D]', bottomText: 'JALAN' },
      { x: 244, y: 114, topText: '[SPASI X2]', bottomText: 'LOMPAT GANDA' },
      { x: 506, y: 122, topText: '[SHIFT / X]', bottomText: 'DASH' }
    ],
    platforms: [
      // Act 1: Warm-up
      { x: 0, y: 168, w: 192, h: 64, style: 'brick', chimneys: [20] },
      { x: 232, y: 156, w: 152, h: 76, style: 'wood', chimneys: [126] },
      { x: 424, y: 164, w: 192, h: 68, style: 'brick', chimneys: [18] },
      { x: 484, y: 104, w: 72, h: 16, style: 'wood' },
      { x: 660, y: 148, w: 144, h: 84, style: 'wood' },
      // Act 2: Mid Exploration + Power Wire + Steam Chimney + Secret 1
      { x: 852, y: 136, w: 144, h: 96, style: 'brick', chimneys: [96] },
      { x: 1052, y: 160, w: 208, h: 72, style: 'brick', chimneys: [24, 178] },
      { x: 1120, y: 92, w: 80, h: 16, style: 'wood' },
      { x: 1316, y: 144, w: 144, h: 88, style: 'wood' },
      { x: 1516, y: 156, w: 160, h: 76, style: 'brick', chimneys: [122] },
      // Act 3: Final Stretch + Power Wire + Secret 2 + Portal
      { x: 1736, y: 140, w: 144, h: 92, style: 'brick' },
      { x: 1940, y: 156, w: 176, h: 76, style: 'wood', chimneys: [144] },
      { x: 2004, y: 88, w: 80, h: 16, style: 'brick' },
      { x: 2172, y: 144, w: 96, h: 88, style: 'wood' },
      { x: 2316, y: 152, w: 144, h: 80, style: 'brick', chimneys: [14] }
    ],
    movingPlatforms: [
      { x: 1682, y: 142, w: 48, h: 10, dx: 24, dy: -10, speed: 1.35, phase: 0 }
    ],
    bounceClouds: [
      { x: 446, y: 154, w: 28 },
      { x: 1216, y: 150, w: 28 }
    ],
    powerWires: [
      { x: 804, y: 154, w: 48 },
      { x: 1880, y: 148, w: 60 }
    ],
    checkpoint: { x: 720, y: 124 },
    checkpoints: [
      { x: 720, y: 124 },
      { x: 1564, y: 132 }
    ],
    starRingBell: { x: 1152, y: 136 },
    shards: [
      { index: 0, x: 946, y: 98 },
      { index: 1, x: 1154, y: 72 },
      { index: 2, x: 2286, y: 112 }
    ],
    secretAlcoves: [
      { x: 1126, y: 64, w: 68, h: 28, kind: 'chimney' },
      { x: 2012, y: 60, w: 68, h: 28, kind: 'chimney' }
    ],
    steamVents: [
      { x: 928, y: 136, period: 3.8, offset: 0 },
      { x: 1796, y: 140, period: 3.6, offset: 1.4 }
    ],
    npc: {
      x: 2348,
      y: 134,
      name: 'Milo si Burung Hantu',
      kind: 'owl',
      lines: ['Wah, atapnya jauh juga ya!', 'Gerbang Bulan ada di depan~']
    },
    collectibles: [
      { x: 128, y: 144, kind: 'star' },
      { x: 204, y: 132, kind: 'star' },
      { x: 316, y: 132, kind: 'star' },
      { x: 398, y: 130, kind: 'star' },
      { x: 512, y: 80, kind: 'fish' },
      { x: 632, y: 126, kind: 'star' },
      { x: 760, y: 124, kind: 'star' },
      { x: 824, y: 102, kind: 'star' },
      { x: 896, y: 110, kind: 'star' },
      { x: 1084, y: 136, kind: 'star' },
      { x: 1152, y: 72, kind: 'bigStar' }, // Inside Secret 1!
      { x: 1264, y: 112, kind: 'star' },
      { x: 1384, y: 116, kind: 'fish' },
      { x: 1484, y: 120, kind: 'star' },
      { x: 1624, y: 130, kind: 'star' },
      { x: 1764, y: 116, kind: 'star' },
      { x: 1906, y: 98, kind: 'star' },
      { x: 2036, y: 68, kind: 'fish' }, // Inside Secret 2!
      { x: 2136, y: 120, kind: 'star' },
      { x: 2214, y: 116, kind: 'star' },
      { x: 2284, y: 118, kind: 'fish' }
    ],
    powerUps: [
      { x: 288, y: 132, kind: 'yarn' },
      { x: 686, y: 124, kind: 'bell' },
      { x: 1344, y: 120, kind: 'mooncake' },
      { x: 1608, y: 132, kind: 'milk' },
      { x: 1966, y: 132, kind: 'bubble' }
    ],
    puddles: [
      { x: 520, y: 158, w: 24 },
      { x: 1144, y: 154, w: 24 },
      { x: 2028, y: 150, w: 24 }
    ],
    crows: [
      { x: 1430, y: 100, rangeX: 52, speed: 1.4, waveAmp: 3, phase: 0 },
      { x: 2116, y: 102, rangeX: 56, speed: 1.5, waveAmp: 3, phase: 1.2 }
    ],
    lanterns: [
      { x: 46, y: 148, mount: 'post' },
      { x: 248, y: 136, mount: 'post' },
      { x: 434, y: 144, mount: 'post' },
      { x: 672, y: 128, mount: 'post' },
      { x: 874, y: 116, mount: 'post' },
      { x: 1068, y: 140, mount: 'post' },
      { x: 1332, y: 124, mount: 'post' },
      { x: 1752, y: 120, mount: 'post' },
      { x: 1954, y: 136, mount: 'post' },
      { x: 2330, y: 132, mount: 'post' }
    ]
  },

  // ==========================================================================
  // BIOME 1 — LEVEL 2: LAMPION MELAYANG (2740 px • 3 Acts)
  // ==========================================================================
  {
    id: 2,
    biome: 'rooftops',
    name: 'Lampion Melayang',
    subtitle: 'Kabel Tinggi, Uap & Gagak Kota',
    description: 'Melintasi menara kota malam dengan kabel membal, platform bergerak, dan gagak patroli.',
    width: 2740,
    height: 216,
    spawn: { x: 28, y: 140 },
    portal: { x: 2660, y: 108 },
    skyTint: { bands: SKY_ROOFTOPS },
    platforms: [
      { x: 0, y: 168, w: 160, h: 64, style: 'wood', chimneys: [20] },
      { x: 244, y: 156, w: 144, h: 76, style: 'brick', chimneys: [104] },
      { x: 544, y: 148, w: 144, h: 84, style: 'brick', chimneys: [20] },
      { x: 772, y: 92, w: 96, h: 16, style: 'wood' },
      { x: 832, y: 164, w: 160, h: 68, style: 'wood' },
      // Act 2
      { x: 1068, y: 144, w: 144, h: 88, style: 'brick', chimneys: [108] },
      { x: 1388, y: 132, w: 144, h: 100, style: 'wood' },
      { x: 1600, y: 156, w: 176, h: 76, style: 'brick', chimneys: [22] },
      { x: 1644, y: 88, w: 80, h: 16, style: 'wood' },
      { x: 1852, y: 144, w: 160, h: 88, style: 'brick' },
      // Act 3
      { x: 2180, y: 136, w: 128, h: 96, style: 'wood' },
      { x: 2380, y: 152, w: 128, h: 80, style: 'brick', chimneys: [96] },
      { x: 2580, y: 148, w: 160, h: 84, style: 'brick', chimneys: [18] }
    ],
    movingPlatforms: [
      { x: 404, y: 148, w: 48, h: 10, dx: 76, dy: 0, speed: 1.55, phase: 0 },
      { x: 712, y: 148, w: 48, h: 10, dx: 0, dy: -52, speed: 1.65, phase: 0.4 },
      { x: 1236, y: 144, w: 48, h: 10, dx: 92, dy: -14, speed: 1.7, phase: 1.2 },
      { x: 2036, y: 144, w: 48, h: 10, dx: 84, dy: -12, speed: 1.8, phase: 0.7 }
    ],
    bounceClouds: [
      { x: 344, y: 146, w: 28 },
      { x: 946, y: 154, w: 28 },
      { x: 1732, y: 146, w: 28 }
    ],
    powerWires: [
      { x: 1532, y: 148, w: 68 },
      { x: 2308, y: 148, w: 72 },
      { x: 2508, y: 150, w: 72 }
    ],
    checkpoint: { x: 874, y: 140 },
    checkpoints: [
      { x: 874, y: 140 },
      { x: 1898, y: 120 }
    ],
    starRingBell: { x: 1682, y: 132 },
    shards: [
      { index: 0, x: 814, y: 70 },
      { index: 1, x: 1678, y: 68 },
      { index: 2, x: 2538, y: 106 }
    ],
    secretAlcoves: [
      { x: 786, y: 64, w: 68, h: 28, kind: 'chimney' },
      { x: 1650, y: 60, w: 68, h: 28, kind: 'chimney' }
    ],
    steamVents: [
      { x: 616, y: 148, period: 3.5, offset: 0 },
      { x: 1448, y: 132, period: 3.4, offset: 1.2 },
      { x: 2236, y: 136, period: 3.2, offset: 0.6 }
    ],
    npc: {
      x: 2626,
      y: 130,
      name: 'Kiki si Kelinci Bulan',
      kind: 'bunny',
      lines: ['Sebentar lagi masuk hutan!', 'Kelopak sakura menunggumu~']
    },
    collectibles: [
      { x: 184, y: 126, kind: 'star' },
      { x: 208, y: 116, kind: 'star' },
      { x: 298, y: 132, kind: 'star' },
      { x: 448, y: 118, kind: 'star' },
      { x: 482, y: 118, kind: 'star' },
      { x: 814, y: 70, kind: 'fish' }, // Secret 1!
      { x: 912, y: 140, kind: 'star' },
      { x: 1012, y: 112, kind: 'star' },
      { x: 1134, y: 120, kind: 'star' },
      { x: 1284, y: 112, kind: 'star' },
      { x: 1326, y: 104, kind: 'star' },
      { x: 1492, y: 104, kind: 'fish' },
      { x: 1560, y: 98, kind: 'star' },
      { x: 1676, y: 68, kind: 'bigStar' }, // Secret 2!
      { x: 1810, y: 116, kind: 'star' },
      { x: 1948, y: 118, kind: 'star' },
      { x: 2088, y: 104, kind: 'star' },
      { x: 2132, y: 100, kind: 'fish' },
      { x: 2338, y: 96, kind: 'star' },
      { x: 2436, y: 124, kind: 'star' },
      { x: 2540, y: 100, kind: 'fish' }
    ],
    powerUps: [
      { x: 266, y: 132, kind: 'yarn' },
      { x: 572, y: 124, kind: 'feather' },
      { x: 1094, y: 120, kind: 'mooncake' },
      { x: 1624, y: 132, kind: 'milk' },
      { x: 1966, y: 120, kind: 'bubble' }
    ],
    puddles: [
      { x: 294, y: 150, w: 24 },
      { x: 896, y: 158, w: 24 },
      { x: 1674, y: 150, w: 24 }
    ],
    crows: [
      { x: 1006, y: 98, rangeX: 60, speed: 1.55, waveAmp: 4, phase: 0 },
      { x: 1796, y: 94, rangeX: 58, speed: 1.7, waveAmp: 3, phase: 1.1 },
      { x: 2440, y: 92, rangeX: 64, speed: 1.85, waveAmp: 4, phase: 2.0 }
    ],
    lanterns: [
      { x: 92, y: 148, mount: 'post' },
      { x: 256, y: 136, mount: 'post' },
      { x: 564, y: 128, mount: 'post' },
      { x: 850, y: 144, mount: 'post' },
      { x: 1082, y: 124, mount: 'post' },
      { x: 1404, y: 112, mount: 'post' },
      { x: 1614, y: 136, mount: 'post' },
      { x: 1866, y: 124, mount: 'post' },
      { x: 2196, y: 116, mount: 'post' },
      { x: 2598, y: 128, mount: 'post' }
    ]
  },

  // ==========================================================================
  // BIOME 2 — LEVEL 3: GERBANG SAKURA (2760 px • Hedgehogs, Wind, Fragile Branches)
  // ==========================================================================
  {
    id: 3,
    biome: 'sakura',
    name: 'Gerbang Sakura',
    subtitle: 'Landak Duri & Dahan Rapuh',
    description: 'Masuki hutan sakura panjang, waspadai landak duri, pusaran kelopak, dan dahan rapuh yang turun perlahan.',
    width: 2760,
    height: 216,
    spawn: { x: 28, y: 140 },
    portal: { x: 2680, y: 110 },
    skyTint: { bands: SKY_SAKURA },
    platforms: [
      { x: 0, y: 168, w: 176, h: 64, style: 'sakura' },
      { x: 228, y: 152, w: 160, h: 80, style: 'sakura' },
      { x: 444, y: 136, w: 144, h: 96, style: 'sakura' },
      { x: 644, y: 156, w: 192, h: 76, style: 'sakura' },
      { x: 704, y: 96, w: 80, h: 16, style: 'sakura' },
      // Act 2: Fragile Branches + Wind Vortex + Secret 1
      { x: 896, y: 148, w: 160, h: 84, style: 'sakura' },
      { x: 1228, y: 138, w: 192, h: 94, style: 'sakura' },
      { x: 1488, y: 152, w: 176, h: 80, style: 'sakura' },
      { x: 1732, y: 142, w: 160, h: 90, style: 'sakura' },
      // Act 3: Final Canopy + Secret 2 + Portal
      { x: 2064, y: 136, w: 192, h: 96, style: 'sakura' },
      { x: 2124, y: 78, w: 72, h: 16, style: 'sakura' },
      { x: 2332, y: 150, w: 144, h: 82, style: 'sakura' },
      { x: 2564, y: 150, w: 196, h: 82, style: 'sakura' }
    ],
    movingPlatforms: [
      { x: 2496, y: 146, w: 48, h: 10, dx: 24, dy: -8, speed: 1.4, phase: 0 }
    ],
    fragileBranches: [
      { x: 1084, y: 144, w: 56 },
      { x: 1156, y: 140, w: 56 },
      { x: 1916, y: 140, w: 56 },
      { x: 1990, y: 138, w: 56 }
    ],
    bounceClouds: [
      { x: 668, y: 146, w: 28 },
      { x: 2088, y: 126, w: 28 }
    ],
    checkpoint: { x: 938, y: 124 },
    checkpoints: [
      { x: 938, y: 124 },
      { x: 1776, y: 118 }
    ],
    starRingBell: { x: 1568, y: 128 },
    shards: [
      { index: 0, x: 738, y: 76 },
      { index: 1, x: 1344, y: 118 },
      { index: 2, x: 2028, y: 100 }
    ],
    secretAlcoves: [
      { x: 708, y: 68, w: 72, h: 28, kind: 'canopy' },
      { x: 2124, y: 50, w: 72, h: 28, kind: 'canopy' }
    ],
    hedgehogs: [
      { x: 300, y: 140, minX: 240, maxX: 368, speed: 34 },
      { x: 1300, y: 126, minX: 1242, maxX: 1396, speed: 40 },
      { x: 2150, y: 124, minX: 2096, maxX: 2236, speed: 44 }
    ],
    windVortices: [
      { x: 1528, y: 92, w: 72, h: 60, pushX: -48 }
    ],
    npc: {
      x: 2642,
      y: 132,
      name: 'Hana si Kucing Kuil',
      kind: 'kitten',
      lines: ['Hati-hati dahan rapuh & landak!', 'Kelopak sakura selalu tenang~']
    },
    collectibles: [
      { x: 112, y: 144, kind: 'star' },
      { x: 198, y: 126, kind: 'star' },
      { x: 304, y: 122, kind: 'star' },
      { x: 404, y: 112, kind: 'star' },
      { x: 504, y: 108, kind: 'fish' },
      { x: 610, y: 118, kind: 'star' },
      { x: 736, y: 76, kind: 'fish' }, // Secret 1!
      { x: 862, y: 120, kind: 'star' },
      { x: 1004, y: 122, kind: 'star' },
      { x: 1106, y: 116, kind: 'star' },
      { x: 1178, y: 112, kind: 'star' },
      { x: 1316, y: 108, kind: 'star' },
      { x: 1446, y: 118, kind: 'star' },
      { x: 1554, y: 118, kind: 'fish' },
      { x: 1694, y: 112, kind: 'star' },
      { x: 1842, y: 116, kind: 'star' },
      { x: 1938, y: 112, kind: 'star' },
      { x: 2010, y: 110, kind: 'star' },
      { x: 2152, y: 58, kind: 'bigStar' }, // Secret 2!
      { x: 2292, y: 114, kind: 'star' },
      { x: 2404, y: 122, kind: 'fish' }
    ],
    powerUps: [
      { x: 262, y: 128, kind: 'mochi' },
      { x: 526, y: 112, kind: 'bell' },
      { x: 1254, y: 114, kind: 'mooncake' },
      { x: 1624, y: 128, kind: 'milk' },
      { x: 2354, y: 126, kind: 'feather' }
    ],
    puddles: [
      { x: 742, y: 150, w: 24 },
      { x: 2394, y: 144, w: 24 }
    ],
    crows: [
      { x: 1646, y: 92, rangeX: 52, speed: 1.55, waveAmp: 4, phase: 0.4 }
    ],
    lanterns: [
      { x: 64, y: 148, mount: 'post' },
      { x: 248, y: 132, mount: 'post' },
      { x: 460, y: 116, mount: 'post' },
      { x: 796, y: 136, mount: 'post' },
      { x: 1020, y: 128, mount: 'post' },
      { x: 1388, y: 118, mount: 'post' },
      { x: 1640, y: 132, mount: 'post' },
      { x: 1852, y: 122, mount: 'post' },
      { x: 2224, y: 116, mount: 'post' },
      { x: 2594, y: 130, mount: 'post' }
    ]
  },

  // ==========================================================================
  // BIOME 2 — LEVEL 4: KUIL KELOPAK MALAM (2960 px • Deeper Sakura Challenge)
  // ==========================================================================
  {
    id: 4,
    biome: 'sakura',
    name: 'Kuil Kelopak Malam',
    subtitle: 'Pusaran Angin & Kanopi Tinggi',
    description: 'Melintasi kanopi kuil tua dengan pusaran angin kelopak, landak patroli, dan jalur dahan rapuh.',
    width: 2960,
    height: 216,
    spawn: { x: 28, y: 140 },
    portal: { x: 2880, y: 98 },
    skyTint: { bands: SKY_SAKURA },
    platforms: [
      { x: 0, y: 168, w: 144, h: 64, style: 'sakura' },
      { x: 224, y: 146, w: 144, h: 86, style: 'sakura' },
      { x: 432, y: 156, w: 160, h: 76, style: 'sakura' },
      { x: 744, y: 128, w: 160, h: 104, style: 'sakura' },
      { x: 968, y: 148, w: 160, h: 84, style: 'sakura' },
      // Act 2
      { x: 1296, y: 128, w: 176, h: 104, style: 'sakura' },
      { x: 1344, y: 74, w: 72, h: 16, style: 'sakura' },
      { x: 1548, y: 154, w: 176, h: 78, style: 'sakura' },
      { x: 1896, y: 138, w: 160, h: 94, style: 'sakura' },
      // Act 3
      { x: 2132, y: 152, w: 176, h: 80, style: 'sakura' },
      { x: 2180, y: 90, w: 72, h: 16, style: 'sakura' },
      { x: 2496, y: 136, w: 160, h: 96, style: 'sakura' },
      { x: 2800, y: 138, w: 160, h: 94, style: 'sakura' }
    ],
    movingPlatforms: [
      { x: 614, y: 146, w: 48, h: 10, dx: 74, dy: -16, speed: 1.75, phase: 0 },
      { x: 2678, y: 140, w: 48, h: 10, dx: 64, dy: -8, speed: 1.85, phase: 0.7 }
    ],
    fragileBranches: [
      { x: 1152, y: 142, w: 56 },
      { x: 1224, y: 136, w: 56 },
      { x: 1752, y: 148, w: 56 },
      { x: 1824, y: 142, w: 56 },
      { x: 2336, y: 146, w: 56 },
      { x: 2412, y: 140, w: 56 }
    ],
    bounceClouds: [
      { x: 1308, y: 118, w: 28 },
      { x: 2144, y: 142, w: 28 }
    ],
    checkpoint: { x: 1018, y: 124 },
    checkpoints: [
      { x: 1018, y: 124 },
      { x: 1948, y: 114 }
    ],
    starRingBell: { x: 1632, y: 130 },
    shards: [
      { index: 0, x: 816, y: 82 },
      { index: 1, x: 1374, y: 54 },
      { index: 2, x: 2394, y: 104 }
    ],
    secretAlcoves: [
      { x: 1344, y: 46, w: 72, h: 28, kind: 'canopy' },
      { x: 2180, y: 62, w: 72, h: 28, kind: 'canopy' }
    ],
    hedgehogs: [
      { x: 492, y: 144, minX: 448, maxX: 572, speed: 42 },
      { x: 816, y: 116, minX: 760, maxX: 886, speed: 44 },
      { x: 1620, y: 142, minX: 1564, maxX: 1704, speed: 46 },
      { x: 2564, y: 124, minX: 2512, maxX: 2636, speed: 50 }
    ],
    windVortices: [
      { x: 1164, y: 84, w: 76, h: 64, pushX: -52 },
      { x: 2348, y: 86, w: 78, h: 64, pushX: -56 }
    ],
    npc: {
      x: 2838,
      y: 120,
      name: 'Sora si Burung Hantu',
      kind: 'owl',
      lines: ['Di atas awan sana sangat cerah!', 'Siap menuju Negeri Awan?']
    },
    collectibles: [
      { x: 180, y: 124, kind: 'star' },
      { x: 290, y: 120, kind: 'star' },
      { x: 394, y: 118, kind: 'star' },
      { x: 508, y: 124, kind: 'star' },
      { x: 662, y: 102, kind: 'fish' },
      { x: 820, y: 98, kind: 'star' },
      { x: 932, y: 110, kind: 'star' },
      { x: 1072, y: 122, kind: 'star' },
      { x: 1178, y: 114, kind: 'star' },
      { x: 1248, y: 108, kind: 'star' },
      { x: 1372, y: 54, kind: 'fish' }, // Secret 1!
      { x: 1506, y: 116, kind: 'star' },
      { x: 1632, y: 122, kind: 'star' },
      { x: 1776, y: 118, kind: 'star' },
      { x: 1848, y: 114, kind: 'star' },
      { x: 2004, y: 112, kind: 'fish' },
      { x: 2208, y: 70, kind: 'bigStar' }, // Secret 2!
      { x: 2360, y: 116, kind: 'star' },
      { x: 2436, y: 112, kind: 'star' },
      { x: 2576, y: 106, kind: 'star' },
      { x: 2716, y: 104, kind: 'fish' }
    ],
    powerUps: [
      { x: 254, y: 122, kind: 'mochi' },
      { x: 774, y: 104, kind: 'mooncake' },
      { x: 1424, y: 104, kind: 'bubble' },
      { x: 1986, y: 114, kind: 'milk' },
      { x: 2258, y: 128, kind: 'mooncake' }
    ],
    puddles: [
      { x: 1054, y: 142, w: 24 },
      { x: 2234, y: 146, w: 24 }
    ],
    crows: [
      { x: 394, y: 96, rangeX: 52, speed: 1.65, waveAmp: 4, phase: 0 },
      { x: 1514, y: 92, rangeX: 56, speed: 1.8, waveAmp: 4, phase: 1.2 },
      { x: 2710, y: 88, rangeX: 58, speed: 1.9, waveAmp: 3, phase: 2.1 }
    ],
    lanterns: [
      { x: 64, y: 148, mount: 'post' },
      { x: 236, y: 126, mount: 'post' },
      { x: 444, y: 136, mount: 'post' },
      { x: 754, y: 108, mount: 'post' },
      { x: 980, y: 128, mount: 'post' },
      { x: 1446, y: 108, mount: 'post' },
      { x: 1564, y: 134, mount: 'post' },
      { x: 1912, y: 118, mount: 'post' },
      { x: 2512, y: 116, mount: 'post' },
      { x: 2812, y: 118, mount: 'post' }
    ]
  },

  // ==========================================================================
  // BIOME 3 — LEVEL 5: TANGGA AWAN (2920 px • Storm Clouds, Swoop Crows, Cloud Movers)
  // ==========================================================================
  {
    id: 5,
    biome: 'cloudland',
    name: 'Tangga Awan',
    subtitle: 'Awan Petir & Gagak Peluncur',
    description: 'Melompat di atas awan pastel empuk sambil menghindari awan petir berkedip dan gagak peluncur.',
    width: 2920,
    height: 216,
    spawn: { x: 28, y: 140 },
    portal: { x: 2840, y: 102 },
    skyTint: { bands: SKY_CLOUDLAND },
    platforms: [
      { x: 0, y: 168, w: 160, h: 64, style: 'cloud' },
      { x: 244, y: 148, w: 144, h: 84, style: 'cloud' },
      { x: 464, y: 128, w: 128, h: 104, style: 'cloud' },
      { x: 676, y: 154, w: 160, h: 78, style: 'cloud' },
      { x: 920, y: 136, w: 160, h: 96, style: 'cloud' },
      // Act 2
      { x: 1160, y: 106, w: 112, h: 126, style: 'cloud' },
      { x: 1356, y: 148, w: 160, h: 84, style: 'cloud' },
      { x: 1404, y: 84, w: 72, h: 16, style: 'cloud' },
      { x: 1720, y: 140, w: 160, h: 92, style: 'cloud' },
      { x: 1964, y: 124, w: 144, h: 108, style: 'cloud' },
      // Act 3
      { x: 2300, y: 148, w: 160, h: 84, style: 'cloud' },
      { x: 2348, y: 82, w: 72, h: 16, style: 'cloud' },
      { x: 2544, y: 132, w: 128, h: 100, style: 'cloud' },
      { x: 2748, y: 142, w: 172, h: 90, style: 'cloud' }
    ],
    movingPlatforms: [
      { x: 1544, y: 144, w: 48, h: 10, dx: 110, dy: -12, speed: 1.65, phase: 0.3 },
      { x: 2136, y: 134, w: 48, h: 10, dx: 100, dy: 10, speed: 1.75, phase: 1.1 }
    ],
    bounceClouds: [
      { x: 116, y: 158, w: 28 },
      { x: 344, y: 138, w: 28 },
      { x: 786, y: 144, w: 28 },
      { x: 1036, y: 126, w: 28 },
      { x: 1368, y: 138, w: 28 },
      { x: 2314, y: 138, w: 28 }
    ],
    checkpoint: { x: 964, y: 112 },
    checkpoints: [
      { x: 964, y: 112 },
      { x: 1766, y: 116 }
    ],
    starRingBell: { x: 1428, y: 124 },
    shards: [
      { index: 0, x: 520, y: 88 },
      { index: 1, x: 1434, y: 64 },
      { index: 2, x: 2378, y: 62 }
    ],
    secretAlcoves: [
      { x: 1404, y: 56, w: 72, h: 28, kind: 'cloud' },
      { x: 2348, y: 54, w: 72, h: 28, kind: 'cloud' }
    ],
    stormClouds: [
      { x: 512, y: 74, period: 3.8, offset: 0 },
      { x: 1200, y: 56, period: 3.6, offset: 1.1 },
      { x: 2020, y: 70, period: 3.4, offset: 0.5 },
      { x: 2592, y: 76, period: 3.5, offset: 1.8 }
    ],
    swoopCrows: [
      { x: 868, y: 76, dir: -1 },
      { x: 1664, y: 74, dir: -1 },
      { x: 2496, y: 72, dir: -1 }
    ],
    npc: {
      x: 2806,
      y: 124,
      name: 'Mimi si Kelinci Awan',
      kind: 'bunny',
      lines: ['Awas awan petir berkedip kuning!', 'Coba tahan Lompat saat dapat Bulu~']
    },
    collectibles: [
      { x: 196, y: 112, kind: 'star' },
      { x: 300, y: 124, kind: 'star' },
      { x: 414, y: 94, kind: 'star' },
      { x: 520, y: 102, kind: 'fish' },
      { x: 624, y: 102, kind: 'star' },
      { x: 732, y: 128, kind: 'star' },
      { x: 874, y: 106, kind: 'star' },
      { x: 1004, y: 112, kind: 'star' },
      { x: 1110, y: 76, kind: 'star' },
      { x: 1210, y: 80, kind: 'star' },
      { x: 1432, y: 64, kind: 'fish' }, // Secret 1!
      { x: 1600, y: 106, kind: 'star' },
      { x: 1656, y: 102, kind: 'star' },
      { x: 1832, y: 114, kind: 'star' },
      { x: 1920, y: 98, kind: 'star' },
      { x: 2024, y: 98, kind: 'fish' },
      { x: 2186, y: 104, kind: 'star' },
      { x: 2236, y: 108, kind: 'star' },
      { x: 2376, y: 62, kind: 'bigStar' }, // Secret 2!
      { x: 2596, y: 106, kind: 'star' },
      { x: 2710, y: 108, kind: 'fish' }
    ],
    powerUps: [
      { x: 266, y: 124, kind: 'candy' },
      { x: 702, y: 130, kind: 'bell' },
      { x: 1456, y: 124, kind: 'mooncake' },
      { x: 1812, y: 116, kind: 'milk' },
      { x: 2410, y: 124, kind: 'bubble' }
    ],
    puddles: [
      { x: 738, y: 148, w: 24 },
      { x: 1816, y: 134, w: 24 }
    ],
    crows: [
      { x: 1306, y: 84, rangeX: 54, speed: 1.7, waveAmp: 3, phase: 0.4 }
    ],
    lanterns: [
      { x: 64, y: 148, mount: 'post' },
      { x: 482, y: 108, mount: 'post' },
      { x: 936, y: 116, mount: 'post' },
      { x: 1174, y: 86, mount: 'post' },
      { x: 1736, y: 120, mount: 'post' },
      { x: 1982, y: 104, mount: 'post' },
      { x: 2562, y: 112, mount: 'post' },
      { x: 2766, y: 122, mount: 'post' }
    ]
  },

  // ==========================================================================
  // BIOME 3 — LEVEL 6: ISTANA BINTANG (3100 px • Cloudland Finale)
  // ==========================================================================
  {
    id: 6,
    biome: 'cloudland',
    name: 'Istana Bintang',
    subtitle: 'Badai Kecil & Pulau Awan Tinggi',
    description: 'Taklukkan pulau awan tinggi dengan Permen Pelangi, awan petir beruntun, dan gagak peluncur.',
    width: 3100,
    height: 216,
    spawn: { x: 28, y: 140 },
    portal: { x: 3020, y: 92 },
    skyTint: { bands: SKY_CLOUDLAND },
    platforms: [
      { x: 0, y: 168, w: 128, h: 64, style: 'cloud' },
      { x: 224, y: 140, w: 112, h: 92, style: 'cloud' },
      { x: 516, y: 128, w: 128, h: 104, style: 'cloud' },
      { x: 728, y: 156, w: 144, h: 76, style: 'cloud' },
      { x: 960, y: 132, w: 144, h: 100, style: 'cloud' },
      // Act 2
      { x: 1188, y: 104, w: 112, h: 128, style: 'cloud' },
      { x: 1484, y: 142, w: 160, h: 90, style: 'cloud' },
      { x: 1528, y: 78, w: 72, h: 16, style: 'cloud' },
      { x: 1852, y: 134, w: 144, h: 98, style: 'cloud' },
      { x: 2080, y: 150, w: 160, h: 82, style: 'cloud' },
      // Act 3
      { x: 2436, y: 138, w: 160, h: 94, style: 'cloud' },
      { x: 2480, y: 76, w: 72, h: 16, style: 'cloud' },
      { x: 2680, y: 122, w: 128, h: 110, style: 'cloud' },
      { x: 2932, y: 132, w: 168, h: 100, style: 'cloud' }
    ],
    movingPlatforms: [
      { x: 364, y: 144, w: 48, h: 10, dx: 84, dy: -14, speed: 1.75, phase: 0 },
      { x: 1324, y: 128, w: 48, h: 10, dx: 96, dy: 12, speed: 1.85, phase: 0.9 },
      { x: 1672, y: 140, w: 48, h: 10, dx: 112, dy: -10, speed: 1.9, phase: 1.6 },
      { x: 2266, y: 144, w: 48, h: 10, dx: 106, dy: -10, speed: 1.95, phase: 0.4 },
      { x: 2826, y: 132, w: 48, h: 10, dx: 48, dy: 0, speed: 1.85, phase: 1.2 }
    ],
    bounceClouds: [
      { x: 826, y: 146, w: 28 },
      { x: 1054, y: 122, w: 28 },
      { x: 1496, y: 132, w: 28 },
      { x: 2448, y: 128, w: 28 }
    ],
    checkpoint: { x: 1004, y: 108 },
    checkpoints: [
      { x: 1004, y: 108 },
      { x: 1898, y: 110 }
    ],
    starRingBell: { x: 1556, y: 118 },
    shards: [
      { index: 0, x: 1236, y: 68 },
      { index: 1, x: 2510, y: 56 },
      { index: 2, x: 2886, y: 94 }
    ],
    secretAlcoves: [
      { x: 1528, y: 50, w: 72, h: 28, kind: 'cloud' },
      { x: 2480, y: 48, w: 72, h: 28, kind: 'cloud' }
    ],
    stormClouds: [
      { x: 564, y: 74, period: 3.4, offset: 0 },
      { x: 1232, y: 54, period: 3.3, offset: 0.9 },
      { x: 2144, y: 92, period: 3.2, offset: 1.6 },
      { x: 2728, y: 68, period: 3.1, offset: 0.4 }
    ],
    swoopCrows: [
      { x: 468, y: 74, dir: -1 },
      { x: 1420, y: 70, dir: -1 },
      { x: 2040, y: 74, dir: -1 },
      { x: 2644, y: 68, dir: -1 }
    ],
    npc: {
      x: 2984,
      y: 114,
      name: 'Luna si Penjaga',
      kind: 'kitten',
      lines: ['Cahaya bintang menyertaimu!', 'Dermaga laut ada di bawah sana~']
    },
    collectibles: [
      { x: 176, y: 118, kind: 'star' },
      { x: 274, y: 114, kind: 'star' },
      { x: 406, y: 106, kind: 'star' },
      { x: 452, y: 100, kind: 'fish' },
      { x: 568, y: 102, kind: 'star' },
      { x: 682, y: 112, kind: 'star' },
      { x: 780, y: 128, kind: 'star' },
      { x: 904, y: 102, kind: 'star' },
      { x: 1124, y: 74, kind: 'star' },
      { x: 1240, y: 78, kind: 'star' },
      { x: 1372, y: 98, kind: 'star' },
      { x: 1556, y: 58, kind: 'fish' }, // Secret 1!
      { x: 1732, y: 102, kind: 'star' },
      { x: 1784, y: 98, kind: 'star' },
      { x: 1948, y: 108, kind: 'star' },
      { x: 2148, y: 122, kind: 'fish' },
      { x: 2318, y: 108, kind: 'star' },
      { x: 2368, y: 104, kind: 'star' },
      { x: 2508, y: 56, kind: 'bigStar' }, // Secret 2!
      { x: 2736, y: 96, kind: 'star' },
      { x: 2956, y: 106, kind: 'fish' }
    ],
    powerUps: [
      { x: 244, y: 116, kind: 'candy' },
      { x: 754, y: 132, kind: 'mooncake' },
      { x: 1204, y: 80, kind: 'bell' },
      { x: 1940, y: 110, kind: 'milk' },
      { x: 2104, y: 126, kind: 'candy' },
      { x: 2546, y: 114, kind: 'mooncake' }
    ],
    puddles: [
      { x: 564, y: 122, w: 24 },
      { x: 2148, y: 144, w: 24 }
    ],
    crows: [
      { x: 896, y: 92, rangeX: 54, speed: 1.85, waveAmp: 4, phase: 1.0 },
      { x: 1744, y: 84, rangeX: 60, speed: 1.95, waveAmp: 4, phase: 2.1 }
    ],
    lanterns: [
      { x: 54, y: 148, mount: 'post' },
      { x: 528, y: 108, mount: 'post' },
      { x: 974, y: 112, mount: 'post' },
      { x: 1866, y: 114, mount: 'post' },
      { x: 2694, y: 102, mount: 'post' },
      { x: 2944, y: 112, mount: 'post' }
    ]
  },

  // ==========================================================================
  // BIOME 4 — LEVEL 7: DERMAGA CAHAYA (3060 px • Crabs, Wisps, Floating Boats)
  // ==========================================================================
  {
    id: 7,
    biome: 'harbor',
    name: 'Dermaga Cahaya',
    subtitle: 'Perahu Mengapung, Kepiting & Api Lentera',
    description: 'Susuri dermaga laut panjang di atas perahu kayu mengapung, hindari kepiting gesit dan api lentera.',
    width: 3060,
    height: 216,
    spawn: { x: 28, y: 140 },
    portal: { x: 2980, y: 108 },
    skyTint: { bands: SKY_HARBOR },
    platforms: [
      { x: 0, y: 168, w: 160, h: 64, style: 'harbor' },
      { x: 244, y: 156, w: 176, h: 76, style: 'harbor' },
      { x: 492, y: 142, w: 160, h: 90, style: 'harbor' },
      { x: 840, y: 154, w: 176, h: 78, style: 'harbor' },
      // Act 2: Floating Boats + Wisps + Secret 1
      { x: 1092, y: 136, w: 176, h: 96, style: 'harbor' },
      { x: 1144, y: 78, w: 72, h: 16, style: 'harbor' },
      { x: 1472, y: 148, w: 176, h: 84, style: 'harbor' },
      { x: 1724, y: 136, w: 176, h: 96, style: 'harbor' },
      // Act 3: Crabs + Floating Boats + Secret 2 + Portal
      { x: 2104, y: 150, w: 192, h: 82, style: 'harbor' },
      { x: 2164, y: 84, w: 72, h: 16, style: 'harbor' },
      { x: 2496, y: 136, w: 160, h: 96, style: 'harbor' },
      { x: 2876, y: 148, w: 184, h: 84, style: 'harbor' }
    ],
    movingPlatforms: [
      { x: 2684, y: 144, w: 48, h: 10, dx: 114, dy: -6, speed: 1.9, phase: 0.4 }
    ],
    floatingBoats: [
      { x: 678, y: 162, w: 56, dx: 76, speed: 1.25, phase: 0 },
      { x: 1296, y: 162, w: 56, dx: 96, speed: 1.35, phase: 0.9 },
      { x: 1928, y: 162, w: 56, dx: 94, speed: 1.45, phase: 1.7 },
      { x: 2324, y: 162, w: 56, dx: 92, speed: 1.5, phase: 0.5 }
    ],
    bounceClouds: [
      { x: 1104, y: 126, w: 28 },
      { x: 2120, y: 140, w: 28 }
    ],
    checkpoint: { x: 892, y: 130 },
    checkpoints: [
      { x: 892, y: 130 },
      { x: 1784, y: 112 }
    ],
    starRingBell: { x: 1554, y: 124 },
    shards: [
      { index: 0, x: 564, y: 98 },
      { index: 1, x: 1174, y: 58 },
      { index: 2, x: 2394, y: 124 }
    ],
    secretAlcoves: [
      { x: 1144, y: 50, w: 72, h: 28, kind: 'sail' },
      { x: 2164, y: 56, w: 72, h: 28, kind: 'sail' }
    ],
    crabs: [
      { x: 310, y: 146, minX: 258, maxX: 396, speed: 52 },
      { x: 1540, y: 138, minX: 1488, maxX: 1626, speed: 58 },
      { x: 2210, y: 140, minX: 2160, maxX: 2274, speed: 62 },
      { x: 2564, y: 126, minX: 2512, maxX: 2634, speed: 64 }
    ],
    wisps: [
      { x: 742, y: 118, ampY: 22, speed: 2.1, phase: 0 },
      { x: 1372, y: 118, ampY: 24, speed: 2.2, phase: 1.0 },
      { x: 2002, y: 118, ampY: 24, speed: 2.3, phase: 2.0 },
      { x: 2766, y: 108, ampY: 24, speed: 2.4, phase: 0.6 }
    ],
    npc: {
      x: 2944,
      y: 130,
      name: 'Koi si Burung Hantu Laut',
      kind: 'owl',
      lines: ['Ombak malam ini sangat damai.', 'Mercusuar terakhir sudah dekat!']
    },
    collectibles: [
      { x: 112, y: 144, kind: 'star' },
      { x: 200, y: 128, kind: 'star' },
      { x: 326, y: 128, kind: 'star' },
      { x: 452, y: 116, kind: 'star' },
      { x: 568, y: 116, kind: 'fish' },
      { x: 728, y: 128, kind: 'star' },
      { x: 780, y: 126, kind: 'star' },
      { x: 944, y: 128, kind: 'star' },
      { x: 1048, y: 108, kind: 'star' },
      { x: 1172, y: 58, kind: 'fish' }, // Secret 1!
      { x: 1356, y: 126, kind: 'star' },
      { x: 1412, y: 124, kind: 'star' },
      { x: 1554, y: 122, kind: 'star' },
      { x: 1684, y: 112, kind: 'star' },
      { x: 1844, y: 110, kind: 'fish' },
      { x: 1986, y: 126, kind: 'star' },
      { x: 2044, y: 124, kind: 'star' },
      { x: 2192, y: 64, kind: 'bigStar' }, // Secret 2!
      { x: 2388, y: 124, kind: 'star' },
      { x: 2576, y: 108, kind: 'star' },
      { x: 2746, y: 106, kind: 'fish' }
    ],
    powerUps: [
      { x: 266, y: 132, kind: 'pearl' },
      { x: 860, y: 130, kind: 'mooncake' },
      { x: 1496, y: 124, kind: 'bubble' },
      { x: 1816, y: 112, kind: 'milk' },
      { x: 2516, y: 112, kind: 'mooncake' }
    ],
    puddles: [
      { x: 544, y: 136, w: 24 },
      { x: 954, y: 148, w: 24 }
    ],
    crows: [
      { x: 1044, y: 92, rangeX: 52, speed: 1.85, waveAmp: 4, phase: 0.5 },
      { x: 2402, y: 90, rangeX: 58, speed: 1.95, waveAmp: 4, phase: 1.4 }
    ],
    lanterns: [
      { x: 62, y: 148, mount: 'post' },
      { x: 252, y: 136, mount: 'post' },
      { x: 506, y: 122, mount: 'post' },
      { x: 856, y: 134, mount: 'post' },
      { x: 1236, y: 116, mount: 'post' },
      { x: 1486, y: 128, mount: 'post' },
      { x: 1742, y: 116, mount: 'post' },
      { x: 2262, y: 130, mount: 'post' },
      { x: 2624, y: 116, mount: 'post' },
      { x: 2896, y: 128, mount: 'post' }
    ]
  },

  // ==========================================================================
  // BIOME 4 — LEVEL 8: MERCUSUAR BINTANG (3280 px • Grand Finale!)
  // ==========================================================================
  {
    id: 8,
    biome: 'harbor',
    name: 'Mercusuar Bintang',
    subtitle: 'Ujian Puncak Dermaga Lampion',
    description: 'Tahap pamungkas terpanjang menggabungkan kepiting gesit, api lentera, perahu goyang, dan celah presisi!',
    width: 3280,
    height: 216,
    spawn: { x: 28, y: 140 },
    portal: { x: 3200, y: 94 },
    skyTint: { bands: SKY_HARBOR },
    platforms: [
      { x: 0, y: 168, w: 128, h: 64, style: 'harbor' },
      { x: 216, y: 148, w: 144, h: 84, style: 'harbor' },
      { x: 432, y: 156, w: 160, h: 76, style: 'harbor' },
      { x: 788, y: 126, w: 144, h: 106, style: 'harbor' },
      { x: 1004, y: 144, w: 160, h: 88, style: 'harbor' },
      // Act 2: Boats + Wisps + Crabs + Secret 1
      { x: 1364, y: 132, w: 176, h: 100, style: 'harbor' },
      { x: 1412, y: 74, w: 72, h: 16, style: 'harbor' },
      { x: 1612, y: 152, w: 160, h: 80, style: 'harbor' },
      { x: 1972, y: 136, w: 160, h: 96, style: 'harbor' },
      // Act 3: Precision Finale + Secret 2 + Moon Portal
      { x: 2212, y: 148, w: 176, h: 84, style: 'harbor' },
      { x: 2264, y: 82, w: 72, h: 16, style: 'harbor' },
      { x: 2592, y: 134, w: 144, h: 98, style: 'harbor' },
      { x: 2816, y: 142, w: 128, h: 90, style: 'harbor' },
      { x: 3100, y: 134, w: 180, h: 98, style: 'harbor' }
    ],
    movingPlatforms: [
      { x: 616, y: 144, w: 48, h: 10, dx: 96, dy: -16, speed: 1.95, phase: 0 },
      { x: 2964, y: 138, w: 48, h: 10, dx: 76, dy: -8, speed: 2.1, phase: 0.7 }
    ],
    floatingBoats: [
      { x: 1188, y: 162, w: 56, dx: 96, speed: 1.45, phase: 0 },
      { x: 1796, y: 162, w: 56, dx: 98, speed: 1.55, phase: 1.1 },
      { x: 2412, y: 162, w: 56, dx: 100, speed: 1.65, phase: 0.4 }
    ],
    bounceClouds: [
      { x: 1374, y: 122, w: 28 },
      { x: 2224, y: 138, w: 28 }
    ],
    checkpoint: { x: 1054, y: 120 },
    checkpoints: [
      { x: 1054, y: 120 },
      { x: 2022, y: 112 }
    ],
    starRingBell: { x: 1684, y: 128 },
    shards: [
      { index: 0, x: 854, y: 84 },
      { index: 1, x: 2294, y: 62 },
      { index: 2, x: 3032, y: 92 }
    ],
    secretAlcoves: [
      { x: 1412, y: 46, w: 72, h: 28, kind: 'sail' },
      { x: 2264, y: 54, w: 72, h: 28, kind: 'sail' }
    ],
    crabs: [
      { x: 274, y: 138, minX: 230, maxX: 340, speed: 58 },
      { x: 496, y: 146, minX: 448, maxX: 572, speed: 62 },
      { x: 1680, y: 142, minX: 1628, maxX: 1752, speed: 66 },
      { x: 2652, y: 124, minX: 2608, maxX: 2716, speed: 68 },
      { x: 2872, y: 132, minX: 2830, maxX: 2926, speed: 70 }
    ],
    wisps: [
      { x: 704, y: 104, ampY: 24, speed: 2.2, phase: 0 },
      { x: 1264, y: 116, ampY: 26, speed: 2.3, phase: 1.1 },
      { x: 1872, y: 114, ampY: 26, speed: 2.4, phase: 2.2 },
      { x: 2486, y: 114, ampY: 26, speed: 2.5, phase: 0.6 },
      { x: 3022, y: 102, ampY: 24, speed: 2.5, phase: 1.5 }
    ],
    npc: {
      x: 3164,
      y: 116,
      name: 'Nori si Penjaga Bintang',
      kind: 'kitten',
      lines: ['Luar biasa! Kamu sampai akhir!', 'Bulan purnama menunggumu di dermaga~']
    },
    collectibles: [
      { x: 170, y: 124, kind: 'star' },
      { x: 284, y: 122, kind: 'star' },
      { x: 392, y: 116, kind: 'star' },
      { x: 508, y: 128, kind: 'star' },
      { x: 676, y: 102, kind: 'fish' },
      { x: 856, y: 100, kind: 'star' },
      { x: 966, y: 104, kind: 'star' },
      { x: 1108, y: 118, kind: 'star' },
      { x: 1248, y: 124, kind: 'star' },
      { x: 1304, y: 122, kind: 'star' },
      { x: 1440, y: 54, kind: 'fish' }, // Secret 1!
      { x: 1574, y: 116, kind: 'star' },
      { x: 1692, y: 124, kind: 'star' },
      { x: 1854, y: 124, kind: 'star' },
      { x: 1910, y: 120, kind: 'star' },
      { x: 2068, y: 110, kind: 'fish' },
      { x: 2292, y: 62, kind: 'bigStar' }, // Secret 2!
      { x: 2468, y: 122, kind: 'star' },
      { x: 2662, y: 106, kind: 'star' },
      { x: 2876, y: 114, kind: 'star' },
      { x: 3136, y: 106, kind: 'fish' }
    ],
    powerUps: [
      { x: 236, y: 124, kind: 'pearl' },
      { x: 814, y: 102, kind: 'mooncake' },
      { x: 1492, y: 108, kind: 'milk' },
      { x: 1990, y: 112, kind: 'bubble' },
      { x: 2334, y: 124, kind: 'bell' },
      { x: 2612, y: 110, kind: 'mooncake' }
    ],
    puddles: [
      { x: 846, y: 120, w: 24 },
      { x: 1676, y: 146, w: 24 }
    ],
    crows: [
      { x: 392, y: 98, rangeX: 52, speed: 1.8, waveAmp: 3, phase: 0 },
      { x: 1574, y: 88, rangeX: 56, speed: 1.95, waveAmp: 4, phase: 1.1 },
      { x: 2774, y: 86, rangeX: 60, speed: 2.05, waveAmp: 4, phase: 2.0 }
    ],
    lanterns: [
      { x: 64, y: 148, mount: 'post' },
      { x: 228, y: 128, mount: 'post' },
      { x: 446, y: 136, mount: 'post' },
      { x: 800, y: 106, mount: 'post' },
      { x: 1020, y: 124, mount: 'post' },
      { x: 1510, y: 112, mount: 'post' },
      { x: 1626, y: 132, mount: 'post' },
      { x: 1986, y: 116, mount: 'post' },
      { x: 2354, y: 128, mount: 'post' },
      { x: 2710, y: 114, mount: 'post' },
      { x: 3118, y: 114, mount: 'post' }
    ]
  }
]

/**
 * Complete 14-Level World Roster:
 * - Levels 1–8: Extended (~1.5x) across Biomes 1–4 (Rooftops, Sakura, Cloudland, Harbor)
 * - Levels 9–12: New Biomes 5–6 (Crystal Mushroom Cavern & Clockwork Observatory)
 * - Levels 13–14: Unlockable Secret Finale Boss Stages (Eclipse Sanctum & Astral Core Citadel)
 */
export const LEVELS: LevelDefinition[] = [
  ...BASE_LEVELS.map(extendBaseLevel),
  ...EXPANSION_LEVELS
]
