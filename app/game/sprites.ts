import {
  getCapeById,
  getCharacterById,
  getFaceAccById,
  getHatById,
  getHeadAccById,
  getScarfById
} from './characters'
import type {
  AnimalSpecies,
  CapeId,
  CharacterId,
  FaceAccId,
  GraphicsStyle,
  HatId,
  HeadAccId,
  PowerUpKind,
  ScarfColorId
} from './types'

/**
 * Procedural Pixel Art Sprite Generator
 * Generates crisp transparent pixel sprites for all 8 animal characters (5 cats, bunny, samoyed, shiba),
 * 4 customizable scarf colors, level tiles, bounce clouds, checkpoint lanterns, and gatekeeper NPCs.
 */

export interface PlayerSpriteSet {
  idle0: HTMLCanvasElement
  idle1: HTMLCanvasElement
  idleBlink: HTMLCanvasElement
  idleSpecial: HTMLCanvasElement
  sit0: HTMLCanvasElement
  sitBlink: HTMLCanvasElement
  run0: HTMLCanvasElement
  run1: HTMLCanvasElement
  run2: HTMLCanvasElement
  run3: HTMLCanvasElement
  run4: HTMLCanvasElement
  land: HTMLCanvasElement
  jumpUp: HTMLCanvasElement
  jumpFall: HTMLCanvasElement
  dash: HTMLCanvasElement
  dashGhostWhite: HTMLCanvasElement
  dashGhostScarf: HTMLCanvasElement
  dashGhostRainbow: HTMLCanvasElement[]
  hurtTint: HTMLCanvasElement
}

export interface DirectionalPlayerSprites {
  right: PlayerSpriteSet
  left: PlayerSpriteSet
}

export interface SpriteBank {
  star: [HTMLCanvasElement, HTMLCanvasElement]
  bigStar: [HTMLCanvasElement, HTMLCanvasElement]
  fish: [HTMLCanvasElement, HTMLCanvasElement]
  powerUps: {
    milk: HTMLCanvasElement
    feather: HTMLCanvasElement
    bell: HTMLCanvasElement
    bubble: HTMLCanvasElement
    mooncake: HTMLCanvasElement
    yarn: HTMLCanvasElement
    mochi: HTMLCanvasElement
    candy: HTMLCanvasElement
    pearl: HTMLCanvasElement
    crystalElixir: HTMLCanvasElement
    chronoGear: HTMLCanvasElement
    starNectar: HTMLCanvasElement
    eclipseShard: HTMLCanvasElement
  }
  crow: {
    right: [HTMLCanvasElement, HTMLCanvasElement]
    left: [HTMLCanvasElement, HTMLCanvasElement]
  }
  hedgehog: {
    right: [HTMLCanvasElement, HTMLCanvasElement]
    left: [HTMLCanvasElement, HTMLCanvasElement]
  }
  stormCloud: {
    calm: HTMLCanvasElement
    warn: HTMLCanvasElement
    zap: HTMLCanvasElement
  }
  crab: [HTMLCanvasElement, HTMLCanvasElement]
  wisp: [HTMLCanvasElement, HTMLCanvasElement]
  puddle: [HTMLCanvasElement, HTMLCanvasElement]
  lantern: [HTMLCanvasElement, HTMLCanvasElement]
  stoneLantern: [HTMLCanvasElement, HTMLCanvasElement]
  checkpoint: {
    off: HTMLCanvasElement
    on0: HTMLCanvasElement
    on1: HTMLCanvasElement
  }
  bounceCloud: {
    normal: HTMLCanvasElement
    squish: HTMLCanvasElement
  }
  npc: {
    owl: [HTMLCanvasElement, HTMLCanvasElement]
    bunny: [HTMLCanvasElement, HTMLCanvasElement]
    kitten: [HTMLCanvasElement, HTMLCanvasElement]
  }
  portal: [HTMLCanvasElement, HTMLCanvasElement]
  moon: HTMLCanvasElement
  fullMoon: HTMLCanvasElement
  props: {
    fence: HTMLCanvasElement
    flowerPink: HTMLCanvasElement
    flowerBlue: HTMLCanvasElement
    flowerGold: HTMLCanvasElement
    pottedPlant: HTMLCanvasElement
    sakuraBranch: HTMLCanvasElement
    harborPost: HTMLCanvasElement
  }
  tiles: {
    brickTop: HTMLCanvasElement
    brickBody: HTMLCanvasElement
    woodTop: HTMLCanvasElement
    woodBody: HTMLCanvasElement
    sakuraTop: HTMLCanvasElement
    sakuraBody: HTMLCanvasElement
    cloudTop: HTMLCanvasElement
    cloudBody: HTMLCanvasElement
    harborTop: HTMLCanvasElement
    harborBody: HTMLCanvasElement
    cavernTop: HTMLCanvasElement
    cavernBody: HTMLCanvasElement
    observatoryTop: HTMLCanvasElement
    observatoryBody: HTMLCanvasElement
    eclipseTop: HTMLCanvasElement
    eclipseBody: HTMLCanvasElement
    citadelTop: HTMLCanvasElement
    citadelBody: HTMLCanvasElement
    movingLeft: HTMLCanvasElement
    movingMid: HTMLCanvasElement
    movingRight: HTMLCanvasElement
  }
  modernTiles: {
    brickTop: HTMLCanvasElement
    brickBody: HTMLCanvasElement
    woodTop: HTMLCanvasElement
    woodBody: HTMLCanvasElement
    sakuraTop: HTMLCanvasElement
    sakuraBody: HTMLCanvasElement
    cloudTop: HTMLCanvasElement
    cloudBody: HTMLCanvasElement
    harborTop: HTMLCanvasElement
    harborBody: HTMLCanvasElement
    cavernTop: HTMLCanvasElement
    cavernBody: HTMLCanvasElement
    observatoryTop: HTMLCanvasElement
    observatoryBody: HTMLCanvasElement
    eclipseTop: HTMLCanvasElement
    eclipseBody: HTMLCanvasElement
    citadelTop: HTMLCanvasElement
    citadelBody: HTMLCanvasElement
  }
}

function createCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  return [c, ctx]
}

function bakeGrid(grid: string[], palette: Record<string, string>): HTMLCanvasElement {
  const h = grid.length
  const w = Math.max(...grid.map((row) => row.length))
  const [canvas, ctx] = createCanvas(w, h)
  for (let y = 0; y < h; y++) {
    const row = grid[y]!
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]!
      if (ch === '.' || ch === ' ') continue
      const color = palette[ch]
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(x, y, 1, 1)
    }
  }
  return canvas
}

function bakeSilhouette(grid: string[], fillColor: string): HTMLCanvasElement {
  const h = grid.length
  const w = Math.max(...grid.map((row) => row.length))
  const [canvas, ctx] = createCanvas(w, h)
  ctx.fillStyle = fillColor
  for (let y = 0; y < h; y++) {
    const row = grid[y]!
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]!
      if (ch === '.' || ch === ' ') continue
      ctx.fillRect(x, y, 1, 1)
    }
  }
  return canvas
}

function flipH(src: HTMLCanvasElement): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(src.width, src.height)
  ctx.translate(src.width, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(src, 0, 0)
  return canvas
}

// ============================================================================
// SPECIES 1: CAT GRIDS (20x20, facing RIGHT)
// Pattern tokens:
//   o = outline, w = main fur, s = fur shadow, a = coat patch/stripe 1, b = coat patch/stripe 2
//   p = inner ear, n = nose, c = blush cheek, e = eye, g = eye highlight
//   r = scarf main, d = scarf dark, h = scarf light
// ============================================================================

const CAT_IDLE_0 = [
  '....................',
  '.......oo....oo.....',
  '......oabo..owwo....',
  '......oapoooopwo....',
  '......oaawwwwwbwo...',
  '.....oaawwwwwwwbwo..',
  '.....owwgewwgewwo...',
  '.....owweewweewwo...',
  '.....owcwwnwwwcwo...',
  '..oo..owwwwwwwwo....',
  '.oawo..oorhhroo.....',
  '.obwo.orrrrrrdro....',
  '..owoorroowwwaawo...',
  '...ooo.ooowwwaawo...',
  '.......owbwwwsswo...',
  '.......owbwwwsswo...',
  '.......owwwoowwwo...',
  '.......owwwoowwwo...',
  '........ooo..ooo....',
  '....................'
]

const CAT_IDLE_1 = [
  '....................',
  '.......oo....oo.....',
  '......oabo..owwo....',
  '......oapoooopwo....',
  '......oaawwwwwbwo...',
  '.....oaawwwwwwwbwo..',
  '.....owwgewwgewwo...',
  '.....owweewweewwo...',
  '.....owcwwnwwwcwo...',
  '.oo...owwwwwwwwo....',
  'oawo...oorhhroo.....',
  'obwo..orrrrrrdro....',
  '.owoo.rroowwwaawo...',
  '..ooo..ooowwwaawo...',
  '.......owbwwwsswo...',
  '.......owbwwwsswo...',
  '.......owwwoowwwo...',
  '.......owwwoowwwo...',
  '........ooo..ooo....',
  '....................'
]

// Calm idle > 2s tail swish for cats
const CAT_IDLE_SWISH = [
  '....................',
  '.......oo....oo.....',
  '......oabo..owwo....',
  '......oapoooopwo....',
  '......oaawwwwwbwo...',
  '.....oaawwwwwwwbwo..',
  '.....owwgewwgewwo...',
  '.....owweewweewwo...',
  '...ooowcwwnwwwcwo...',
  '..oawoowwwwwwwwo....',
  '..obwo.oorhhroo.....',
  '...owoorrrrrrdro....',
  '....ooorroowwwaawo..',
  '......oooowwwaawo...',
  '.......owbwwwsswo...',
  '.......owbwwwsswo...',
  '.......owwwoowwwo...',
  '.......owwwoowwwo...',
  '........ooo..ooo....',
  '....................'
]

const CAT_IDLE_BLINK = [
  '....................',
  '.......oo....oo.....',
  '......oabo..owwo....',
  '......oapoooopwo....',
  '......oaawwwwwbwo...',
  '.....oaawwwwwwwbwo..',
  '.....owwwwwwwwwwo...',
  '.....owweewwwewwo...',
  '.....owcwwnwwwcwo...',
  '..oo..owwwwwwwwo....',
  '.oawo..oorhhroo.....',
  '.obwo.orrrrrrdro....',
  '..owoorroowwwaawo...',
  '...ooo.ooowwwaawo...',
  '.......owbwwwsswo...',
  '.......owbwwwsswo...',
  '.......owwwoowwwo...',
  '.......owwwoowwwo...',
  '........ooo..ooo....',
  '....................'
]

const CAT_SIT_0 = [
  '....................',
  '.......oo....oo.....',
  '......oabo..owwo....',
  '......oapoooopwo....',
  '......oaawwwwwbwo...',
  '.....oaawwwwwwwbwo..',
  '.....owwgewwgewwo...',
  '.....owweewweewwo...',
  '.....owcwwnwwwcwo...',
  '......owwwwwwwwo....',
  '.......oorhhroo.....',
  '.....oorrrrrrdro....',
  '....orraawwwwwwwo...',
  '...oooodawwwwsswo...',
  '..oawo.owbwwwsswo...',
  '.oabwo.owbwwwsswo...',
  '.owwo..owwwwwsswo...',
  '..oooo.owwwwwwwwo...',
  '.......oooooooooo...',
  '....................'
]

const CAT_SIT_BLINK = [
  '....................',
  '.......oo....oo.....',
  '......oabo..owwo....',
  '......oapoooopwo....',
  '......oaawwwwwbwo...',
  '.....oaawwwwwwwbwo..',
  '.....owwwwwwwwwwo...',
  '.....owweewwwewwo...',
  '.....owcwwnwwwcwo...',
  '......owwwwwwwwo....',
  '.......oorhhroo.....',
  '.....oorrrrrrdro....',
  '....orraawwwwwwwo...',
  '...oooodawwwwsswo...',
  '..oawo.owbwwwsswo...',
  '.oabwo.owbwwwsswo...',
  '.owwo..owwwwwsswo...',
  '..oooo.owwwwwwwwo...',
  '.......oooooooooo...',
  '....................'
]

// Level-headed steady run frames (zero head bounce/tilt!)
const CAT_RUN_0 = [
  '....................',
  '........oo....oo....',
  '.......oabo..owwo...',
  '.......oapoooopwo...',
  '.......oaawwwwwbwo..',
  '......oaawwwwwwwbwo.',
  '......owwgewwgewwo..',
  '......owweewweewwo..',
  '......owcwwnwwwcwo..',
  '.......owwwwwwwwo...',
  '..ooo...oorhhroo....',
  '.orrrroorrrrrrdro...',
  'oooodddooowwwaawo...',
  '.oaabo..owbwwwsswo..',
  '..ooo..owbwwwssswo..',
  '......owwwo..owwwo..',
  '.....owwwo....owwwo.',
  '......ooo......ooo..',
  '....................',
  '....................'
]

const CAT_RUN_1 = [
  '....................',
  '........oo....oo....',
  '.......oabo..owwo...',
  '.......oapoooopwo...',
  '.......oaawwwwwbwo..',
  '......oaawwwwwwwbwo.',
  '......owwgewwgewwo..',
  '......owweewweewwo..',
  '......owcwwnwwwcwo..',
  '.......owwwwwwwwo...',
  '.oooo...oorhhroo....',
  'orrrrroorrrrrrdro...',
  '.ooodddooowwwaawo...',
  '..oaabo.owbwwwsswo..',
  '...ooo..owbwwwsswo..',
  '........owwwoowwwo..',
  '........owwwoowwwo..',
  '.........ooo..ooo...',
  '....................',
  '....................'
]

const CAT_RUN_2 = [
  '....................',
  '........oo....oo....',
  '.......oabo..owwo...',
  '.......oapoooopwo...',
  '.......oaawwwwwbwo..',
  '......oaawwwwwwwbwo.',
  '......owwgewwgewwo..',
  '......owweewweewwo..',
  '......owcwwnwwwcwo..',
  '.......owwwwwwwwo...',
  '...ooo..oorhhroo....',
  '..orrrrorrrrrrdro...',
  '.ooooddooowwwaawo...',
  '.oaabo..owbwwwsswo..',
  '..ooo...owbwwssswo..',
  '........owwwo.owwo..',
  '.......owwwo...owwo.',
  '........ooo.....oo..',
  '....................',
  '....................'
]

const CAT_JUMP_UP = [
  '........oo....oo....',
  '.......oabo..owwo...',
  '.......oapoooopwo...',
  '.......oaawwwwwbwo..',
  '......oaawwwwwwwbwo.',
  '......owwgewwgewwo..',
  '......owweewweewwo..',
  '......owcwwnwwwcwo..',
  '.......owwwwwwwwo...',
  '........oorhhroo....',
  '......orrrrrrrdro...',
  '.....orroowwwaawo...',
  '....ordoowbwwwsswo..',
  '...oawo.owbwwwsswo..',
  '..obwo..owwwoowwwo..',
  '..ooo....ooo.owwwo..',
  '..............ooo...',
  '....................',
  '....................',
  '....................'
]

const CAT_JUMP_FALL = [
  '....................',
  '........oo....oo....',
  '.......oabo..owwo...',
  '.......oapoooopwo...',
  '.......oaawwwwwbwo..',
  '..oo..oaawwwwwwwbwo.',
  '.oawo.owwgewwgewwo..',
  '.obwo.owweewweewwo..',
  '..owo.owcwwnwwwcwo..',
  '...oo..owwwwwwwwo...',
  '...ooo..oorhhroo....',
  '..orrrrorrrrrrdro...',
  '...oood.oowwwaawo...',
  '.......owbwwwsswo...',
  '.......owbwwwsswo...',
  '......owwwo..owwwo..',
  '......owwwo..owwwo..',
  '.......ooo....ooo...',
  '....................',
  '....................'
]

const CAT_DASH = [
  '....................',
  '....................',
  '....................',
  '........oo..oo......',
  '.......oaboowwo.....',
  '.......oapoopwwo....',
  '........oaawwwwwwo..',
  '........owwgewwgewo.',
  '........owweewweewo.',
  '..ooooo.owcwwnwwwwo.',
  '.orrrrrrooorhhrooo..',
  'oorrrddddrrrrrrdro..',
  '.oooooooowwwaawwwwo.',
  '.oaaabboowbwwwssswo.',
  '..ooooo.owbwwsowwwo.',
  '........owwwo..ooo..',
  '.........ooo........',
  '....................',
  '....................',
  '....................'
]

// ============================================================================
// SPECIES 2: STARLIGHT BUNNY (20x20, tall vertical ears + pom-pom tail!)
// ============================================================================

const BUNNY_IDLE_0 = [
  '.......oo...oo......',
  '......owpo.owpo.....',
  '......owpo.owpo.....',
  '......owpo.owpo.....',
  '......owwo.owwo.....',
  '......owwoooowwo....',
  '.....owwwwwwwwwwo...',
  '.....owwgewwgewwo...',
  '.....owweewweewwo...',
  '.....owcwwnwwwcwo...',
  '......owwwwwwwwo....',
  '.......oorhhroo.....',
  '.....oorrrrrrdro....',
  '....orroowwwwwwo....',
  '...oooodowwwwwsswo..',
  '..owwwo.owwwwwsswo..',
  '..owwwo.owwwoowwwo..',
  '...ooo..owwwoowwwo..',
  '.........ooo..ooo...',
  '....................'
]

const BUNNY_IDLE_1 = [
  '.......oo...oo......',
  '......owpo.owpo.....',
  '......owpo.owpo.....',
  '......owpo.owpo.....',
  '......owwo.owwo.....',
  '......owwoooowwo....',
  '.....owwwwwwwwwwo...',
  '.....owwgewwgewwo...',
  '.....owweewweewwo...',
  '.....owcwwnwwwcwo...',
  '......owwwwwwwwo....',
  '.......oorhhroo.....',
  '....ooorrrrrrdro....',
  '...orrroowwwwwwo....',
  '...oooodowwwwwsswo..',
  '..owwwo.owwwwwsswo..',
  '..owwwo.owwwoowwwo..',
  '...ooo..owwwoowwwo..',
  '.........ooo..ooo...',
  '....................'
]

// Calm idle > 2s ear twitch for bunny
const BUNNY_IDLE_EAR = [
  '...........oo.......',
  '....ooo...owpo......',
  '...owppo..owpo......',
  '....owpo..owpo......',
  '.....owwo.owwo......',
  '......owwoooowwo....',
  '.....owwwwwwwwwwo...',
  '.....owwgewwgewwo...',
  '.....owweewweewwo...',
  '.....owcwwnwwwcwo...',
  '......owwwwwwwwo....',
  '.......oorhhroo.....',
  '.....oorrrrrrdro....',
  '....orroowwwwwwo....',
  '...oooodowwwwwsswo..',
  '..owwwo.owwwwwsswo..',
  '..owwwo.owwwoowwwo..',
  '...ooo..owwwoowwwo..',
  '.........ooo..ooo...',
  '....................'
]

const BUNNY_IDLE_BLINK = [
  '.......oo...oo......',
  '......owpo.owpo.....',
  '......owpo.owpo.....',
  '......owpo.owpo.....',
  '......owwo.owwo.....',
  '......owwoooowwo....',
  '.....owwwwwwwwwwo...',
  '.....owwwwwwwwwwo...',
  '.....owweewwwewwo...',
  '.....owcwwnwwwcwo...',
  '......owwwwwwwwo....',
  '.......oorhhroo.....',
  '.....oorrrrrrdro....',
  '....orroowwwwwwo....',
  '...oooodowwwwwsswo..',
  '..owwwo.owwwwwsswo..',
  '..owwwo.owwwoowwwo..',
  '...ooo..owwwoowwwo..',
  '.........ooo..ooo...',
  '....................'
]

const BUNNY_SIT_0 = [
  '.......oo...oo......',
  '......owpo.owpo.....',
  '......owpo.owpo.....',
  '......owpo.owpo.....',
  '......owwo.owwo.....',
  '......owwoooowwo....',
  '.....owwwwwwwwwwo...',
  '.....owwgewwgewwo...',
  '.....owweewweewwo...',
  '.....owcwwnwwwcwo...',
  '......owwwwwwwwo....',
  '.......oorhhroo.....',
  '.....oorrrrrrdro....',
  '....orroowwwwwwo....',
  '...oooodowwwwwsswo..',
  '..owwwoowwwwwwsswo..',
  '..owwwoowwwwwwsswo..',
  '...ooo.owwwwwwwwwo..',
  '.......ooooooooooo..',
  '....................'
]

const BUNNY_SIT_BLINK = [
  '.......oo...oo......',
  '......owpo.owpo.....',
  '......owpo.owpo.....',
  '......owpo.owpo.....',
  '......owwo.owwo.....',
  '......owwoooowwo....',
  '.....owwwwwwwwwwo...',
  '.....owwwwwwwwwwo...',
  '.....owweewwwewwo...',
  '.....owcwwnwwwcwo...',
  '......owwwwwwwwo....',
  '.......oorhhroo.....',
  '.....oorrrrrrdro....',
  '....orroowwwwwwo....',
  '...oooodowwwwwsswo..',
  '..owwwoowwwwwwsswo..',
  '..owwwoowwwwwwsswo..',
  '...ooo.owwwwwwwwwo..',
  '.......ooooooooooo..',
  '....................'
]

const BUNNY_RUN_0 = [
  '.......oo...oo......',
  '......owpo.owpo.....',
  '......owpo.owpo.....',
  '.......owpoowpo.....',
  '.......owwoowwo.....',
  '.......owwoooowwo...',
  '......owwwwwwwwwwo..',
  '......owwgewwgewwo..',
  '......owweewweewwo..',
  '......owcwwnwwwcwo..',
  '.......owwwwwwwwo...',
  '..ooo...oorhhroo....',
  '.orrrroorrrrrrdro...',
  'oooodddoowwwwwwo....',
  '..owwwo.owwwwwsswo..',
  '..owwwoowwwo.owwwo..',
  '...oooowwwo...owwwo.',
  '.......ooo.....ooo..',
  '....................',
  '....................'
]

const BUNNY_RUN_1 = [
  '.......oo...oo......',
  '......owpo.owpo.....',
  '......owpo.owpo.....',
  '.......owpoowpo.....',
  '.......owwoowwo.....',
  '.......owwoooowwo...',
  '......owwwwwwwwwwo..',
  '......owwgewwgewwo..',
  '......owweewweewwo..',
  '......owcwwnwwwcwo..',
  '.......owwwwwwwwo...',
  '.oooo...oorhhroo....',
  'orrrrroorrrrrrdro...',
  '.ooodddoowwwwwwo....',
  '..owwwo.owwwwwsswo..',
  '..owwwo.owwwoowwwo..',
  '...ooo..owwwoowwwo..',
  '.........ooo..ooo...',
  '....................',
  '....................'
]

const BUNNY_RUN_2 = [
  '.......oo...oo......',
  '......owpo.owpo.....',
  '......owpo.owpo.....',
  '.......owpoowpo.....',
  '.......owwoowwo.....',
  '.......owwoooowwo...',
  '......owwwwwwwwwwo..',
  '......owwgewwgewwo..',
  '......owweewweewwo..',
  '......owcwwnwwwcwo..',
  '.......owwwwwwwwo...',
  '...ooo..oorhhroo....',
  '..orrrrorrrrrrdro...',
  '.ooooddoowwwwwwo....',
  '..owwwo.owwwwwsswo..',
  '..owwwo.owwwo.owwo..',
  '...ooo.owwwo...owwo.',
  '........ooo.....oo..',
  '....................',
  '....................'
]

// Tall bunny ears gently tilt/bounce slightly backward while leaping!
const BUNNY_JUMP_UP = [
  '....oo...oo.........',
  '...owpo.owpo........',
  '....owpo.owpo.......',
  '.....owpo.owpo......',
  '......owwoowwo......',
  '.......owwoooowwo...',
  '......owwwwwwwwwwo..',
  '......owwgewwgewwo..',
  '......owweewweewwo..',
  '......owcwwnwwwcwo..',
  '.......owwwwwwwwo...',
  '........oorhhroo....',
  '......orrrrrrrdro...',
  '.....orroowwwwwwo...',
  '...owwwoowwwwwsswo..',
  '...owwwoowwwoowwwo..',
  '....ooo..ooo.owwwo..',
  '..............ooo...',
  '....................',
  '....................'
]

const BUNNY_JUMP_FALL = [
  '......oo....oo......',
  '.....owpo..owpo.....',
  '.....owpo..owpo.....',
  '......owpo.owpo.....',
  '......owwo.owwo.....',
  '......owwoooowwo....',
  '.....owwwwwwwwwwo...',
  '.....owwgewwgewwo...',
  '.....owweewweewwo...',
  '.....owcwwnwwwcwo...',
  '......owwwwwwwwo....',
  '...ooo..oorhhroo....',
  '..orrrrorrrrrrdro...',
  '...ooodoowwwwwwo....',
  '..owwwo.owwwwwsswo..',
  '..owwwoowwwo..owwwo.',
  '...ooo.owwwo..owwwo.',
  '........ooo....ooo..',
  '....................',
  '....................'
]

const BUNNY_DASH = [
  '....................',
  '....oooo..oooo......',
  '...owpppoowpppo.....',
  '.....ooowwwwooo.....',
  '.......owwwwwwwwo...',
  '.......owwgewwgewo..',
  '.......owweewweewo..',
  '.......owcwwnwwwwo..',
  '..ooooo.owwwwwwwwo..',
  '.orrrrrrooorhhroo...',
  'oorrrddddrrrrrrdro..',
  '.oooooooowwwwwwwwwo.',
  '..owwwo.owwwwwssswo.',
  '..owwwo.owwwwsowwwo.',
  '...ooo..owwwo..ooo..',
  '.........ooo........',
  '....................',
  '....................',
  '....................',
  '....................'
]

// ============================================================================
// SPECIES 3: FLUFFY SAMOYED / MALTESE (20x20, fluffy coat, rounded ears, curled tail!)
// ============================================================================

const SAMOYED_IDLE_0 = [
  '....................',
  '.....ooo....ooo.....',
  '....owwwoooowwwo....',
  '....owwwwwwwwwwo....',
  '...owwwwwwwwwwwwo...',
  '...owwwgewwgewwwo...',
  '...owwweewweewwwo...',
  '...owwcwwnnwwcwwo...',
  '....owwwwwwwwwwo....',
  '..ooo.owwwwwwwo.....',
  '.owwwo..oorhhroo....',
  'owwwwwoorrrrrrdro...',
  'owwswoooorwwwwwwwo..',
  '.oooo..owwwwwwwwwo..',
  '.......owwwwwwsswo..',
  '.......owwwwwwsswo..',
  '.......owwwoowwwo...',
  '.......owwwoowwwo...',
  '........ooo..ooo....',
  '....................'
]

const SAMOYED_IDLE_1 = [
  '....................',
  '.....ooo....ooo.....',
  '....owwwoooowwwo....',
  '....owwwwwwwwwwo....',
  '...owwwwwwwwwwwwo...',
  '...owwwgewwgewwwo...',
  '...owwweewweewwwo...',
  '...owwcwwnnwwcwwo...',
  '....owwwwwwwwwwo....',
  '.ooo..owwwwwwwo.....',
  'owwwo...oorhhroo....',
  'owwwwwoorrrrrrdro...',
  '.owswoooorwwwwwwwo..',
  '..ooo..owwwwwwwwwo..',
  '.......owwwwwwsswo..',
  '.......owwwwwwsswo..',
  '.......owwwoowwwo...',
  '.......owwwoowwwo...',
  '........ooo..ooo....',
  '....................'
]

// Calm idle > 2s happy curled-tail wag for Samoyed
const SAMOYED_IDLE_WAG = [
  '....................',
  '.....ooo....ooo.....',
  '....owwwoooowwwo....',
  '....owwwwwwwwwwo....',
  '...owwwwwwwwwwwwo...',
  '...owwwgewwgewwwo...',
  '...owwweewweewwwo...',
  '...owwcwwnnwwcwwo...',
  '.oooowwwwwwwwwwo....',
  'owwwo.owwwwwwwo.....',
  'owwwwo..oorhhroo....',
  '.owswooorrrrrrdro...',
  '..oooooorwwwwwwwwo..',
  '.......owwwwwwwwwo..',
  '.......owwwwwwsswo..',
  '.......owwwwwwsswo..',
  '.......owwwoowwwo...',
  '.......owwwoowwwo...',
  '........ooo..ooo....',
  '....................'
]

const SAMOYED_IDLE_BLINK = [
  '....................',
  '.....ooo....ooo.....',
  '....owwwoooowwwo....',
  '....owwwwwwwwwwo....',
  '...owwwwwwwwwwwwo...',
  '...owwwwwwwwwwwwo...',
  '...owwweewwwewwwo...',
  '...owwcwwnnwwcwwo...',
  '....owwwwwwwwwwo....',
  '..ooo.owwwwwwwo.....',
  '.owwwo..oorhhroo....',
  'owwwwwoorrrrrrdro...',
  'owwswoooorwwwwwwwo..',
  '.oooo..owwwwwwwwwo..',
  '.......owwwwwwsswo..',
  '.......owwwwwwsswo..',
  '.......owwwoowwwo...',
  '.......owwwoowwwo...',
  '........ooo..ooo....',
  '....................'
]

const SAMOYED_SIT_0 = [
  '....................',
  '.....ooo....ooo.....',
  '....owwwoooowwwo....',
  '....owwwwwwwwwwo....',
  '...owwwwwwwwwwwwo...',
  '...owwwgewwgewwwo...',
  '...owwweewweewwwo...',
  '...owwcwwnnwwcwwo...',
  '....owwwwwwwwwwo....',
  '......owwwwwwwo.....',
  '..ooo...oorhhroo....',
  '.owwwooorrrrrrdro...',
  'owwwwwoorwwwwwwwwo..',
  'owwswooowwwwwwwwwo..',
  '.oooo..owwwwwwsswo..',
  '.......owwwwwwsswo..',
  '.......owwwwwwsswo..',
  '.......owwwwwwwwwo..',
  '.......ooooooooooo..',
  '....................'
]

const SAMOYED_SIT_BLINK = [
  '....................',
  '.....ooo....ooo.....',
  '....owwwoooowwwo....',
  '....owwwwwwwwwwo....',
  '...owwwwwwwwwwwwo...',
  '...owwwwwwwwwwwwo...',
  '...owwweewwwewwwo...',
  '...owwcwwnnwwcwwo...',
  '....owwwwwwwwwwo....',
  '......owwwwwwwo.....',
  '..ooo...oorhhroo....',
  '.owwwooorrrrrrdro...',
  'owwwwwoorwwwwwwwwo..',
  'owwswooowwwwwwwwwo..',
  '.oooo..owwwwwwsswo..',
  '.......owwwwwwsswo..',
  '.......owwwwwwsswo..',
  '.......owwwwwwwwwo..',
  '.......ooooooooooo..',
  '....................'
]

const SAMOYED_RUN_0 = [
  '....................',
  '......ooo....ooo....',
  '.....owwwoooowwwo...',
  '.....owwwwwwwwwwo...',
  '....owwwwwwwwwwwwo..',
  '....owwwgewwgewwwo..',
  '....owwweewweewwwo..',
  '....owwcwwnnwwcwwo..',
  '.....owwwwwwwwwwo...',
  '..ooo..owwwwwwwo....',
  '.owwwo..oorhhroo....',
  'owwwwwoorrrrrrdro...',
  'oooodddoowwwwwwwwo..',
  '.......owwwwwwsswo..',
  '......owwwwwwwsswo..',
  '......owwwo..owwwo..',
  '.....owwwo....owwwo.',
  '......ooo......ooo..',
  '....................',
  '....................'
]

const SAMOYED_RUN_1 = [
  '....................',
  '......ooo....ooo....',
  '.....owwwoooowwwo...',
  '.....owwwwwwwwwwo...',
  '....owwwwwwwwwwwwo..',
  '....owwwgewwgewwwo..',
  '....owwweewweewwwo..',
  '....owwcwwnnwwcwwo..',
  '.....owwwwwwwwwwo...',
  '.ooo...owwwwwwwo....',
  'owwwo...oorhhroo....',
  'owwwwwoorrrrrrdro...',
  '.ooodddoowwwwwwwwo..',
  '.......owwwwwwsswo..',
  '.......owwwwwwsswo..',
  '........owwwoowwwo..',
  '........owwwoowwwo..',
  '.........ooo..ooo...',
  '....................',
  '....................'
]

const SAMOYED_RUN_2 = [
  '....................',
  '......ooo....ooo....',
  '.....owwwoooowwwo...',
  '.....owwwwwwwwwwo...',
  '....owwwwwwwwwwwwo..',
  '....owwwgewwgewwwo..',
  '....owwweewweewwwo..',
  '....owwcwwnnwwcwwo..',
  '.....owwwwwwwwwwo...',
  '..ooo..owwwwwwwo....',
  '.owwwo..oorhhroo....',
  'owwwwwoorrrrrrdro...',
  '.ooooddoowwwwwwwwo..',
  '.......owwwwwwsswo..',
  '.......owwwwwssswo..',
  '........owwwo.owwo..',
  '.......owwwo...owwo.',
  '........ooo.....oo..',
  '....................',
  '....................'
]

const SAMOYED_JUMP_UP = [
  '......ooo....ooo....',
  '.....owwwoooowwwo...',
  '.....owwwwwwwwwwo...',
  '....owwwwwwwwwwwwo..',
  '....owwwgewwgewwwo..',
  '....owwweewweewwwo..',
  '....owwcwwnnwwcwwo..',
  '.....owwwwwwwwwwo...',
  '.......owwwwwwwo....',
  '..ooo...oorhhroo....',
  '.owwwoorrrrrrrdro...',
  'owwwwwoowwwwwwwwwo..',
  '.oooo..owwwwwwsswo..',
  '.......owwwwwwsswo..',
  '.......owwwoowwwo...',
  '........ooo.owwwo...',
  '.............ooo....',
  '....................',
  '....................',
  '....................'
]

const SAMOYED_JUMP_FALL = [
  '....................',
  '......ooo....ooo....',
  '.....owwwoooowwwo...',
  '.....owwwwwwwwwwo...',
  '....owwwwwwwwwwwwo..',
  '....owwwgewwgewwwo..',
  '....owwweewweewwwo..',
  '....owwcwwnnwwcwwo..',
  '..oooowwwwwwwwwwo...',
  '.owwwo.owwwwwwwo....',
  'owwwwwo.oorhhroo....',
  '.oooodorrrrrrrdro...',
  '.......oowwwwwwwwo..',
  '.......owwwwwwsswo..',
  '.......owwwwwwsswo..',
  '......owwwo..owwwo..',
  '......owwwo..owwwo..',
  '.......ooo....ooo...',
  '....................',
  '....................'
]

const SAMOYED_DASH = [
  '....................',
  '....................',
  '.......ooo..ooo.....',
  '......owwwoowwwo....',
  '......owwwwwwwwwwo..',
  '......owwwgewwgewo..',
  '......owwweewweewo..',
  '......owwcwwnnwwwo..',
  '..ooo..owwwwwwwwwo..',
  '.owwwwo.oorhhroo....',
  'owrrrrroorrrrrrdro..',
  '.ooodddoowwwwwwwwwo.',
  '.......owwwwwwssswo.',
  '.......owwwwwsowwwo.',
  '........owwwo..ooo..',
  '.........ooo........',
  '....................',
  '....................',
  '....................',
  '....................'
]

// ============================================================================
// SPECIES 4: SHIBA INU (20x20, tan coat + cream cheeks/snout/belly + curled tail!)
// Tokens:
//   w = tan golden fur, s = deeper tan shadow, a = cream-white Shiba cheeks/snout/belly/eyebrows
// ============================================================================

const SHIBA_IDLE_0 = [
  '....................',
  '.......oo....oo.....',
  '......owwo..owwo....',
  '......owpoooopwo....',
  '......owwwwwwwwwo...',
  '.....owwawawawwwwo..',
  '.....owwgewwgewwwo..',
  '.....owaeeaaeeaawo..',
  '.....oaaaannaaaao...',
  '..ooo.oaaaaaaaaao...',
  '.owwao..oorhhroo....',
  'owawwaoorrrrrrdro...',
  'owaawooorwwwwaaawo..',
  '.oooo..owwwwwaaawo..',
  '.......owwwsaaaawo..',
  '.......owwwsaaaawo..',
  '.......oaaaooaaao...',
  '.......oaaaooaaao...',
  '........ooo..ooo....',
  '....................'
]

const SHIBA_IDLE_1 = [
  '....................',
  '.......oo....oo.....',
  '......owwo..owwo....',
  '......owpoooopwo....',
  '......owwwwwwwwwo...',
  '.....owwawawawwwwo..',
  '.....owwgewwgewwwo..',
  '.....owaeeaaeeaawo..',
  '.....oaaaannaaaao...',
  '.ooo..oaaaaaaaaao...',
  'owwao...oorhhroo....',
  'owawwaoorrrrrrdro...',
  '.oaawooorwwwwaaawo..',
  '..ooo..owwwwwaaawo..',
  '.......owwwsaaaawo..',
  '.......owwwsaaaawo..',
  '.......oaaaooaaao...',
  '.......oaaaooaaao...',
  '........ooo..ooo....',
  '....................'
]

// Calm idle > 2s curled-tail wag for Shiba Inu
const SHIBA_IDLE_WAG = [
  '....................',
  '.......oo....oo.....',
  '......owwo..owwo....',
  '......owpoooopwo....',
  '......owwwwwwwwwo...',
  '.....owwawawawwwwo..',
  '.....owwgewwgewwwo..',
  '.....owaeeaaeeaawo..',
  '.ooooaaaannaaaao....',
  'owwao.oaaaaaaaaao...',
  'owawwa..oorhhroo....',
  '.oaawooorrrrrrdro...',
  '..oooooorwwwwaaawo..',
  '.......owwwwwaaawo..',
  '.......owwwsaaaawo..',
  '.......owwwsaaaawo..',
  '.......oaaaooaaao...',
  '.......oaaaooaaao...',
  '........ooo..ooo....',
  '....................'
]

const SHIBA_IDLE_BLINK = [
  '....................',
  '.......oo....oo.....',
  '......owwo..owwo....',
  '......owpoooopwo....',
  '......owwwwwwwwwo...',
  '.....owwawawawwwwo..',
  '.....owwwwwwwwwwwo..',
  '.....owaeeaaeeaawo..',
  '.....oaaaannaaaao...',
  '..ooo.oaaaaaaaaao...',
  '.owwao..oorhhroo....',
  'owawwaoorrrrrrdro...',
  'owaawooorwwwwaaawo..',
  '.oooo..owwwwwaaawo..',
  '.......owwwsaaaawo..',
  '.......owwwsaaaawo..',
  '.......oaaaooaaao...',
  '.......oaaaooaaao...',
  '........ooo..ooo....',
  '....................'
]

const SHIBA_SIT_0 = [
  '....................',
  '.......oo....oo.....',
  '......owwo..owwo....',
  '......owpoooopwo....',
  '......owwwwwwwwwo...',
  '.....owwawawawwwwo..',
  '.....owwgewwgewwwo..',
  '.....owaeeaaeeaawo..',
  '.....oaaaannaaaao...',
  '......oaaaaaaaaao...',
  '..ooo...oorhhroo....',
  '.owwaooorrrrrrdro...',
  'owawwaoorwwwwaaawo..',
  'owaawooowwwwwaaawo..',
  '.oooo..owwwsaaaawo..',
  '.......owwwsaaaawo..',
  '.......owwwsaaaawo..',
  '.......owwwaaaaawo..',
  '.......ooooooooooo..',
  '....................'
]

const SHIBA_SIT_BLINK = [
  '....................',
  '.......oo....oo.....',
  '......owwo..owwo....',
  '......owpoooopwo....',
  '......owwwwwwwwwo...',
  '.....owwawawawwwwo..',
  '.....owwwwwwwwwwwo..',
  '.....owaeeaaeeaawo..',
  '.....oaaaannaaaao...',
  '......oaaaaaaaaao...',
  '..ooo...oorhhroo....',
  '.owwaooorrrrrrdro...',
  'owawwaoorwwwwaaawo..',
  'owaawooowwwwwaaawo..',
  '.oooo..owwwsaaaawo..',
  '.......owwwsaaaawo..',
  '.......owwwsaaaawo..',
  '.......owwwaaaaawo..',
  '.......ooooooooooo..',
  '....................'
]

const SHIBA_RUN_0 = [
  '....................',
  '........oo....oo....',
  '.......owwo..owwo...',
  '.......owpoooopwo...',
  '.......owwwwwwwwwo..',
  '......owwawawawwwwo.',
  '......owwgewwgewwwo.',
  '......owaeeaaeeaawo.',
  '......oaaaannaaaao..',
  '..ooo..oaaaaaaaaao..',
  '.owwao..oorhhroo....',
  'owawwaoorrrrrrdro...',
  'oooodddoowwwwaaawo..',
  '.......owwwsaaaawo..',
  '......owwwwsaaaawo..',
  '......oaaao..oaaao..',
  '.....oaaao....oaaao.',
  '......ooo......ooo..',
  '....................',
  '....................'
]

const SHIBA_RUN_1 = [
  '....................',
  '........oo....oo....',
  '.......owwo..owwo...',
  '.......owpoooopwo...',
  '.......owwwwwwwwwo..',
  '......owwawawawwwwo.',
  '......owwgewwgewwwo.',
  '......owaeeaaeeaawo.',
  '......oaaaannaaaao..',
  '.ooo...oaaaaaaaaao..',
  'owwao...oorhhroo....',
  'owawwaoorrrrrrdro...',
  '.ooodddoowwwwaaawo..',
  '.......owwwsaaaawo..',
  '.......owwwsaaaawo..',
  '........oaaaooaaao..',
  '........oaaaooaaao..',
  '.........ooo..ooo...',
  '....................',
  '....................'
]

const SHIBA_RUN_2 = [
  '....................',
  '........oo....oo....',
  '.......owwo..owwo...',
  '.......owpoooopwo...',
  '.......owwwwwwwwwo..',
  '......owwawawawwwwo.',
  '......owwgewwgewwwo.',
  '......owaeeaaeeaawo.',
  '......oaaaannaaaao..',
  '..ooo..oaaaaaaaaao..',
  '.owwao..oorhhroo....',
  'owawwaoorrrrrrdro...',
  '.ooooddoowwwwaaawo..',
  '.......owwwsaaaawo..',
  '.......owwwsaaaawo..',
  '........oaaao.oaao..',
  '.......oaaao...oaao.',
  '........ooo.....oo..',
  '....................',
  '....................'
]

const SHIBA_JUMP_UP = [
  '........oo....oo....',
  '.......owwo..owwo...',
  '.......owpoooopwo...',
  '.......owwwwwwwwwo..',
  '......owwawawawwwwo.',
  '......owwgewwgewwwo.',
  '......owaeeaaeeaawo.',
  '......oaaaannaaaao..',
  '.......oaaaaaaaaao..',
  '..ooo...oorhhroo....',
  '.owwaoorrrrrrrdro...',
  'owawwaoowwwwwaaawo..',
  '.oooo..owwwsaaaawo..',
  '.......owwwsaaaawo..',
  '.......oaaaooaaao...',
  '........ooo.oaaao...',
  '.............ooo....',
  '....................',
  '....................',
  '....................'
]

const SHIBA_JUMP_FALL = [
  '....................',
  '........oo....oo....',
  '.......owwo..owwo...',
  '.......owpoooopwo...',
  '.......owwwwwwwwwo..',
  '......owwawawawwwwo.',
  '......owwgewwgewwwo.',
  '......owaeeaaeeaawo.',
  '..ooooaaaaannaaaao..',
  '.owwao.oaaaaaaaaao..',
  'owawwao.oorhhroo....',
  '.oooodorrrrrrrdro...',
  '.......oowwwwaaawo..',
  '.......owwwsaaaawo..',
  '.......owwwsaaaawo..',
  '......oaaao..oaaao..',
  '......oaaao..oaaao..',
  '.......ooo....ooo...',
  '....................',
  '....................'
]

const SHIBA_DASH = [
  '....................',
  '....................',
  '....................',
  '........oo..oo......',
  '.......owwoowwo.....',
  '.......owpoopwwo....',
  '........owwawawwo...',
  '........owwgewwgewo.',
  '........owaeeaaeeao.',
  '..ooo...oaaaannaaao.',
  '.owwao..oorhhrooo...',
  'orrrrrroorrrrrrdro..',
  '.ooodddoowwwwaaaawo.',
  '.......owwwsaaaaawo.',
  '.......owwwsaoaaao..',
  '........oaaao..ooo..',
  '.........ooo........',
  '....................',
  '....................',
  '....................'
]

// ============================================================================
// PALETTE BUILDER FOR ALL 8 CHARACTERS + 4 SCARF COLORS
// ============================================================================

function getCharacterPalette(charId: CharacterId, scarfId: ScarfColorId): Record<string, string> {
  const scarf = getScarfById(scarfId)
  const scarfTokens = {
    r: scarf.main,
    d: scarf.dark,
    h: scarf.light
  }

  switch (charId) {
    case 'cat-mochi':
      return {
        o: '#231538',
        w: '#fffaf5',
        s: '#dfd4ec',
        a: '#fffaf5',
        b: '#fffaf5',
        p: '#ff9ec4',
        n: '#ff8fb8',
        c: '#ffb5d2',
        e: '#1c1030',
        g: '#ffffff',
        ...scarfTokens
      }
    case 'cat-calico':
      return {
        o: '#241432',
        w: '#fff8ef',
        s: '#dfd2e3',
        a: '#f2903d', // warm orange calico patch
        b: '#4f3338', // deep brown calico patch
        p: '#ff9ec4',
        n: '#ff8ea8',
        c: '#fff8ef',
        e: '#1c1030',
        g: '#ffffff',
        ...scarfTokens
      }
    case 'cat-ginger':
      return {
        o: '#2b1526',
        w: '#ffb24d',
        s: '#e0862b',
        a: '#d66e1f', // soft tabby orange-brown stripes
        b: '#ffd899', // warm golden cream highlight
        p: '#ff9eb8',
        n: '#ff7d8a',
        c: '#ffcf8f',
        e: '#1f1024',
        g: '#ffffff',
        ...scarfTokens
      }
    case 'cat-midnight':
      return {
        o: '#0c0717',
        w: '#281d42',
        s: '#1b1230',
        a: '#382a59', // subtle moonlight purple sheen
        b: '#281d42',
        p: '#5c4178',
        n: '#7a5c94',
        c: '#281d42',
        e: '#ffd84d', // glowing golden eyes!
        g: '#fffbe0',
        ...scarfTokens
      }
    case 'cat-blue':
      return {
        o: '#1c1733',
        w: '#96a5c7',
        s: '#7382a6',
        a: '#b4c2e0', // pastel silver-blue sheen
        b: '#8595b8',
        p: '#dfa6c4',
        n: '#6b6f8f',
        c: '#b5b8d9',
        e: '#254a42', // soft emerald-teal Russian Blue eyes
        g: '#e8fff7',
        ...scarfTokens
      }
    case 'bunny-starlight':
      return {
        o: '#26153b',
        w: '#fff9fc',
        s: '#e0d3ed',
        a: '#fff9fc',
        b: '#fff9fc',
        p: '#ffaccf',
        n: '#ff8cb8',
        c: '#ffbdd9',
        e: '#29153d',
        g: '#ffffff',
        ...scarfTokens
      }
    case 'dog-samoyed':
      return {
        o: '#26183b',
        w: '#ffffff',
        s: '#dfe4f2',
        a: '#ffffff',
        b: '#ffffff',
        p: '#ffb3cf',
        n: '#231633',
        c: '#ffc4db',
        e: '#1c102e',
        g: '#ffffff',
        ...scarfTokens
      }
    case 'dog-shiba':
      return {
        o: '#291529',
        w: '#e39444', // warm golden tan
        s: '#c47229', // rich tan shadow
        a: '#fff3db', // iconic Shiba cream cheeks/snout/belly
        b: '#fff3db',
        p: '#f0b89e',
        n: '#231324',
        c: '#fff3db',
        e: '#1c1026',
        g: '#ffffff',
        ...scarfTokens
      }
    case 'bear-black':
      return {
        o: '#0c0814',
        w: '#2a2438', // deep charcoal-black bear fur
        s: '#1b1626',
        a: '#4a405e', // soft muzzle highlight
        b: '#ffefc2', // signature warm-cream crescent chest mark!
        p: '#5c4b6e',
        n: '#140f1c',
        c: '#3d3352',
        e: '#100a18',
        g: '#fffbe0',
        ...scarfTokens
      }
    case 'bear-sun':
      return {
        o: '#120a14',
        w: '#332226', // sleek dark brown-black sun bear fur
        s: '#211419',
        a: '#c98e4b', // warm amber snout
        b: '#ffbf3b', // iconic golden-amber sun bear chest bib!
        p: '#8c5a3c',
        n: '#1a0e12',
        c: '#523438',
        e: '#140a14',
        g: '#fff8cc',
        ...scarfTokens
      }
    case 'bear-polar':
      return {
        o: '#1f2b45',
        w: '#f7fbff', // pure snowy arctic white fur
        s: '#c4ddf5', // soft ice-blue shading
        a: '#ffffff',
        b: '#d8ecff', // subtle frosted chest fluff
        p: '#b8d7f5',
        n: '#1c263d',
        c: '#cfe8ff',
        e: '#182238',
        g: '#ffffff',
        ...scarfTokens
      }
    case 'fox-brown':
      return {
        o: '#26121b',
        w: '#c95e2c', // warm russet-brown fox coat
        s: '#963d1b',
        a: '#381e1c', // dark russet ear tips & paws
        b: '#fff4e3', // fluffy snowy white tail tip & cheeks!
        p: '#f0b59c',
        n: '#1c0e14',
        c: '#fff4e3',
        e: '#1a0e1a',
        g: '#ffffff',
        ...scarfTokens
      }
    case 'fox-kitsune':
      return {
        o: '#261026',
        w: '#fff9fc', // snow-white shrine kitsune coat
        s: '#e3d6eb',
        a: '#d9324e', // crimson shrine accents on ear tips & markings
        b: '#ffcf4d', // golden shrine shimmer on tail & cheek marks!
        p: '#ff8aa3',
        n: '#b82542',
        c: '#ff96ad',
        e: '#b81f3d', // mystic ruby shrine eyes
        g: '#fff7cc',
        ...scarfTokens
      }
  }
}

// ============================================================================
// SPECIES 5: BEAR GRIDS (20x20, facing RIGHT — rounded ears, cozy snout, chest bib `b`)
// ============================================================================

const BEAR_IDLE_0 = [
  '....................',
  '.....ooo....ooo.....',
  '....owpwo..owpwo....',
  '....oowwwwwwwwoo....',
  '....owwwwwwwwwwo....',
  '....owwgewwgewwo....',
  '....owweewweewwo....',
  '....owcwaanwwcwo....',
  '.....owwaaaawwo.....',
  '......oorhhroo......',
  '.....orrrrrrdro.....',
  '...oooroowbwwwo.....',
  '..owwwoowbbbwwwo....',
  '...ooo.owwbbwswo....',
  '.......owwwwwswo....',
  '.......owwwwwswo....',
  '.......owwwoowwwo...',
  '.......owwwoowwwo...',
  '........ooo..ooo....',
  '....................'
]

const BEAR_IDLE_1 = [
  '....................',
  '....................',
  '.....ooo....ooo.....',
  '....owpwo..owpwo....',
  '....oowwwwwwwwoo....',
  '....owwwwwwwwwwo....',
  '....owwgewwgewwo....',
  '....owweewweewwo....',
  '....owcwaanwwcwo....',
  '.....owwaaaawwo.....',
  '......oorhhroo......',
  '...ooorrrrrrdro.....',
  '..owwwoowbbbwwwo....',
  '...ooo.owwbbwswo....',
  '.......owwwwwswo....',
  '.......owwwwwswo....',
  '.......owwwoowwwo...',
  '.......owwwoowwwo...',
  '........ooo..ooo....',
  '....................'
]

const BEAR_IDLE_BLINK = [
  '....................',
  '.....ooo....ooo.....',
  '....owpwo..owpwo....',
  '....oowwwwwwwwoo....',
  '....owwwwwwwwwwo....',
  '....owwwwwwwwwwo....',
  '....owweewwwewwo....',
  '....owcwaanwwcwo....',
  '.....owwaaaawwo.....',
  '......oorhhroo......',
  '.....orrrrrrdro.....',
  '...oooroowbwwwo.....',
  '..owwwoowbbbwwwo....',
  '...ooo.owwbbwswo....',
  '.......owwwwwswo....',
  '.......owwwwwswo....',
  '.......owwwoowwwo...',
  '.......owwwoowwwo...',
  '........ooo..ooo....',
  '....................'
]

const BEAR_SIT_0 = [
  '....................',
  '.....ooo....ooo.....',
  '....owpwo..owpwo....',
  '....oowwwwwwwwoo....',
  '....owwwwwwwwwwo....',
  '....owwgewwgewwo....',
  '....owweewweewwo....',
  '....owcwaanwwcwo....',
  '.....owwaaaawwo.....',
  '......oorhhroo......',
  '.....orrrrrrdro.....',
  '....orowwbbbwwwo....',
  '...oooowwbbbwswo....',
  '..owwwoowwbbwswo....',
  '..owwwoowwwwwswo....',
  '...ooo.owwwwwswo....',
  '......owwwwwwwwwo...',
  '......owwwwwwwwwo...',
  '.......ooooooooo....',
  '....................'
]

const BEAR_SIT_BLINK = [
  '....................',
  '.....ooo....ooo.....',
  '....owpwo..owpwo....',
  '....oowwwwwwwwoo....',
  '....owwwwwwwwwwo....',
  '....owwwwwwwwwwo....',
  '....owweewwwewwo....',
  '....owcwaanwwcwo....',
  '.....owwaaaawwo.....',
  '......oorhhroo......',
  '.....orrrrrrdro.....',
  '....orowwbbbwwwo....',
  '...oooowwbbbwswo....',
  '..owwwoowwbbwswo....',
  '..owwwoowwwwwswo....',
  '...ooo.owwwwwswo....',
  '......owwwwwwwwwo...',
  '......owwwwwwwwwo...',
  '.......ooooooooo....',
  '....................'
]

const BEAR_RUN_0 = [
  '....................',
  '......ooo....ooo....',
  '.....owpwo..owpwo...',
  '.....oowwwwwwwwoo...',
  '.....owwwwwwwwwwo...',
  '.....owwgewwgewwo...',
  '.....owweewweewwo...',
  '.....owcwaanwwcwo...',
  '......owwaaaawwo....',
  '.......oorhhroo.....',
  '....oorrrrrrdro.....',
  '..oowwoowbbbwwwo....',
  '..owwwoowwbbwswo....',
  '...ooo.owwwwwswo....',
  '......owwwwwsswo....',
  '.....owwwo..owwwo...',
  '....owwwo....owwwo..',
  '.....ooo......ooo...',
  '....................',
  '....................'
]

const BEAR_RUN_1 = [
  '....................',
  '......ooo....ooo....',
  '.....owpwo..owpwo...',
  '.....oowwwwwwwwoo...',
  '.....owwwwwwwwwwo...',
  '.....owwgewwgewwo...',
  '.....owweewweewwo...',
  '.....owcwaanwwcwo...',
  '......owwaaaawwo....',
  '.......oorhhroo.....',
  '....oorrrrrrdro.....',
  '...oowoowbbbwwwo....',
  '...owwoowwbbwswo....',
  '....oo.owwwwwswo....',
  '.......owwwwsswo....',
  '.......owwwoowwo....',
  '........owwwoowwo...',
  '.........ooo..oo....',
  '....................',
  '....................'
]

const BEAR_JUMP_UP = [
  '......ooo....ooo....',
  '.....owpwo..owpwo...',
  '.....oowwwwwwwwoo...',
  '.....owwwwwwwwwwo...',
  '.....owwgewwgewwo...',
  '.....owweewweewwo...',
  '.....owcwaanwwcwo...',
  '......owwaaaawwo....',
  '.......oorhhroo.....',
  '....oorrrrrrdro.....',
  '...oowoowbbbwwwo....',
  '..owwwoowwbbwswo....',
  '...ooo.owwwwwswo....',
  '......owwwwwsswo....',
  '.....owwwo..owwwo...',
  '.....oooo....oooo...',
  '....................',
  '....................',
  '....................',
  '....................'
]

const BEAR_JUMP_FALL = [
  '....................',
  '......ooo....ooo....',
  '.....owpwo..owpwo...',
  '.....oowwwwwwwwoo...',
  '.....owwwwwwwwwwo...',
  '.....owwgewwgewwo...',
  '.....owweewweewwo...',
  '.....owcwaanwwcwo...',
  '......owwaaaawwo....',
  '.......oorhhroo.....',
  '....oorrrrrrdro.....',
  '...oowoowbbbwwwo....',
  '..owwwoowwbbwswo....',
  '...ooo.owwwwwswo....',
  '......owwwoowwwo....',
  '.....owwwo..owwwo...',
  '......ooo....ooo....',
  '....................',
  '....................',
  '....................'
]

const BEAR_DASH = [
  '....................',
  '....................',
  '.......ooo....ooo...',
  '......owpwo..owpwo..',
  '......oowwwwwwwwoo..',
  '......owwgewwgewwo..',
  '......owweewweewwo..',
  '......owcwaanwwcwo..',
  '..ooo..owwaaaawwo...',
  '.orrrrooorhhroo.....',
  'orrrddrrrrrrrrro....',
  '..oooowwwbbbwwwwo...',
  '....owwwwwwbbsswo...',
  '....owwwo...owwwo...',
  '.....ooo.....ooo....',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................'
]

// ============================================================================
// SPECIES 6: FOX GRIDS (20x20, facing RIGHT — tall pointed ears `a`, lush bushy tail `b`)
// ============================================================================

const FOX_IDLE_0 = [
  '....................',
  '......oo......oo....',
  '.....oaao....oaao...',
  '.....oapo....oapo...',
  '.....owpoooooopwo...',
  '.....owwwwwwwwwwo...',
  '.....owwgewwgewwo...',
  '.....owweewweewwo...',
  '.....obbbwnwwbbbo...',
  '.ooo..obbbbbbbbo....',
  'obbbo..oorhhroo.....',
  'obbwo.orrrrrrdro....',
  '.owwoorroowwwbbwo...',
  '..owwo.ooowwwbbwo...',
  '...ooo..owwwwsswo...',
  '........owwwwsswo...',
  '........oaao.oaao...',
  '........oaao.oaao...',
  '.........oo...oo....',
  '....................'
]

const FOX_IDLE_1 = [
  '....................',
  '......oo......oo....',
  '.....oaao....oaao...',
  '.....oapo....oapo...',
  '.....owpoooooopwo...',
  '.....owwwwwwwwwwo...',
  '.....owwgewwgewwo...',
  '.....owweewweewwo...',
  '.ooo.obbbwnwwbbbo...',
  'obbbo.obbbbbbbbo....',
  'obbwo..oorhhroo.....',
  '.owwo.orrrrrrdro....',
  '..owoorroowwwbbwo...',
  '...ooo.ooowwwbbwo...',
  '........owwwwsswo...',
  '........owwwwsswo...',
  '........oaao.oaao...',
  '........oaao.oaao...',
  '.........oo...oo....',
  '....................'
]

const FOX_IDLE_BLINK = [
  '....................',
  '......oo......oo....',
  '.....oaao....oaao...',
  '.....oapo....oapo...',
  '.....owpoooooopwo...',
  '.....owwwwwwwwwwo...',
  '.....owwwwwwwwwwo...',
  '.....owweewwwewwo...',
  '.....obbbwnwwbbbo...',
  '.ooo..obbbbbbbbo....',
  'obbbo..oorhhroo.....',
  'obbwo.orrrrrrdro....',
  '.owwoorroowwwbbwo...',
  '..owwo.ooowwwbbwo...',
  '...ooo..owwwwsswo...',
  '........owwwwsswo...',
  '........oaao.oaao...',
  '........oaao.oaao...',
  '.........oo...oo....',
  '....................'
]

const FOX_SIT_0 = [
  '....................',
  '......oo......oo....',
  '.....oaao....oaao...',
  '.....oapo....oapo...',
  '.....owpoooooopwo...',
  '.....owwwwwwwwwwo...',
  '.....owwgewwgewwo...',
  '.....owweewweewwo...',
  '.....obbbwnwwbbbo...',
  '......obbbbbbbbo....',
  '.......oorhhroo.....',
  '.....oorrrrrrdro....',
  '....orowwwwbbwwwo...',
  '..oooo.owwwbbwswo...',
  '.obbbo.owwwbbwswo...',
  '.obbwo.owwwwwsswo...',
  '..owwo.owwwwwwwwo...',
  '...ooo.oaawoowwwo...',
  '.......oooooooooo...',
  '....................'
]

const FOX_SIT_BLINK = [
  '....................',
  '......oo......oo....',
  '.....oaao....oaao...',
  '.....oapo....oapo...',
  '.....owpoooooopwo...',
  '.....owwwwwwwwwwo...',
  '.....owwwwwwwwwwo...',
  '.....owweewwwewwo...',
  '.....obbbwnwwbbbo...',
  '......obbbbbbbbo....',
  '.......oorhhroo.....',
  '.....oorrrrrrdro....',
  '....orowwwwbbwwwo...',
  '..oooo.owwwbbwswo...',
  '.obbbo.owwwbbwswo...',
  '.obbwo.owwwwwsswo...',
  '..owwo.owwwwwwwwo...',
  '...ooo.oaawoowwwo...',
  '.......oooooooooo...',
  '....................'
]

const FOX_RUN_0 = [
  '....................',
  '.......oo......oo...',
  '......oaao....oaao..',
  '......oapo....oapo..',
  '......owpoooooopwo..',
  '......owwwwwwwwwwo..',
  '......owwgewwgewwo..',
  '......owweewweewwo..',
  '......obbbwnwwbbbo..',
  '.oooo..obbbbbbbbo...',
  'obbwwo..oorhhroo....',
  'obwwwoorrrrrrdro....',
  '.oowwoooowwwwbbwo...',
  '...ooooowwwwwsswo...',
  '.......owwwoowwwo...',
  '......oaao...oaao...',
  '.....oaao.....oaao..',
  '......oo.......oo...',
  '....................',
  '....................'
]

const FOX_RUN_1 = [
  '....................',
  '.......oo......oo...',
  '......oaao....oaao..',
  '......oapo....oapo..',
  '......owpoooooopwo..',
  '......owwwwwwwwwwo..',
  '......owwgewwgewwo..',
  '......owweewweewwo..',
  '......obbbwnwwbbbo..',
  '..oooo.obbbbbbbbo...',
  '.obbwwo.oorhhroo....',
  '.obwwwoorrrrrrdro...',
  '..oowwoooowwwbbwo...',
  '....oooowwwwwsswo...',
  '........owwwoowwo...',
  '........oaao.oaao...',
  '.........oo...oo....',
  '....................',
  '....................',
  '....................'
]

const FOX_JUMP_UP = [
  '.......oo......oo...',
  '......oaao....oaao..',
  '......oapo....oapo..',
  '......owpoooooopwo..',
  '......owwwwwwwwwwo..',
  '......owwgewwgewwo..',
  '......owweewweewwo..',
  '......obbbwnwwbbbo..',
  '.......obbbbbbbbo...',
  '..ooo...oorhhroo....',
  '.obbwo.orrrrrrdro...',
  '.obwwoooowwwwbbwo...',
  '..owwo.owwwwwsswo...',
  '...oo..oaao..oaao...',
  '.......ooo....ooo...',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................'
]

const FOX_JUMP_FALL = [
  '....................',
  '.......oo......oo...',
  '......oaao....oaao..',
  '......oapo....oapo..',
  '......owpoooooopwo..',
  '......owwwwwwwwwwo..',
  '......owwgewwgewwo..',
  '......owweewweewwo..',
  '..ooo.obbbwnwwbbbo..',
  '.obbwo.obbbbbbbbo...',
  '.obwwo..oorhhroo....',
  '..owwoorrrrrrdro....',
  '...ooo.owwwwwbbwo...',
  '.......owwwwwsswo...',
  '......oaao...oaao...',
  '......ooo.....ooo...',
  '....................',
  '....................',
  '....................',
  '....................'
]

const FOX_DASH = [
  '....................',
  '....................',
  '........oo......oo..',
  '.......oaao....oaao.',
  '.......oapo....oapo.',
  '.......owwgewwgewwo.',
  '.......owweewweewwo.',
  '.oooo..obbbwnwwbbbo.',
  'obbwwooroorhhroo....',
  'obwwddrrrrrrrrrro...',
  '.ooooowwwwwbbwwwwo..',
  '.....owwwwwwwsswo...',
  '.....oaao....oaao...',
  '......oo......oo....',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................'
]

function getSpeciesGrids(charId: CharacterId) {
  const def = getCharacterById(charId)
  switch (def.species) {
    case 'bear':
      return {
        idle0: BEAR_IDLE_0,
        idle1: BEAR_IDLE_1,
        idleBlink: BEAR_IDLE_BLINK,
        idleSpecial: BEAR_IDLE_1,
        sit0: BEAR_SIT_0,
        sitBlink: BEAR_SIT_BLINK,
        run0: BEAR_RUN_0,
        run1: BEAR_RUN_1,
        run2: BEAR_RUN_0,
        jumpUp: BEAR_JUMP_UP,
        jumpFall: BEAR_JUMP_FALL,
        dash: BEAR_DASH
      }
    case 'fox':
      return {
        idle0: FOX_IDLE_0,
        idle1: FOX_IDLE_1,
        idleBlink: FOX_IDLE_BLINK,
        idleSpecial: FOX_IDLE_1,
        sit0: FOX_SIT_0,
        sitBlink: FOX_SIT_BLINK,
        run0: FOX_RUN_0,
        run1: FOX_RUN_1,
        run2: FOX_RUN_0,
        jumpUp: FOX_JUMP_UP,
        jumpFall: FOX_JUMP_FALL,
        dash: FOX_DASH
      }
    case 'bunny':
      return {
        idle0: BUNNY_IDLE_0,
        idle1: BUNNY_IDLE_1,
        idleBlink: BUNNY_IDLE_BLINK,
        idleSpecial: BUNNY_IDLE_EAR,
        sit0: BUNNY_SIT_0,
        sitBlink: BUNNY_SIT_BLINK,
        run0: BUNNY_RUN_0,
        run1: BUNNY_RUN_1,
        run2: BUNNY_RUN_2,
        jumpUp: BUNNY_JUMP_UP,
        jumpFall: BUNNY_JUMP_FALL,
        dash: BUNNY_DASH
      }
    case 'samoyed':
      return {
        idle0: SAMOYED_IDLE_0,
        idle1: SAMOYED_IDLE_1,
        idleBlink: SAMOYED_IDLE_BLINK,
        idleSpecial: SAMOYED_IDLE_WAG,
        sit0: SAMOYED_SIT_0,
        sitBlink: SAMOYED_SIT_BLINK,
        run0: SAMOYED_RUN_0,
        run1: SAMOYED_RUN_1,
        run2: SAMOYED_RUN_2,
        jumpUp: SAMOYED_JUMP_UP,
        jumpFall: SAMOYED_JUMP_FALL,
        dash: SAMOYED_DASH
      }
    case 'shiba':
      return {
        idle0: SHIBA_IDLE_0,
        idle1: SHIBA_IDLE_1,
        idleBlink: SHIBA_IDLE_BLINK,
        idleSpecial: SHIBA_IDLE_WAG,
        sit0: SHIBA_SIT_0,
        sitBlink: SHIBA_SIT_BLINK,
        run0: SHIBA_RUN_0,
        run1: SHIBA_RUN_1,
        run2: SHIBA_RUN_2,
        jumpUp: SHIBA_JUMP_UP,
        jumpFall: SHIBA_JUMP_FALL,
        dash: SHIBA_DASH
      }
    case 'cat':
    default:
      return {
        idle0: CAT_IDLE_0,
        idle1: CAT_IDLE_1,
        idleBlink: CAT_IDLE_BLINK,
        idleSpecial: CAT_IDLE_SWISH,
        sit0: CAT_SIT_0,
        sitBlink: CAT_SIT_BLINK,
        run0: CAT_RUN_0,
        run1: CAT_RUN_1,
        run2: CAT_RUN_2,
        jumpUp: CAT_JUMP_UP,
        jumpFall: CAT_JUMP_FALL,
        dash: CAT_DASH
      }
  }
}

// ============================================================================
// ACCESSORY PIXEL GRIDS: HATS (12x8) & CAPES (12x10)
// Tokens: o = outline, p = primary, s = secondary, a = accent/highlight
// ============================================================================

const HAT_BERET_GRID = [
  '.....oo.....',
  '...ooppoo...',
  '..oppaappo..',
  '.oppppppppo.',
  '.osssssssso.',
  '..oooooooo..',
  '............',
  '............'
]

const HAT_WITCH_GRID = [
  '......oo....',
  '.....oppo...',
  '....opppo...',
  '...opppppo..',
  '...oaappao..',
  '.ooppppppoo.',
  'oossssssssoo',
  '.oooooooooo.'
]

const HAT_CLIP_SPROUT_GRID = [
  '............',
  '....oo..oo..',
  '...oppooppo.',
  '...oappppao.',
  '....ooosoo..',
  '......oo....',
  '.....oooo...',
  '............'
]

const HAT_CLIP_SAKURA_GRID = [
  '............',
  '.....oo.....',
  '...ooppoo...',
  '..oppaappo..',
  '...oossoo...',
  '....oooo....',
  '............',
  '............'
]

const HAT_CROWN_GRID = [
  '............',
  '..o..oo..o..',
  '.opooppoopo.',
  '.oppaaaappo.',
  '.oppppppppo.',
  '.osssssssso.',
  '.oooooooooo.',
  '............'
]

const CAPE_CLOAK_NORMAL = [
  '......oooo..',
  '....ooppppo.',
  '...oppaappo.',
  '..oppppppso.',
  '.oppppsssso.',
  '.oppssssso..',
  'opsssssso...',
  'oooooooo....',
  '............',
  '............'
]

const CAPE_CLOAK_DASH = [
  '............',
  '....oooooo..',
  '..ooppppppo.',
  'ooppaappppo.',
  'osssssssso..',
  '.oooooooo...',
  '............',
  '............',
  '............',
  '............'
]

const CAPE_ROYAL_NORMAL = [
  '......oooo..',
  '....ooaaaao.',
  '...oppppppo.',
  '..oppaapppo.',
  '.oppppppsso.',
  '.oppppsssso.',
  'oaaassssaaao',
  'ooooooooooo.',
  '............',
  '............'
]

const CAPE_ROYAL_DASH = [
  '............',
  '....oooooo..',
  '..ooaaapppo.',
  'ooppppppppo.',
  'oaaassssaaao',
  '.oooooooooo.',
  '............',
  '............',
  '............',
  '............'
]

const CAPE_WINGS_NORMAL = [
  '..oooo......',
  '.opaaao.....',
  'oppaaaao....',
  'opppaaaoo...',
  '.ospppaao...',
  '..ooosssao..',
  '...opaaao...',
  '...osssso...',
  '....oooo....',
  '............'
]

const CAPE_WINGS_DASH = [
  '............',
  '.oooooo.....',
  'oppaaaao....',
  'ossppaaaao..',
  '.ooossssao..',
  '...oooooo...',
  '............',
  '............',
  '............',
  '............'
]

const SCARF_ICON_GRID = [
  '............',
  '....oooooo..',
  '...ohhhhhho.',
  '..orrrrrrro.',
  '..odddrrrdo.',
  '...oooorrro.',
  '......orrdo.',
  '......oddo..',
  '.......oo...',
  '............'
]

// ============================================================================
// HEAD ACCESSORIES (`head_acc`, 14x8) & FACE / EYEWEAR (`face`, 12x6) PIXEL GRIDS
// ============================================================================

const HEAD_SPROUT_GRID = [
  '..............',
  '....oo..oo....',
  '...oppooppo...',
  '...oappppao...',
  '....ooosoo....',
  '......oo......',
  '.....oooo.....',
  '..............'
]

const HEAD_SAKURA_GRID = [
  '..............',
  '........oo....',
  '......ooppoo..',
  '.....oppaappo.',
  '......oossoo..',
  '.......oooo...',
  '..............',
  '..............'
]

const HEAD_ANTLERS_GRID = [
  '.o..........o.',
  'opo..o..o..opo',
  '.opo.o..o.opo.',
  '..oppoppoppo..',
  '...osoo.oso...',
  '...oo....oo...',
  '..............',
  '..............'
]

const HEAD_HEADPHONES_GRID = [
  '....oooooo....',
  '..ooppppppoo..',
  '.opoo....oopo.',
  'oopo......opoo',
  'opao......oapo',
  'osso......osso',
  '.oo........oo.',
  '..............'
]

const HEAD_STARLIGHT_CROWN_GRID = [
  '......oo......',
  '..o..oaao..o..',
  '.opoopaaopopo.',
  '.opppaaaapppo.',
  '.oppppppppppo.',
  '.osssssssssso.',
  '..oooooooooo..',
  '..............'
]

// Pixel Eyepatch: dark charcoal patch + gold/crimson trim + diagonal forehead strap!
const FACE_EYEPATCH_GRID = [
  'oo..........',
  '.ooo........',
  '...oooaao...',
  '.....opppo..',
  '.....ossso..',
  '......ooo...'
]

// Round Glasses: classic thin-rimmed round spectacles
const FACE_GLASSES_GRID = [
  '............',
  '.oooo..oooo.',
  'opsspoopsspo',
  'opsapooosapo',
  '.oooo..oooo.',
  '............'
]

// Star Bandage: small adventurous cheek bandage
const FACE_BANDAGE_GRID = [
  '............',
  '............',
  '............',
  '......ooooo.',
  '.....opapapo',
  '......ooooo.'
]

const HAT_CLOCKWORK_GRID = [
  '....oooo....',
  '...oppppo...',
  '..oppaappo..',
  '..opppsspo..',
  '.oosassssoo.',
  'ooopsssspooo',
  'oooooooooooo',
  '............'
]

const HEAD_HALO_GRID = [
  '...oooooo...',
  '..osaaaaso..',
  '.osp....pso.',
  '.oap....pao.',
  '..os....so..',
  '...o....o...',
  '............',
  '............'
]

const CAPE_CRYSTAL_NORMAL = [
  '......oooo..',
  '.....opppao.',
  '....oppsspo.',
  '...oappsspo.',
  '..oppppssspo',
  '..oppsssaaao',
  '.ooppssssppo',
  '.oap.oss.aao',
  '..o...oo..oo',
  '............'
]

const CAPE_CRYSTAL_DASH = [
  '.....ooooo..',
  '...oopppao..',
  '.ooapppsspo.',
  'oappppsssspo',
  '.oosssaaapoo',
  '..ooossssoo.',
  '....oo..oo..',
  '............',
  '............',
  '............'
]

const CAPE_NEBULA_NORMAL = [
  '......oooo..',
  '.....oppppo.',
  '....opapppo.',
  '...oppssspo.',
  '..oppssapspo',
  '..opsssssspo',
  '.oopssassppo',
  '.oapsssssaao',
  '..oooooooooo',
  '............'
]

const CAPE_NEBULA_DASH = [
  '.....ooooo..',
  '...oopappo..',
  '.oopppssspo.',
  'oappsssapspo',
  '.oosssssapoo',
  '..ooooooooo.',
  '............',
  '............',
  '............',
  '............'
]

function bakeHeadAccCanvas(headAccId: HeadAccId): HTMLCanvasElement | null {
  const def = getHeadAccById(headAccId)
  if (def.model === 'none') return null
  const palette: Record<string, string> = {
    o: def.outline,
    p: def.primary,
    s: def.secondary,
    a: def.accent
  }
  const grid =
    def.model === 'sprout'
      ? HEAD_SPROUT_GRID
      : def.model === 'sakura'
        ? HEAD_SAKURA_GRID
        : def.model === 'antlers'
          ? HEAD_ANTLERS_GRID
          : def.model === 'headphones'
            ? HEAD_HEADPHONES_GRID
            : def.model === 'halo'
              ? HEAD_HALO_GRID
              : HEAD_STARLIGHT_CROWN_GRID
  return bakeGrid(grid, palette)
}

function bakeFaceAccCanvas(faceAccId: FaceAccId): HTMLCanvasElement | null {
  const def = getFaceAccById(faceAccId)
  if (def.model === 'none') return null
  const palette: Record<string, string> = {
    o: def.outline,
    p: def.primary,
    s: def.secondary,
    a: def.accent
  }
  const grid =
    def.model === 'eyepatch'
      ? FACE_EYEPATCH_GRID
      : def.model === 'glasses'
        ? FACE_GLASSES_GRID
        : FACE_BANDAGE_GRID
  return bakeGrid(grid, palette)
}

function bakeHatCanvas(hatId: HatId): HTMLCanvasElement | null {
  const def = getHatById(hatId)
  if (def.model === 'none') return null
  const palette: Record<string, string> = {
    o: def.outline,
    p: def.primary,
    s: def.secondary,
    a: def.accent
  }
  const grid =
    def.model === 'beret'
      ? HAT_BERET_GRID
      : def.model === 'witch'
        ? HAT_WITCH_GRID
        : def.model === 'crown'
          ? HAT_CROWN_GRID
          : def.model === 'clockwork'
            ? HAT_CLOCKWORK_GRID
            : def.id === 'clip-sakura'
              ? HAT_CLIP_SAKURA_GRID
              : HAT_CLIP_SPROUT_GRID
  return bakeGrid(grid, palette)
}

function bakeCapeCanvas(capeId: CapeId, isDash: boolean): HTMLCanvasElement | null {
  const def = getCapeById(capeId)
  if (def.model === 'none') return null
  const palette: Record<string, string> = {
    o: def.outline,
    p: def.primary,
    s: def.secondary,
    a: def.accent
  }
  const grid =
    def.model === 'wings'
      ? isDash
        ? CAPE_WINGS_DASH
        : CAPE_WINGS_NORMAL
      : def.model === 'crystal'
        ? isDash
          ? CAPE_CRYSTAL_DASH
          : CAPE_CRYSTAL_NORMAL
        : def.model === 'nebula'
          ? isDash
            ? CAPE_NEBULA_DASH
            : CAPE_NEBULA_NORMAL
          : def.model === 'royal'
            ? isDash
              ? CAPE_ROYAL_DASH
              : CAPE_ROYAL_NORMAL
            : isDash
              ? CAPE_CLOAK_DASH
              : CAPE_CLOAK_NORMAL
  return bakeGrid(grid, palette)
}

type PoseKind = 'idle' | 'sit' | 'run' | 'jumpUp' | 'jumpFall' | 'dash'

function getAccessoryOffsets(
  species: AnimalSpecies,
  pose: PoseKind,
  hatModel: string,
  headAccModel = 'none'
): {
  hatX: number
  hatY: number
  capeX: number
  capeY: number
  headAccX: number
  headAccY: number
  faceX: number
  faceY: number
} {
  // Base 20x20 animal sits at (2, 4) inside the 24x24 composite canvas
  let hatX = 6
  let hatY = 1
  let capeX = 1
  let capeY = 13
  let headAccX = 5
  let headAccY = 2
  let faceX = 7
  let faceY = 8

  if (species === 'bunny') {
    hatX = 6
    hatY = hatModel === 'clip' ? 4 : 1
    capeX = 1
    capeY = 14
    headAccY = 2
    faceY = 9
  } else if (species === 'samoyed') {
    hatX = 6
    hatY = 0
    capeX = 1
    capeY = 13
    headAccY = 1
    faceY = 8
  } else if (species === 'bear') {
    hatX = 5
    hatY = 1
    capeX = 1
    capeY = 13
    headAccX = 4
    headAccY = 1
    faceX = 6
    faceY = 8
  } else if (species === 'fox') {
    hatX = 6
    hatY = 1
    capeX = 1
    capeY = 13
    headAccX = 5
    headAccY = 2
    faceX = 7
    faceY = 9
  } else {
    // Cat & Shiba
    hatX = 6
    hatY = 1
    capeX = 1
    capeY = 13
    headAccX = 5
    headAccY = 2
    faceX = 7
    faceY = 9
  }

  if (headAccModel === 'headphones') {
    headAccY += 2
  } else if (headAccModel === 'antlers') {
    headAccY = Math.max(0, headAccY - 1)
  }

  if (pose === 'run') {
    hatX += 1
    headAccX += 1
    faceX += 1
    capeX = 0
  } else if (pose === 'jumpUp') {
    hatX += 1
    hatY = Math.max(0, hatY - 1)
    headAccX += 1
    headAccY = Math.max(0, headAccY - 1)
    faceX += 1
    faceY = Math.max(0, faceY - 1)
    capeY -= 1
  } else if (pose === 'jumpFall') {
    hatX += 1
    headAccX += 1
    faceX += 1
    capeY -= 1
  } else if (pose === 'dash') {
    hatX += 2
    hatY += 2
    headAccX += 2
    headAccY += 2
    faceX += 2
    faceY += 1
    capeX = 0
    capeY = 12
  } else if (pose === 'sit') {
    capeY += 1
  }

  // Fine-tune Witch Hat height slightly higher so brim crowns ears neatly
  if (hatModel === 'witch') {
    hatY = Math.max(0, hatY - 1)
  } else if (hatModel === 'clip') {
    hatX += 2
    hatY += 1
  }

  return { hatX, hatY, capeX, capeY, headAccX, headAccY, faceX, faceY }
}

function composeCharacterFrame(
  baseAnimal: HTMLCanvasElement,
  hatCanvas: HTMLCanvasElement | null,
  capeCanvas: HTMLCanvasElement | null,
  headAccCanvas: HTMLCanvasElement | null,
  faceAccCanvas: HTMLCanvasElement | null,
  species: AnimalSpecies,
  pose: PoseKind,
  hatModel: string,
  headAccModel = 'none'
): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(24, 24)
  const { hatX, hatY, capeX, capeY, headAccX, headAccY, faceX, faceY } = getAccessoryOffsets(
    species,
    pose,
    hatModel,
    headAccModel
  )

  // 1. Cape / Wings behind the animal's back
  if (capeCanvas) {
    ctx.drawImage(capeCanvas, capeX, capeY)
  }

  // 2. Animal + Dynamic Scarf centered cleanly at (2, 4)
  ctx.drawImage(baseAnimal, 2, 4)

  // 3. Face / Eyewear (Eyepatch, Round Glasses, Star Bandage) layered neatly over eyes/cheeks
  if (faceAccCanvas) {
    ctx.drawImage(faceAccCanvas, faceX, faceY)
  }

  // 4. Hat perched cleanly atop head
  if (hatCanvas) {
    ctx.drawImage(hatCanvas, hatX, hatY)
  }

  // 5. Head Accessory (Sprout, Sakura Hairpin, Mini Antlers, Lo-Fi Headphones, Starlight Crown)
  if (headAccCanvas) {
    ctx.drawImage(headAccCanvas, headAccX, headAccY)
  }

  return canvas
}

function padSilhouette24(src20: HTMLCanvasElement): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(24, 24)
  ctx.drawImage(src20, 2, 4)
  return canvas
}

/**
 * 16-Bit Modern Cozy Pixel-Art Enhancer:
 * Adds unmistakable golden moonlight rim-lighting on top-exposed pixels and plush twilight shading
 * along lower/back interior edges — strictly per-pixel integer math, zero blur!
 */
function enhanceSpriteToModern16Bit(src: HTMLCanvasElement): HTMLCanvasElement {
  const w = src.width
  const h = src.height
  const [out, outCtx] = createCanvas(w, h)
  outCtx.drawImage(src, 0, 0)

  const img = outCtx.getImageData(0, 0, w, h)
  const d = img.data
  const copy = new Uint8ClampedArray(d)

  const isOpaque = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false
    return copy[(y * w + x) * 4 + 3]! > 200
  }

  const isDarkOutline = (x: number, y: number) => {
    if (!isOpaque(x, y)) return false
    const idx = (y * w + x) * 4
    const lum = copy[idx]! * 0.299 + copy[idx + 1]! * 0.587 + copy[idx + 2]! * 0.114
    return lum < 52
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      const a = copy[idx + 3]!
      if (a < 200) continue

      const r = copy[idx]!
      const g = copy[idx + 1]!
      const b = copy[idx + 2]!
      const lum = r * 0.299 + g * 0.587 + b * 0.114

      // Soften stark black outlines into warm cozy twilight indigo-plum ink
      if (lum < 48) {
        d[idx] = Math.min(255, r + 18)
        d[idx + 1] = Math.min(255, g + 8)
        d[idx + 2] = Math.min(255, b + 34)
        continue
      }

      const aboveIsEdge = !isOpaque(x, y - 1) || isDarkOutline(x, y - 1)
      const belowIsEdge = !isOpaque(x, y + 1) || isDarkOutline(x, y + 1)
      const below2IsEdge = !isOpaque(x, y + 2) || isDarkOutline(x, y + 2)
      const leftIsEdge = !isOpaque(x - 1, y) || isDarkOutline(x - 1, y)

      // 1. Unmistakable Warm Golden Moonlight Rim Lighting along top & top-left crest!
      if (aboveIsEdge) {
        if (lum > 225) {
          // On pure white fur (Mochi, Bunny, Samoyed), tint top rim to warm luminous moonlight cream-gold!
          d[idx] = 255
          d[idx + 1] = 244
          d[idx + 2] = 186
        } else {
          const blend = 0.54
          d[idx] = Math.round(r + (255 - r) * blend)
          d[idx + 1] = Math.round(g + (242 - g) * blend)
          d[idx + 2] = Math.round(b + (192 - b) * blend)
        }
      } else if (leftIsEdge && y < h - 5) {
        const blend = 0.28
        d[idx] = Math.round(r + (255 - r) * blend)
        d[idx + 1] = Math.round(g + (236 - g) * blend)
        d[idx + 2] = Math.round(b + (210 - b) * blend)
      }

      // 2. Rich multi-tone twilight violet underside shading right above bottom outlines
      if (belowIsEdge && !aboveIsEdge) {
        const sh = 0.36
        d[idx] = Math.round(r * (1 - sh) + 56 * sh)
        d[idx + 1] = Math.round(g * (1 - sh) + 32 * sh)
        d[idx + 2] = Math.round(b * (1 - sh) + 102 * sh)
      } else if (below2IsEdge && !aboveIsEdge && y > 10) {
        const sh = 0.16
        d[idx] = Math.round(r * (1 - sh) + 84 * sh)
        d[idx + 1] = Math.round(g * (1 - sh) + 54 * sh)
        d[idx + 2] = Math.round(b * (1 - sh) + 132 * sh)
      }
    }
  }

  outCtx.putImageData(img, 0, 0)
  return out
}

function makeSoftLandingFrame(base24: HTMLCanvasElement): HTMLCanvasElement {
  // Subtle 1px cozy cushion on lower body/paws while keeping head calm and crisp
  const [canvas, ctx] = createCanvas(24, 24)
  ctx.drawImage(base24, 0, 0, 24, 16, 0, 1, 24, 16)
  ctx.drawImage(base24, 0, 17, 24, 7, 0, 17, 24, 7)
  return canvas
}

function makeFluidStrideFrame(srcA: HTMLCanvasElement, pawShiftPx: number): HTMLCanvasElement {
  // Intermediate smooth paw/scarf stride frame for 5-frame fluid 16-bit walk cycle (head stays 100% level!)
  const [canvas, ctx] = createCanvas(24, 24)
  // Top 17 rows (head, hat, torso) stay completely level
  ctx.drawImage(srcA, 0, 0, 24, 17, 0, 0, 24, 17)
  // Bottom 7 rows (paws) shift subtly by 1px for fluid gait
  ctx.drawImage(srcA, 0, 17, 24, 7, pawShiftPx, 17, 24, 7)
  return canvas
}

const playerSpriteCache = new Map<string, DirectionalPlayerSprites>()
const previewDataUrlCache = new Map<string, string>()
const accessoryIconCache = new Map<string, string>()

export function getPlayerSpriteSet(
  charId: CharacterId,
  scarfId: ScarfColorId,
  hatId: HatId = 'none',
  capeId: CapeId = 'none',
  style: GraphicsStyle = 'modern',
  headAccId: HeadAccId = 'none',
  faceAccId: FaceAccId = 'none'
): DirectionalPlayerSprites {
  const key = `${style}:${charId}:${scarfId}:${hatId}:${capeId}:${headAccId}:${faceAccId}`
  const existing = playerSpriteCache.get(key)
  if (existing) return existing

  const charDef = getCharacterById(charId)
  const grids = getSpeciesGrids(charId)
  const rawPalette = getCharacterPalette(charId, scarfId)
  // Classic 8-Bit: crisp flat block colors, stark black ink outline, flat 1-color eyes (no catchlight/rim)
  // Modern 16-Bit: full multi-tone shading + bright white eye catchlights + moonlight rim-lighting pass
  const palette: Record<string, string> =
    style === 'classic'
      ? {
          ...rawPalette,
          o: '#0c0514',
          s: rawPalette.w!,
          g: rawPalette.e!,
          h: rawPalette.r!
        }
      : {
          ...rawPalette,
          g: '#ffffff'
        }
  const scarf = getScarfById(scarfId)
  const hatDef = getHatById(hatId)
  const headAccDef = getHeadAccById(headAccId)

  const hatCanvas = bakeHatCanvas(hatId)
  const capeNormal = bakeCapeCanvas(capeId, false)
  const capeDash = bakeCapeCanvas(capeId, true)
  const headAccCanvas = bakeHeadAccCanvas(headAccId)
  const faceAccCanvas = bakeFaceAccCanvas(faceAccId)

  const wrap = (grid: string[], pose: PoseKind, pal = palette) => {
    const composed = composeCharacterFrame(
      bakeGrid(grid, pal),
      hatCanvas,
      pose === 'dash' ? capeDash : capeNormal,
      headAccCanvas,
      faceAccCanvas,
      charDef.species,
      pose,
      hatDef.model,
      headAccDef.model
    )
    return style === 'modern' ? enhanceSpriteToModern16Bit(composed) : composed
  }

  const idle0 = wrap(grids.idle0, 'idle')
  const idle1 = wrap(grids.idle1, 'idle')
  const idleBlink = wrap(grids.idleBlink, 'idle')
  const idleSpecial = wrap(grids.idleSpecial, 'idle')
  const sit0 = wrap(grids.sit0, 'sit')
  const sitBlink = wrap(grids.sitBlink, 'sit')
  const run0 = wrap(grids.run0, 'run')
  const run1 = wrap(grids.run1, 'run')
  const run2 = wrap(grids.run2, 'run')
  const run3 = style === 'modern' ? makeFluidStrideFrame(run1, 1) : run1
  const run4 = style === 'modern' ? makeFluidStrideFrame(run2, -1) : run0
  const land = style === 'modern' ? makeSoftLandingFrame(idle0) : idle0
  const jumpUp = wrap(grids.jumpUp, 'jumpUp')
  const jumpFall = wrap(grids.jumpFall, 'jumpFall')
  const dash = wrap(grids.dash, 'dash')
  const dashGhostWhite = padSilhouette24(bakeSilhouette(grids.dash, '#fff7fc'))
  const dashGhostScarf = padSilhouette24(bakeSilhouette(grids.dash, scarf.ghost))
  const rainbowColors = ['#ffb3d9', '#ffe38f', '#9ef5cf', '#9ee6ff', '#d4b3ff']
  const dashGhostRainbow = rainbowColors.map((col) => padSilhouette24(bakeSilhouette(grids.dash, col)))
  const hurtTint = wrap(grids.idle0, 'idle', {
    ...palette,
    w: '#ffd1df',
    s: '#f2a4be',
    a: '#ffdbe6',
    b: '#eb9cb7',
    o: '#4d2240'
  })

  const built: DirectionalPlayerSprites = {
    right: {
      idle0,
      idle1,
      idleBlink,
      idleSpecial,
      sit0,
      sitBlink,
      run0,
      run1,
      run2,
      run3,
      run4,
      land,
      jumpUp,
      jumpFall,
      dash,
      dashGhostWhite,
      dashGhostScarf,
      dashGhostRainbow,
      hurtTint
    },
    left: {
      idle0: flipH(idle0),
      idle1: flipH(idle1),
      idleBlink: flipH(idleBlink),
      idleSpecial: flipH(idleSpecial),
      sit0: flipH(sit0),
      sitBlink: flipH(sitBlink),
      run0: flipH(run0),
      run1: flipH(run1),
      run2: flipH(run2),
      run3: flipH(run3),
      run4: flipH(run4),
      land: flipH(land),
      jumpUp: flipH(jumpUp),
      jumpFall: flipH(jumpFall),
      dash: flipH(dash),
      dashGhostWhite: flipH(dashGhostWhite),
      dashGhostScarf: flipH(dashGhostScarf),
      dashGhostRainbow: dashGhostRainbow.map((c) => flipH(c)),
      hurtTint: flipH(hurtTint)
    }
  }

  playerSpriteCache.set(key, built)
  return built
}

export function getCharacterPreviewDataUrl(
  charId: CharacterId,
  scarfId: ScarfColorId,
  hatId: HatId = 'none',
  capeId: CapeId = 'none',
  facing: 'right' | 'left' = 'right',
  idleFrame: 0 | 1 = 0,
  style: GraphicsStyle = 'modern',
  headAccId: HeadAccId = 'none',
  faceAccId: FaceAccId = 'none'
): string {
  if (typeof document === 'undefined') return ''
  const key = `${style}:${charId}:${scarfId}:${hatId}:${capeId}:${headAccId}:${faceAccId}:${facing}:${idleFrame}`
  const cached = previewDataUrlCache.get(key)
  if (cached) return cached
  const sprites = getPlayerSpriteSet(charId, scarfId, hatId, capeId, style, headAccId, faceAccId)
  const dirSet = facing === 'left' ? sprites.left : sprites.right
  const frameCanvas = idleFrame === 1 ? dirSet.idleSpecial : dirSet.idle0
  const url = frameCanvas.toDataURL('image/png')
  previewDataUrlCache.set(key, url)
  return url
}

export function getScarfIconDataUrl(scarfId: ScarfColorId): string {
  if (typeof document === 'undefined') return ''
  const key = `scarf:${scarfId}`
  const cached = accessoryIconCache.get(key)
  if (cached) return cached
  const def = getScarfById(scarfId)
  const canvas = bakeGrid(SCARF_ICON_GRID, {
    o: '#221030',
    r: def.main,
    d: def.dark,
    h: def.light
  })
  const url = canvas.toDataURL('image/png')
  accessoryIconCache.set(key, url)
  return url
}

export function getHatIconDataUrl(hatId: HatId): string {
  if (typeof document === 'undefined') return ''
  const key = `hat:${hatId}`
  const cached = accessoryIconCache.get(key)
  if (cached) return cached
  const canvas = bakeHatCanvas(hatId)
  if (!canvas) return ''
  const url = canvas.toDataURL('image/png')
  accessoryIconCache.set(key, url)
  return url
}

export function getCapeIconDataUrl(capeId: CapeId): string {
  if (typeof document === 'undefined') return ''
  const key = `cape:${capeId}`
  const cached = accessoryIconCache.get(key)
  if (cached) return cached
  const canvas = bakeCapeCanvas(capeId, false)
  if (!canvas) return ''
  const url = canvas.toDataURL('image/png')
  accessoryIconCache.set(key, url)
  return url
}

export function getHeadAccIconDataUrl(headAccId: HeadAccId): string {
  if (typeof document === 'undefined') return ''
  const key = `head_acc:${headAccId}`
  const cached = accessoryIconCache.get(key)
  if (cached) return cached
  const canvas = bakeHeadAccCanvas(headAccId)
  if (!canvas) return ''
  const url = canvas.toDataURL('image/png')
  accessoryIconCache.set(key, url)
  return url
}

export function getFaceAccIconDataUrl(faceAccId: FaceAccId): string {
  if (typeof document === 'undefined') return ''
  const key = `face:${faceAccId}`
  const cached = accessoryIconCache.get(key)
  if (cached) return cached
  const canvas = bakeFaceAccCanvas(faceAccId)
  if (!canvas) return ''
  const url = canvas.toDataURL('image/png')
  accessoryIconCache.set(key, url)
  return url
}

// ============================================================================
// COLLECTIBLES, HAZARDS & INTERACTIVE PROPS
// ============================================================================

const STAR_PALETTE: Record<string, string> = {
  o: '#3d1f47',
  y: '#ffd84d',
  l: '#fff7b2',
  a: '#f59e2d',
  w: '#ffffff'
}

const STAR_0 = [
  '.....oo.....',
  '....oyyo....',
  '....olyo....',
  '.oooolyoooo.',
  'oyllwllllyao',
  '.ooyllllyao.',
  '..oylllyao..',
  '..oyyaayao..',
  '.oyyoo.oyao.',
  '.ooo....ooo.',
  '............',
  '............'
]

const STAR_1 = [
  '.....oo.....',
  '....olyo....',
  '....owlo....',
  '.ooowlloooo.',
  'olwwwwwllyyo',
  '.ooywlllyao.',
  '..oylllyao..',
  '..oyyaayao..',
  '.oyyoo.oyao.',
  '.ooo....ooo.',
  '............',
  '............'
]

const FISH_PALETTE: Record<string, string> = {
  o: '#381b3b',
  g: '#ffbe2e',
  l: '#fff08a',
  d: '#e07a16',
  w: '#ffffff',
  e: '#1d1030',
  f: '#ff9638'
}

const FISH_0 = [
  '.....oooo.....',
  '....offffo....',
  '.oo.ogllggoo..',
  'offoogllgggwo.',
  'ofgoogllgggeo.',
  'offooggggggdo.',
  '.oo.ogggdddoo.',
  '....oodddoo...',
  '.....ooooo....',
  '..............'
]

const FISH_1 = [
  '.....oooo.....',
  '....offffo....',
  '..ooogllggoo..',
  '.offogllgggwo.',
  'offgogllgggeo.',
  '.offoggggggdo.',
  '..ooogggdddoo.',
  '....oodddoo...',
  '.....ooooo....',
  '..............'
]

const CROW_PALETTE: Record<string, string> = {
  o: '#0c0717',
  b: '#1f1636',
  p: '#3b2b63',
  e: '#ff5277',
  y: '#ffbe3b',
  d: '#c77c1a'
}

const CROW_0 = [
  '....oooo..........',
  '...obppbo.........',
  '..obppppbo..ooo...',
  '..obpppbo..obbbo..',
  '...obpbo..obbebo..',
  '.ooobbbboobbbbyyo.',
  'obppbbbbbbbbbbddo.',
  '.ooobbbbbbbbbbbo..',
  '....obbbbbbbooo...',
  '.....ooobboo......',
  '.......o..o.......',
  '..................',
  '..................',
  '..................'
]

const CROW_1 = [
  '..................',
  '..................',
  '............ooo...',
  '...........obbbo..',
  '..........obbebo..',
  '.ooo.....obbbbyyo.',
  'obppboooobbbbbddo.',
  '.ooobbbbbbbbbbbo..',
  '...obppbbbbbooo...',
  '..obppppbboo......',
  '..obpppbo.........',
  '...obpbo..........',
  '....ooo...........',
  '..................'
]

const PUDDLE_PALETTE: Record<string, string> = {
  o: '#15204d',
  b: '#2b59c3',
  l: '#58a6ff',
  w: '#d9f4ff',
  d: '#1d3a8a'
}

const PUDDLE_0 = [
  '........................',
  '....ooooooooooooooo.....',
  '..oobbbbbbbbbbbbbbboo...',
  '.obbbllwwbbbllbbbbbddo..',
  'obbbbbbbbbbbwwllbbbbddo.',
  '.oobbbddddddddddddbboo..',
  '...oooooooooooooooooo...',
  '........................'
]

const PUDDLE_1 = [
  '........................',
  '....ooooooooooooooo.....',
  '..oobbbbbbbbbbbbbbboo...',
  '.obbbbbllbbbbllwwbbddo..',
  'obbbwwllbbbbbbbbbbbbddo.',
  '.oobbbddddddddddddbboo..',
  '...oooooooooooooooooo...',
  '........................'
]

const LANTERN_PALETTE: Record<string, string> = {
  o: '#1d122e',
  m: '#4a3a63',
  r: '#d95b26',
  a: '#ff9d2e',
  y: '#ffe375',
  w: '#fffbe0'
}

const LANTERN_0 = [
  '.....oo.....',
  '....ommo....',
  '...oooooo...',
  '..orrrrrro..',
  '.oraayyaaro.',
  '.oraywwyaro.',
  '.oraywwyaro.',
  '.oraayyaaro.',
  '.oraraararo.',
  '..orrrrrro..',
  '...oooooo...',
  '....ommo....',
  '.....oo.....',
  '.....oo.....',
  '.....oo.....',
  '.....oo.....',
  '.....oo.....',
  '....ommo....',
  '...ommmmo...',
  '..oooooooo..'
]

const LANTERN_1 = [
  '.....oo.....',
  '....ommo....',
  '...oooooo...',
  '..orrrrrro..',
  '.oraywwyaro.',
  '.oraywwyaro.',
  '.oraayyaaro.',
  '.oraywwyaro.',
  '.oraaaaaaro.',
  '..orrrrrro..',
  '...oooooo...',
  '....ommo....',
  '.....oo.....',
  '.....oo.....',
  '.....oo.....',
  '.....oo.....',
  '.....oo.....',
  '....ommo....',
  '...ommmmo...',
  '..oooooooo..'
]

// ============================================================================
// BOUNCE CLOUD (28x12 normal & 28x12 squished)
// ============================================================================

const CLOUD_PALETTE: Record<string, string> = {
  o: '#3c2559',
  w: '#fff5fa',
  p: '#ffd4ea',
  s: '#dba8d4',
  h: '#ffffff'
}

const BOUNCE_CLOUD_NORMAL = [
  '........oooooo..............',
  '......oohhhhhhoo....oooo....',
  '....oohwwwwwwwwhooohhhhoo...',
  '...ohwwwwwwwwwwwwwwwwwwhho..',
  '..owwwwwwwwwwwwwwwwwwwwwwo..',
  '.owwwwwwwwwwppwwwwwwwwwwwwo.',
  '.owwwwwppppppppppwwwwwwwwwo.',
  '.oppppppppppppppppppppppppo.',
  '..ossssppppppppppppppsssso..',
  '...ooossssssssssssssssooo...',
  '......oooooooooooooooo......',
  '............................'
]

const BOUNCE_CLOUD_SQUISH = [
  '............................',
  '............................',
  '............................',
  '.....oooooooooooooooooo.....',
  '..oohhhhhhhhhhhhhhhhhhhhoo..',
  '.ohwwwwwwwwwwwwwwwwwwwwwwho.',
  'owwwwwwwwwppppppwwwwwwwwwwwo',
  'oppppppppppppppppppppppppppo',
  '.ossssppppppppppppppppsssso.',
  '..oooossssssssssssssssoooo..',
  '......oooooooooooooooo......',
  '............................'
]

// ============================================================================
// CHECKPOINT LANTERN (14x24: unlit vs warm glowing pink-gold checkpoint!)
// ============================================================================

const CHECKPOINT_GRID = [
  '......oo......',
  '.....ommo.....',
  '....oooooo....',
  '...occcccco...',
  '..ocaawwaaco..',
  '..ocawyywaco..',
  '..ocawyywaco..',
  '..ocaawwaaco..',
  '..ocaaaaaaaco.',
  '...occcccco...',
  '....oooooo....',
  '.....ommo.....',
  '......oo......',
  '......oo......',
  '......oo......',
  '......oo......',
  '......oo......',
  '......oo......',
  '......oo......',
  '......oo......',
  '.....ommo.....',
  '....ommmmo....',
  '...ommmmmmo...',
  '..oooooooooo..'
]

const CHECKPOINT_OFF_PALETTE: Record<string, string> = {
  o: '#160d26',
  m: '#45385e',
  c: '#392e54',
  a: '#2b2242',
  w: '#4a3d6b',
  y: '#5d4f80'
}

const CHECKPOINT_ON_0_PALETTE: Record<string, string> = {
  o: '#221030',
  m: '#755387',
  c: '#e85f8c',
  a: '#ff9ec4',
  w: '#ffe885',
  y: '#ffffff'
}

const CHECKPOINT_ON_1_PALETTE: Record<string, string> = {
  o: '#221030',
  m: '#755387',
  c: '#e85f8c',
  a: '#ffb4d2',
  w: '#fff4ad',
  y: '#ffe375'
}

// ============================================================================
// GATEKEEPER NPC SPRITES (16x18, facing LEFT toward arriving player)
// ============================================================================

const NPC_OWL_0 = [
  '....oo....oo....',
  '...obboooobbo...',
  '..obbbbbbbbbbo..',
  '..obbbyybyybbo..',
  '..obbbeybeybbo..',
  '..obbbbyyybbbo..',
  '..obbbccccbbbo..',
  '...obccccccbo...',
  '..obpccccccpbo..',
  '..obpccppccpbo..',
  '..obpccccccpbo..',
  '...obccccccbo...',
  '....obbbbbbo....',
  '.....oy..yo.....',
  '....ooo..ooo....',
  '................',
  '................',
  '................'
]

const NPC_OWL_1 = [
  '....oo....oo....',
  '...obboooobbo...',
  '..obbbbbbbbbbo..',
  '..obbbbbbbbbbo..',
  '..obbbeebeebbo..',
  '..obbbbyyybbbo..',
  '..obbbccccbbbo..',
  '...obccccccbo...',
  '..obpccccccpbo..',
  '..obpccppccpbo..',
  '..obpccccccpbo..',
  '...obccccccbo...',
  '....obbbbbbo....',
  '.....oy..yo.....',
  '....ooo..ooo....',
  '................',
  '................',
  '................'
]

const NPC_OWL_PALETTE: Record<string, string> = {
  o: '#1d1030',
  b: '#6d4b8c',
  p: '#4d3269',
  c: '#f5e4d7',
  y: '#ffd54f',
  e: '#190e29'
}

const NPC_BUNNY_0 = [
  '....oo..oo......',
  '...owpoowpo.....',
  '...owpoowpo.....',
  '...owwoowwo.....',
  '..owwwwwwwwwo...',
  '..owwewwwewwo...',
  '..owcpwwwpcwo...',
  '...owwwwwwwo....',
  '....oorrroo.....',
  '...orrrrrrro....',
  '...owwwwwwwo....',
  '..owwwwwwwwoo...',
  '..owwwwwwwoowo..',
  '...owwwwwwooo...',
  '....oo...oo.....',
  '................',
  '................',
  '................'
]

const NPC_BUNNY_1 = [
  '....oo..oo......',
  '...owpoowpo.....',
  '...owpoowpo.....',
  '...owwoowwo.....',
  '..owwwwwwwwwo...',
  '..owwwwwwwwwo...',
  '..owcewwwecwo...',
  '...owwwwwwwo....',
  '....oorrroo.....',
  '...orrrrrrro....',
  '...owwwwwwwo....',
  '..owwwwwwwwoo...',
  '..owwwwwwwoowo..',
  '...owwwwwwooo...',
  '....oo...oo.....',
  '................',
  '................',
  '................'
]

const NPC_BUNNY_PALETTE: Record<string, string> = {
  o: '#221236',
  w: '#fff6fc',
  p: '#ffaad2',
  c: '#ffc7e0',
  e: '#1c0f2e',
  r: '#ffd54f'
}

const NPC_KITTEN_0 = [
  '................',
  '...oo....oo.....',
  '..owwo..oabo....',
  '..owpoooopbo....',
  '..owwwwwwbbo....',
  '..owwewwwebbo...',
  '..owcwnwwcbo....',
  '...owwwwwwo.....',
  '....oorrroo.....',
  '...orrrrrrro....',
  '...owwwaawo.....',
  '...owwwaawwooo..',
  '...owwwwwwwoawo.',
  '....owwwwwwooo..',
  '.....oo..oo.....',
  '................',
  '................',
  '................'
]

const NPC_KITTEN_1 = [
  '................',
  '...oo....oo.....',
  '..owwo..oabo....',
  '..owpoooopbo....',
  '..owwwwwwbbo....',
  '..owwwwwwwbbo...',
  '..owceewecbo....',
  '...owwwwwwo.....',
  '....oorrroo.....',
  '...orrrrrrro....',
  '...owwwaawo.....',
  '...owwwaawwooo..',
  '...owwwwwwwoawo.',
  '....owwwwwwooo..',
  '.....oo..oo.....',
  '................',
  '................',
  '................'
]

const NPC_KITTEN_PALETTE: Record<string, string> = {
  o: '#221236',
  w: '#fff7ee',
  a: '#f09443',
  b: '#52343b',
  p: '#ff9ec4',
  n: '#ff8ea8',
  c: '#ffbfd6',
  e: '#1c0f2e',
  r: '#6cc8ff'
}

// ============================================================================
// ROOFTOP DECORATIVE PROPS, PORTAL, MOON & TILES
// ============================================================================

const FENCE_PALETTE: Record<string, string> = {
  o: '#1c102e',
  w: '#59394b',
  h: '#7c5368',
  d: '#3e2436'
}

const FENCE_GRID = [
  '.oo....oo....oo.',
  'ohwo..ohwo..ohwo',
  'ohwoooohwoooohwo',
  'ohwhhhwhwhhhwhwo',
  'owwdddwwddddwwwo',
  'owwo..owwo..owwo',
  'owwoooowwoooowwo',
  'owwhhhwwwhhhwwwo',
  'owwdddwwddddwwwo',
  'owwo..owwo..owwo'
]

function bakeFlower(petalMain: string, petalLight: string): HTMLCanvasElement {
  return bakeGrid(
    [
      '..pp..',
      '.pllp.',
      '..pp..',
      '..gg..',
      '.g.g..',
      '..g...',
      '..g...'
    ],
    {
      p: petalMain,
      l: petalLight,
      g: '#42a384'
    }
  )
}

function bakeMoonPortal(frame: 0 | 1): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(32, 40)

  ctx.fillStyle = '#1b1133'
  ctx.fillRect(3, 35, 26, 5)
  ctx.fillStyle = '#47366e'
  ctx.fillRect(4, 36, 24, 3)
  ctx.fillStyle = '#7962ab'
  ctx.fillRect(5, 36, 22, 1)

  for (let y = 6; y <= 34; y++) {
    for (let x = 5; x <= 26; x++) {
      const dx = (x - 16) / 9.2
      const dy = (y - 20) / 13.5
      const d = dx * dx + dy * dy
      if (d < 1.0) {
        const angle = Math.atan2(dy, dx)
        const swirl = Math.sin(angle * 3 + d * 8 + frame * Math.PI)
        if (d < 0.22) {
          ctx.fillStyle = frame === 0 ? '#fffbe6' : '#d6f8ff'
        } else if (d < 0.52) {
          ctx.fillStyle = swirl > 0 ? '#9be8ff' : '#d5a8ff'
        } else {
          ctx.fillStyle = swirl > 0 ? '#6e52cc' : '#40268a'
        }
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }

  for (let y = 2; y <= 35; y++) {
    for (let x = 2; x <= 29; x++) {
      const dx = (x - 16) / 12.2
      const dy = (y - 19) / 15.8
      const dOuter = dx * dx + dy * dy
      const dxIn = (x - 16) / 9.2
      const dyIn = (y - 20) / 13.5
      const dInner = dxIn * dxIn + dyIn * dyIn

      const isArch = dOuter <= 1.0 && dInner >= 0.92 && !(y > 31 && x > 10 && x < 22)
      if (isArch) {
        if (dOuter > 0.84) {
          ctx.fillStyle = '#251542'
        } else if (x < 16 || y < 12) {
          ctx.fillStyle = '#ffe580'
        } else {
          ctx.fillStyle = '#d99a2b'
        }
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }

  const crown = ['..yyyy..', '.yylloo.', '.yyoo...', '.yylloo.', '..yyyy..']
  for (let cy = 0; cy < crown.length; cy++) {
    for (let cx = 0; cx < crown[cy]!.length; cx++) {
      const ch = crown[cy]![cx]!
      if (ch === 'y') {
        ctx.fillStyle = '#ffd84d'
        ctx.fillRect(12 + cx, 1 + cy, 1, 1)
      } else if (ch === 'l') {
        ctx.fillStyle = '#fff9c4'
        ctx.fillRect(12 + cx, 1 + cy, 1, 1)
      }
    }
  }

  ctx.fillStyle = '#ffffff'
  if (frame === 0) {
    ctx.fillRect(12, 14, 1, 1)
    ctx.fillRect(20, 25, 1, 1)
    ctx.fillRect(15, 29, 1, 1)
  } else {
    ctx.fillRect(19, 13, 1, 1)
    ctx.fillRect(11, 24, 1, 1)
    ctx.fillRect(17, 18, 1, 1)
  }

  return canvas
}

function bakeCrescentMoon(): HTMLCanvasElement {
  const size = 44
  const [canvas, ctx] = createCanvas(size, size)
  const cx = 22
  const cy = 22
  const rMain = 18
  const rCut = 15.5
  const cutOffsetX = 8
  const cutOffsetY = -4

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d1 = Math.hypot(x - cx, y - cy)
      const d2 = Math.hypot(x - (cx + cutOffsetX), y - (cy + cutOffsetY))
      if (d1 <= rMain && d2 >= rCut) {
        if (d1 > rMain - 1.5) {
          ctx.fillStyle = '#ffe285'
        } else if (d2 < rCut + 1.8) {
          ctx.fillStyle = '#e5be60'
        } else {
          ctx.fillStyle = '#fff8cf'
        }
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }

  ctx.fillStyle = '#e0b758'
  ctx.fillRect(11, 18, 2, 2)
  ctx.fillRect(15, 28, 3, 2)
  ctx.fillRect(9, 25, 1, 2)
  ctx.fillRect(20, 34, 2, 1)

  return canvas
}

function bakeBrickTop(): HTMLCanvasElement {
  // Classic 8-Bit Flat Retro Block Tile: crisp 2-color flat square bricks & flat grass bar
  const [canvas, ctx] = createCanvas(16, 16)
  ctx.fillStyle = '#140a21'
  ctx.fillRect(0, 0, 16, 16)

  ctx.fillStyle = '#472a61'
  ctx.fillRect(0, 5, 7, 4)
  ctx.fillRect(8, 5, 8, 4)
  ctx.fillRect(0, 10, 3, 5)
  ctx.fillRect(4, 10, 8, 5)
  ctx.fillRect(13, 10, 3, 5)

  // Simple flat 8-bit green grass bar (zero bevels or overhanging drapes)
  ctx.fillStyle = '#2d8c66'
  ctx.fillRect(0, 0, 16, 4)
  ctx.fillStyle = '#58c98e'
  ctx.fillRect(0, 0, 16, 1)
  return canvas
}

function bakeBrickBody(): HTMLCanvasElement {
  // Classic 8-Bit Flat Brick Body
  const [canvas, ctx] = createCanvas(16, 16)
  ctx.fillStyle = '#140a21'
  ctx.fillRect(0, 0, 16, 16)

  ctx.fillStyle = '#3b2152'
  ctx.fillRect(0, 0, 7, 7)
  ctx.fillRect(8, 0, 8, 7)
  ctx.fillRect(0, 8, 3, 7)
  ctx.fillRect(4, 8, 8, 7)
  ctx.fillRect(13, 8, 3, 7)
  return canvas
}

function bakeWoodTop(): HTMLCanvasElement {
  // Classic 8-Bit Flat Wood Block
  const [canvas, ctx] = createCanvas(16, 16)
  ctx.fillStyle = '#1a0d1f'
  ctx.fillRect(0, 0, 16, 16)
  ctx.fillStyle = '#633730'
  ctx.fillRect(0, 4, 16, 5)
  ctx.fillRect(0, 10, 16, 5)
  ctx.fillStyle = '#1a0d1f'
  ctx.fillRect(7, 4, 1, 5)
  ctx.fillRect(14, 10, 1, 5)
  ctx.fillStyle = '#2d8c66'
  ctx.fillRect(0, 0, 16, 3)
  return canvas
}

function bakeWoodBody(): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(16, 16)
  ctx.fillStyle = '#1a0d1f'
  ctx.fillRect(0, 0, 16, 16)
  ctx.fillStyle = '#522c28'
  ctx.fillRect(0, 0, 16, 7)
  ctx.fillRect(0, 8, 16, 7)
  return canvas
}

function bakeMovingSegment(pos: 'left' | 'mid' | 'right'): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(16, 10)
  ctx.fillStyle = '#1d1030'
  ctx.fillRect(0, 0, 16, 10)

  ctx.fillStyle = '#7d4a3a'
  ctx.fillRect(pos === 'left' ? 1 : 0, 2, pos === 'mid' ? 16 : 15, 6)
  ctx.fillStyle = '#b5765c'
  ctx.fillRect(pos === 'left' ? 1 : 0, 2, pos === 'mid' ? 16 : 15, 1)
  ctx.fillStyle = '#47a88a'
  ctx.fillRect(pos === 'left' ? 2 : 0, 1, pos === 'mid' ? 16 : 14, 2)
  ctx.fillStyle = '#99f5cf'
  ctx.fillRect(pos === 'left' ? 3 : 2, 1, 6, 1)

  ctx.fillStyle = '#ffd84d'
  if (pos === 'mid') {
    ctx.fillRect(6, 8, 4, 2)
    ctx.fillStyle = '#fff9c4'
    ctx.fillRect(7, 8, 2, 1)
  } else {
    ctx.fillStyle = '#ff9e3d'
    ctx.fillRect(pos === 'left' ? 4 : 10, 7, 2, 2)
  }

  return canvas
}

function bakeFullMoon(): HTMLCanvasElement {
  const size = 44
  const [canvas, ctx] = createCanvas(size, size)
  const cx = 22
  const cy = 22
  const rMain = 17.5

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - cx, y - cy)
      if (d <= rMain) {
        if (d > rMain - 1.8) {
          ctx.fillStyle = '#ffe5f0'
        } else if (x + y < 38) {
          ctx.fillStyle = '#fffcf0'
        } else {
          ctx.fillStyle = '#ffefd4'
        }
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }

  // Soft pastel craters
  ctx.fillStyle = '#f2d9c2'
  ctx.fillRect(14, 15, 3, 3)
  ctx.fillRect(25, 24, 4, 3)
  ctx.fillRect(17, 29, 3, 2)
  ctx.fillRect(27, 14, 2, 2)

  return canvas
}

// ============================================================================
// 4 POWER-UP SPRITES (Milk, Feather, Golden Bell, Moon Bubble)
// ============================================================================

const MILK_GRID = [
  '...oooo...',
  '..occcco..',
  '...oooo...',
  '..oWWWWo..',
  '.oWppppWo.',
  '.oWwwwwWo.',
  '.oWwwwwWo.',
  '.oWhwwwWo.',
  '.oWhwwwWo.',
  '.oWwwssWo.',
  '.oWssssWo.',
  '..oWWWWo..',
  '...oooo...',
  '..........'
]

const MILK_PALETTE: Record<string, string> = {
  o: '#291538',
  c: '#d9995b',
  W: '#e8f4ff',
  w: '#fffdf7',
  h: '#ffffff',
  s: '#d7e2f2',
  p: '#ff8cb8'
}

const FEATHER_GRID = [
  '.......ooo..',
  '.....ooyyyo.',
  '....oylllyo.',
  '...oylwllyo.',
  '..oylwppyo..',
  '..oyppppo...',
  '.oyppppo....',
  '.oyyppo.....',
  '..ooyo......',
  '.oyoo.......',
  'oyo.........',
  'oo..........'
]

const FEATHER_PALETTE: Record<string, string> = {
  o: '#2b1642',
  y: '#ffd85c',
  l: '#fff5b8',
  w: '#ffffff',
  p: '#d7a8ff'
}

const BELL_GRID = [
  '....oooo....',
  '...orrrro...',
  '....oooo....',
  '...oyyyyo...',
  '..oylllyyo..',
  '..oylwlyyo..',
  '..oyyyyaao..',
  '.oyyyyyyaao.',
  '.oyyyyyyaao.',
  '.oooooooooo.',
  '....oyyo....',
  '.....oo.....'
]

const BELL_PALETTE: Record<string, string> = {
  o: '#2e1633',
  r: '#ff5d82',
  y: '#ffd242',
  l: '#fff4a3',
  w: '#ffffff',
  a: '#d98a1c'
}

const BUBBLE_GRID = [
  '....oooooo....',
  '..oobbbbbbbo..',
  '.obllwwwwlbbo.',
  '.oblwwllllbbo.',
  'obllwllllbbbbo',
  'obllllllllbbbo',
  'obllbbbbbbbbbo',
  'obllbbbbbbbbbo',
  'obbbbbbbbbbbbo',
  'obbbbbbbbddbbo',
  '.obbbbbbdddbo.',
  '.oobbbddddboo.',
  '..oobbbbbboo..',
  '....oooooo....'
]

const BUBBLE_PALETTE: Record<string, string> = {
  o: '#487ec9',
  b: '#87d0ff',
  l: '#c4ecff',
  w: '#ffffff',
  d: '#63a8eb'
}

// ============================================================================
// GOLDEN MOONCAKE (14x14) + 4 BIOME-EXCLUSIVE POWER-UPS (12x12)
// ============================================================================

const MOONCAKE_GRID = [
  '....oooooo....',
  '..ooyyyyyyoo..',
  '.oyyggllggyyo.',
  '.oyglwwwwlgyo.',
  'oygglwccwggyyo',
  'oygglwgggggyyo',
  'oygglwgggggyyo',
  'oygglwccwggyyo',
  '.oyglwwwwlgyo.',
  '.oyyggddggyyo.',
  '..oyddddddyo..',
  '...oooooooo...',
  '..............',
  '..............'
]

const MOONCAKE_PALETTE: Record<string, string> = {
  o: '#3d1c1e',
  y: '#e89d2e',
  g: '#ffbf47',
  l: '#ffe48a',
  w: '#fffbe0',
  c: '#c9781c',
  d: '#b86a18'
}

// Map 1 Exclusive: Starlight Yarn Ball (12x12)
const YARN_GRID = [
  '...oooooo...',
  '..oppllppo..',
  '.oppplllppo.',
  'opppyyllpppo',
  'oplyyyppplpo',
  'opppyyllpppo',
  'opplllpppppo',
  '.opddllldpo.',
  '..ooddddpo..',
  '....ooooyy..',
  '........oyy.',
  '.........oo.'
]

const YARN_PALETTE: Record<string, string> = {
  o: '#291542',
  p: '#b482ff',
  l: '#e3ccff',
  d: '#7c4cc7',
  y: '#ffe270'
}

// Map 2 Exclusive: Sakura Mochi (12x12)
const MOCHI_GRID = [
  '............',
  '....oooo....',
  '..ooppppoo..',
  '.opplllpppo.',
  '.opplwpppppo',
  'oppppppppppo',
  'ogggppppgggo',
  'ogllggggllgo',
  '.oggggggggo.',
  '..oooooooo..',
  '............',
  '............'
]

const MOCHI_PALETTE: Record<string, string> = {
  o: '#2e1633',
  p: '#ff9ec4',
  l: '#ffd4e8',
  w: '#ffffff',
  g: '#4da876',
  d: '#2c7552'
}

// Map 3 Exclusive: Rainbow Star Candy (12x12)
const CANDY_GRID = [
  '.....oo.....',
  '....oppo....',
  '..oopllooo..',
  '.oyylwwbbbo.',
  'oyyylwwbbbbo',
  '.oyymmmmggo.',
  '..oommmgoo..',
  '...omgggo...',
  '..omgo.ogo..',
  '..ooo...oo..',
  '............',
  '............'
]

const CANDY_PALETTE: Record<string, string> = {
  o: '#2b1645',
  p: '#ff9ec4',
  l: '#ffd9ed',
  w: '#ffffff',
  y: '#ffe375',
  b: '#8ee6ff',
  m: '#d2a8ff',
  g: '#8ef5c8'
}

// Map 4 Exclusive: Moonlit Pearl (12x12)
const PEARL_GRID = [
  '....oooo....',
  '..ooccccoo..',
  '.occlllccco.',
  '.oclwwwwlco.',
  'oclwwbbllcco',
  'occlbbbbccco',
  '.oocbbbbcoo.',
  '.osssssssso.',
  '..osddddso..',
  '...oooooo...',
  '............',
  '............'
]

const PEARL_PALETTE: Record<string, string> = {
  o: '#162840',
  c: '#78b8e6',
  l: '#c4f0ff',
  w: '#ffffff',
  b: '#9ee0ff',
  s: '#9e82c4',
  d: '#644a8a'
}

// Map 5 Exclusive: Crystal Spore Elixir (12x12)
const CRYSTAL_ELIXIR_GRID = [
  '....oooo....',
  '....oyyo....',
  '....oooo....',
  '...ooccoo...',
  '..occwwcco..',
  '.occlllccpo.',
  '.occlllccpo.',
  '.ooccccppoo.',
  '..ooccppoo..',
  '...oooooo...',
  '............',
  '............'
]

const CRYSTAL_ELIXIR_PALETTE: Record<string, string> = {
  o: '#131d36',
  y: '#ffe685',
  c: '#4be8dc',
  l: '#a8fff7',
  w: '#ffffff',
  p: '#b88cff'
}

// Map 6 Exclusive: Golden Chrono Gear (12x12)
const CHRONO_GEAR_GRID = [
  '....oooo....',
  '..ooyyyyoo..',
  '.oyywwwwyyo.',
  'ooywbbbbwyoo',
  'oywbllllbwyo',
  'oywblwwlbwyo',
  'oywbllllbwyo',
  'ooywbbbbwyoo',
  '.oyyddddyyo.',
  '..ooyyyyoo..',
  '....oooo....',
  '............'
]

const CHRONO_GEAR_PALETTE: Record<string, string> = {
  o: '#1f1638',
  y: '#ffd452',
  d: '#c7831e',
  w: '#fff9d6',
  b: '#5472d9',
  l: '#9cecff'
}

// Boss Fight Healing Relic: Star Nectar Flask (12x12)
const STAR_NECTAR_GRID = [
  '....oooo....',
  '....oggo....',
  '..oooggooo..',
  '.opppwwpppo.',
  'oppwwhhwwppo',
  'opphhhhhhppo',
  'opphhwwhhppo',
  '.opphhhhppo.',
  '..ooppppoo..',
  '...oooooo...',
  '............',
  '............'
]

const STAR_NECTAR_PALETTE: Record<string, string> = {
  o: '#240c2b',
  g: '#ffe475',
  p: '#ff8cb8',
  h: '#ff427b',
  w: '#ffffff'
}

// Boss Fight Power Relic: Eclipse Shard (12x12)
const ECLIPSE_SHARD_GRID = [
  '.....oo.....',
  '....orro....',
  '...orggro...',
  '..orgwwgro..',
  '.orrgwwgrro.',
  '.orrrggrrro.',
  '.oprrggrppo.',
  '..oprrrrpo..',
  '...oprrpo...',
  '....oppo....',
  '.....oo.....',
  '............'
]

const ECLIPSE_SHARD_PALETTE: Record<string, string> = {
  o: '#1c071b',
  r: '#ff4778',
  p: '#8c2259',
  g: '#ffd859',
  w: '#fffbe0'
}

// ============================================================================
// BIOME 2 STONE LANTERN + BIOME TILES (Sakura, Cloudland, Harbor)
// ============================================================================

const STONE_LANTERN_GRID = [
  '....oooo....',
  '..oosssooo..',
  '.osssssssso.',
  '..oooooooo..',
  '...osaaso...',
  '...osywso...',
  '...osywso...',
  '...osaaso...',
  '..oooooooo..',
  '...osssso...',
  '....osso....',
  '....osso....',
  '....osso....',
  '....osso....',
  '....osso....',
  '...osssso...',
  '..osssssso..',
  '.osssssssso.',
  '.oooooooooo.',
  '............'
]

function bakeStoneLantern(frame: 0 | 1): HTMLCanvasElement {
  return bakeGrid(STONE_LANTERN_GRID, {
    o: '#1a1530',
    s: '#7b7899',
    a: frame === 0 ? '#ffb5c8' : '#ffd285',
    y: frame === 0 ? '#ffe58f' : '#fff5c4',
    w: '#ffffff'
  })
}

function bakeSakuraTop(): HTMLCanvasElement {
  // Classic 8-Bit Flat Sakura Block
  const [canvas, ctx] = createCanvas(16, 16)
  ctx.fillStyle = '#1c0f24'
  ctx.fillRect(0, 0, 16, 16)
  ctx.fillStyle = '#543242'
  ctx.fillRect(0, 4, 16, 12)
  ctx.fillStyle = '#381e2c'
  ctx.fillRect(0, 10, 16, 1)
  ctx.fillStyle = '#3c8f7d'
  ctx.fillRect(0, 0, 16, 4)
  ctx.fillStyle = '#ff9ec4'
  ctx.fillRect(2, 0, 4, 2)
  ctx.fillRect(10, 0, 4, 2)
  return canvas
}

function bakeSakuraBody(): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(16, 16)
  ctx.fillStyle = '#472838'
  ctx.fillRect(0, 0, 16, 16)
  ctx.fillStyle = '#301926'
  ctx.fillRect(0, 7, 16, 1)
  ctx.fillRect(7, 0, 1, 16)
  return canvas
}

function bakeCloudTop(): HTMLCanvasElement {
  // Classic 8-Bit Flat 2-Tone Cloud Block
  const [canvas, ctx] = createCanvas(16, 16)
  ctx.fillStyle = '#d4a6e3'
  ctx.fillRect(0, 0, 16, 16)
  ctx.fillStyle = '#fff0fa'
  ctx.fillRect(0, 0, 16, 6)
  ctx.fillStyle = '#996ab5'
  ctx.fillRect(0, 13, 16, 3)
  return canvas
}

function bakeCloudBody(): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(16, 16)
  ctx.fillStyle = '#b481cf'
  ctx.fillRect(0, 0, 16, 16)
  ctx.fillStyle = '#996ab5'
  ctx.fillRect(0, 13, 16, 3)
  return canvas
}

function bakeHarborTop(): HTMLCanvasElement {
  // Classic 8-Bit Flat Harbor Dock Block
  const [canvas, ctx] = createCanvas(16, 16)
  ctx.fillStyle = '#101d24'
  ctx.fillRect(0, 0, 16, 16)
  ctx.fillStyle = '#7d503e'
  ctx.fillRect(0, 0, 16, 5)
  ctx.fillStyle = '#1c1214'
  ctx.fillRect(7, 0, 1, 5)
  ctx.fillRect(15, 0, 1, 5)
  ctx.fillStyle = '#4a3028'
  ctx.fillRect(0, 6, 16, 10)
  return canvas
}

function bakeHarborBody(): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(16, 16)
  ctx.fillStyle = '#101d24'
  ctx.fillRect(0, 0, 16, 16)
  ctx.fillStyle = '#452b24'
  ctx.fillRect(2, 0, 5, 16)
  ctx.fillRect(10, 0, 4, 16)
  return canvas
}

function bakeStyledTile(
  topHi: string,
  topMid: string,
  bodyMain: string,
  bodyDark: string,
  accent: string,
  isTop: boolean,
  modern: boolean
): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(16, 16)
  ctx.fillStyle = bodyDark
  ctx.fillRect(0, 0, 16, 16)
  if (isTop) {
    ctx.fillStyle = topHi
    ctx.fillRect(0, 0, 16, 2)
    ctx.fillStyle = topMid
    ctx.fillRect(0, 2, 16, 3)
    ctx.fillStyle = bodyMain
    ctx.fillRect(0, 5, 16, 11)
    ctx.fillStyle = accent
    ctx.fillRect(2, 1, 3, 1)
    ctx.fillRect(10, 2, 4, 1)
    if (modern) {
      ctx.fillStyle = bodyDark
      ctx.fillRect(0, 5, 16, 1)
      ctx.fillRect(5, 6, 1, 10)
      ctx.fillRect(12, 6, 1, 10)
      ctx.fillStyle = accent
      ctx.fillRect(7, 9, 2, 2)
    }
  } else {
    ctx.fillStyle = bodyMain
    ctx.fillRect(1, 0, 14, 15)
    ctx.fillStyle = bodyDark
    ctx.fillRect(0, 7, 16, 1)
    ctx.fillRect(7, 0, 1, 7)
    ctx.fillRect(13, 8, 1, 8)
    if (modern) {
      ctx.fillStyle = accent
      ctx.fillRect(3, 3, 2, 1)
      ctx.fillRect(10, 11, 2, 1)
    }
  }
  return canvas
}

// ============================================================================
// 16-BIT MODERN COZY TILES & PROPS (Stacked Clay Shingles, Bark, Roped Pier, Potted Plants)
// ============================================================================

const POTTED_PLANT_GRID = [
  '....pp....',
  '...pllp...',
  '..g.pp.g..',
  '..ggllgg..',
  '...gggg...',
  '..oooooo..',
  '..otttto..',
  '...ottdo..',
  '...otddo..',
  '...ooooo..'
]

const POTTED_PLANT_PALETTE: Record<string, string> = {
  o: '#24122e',
  p: '#ff8fb8',
  l: '#ffe3f0',
  g: '#42a87e',
  t: '#c96f4b',
  d: '#8f442c'
}

const SAKURA_BRANCH_GRID = [
  'oooooooooooooooo',
  'owwwdwwwwwdwwwwo',
  '.oooowpppoooowwo',
  '....opplppoooppp',
  '...opplwpp..pllp',
  '....ooppp....pp.',
  '......pp........',
  '................'
]

const SAKURA_BRANCH_PALETTE: Record<string, string> = {
  o: '#221124',
  w: '#693d4d',
  d: '#452433',
  p: '#ff9ec4',
  l: '#ffd9ed'
}

const HARBOR_POST_GRID = [
  '...oooo...',
  '..ohhhho..',
  '..owwwdo..',
  '.oorrrroo.',
  '.orrllrror',
  '..owwwdo..',
  '..owwwdo..',
  '..owwwdo..',
  '..owwwdo..',
  '.oooooooo.'
]

const HARBOR_POST_PALETTE: Record<string, string> = {
  o: '#152029',
  h: '#c79672',
  w: '#875a45',
  d: '#59372a',
  r: '#d9b47a',
  l: '#fff0c4'
}

function bakeModernBrickTop(): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(16, 16)
  // Deep cozy eaves shadow
  ctx.fillStyle = '#261024'
  ctx.fillRect(0, 0, 16, 16)

  // Warm curved terracotta-crimson overlapping clay roof shingles (instant unmistakable 16-bit contrast!)
  const drawShingleRow = (y: number, offset: number, main: string, hi: string, sh: string) => {
    for (let x = -4 + offset; x < 16; x += 8) {
      ctx.fillStyle = sh
      ctx.fillRect(x, y + 3, 7, 2)
      ctx.fillStyle = main
      ctx.fillRect(x, y + 1, 7, 3)
      ctx.fillStyle = hi
      ctx.fillRect(x + 1, y, 5, 1)
      ctx.fillStyle = '#ffe3b3'
      ctx.fillRect(x + 2, y, 2, 1)
      ctx.fillStyle = '#2e1124'
      ctx.fillRect(x + 7, y, 1, 5)
    }
  }
  drawShingleRow(5, 0, '#c44d47', '#eb7e65', '#782534')
  drawShingleRow(10, 4, '#a63c40', '#cf6557', '#611d2d')

  // Lush 16-bit layered moonlight emerald moss & overhanging grass drapes!
  ctx.fillStyle = '#154745'
  ctx.fillRect(0, 0, 16, 5)
  ctx.fillStyle = '#2c967c'
  ctx.fillRect(0, 0, 16, 4)
  ctx.fillStyle = '#62d9a5'
  ctx.fillRect(0, 0, 16, 2)
  ctx.fillStyle = '#d4ffe3'
  ctx.fillRect(1, 0, 4, 1)
  ctx.fillRect(7, 0, 3, 1)
  ctx.fillRect(12, 0, 3, 1)
  // Rich overhanging moss drapes & tiny dew highlights
  ctx.fillStyle = '#2c967c'
  ctx.fillRect(1, 4, 3, 3)
  ctx.fillRect(6, 4, 4, 4)
  ctx.fillRect(12, 4, 3, 3)
  ctx.fillStyle = '#62d9a5'
  ctx.fillRect(2, 4, 1, 2)
  ctx.fillRect(7, 4, 2, 2)
  ctx.fillRect(13, 4, 1, 1)
  return canvas
}

function bakeModernBrickBody(): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(16, 16)
  ctx.fillStyle = '#241024'
  ctx.fillRect(0, 0, 16, 16)
  // Warm terracotta-plum shaded masonry brickwork with rich bevels & highlights
  const drawBrick = (x: number, y: number, w: number, h: number, main: string, hi: string, sh: string) => {
    ctx.fillStyle = main
    ctx.fillRect(x, y, w, h)
    ctx.fillStyle = hi
    ctx.fillRect(x, y, w, 1)
    ctx.fillRect(x, y, 1, h - 1)
    ctx.fillStyle = sh
    ctx.fillRect(x, y + h - 1, w, 1)
    ctx.fillRect(x + w - 1, y + 1, 1, h - 1)
  }
  drawBrick(0, 0, 7, 7, '#7d4157', '#a86475', '#4c2138')
  drawBrick(8, 0, 8, 7, '#6b354c', '#945469', '#3d192e')
  drawBrick(0, 8, 4, 7, '#663148', '#8c4f64', '#3b182c')
  drawBrick(5, 8, 7, 7, '#87485d', '#b56e7f', '#52243c')
  drawBrick(13, 8, 3, 7, '#70384f', '#99576c', '#421c31')
  ctx.fillStyle = '#cfa09b'
  ctx.fillRect(1, 1, 2, 1)
  ctx.fillRect(6, 9, 2, 1)
  return canvas
}

function bakeModernWoodTop(): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(16, 16)
  ctx.fillStyle = '#241226'
  ctx.fillRect(0, 0, 16, 16)
  // Rich grained cedar planks with warm highlight & brass nails
  ctx.fillStyle = '#875042'
  ctx.fillRect(0, 4, 16, 5)
  ctx.fillStyle = '#b5745e'
  ctx.fillRect(0, 4, 16, 1)
  ctx.fillStyle = '#693b33'
  ctx.fillRect(2, 6, 6, 1)
  ctx.fillRect(10, 7, 5, 1)
  ctx.fillStyle = '#472424'
  ctx.fillRect(0, 8, 16, 1)

  ctx.fillStyle = '#6e3f38'
  ctx.fillRect(0, 10, 16, 5)
  ctx.fillStyle = '#915849'
  ctx.fillRect(0, 10, 16, 1)
  ctx.fillStyle = '#4f2a29'
  ctx.fillRect(4, 12, 7, 1)
  ctx.fillStyle = '#381b21'
  ctx.fillRect(0, 14, 16, 1)

  ctx.fillStyle = '#ffe08a'
  ctx.fillRect(1, 5, 1, 1)
  ctx.fillRect(9, 5, 1, 1)
  ctx.fillRect(5, 11, 1, 1)

  // Lush velvet night moss cap
  ctx.fillStyle = '#1b524d'
  ctx.fillRect(0, 0, 16, 4)
  ctx.fillStyle = '#3da388'
  ctx.fillRect(0, 0, 16, 2)
  ctx.fillStyle = '#a8f2cf'
  ctx.fillRect(1, 0, 5, 1)
  ctx.fillRect(9, 0, 5, 1)
  ctx.fillStyle = '#3da388'
  ctx.fillRect(3, 3, 2, 2)
  ctx.fillRect(11, 3, 3, 2)
  return canvas
}

function bakeModernWoodBody(): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(16, 16)
  ctx.fillStyle = '#211021'
  ctx.fillRect(0, 0, 16, 16)
  ctx.fillStyle = '#693c35'
  ctx.fillRect(0, 0, 16, 7)
  ctx.fillStyle = '#875145'
  ctx.fillRect(0, 0, 16, 1)
  ctx.fillStyle = '#4c2827'
  ctx.fillRect(3, 3, 8, 1)
  ctx.fillRect(0, 6, 16, 1)

  ctx.fillStyle = '#57312e'
  ctx.fillRect(0, 8, 16, 7)
  ctx.fillStyle = '#73443c'
  ctx.fillRect(0, 8, 16, 1)
  ctx.fillStyle = '#3c1e21'
  ctx.fillRect(7, 11, 6, 1)
  ctx.fillRect(0, 14, 16, 1)
  return canvas
}

function bakeModernSakuraTop(): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(16, 16)
  ctx.fillStyle = '#241226'
  ctx.fillRect(0, 0, 16, 16)
  // Textured cherry bark with rich grain & knots
  ctx.fillStyle = '#663d4d'
  ctx.fillRect(0, 4, 16, 12)
  ctx.fillStyle = '#875567'
  ctx.fillRect(0, 5, 16, 2)
  ctx.fillStyle = '#4a2838'
  ctx.fillRect(2, 8, 6, 2)
  ctx.fillRect(10, 11, 5, 2)
  ctx.fillStyle = '#331a29'
  ctx.fillRect(4, 9, 2, 1)
  ctx.fillRect(12, 12, 2, 1)

  // Plush emerald moss + scattered pink sakura blossoms on top
  ctx.fillStyle = '#1f5c59'
  ctx.fillRect(0, 0, 16, 5)
  ctx.fillStyle = '#4ab596'
  ctx.fillRect(0, 0, 16, 3)
  ctx.fillStyle = '#9cf0cd'
  ctx.fillRect(4, 0, 3, 1)
  ctx.fillStyle = '#ff9ec4'
  ctx.fillRect(1, 0, 3, 2)
  ctx.fillRect(9, 0, 4, 2)
  ctx.fillStyle = '#fff0f7'
  ctx.fillRect(2, 0, 1, 1)
  ctx.fillRect(11, 0, 2, 1)
  return canvas
}

function bakeModernSakuraBody(): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(16, 16)
  ctx.fillStyle = '#211024'
  ctx.fillRect(0, 0, 16, 16)
  ctx.fillStyle = '#573342'
  ctx.fillRect(0, 0, 16, 16)
  ctx.fillStyle = '#734659'
  ctx.fillRect(1, 1, 5, 5)
  ctx.fillRect(9, 8, 6, 5)
  ctx.fillStyle = '#3b1f2e'
  ctx.fillRect(0, 7, 16, 1)
  ctx.fillRect(7, 0, 1, 16)
  ctx.fillRect(3, 3, 2, 1)
  ctx.fillRect(11, 10, 2, 1)
  return canvas
}

function bakeModernCloudTop(): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(16, 16)
  // Volumetric pastel cloud cushion with creamy crest, cotton-candy mid & soft violet shadow
  ctx.fillStyle = '#9668ba'
  ctx.fillRect(0, 0, 16, 16)
  ctx.fillStyle = '#fff9fc'
  ctx.fillRect(0, 0, 16, 6)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(1, 0, 6, 3)
  ctx.fillRect(9, 0, 6, 2)
  ctx.fillStyle = '#ffd4ea'
  ctx.fillRect(0, 5, 16, 5)
  ctx.fillStyle = '#ffeaf5'
  ctx.fillRect(2, 5, 4, 2)
  ctx.fillRect(10, 5, 4, 2)
  ctx.fillStyle = '#d19ee0'
  ctx.fillRect(0, 10, 16, 4)
  ctx.fillStyle = '#b17bc9'
  ctx.fillRect(3, 12, 5, 2)
  ctx.fillRect(11, 13, 4, 2)
  return canvas
}

function bakeModernCloudBody(): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(16, 16)
  ctx.fillStyle = '#b481cf'
  ctx.fillRect(0, 0, 16, 16)
  ctx.fillStyle = '#d4a6e6'
  ctx.fillRect(1, 1, 7, 5)
  ctx.fillRect(8, 7, 7, 5)
  ctx.fillStyle = '#f0c7f2'
  ctx.fillRect(2, 1, 4, 2)
  ctx.fillRect(9, 7, 4, 2)
  ctx.fillStyle = '#8b5aa8'
  ctx.fillRect(0, 13, 16, 3)
  return canvas
}

function bakeModernHarborTop(): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(16, 16)
  ctx.fillStyle = '#0f1c24'
  ctx.fillRect(0, 0, 16, 16)
  // Detailed timber deck planks with highlight grain, brass bolts & coiled rope trim!
  ctx.fillStyle = '#94624c'
  ctx.fillRect(0, 0, 16, 5)
  ctx.fillStyle = '#c48f6e'
  ctx.fillRect(0, 0, 16, 2)
  ctx.fillStyle = '#edd0aa'
  ctx.fillRect(1, 0, 5, 1)
  ctx.fillRect(9, 0, 5, 1)
  ctx.fillStyle = '#241617'
  ctx.fillRect(7, 0, 1, 5)
  ctx.fillRect(15, 0, 1, 5)
  ctx.fillStyle = '#ffe382'
  ctx.fillRect(2, 2, 1, 1)
  ctx.fillRect(10, 2, 1, 1)

  // Rope trim draped cleanly under the dock lip
  ctx.fillStyle = '#d4ad72'
  ctx.fillRect(0, 5, 16, 2)
  ctx.fillStyle = '#fff0bd'
  ctx.fillRect(2, 5, 2, 1)
  ctx.fillRect(7, 5, 2, 1)
  ctx.fillRect(12, 5, 2, 1)
  ctx.fillStyle = '#755336'
  ctx.fillRect(4, 6, 2, 1)
  ctx.fillRect(9, 6, 2, 1)

  ctx.fillStyle = '#5c3c31'
  ctx.fillRect(0, 7, 16, 9)
  ctx.fillStyle = '#3b2420'
  ctx.fillRect(0, 11, 16, 5)
  ctx.fillStyle = '#359c8b'
  ctx.fillRect(1, 7, 3, 2)
  ctx.fillRect(12, 7, 3, 2)
  return canvas
}

function bakeModernHarborBody(): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(16, 16)
  ctx.fillStyle = '#0d1921'
  ctx.fillRect(0, 0, 16, 16)
  ctx.fillStyle = '#57392e'
  ctx.fillRect(2, 0, 5, 16)
  ctx.fillRect(10, 0, 4, 16)
  ctx.fillStyle = '#7d5544'
  ctx.fillRect(2, 0, 2, 16)
  ctx.fillRect(10, 0, 1, 16)
  ctx.fillStyle = '#3b241e'
  ctx.fillRect(0, 7, 16, 3)
  ctx.fillStyle = '#d4ad72'
  ctx.fillRect(2, 6, 5, 1)
  ctx.fillRect(10, 6, 4, 1)
  return canvas
}

// ============================================================================
// EXPANSION SPRITES: BIG STAR (+100), HEDGEHOG, STORM CLOUD, PIER CRAB, WISP
// ============================================================================

const BIG_STAR_0 = [
  '.......oo.......',
  '......oyyo......',
  '.....oywyyo.....',
  '.....oyllyo.....',
  '.oooooywlyooooo.',
  'oyllllwwwwllllyo',
  '.ooylllwwlllyao.',
  '..ooyllwwllyao..',
  '...oyyllllyao...',
  '...oyyllyyyao...',
  '..oyyyoooooyao..',
  '..oyyoo..ooyao..',
  '.oyyoo....ooyao.',
  '.oooo......oooo.',
  '................',
  '................'
]

const BIG_STAR_1 = [
  '.......oo.......',
  '......owwo......',
  '.....oywwyo.....',
  '.....owllwo.....',
  '.ooooowllwooooo.',
  'owwlllwwwwlllwwo',
  '.oowlllwwlllwao.',
  '..ooyllwwllyao..',
  '...oyywwwwyao...',
  '...oyyllyyyao...',
  '..oyyyoooooyao..',
  '..oyyoo..ooyao..',
  '.oyyoo....ooyao.',
  '.oooo......oooo.',
  '................',
  '................'
]

const HEDGEHOG_PALETTE: Record<string, string> = {
  o: '#1a0e24',
  s: '#6e455c',
  d: '#47283d',
  l: '#a6748e',
  f: '#f0cfa8',
  e: '#180c24',
  n: '#ff7b9c'
}

const HEDGEHOG_0 = [
  '....o..o..o...',
  '...osooosoo...',
  '..osldssldso..',
  '.osddssssdsfo.',
  'osdddsssdsfffo',
  'osddssssdsfefo',
  'osssssssdsffno',
  '.osssssssffffo',
  '..oofffffffoo.',
  '..oofo..oofo..',
  '...oo....oo...',
  '..............'
]

const HEDGEHOG_1 = [
  '....o..o..o...',
  '...osooosoo...',
  '..osldssldso..',
  '.osddssssdsfo.',
  'osdddsssdsfffo',
  'osddssssdsfefo',
  'osssssssdsffno',
  '.osssssssffffo',
  '..oofffffffoo.',
  '...oofooofo...',
  '....oo..oo....',
  '..............'
]

const STORM_CLOUD_GRID = [
  '......oooooo............',
  '....ooccccccooo.........',
  '...occllllcccccooo......',
  '..occllccccccccccco.....',
  '.occccccccccccccccco....',
  'occcddddccccccccddddo...',
  'ocddddddcccccccdddddo...',
  '.ocddddddddddddddddo....',
  '..ooooooooooooooooo.....',
  '........................'
]

const CRAB_PALETTE: Record<string, string> = {
  o: '#1f0d24',
  r: '#e85258',
  l: '#ff8a80',
  d: '#9e2636',
  w: '#ffffff',
  e: '#180a1f'
}

const CRAB_0 = [
  '.oo........oo.',
  'orro......orro',
  'orlo.oooo.orlo',
  '.oorrllllrroo.',
  '..orwerrwero..',
  '..orrrrrrrro..',
  '.oorrddddrroo.',
  'oroo.oooo.ooro',
  'oo..oo..oo..oo',
  '..............'
]

const CRAB_1 = [
  '..oo......oo..',
  '.orro....orro.',
  '.orlooooooorlo',
  '..orrllllrro..',
  '..orwerrwero..',
  '..orrrrrrrro..',
  '.oorrddddrroo.',
  '.oro.oooo.oro.',
  '.oo.oo..oo.oo.',
  '..............'
]

const WISP_PALETTE: Record<string, string> = {
  o: '#142942',
  c: '#72e3ff',
  l: '#d4faff',
  w: '#ffffff',
  g: '#ffe475'
}

const WISP_0 = [
  '.....oo.....',
  '....occo....',
  '...ocllco...',
  '..oclwwlco..',
  '..ocwggwco..',
  '.occlwwlcco.',
  '.occllllcco.',
  '..occcccco..',
  '...ocllco...',
  '....occo....',
  '.....oo.....',
  '....o..o....',
  '............',
  '............'
]

const WISP_1 = [
  '......oo....',
  '.....occo...',
  '...ocllco...',
  '..oclwwlco..',
  '..ocwggwco..',
  '.occlwwlcco.',
  '.occllllcco.',
  '..occcccco..',
  '...ocllco...',
  '...occo.....',
  '....oo......',
  '.....o......',
  '............',
  '............'
]

let cachedBank: SpriteBank | null = null
const powerUpIconCache = new Map<string, string>()

export function getPowerUpIconDataUrl(kind: PowerUpKind): string {
  if (typeof document === 'undefined') return ''
  const cached = powerUpIconCache.get(kind)
  if (cached) return cached
  const bank = getSpriteBank()
  const url = bank.powerUps[kind].toDataURL('image/png')
  powerUpIconCache.set(kind, url)
  return url
}

export function getSpriteBank(): SpriteBank {
  if (cachedBank) return cachedBank

  const crow0 = bakeGrid(CROW_0, CROW_PALETTE)
  const crow1 = bakeGrid(CROW_1, CROW_PALETTE)
  const hh0 = bakeGrid(HEDGEHOG_0, HEDGEHOG_PALETTE)
  const hh1 = bakeGrid(HEDGEHOG_1, HEDGEHOG_PALETTE)

  cachedBank = {
    star: [bakeGrid(STAR_0, STAR_PALETTE), bakeGrid(STAR_1, STAR_PALETTE)],
    bigStar: [bakeGrid(BIG_STAR_0, STAR_PALETTE), bakeGrid(BIG_STAR_1, STAR_PALETTE)],
    fish: [bakeGrid(FISH_0, FISH_PALETTE), bakeGrid(FISH_1, FISH_PALETTE)],
    powerUps: {
      milk: bakeGrid(MILK_GRID, MILK_PALETTE),
      feather: bakeGrid(FEATHER_GRID, FEATHER_PALETTE),
      bell: bakeGrid(BELL_GRID, BELL_PALETTE),
      bubble: bakeGrid(BUBBLE_GRID, BUBBLE_PALETTE),
      mooncake: bakeGrid(MOONCAKE_GRID, MOONCAKE_PALETTE),
      yarn: bakeGrid(YARN_GRID, YARN_PALETTE),
      mochi: bakeGrid(MOCHI_GRID, MOCHI_PALETTE),
      candy: bakeGrid(CANDY_GRID, CANDY_PALETTE),
      pearl: bakeGrid(PEARL_GRID, PEARL_PALETTE),
      crystalElixir: bakeGrid(CRYSTAL_ELIXIR_GRID, CRYSTAL_ELIXIR_PALETTE),
      chronoGear: bakeGrid(CHRONO_GEAR_GRID, CHRONO_GEAR_PALETTE),
      starNectar: bakeGrid(STAR_NECTAR_GRID, STAR_NECTAR_PALETTE),
      eclipseShard: bakeGrid(ECLIPSE_SHARD_GRID, ECLIPSE_SHARD_PALETTE)
    },
    crow: {
      right: [crow0, crow1],
      left: [flipH(crow0), flipH(crow1)]
    },
    hedgehog: {
      right: [hh0, hh1],
      left: [flipH(hh0), flipH(hh1)]
    },
    stormCloud: {
      calm: bakeGrid(STORM_CLOUD_GRID, { o: '#16112b', c: '#4c4670', l: '#7a75a6', d: '#312c4d' }),
      warn: bakeGrid(STORM_CLOUD_GRID, { o: '#2b1b14', c: '#ffd24d', l: '#fff6b8', d: '#d98a1c' }),
      zap: bakeGrid(STORM_CLOUD_GRID, { o: '#192642', c: '#9cecff', l: '#ffffff', d: '#52a8e6' })
    },
    crab: [bakeGrid(CRAB_0, CRAB_PALETTE), bakeGrid(CRAB_1, CRAB_PALETTE)],
    wisp: [bakeGrid(WISP_0, WISP_PALETTE), bakeGrid(WISP_1, WISP_PALETTE)],
    puddle: [bakeGrid(PUDDLE_0, PUDDLE_PALETTE), bakeGrid(PUDDLE_1, PUDDLE_PALETTE)],
    lantern: [bakeGrid(LANTERN_0, LANTERN_PALETTE), bakeGrid(LANTERN_1, LANTERN_PALETTE)],
    stoneLantern: [bakeStoneLantern(0), bakeStoneLantern(1)],
    checkpoint: {
      off: bakeGrid(CHECKPOINT_GRID, CHECKPOINT_OFF_PALETTE),
      on0: bakeGrid(CHECKPOINT_GRID, CHECKPOINT_ON_0_PALETTE),
      on1: bakeGrid(CHECKPOINT_GRID, CHECKPOINT_ON_1_PALETTE)
    },
    bounceCloud: {
      normal: bakeGrid(BOUNCE_CLOUD_NORMAL, CLOUD_PALETTE),
      squish: bakeGrid(BOUNCE_CLOUD_SQUISH, CLOUD_PALETTE)
    },
    npc: {
      owl: [bakeGrid(NPC_OWL_0, NPC_OWL_PALETTE), bakeGrid(NPC_OWL_1, NPC_OWL_PALETTE)],
      bunny: [bakeGrid(NPC_BUNNY_0, NPC_BUNNY_PALETTE), bakeGrid(NPC_BUNNY_1, NPC_BUNNY_PALETTE)],
      kitten: [bakeGrid(NPC_KITTEN_0, NPC_KITTEN_PALETTE), bakeGrid(NPC_KITTEN_1, NPC_KITTEN_PALETTE)]
    },
    portal: [bakeMoonPortal(0), bakeMoonPortal(1)],
    moon: bakeCrescentMoon(),
    fullMoon: bakeFullMoon(),
    props: {
      fence: bakeGrid(FENCE_GRID, FENCE_PALETTE),
      flowerPink: bakeFlower('#ff8cb8', '#ffd6e8'),
      flowerBlue: bakeFlower('#78c6ff', '#d6f2ff'),
      flowerGold: bakeFlower('#ffd85c', '#fff7c4'),
      pottedPlant: bakeGrid(POTTED_PLANT_GRID, POTTED_PLANT_PALETTE),
      sakuraBranch: bakeGrid(SAKURA_BRANCH_GRID, SAKURA_BRANCH_PALETTE),
      harborPost: bakeGrid(HARBOR_POST_GRID, HARBOR_POST_PALETTE)
    },
    tiles: {
      brickTop: bakeBrickTop(),
      brickBody: bakeBrickBody(),
      woodTop: bakeWoodTop(),
      woodBody: bakeWoodBody(),
      sakuraTop: bakeSakuraTop(),
      sakuraBody: bakeSakuraBody(),
      cloudTop: bakeCloudTop(),
      cloudBody: bakeCloudBody(),
      harborTop: bakeHarborTop(),
      harborBody: bakeHarborBody(),
      cavernTop: bakeStyledTile('#76f5e8', '#3ba3a8', '#253959', '#131d33', '#b88cff', true, false),
      cavernBody: bakeStyledTile('#76f5e8', '#3ba3a8', '#223352', '#111a2e', '#65e8dc', false, false),
      observatoryTop: bakeStyledTile('#ffe694', '#c9933b', '#333463', '#1a1b3b', '#fff5cc', true, false),
      observatoryBody: bakeStyledTile('#ffe694', '#c9933b', '#2b2c57', '#161733', '#d9a441', false, false),
      eclipseTop: bakeStyledTile('#ff7d9e', '#9e2a55', '#36193b', '#1b0b21', '#ffd670', true, false),
      eclipseBody: bakeStyledTile('#ff7d9e', '#9e2a55', '#2b1330', '#16091c', '#e64972', false, false),
      citadelTop: bakeStyledTile('#b8c4ff', '#6c5ce7', '#262059', '#120d33', '#ffe680', true, false),
      citadelBody: bakeStyledTile('#b8c4ff', '#6c5ce7', '#1f1a4d', '#0f0a2b', '#87e8ff', false, false),
      movingLeft: bakeMovingSegment('left'),
      movingMid: bakeMovingSegment('mid'),
      movingRight: bakeMovingSegment('right')
    },
    modernTiles: {
      brickTop: bakeModernBrickTop(),
      brickBody: bakeModernBrickBody(),
      woodTop: bakeModernWoodTop(),
      woodBody: bakeModernWoodBody(),
      sakuraTop: bakeModernSakuraTop(),
      sakuraBody: bakeModernSakuraBody(),
      cloudTop: bakeModernCloudTop(),
      cloudBody: bakeModernCloudBody(),
      harborTop: bakeModernHarborTop(),
      harborBody: bakeModernHarborBody(),
      cavernTop: bakeStyledTile('#8efcf2', '#42b8bf', '#294066', '#142038', '#c89eff', true, true),
      cavernBody: bakeStyledTile('#8efcf2', '#42b8bf', '#233659', '#121c33', '#6cf2e8', false, true),
      observatoryTop: bakeStyledTile('#ffeda8', '#d9a145', '#393b70', '#1c1d40', '#fff8d4', true, true),
      observatoryBody: bakeStyledTile('#ffeda8', '#d9a145', '#2f3161', '#171836', '#e8b658', false, true),
      eclipseTop: bakeStyledTile('#ff94b0', '#b53364', '#401e45', '#1d0b24', '#ffe082', true, true),
      eclipseBody: bakeStyledTile('#ff94b0', '#b53364', '#311636', '#17091e', '#ff5e84', false, true),
      citadelTop: bakeStyledTile('#d1dbff', '#7c6cf2', '#2c2566', '#140e38', '#ffeb8f', true, true),
      citadelBody: bakeStyledTile('#d1dbff', '#7c6cf2', '#231d57', '#100b30', '#9ef0ff', false, true)
    }
  }

  return cachedBank
}
