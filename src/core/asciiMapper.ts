/**
 * ASCII Mapper Module
 * Converts pixel data to ASCII characters based on luminance
 */

export interface ASCIIMapperOptions {
  width?: number;
  height?: number;
  characterSet?: string;
  invert?: boolean;
  maintainAspectRatio?: boolean;
  contrast?: number; // 0-2, default 1.0
  edgeEnhance?: boolean; // Enable edge detection enhancement
}

export interface ASCIIResult {
  ascii: string;
  width: number;
  height: number;
}

export class ASCIIMapper {
  // Character sets ordered from darkest to lightest
  static readonly CHARSET_DETAILED = '@%#*+=-:. ';
  static readonly CHARSET_STANDARD = '@&#*+=-. ';
  static readonly CHARSET_SIMPLE = '@#*-. ';
  static readonly CHARSET_BLOCKS = '█▓▒░ ';
  static readonly CHARSET_MINIMAL = '█░ ';
  static readonly CHARSET_BINARY = '01 ';
  static readonly CHARSET_NUMBERS = '9876543210 ';
  static readonly CHARSET_LETTERS = 'MWNXK0Oahkbdpqwmzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,"^`\'. ';
  static readonly CHARSET_CUSTOM = ''; // Will be set by user

  private static readonly CHAR_ASPECT_RATIO = 0.55; // Most monospace fonts (adjusted for better proportions)

  /**
   * Convert canvas to ASCII art
   */
  static canvasToASCII(
    canvas: HTMLCanvasElement,
    options: ASCIIMapperOptions = {}
  ): ASCIIResult {
    const {
      width = 80,
      height,
      characterSet = this.CHARSET_STANDARD,
      invert = false,
      maintainAspectRatio = true,
      contrast = 1.0,
      edgeEnhance = false
    } = options;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }

    // Calculate dimensions maintaining aspect ratio
    let targetWidth = width;
    let targetHeight = height;

    if (maintainAspectRatio) {
      const canvasAspect = canvas.width / canvas.height;
      
      if (targetHeight === undefined) {
        // Calculate height from width, accounting for character aspect ratio
        // Each character is roughly twice as tall as it is wide
        targetHeight = Math.floor((targetWidth * canvas.height) / (canvas.width * 2));
      } else if (targetWidth === undefined) {
        // Calculate width from height
        targetWidth = Math.floor((targetHeight * canvas.width * 2) / canvas.height);
      }
    }

    // Ensure we have valid dimensions
    if (!targetHeight) {
      targetHeight = Math.floor(targetWidth * 0.5);
    }

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Calculate step sizes for area sampling
    const stepX = canvas.width / targetWidth;
    const stepY = canvas.height / targetHeight;

    // First pass: Calculate all luminance values
    const luminanceMap = new Float32Array(targetWidth * targetHeight);

    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        // Area averaging: sample multiple pixels in the region for smoother output
        const startX = Math.floor(x * stepX);
        const startY = Math.floor(y * stepY);
        const endX = Math.min(Math.floor((x + 1) * stepX), canvas.width);
        const endY = Math.min(Math.floor((y + 1) * stepY), canvas.height);
        
        let totalR = 0, totalG = 0, totalB = 0, totalA = 0;
        let sampleCount = 0;
        
        // Sample all pixels in the area
        for (let py = startY; py < endY; py++) {
          for (let px = startX; px < endX; px++) {
            const pixelIndex = (py * canvas.width + px) * 4;
            totalR += pixels[pixelIndex];
            totalG += pixels[pixelIndex + 1];
            totalB += pixels[pixelIndex + 2];
            totalA += pixels[pixelIndex + 3];
            sampleCount++;
          }
        }
        
        // Average the samples
        const r = sampleCount > 0 ? totalR / sampleCount : 255;
        const g = sampleCount > 0 ? totalG / sampleCount : 255;
        const b = sampleCount > 0 ? totalB / sampleCount : 255;
        const a = sampleCount > 0 ? (totalA / sampleCount) / 255 : 1;

        // Calculate luminance (weighted RGB)
        // L = 0.299R + 0.587G + 0.114B
        let luminance = (0.299 * r + 0.587 * g + 0.114 * b) * a;

        // Handle transparency (treat as white background)
        if (a < 1) {
          luminance = luminance + (255 * (1 - a));
        }

        // Normalize to 0-1
        luminance = luminance / 255;

        // Apply contrast adjustment (centered at 0.5)
        if (contrast !== 1.0) {
          luminance = (luminance - 0.5) * contrast + 0.5;
          luminance = Math.max(0, Math.min(1, luminance));
        }

        // Invert if requested
        if (invert) {
          luminance = 1 - luminance;
        }

        // Store luminance for edge detection (will be used in second pass)
        luminanceMap[y * targetWidth + x] = luminance;
      }
    }

    // Second pass: Apply edge enhancement if enabled
    let ascii = '';
    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        let luminance = luminanceMap[y * targetWidth + x];
        
        // Edge enhancement using Sobel-like operator
        if (edgeEnhance && x > 0 && x < targetWidth - 1 && y > 0 && y < targetHeight - 1) {
          const idx = y * targetWidth + x;
          const gx = 
            -luminanceMap[idx - targetWidth - 1] + luminanceMap[idx - targetWidth + 1]
            -2 * luminanceMap[idx - 1] + 2 * luminanceMap[idx + 1]
            -luminanceMap[idx + targetWidth - 1] + luminanceMap[idx + targetWidth + 1];
          const gy = 
            -luminanceMap[idx - targetWidth - 1] - 2 * luminanceMap[idx - targetWidth] - luminanceMap[idx - targetWidth + 1]
            +luminanceMap[idx + targetWidth - 1] + 2 * luminanceMap[idx + targetWidth] + luminanceMap[idx + targetWidth + 1];
          
          const edgeMagnitude = Math.sqrt(gx * gx + gy * gy);
          // Blend edge detection with original luminance
          luminance = Math.max(0, Math.min(1, luminance - edgeMagnitude * 0.5));
        }

        // Map to character
        const char = this.luminanceToChar(luminance, characterSet);
        ascii += char;
      }
      ascii += '\n';
    }

    return {
      ascii,
      width: targetWidth,
      height: targetHeight
    };
  }

  /**
   * Map luminance value (0-1) to character
   */
  private static luminanceToChar(luminance: number, characterSet: string): string {
    const index = Math.floor(luminance * (characterSet.length - 1));
    return characterSet[Math.min(index, characterSet.length - 1)];
  }

  /**
   * Convert SVG directly to ASCII (convenience method)
   */
  static async svgToASCII(
    svgMarkup: string,
    options: ASCIIMapperOptions = {}
  ): Promise<ASCIIResult> {
    // This would require importing SVGParser, which creates circular dependency
    // Better to handle this at the application level
    throw new Error('Use SVGParser.parseToCanvas() then ASCIIMapper.canvasToASCII()');
  }

  /**
   * Calculate optimal dimensions for ASCII art
   */
  static calculateDimensions(
    sourceWidth: number,
    sourceHeight: number,
    targetWidth?: number,
    targetHeight?: number
  ): { width: number; height: number } {
    const aspectRatio = sourceWidth / sourceHeight;

    if (targetWidth && !targetHeight) {
      return {
        width: targetWidth,
        height: Math.floor((targetWidth * sourceHeight) / (sourceWidth * 2))
      };
    }

    if (targetHeight && !targetWidth) {
      return {
        width: Math.floor((targetHeight * sourceWidth * 2) / sourceHeight),
        height: targetHeight
      };
    }

    if (targetWidth && targetHeight) {
      return { width: targetWidth, height: targetHeight };
    }

    // Default to 80 width
    return {
      width: 80,
      height: Math.floor((80 * sourceHeight) / (sourceWidth * 2))
    };
  }

  /**
   * Get all available character sets
   */
  static getCharacterSets(): Record<string, string> {
    return {
      detailed: this.CHARSET_DETAILED,
      standard: this.CHARSET_STANDARD,
      simple: this.CHARSET_SIMPLE,
      blocks: this.CHARSET_BLOCKS,
      minimal: this.CHARSET_MINIMAL,
      binary: this.CHARSET_BINARY,
      numbers: this.CHARSET_NUMBERS,
      letters: this.CHARSET_LETTERS,
      custom: this.CHARSET_CUSTOM
    };
  }
}
