import { LEVELS } from './levels'
import type {
  BiomeId,
  CapeDef,
  CapeId,
  CharacterDef,
  CharacterId,
  HatDef,
  HatId,
  MissionProgressInfo,
  SaveProgress,
  ScarfColorDef,
  ScarfColorId
} from './types'

// ============================================================================
// 8 ANIMAL CHARACTERS (5 Regular Fish-Buyable Cats + 3 Special Mission Animals)
// ============================================================================

export const CHARACTERS: CharacterDef[] = [
  // Regular Characters (Unlocked by Golden Fish)
  {
    id: 'cat-mochi',
    name: 'Kucing Putih Mochi',
    species: 'cat',
    category: 'Kucing',
    description: 'Bulu putih bersih lembut dengan pipi merah muda yang manis.',
    perkTitle: 'Lincah di Udara',
    perkDesc: 'Kontrol udara lebih lincah & belok lebih cepat.',
    unlockMode: 'regular',
    cost: 0
  },
  {
    id: 'cat-calico',
    name: 'Kucing Calico',
    species: 'cat',
    category: 'Kucing',
    description: 'Kucing belang tiga dengan corak oranye hangat dan cokelat tua.',
    perkTitle: 'Lincah di Udara',
    perkDesc: 'Kontrol udara lebih lincah & belok lebih cepat.',
    unlockMode: 'regular',
    cost: 3
  },
  {
    id: 'cat-ginger',
    name: 'Kucing Oren',
    species: 'cat',
    category: 'Kucing',
    description: 'Ginger Tabby berbulu oranye keemasan ceria dengan garis lembut.',
    perkTitle: 'Lincah di Udara',
    perkDesc: 'Kontrol udara lebih lincah & belok lebih cepat.',
    unlockMode: 'regular',
    cost: 5
  },
  {
    id: 'cat-midnight',
    name: 'Kucing Hitam Malam',
    species: 'cat',
    category: 'Kucing',
    description: 'Midnight Cat berbulu hitam keunguan pekat bermata emas bersinar.',
    perkTitle: 'Lincah di Udara',
    perkDesc: 'Kontrol udara lebih lincah & belok lebih cepat.',
    unlockMode: 'regular',
    cost: 7
  },
  {
    id: 'cat-blue',
    name: 'Kucing Abu-Abu',
    species: 'cat',
    category: 'Kucing',
    description: 'Russian Blue berbulu abu-abu kebiruan pastel yang tenang.',
    perkTitle: 'Lincah di Udara',
    perkDesc: 'Kontrol udara lebih lincah & belok lebih cepat.',
    unlockMode: 'regular',
    cost: 9
  },

  // Special Characters (Unlocked ONLY via Special Missions!)
  {
    id: 'bunny-starlight',
    name: 'Kelinci Putih',
    species: 'bunny',
    category: 'Kelinci',
    description: 'Starlight Bunny bertelinga panjang lentur dan ekor pom-pom bulat.',
    perkTitle: 'Lompatan Tinggi +10%',
    perkDesc: 'Lompatan dasar +10% lebih tinggi dari hewan lain.',
    unlockMode: 'mission',
    cost: 0,
    missionTitle: 'Kolektor Ikan Malam',
    missionDesc: 'Kumpulkan total 25 Ikan Emas sepanjang permainan.'
  },
  {
    id: 'dog-shiba',
    name: 'Anjing Shiba Inu',
    species: 'shiba',
    category: 'Anjing',
    description: 'Bulu tan keemasan, pipi & perut krim khas Shiba, ekor melingkar.',
    perkTitle: 'Dash Jauh & Kebal Angin',
    perkDesc: 'Jarak Dash lebih jauh & tahan dorongan pusaran angin.',
    unlockMode: 'mission',
    cost: 0,
    missionTitle: 'Penjelajah 4 Dunia',
    missionDesc: 'Selesaikan minimal 6 level atau seluruh 4 dunia malam.'
  },
  {
    id: 'dog-samoyed',
    name: 'Anjing Putih',
    species: 'samoyed',
    category: 'Anjing',
    description: 'Samoyed/Maltese berbulu mengembang, telinga bulat, dan ekor melengkung.',
    perkTitle: 'Dash Jauh & Kebal Angin',
    perkDesc: 'Jarak Dash lebih jauh & tahan dorongan pusaran angin.',
    unlockMode: 'mission',
    cost: 0,
    missionTitle: 'Juara Mercusuar Bintang',
    missionDesc: 'Tamatkan Level 8 dengan minimal 2 Bintang (⭐⭐).'
  }
]

// ============================================================================
// SECTION 1: SCARVES (6 Individual Color Variants + Dash Afterimage Color)
// ============================================================================

export const SCARF_COLORS: ScarfColorDef[] = [
  {
    id: 'pink',
    name: 'Syal Pink Pastel',
    cost: 0,
    main: '#ff6f9c',
    dark: '#c93c6d',
    light: '#ffc4db',
    ghost: '#ffaad2',
    spark: '#ffb8da',
    swatch: '#ff8cb8'
  },
  {
    id: 'sky',
    name: 'Syal Biru Langit',
    cost: 2,
    main: '#59c2ff',
    dark: '#2a7ec2',
    light: '#c4ecff',
    ghost: '#9ce2ff',
    spark: '#a8ebff',
    swatch: '#6cc8ff'
  },
  {
    id: 'gold',
    name: 'Syal Emas Bintang',
    cost: 3,
    main: '#ffc940',
    dark: '#c78316',
    light: '#fff2a6',
    ghost: '#ffe680',
    spark: '#ffea8a',
    swatch: '#ffd54f'
  },
  {
    id: 'purple',
    name: 'Syal Ungu Malam',
    cost: 4,
    main: '#a974ff',
    dark: '#6c3dc2',
    light: '#e2ccff',
    ghost: '#caa6ff',
    spark: '#d5b5ff',
    swatch: '#b07aff'
  },
  {
    id: 'mint',
    name: 'Syal Hijau Mint',
    cost: 3,
    main: '#5cdba8',
    dark: '#299672',
    light: '#c4fce4',
    ghost: '#96f2cc',
    spark: '#b0fae0',
    swatch: '#6ee6b8'
  },
  {
    id: 'ruby',
    name: 'Syal Merah Ruby',
    cost: 4,
    main: '#e83f5b',
    dark: '#9e1c38',
    light: '#ff9ead',
    ghost: '#ff7a92',
    spark: '#ff96a8',
    swatch: '#e83f5b'
  },
  {
    id: 'lightning',
    name: 'Lightning Scarf',
    cost: 0,
    main: '#ffe84d',
    dark: '#2ea8ff',
    light: '#ffffff',
    ghost: '#9ef2ff',
    spark: '#fff275',
    swatch: '#ffe84d',
    unlockStampId: 'lightning-stray'
  },
  {
    id: 'lantern-gold',
    name: 'Golden Lantern Scarf',
    cost: 0,
    main: '#d9364e',
    dark: '#911c33',
    light: '#ffcf4d',
    ghost: '#ffcf66',
    spark: '#fff2a6',
    swatch: '#ffbe3b',
    shardUnlockBiome: 'harbor'
  }
]

// ============================================================================
// SECTION 2: HATS (11 Individual Variants Bought Separately with Golden Fish)
// ============================================================================

export const HATS: HatDef[] = [
  {
    id: 'none',
    model: 'none',
    groupName: 'Default',
    colorName: 'Polos',
    name: 'Tanpa Topi',
    cost: 0,
    primary: 'transparent',
    secondary: 'transparent',
    accent: 'transparent',
    outline: 'transparent',
    swatch: '#4a2f63'
  },
  // Baret Pelukis
  {
    id: 'beret-pink',
    model: 'beret',
    groupName: 'Baret Pelukis',
    colorName: 'Pink Pastel',
    name: 'Baret Pink Pastel',
    cost: 3,
    primary: '#ff8fb8',
    secondary: '#d95d8e',
    accent: '#ffd6e8',
    outline: '#2b1336',
    swatch: '#ff8fb8'
  },
  {
    id: 'beret-sky',
    model: 'beret',
    groupName: 'Baret Pelukis',
    colorName: 'Biru Langit',
    name: 'Baret Biru Langit',
    cost: 3,
    primary: '#6ec4ff',
    secondary: '#3782c7',
    accent: '#c9ebff',
    outline: '#1c1b3b',
    swatch: '#6ec4ff'
  },
  {
    id: 'beret-cream',
    model: 'beret',
    groupName: 'Baret Pelukis',
    colorName: 'Krem Hangat',
    name: 'Baret Krem Hangat',
    cost: 4,
    primary: '#f5d7a8',
    secondary: '#c49660',
    accent: '#fff5e0',
    outline: '#2e1a2b',
    swatch: '#f5d7a8'
  },
  // Biome 1 (Starlight Rooftops) 6/6 Shard Reward Cosmetic!
  {
    id: 'beret-starlight',
    model: 'beret',
    groupName: 'Biome Reward • Atap',
    colorName: 'Biru Bintang',
    name: 'Starlight Beret',
    cost: 0,
    primary: '#24408f',
    secondary: '#14265c',
    accent: '#ffe375',
    outline: '#0d1536',
    swatch: '#3a62c9',
    shardUnlockBiome: 'rooftops'
  },
  // Topi Penyihir Malam
  {
    id: 'witch-purple',
    model: 'witch',
    groupName: 'Topi Penyihir Malam',
    colorName: 'Ungu Malam',
    name: 'Penyihir Ungu Malam',
    cost: 5,
    primary: '#63379c',
    secondary: '#411e6e',
    accent: '#ffd85c',
    outline: '#190b2b',
    swatch: '#63379c'
  },
  {
    id: 'witch-blackgold',
    model: 'witch',
    groupName: 'Topi Penyihir Malam',
    colorName: 'Hitam Emas',
    name: 'Penyihir Hitam Emas',
    cost: 6,
    primary: '#2c223d',
    secondary: '#181124',
    accent: '#ffcf40',
    outline: '#0d0714',
    swatch: '#2c223d'
  },
  {
    id: 'witch-starblue',
    model: 'witch',
    groupName: 'Topi Penyihir Malam',
    colorName: 'Biru Bintang',
    name: 'Penyihir Biru Bintang',
    cost: 6,
    primary: '#2a4f9e',
    secondary: '#18316e',
    accent: '#9ee8ff',
    outline: '#101936',
    swatch: '#2a4f9e'
  },
  // Jepit Tunas / Bunga
  {
    id: 'clip-sprout',
    model: 'clip',
    groupName: 'Jepit Tunas / Bunga',
    colorName: 'Tunas Hijau',
    name: 'Jepit Tunas Hijau',
    cost: 2,
    primary: '#5fd68c',
    secondary: '#2e995d',
    accent: '#c2ffcf',
    outline: '#183328',
    swatch: '#5fd68c'
  },
  {
    id: 'clip-sakura',
    model: 'clip',
    groupName: 'Jepit Tunas / Bunga',
    colorName: 'Bunga Sakura Pink',
    name: 'Jepit Bunga Sakura',
    cost: 3,
    primary: '#ff9ec4',
    secondary: '#e06798',
    accent: '#fff2a6',
    outline: '#361530',
    swatch: '#ff9ec4'
  },
  // Mahkota Mini
  {
    id: 'crown-gold',
    model: 'crown',
    groupName: 'Mahkota Mini',
    colorName: 'Emas Bintang',
    name: 'Mahkota Emas Bintang',
    cost: 7,
    primary: '#ffd54f',
    secondary: '#d9931c',
    accent: '#fff9cc',
    outline: '#331b26',
    swatch: '#ffd54f'
  },
  {
    id: 'crown-silver',
    model: 'crown',
    groupName: 'Mahkota Mini',
    colorName: 'Perak Bulan',
    name: 'Mahkota Perak Bulan',
    cost: 7,
    primary: '#dce6f7',
    secondary: '#8da1c4',
    accent: '#9ef0ff',
    outline: '#1d2238',
    swatch: '#dce6f7'
  }
]

// ============================================================================
// SECTION 3: CAPES (8 Individual Variants Bought Separately with Golden Fish)
// ============================================================================

export const CAPES: CapeDef[] = [
  {
    id: 'none',
    model: 'none',
    groupName: 'Default',
    colorName: 'Polos',
    name: 'Tanpa Jubah',
    cost: 0,
    primary: 'transparent',
    secondary: 'transparent',
    accent: 'transparent',
    outline: 'transparent',
    swatch: '#4a2f63'
  },
  // Jubah Penjelajah
  {
    id: 'cloak-navy',
    model: 'cloak',
    groupName: 'Jubah Penjelajah',
    colorName: 'Biru Malam',
    name: 'Jubah Biru Malam',
    cost: 4,
    primary: '#355499',
    secondary: '#213669',
    accent: '#94c4ff',
    outline: '#131936',
    swatch: '#355499'
  },
  {
    id: 'cloak-emerald',
    model: 'cloak',
    groupName: 'Jubah Penjelajah',
    colorName: 'Hijau Zamrud',
    name: 'Jubah Hijau Zamrud',
    cost: 4,
    primary: '#2c997a',
    secondary: '#1a6653',
    accent: '#8ef5cf',
    outline: '#112e2a',
    swatch: '#2c997a'
  },
  {
    id: 'cloak-brown',
    model: 'cloak',
    groupName: 'Jubah Penjelajah',
    colorName: 'Cokelat Hangat',
    name: 'Jubah Cokelat Hangat',
    cost: 4,
    primary: '#9c6244',
    secondary: '#693c28',
    accent: '#e8be96',
    outline: '#2b1615',
    swatch: '#9c6244'
  },
  // Jubah Kerajaan
  {
    id: 'royal-maroon',
    model: 'royal',
    groupName: 'Jubah Kerajaan',
    colorName: 'Merah Marun',
    name: 'Jubah Merah Marun',
    cost: 6,
    primary: '#a62646',
    secondary: '#6e142c',
    accent: '#ffd85c',
    outline: '#290c1a',
    swatch: '#a62646'
  },
  {
    id: 'royal-purple',
    model: 'royal',
    groupName: 'Jubah Kerajaan',
    colorName: 'Ungu Kerajaan',
    name: 'Jubah Ungu Kerajaan',
    cost: 6,
    primary: '#7238a8',
    secondary: '#491d75',
    accent: '#ffe169',
    outline: '#1e0b36',
    swatch: '#7238a8'
  },
  // Sayap Peri Kecil
  {
    id: 'wings-pink',
    model: 'wings',
    groupName: 'Sayap Peri Kecil',
    colorName: 'Pink Pastel',
    name: 'Sayap Peri Pink',
    cost: 8,
    primary: '#ffb8da',
    secondary: '#eb78b2',
    accent: '#fff5fa',
    outline: '#592348',
    swatch: '#ffb8da'
  },
  {
    id: 'wings-crystal',
    model: 'wings',
    groupName: 'Sayap Peri Kecil',
    colorName: 'Biru Kristal',
    name: 'Sayap Biru Kristal',
    cost: 8,
    primary: '#9ee8ff',
    secondary: '#54a9e6',
    accent: '#ffffff',
    outline: '#1f426e',
    swatch: '#9ee8ff'
  },
  // Biome 2 (Midnight Sakura Woods) & Biome 3 (Pastel Cloudland) 6/6 Shard Reward Cosmetics!
  {
    id: 'cape-sakura-petal',
    model: 'cloak',
    groupName: 'Biome Reward • Sakura',
    colorName: 'Kelopak Sakura',
    name: 'Sakura Petal Cape',
    cost: 0,
    primary: '#ff9ec9',
    secondary: '#d4508b',
    accent: '#fff0f7',
    outline: '#3b132e',
    swatch: '#ff9ec9',
    shardUnlockBiome: 'sakura'
  },
  {
    id: 'wings-cloud-pastel',
    model: 'wings',
    groupName: 'Biome Reward • Awan',
    colorName: 'Awan Pastel',
    name: 'Cloud Wings Cape',
    cost: 0,
    primary: '#f2f9ff',
    secondary: '#b3e3ff',
    accent: '#ffffff',
    outline: '#355c87',
    swatch: '#d9f2ff',
    shardUnlockBiome: 'cloudland'
  }
]

export interface BiomeRewardDescriptor {
  biome: 'rooftops' | 'sakura' | 'cloudland' | 'harbor'
  slot: 'hat' | 'cape' | 'scarf'
  id: string
  name: string
}

export const BIOME_SHARD_REWARDS: Record<'rooftops' | 'sakura' | 'cloudland' | 'harbor', BiomeRewardDescriptor> = {
  rooftops: { biome: 'rooftops', slot: 'hat', id: 'beret-starlight', name: 'Starlight Beret' },
  sakura: { biome: 'sakura', slot: 'cape', id: 'cape-sakura-petal', name: 'Sakura Petal Cape' },
  cloudland: { biome: 'cloudland', slot: 'cape', id: 'wings-cloud-pastel', name: 'Cloud Wings Cape' },
  harbor: { biome: 'harbor', slot: 'scarf', id: 'lantern-gold', name: 'Golden Lantern Scarf' }
}

// ============================================================================
// LOOKUPS & SPECIAL CHARACTER MISSION EVALUATION
// ============================================================================

export function getCharacterById(id: CharacterId): CharacterDef {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0]!
}

export function getScarfById(id: ScarfColorId): ScarfColorDef {
  return SCARF_COLORS.find((s) => s.id === id) ?? SCARF_COLORS[0]!
}

export function getHatById(id: HatId): HatDef {
  return HATS.find((h) => h.id === id) ?? HATS[0]!
}

export function getCapeById(id: CapeId): CapeDef {
  return CAPES.find((c) => c.id === id) ?? CAPES[0]!
}

export function getCharacterMissionProgress(id: CharacterId, progress: SaveProgress): MissionProgressInfo {
  if (id === 'bunny-starlight') {
    const cur = Math.min(25, progress.totalFishEarned)
    const done = progress.totalFishEarned >= 25
    return {
      completed: done,
      current: cur,
      target: 25,
      label: done ? '25 / 25 Ikan Emas ✓' : `${cur} / 25 Ikan Emas`
    }
  }

  if (id === 'dog-shiba') {
    const completedLevelIds = Object.entries(progress.levelRecords)
      .filter(([, rec]) => rec && rec.rating >= 1)
      .map(([lvlId]) => Number(lvlId))

    const completedBiomes = new Set<BiomeId>()
    for (const lvlId of completedLevelIds) {
      const lvl = LEVELS.find((l) => l.id === lvlId)
      if (lvl) completedBiomes.add(lvl.biome)
    }

    const done = completedBiomes.size >= 4 || completedLevelIds.length >= 6
    const curLevels = Math.min(6, completedLevelIds.length)
    return {
      completed: done,
      current: done ? 6 : curLevels,
      target: 6,
      label: done
        ? `${completedLevelIds.length}/6 Level • ${completedBiomes.size}/4 Dunia ✓`
        : `${curLevels}/6 Level • ${completedBiomes.size}/4 Dunia`
    }
  }

  if (id === 'dog-samoyed') {
    const lvl8Rating = progress.levelRecords[8]?.rating ?? 0
    const cur = Math.min(2, lvl8Rating)
    const done = lvl8Rating >= 2
    return {
      completed: done,
      current: cur,
      target: 2,
      label: done ? `Level 8: ${lvl8Rating} ★ ✓` : `Level 8: ${lvl8Rating} / 2 ★`
    }
  }

  return {
    completed: progress.unlockedCharacters.includes(id),
    current: 1,
    target: 1,
    label: 'Terbuka'
  }
}
