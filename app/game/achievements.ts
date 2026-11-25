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
  }
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-step',
    name: 'First Steps',
    subtitle: 'Langkah Pertama',
    icon: '🐾',
    description: 'Selesaikan Level 1 di Atap Kota Malam dan lewati Gerbang Bulan.',
    rewardFish: 25,
    stampColor: '#ff9ec4'
  },
  {
    id: 'rooftop-sprinter',
    name: 'Rooftop Sprinter',
    subtitle: 'Pelari Atap Cepat',
    icon: '⏱️',
    description: 'Selesaikan Level 1 dalam waktu kurang dari 45 detik.',
    rewardFish: 50,
    stampColor: '#7ee8ff'
  },
  {
    id: 'biome-explorer',
    name: 'Biome Explorer',
    subtitle: 'Penjelajah Shard',
    icon: '💎',
    description: 'Kumpulkan seluruh 3 Starlight Shards di salah satu level.',
    rewardFish: 50,
    stampColor: '#b594ff'
  },
  {
    id: 'starlight-collector',
    name: 'Starlight Collector',
    subtitle: 'Kolektor 24 Shard',
    icon: '✨',
    description: 'Kumpulkan semua 24 Starlight Shards di seluruh 8 level.',
    rewardFish: 300,
    stampColor: '#ffe375'
  },
  {
    id: 'fashionista-stray',
    name: 'Fashionista Stray',
    subtitle: 'Gaya Petualang',
    icon: '🎩',
    description: 'Miliki minimal 5 item aksesoris berbeda (Syal, Topi, atau Jubah).',
    rewardFish: 75,
    stampColor: '#ffb2d4'
  },
  {
    id: 'full-squad',
    name: 'Full Squad',
    subtitle: 'Skuad Lengkap',
    icon: '🐶',
    description: 'Buka keempat spesies hewan: Kucing, Kelinci, Anjing Putih, & Shiba Inu.',
    rewardFish: 100,
    stampColor: '#96f2cc'
  },
  {
    id: 'pacifist-run',
    name: 'Pacifist Run',
    subtitle: 'Petualang Damai',
    icon: '🕊️',
    description: 'Selesaikan 1 level penuh tanpa terkena damage atau menyentuh musuh.',
    rewardFish: 75,
    stampColor: '#a8f0ff'
  },
  {
    id: 'nine-lives',
    name: 'Nine Lives',
    subtitle: 'Sembilan Nyawa',
    icon: '🌙',
    description: 'Terjatuh dari platform sebanyak 9 kali total — tetap bangkit terus!',
    rewardFish: 30,
    stampColor: '#ffad75'
  },
  {
    id: 'swift-paws',
    name: 'Swift Paws',
    subtitle: 'Speedrun A/S Penuh',
    icon: '💨',
    description: 'Raih Rank A atau Rank S pada seluruh 8 level.',
    rewardFish: 150,
    stampColor: '#8eeeff'
  },
  {
    id: 'starlight-speedster',
    name: 'Starlight Speedster',
    subtitle: '4 Level Rank S',
    icon: '🌟',
    description: 'Raih Rank S pada minimal 4 level berbeda.',
    rewardFish: 250,
    stampColor: '#ffd84d'
  },
  {
    id: 'lightning-stray',
    name: 'Lightning Stray',
    subtitle: 'Mastery 8 Rank S',
    icon: '⚡',
    description: 'Raih Rank S pada seluruh 8 level untuk membuka Lightning Scarf!',
    rewardFish: 500,
    stampColor: '#fff066',
    rewardCosmeticLabel: '🧣 Lightning Scarf'
  }
]
