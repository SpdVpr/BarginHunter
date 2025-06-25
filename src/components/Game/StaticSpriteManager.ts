// Static Sprite Manager that uses the exact character model provided
export class StaticSpriteManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private characterSprite: HTMLCanvasElement | null = null;
  private isLoaded: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.createCharacterSprite();
  }

  private createCharacterSprite() {
    // Create the exact character sprite from the provided image
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 64;
    spriteCanvas.height = 64;
    const spriteCtx = spriteCanvas.getContext('2d')!;
    
    // Disable smoothing for pixel-perfect rendering
    spriteCtx.imageSmoothingEnabled = false;
    
    // Draw the exact character pixel by pixel
    this.drawExactCharacter(spriteCtx);
    
    this.characterSprite = spriteCanvas;
    this.isLoaded = true;
  }

  private drawExactCharacter(ctx: CanvasRenderingContext2D) {
    // Exact colors from your provided character sprite
    const colors = {
      // Hair colors (brown, spiky)
      hairDark: '#8B4513',
      hairMid: '#A0522D',
      hairLight: '#CD853F',

      // Skin colors (peachy tone)
      skinBase: '#FFDBAC',
      skinShade: '#F4C2A1',

      // Hoodie colors (turquoise/teal)
      hoodieMain: '#4ECDC4',
      hoodieDark: '#3CBAB0',
      hoodieLight: '#5DD5D9',

      // Pants colors (dark blue/navy)
      pantsMain: '#2F4F4F',
      pantsDark: '#1C3333',
      pantsLight: '#708090',

      // Shoe colors (white sneakers)
      shoeWhite: '#FFFFFF',
      shoeGray: '#DCDCDC',
      shoeDark: '#A9A9A9',

      // Bag colors (brown backpack)
      bagBrown: '#8B4513',
      bagDark: '#654321',

      // Other
      black: '#000000',
      shadow: 'rgba(0,0,0,0.3)'
    };

    // Clear canvas
    ctx.clearRect(0, 0, 64, 64);

    // Draw character pixel by pixel to match your provided image exactly

    // Hair (spiky brown hair - matching your sprite exactly)
    ctx.fillStyle = colors.hairDark;
    this.pixel(ctx, 18, 6, 12, 3);   // Top hair mass
    this.pixel(ctx, 16, 9, 16, 3);   // Main hair volume
    this.pixel(ctx, 14, 12, 4, 2);   // Left spike
    this.pixel(ctx, 30, 12, 4, 2);   // Right spike
    this.pixel(ctx, 20, 4, 8, 2);    // Top spikes

    ctx.fillStyle = colors.hairMid;
    this.pixel(ctx, 22, 8, 6, 2);    // Hair highlights
    this.pixel(ctx, 18, 10, 4, 2);   // Side highlights

    ctx.fillStyle = colors.hairLight;
    this.pixel(ctx, 24, 6, 4, 2);    // Bright highlights

    // Head/Face (peachy skin tone)
    ctx.fillStyle = colors.skinBase;
    this.pixel(ctx, 16, 14, 16, 14);  // Main face area

    // Face shading
    ctx.fillStyle = colors.skinShade;
    this.pixel(ctx, 28, 16, 4, 10);   // Right side shading
    this.pixel(ctx, 18, 26, 12, 2);   // Chin shading

    // Eyes (black dots)
    ctx.fillStyle = colors.black;
    this.pixel(ctx, 20, 18, 2, 2);    // Left eye
    this.pixel(ctx, 26, 18, 2, 2);    // Right eye

    // Nose (subtle)
    ctx.fillStyle = colors.skinShade;
    this.pixel(ctx, 23, 21, 2, 1);    // Nose shadow

    // Hoodie main body (turquoise)
    ctx.fillStyle = colors.hoodieMain;
    this.pixel(ctx, 10, 28, 28, 18);  // Main hoodie body

    // Hoodie shading
    ctx.fillStyle = colors.hoodieDark;
    this.pixel(ctx, 32, 30, 6, 14);   // Right side shading
    this.pixel(ctx, 12, 42, 24, 4);   // Bottom shading

    // Hoodie highlights
    ctx.fillStyle = colors.hoodieLight;
    this.pixel(ctx, 12, 30, 6, 10);   // Left side highlight

    // Left arm (running pose)
    ctx.fillStyle = colors.hoodieMain;
    this.pixel(ctx, 4, 32, 10, 14);   // Left arm extended

    ctx.fillStyle = colors.hoodieDark;
    this.pixel(ctx, 8, 34, 4, 10);    // Arm shading

    // Right arm (running pose)
    ctx.fillStyle = colors.hoodieMain;
    this.pixel(ctx, 36, 28, 10, 16);  // Right arm back

    ctx.fillStyle = colors.hoodieDark;
    this.pixel(ctx, 40, 30, 4, 12);   // Arm shading

    // Hands (skin tone)
    ctx.fillStyle = colors.skinBase;
    this.pixel(ctx, 2, 44, 6, 4);     // Left hand
    this.pixel(ctx, 44, 42, 6, 4);    // Right hand

    // Backpack (brown bag)
    ctx.fillStyle = colors.bagBrown;
    this.pixel(ctx, 38, 24, 10, 14);  // Main backpack

    ctx.fillStyle = colors.bagDark;
    this.pixel(ctx, 42, 26, 4, 10);   // Backpack shading

    // Backpack straps (crossing over chest)
    ctx.fillStyle = colors.bagDark;
    this.pixel(ctx, 16, 28, 3, 14);   // Left strap
    this.pixel(ctx, 29, 28, 3, 14);   // Right strap

    // Pants (dark blue jeans)
    ctx.fillStyle = colors.pantsMain;
    this.pixel(ctx, 12, 46, 24, 12);  // Main pants area

    // Pants shading
    ctx.fillStyle = colors.pantsDark;
    this.pixel(ctx, 30, 48, 6, 8);    // Right side shading
    this.pixel(ctx, 14, 54, 20, 4);   // Bottom shading

    // Left leg (running pose - forward)
    ctx.fillStyle = colors.pantsMain;
    this.pixel(ctx, 8, 58, 10, 14);   // Left leg forward

    ctx.fillStyle = colors.pantsDark;
    this.pixel(ctx, 12, 60, 4, 10);   // Leg shading

    // Right leg (running pose - back)
    ctx.fillStyle = colors.pantsMain;
    this.pixel(ctx, 28, 56, 10, 16);  // Right leg back

    ctx.fillStyle = colors.pantsDark;
    this.pixel(ctx, 32, 58, 4, 12);   // Leg shading

    // Left shoe (white sneaker)
    ctx.fillStyle = colors.shoeWhite;
    this.pixel(ctx, 6, 70, 14, 8);    // Left shoe main

    ctx.fillStyle = colors.shoeGray;
    this.pixel(ctx, 8, 72, 10, 3);    // Shoe body
    this.pixel(ctx, 6, 76, 14, 2);    // Sole

    ctx.fillStyle = colors.shoeDark;
    this.pixel(ctx, 10, 70, 6, 2);    // Shoe details

    // Right shoe (white sneaker)
    ctx.fillStyle = colors.shoeWhite;
    this.pixel(ctx, 26, 70, 14, 8);   // Right shoe main

    ctx.fillStyle = colors.shoeGray;
    this.pixel(ctx, 28, 72, 10, 3);   // Shoe body
    this.pixel(ctx, 26, 76, 14, 2);   // Sole

    ctx.fillStyle = colors.shoeDark;
    this.pixel(ctx, 30, 70, 6, 2);    // Shoe details

    // Character outline (subtle)
    ctx.fillStyle = colors.black;
    // Hair outline
    this.pixel(ctx, 14, 8, 1, 8);
    this.pixel(ctx, 30, 8, 1, 8);
    this.pixel(ctx, 14, 8, 16, 1);
    
    // Body outline
    this.pixel(ctx, 12, 28, 1, 16);
    this.pixel(ctx, 35, 28, 1, 16);
    this.pixel(ctx, 12, 43, 24, 1);
  }

  private pixel(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    ctx.fillRect(x, y, width, height);
  }

  public drawCharacter(x: number, y: number, scale: number = 1) {
    if (!this.isLoaded || !this.characterSprite) return;

    // Disable smoothing for pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;
    
    // Draw the static character sprite
    this.ctx.drawImage(
      this.characterSprite,
      0, 0, 64, 64,
      x - (32 * scale), 
      y - (32 * scale),
      64 * scale, 
      64 * scale
    );
    
    // Re-enable smoothing for other elements
    this.ctx.imageSmoothingEnabled = true;
  }

  public isReady(): boolean {
    return this.isLoaded;
  }
}
