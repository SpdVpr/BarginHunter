// Pixel Art Character Manager with precise hitboxes
export class PixelArtCharacter {
  private ctx: CanvasRenderingContext2D;
  private characterCanvas: HTMLCanvasElement;
  private characterCtx: CanvasRenderingContext2D;
  private isLoaded: boolean = false;

  // Character dimensions - optimized for precise collision
  public readonly WIDTH = 32;
  public readonly HEIGHT = 48;
  
  // Precise hitbox (smaller than visual sprite for better gameplay)
  public readonly HITBOX_WIDTH = 24;
  public readonly HITBOX_HEIGHT = 40;
  public readonly HITBOX_OFFSET_X = 4; // Center the hitbox
  public readonly HITBOX_OFFSET_Y = 4; // Offset from top

  // Animation states
  private animationFrame = 0;
  private lastAnimationTime = 0;
  private readonly ANIMATION_SPEED = 150; // ms per frame

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.characterCanvas = document.createElement('canvas');
    this.characterCanvas.width = this.WIDTH;
    this.characterCanvas.height = this.HEIGHT;
    this.characterCtx = this.characterCanvas.getContext('2d')!;
    this.createCharacter();
  }

  private createCharacter() {
    // Disable smoothing for pixel-perfect rendering
    this.characterCtx.imageSmoothingEnabled = false;
    
    // Clear canvas
    this.characterCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
    
    // Draw pixel art character
    this.drawPixelCharacter();
    
    this.isLoaded = true;
  }

  private drawPixelCharacter() {
    const ctx = this.characterCtx;
    
    // Enhanced color palette - more vibrant and detailed
    const colors = {
      skin: '#FFDBAC',
      skinShade: '#E6C4A0',
      hair: '#8B4513',
      hairShade: '#654321',
      hoodie: '#4ECDC4',
      hoodieShade: '#3BA99C',
      hoodieHighlight: '#5FE5D8',
      pants: '#2F4F4F',
      pantsShade: '#1C3333',
      shoes: '#FFFFFF',
      shoesShade: '#DCDCDC',
      shoesHighlight: '#F0F0F0',
      outline: '#000000',
      eyes: '#000000',
      eyeHighlight: '#333333',
      accent: '#FF6B6B'
    };

    // Head (8x8 pixels) - more detailed
    this.drawPixelRect(ctx, 12, 4, 8, 8, colors.skin);
    this.drawPixelRect(ctx, 12, 4, 8, 2, colors.hair); // Hair top
    this.drawPixelRect(ctx, 12, 6, 8, 1, colors.hairShade); // Hair shadow
    this.drawPixelRect(ctx, 19, 4, 1, 4, colors.hairShade); // Hair side

    // Eyes (more detailed)
    this.drawPixel(ctx, 14, 7, colors.eyes);
    this.drawPixel(ctx, 17, 7, colors.eyes);
    this.drawPixel(ctx, 14, 8, colors.eyeHighlight); // Eye reflection
    this.drawPixel(ctx, 17, 8, colors.eyeHighlight);

    // Nose and mouth
    this.drawPixel(ctx, 15, 9, colors.skinShade);
    this.drawPixel(ctx, 15, 10, colors.outline); // Small mouth

    // Body - Enhanced Hoodie (12x16 pixels)
    this.drawPixelRect(ctx, 10, 12, 12, 16, colors.hoodie);
    this.drawPixelRect(ctx, 10, 12, 12, 2, colors.hoodieShade); // Hood shadow
    this.drawPixelRect(ctx, 10, 26, 12, 2, colors.hoodieShade); // Bottom shade
    this.drawPixelRect(ctx, 11, 13, 10, 1, colors.hoodieHighlight); // Highlight

    // Hoodie details - zipper and pockets
    this.drawPixelRect(ctx, 15, 14, 2, 12, colors.hoodieShade); // Zipper
    this.drawPixel(ctx, 16, 15, colors.accent); // Zipper pull
    this.drawPixelRect(ctx, 12, 20, 3, 3, colors.hoodieShade); // Left pocket
    this.drawPixelRect(ctx, 17, 20, 3, 3, colors.hoodieShade); // Right pocket
    
    // Arms (4x12 pixels each) - more detailed
    this.drawPixelRect(ctx, 6, 14, 4, 12, colors.hoodie);
    this.drawPixelRect(ctx, 22, 14, 4, 12, colors.hoodie);
    this.drawPixelRect(ctx, 6, 14, 1, 12, colors.hoodieShade); // Arm shadow
    this.drawPixelRect(ctx, 25, 14, 1, 12, colors.hoodieShade);

    // Hands (2x3 pixels each) - more detailed
    this.drawPixelRect(ctx, 7, 24, 2, 3, colors.skin);
    this.drawPixelRect(ctx, 23, 24, 2, 3, colors.skin);
    this.drawPixel(ctx, 7, 26, colors.skinShade); // Hand shadow
    this.drawPixel(ctx, 24, 26, colors.skinShade);

    // Pants (10x12 pixels) - more detailed
    this.drawPixelRect(ctx, 11, 28, 10, 12, colors.pants);
    this.drawPixelRect(ctx, 11, 28, 10, 2, colors.pantsShade); // Top shade
    this.drawPixelRect(ctx, 11, 38, 10, 2, colors.pantsShade); // Bottom shade
    this.drawPixelRect(ctx, 15, 30, 2, 8, colors.pantsShade); // Center seam

    // Legs (4x8 pixels each) - more detailed
    this.drawPixelRect(ctx, 12, 32, 3, 8, colors.pants);
    this.drawPixelRect(ctx, 17, 32, 3, 8, colors.pants);
    this.drawPixelRect(ctx, 12, 32, 1, 8, colors.pantsShade); // Leg shadows
    this.drawPixelRect(ctx, 19, 32, 1, 8, colors.pantsShade);

    // Shoes (5x4 pixels each) - more detailed
    this.drawPixelRect(ctx, 11, 40, 5, 4, colors.shoes);
    this.drawPixelRect(ctx, 16, 40, 5, 4, colors.shoes);
    this.drawPixelRect(ctx, 11, 43, 5, 1, colors.shoesShade); // Shoe shade
    this.drawPixelRect(ctx, 16, 43, 5, 1, colors.shoesShade);
    this.drawPixelRect(ctx, 11, 40, 5, 1, colors.shoesHighlight); // Shoe highlight
    this.drawPixelRect(ctx, 16, 40, 5, 1, colors.shoesHighlight);

    // Shoe laces
    this.drawPixel(ctx, 13, 41, colors.outline);
    this.drawPixel(ctx, 18, 41, colors.outline);
    
    // Outline (optional - for better visibility)
    this.drawOutline(ctx, colors.outline);
  }

  private drawPixelRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  }

  private drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  }

  private drawOutline(ctx: CanvasRenderingContext2D, color: string) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    
    // Head outline
    ctx.strokeRect(12, 4, 8, 8);
    
    // Body outline
    ctx.strokeRect(10, 12, 12, 16);
    
    // Arms outline
    ctx.strokeRect(6, 14, 4, 12);
    ctx.strokeRect(22, 14, 4, 12);
    
    // Pants outline
    ctx.strokeRect(11, 28, 10, 12);
    
    // Legs outline
    ctx.strokeRect(12, 32, 3, 8);
    ctx.strokeRect(17, 32, 3, 8);
    
    // Shoes outline
    ctx.strokeRect(11, 40, 5, 4);
    ctx.strokeRect(16, 40, 5, 4);
  }

  public drawCharacter(x: number, y: number, scale: number = 1, isJumping: boolean = false) {
    if (!this.isLoaded) return;

    // Disable smoothing for pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;
    
    // Add slight animation for running
    const now = Date.now();
    if (now - this.lastAnimationTime > this.ANIMATION_SPEED) {
      this.animationFrame = (this.animationFrame + 1) % 4;
      this.lastAnimationTime = now;
    }
    
    // Calculate position (centered)
    const drawX = x - (this.WIDTH * scale) / 2;
    const drawY = y - (this.HEIGHT * scale) / 2;
    
    // Add slight bobbing animation for running
    let bobOffset = 0;
    if (!isJumping) {
      bobOffset = Math.sin(this.animationFrame * Math.PI / 2) * 2 * scale;
    }
    
    // Draw the character
    this.ctx.drawImage(
      this.characterCanvas,
      0, 0, this.WIDTH, this.HEIGHT,
      drawX, 
      drawY + bobOffset,
      this.WIDTH * scale, 
      this.HEIGHT * scale
    );
    
    // Re-enable smoothing for other elements
    this.ctx.imageSmoothingEnabled = true;
  }

  public getHitbox(x: number, y: number, scale: number = 1) {
    return {
      x: x - (this.HITBOX_WIDTH * scale) / 2 + (this.HITBOX_OFFSET_X * scale),
      y: y - (this.HITBOX_HEIGHT * scale) / 2 + (this.HITBOX_OFFSET_Y * scale),
      width: this.HITBOX_WIDTH * scale,
      height: this.HITBOX_HEIGHT * scale
    };
  }

  public drawHitbox(x: number, y: number, scale: number = 1) {
    // Debug function to visualize hitbox
    const hitbox = this.getHitbox(x, y, scale);
    
    this.ctx.strokeStyle = '#FF0000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
  }

  public isReady(): boolean {
    return this.isLoaded;
  }

  public getCharacterDimensions() {
    return {
      width: this.WIDTH,
      height: this.HEIGHT,
      hitboxWidth: this.HITBOX_WIDTH,
      hitboxHeight: this.HITBOX_HEIGHT
    };
  }
}
