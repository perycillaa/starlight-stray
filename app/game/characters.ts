import { LEVELS } from './levels'
import type {
  BiomeId,
  CapeDef,
  CapeId,
  CharacterDef,
  CharacterId,
  FaceAccDef,
  FaceAccId,
  HatDef,
  HatId,
  HeadAccDef,
  HeadAccId,
  MissionProgressInfo,
  SaveProgress,
  ScarfColorDef,
  ScarfColorId
} from './types'

// ============================================================================
// 13 ANIMAL CHARACTERS (7 Regular Fish-Buyable + 6 Special Mission Animals)
// Every single character has its own unique passive — even within the same species!
// Special Mission characters grant upgraded multi-effect signature passives.
// ============================================================================

export const CHARACTERS: CharacterDef[] = [
  // Regular Characters (Unlocked by Golden Fish / Free Starter)
  {
    id: 'cat-mochi',
    name: 'Kucing Putih Mochi',
    species: 'cat',
    category: 'Kucing',
    description: 'Bulu putih bersih lembut dengan pipi merah muda yang manis.',
    perkTitle: 'Langkah Awan (Soft Paws)',
    perkDesc: 'Kontrol udara +12% lebih lincah & toleransi lompat tepi (Coyote Time) +35%.',
    perkDetail:
      'Kecepatan belok di udara +12% lebih responsif ditambah waktu Coyote Time +35% lebih lama agar lompatan dari ujung pijakan selalu aman & presisi.',
    unlockMode: 'regular',
    cost: 0
  },
  {
    id: 'cat-calico',
    name: 'Kucing Calico',
    species: 'cat',
    category: 'Kucing',
    description: 'Kucing belang tiga dengan corak oranye hangat dan cokelat tua.',
    perkTitle: 'Insting Kombo (Tri-Color Flow)',
    perkDesc: 'Durasi kombo bintang +35% (3.4 dtk) & skor setiap bintang +15% lebih besar.',
    perkDetail:
      'Jendela waktu Kombo Bintang diperpanjang dari 2.5 detik menjadi 3.4 detik, serta seluruh Bintang & Bintang Besar memberi bonus +15% skor.',
    unlockMode: 'regular',
    cost: 10
  },
  {
    id: 'cat-ginger',
    name: 'Kucing Oren',
    species: 'cat',
    category: 'Kucing',
    description: 'Ginger Tabby berbulu oranye keemasan ceria dengan garis lembut.',
    perkTitle: 'Semangat Oren (Zoomies)',
    perkDesc: 'Kecepatan lari dasar +8% lebih kencang & kontrol udara tetap gesit (+8%).',
    perkDetail:
      'Berlari di daratan 8% lebih cepat dari karakter standar (sangat cocok untuk Speedrun Rank S!) sekaligus mempertahankan kontrol udara +8%.',
    unlockMode: 'regular',
    cost: 14
  },
  {
    id: 'cat-midnight',
    name: 'Kucing Hitam Malam',
    species: 'cat',
    category: 'Kucing',
    description: 'Midnight Cat berbulu hitam keunguan pekat bermata emas bersinar.',
    perkTitle: 'Langkah Bayangan (Shadow Step)',
    perkDesc: 'Durasi kebal setelah terkena serangan +45% (2.2 dtk) & jarak Dash +8%.',
    perkDetail:
      'Saat terkena serangan musuh/rintangan, fase kebal (invulnerability) bertahan 45% lebih lama (2.2 dtk) sehingga aman menghindar, ditambah jarak Dash +8%.',
    unlockMode: 'regular',
    cost: 18
  },
  {
    id: 'cat-blue',
    name: 'Kucing Abu-Abu',
    species: 'cat',
    category: 'Kucing',
    description: 'Russian Blue berbulu abu-abu kebiruan pastel yang tenang.',
    perkTitle: 'Harmoni Langit (Serene Aura)',
    perkDesc: 'Durasi semua Power-Up berwaktu (Bulu, Magnet, Mochi, Permen, dll.) +20% lebih awet.',
    perkDetail:
      'Memperpanjang seluruh efek Power-Up berbasis durasi sebesar +20% (termasuk item eksklusif tiap map & item buff arena Boss).',
    unlockMode: 'regular',
    cost: 22
  },
  // Regular Bear & Fox Characters (Unlocked by Golden Fish)
  {
    id: 'bear-black',
    name: 'Beruang Hitam',
    species: 'bear',
    category: 'Beruang',
    description: 'Beruang hitam pekat bertelinga bulat dengan tanda bulan sabit krem di dada.',
    perkTitle: 'Cakar Kokoh (Sturdy Paws)',
    perkDesc: 'Knockback berkurang 38% saat terkena serangan & jarak Dash +10% lebih jauh.',
    perkDetail:
      'Tubuh kokoh mengurangi hentakan knockback hingga 38% agar tidak mudah jatuh ke jurang saat tersenggol, ditambah jangkauan Dash +10%.',
    unlockMode: 'regular',
    cost: 28
  },
  {
    id: 'fox-brown',
    name: 'Rubah Cokelat',
    species: 'fox',
    category: 'Rubah',
    description: 'Rubah cokelat hangat bertelinga runcing dan ekor lebat berujung putih.',
    perkTitle: 'Lincah Rimba (Forest Agility)',
    perkDesc: 'Kecepatan gerak dasar +6% & pemulihan cooldown Dash 12% lebih cepat.',
    perkDetail:
      'Kaki lincah hutan memberi tambahan kecepatan gerak +6% serta mempersingkat cooldown Dash sebesar 12% untuk manuver cepat antar pijakan.',
    unlockMode: 'regular',
    cost: 24
  },

  // ============================================================================
  // 6 SPECIAL MISSION CHARACTERS (Upgraded Multi-Effect Signature Passives!)
  // ============================================================================
  {
    id: 'fox-kitsune',
    name: 'Rubah Jepang (Kitsune)',
    species: 'fox',
    category: 'Rubah',
    description: 'Rubah kuil seputih salju dengan aksen merah-emas di ujung telinga & ekor.',
    perkTitle: '★ Berkah Kitsune (Kitsune Spirit)',
    perkDesc: 'Melayang halus -18% gravitasi puncak + 2× Air-Dash di udara + Pulse Boss 15% lebih cepat.',
    perkDetail:
      'Pasif Spesial Rubah Kuil: gravitasi turun 18% lebih lembut untuk pendaratan presisi, bisa melakukan hingga 2× Air-Dash sebelum mendarat, dan cooldown Starlight Pulse di Boss Fight 15% lebih cepat!',
    unlockMode: 'mission',
    cost: 0,
    missionTitle: 'Penakluk 8 Map',
    missionDesc: 'Selesaikan minimal 8 level berbeda di Starlight Stray.'
  },
  {
    id: 'bunny-starlight',
    name: 'Kelinci Putih',
    species: 'bunny',
    category: 'Kelinci',
    description: 'Starlight Bunny bertelinga panjang lentur dan ekor pom-pom bulat.',
    perkTitle: '★ Lompatan Bulan (Lunar Leap)',
    perkDesc: 'Lompatan dasar +10% & Double Jump +8% lebih tinggi + mendarat ringan saat tahan Lompat.',
    perkDetail:
      'Pasif Spesial Kelinci Bintang: lompatan pertama +10% lebih tinggi, Double Jump +8% lebih tinggi, dan menahan tombol Lompat saat turun otomatis memperlambat jatuh secara lembut!',
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
    perkTitle: '★ Kilat Shiba (Windbreaker Dash)',
    perkDesc: 'Jarak Dash +20% lebih jauh, cooldown Dash -15% lebih cepat, & kebal penuh pusaran angin.',
    perkDetail:
      'Pasif Spesial Shiba Inu: Dash meluncur +20% lebih jauh dengan cooldown 15% lebih singkat, serta kebal penuh terhadap pusaran angin Hutan Sakura maupun badai angin Boss Umbra Owl!',
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
    perkTitle: '★ Pelindung Salju (Fluffy Guardian)',
    perkDesc: 'Mulai setiap level dengan 4 Hati Maksimal (+1 ❤️ Max HP) & kebal dorongan angin.',
    perkDetail:
      'Pasif Spesial Samoyed (berbeda dari Shiba Inu!): memulai setiap map & pertarungan Boss dengan 4 Hati penuh (bukan 3), kebal dorongan angin, dan sangat tangguh di stage tersulit!',
    unlockMode: 'mission',
    cost: 0,
    missionTitle: 'Juara Mercusuar Bintang',
    missionDesc: 'Tamatkan Level 8 dengan minimal 2 Bintang (⭐⭐).'
  },
  {
    id: 'bear-sun',
    name: 'Beruang Madu',
    species: 'bear',
    category: 'Beruang',
    description: 'Beruang madu ramping cokelat gelap dengan corak dada emas madu hangat.',
    perkTitle: '★ Pencari Madu Emas (Golden Forager)',
    perkDesc: 'Magnet koin/bintang bawaan +35%, bonus +1 🐟 per level (≥15 ⭐), & durasi buff +15%.',
    perkDetail:
      'Pasif Spesial Beruang Madu: memiliki magnet koin & bintang permanen (+35% radius), bonus +1 🐟 setiap menyelesaikan map (≥15 bintang), serta seluruh Power-Up bertahan +15% lebih lama!',
    unlockMode: 'mission',
    cost: 0,
    missionTitle: 'Sahabat Misi Harian',
    missionDesc: 'Selesaikan total 6 Misi Harian (Daily Missions).'
  },
  {
    id: 'bear-polar',
    name: 'Beruang Kutub',
    species: 'bear',
    category: 'Beruang',
    description: 'Beruang arktik seputih salju dengan bayangan biru es lembut yang hangat.',
    perkTitle: '★ Benteng Arktik (Arctic Aegis)',
    perkDesc: 'Perisai Es gratis di awal & regenerasi tiap Pos Lentera + Astral Aegis Boss +0.35 dtk.',
    perkDetail:
      'Pasif Spesial Beruang Kutub: memulai level dengan 1 Perisai Es gratis (tidak merusak Pacifist Run), otomatis pulih saat menyentuh Pos Lentera (Checkpoint), dan perisai Astral Aegis di Boss Fight bertahan +0.35 dtk lebih lama!',
    unlockMode: 'mission',
    cost: 0,
    missionTitle: 'Penjelajah Bintang Kutub',
    missionDesc: 'Kumpulkan minimal 12 Starlight Shards ATAU raih Rank S di 3 level.'
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
    cost: 8,
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
    cost: 10,
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
    cost: 12,
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
    cost: 9,
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
    cost: 12,
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
    cost: 10,
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
    cost: 10,
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
    cost: 12,
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
    cost: 16,
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
    cost: 18,
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
    cost: 18,
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
    cost: 8,
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
    cost: 10,
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
    cost: 24,
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
    cost: 24,
    primary: '#dce6f7',
    secondary: '#8da1c4',
    accent: '#9ef0ff',
    outline: '#1d2238',
    swatch: '#dce6f7'
  },
  // Biome 6 (Clockwork Observatory) 6/6 Shard Reward Cosmetic!
  {
    id: 'hat-astral-clockwork',
    model: 'clockwork',
    groupName: 'Biome Reward • Observatorium',
    colorName: 'Astronom Kuningan',
    name: 'Astral Clockwork Hat',
    cost: 0,
    primary: '#23326b',
    secondary: '#d9a441',
    accent: '#fff1a6',
    outline: '#121736',
    swatch: '#d9a441',
    shardUnlockBiome: 'observatory'
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
    cost: 14,
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
    cost: 14,
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
    cost: 16,
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
    cost: 20,
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
    cost: 22,
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
    cost: 28,
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
    cost: 30,
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
  },
  // Biome 5 (Crystal Mushroom Cavern) 6/6 Shard Reward Cosmetic!
  {
    id: 'cape-crystal-glow',
    model: 'crystal',
    groupName: 'Biome Reward • Gua Kristal',
    colorName: 'Prisma Kristal',
    name: 'Crystal Glow Cape',
    cost: 0,
    primary: '#6cf2ec',
    secondary: '#8e6dff',
    accent: '#e8ffff',
    outline: '#182b4d',
    swatch: '#6cf2ec',
    shardUnlockBiome: 'cavern'
  },
  // Level 14 Endgame Boss Reward Cosmetic!
  {
    id: 'cape-nebula-sovereign',
    model: 'nebula',
    groupName: 'Boss Reward • Inti Astral',
    colorName: 'Nebula Kosmik',
    name: 'Nebula Sovereign Cape',
    cost: 0,
    primary: '#4f2a8c',
    secondary: '#24114f',
    accent: '#ffe275',
    outline: '#130829',
    swatch: '#7b4ad4',
    bossUnlockLevelId: 14
  }
]

export interface BiomeRewardDescriptor {
  biome: 'rooftops' | 'sakura' | 'cloudland' | 'harbor' | 'cavern' | 'observatory'
  slot: 'hat' | 'cape' | 'scarf'
  id: string
  name: string
}

export const BIOME_SHARD_REWARDS: Record<
  'rooftops' | 'sakura' | 'cloudland' | 'harbor' | 'cavern' | 'observatory',
  BiomeRewardDescriptor
> = {
  rooftops: { biome: 'rooftops', slot: 'hat', id: 'beret-starlight', name: 'Starlight Beret' },
  sakura: { biome: 'sakura', slot: 'cape', id: 'cape-sakura-petal', name: 'Sakura Petal Cape' },
  cloudland: { biome: 'cloudland', slot: 'cape', id: 'wings-cloud-pastel', name: 'Cloud Wings Cape' },
  harbor: { biome: 'harbor', slot: 'scarf', id: 'lantern-gold', name: 'Golden Lantern Scarf' },
  cavern: { biome: 'cavern', slot: 'cape', id: 'cape-crystal-glow', name: 'Crystal Glow Cape' },
  observatory: { biome: 'observatory', slot: 'hat', id: 'hat-astral-clockwork', name: 'Astral Clockwork Hat' }
}

// ============================================================================
// SECTION 4: HEAD ACCESSORIES (`head_acc`) — Layerable with Hats & Face Items!
// ============================================================================

export const HEAD_ACCS: HeadAccDef[] = [
  {
    id: 'none',
    model: 'none',
    groupName: 'Default',
    colorName: 'Polos',
    name: 'Tanpa Hiasan Kepala',
    cost: 0,
    primary: 'transparent',
    secondary: 'transparent',
    accent: 'transparent',
    outline: 'transparent',
    swatch: '#4a2f63'
  },
  {
    id: 'sprout-green',
    model: 'sprout',
    groupName: 'Tunas Daun',
    colorName: 'Hijau Segar',
    name: 'Tunas Daun Hijau',
    cost: 8,
    primary: '#5fd68c',
    secondary: '#2d9458',
    accent: '#c9ffd9',
    outline: '#162e23',
    swatch: '#5fd68c'
  },
  {
    id: 'sprout-gold',
    model: 'sprout',
    groupName: 'Tunas Daun',
    colorName: 'Emas Musim Gugur',
    name: 'Tunas Daun Emas',
    cost: 10,
    primary: '#ffd55c',
    secondary: '#c98824',
    accent: '#fff6c4',
    outline: '#2e1d14',
    swatch: '#ffd55c'
  },
  {
    id: 'sakura-pink',
    model: 'sakura',
    groupName: 'Jepit Sakura',
    colorName: 'Sakura Pink',
    name: 'Jepit Sakura Pink',
    cost: 10,
    primary: '#ff9ec9',
    secondary: '#db6398',
    accent: '#fff099',
    outline: '#36132d',
    swatch: '#ff9ec9'
  },
  {
    id: 'sakura-white',
    model: 'sakura',
    groupName: 'Jepit Sakura',
    colorName: 'Sakura Putih',
    name: 'Jepit Sakura Putih',
    cost: 10,
    primary: '#fff2f8',
    secondary: '#d9b0cc',
    accent: '#ffd866',
    outline: '#2c1936',
    swatch: '#ffe8f3'
  },
  {
    id: 'antlers-warm',
    model: 'antlers',
    groupName: 'Tanduk Rusa',
    colorName: 'Cokelat Hangat',
    name: 'Tanduk Rusa Mini',
    cost: 14,
    primary: '#b37a4c',
    secondary: '#7a4b2b',
    accent: '#e6ba8e',
    outline: '#291512',
    swatch: '#b37a4c'
  },
  {
    id: 'antlers-frost',
    model: 'antlers',
    groupName: 'Tanduk Rusa',
    colorName: 'Kristal Es',
    name: 'Tanduk Rusa Es',
    cost: 16,
    primary: '#9ee8ff',
    secondary: '#529ec9',
    accent: '#ffffff',
    outline: '#19324d',
    swatch: '#9ee8ff'
  },
  {
    id: 'headphones-lofi',
    model: 'headphones',
    groupName: 'Headphone Lo-Fi',
    colorName: 'Ungu Retro',
    name: 'Headphone Lo-Fi',
    cost: 18,
    primary: '#8e5ce6',
    secondary: '#55309e',
    accent: '#ff9ec4',
    outline: '#1b0d30',
    swatch: '#8e5ce6'
  },
  {
    id: 'headphones-mint',
    model: 'headphones',
    groupName: 'Headphone Lo-Fi',
    colorName: 'Mint Pastel',
    name: 'Headphone Mint Lo-Fi',
    cost: 18,
    primary: '#5fd6b0',
    secondary: '#2b8a72',
    accent: '#ffe375',
    outline: '#142c2b',
    swatch: '#5fd6b0'
  },
  {
    id: 'crown-starlight',
    model: 'starlightCrown',
    groupName: 'Mahkota Bintang',
    colorName: 'Emas Bintang',
    name: 'Mahkota Bintang',
    cost: 26,
    primary: '#ffd84d',
    secondary: '#d48d1e',
    accent: '#9ef2ff',
    outline: '#2e1821',
    swatch: '#ffd84d'
  },
  {
    id: 'crown-moon',
    model: 'starlightCrown',
    groupName: 'Mahkota Bintang',
    colorName: 'Perak Bulan',
    name: 'Mahkota Bulan Perak',
    cost: 26,
    primary: '#dce8ff',
    secondary: '#8ba2cc',
    accent: '#ffe475',
    outline: '#1a2138',
    swatch: '#dce8ff'
  },
  // Level 13 Endgame Boss Reward Cosmetic!
  {
    id: 'halo-eclipse',
    model: 'halo',
    groupName: 'Boss Reward • Gerhana',
    colorName: 'Gerhana Emas',
    name: 'Eclipse Halo',
    cost: 0,
    primary: '#ff4f79',
    secondary: '#ffd452',
    accent: '#fff8d6',
    outline: '#380d22',
    swatch: '#ff5c82',
    bossUnlockLevelId: 13
  }
]

// ============================================================================
// SECTION 5: FACE / EYEWEAR (`face`) — Pixel Eyepatch, Round Glasses & Bandage!
// ============================================================================

export const FACE_ACCS: FaceAccDef[] = [
  {
    id: 'none',
    model: 'none',
    groupName: 'Default',
    colorName: 'Polos',
    name: 'Tanpa Aksesori Wajah',
    cost: 0,
    primary: 'transparent',
    secondary: 'transparent',
    accent: 'transparent',
    outline: 'transparent',
    swatch: '#4a2f63'
  },
  {
    id: 'eyepatch-gold',
    model: 'eyepatch',
    groupName: 'Penutup Mata',
    colorName: 'Arang Emas',
    name: 'Penutup Mata Emas',
    cost: 16,
    primary: '#242030',
    secondary: '#120e1a',
    accent: '#ffd84d',
    outline: '#0b0812',
    swatch: '#2c253b'
  },
  {
    id: 'eyepatch-crimson',
    model: 'eyepatch',
    groupName: 'Penutup Mata',
    colorName: 'Arang Merah',
    name: 'Penutup Mata Merah',
    cost: 18,
    primary: '#261b29',
    secondary: '#140c17',
    accent: '#ff5277',
    outline: '#0c0712',
    swatch: '#d93654'
  },
  {
    id: 'glasses-round',
    model: 'glasses',
    groupName: 'Kacamata Bulat',
    colorName: 'Hitam Klasik',
    name: 'Kacamata Bulat',
    cost: 12,
    primary: '#291e38',
    secondary: '#9ce6ff',
    accent: '#ffffff',
    outline: '#150d24',
    swatch: '#596b8f'
  },
  {
    id: 'glasses-gold',
    model: 'glasses',
    groupName: 'Kacamata Bulat',
    colorName: 'Bingkai Emas',
    name: 'Kacamata Bulat Emas',
    cost: 14,
    primary: '#e0a938',
    secondary: '#c4f2ff',
    accent: '#fffbe0',
    outline: '#2b1b14',
    swatch: '#e0a938'
  },
  {
    id: 'bandage-star',
    model: 'bandage',
    groupName: 'Plester Pipi',
    colorName: 'Krem Petualang',
    name: 'Plester Pipi Bintang',
    cost: 8,
    primary: '#ffe0b8',
    secondary: '#d9a473',
    accent: '#fff8eb',
    outline: '#402521',
    swatch: '#ffe0b8'
  },
  {
    id: 'bandage-pink',
    model: 'bandage',
    groupName: 'Plester Pipi',
    colorName: 'Sakura Pink',
    name: 'Plester Pipi Sakura',
    cost: 9,
    primary: '#ffc2dd',
    secondary: '#e07ca9',
    accent: '#fff5fa',
    outline: '#3d1930',
    swatch: '#ffc2dd'
  }
]

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

export function getHeadAccById(id: HeadAccId): HeadAccDef {
  return HEAD_ACCS.find((h) => h.id === id) ?? HEAD_ACCS[0]!
}

export function getFaceAccById(id: FaceAccId): FaceAccDef {
  return FACE_ACCS.find((f) => f.id === id) ?? FACE_ACCS[0]!
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

  if (id === 'bear-sun') {
    const totalDaily = Math.max(0, Math.floor(Number(progress.totalDailyMissionsCompleted) || 0))
    const cur = Math.min(6, totalDaily)
    const done = totalDaily >= 6
    return {
      completed: done,
      current: cur,
      target: 6,
      label: done ? `${totalDaily} / 6 Misi Harian ✓` : `${cur} / 6 Misi Harian`
    }
  }

  if (id === 'fox-kitsune') {
    const cleared = Object.values(progress.levelRecords).filter((rec) => rec && rec.rating >= 1).length
    const cur = Math.min(8, cleared)
    const done = cleared >= 8
    return {
      completed: done,
      current: cur,
      target: 8,
      label: done ? 'SELESAIKAN 8 MAP (8/8) ✓' : `SELESAIKAN 8 MAP (${cur}/8)`
    }
  }

  if (id === 'bear-polar') {
    let shards = 0
    for (const tuple of Object.values(progress.collectedShards)) {
      if (Array.isArray(tuple)) {
        if (tuple[0]) shards += 1
        if (tuple[1]) shards += 1
        if (tuple[2]) shards += 1
      }
    }
    let sRanks = 0
    for (const rank of Object.values(progress.levelRanks)) {
      if (rank === 'S') sRanks += 1
    }
    const done = shards >= 12 || sRanks >= 3
    const shardPct = shards / 12
    const rankPct = sRanks / 3
    if (rankPct > shardPct) {
      return {
        completed: done,
        current: Math.min(3, sRanks),
        target: 3,
        label: done
          ? `${shards}/12 Shard • ${sRanks}/3 Rank S ✓`
          : `${shards}/12 Shard • ${sRanks}/3 Rank S`
      }
    }
    return {
      completed: done,
      current: Math.min(12, shards),
      target: 12,
      label: done
        ? `${shards}/12 Shard • ${sRanks}/3 Rank S ✓`
        : `${shards}/12 Shard • ${sRanks}/3 Rank S`
    }
  }

  return {
    completed: progress.unlockedCharacters.includes(id),
    current: 1,
    target: 1,
    label: 'Terbuka'
  }
}
