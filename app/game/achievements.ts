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
    rewardFish: 4,
    stampColor: '#ff9ec4'
  },
  {
    id: 'rooftop-sprinter',
    name: 'Rooftop Sprinter',
    subtitle: 'Pelari Atap Cepat',
    icon: '⏱️',
    description: 'Selesaikan Level 1 dalam waktu kurang dari 75 detik.',
    rewardFish: 4,
    stampColor: '#7ee8ff'
  },
  {
    id: 'biome-explorer',
    name: 'Biome Explorer',
    subtitle: 'Penjelajah Shard',
    icon: '💎',
    description: 'Kumpulkan seluruh 3 Starlight Shards di salah satu level.',
    rewardFish: 4,
    stampColor: '#b594ff'
  },
  {
    id: 'starlight-collector',
    name: 'Starlight Collector',
    subtitle: 'Kolektor 24 Shard',
    icon: '✨',
    description: 'Kumpulkan minimal 24 Starlight Shards dari seluruh dunia.',
    rewardFish: 10,
    stampColor: '#ffe375'
  },
  {
    id: 'fashionista-stray',
    name: 'Fashionista Stray',
    subtitle: 'Gaya Petualang',
    icon: '🎩',
    description: 'Miliki minimal 5 item aksesoris berbeda (Syal, Topi, Jubah, Kepala, atau Wajah).',
    rewardFish: 6,
    stampColor: '#ffb2d4'
  },
  {
    id: 'full-squad',
    name: 'Full Squad',
    subtitle: 'Skuad Lengkap',
    icon: '🐶',
    description: 'Buka keempat spesies hewan: Kucing, Kelinci, Anjing Putih, & Shiba Inu.',
    rewardFish: 6,
    stampColor: '#96f2cc'
  },
  {
    id: 'pacifist-run',
    name: 'Pacifist Run',
    subtitle: 'Petualang Damai',
    icon: '🕊️',
    description: 'Selesaikan 1 level penuh tanpa terkena damage atau menyentuh musuh.',
    rewardFish: 6,
    stampColor: '#a8f0ff'
  },
  {
    id: 'nine-lives',
    name: 'Nine Lives',
    subtitle: 'Sembilan Nyawa',
    icon: '🌙',
    description: 'Terjatuh dari platform sebanyak 9 kali total — tetap bangkit terus!',
    rewardFish: 4,
    stampColor: '#ffad75'
  },
  {
    id: 'swift-paws',
    name: 'Swift Paws',
    subtitle: 'Speedrun A/S Penuh',
    icon: '💨',
    description: 'Raih Rank A atau Rank S pada minimal 8 level.',
    rewardFish: 6,
    stampColor: '#8eeeff'
  },
  {
    id: 'starlight-speedster',
    name: 'Starlight Speedster',
    subtitle: '4 Level Rank S',
    icon: '🌟',
    description: 'Raih Rank S pada minimal 4 level berbeda.',
    rewardFish: 10,
    stampColor: '#ffd84d'
  },
  {
    id: 'lightning-stray',
    name: 'Lightning Stray',
    subtitle: 'Mastery 8 Rank S',
    icon: '⚡',
    description: 'Raih Rank S pada minimal 8 level untuk membuka Lightning Scarf!',
    rewardFish: 10,
    stampColor: '#fff066',
    rewardCosmeticLabel: '🧣 Lightning Scarf'
  },
  {
    id: 'eclipse-conqueror',
    name: 'Eclipse Conqueror',
    subtitle: 'Penakluk Kuil Gerhana',
    icon: '🌘',
    description: 'Kalahkan Umbra Owl di Level 13 (Eclipse Sanctum) untuk membuka Eclipse Halo!',
    rewardFish: 10,
    stampColor: '#ff6e91',
    rewardCosmeticLabel: '✨ Eclipse Halo'
  },
  {
    id: 'starlight-legend',
    name: 'Starlight Legend',
    subtitle: 'Legenda Inti Astral',
    icon: '🌌',
    description: 'Kalahkan Chronos Leviathan di Level 14 (Astral Core Citadel) untuk Nebula Sovereign Cape!',
    rewardFish: 10,
    stampColor: '#b594ff',
    rewardCosmeticLabel: '🌌 Nebula Sovereign Cape'
  }
]
