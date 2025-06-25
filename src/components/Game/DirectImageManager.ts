// Direct Image Manager - loads and displays your exact PNG file
export class DirectImageManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private characterImage: HTMLImageElement | null = null;
  private isLoaded: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.loadCharacterImage();
  }

  private loadCharacterImage() {
    this.characterImage = new Image();
    
    this.characterImage.onload = () => {
      console.log('Character image loaded successfully!');
      console.log('Image dimensions:', this.characterImage!.width, 'x', this.characterImage!.height);
      this.isLoaded = true;
    };
    
    this.characterImage.onerror = (error) => {
      console.error('Failed to load character image:', error);
    };
    
    // Load your exact PNG file
    this.characterImage.src = '/sprites/character.png';
  }

  public drawCharacter(x: number, y: number, scale: number = 1) {
    if (!this.isLoaded || !this.characterImage) {
      return;
    }

    // Disable smoothing for pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;
    
    // Get the actual image dimensions
    const imageWidth = this.characterImage.width;
    const imageHeight = this.characterImage.height;
    
    // Calculate scaled dimensions
    const scaledWidth = imageWidth * scale;
    const scaledHeight = imageHeight * scale;
    
    // Draw your exact image without any modifications
    this.ctx.drawImage(
      this.characterImage,
      x - scaledWidth / 2,   // Center horizontally
      y - scaledHeight / 2,  // Center vertically
      scaledWidth,
      scaledHeight
    );
    
    // Re-enable smoothing for other elements
    this.ctx.imageSmoothingEnabled = true;
  }

  public isReady(): boolean {
    return this.isLoaded;
  }

  public getImageDimensions(): { width: number; height: number } | null {
    if (!this.characterImage) return null;
    return {
      width: this.characterImage.width,
      height: this.characterImage.height
    };
  }
}
