import type { AchievementDef, BiomeId, BiomeMeta } from './types'

export const BIOMES: Record<BiomeId, BiomeMeta> = {
  rooftops: {
    id: 'rooftops',
    name: 'Atap Kota Malam',
    englishName: 'Starlight Rooftops',
    icon: '🌃',
    badgeBg: 'rgba(64, 34, 96, 0.9)',
    badgeBorder: '#ffad75'
  },
  sakura: {
    id: 'sakura',
    name: 'Hutan Sakura Malam',
    englishName: 'Midnight Sakura Woods',
    icon: '🌸',
    badgeBg: 'rgba(54, 36, 98, 0.9)',
    badgeBorder: '#ff9ec4'
  },
  cloudland: {
    id: 'cloudland',
    name: 'Negeri Awan Pastel',
    englishName: 'Pastel Cloudland',
    icon: '☁️',
    badgeBg: 'rgba(92, 46, 118, 0.9)',
    badgeBorder: '#ffd4f0'
  },
  harbor: {
    id: 'harbor',
    name: 'Dermaga Lampion',
    englishName: 'Lantern Harbor',
    icon: '⚓',
    badgeBg: 'rgba(18, 66, 74, 0.9)',
    badgeBorder: '#8ef0d8'
  },
  cavern: {
    id: 'cavern',
    name: 'Gua Jamur Kristal',
    englishName: 'Crystal Mushroom Cavern',
    icon: '🍄',
    badgeBg: 'rgba(20, 42, 74, 0.92)',
    badgeBorder: '#6ef2e6'
  },
  observatory: {
    id: 'observatory',
    name: 'Observatorium Roda Jam',
    englishName: 'Clockwork Observatory',
    icon: '⚙️',
    badgeBg: 'rgba(34, 28, 66, 0.92)',
    badgeBorder: '#f2c76e'
  },
  eclipse: {
    id: 'eclipse',
    name: 'Kuil Gerhana',
    englishName: 'Eclipse Sanctum',
    icon: '🌘',
    badgeBg: 'rgba(66, 16, 44, 0.94)',
    badgeBorder: '#ff6e91'
  },
  citadel: {
    id: 'citadel',
    name: 'Benteng Inti Astral',
    englishName: 'Astral Core Citadel',
    icon: '🌌',
    badgeBg: 'rgba(24, 18, 72, 0.94)',
    badgeBorder: '#a89eff'
  }
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-step',
    name: 'First Steps',
    subtitle: 'Langkah Pertama',
    icon: '🐾',
    description: 'Selesaikan Level 1 di Atap Kota Malam dan lewati Gerbang Bulan.',
    rewardFish: 5,
    stampColor: '#ff9ec4'
  },
  {
    id: 'rooftop-sprinter',
    name: 'Rooftop Sprinter',
    subtitle: 'Pelari Atap Cepat',
    icon: '⏱️',
    description: 'Selesaikan Level 1 dalam waktu kurang dari 75 detik.',
    rewardFish: 6,
    stampColor: '#7ee8ff'
  },
  {
    id: 'biome-explorer',
    name: 'Biome Explorer',
    subtitle: 'Penjelajah Shard',
    icon: '💎',
    description: 'Kumpulkan seluruh 3 Starlight Shards di salah satu level.',
    rewardFish: 6,
    stampColor: '#b594ff'
  },
  {
    id: 'starlight-collector',
    name: 'Starlight Collector',
    subtitle: 'Kolektor 24 Shard',
    icon: '✨',
    description: 'Kumpulkan minimal 24 Starlight Shards dari seluruh dunia.',
    rewardFish: 22,
    stampColor: '#ffe375'
  },
  {
    id: 'fashionista-stray',
    name: 'Fashionista Stray',
    subtitle: 'Gaya Petualang',
    icon: '🎩',
    description: 'Miliki minimal 5 item aksesoris berbeda (Syal, Topi, Jubah, Kepala, atau Wajah).',
    rewardFish: 10,
    stampColor: '#ffb2d4'
  },
  {
    id: 'full-squad',
    name: 'Full Squad',
    subtitle: 'Skuad Lengkap',
    icon: '🐶',
    description: 'Buka keempat spesies hewan: Kucing, Kelinci, Anjing Putih, & Shiba Inu.',
    rewardFish: 12,
    stampColor: '#96f2cc'
  },
  {
    id: 'pacifist-run',
    name: 'Pacifist Run',
    subtitle: 'Petualang Damai',
    icon: '🕊️',
    description: 'Selesaikan 1 level penuh tanpa terkena damage atau menyentuh musuh.',
    rewardFish: 10,
    stampColor: '#a8f0ff'
  },
  {
    id: 'nine-lives',
    name: 'Nine Lives',
    subtitle: 'Sembilan Nyawa',
    icon: '🌙',
    description: 'Terjatuh dari platform sebanyak 9 kali total — tetap bangkit terus!',
    rewardFish: 5,
    stampColor: '#ffad75'
  },
  {
    id: 'swift-paws',
    name: 'Swift Paws',
    subtitle: 'Speedrun A/S Penuh',
    icon: '💨',
    description: 'Raih Rank A atau Rank S pada minimal 8 level.',
    rewardFish: 15,
    stampColor: '#8eeeff'
  },
  {
    id: 'starlight-speedster',
    name: 'Starlight Speedster',
    subtitle: '4 Level Rank S',
    icon: '🌟',
    description: 'Raih Rank S pada minimal 4 level berbeda.',
    rewardFish: 15,
    stampColor: '#ffd84d'
  },
  {
    id: 'lightning-stray',
    name: 'Lightning Stray',
    subtitle: 'Mastery 8 Rank S',
    icon: '⚡',
    description: 'Raih Rank S pada minimal 8 level untuk membuka Lightning Scarf!',
    rewardFish: 20,
    stampColor: '#fff066',
    rewardCosmeticLabel: '🧣 Lightning Scarf'
  },
  {
    id: 'eclipse-conqueror',
    name: 'Eclipse Conqueror',
    subtitle: 'Penakluk Kuil Gerhana',
    icon: '🌘',
    description: 'Kalahkan Umbra Owl di Level 13 (Eclipse Sanctum) untuk membuka Eclipse Halo!',
    rewardFish: 30,
    stampColor: '#ff6e91',
    rewardCosmeticLabel: '✨ Eclipse Halo'
  },
  {
    id: 'starlight-legend',
    name: 'Starlight Legend',
    subtitle: 'Legenda Inti Astral',
    icon: '🌌',
    description: 'Kalahkan Chronos Leviathan di Level 14 (Astral Core Citadel) untuk Nebula Sovereign Cape!',
    rewardFish: 30,
    stampColor: '#b594ff',
    rewardCosmeticLabel: '🌌 Nebula Sovereign Cape'
  },
  // --- World Progression (6) ---
  {
    id: 'sakura-wanderer',
    name: 'Penjelajah Sakura',
    subtitle: 'Tamat Hutan Sakura',
    icon: '🌸',
    description: 'Selesaikan Level 4 di Hutan Sakura Malam.',
    rewardFish: 8,
    stampColor: '#ff9ec4'
  },
  {
    id: 'cloud-dancer',
    name: 'Penari Awan',
    subtitle: 'Tamat Negeri Awan',
    icon: '☁️',
    description: 'Selesaikan Level 6 di Negeri Awan Pastel.',
    rewardFish: 10,
    stampColor: '#d9b5ff'
  },
  {
    id: 'harbor-keeper',
    name: 'Penjaga Dermaga',
    subtitle: 'Tamat Dermaga Lampion',
    icon: '⚓',
    description: 'Selesaikan Level 8 di Dermaga Lampion.',
    rewardFish: 12,
    stampColor: '#8ef0d8'
  },
  {
    id: 'cavern-delver',
    name: 'Penyelam Gua',
    subtitle: 'Tamat Gua Kristal',
    icon: '🍄',
    description: 'Selesaikan Level 10 di Gua Jamur Kristal.',
    rewardFish: 14,
    stampColor: '#6cf2ec'
  },
  {
    id: 'clockwork-master',
    name: 'Ahli Observatorium',
    subtitle: 'Tamat 12 Level Utama',
    icon: '⚙️',
    description: 'Selesaikan Level 12 di Observatorium Roda Jam.',
    rewardFish: 18,
    stampColor: '#ffd873'
  },
  {
    id: 'world-explorer',
    name: 'Penjelajah 6 Dunia',
    subtitle: 'Semua Bioma Utama',
    icon: '🗺️',
    description: 'Kunjungi seluruh 6 dunia utama Starlight Stray.',
    rewardFish: 15,
    stampColor: '#9ef5c8'
  },
  // --- Shards, Stars & Score (6) ---
  {
    id: 'shard-hunter-12',
    name: 'Pemburu 12 Shard',
    subtitle: 'Kolektor Permata',
    icon: '🔷',
    description: 'Kumpulkan minimal 12 Starlight Shards dari berbagai level.',
    rewardFish: 12,
    stampColor: '#8eeeff'
  },
  {
    id: 'shard-master-36',
    name: 'Master 36 Shard',
    subtitle: 'Seluruh Shard Dunia',
    icon: '👑',
    description: 'Kumpulkan seluruh 36/36 Starlight Shards di semua 12 level utama!',
    rewardFish: 35,
    stampColor: '#ffe466'
  },
  {
    id: 'perfect-stars',
    name: 'Bintang Sempurna',
    subtitle: 'Tiga Bintang Pertama',
    icon: '⭐',
    description: 'Raih rating 3 Bintang (⭐⭐⭐) pada minimal 1 level.',
    rewardFish: 6,
    stampColor: '#ffe875'
  },
  {
    id: 'star-virtuoso',
    name: 'Kolektor 6 Tiga Bintang',
    subtitle: 'Setengah Sempurna',
    icon: '🌠',
    description: 'Raih rating 3 Bintang (⭐⭐⭐) pada minimal 6 level berbeda.',
    rewardFish: 15,
    stampColor: '#ffb8dc'
  },
  {
    id: 'celestial-perfection',
    name: 'Kesempurnaan 12 Map',
    subtitle: 'Semua Level 3 Bintang',
    icon: '🏆',
    description: 'Raih rating 3 Bintang (⭐⭐⭐) di seluruh 12 level utama!',
    rewardFish: 35,
    stampColor: '#ffd84d'
  },
  {
    id: 'high-scorer',
    name: 'Skor Bintang Tinggi',
    subtitle: '5.000 Poin',
    icon: '🎯',
    description: 'Capai skor tertinggi minimal 5.000 poin dalam permainan.',
    rewardFish: 8,
    stampColor: '#ffad75'
  },
  // --- Movement, Dash & Speedrun Mastery (5) ---
  {
    id: 'dash-novice',
    name: 'Pelari Kilat',
    subtitle: '50 Kali Dash',
    icon: '💨',
    description: 'Gunakan kemampuan Dash sebanyak 50 kali total.',
    rewardFish: 6,
    stampColor: '#9ee8ff'
  },
  {
    id: 'dash-master',
    name: 'Master Dash 200',
    subtitle: '200 Kali Dash',
    icon: '⚡',
    description: 'Gunakan kemampuan Dash sebanyak 200 kali total.',
    rewardFish: 14,
    stampColor: '#ffe375'
  },
  {
    id: 'peaceful-sage',
    name: 'Petualang Damai Sejati',
    subtitle: '5 Level Tanpa Luka',
    icon: '🕊️',
    description: 'Selesaikan total 5 level tanpa terkena damage atau menyentuh musuh.',
    rewardFish: 22,
    stampColor: '#b4ffe3'
  },
  {
    id: 'rank-s-first',
    name: 'Kilatan Rank S',
    subtitle: 'Rank S Pertama',
    icon: '⚡',
    description: 'Raih Rank S pertama kali di level mana saja.',
    rewardFish: 8,
    stampColor: '#ffd84d'
  },
  {
    id: 'grand-speedrunner',
    name: 'Speedrunner 12 Map',
    subtitle: 'Mastery 12 Rank S',
    icon: '🏁',
    description: 'Raih Rank S pada seluruh 12 level utama Starlight Stray!',
    rewardFish: 40,
    stampColor: '#ff8cb8'
  },
  // --- Fish, Daily Missions, Cosmetics & Squad (6) ---
  {
    id: 'fish-collector',
    name: 'Pemancing Malam',
    subtitle: '50 Ikan Emas',
    icon: '🐟',
    description: 'Kumpulkan total 50 Ikan Emas sepanjang permainan.',
    rewardFish: 10,
    stampColor: '#ffd452'
  },
  {
    id: 'fish-tycoon',
    name: 'Sultan Ikan Emas',
    subtitle: '150 Ikan Emas',
    icon: '💰',
    description: 'Kumpulkan total 150 Ikan Emas sepanjang permainan.',
    rewardFish: 18,
    stampColor: '#ffe466'
  },
  {
    id: 'daily-helper',
    name: 'Sahabat Harian',
    subtitle: '3 Misi Harian',
    icon: '📋',
    description: 'Selesaikan total 3 Misi Harian (Daily Missions).',
    rewardFish: 7,
    stampColor: '#96f2cc'
  },
  {
    id: 'daily-devotee',
    name: 'Pejuang Misi Harian',
    subtitle: '12 Misi Harian',
    icon: '🎖️',
    description: 'Selesaikan total 12 Misi Harian (Daily Missions).',
    rewardFish: 18,
    stampColor: '#ff9ec4'
  },
  {
    id: 'wardrobe-curator',
    name: 'Kurator Lemari',
    subtitle: '15 Item Aksesoris',
    icon: '🎀',
    description: 'Miliki minimal 15 item aksesoris berbeda di lemari koleksimu.',
    rewardFish: 18,
    stampColor: '#e2b8ff'
  },
  {
    id: 'all-friends',
    name: 'Keluarga Lengkap',
    subtitle: '13 Karakter Terbuka',
    icon: '🐾',
    description: 'Buka seluruh 13 karakter hewan di Starlight Stray!',
    rewardFish: 30,
    stampColor: '#ffe375'
  }
]
