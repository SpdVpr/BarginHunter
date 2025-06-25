// Sprite Manager for handling character animations
export class SpriteManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private spriteData: ImageData | null = null;
  
  // Sprite dimensions based on the provided image - made larger for better visibility
  private readonly SPRITE_WIDTH = 80;
  private readonly SPRITE_HEIGHT = 80;
  
  // Animation definitions based on the sprite sheet
  private animations = {
    running: {
      frames: 4,
      frameWidth: 80,
      frameHeight: 80,
      startX: 0,
      startY: 0,
      speed: 8 // FPS
    },
    jumping: {
      frames: 3,
      frameWidth: 80,
      frameHeight: 80,
      startX: 0,
      startY: 80,
      speed: 12
    },
    sliding: {
      frames: 2,
      frameWidth: 80,
      frameHeight: 80,
      startX: 0,
      startY: 160,
      speed: 10
    }
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.createSpriteData();
  }

  private createSpriteData() {
    // Create sprite data programmatically based on the provided design
    // This is a simplified version - in production you'd load the actual image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 320; // 4 frames * 80px
    tempCanvas.height = 240; // 3 animation types * 80px
    const tempCtx = tempCanvas.getContext('2d')!;
    
    // For now, we'll create colored rectangles representing the character
    // In production, you'd load the actual sprite sheet image
    this.createCharacterSprites(tempCtx);
    
    this.spriteData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  }

  private createCharacterSprites(ctx: CanvasRenderingContext2D) {
    // Character colors matching the provided sprite sheet exactly
    const colors = {
      skin: '#FFDBAC',        // Light peachy skin tone
      hair: '#8B4513',        // Rich brown hair
      hoodie: '#4ECDC4',      // Bright turquoise hoodie (main color from spec)
      hoodieShade: '#45B7D1', // Slightly darker turquoise for depth
      pants: '#2F4F4F',       // Dark slate gray jeans
      pantsShade: '#1C3333',  // Even darker for shadows
      shoes: '#FFFFFF',       // Pure white sneakers
      shoesShade: '#DCDCDC',  // Light gray for sole/details
      bag: '#8B4513',         // Brown leather bag
      bagShade: '#654321',    // Dark brown for depth
      outline: '#000000'      // Black pixel outlines
    };

    // Create running frames (4 frames) - copying exact pixel positions from your sprite
    for (let i = 0; i < 4; i++) {
      this.drawPixelPerfectRunning(ctx, i * 80, 0, i, colors);
    }

    // Create jumping frames (3 frames)
    for (let i = 0; i < 3; i++) {
      this.drawPixelPerfectJumping(ctx, i * 80, 80, i, colors);
    }

    // Create sliding frames (2 frames)
    for (let i = 0; i < 2; i++) {
      this.drawPixelPerfectSliding(ctx, i * 80, 160, i, colors);
    }
  }

  // Pixel-perfect recreation of your running sprite
  private drawPixelPerfectRunning(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, colors: any) {
    ctx.clearRect(x, y, 80, 80);

    // Scale factor to make sprite larger and more visible
    const scale = 2;
    const offsetX = x + 10;
    const offsetY = y + 5;

    // Hair (brown, spiky style from your sprite)
    ctx.fillStyle = colors.hair;
    this.drawPixelRect(ctx, offsetX + 8*scale, offsetY + 2*scale, 16*scale, 6*scale);
    this.drawPixelRect(ctx, offsetX + 6*scale, offsetY + 4*scale, 4*scale, 4*scale);
    this.drawPixelRect(ctx, offsetX + 22*scale, offsetY + 4*scale, 4*scale, 4*scale);

    // Head/Face (skin tone)
    ctx.fillStyle = colors.skin;
    this.drawPixelRect(ctx, offsetX + 8*scale, offsetY + 8*scale, 16*scale, 12*scale);

    // Eyes (black dots)
    ctx.fillStyle = colors.outline;
    this.drawPixelRect(ctx, offsetX + 11*scale, offsetY + 12*scale, 2*scale, 2*scale);
    this.drawPixelRect(ctx, offsetX + 19*scale, offsetY + 12*scale, 2*scale, 2*scale);

    // Hoodie body (turquoise with shading)
    ctx.fillStyle = colors.hoodie;
    this.drawPixelRect(ctx, offsetX + 6*scale, offsetY + 20*scale, 20*scale, 16*scale);

    // Hoodie shading and details
    ctx.fillStyle = colors.hoodieShade;
    this.drawPixelRect(ctx, offsetX + 22*scale, offsetY + 22*scale, 4*scale, 12*scale);
    this.drawPixelRect(ctx, offsetX + 8*scale, offsetY + 34*scale, 16*scale, 2*scale);

    // Hoodie hood outline
    ctx.fillStyle = colors.outline;
    this.drawPixelRect(ctx, offsetX + 6*scale, offsetY + 20*scale, 1*scale, 16*scale);
    this.drawPixelRect(ctx, offsetX + 25*scale, offsetY + 20*scale, 1*scale, 16*scale);
    this.drawPixelRect(ctx, offsetX + 6*scale, offsetY + 35*scale, 20*scale, 1*scale);

    // Arms - animated based on frame
    ctx.fillStyle = colors.hoodie;
    if (frame === 0 || frame === 2) {
      // Left arm forward, right arm back
      this.drawPixelRect(ctx, offsetX + 2*scale, offsetY + 22*scale, 6*scale, 12*scale);
      this.drawPixelRect(ctx, offsetX + 24*scale, offsetY + 24*scale, 6*scale, 10*scale);
    } else {
      // Arms in middle position
      this.drawPixelRect(ctx, offsetX + 2*scale, offsetY + 24*scale, 6*scale, 10*scale);
      this.drawPixelRect(ctx, offsetX + 24*scale, offsetY + 22*scale, 6*scale, 12*scale);
    }

    // Backpack (brown)
    ctx.fillStyle = colors.bag;
    this.drawPixelRect(ctx, offsetX + 26*scale, offsetY + 18*scale, 6*scale, 12*scale);

    // Backpack straps
    ctx.fillStyle = colors.bagShade;
    this.drawPixelRect(ctx, offsetX + 10*scale, offsetY + 20*scale, 2*scale, 8*scale);
    this.drawPixelRect(ctx, offsetX + 20*scale, offsetY + 20*scale, 2*scale, 8*scale);

    // Pants (dark blue with shading)
    ctx.fillStyle = colors.pants;
    this.drawPixelRect(ctx, offsetX + 8*scale, offsetY + 36*scale, 16*scale, 12*scale);

    // Pants shading
    ctx.fillStyle = colors.pantsShade;
    this.drawPixelRect(ctx, offsetX + 20*scale, offsetY + 38*scale, 4*scale, 8*scale);

    // Belt line
    ctx.fillStyle = colors.outline;
    this.drawPixelRect(ctx, offsetX + 8*scale, offsetY + 36*scale, 16*scale, 1*scale);

    // Legs - animated based on frame
    if (frame === 0 || frame === 2) {
      // Left leg forward, right leg back
      this.drawPixelRect(ctx, offsetX + 6*scale, offsetY + 48*scale, 6*scale, 12*scale);
      this.drawPixelRect(ctx, offsetX + 20*scale, offsetY + 46*scale, 6*scale, 14*scale);
    } else {
      // Both legs under body
      this.drawPixelRect(ctx, offsetX + 10*scale, offsetY + 48*scale, 12*scale, 12*scale);
    }

    // Shoes (white sneakers)
    ctx.fillStyle = colors.shoes;
    if (frame === 0 || frame === 2) {
      this.drawPixelRect(ctx, offsetX + 4*scale, offsetY + 58*scale, 10*scale, 4*scale);
      this.drawPixelRect(ctx, offsetX + 18*scale, offsetY + 58*scale, 10*scale, 4*scale);
    } else {
      this.drawPixelRect(ctx, offsetX + 8*scale, offsetY + 58*scale, 16*scale, 4*scale);
    }

    // Shoe details (gray soles and laces)
    ctx.fillStyle = colors.shoesShade;
    if (frame === 0 || frame === 2) {
      this.drawPixelRect(ctx, offsetX + 4*scale, offsetY + 60*scale, 10*scale, 2*scale);
      this.drawPixelRect(ctx, offsetX + 18*scale, offsetY + 60*scale, 10*scale, 2*scale);
    } else {
      this.drawPixelRect(ctx, offsetX + 8*scale, offsetY + 60*scale, 16*scale, 2*scale);
    }

    // Shoe laces (small black details)
    ctx.fillStyle = colors.outline;
    if (frame === 0 || frame === 2) {
      this.drawPixelRect(ctx, offsetX + 8*scale, offsetY + 58*scale, 2*scale, 1*scale);
      this.drawPixelRect(ctx, offsetX + 22*scale, offsetY + 58*scale, 2*scale, 1*scale);
    } else {
      this.drawPixelRect(ctx, offsetX + 14*scale, offsetY + 58*scale, 4*scale, 1*scale);
    }
  }

  // Helper function for pixel-perfect rectangles
  private drawPixelRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height));
  }

  // Pixel-perfect jumping animation
  private drawPixelPerfectJumping(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, colors: any) {
    ctx.clearRect(x, y, 80, 80);

    const scale = 2;
    const offsetX = x + 10;
    const offsetY = y + 5;

    // Adjust Y position based on jump phase
    const jumpOffset = frame === 1 ? -4*scale : frame === 2 ? 2*scale : 0;
    const adjustedY = offsetY + jumpOffset;

    // Hair
    ctx.fillStyle = colors.hair;
    this.drawPixelRect(ctx, offsetX + 8*scale, adjustedY + 2*scale, 16*scale, 6*scale);
    this.drawPixelRect(ctx, offsetX + 6*scale, adjustedY + 4*scale, 4*scale, 4*scale);
    this.drawPixelRect(ctx, offsetX + 22*scale, adjustedY + 4*scale, 4*scale, 4*scale);

    // Head
    ctx.fillStyle = colors.skin;
    this.drawPixelRect(ctx, offsetX + 8*scale, adjustedY + 8*scale, 16*scale, 12*scale);

    // Eyes
    ctx.fillStyle = colors.outline;
    this.drawPixelRect(ctx, offsetX + 11*scale, adjustedY + 12*scale, 2*scale, 2*scale);
    this.drawPixelRect(ctx, offsetX + 19*scale, adjustedY + 12*scale, 2*scale, 2*scale);

    // Hoodie
    ctx.fillStyle = colors.hoodie;
    this.drawPixelRect(ctx, offsetX + 6*scale, adjustedY + 20*scale, 20*scale, 16*scale);

    // Arms raised during jump
    ctx.fillStyle = colors.hoodie;
    this.drawPixelRect(ctx, offsetX + 2*scale, adjustedY + 18*scale, 6*scale, 10*scale);
    this.drawPixelRect(ctx, offsetX + 24*scale, adjustedY + 18*scale, 6*scale, 10*scale);

    // Backpack
    ctx.fillStyle = colors.bag;
    this.drawPixelRect(ctx, offsetX + 26*scale, adjustedY + 18*scale, 6*scale, 12*scale);

    // Pants
    ctx.fillStyle = colors.pants;
    this.drawPixelRect(ctx, offsetX + 8*scale, adjustedY + 36*scale, 16*scale, 8*scale);

    // Legs bent during jump
    if (frame === 1) {
      // Legs pulled up during peak
      this.drawPixelRect(ctx, offsetX + 8*scale, adjustedY + 44*scale, 6*scale, 8*scale);
      this.drawPixelRect(ctx, offsetX + 18*scale, adjustedY + 44*scale, 6*scale, 8*scale);
    } else {
      // Legs extended during takeoff/landing
      this.drawPixelRect(ctx, offsetX + 8*scale, adjustedY + 44*scale, 6*scale, 12*scale);
      this.drawPixelRect(ctx, offsetX + 18*scale, adjustedY + 44*scale, 6*scale, 12*scale);
    }

    // Shoes
    ctx.fillStyle = colors.shoes;
    if (frame === 1) {
      this.drawPixelRect(ctx, offsetX + 6*scale, adjustedY + 50*scale, 10*scale, 4*scale);
      this.drawPixelRect(ctx, offsetX + 16*scale, adjustedY + 50*scale, 10*scale, 4*scale);
    } else {
      this.drawPixelRect(ctx, offsetX + 6*scale, adjustedY + 54*scale, 10*scale, 4*scale);
      this.drawPixelRect(ctx, offsetX + 16*scale, adjustedY + 54*scale, 10*scale, 4*scale);
    }
  }

  private drawRunningFrame(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, frame: number, colors: any) {
    // Scale everything up by 1.5x for better visibility
    const scale = 1.5;

    // Body (hoodie)
    ctx.fillStyle = colors.hoodie;
    ctx.fillRect(centerX - 12*scale, centerY - 8*scale, 24*scale, 20*scale);

    // Head
    ctx.fillStyle = colors.skin;
    ctx.fillRect(centerX - 8*scale, centerY - 20*scale, 16*scale, 12*scale);

    // Hair
    ctx.fillStyle = colors.hair;
    ctx.fillRect(centerX - 8*scale, centerY - 24*scale, 16*scale, 8*scale);

    // Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(centerX - 5*scale, centerY - 18*scale, 2*scale, 2*scale);
    ctx.fillRect(centerX + 3*scale, centerY - 18*scale, 2*scale, 2*scale);

    // Legs (animated based on frame)
    ctx.fillStyle = colors.pants;
    if (frame === 0 || frame === 2) {
      // Left leg forward, right leg back
      ctx.fillRect(centerX - 8*scale, centerY + 12*scale, 6*scale, 14*scale);
      ctx.fillRect(centerX + 2*scale, centerY + 8*scale, 6*scale, 18*scale);
    } else {
      // Both legs under body
      ctx.fillRect(centerX - 6*scale, centerY + 12*scale, 12*scale, 14*scale);
    }

    // Shoes
    ctx.fillStyle = colors.shoes;
    if (frame === 0 || frame === 2) {
      ctx.fillRect(centerX - 10*scale, centerY + 24*scale, 8*scale, 4*scale);
      ctx.fillRect(centerX + 2*scale, centerY + 24*scale, 8*scale, 4*scale);
    } else {
      ctx.fillRect(centerX - 8*scale, centerY + 24*scale, 16*scale, 4*scale);
    }

    // Arms (animated)
    ctx.fillStyle = colors.hoodie;
    if (frame === 0 || frame === 2) {
      // Left arm back, right arm forward
      ctx.fillRect(centerX - 16*scale, centerY - 4*scale, 8*scale, 14*scale);
      ctx.fillRect(centerX + 8*scale, centerY - 8*scale, 8*scale, 14*scale);
    } else {
      // Arms in neutral position
      ctx.fillRect(centerX - 14*scale, centerY - 6*scale, 8*scale, 14*scale);
      ctx.fillRect(centerX + 6*scale, centerY - 6*scale, 8*scale, 14*scale);
    }

    // Bag/backpack
    ctx.fillStyle = colors.bag;
    ctx.fillRect(centerX + 8*scale, centerY - 4*scale, 8*scale, 12*scale);

    // Bag straps
    ctx.fillStyle = colors.bag;
    ctx.fillRect(centerX - 4*scale, centerY - 6*scale, 3*scale, 12*scale);
    ctx.fillRect(centerX + 1*scale, centerY - 6*scale, 3*scale, 12*scale);
  }

  private drawJumpingFrame(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, frame: number, colors: any) {
    const scale = 1.5;
    // Adjust Y position based on jump frame
    const jumpOffset = frame === 1 ? -8*scale : frame === 2 ? 4*scale : 0;
    const adjustedY = centerY + jumpOffset;

    // Body
    ctx.fillStyle = colors.hoodie;
    ctx.fillRect(centerX - 12*scale, adjustedY - 8*scale, 24*scale, 20*scale);

    // Head
    ctx.fillStyle = colors.skin;
    ctx.fillRect(centerX - 8*scale, adjustedY - 20*scale, 16*scale, 12*scale);

    // Hair
    ctx.fillStyle = colors.hair;
    ctx.fillRect(centerX - 8*scale, adjustedY - 24*scale, 16*scale, 8*scale);

    // Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(centerX - 5*scale, adjustedY - 18*scale, 2*scale, 2*scale);
    ctx.fillRect(centerX + 3*scale, adjustedY - 18*scale, 2*scale, 2*scale);

    // Legs (bent during jump)
    ctx.fillStyle = colors.pants;
    if (frame === 1) {
      // Legs bent up during peak of jump
      ctx.fillRect(centerX - 8*scale, adjustedY + 6*scale, 6*scale, 10*scale);
      ctx.fillRect(centerX + 2*scale, adjustedY + 6*scale, 6*scale, 10*scale);
    } else {
      // Legs extended during takeoff/landing
      ctx.fillRect(centerX - 8*scale, adjustedY + 12*scale, 6*scale, 14*scale);
      ctx.fillRect(centerX + 2*scale, adjustedY + 12*scale, 6*scale, 14*scale);
    }

    // Shoes
    ctx.fillStyle = colors.shoes;
    if (frame === 1) {
      ctx.fillRect(centerX - 10*scale, adjustedY + 14*scale, 8*scale, 4*scale);
      ctx.fillRect(centerX + 2*scale, adjustedY + 14*scale, 8*scale, 4*scale);
    } else {
      ctx.fillRect(centerX - 10*scale, adjustedY + 24*scale, 8*scale, 4*scale);
      ctx.fillRect(centerX + 2*scale, adjustedY + 24*scale, 8*scale, 4*scale);
    }

    // Arms (raised during jump)
    ctx.fillStyle = colors.hoodie;
    ctx.fillRect(centerX - 16*scale, adjustedY - 10*scale, 8*scale, 12*scale);
    ctx.fillRect(centerX + 8*scale, adjustedY - 10*scale, 8*scale, 12*scale);

    // Bag
    ctx.fillStyle = colors.bag;
    ctx.fillRect(centerX + 8*scale, adjustedY - 4*scale, 8*scale, 12*scale);
  }

  // Pixel-perfect sliding animation
  private drawPixelPerfectSliding(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, colors: any) {
    ctx.clearRect(x, y, 80, 80);

    const scale = 2;
    const offsetX = x + 5;
    const offsetY = y + 15; // Lower position for sliding

    // Hair
    ctx.fillStyle = colors.hair;
    this.drawPixelRect(ctx, offsetX + 2*scale, offsetY + 2*scale, 16*scale, 6*scale);

    // Head (turned sideways)
    ctx.fillStyle = colors.skin;
    this.drawPixelRect(ctx, offsetX + 2*scale, offsetY + 8*scale, 14*scale, 10*scale);

    // Eye (only one visible from side)
    ctx.fillStyle = colors.outline;
    this.drawPixelRect(ctx, offsetX + 4*scale, offsetY + 12*scale, 2*scale, 2*scale);

    // Body (horizontal, stretched)
    ctx.fillStyle = colors.hoodie;
    this.drawPixelRect(ctx, offsetX + 16*scale, offsetY + 10*scale, 24*scale, 12*scale);

    // Arm extended forward for balance
    ctx.fillStyle = colors.hoodie;
    this.drawPixelRect(ctx, offsetX + 40*scale, offsetY + 12*scale, 8*scale, 6*scale);

    // Hand
    ctx.fillStyle = colors.skin;
    this.drawPixelRect(ctx, offsetX + 46*scale, offsetY + 14*scale, 4*scale, 4*scale);

    // Backpack (shifted during slide)
    ctx.fillStyle = colors.bag;
    this.drawPixelRect(ctx, offsetX + 18*scale, offsetY + 6*scale, 8*scale, 8*scale);

    // Pants (horizontal)
    ctx.fillStyle = colors.pants;
    this.drawPixelRect(ctx, offsetX + 16*scale, offsetY + 22*scale, 20*scale, 8*scale);

    // Legs extended behind
    this.drawPixelRect(ctx, offsetX + 36*scale, offsetY + 24*scale, 12*scale, 6*scale);

    // Shoes
    ctx.fillStyle = colors.shoes;
    this.drawPixelRect(ctx, offsetX + 46*scale, offsetY + 28*scale, 8*scale, 4*scale);
  }

  private drawSlidingFrame(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, frame: number, colors: any) {
    const scale = 1.5;
    // Lower position for sliding
    const slideY = centerY + 12*scale;

    // Body (horizontal, more stretched)
    ctx.fillStyle = colors.hoodie;
    ctx.fillRect(centerX - 18*scale, slideY - 8*scale, 32*scale, 16*scale);

    // Head (turned sideways)
    ctx.fillStyle = colors.skin;
    ctx.fillRect(centerX - 22*scale, slideY - 16*scale, 14*scale, 12*scale);

    // Hair
    ctx.fillStyle = colors.hair;
    ctx.fillRect(centerX - 22*scale, slideY - 20*scale, 14*scale, 8*scale);

    // Eyes (sideways)
    ctx.fillStyle = '#000000';
    ctx.fillRect(centerX - 18*scale, slideY - 14*scale, 2*scale, 2*scale);

    // Legs (extended behind)
    ctx.fillStyle = colors.pants;
    ctx.fillRect(centerX + 6*scale, slideY + 4*scale, 18*scale, 10*scale);

    // Shoes
    ctx.fillStyle = colors.shoes;
    ctx.fillRect(centerX + 22*scale, slideY + 12*scale, 6*scale, 4*scale);

    // Arms (extended forward for balance)
    ctx.fillStyle = colors.hoodie;
    ctx.fillRect(centerX - 12*scale, slideY - 4*scale, 16*scale, 8*scale);

    // Hands
    ctx.fillStyle = colors.skin;
    ctx.fillRect(centerX + 2*scale, slideY - 2*scale, 4*scale, 4*scale);

    // Bag (shifted during slide)
    ctx.fillStyle = colors.bag;
    ctx.fillRect(centerX + 4*scale, slideY - 12*scale, 8*scale, 10*scale);
  }

  public drawCharacter(
    x: number,
    y: number,
    animation: 'running' | 'jumping' | 'sliding',
    frame: number,
    scale: number = 1
  ) {
    if (!this.spriteData) return;

    const anim = this.animations[animation];
    const frameX = (frame % anim.frames) * anim.frameWidth;
    const frameY = anim.startY;

    // Create temporary canvas for the sprite frame
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = anim.frameWidth;
    tempCanvas.height = anim.frameHeight;
    const tempCtx = tempCanvas.getContext('2d')!;

    // Put the sprite data on temp canvas
    tempCtx.putImageData(
      this.spriteData,
      -frameX,
      -frameY
    );

    // Disable image smoothing for pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;

    // Draw scaled sprite on main canvas
    this.ctx.drawImage(
      tempCanvas,
      0, 0, anim.frameWidth, anim.frameHeight,
      x - (anim.frameWidth * scale) / 2,
      y - (anim.frameHeight * scale) / 2,
      anim.frameWidth * scale,
      anim.frameHeight * scale
    );

    // Re-enable smoothing for other elements
    this.ctx.imageSmoothingEnabled = true;
  }

  public getAnimationSpeed(animation: 'running' | 'jumping' | 'sliding'): number {
    return this.animations[animation].speed;
  }
}
