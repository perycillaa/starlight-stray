import { getCharacterById } from './characters'
import { drawPixelText } from './pixelFont'
import { getPlayerSpriteSet, getSpriteBank } from './sprites'
import type {
  BiomeId,
  CapeId,
  CharacterId,
  FaceAccId,
  GraphicsStyle,
  HatId,
  HeadAccId,
  PostcardPoseId,
  ScarfColorId
} from './types'

export interface PostcardOptions {
  biome: BiomeId
  pose: PostcardPoseId
  style: GraphicsStyle
  characterId: CharacterId
  scarfId: ScarfColorId
  hatId: HatId
  capeId: CapeId
  headAccId?: HeadAccId
  faceAccId?: FaceAccId
}

export const POSTCARD_BASE_W = 240
export const POSTCARD_BASE_H = 150
export const POSTCARD_HD_SCALE = 4 // 960 x 600 ultra-crisp HD PNG!

function drawGlow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  c0: string,
  c1: string
): void {
  const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, r)
  g.addColorStop(0, c0)
  g.addColorStop(0.5, c1)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
}

function drawCurledSleepPose(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sitSprite: HTMLCanvasElement,
  isModern: boolean
): void {
  // Cozy tucked sleeping posture anchored neatly on the ground, with soft gentle Zzz!
  // Draw lower body slightly compressed & tilted cozy using crisp integer crops (zero smoothing!)
  ctx.drawImage(sitSprite, 0, 12, 24, 12, Math.round(x), Math.round(y + 12), 24, 12)
  ctx.drawImage(sitSprite, 2, 3, 20, 11, Math.round(x + 3), Math.round(y + 9), 20, 10)
  // Cozy closed sleepy eyes line
  ctx.fillStyle = isModern ? '#2a163d' : '#0c0514'
  ctx.fillRect(Math.round(x + 11), Math.round(y + 14), 2, 1)
  ctx.fillRect(Math.round(x + 15), Math.round(y + 14), 2, 1)
  // Floating crisp pixel "Z" sleep marks
  drawPixelText(ctx, 'Z', x + 23, y + 3, '#fff2b0', { scale: 1, shadowColor: '#1a0f1d' })
  ctx.fillStyle = '#ffd6eb'
  ctx.fillRect(Math.round(x + 19), Math.round(y + 8), 3, 1)
  ctx.fillRect(Math.round(x + 20), Math.round(y + 9), 1, 1)
  ctx.fillRect(Math.round(x + 19), Math.round(y + 10), 3, 1)
}

/**
 * Renders the crisp 240x150 pixel postcard scene onto an offscreen canvas.
 */
export function renderPostcardBase(opts: PostcardOptions): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = POSTCARD_BASE_W
  canvas.height = POSTCARD_BASE_H
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  const W = POSTCARD_BASE_W
  const H = POSTCARD_BASE_H
  const isModern = opts.style === 'modern'
  const sprites = getSpriteBank()
  const tiles = isModern ? sprites.modernTiles : sprites.tiles
  const charSprites = getPlayerSpriteSet(
    opts.characterId,
    opts.scarfId,
    opts.hatId,
    opts.capeId,
    opts.style,
    opts.headAccId ?? 'none',
    opts.faceAccId ?? 'none'
  )

  // --------------------------------------------------------------------------
  // 1. NIGHT SKY PER BIOME (Classic 8-Bit flat vs Modern 16-Bit rich gradient)
  // --------------------------------------------------------------------------
  const skyPalettes: Record<BiomeId, [string, string, string, string]> = {
    rooftops: ['#120a24', '#1d103d', '#2e1a59', '#42256e'],
    sakura: ['#0d1233', '#192152', '#2d2b69', '#4a387a'],
    cloudland: ['#221445', '#3b226b', '#5d3382', '#824c96'],
    harbor: ['#061920', '#0c2833', '#15404d', '#205b66'],
    cavern: ['#071326', '#0e223d', '#183659', '#254a70'],
    observatory: ['#0b0e29', '#161b47', '#262b66', '#3d3c7a'],
    eclipse: ['#1a0616', '#330c28', '#52153c', '#731e4d'],
    citadel: ['#090621', '#161042', '#281d69', '#3f2c8c']
  }
  const pal = skyPalettes[opts.biome]
  if (!isModern) {
    ctx.fillStyle = pal[0]
    ctx.fillRect(0, 0, W, 62)
    ctx.fillStyle = pal[1]
    ctx.fillRect(0, 62, W, H - 62)
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, H - 22)
    grad.addColorStop(0, pal[0])
    grad.addColorStop(0.35, pal[1])
    grad.addColorStop(0.7, pal[2])
    grad.addColorStop(1, pal[3])
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
  }

  // Crisp stars (seeded deterministically so postcard stays serene and balanced)
  const starCoords: [number, number, boolean][] = [
    [18, 16, false], [38, 28, true], [56, 14, false], [74, 34, false], [92, 18, true],
    [114, 24, false], [134, 15, false], [156, 30, true], [198, 20, false], [218, 34, false],
    [28, 46, false], [64, 50, false], [122, 44, true], [208, 52, false], [48, 36, false]
  ]
  for (const [sx, sy, cross] of starCoords) {
    ctx.fillStyle = cross ? '#fff6bd' : '#dcd6ff'
    if (isModern && cross) {
      ctx.fillRect(sx, sy - 1, 1, 3)
      ctx.fillRect(sx - 1, sy, 3, 1)
    } else {
      ctx.fillRect(sx, sy, 1, 1)
    }
  }

  // --------------------------------------------------------------------------
  // 2. RADIANT FULL MOON (with additive moonlight halo in 16-Bit Modern!)
  // --------------------------------------------------------------------------
  const moonX = 148
  const moonY = 16
  if (isModern) {
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    drawGlow(ctx, moonX + 22, moonY + 22, 48, 'rgba(255, 244, 192, 0.36)', 'rgba(255, 208, 138, 0.14)')
    ctx.restore()
  }
  ctx.drawImage(sprites.fullMoon, moonX, moonY)

  // Soft pixel clouds
  const cloudColor = isModern
    ? opts.biome === 'cloudland'
      ? 'rgba(255, 224, 244, 0.42)'
      : 'rgba(110, 82, 166, 0.36)'
    : opts.biome === 'harbor'
      ? '#143845'
      : '#2d1c54'
  ctx.fillStyle = cloudColor
  ctx.fillRect(22, 34, 38, 6)
  ctx.fillRect(28, 30, 22, 4)
  ctx.fillRect(102, 44, 34, 5)
  ctx.fillRect(108, 41, 18, 3)

  // --------------------------------------------------------------------------
  // 3. BIOME SILHOUETTE & SCENIC FLOOR
  // --------------------------------------------------------------------------
  const floorY = 98
  if (opts.biome === 'rooftops') {
    // Distant city buildings
    const bldgs = [
      [12, 46, 28], [44, 56, 26], [74, 40, 32], [110, 52, 24], [142, 44, 30], [180, 54, 34], [216, 42, 20]
    ]
    for (const [bx, bh, bw] of bldgs) {
      const by = floorY - bh! + 8
      ctx.fillStyle = '#180e33'
      ctx.fillRect(bx!, by, bw!, bh!)
      ctx.fillStyle = '#ffd873'
      ctx.fillRect(bx! + 5, by + 8, 2, 3)
      ctx.fillRect(bx! + 13, by + 16, 2, 3)
      if (isModern) {
        ctx.fillStyle = 'rgba(255, 212, 112, 0.25)'
        ctx.fillRect(bx! + 4, by + 7, 4, 5)
        ctx.fillRect(bx! + 12, by + 15, 4, 5)
      }
    }
    // Brick roof stage
    for (let tx = 0; tx < W; tx += 16) {
      ctx.drawImage(tiles.brickTop, tx, floorY)
      ctx.drawImage(tiles.brickBody, tx, floorY + 16)
    }
    ctx.drawImage(sprites.props.fence, 18, floorY - 10)
    if (isModern) {
      ctx.drawImage(sprites.props.pottedPlant, 196, floorY - 10)
    }
    ctx.drawImage(sprites.lantern[0], 42, floorY - 20)
    ctx.drawImage(sprites.lantern[1], 178, floorY - 20)
    if (isModern) {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      drawGlow(ctx, 48, floorY - 12, 30, 'rgba(255, 218, 128, 0.36)', 'rgba(240, 140, 54, 0.12)')
      drawGlow(ctx, 184, floorY - 12, 30, 'rgba(255, 218, 128, 0.36)', 'rgba(240, 140, 54, 0.12)')
      ctx.restore()
    }
  } else if (opts.biome === 'sakura') {
    // Distant indigo hills + Torii gate + Sakura trees
    ctx.fillStyle = '#181940'
    ctx.fillRect(8, 72, 74, 34)
    ctx.fillRect(142, 68, 92, 38)
    // Torii gate silhouette
    ctx.fillStyle = '#2d1a47'
    ctx.fillRect(156, 66, 36, 4)
    ctx.fillRect(160, 72, 28, 3)
    ctx.fillRect(163, 70, 4, 30)
    ctx.fillRect(181, 70, 4, 30)
    ctx.fillStyle = '#873d66'
    ctx.fillRect(154, 64, 40, 2)

    for (let tx = 0; tx < W; tx += 16) {
      ctx.drawImage(tiles.sakuraTop, tx, floorY)
      ctx.drawImage(tiles.sakuraBody, tx, floorY + 16)
    }
    ctx.drawImage(sprites.stoneLantern[0], 42, floorY - 20)
    ctx.drawImage(sprites.stoneLantern[1], 184, floorY - 20)
    ctx.drawImage(sprites.props.flowerPink, 64, floorY - 7)
    ctx.drawImage(sprites.props.flowerPink, 164, floorY - 7)
    // Gentle sakura petals in air
    const petals = [[34, 58], [76, 44], [116, 62], [150, 50], [202, 64], [90, 78]]
    for (const [px, py] of petals) {
      ctx.fillStyle = '#ffb5d8'
      ctx.fillRect(px!, py!, 2, 2)
    }
    if (isModern) {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      drawGlow(ctx, 48, floorY - 12, 28, 'rgba(255, 198, 224, 0.34)', 'rgba(218, 130, 178, 0.12)')
      drawGlow(ctx, 190, floorY - 12, 28, 'rgba(255, 198, 224, 0.34)', 'rgba(218, 130, 178, 0.12)')
      ctx.restore()
    }
  } else if (opts.biome === 'cloudland') {
    // Distant lavender cloud peaks & floating islands
    ctx.fillStyle = '#4e2f78'
    ctx.fillRect(14, 72, 68, 30)
    ctx.fillRect(26, 62, 44, 12)
    ctx.fillRect(150, 70, 76, 32)
    ctx.fillRect(166, 60, 44, 12)
    for (let tx = 0; tx < W; tx += 16) {
      ctx.drawImage(tiles.cloudTop, tx, floorY)
      ctx.drawImage(tiles.cloudBody, tx, floorY + 16)
    }
    ctx.drawImage(sprites.bounceCloud.normal, 36, floorY - 10)
    ctx.drawImage(sprites.star[0], 56, 68)
    ctx.drawImage(sprites.star[1], 186, 64)
    if (isModern) {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      drawGlow(ctx, 62, 74, 18, 'rgba(255, 246, 176, 0.32)', 'rgba(255, 206, 120, 0.10)')
      drawGlow(ctx, 192, 70, 18, 'rgba(255, 246, 176, 0.32)', 'rgba(255, 206, 120, 0.10)')
      ctx.restore()
    }
  } else if (opts.biome === 'cavern') {
    // Crystal Mushroom Cavern: glowing mushrooms & crystal formations
    ctx.fillStyle = '#0c1f36'
    ctx.fillRect(0, 0, W, 18)
    ctx.fillStyle = '#183757'
    ctx.fillRect(16, 12, 12, 22)
    ctx.fillRect(198, 10, 14, 26)
    ctx.fillStyle = '#6cf2ec'
    ctx.fillRect(28, 72, 6, 26)
    ctx.fillRect(36, 80, 5, 18)
    ctx.fillStyle = '#b88cff'
    ctx.fillRect(190, 74, 7, 24)
    for (let tx = 0; tx < W; tx += 16) {
      ctx.drawImage(tiles.cavernTop, tx, floorY)
      ctx.drawImage(tiles.cavernBody, tx, floorY + 16)
    }
    // Glowing bioluminescent mushroom caps
    ctx.fillStyle = '#254463'
    ctx.fillRect(42, floorY - 12, 4, 12)
    ctx.fillStyle = '#5ef2e6'
    ctx.fillRect(34, floorY - 18, 20, 7)
    ctx.fillStyle = '#d4ffff'
    ctx.fillRect(38, floorY - 16, 4, 2)
    ctx.fillStyle = '#33285e'
    ctx.fillRect(184, floorY - 10, 4, 10)
    ctx.fillStyle = '#c48cff'
    ctx.fillRect(178, floorY - 15, 16, 6)
    if (isModern) {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      drawGlow(ctx, 44, floorY - 14, 28, 'rgba(110, 248, 236, 0.36)', 'rgba(84, 178, 232, 0.12)')
      drawGlow(ctx, 186, floorY - 12, 26, 'rgba(194, 142, 255, 0.34)', 'rgba(130, 88, 224, 0.12)')
      ctx.restore()
    }
  } else if (opts.biome === 'observatory') {
    // Clockwork Observatory: brass gears, dome silhouette, astral beams
    ctx.fillStyle = '#1b1f4d'
    ctx.fillRect(18, 56, 42, 44)
    ctx.fillRect(26, 46, 26, 12)
    ctx.fillStyle = '#d9a441'
    ctx.fillRect(178, 56, 24, 24)
    ctx.fillStyle = '#1d2152'
    ctx.fillRect(184, 62, 12, 12)
    ctx.fillStyle = '#ffe894'
    ctx.fillRect(188, 66, 4, 4)
    for (let tx = 0; tx < W; tx += 16) {
      ctx.drawImage(tiles.observatoryTop, tx, floorY)
      ctx.drawImage(tiles.observatoryBody, tx, floorY + 16)
    }
    if (isModern) {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      drawGlow(ctx, 190, 68, 30, 'rgba(255, 226, 130, 0.32)', 'rgba(200, 152, 62, 0.10)')
      ctx.restore()
    }
  } else if (opts.biome === 'eclipse' || opts.biome === 'citadel') {
    const topT = opts.biome === 'eclipse' ? tiles.eclipseTop : tiles.citadelTop
    const bodyT = opts.biome === 'eclipse' ? tiles.eclipseBody : tiles.citadelBody
    for (let tx = 0; tx < W; tx += 16) {
      ctx.drawImage(topT, tx, floorY)
      ctx.drawImage(bodyT, tx, floorY + 16)
    }
    if (isModern) {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      drawGlow(
        ctx,
        120,
        floorY - 24,
        42,
        opts.biome === 'eclipse' ? 'rgba(255, 92, 138, 0.30)' : 'rgba(156, 140, 255, 0.34)',
        'rgba(255, 224, 128, 0.10)'
      )
      ctx.restore()
    }
  } else {
    // Harbor: calm dark ocean + distant lighthouse + wooden pier
    ctx.fillStyle = '#092430'
    ctx.fillRect(0, 74, W, 32)
    ctx.fillStyle = '#113a4a'
    ctx.fillRect(0, 74, W, 2)
    // Lighthouse silhouette
    ctx.fillStyle = '#113240'
    ctx.fillRect(36, 48, 10, 26)
    ctx.fillStyle = '#ffe994'
    ctx.fillRect(39, 44, 4, 4)
    if (isModern) {
      drawGlow(ctx, 41, 46, 20, 'rgba(255, 240, 172, 0.30)', 'rgba(255, 206, 118, 0.10)')
      // Calm golden moonlight reflections on water
      for (let r = 0; r < 4; r++) {
        const rw = 30 - r * 5
        ctx.fillStyle = 'rgba(255, 242, 186, 0.32)'
        ctx.fillRect(Math.round(moonX + 22 - rw / 2), 79 + r * 4, rw, 2)
      }
    }
    for (let tx = 0; tx < W; tx += 16) {
      ctx.drawImage(tiles.harborTop, tx, floorY)
      ctx.drawImage(tiles.harborBody, tx, floorY + 16)
    }
    if (isModern) {
      ctx.drawImage(sprites.props.harborPost, 16, floorY - 10)
      ctx.drawImage(sprites.props.harborPost, 208, floorY - 10)
    }
    ctx.drawImage(sprites.lantern[0], 42, floorY - 20)
    ctx.drawImage(sprites.lantern[1], 180, floorY - 20)
    if (isModern) {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      drawGlow(ctx, 48, floorY - 12, 30, 'rgba(255, 218, 128, 0.36)', 'rgba(240, 140, 54, 0.12)')
      drawGlow(ctx, 186, floorY - 12, 30, 'rgba(255, 218, 128, 0.36)', 'rgba(240, 140, 54, 0.12)')
      ctx.restore()
    }
  }

  // --------------------------------------------------------------------------
  // 4. ACTIVE CHARACTER IN SELECTED POSE (2x crisp spotlight in center!)
  // --------------------------------------------------------------------------
  const heroX = 96
  const heroY = floorY - 44 // 48x48 crisp 2x hero standing cleanly on floorY!
  if (isModern) {
    drawGlow(ctx, heroX + 24, heroY + 26, 30, 'rgba(255, 244, 198, 0.28)', 'rgba(255, 192, 224, 0.10)')
  }

  // Soft floor shadow
  ctx.fillStyle = 'rgba(12, 6, 28, 0.44)'
  ctx.fillRect(heroX + 10, floorY - 2, 28, 3)

  const dir = charSprites.right
  if (opts.pose === 'sit') {
    ctx.drawImage(dir.sit0, 0, 0, 24, 24, heroX, heroY + 2, 48, 48)
  } else if (opts.pose === 'jump') {
    ctx.drawImage(dir.jumpUp, 0, 0, 24, 24, heroX, heroY - 10, 48, 48)
    // Joyful sparkling stars under jumping paws
    ctx.fillStyle = '#ffe875'
    ctx.fillRect(heroX + 10, floorY - 8, 3, 3)
    ctx.fillRect(heroX + 34, floorY - 11, 3, 3)
    ctx.fillStyle = '#ffb8dc'
    ctx.fillRect(heroX + 22, floorY - 6, 2, 2)
  } else if (opts.pose === 'sleep') {
    // Draw cozy curled-up sleeping hero at 2x crisp integer scale
    const sleepCanvas = document.createElement('canvas')
    sleepCanvas.width = 36
    sleepCanvas.height = 28
    const sCtx = sleepCanvas.getContext('2d')!
    sCtx.imageSmoothingEnabled = false
    drawCurledSleepPose(sCtx, 2, 2, dir.sit0, isModern)
    ctx.drawImage(sleepCanvas, 0, 0, 36, 28, heroX - 4, heroY - 4, 72, 56)
  } else {
    // 'wave': cheerful pose + warm pixel heart!
    ctx.drawImage(dir.idleSpecial, 0, 0, 24, 24, heroX, heroY + 2, 48, 48)
    // Cute floating pixel heart above character
    const hx = heroX + 44
    const hy = heroY + 4
    ctx.fillStyle = '#1a0f1d'
    ctx.fillRect(hx - 1, hy, 9, 7)
    ctx.fillStyle = '#ff72a6'
    ctx.fillRect(hx + 1, hy + 1, 2, 2)
    ctx.fillRect(hx + 4, hy + 1, 2, 2)
    ctx.fillRect(hx, hy + 2, 7, 2)
    ctx.fillRect(hx + 1, hy + 4, 5, 1)
    ctx.fillRect(hx + 2, hy + 5, 3, 1)
    ctx.fillRect(hx + 3, hy + 6, 1, 1)
    ctx.fillStyle = '#ffd9ea'
    ctx.fillRect(hx + 1, hy + 2, 1, 1)
  }

  // Cute companion NPC perched calmly on right side of postcard
  const npcSpr =
    opts.biome === 'sakura'
      ? sprites.npc.kitten[0]
      : opts.biome === 'cloudland'
        ? sprites.npc.bunny[0]
        : sprites.npc.owl[0]
  ctx.drawImage(npcSpr, 152, floorY - 14)

  // --------------------------------------------------------------------------
  // 5. GOLD-TRIMMED NIGHT POSTCARD FRAME, MOON STAMP & CRISP PIXEL BRANDING
  // --------------------------------------------------------------------------
  // Bottom postcard caption strip (clean dark-plum bar at y = 122..149)
  ctx.fillStyle = '#1b0d2b'
  ctx.fillRect(0, H - 27, W, 27)
  ctx.fillStyle = '#ffd873'
  ctx.fillRect(0, H - 28, W, 2)
  ctx.fillStyle = '#fff4c2'
  ctx.fillRect(0, H - 28, W, 1)

  // Outer pixel postcard border (double gold + dark night outline)
  ctx.fillStyle = '#140921'
  ctx.fillRect(0, 0, W, 2)
  ctx.fillRect(0, H - 2, W, 2)
  ctx.fillRect(0, 0, 2, H)
  ctx.fillRect(W - 2, 0, 2, H)

  ctx.fillStyle = '#ffd873'
  ctx.fillRect(2, 2, W - 4, 2)
  ctx.fillRect(2, H - 4, W - 4, 2)
  ctx.fillRect(2, 2, 2, H - 4)
  ctx.fillRect(W - 4, 2, 2, H - 4)

  // Decorative gold pixel corner rivets
  const corners = [
    [5, 5],
    [W - 8, 5],
    [5, H - 8],
    [W - 8, H - 8]
  ]
  for (const [cx, cy] of corners) {
    ctx.fillStyle = '#fff5c4'
    ctx.fillRect(cx!, cy!, 3, 3)
    ctx.fillStyle = '#c48120'
    ctx.fillRect(cx! + 2, cy! + 2, 1, 1)
  }

  // Cute Postage Stamp Sticker in top-right corner!
  const stX = W - 28
  const stY = 8
  ctx.fillStyle = '#1a0c29'
  ctx.fillRect(stX - 1, stY - 1, 20, 22)
  ctx.fillStyle = '#fff3d6'
  ctx.fillRect(stX, stY, 18, 20)
  ctx.fillStyle = '#2d184f'
  ctx.fillRect(stX + 2, stY + 2, 14, 16)
  // Tiny crescent moon inside postage stamp
  ctx.fillStyle = '#ffe475'
  ctx.fillRect(stX + 6, stY + 5, 5, 8)
  ctx.fillStyle = '#2d184f'
  ctx.fillRect(stX + 8, stY + 6, 4, 6)
  ctx.fillStyle = '#fff8cf'
  ctx.fillRect(stX + 12, stY + 5, 1, 1)
  ctx.fillRect(stX + 13, stY + 9, 1, 1)

  // Crisp pixel text: Character Name (bottom-left) + STARLIGHT STRAY logo (bottom-right)
  const charDef = getCharacterById(opts.characterId)
  const shortName = charDef.name.toUpperCase().slice(0, 16)
  drawPixelText(ctx, shortName, 9, H - 20, '#fff7e8', {
    align: 'left',
    scale: 1,
    letterSpacing: 1,
    shadowColor: '#0e0618'
  })
  drawPixelText(ctx, '* STARLIGHT STRAY *', W - 9, H - 15, '#ffe475', {
    align: 'right',
    scale: 1,
    letterSpacing: 0,
    shadowColor: '#0e0618'
  })

  return canvas
}

/**
 * Renders a crisp 2x preview into a visible <canvas> inside the Photo Studio modal.
 */
export function renderPostcardPreview(targetCanvas: HTMLCanvasElement, opts: PostcardOptions): void {
  const base = renderPostcardBase(opts)
  const scale = 2
  targetCanvas.width = POSTCARD_BASE_W * scale
  targetCanvas.height = POSTCARD_BASE_H * scale
  const ctx = targetCanvas.getContext('2d')
  if (!ctx) return
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height)
  ctx.drawImage(base, 0, 0, POSTCARD_BASE_W, POSTCARD_BASE_H, 0, 0, targetCanvas.width, targetCanvas.height)
}

/**
 * Renders the postcard at 4x HD integer scale (960 x 600) with imageSmoothingEnabled = false
 * onto a hidden export canvas and returns a crisp PNG data URL!
 */
export function exportPostcardHdDataUrl(opts: PostcardOptions): string {
  const base = renderPostcardBase(opts)
  const hdCanvas = document.createElement('canvas')
  hdCanvas.width = POSTCARD_BASE_W * POSTCARD_HD_SCALE
  hdCanvas.height = POSTCARD_BASE_H * POSTCARD_HD_SCALE
  const ctx = hdCanvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(base, 0, 0, POSTCARD_BASE_W, POSTCARD_BASE_H, 0, 0, hdCanvas.width, hdCanvas.height)
  return hdCanvas.toDataURL('image/png')
}
