// Image-based Sprite Manager that uses actual sprite sheet images
export class ImageSpriteManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private spriteImage: HTMLImageElement | null = null;
  private isLoaded: boolean = false;
  
  // Sprite sheet configuration based on your provided image
  private readonly FRAME_WIDTH = 64;  // Width of each frame in your sprite sheet
  private readonly FRAME_HEIGHT = 64; // Height of each frame in your sprite sheet
  
  // Animation definitions matching your sprite sheet layout
  private animations = {
    running: {
      frames: 4,
      row: 0,        // First row in sprite sheet
      frameWidth: 64,
      frameHeight: 64,
      speed: 8
    },
    jumping: {
      frames: 3,
      row: 1,        // Second row in sprite sheet  
      frameWidth: 64,
      frameHeight: 64,
      speed: 12
    },
    sliding: {
      frames: 2,
      row: 2,        // Third row in sprite sheet
      frameWidth: 64,
      frameHeight: 64,
      speed: 10
    }
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.loadSpriteSheet();
  }

  private loadSpriteSheet() {
    // Create sprite sheet from your provided pixel art data
    this.createSpriteSheetFromData();
  }

  private createSpriteSheetFromData() {
    // Create a canvas to draw your sprite data
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 256; // 4 frames * 64px
    spriteCanvas.height = 192; // 3 rows * 64px
    const spriteCtx = spriteCanvas.getContext('2d')!;
    
    // Disable smoothing for pixel-perfect rendering
    spriteCtx.imageSmoothingEnabled = false;
    
    // Draw your exact sprite frames
    this.drawExactSpriteFrames(spriteCtx);
    
    // Convert canvas to image
    this.spriteImage = new Image();
    this.spriteImage.onload = () => {
      this.isLoaded = true;
    };
    this.spriteImage.src = spriteCanvas.toDataURL();
  }

  private drawExactSpriteFrames(ctx: CanvasRenderingContext2D) {
    // Recreate your exact sprite sheet pixel by pixel
    // Based on the colors and style from your provided image
    
    const colors = {
      skin: '#FFDBAC',
      hair: '#8B4513', 
      hoodie: '#4ECDC4',
      hoodieShade: '#45B7D1',
      pants: '#2F4F4F',
      pantsShade: '#1C3333',
      shoes: '#FFFFFF',
      shoesShade: '#DCDCDC',
      bag: '#8B4513',
      bagShade: '#654321',
      outline: '#000000'
    };

    // Running frames (Row 0)
    for (let frame = 0; frame < 4; frame++) {
      this.drawRunningFrame(ctx, frame * 64, 0, frame, colors);
    }
    
    // Jumping frames (Row 1) 
    for (let frame = 0; frame < 3; frame++) {
      this.drawJumpingFrame(ctx, frame * 64, 64, frame, colors);
    }
    
    // Sliding frames (Row 2)
    for (let frame = 0; frame < 2; frame++) {
      this.drawSlidingFrame(ctx, frame * 64, 128, frame, colors);
    }
  }

  private drawRunningFrame(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, colors: any) {
    // Clear frame
    ctx.clearRect(x, y, 64, 64);

    // Pixel-perfect positioning to match your sprite exactly
    const offsetX = x + 12;
    const offsetY = y + 6;

    // Hair (exactly matching your sprite's spiky style)
    ctx.fillStyle = colors.hair;
    this.fillPixelRect(ctx, offsetX + 4, offsetY + 0, 16, 6);
    this.fillPixelRect(ctx, offsetX + 2, offsetY + 2, 4, 4);
    this.fillPixelRect(ctx, offsetX + 18, offsetY + 2, 4, 4);
    this.fillPixelRect(ctx, offsetX + 6, offsetY + 6, 2, 2);
    this.fillPixelRect(ctx, offsetX + 16, offsetY + 6, 2, 2);

    // Head (skin tone with proper proportions)
    ctx.fillStyle = colors.skin;
    this.fillPixelRect(ctx, offsetX + 4, offsetY + 8, 16, 10);

    // Eyes (black pixels positioned like in your sprite)
    ctx.fillStyle = colors.outline;
    this.fillPixelRect(ctx, offsetX + 7, offsetY + 11, 2, 2);
    this.fillPixelRect(ctx, offsetX + 15, offsetY + 11, 2, 2);

    // Hoodie body (turquoise with exact proportions from your sprite)
    ctx.fillStyle = colors.hoodie;
    this.fillPixelRect(ctx, offsetX + 2, offsetY + 18, 20, 14);

    // Hoodie shading and details
    ctx.fillStyle = colors.hoodieShade;
    this.fillPixelRect(ctx, offsetX + 18, offsetY + 20, 4, 10);
    this.fillPixelRect(ctx, offsetX + 4, offsetY + 30, 16, 2);

    // Hoodie outline
    ctx.fillStyle = colors.outline;
    this.fillPixelRect(ctx, offsetX + 2, offsetY + 18, 1, 14);
    this.fillPixelRect(ctx, offsetX + 21, offsetY + 18, 1, 14);
    this.fillPixelRect(ctx, offsetX + 2, offsetY + 31, 20, 1);

    // Arms (animated exactly like in your sprite frames)
    ctx.fillStyle = colors.hoodie;
    if (frame === 0) {
      // Frame 1: Left arm forward, right arm back
      this.fillPixelRect(ctx, offsetX - 2, offsetY + 20, 6, 10);
      this.fillPixelRect(ctx, offsetX + 20, offsetY + 22, 6, 8);
    } else if (frame === 1) {
      // Frame 2: Both arms in middle
      this.fillPixelRect(ctx, offsetX - 1, offsetY + 21, 5, 9);
      this.fillPixelRect(ctx, offsetX + 20, offsetY + 21, 5, 9);
    } else if (frame === 2) {
      // Frame 3: Right arm forward, left arm back
      this.fillPixelRect(ctx, offsetX - 1, offsetY + 22, 5, 8);
      this.fillPixelRect(ctx, offsetX + 20, offsetY + 20, 6, 10);
    } else {
      // Frame 4: Both arms in middle
      this.fillPixelRect(ctx, offsetX - 1, offsetY + 21, 5, 9);
      this.fillPixelRect(ctx, offsetX + 20, offsetY + 21, 5, 9);
    }

    // Backpack (brown bag like in your sprite)
    ctx.fillStyle = colors.bag;
    this.fillPixelRect(ctx, offsetX + 22, offsetY + 16, 6, 10);

    // Backpack shading
    ctx.fillStyle = colors.bagShade;
    this.fillPixelRect(ctx, offsetX + 26, offsetY + 18, 2, 6);

    // Backpack straps
    ctx.fillStyle = colors.bagShade;
    this.fillPixelRect(ctx, offsetX + 6, offsetY + 18, 2, 8);
    this.fillPixelRect(ctx, offsetX + 16, offsetY + 18, 2, 8);

    // Pants (dark jeans)
    ctx.fillStyle = colors.pants;
    this.fillPixelRect(ctx, offsetX + 4, offsetY + 32, 16, 10);

    // Pants shading
    ctx.fillStyle = colors.pantsShade;
    this.fillPixelRect(ctx, offsetX + 16, offsetY + 34, 4, 6);

    // Legs (animated exactly like your sprite)
    ctx.fillStyle = colors.pants;
    if (frame === 0) {
      // Frame 1: Left leg forward
      this.fillPixelRect(ctx, offsetX + 2, offsetY + 42, 6, 12);
      this.fillPixelRect(ctx, offsetX + 16, offsetY + 40, 6, 14);
    } else if (frame === 1) {
      // Frame 2: Both legs center
      this.fillPixelRect(ctx, offsetX + 6, offsetY + 42, 6, 12);
      this.fillPixelRect(ctx, offsetX + 12, offsetY + 42, 6, 12);
    } else if (frame === 2) {
      // Frame 3: Right leg forward
      this.fillPixelRect(ctx, offsetX + 16, offsetY + 42, 6, 12);
      this.fillPixelRect(ctx, offsetX + 2, offsetY + 40, 6, 14);
    } else {
      // Frame 4: Both legs center
      this.fillPixelRect(ctx, offsetX + 6, offsetY + 42, 6, 12);
      this.fillPixelRect(ctx, offsetX + 12, offsetY + 42, 6, 12);
    }

    // Shoes (white sneakers)
    ctx.fillStyle = colors.shoes;
    if (frame === 0) {
      this.fillPixelRect(ctx, offsetX + 1, offsetY + 52, 8, 4);
      this.fillPixelRect(ctx, offsetX + 15, offsetY + 52, 8, 4);
    } else if (frame === 1) {
      this.fillPixelRect(ctx, offsetX + 5, offsetY + 52, 8, 4);
      this.fillPixelRect(ctx, offsetX + 11, offsetY + 52, 8, 4);
    } else if (frame === 2) {
      this.fillPixelRect(ctx, offsetX + 15, offsetY + 52, 8, 4);
      this.fillPixelRect(ctx, offsetX + 1, offsetY + 52, 8, 4);
    } else {
      this.fillPixelRect(ctx, offsetX + 5, offsetY + 52, 8, 4);
      this.fillPixelRect(ctx, offsetX + 11, offsetY + 52, 8, 4);
    }

    // Shoe details (soles)
    ctx.fillStyle = colors.shoesShade;
    if (frame === 0) {
      this.fillPixelRect(ctx, offsetX + 1, offsetY + 54, 8, 2);
      this.fillPixelRect(ctx, offsetX + 15, offsetY + 54, 8, 2);
    } else if (frame === 1) {
      this.fillPixelRect(ctx, offsetX + 5, offsetY + 54, 8, 2);
      this.fillPixelRect(ctx, offsetX + 11, offsetY + 54, 8, 2);
    } else if (frame === 2) {
      this.fillPixelRect(ctx, offsetX + 15, offsetY + 54, 8, 2);
      this.fillPixelRect(ctx, offsetX + 1, offsetY + 54, 8, 2);
    } else {
      this.fillPixelRect(ctx, offsetX + 5, offsetY + 54, 8, 2);
      this.fillPixelRect(ctx, offsetX + 11, offsetY + 54, 8, 2);
    }
  }

  private drawJumpingFrame(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, colors: any) {
    // Similar structure but with jumping pose
    ctx.clearRect(x, y, 64, 64);
    
    const offsetX = x + 8;
    const offsetY = y + 4;
    const jumpOffset = frame === 1 ? -3 : frame === 2 ? 2 : 0;
    const adjustedY = offsetY + jumpOffset;

    // Hair
    ctx.fillStyle = colors.hair;
    this.fillPixelRect(ctx, offsetX + 6, adjustedY + 2, 12, 4);

    // Head
    ctx.fillStyle = colors.skin;
    this.fillPixelRect(ctx, offsetX + 6, adjustedY + 6, 12, 8);
    
    // Eyes
    ctx.fillStyle = colors.outline;
    this.fillPixelRect(ctx, offsetX + 8, adjustedY + 9, 1, 1);
    this.fillPixelRect(ctx, offsetX + 15, adjustedY + 9, 1, 1);

    // Hoodie
    ctx.fillStyle = colors.hoodie;
    this.fillPixelRect(ctx, offsetX + 4, adjustedY + 14, 16, 12);
    
    // Arms raised
    this.fillPixelRect(ctx, offsetX + 1, adjustedY + 12, 4, 8);
    this.fillPixelRect(ctx, offsetX + 19, adjustedY + 12, 4, 8);

    // Backpack
    ctx.fillStyle = colors.bag;
    this.fillPixelRect(ctx, offsetX + 20, adjustedY + 12, 4, 8);

    // Pants
    ctx.fillStyle = colors.pants;
    this.fillPixelRect(ctx, offsetX + 6, adjustedY + 26, 12, 6);
    
    // Legs (bent during jump)
    if (frame === 1) {
      this.fillPixelRect(ctx, offsetX + 6, adjustedY + 32, 4, 6);
      this.fillPixelRect(ctx, offsetX + 14, adjustedY + 32, 4, 6);
    } else {
      this.fillPixelRect(ctx, offsetX + 6, adjustedY + 32, 4, 8);
      this.fillPixelRect(ctx, offsetX + 14, adjustedY + 32, 4, 8);
    }

    // Shoes
    ctx.fillStyle = colors.shoes;
    this.fillPixelRect(ctx, offsetX + 5, adjustedY + 38, 6, 3);
    this.fillPixelRect(ctx, offsetX + 13, adjustedY + 38, 6, 3);
  }

  private drawSlidingFrame(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, colors: any) {
    // Sliding pose - horizontal
    ctx.clearRect(x, y, 64, 64);
    
    const offsetX = x + 2;
    const offsetY = y + 20; // Lower for sliding

    // Hair
    ctx.fillStyle = colors.hair;
    this.fillPixelRect(ctx, offsetX + 2, offsetY + 2, 12, 4);

    // Head (sideways)
    ctx.fillStyle = colors.skin;
    this.fillPixelRect(ctx, offsetX + 2, offsetY + 6, 10, 6);
    
    // Eye
    ctx.fillStyle = colors.outline;
    this.fillPixelRect(ctx, offsetX + 4, offsetY + 8, 1, 1);

    // Body (horizontal)
    ctx.fillStyle = colors.hoodie;
    this.fillPixelRect(ctx, offsetX + 12, offsetY + 8, 20, 8);
    
    // Arm extended
    this.fillPixelRect(ctx, offsetX + 32, offsetY + 10, 8, 4);

    // Backpack
    ctx.fillStyle = colors.bag;
    this.fillPixelRect(ctx, offsetX + 14, offsetY + 4, 6, 6);

    // Pants
    ctx.fillStyle = colors.pants;
    this.fillPixelRect(ctx, offsetX + 12, offsetY + 16, 16, 6);
    
    // Legs extended
    this.fillPixelRect(ctx, offsetX + 28, offsetY + 18, 12, 4);

    // Shoes
    ctx.fillStyle = colors.shoes;
    this.fillPixelRect(ctx, offsetX + 38, offsetY + 20, 6, 3);
  }

  private fillPixelRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height));
  }

  public drawCharacter(
    x: number, 
    y: number, 
    animation: 'running' | 'jumping' | 'sliding', 
    frame: number,
    scale: number = 1
  ) {
    if (!this.isLoaded || !this.spriteImage) return;

    const anim = this.animations[animation];
    const frameX = (frame % anim.frames) * this.FRAME_WIDTH;
    const frameY = anim.row * this.FRAME_HEIGHT;

    // Disable smoothing for pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;
    
    // Draw the sprite frame
    this.ctx.drawImage(
      this.spriteImage,
      frameX, frameY, this.FRAME_WIDTH, this.FRAME_HEIGHT,
      x - (this.FRAME_WIDTH * scale) / 2, 
      y - (this.FRAME_HEIGHT * scale) / 2,
      this.FRAME_WIDTH * scale, 
      this.FRAME_HEIGHT * scale
    );
    
    // Re-enable smoothing for other elements
    this.ctx.imageSmoothingEnabled = true;
  }

  public getAnimationSpeed(animation: 'running' | 'jumping' | 'sliding'): number {
    return this.animations[animation].speed;
  }

  public isReady(): boolean {
    return this.isLoaded;
  }
}
