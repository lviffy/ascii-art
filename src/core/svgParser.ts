/**
 * SVG Parser Module
 * Handles SVG validation, parsing, and rendering to canvas
 */

export interface SVGParseResult {
  success: boolean;
  width: number;
  height: number;
  canvas?: HTMLCanvasElement;
  error?: string;
}

export interface SVGParserOptions {
  maxWidth?: number;
  maxHeight?: number;
  backgroundColor?: string;
}

export class SVGParser {
  private static readonly DEFAULT_MAX_WIDTH = 2000;
  private static readonly DEFAULT_MAX_HEIGHT = 2000;

  /**
   * Validates SVG markup
   */
  static validate(svgMarkup: string): { valid: boolean; error?: string } {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgMarkup, 'image/svg+xml');
      
      // Check for parsing errors
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        return { valid: false, error: 'Invalid SVG markup' };
      }

      // Check if root element is SVG
      const svgElement = doc.querySelector('svg');
      if (!svgElement) {
        return { valid: false, error: 'No SVG element found' };
      }

      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Parse SVG and render to canvas
   */
  static async parseToCanvas(
    svgMarkup: string,
    options: SVGParserOptions = {}
  ): Promise<SVGParseResult> {
    const {
      maxWidth = this.DEFAULT_MAX_WIDTH,
      maxHeight = this.DEFAULT_MAX_HEIGHT,
      backgroundColor = 'transparent'
    } = options;

    // Validate SVG first
    const validation = this.validate(svgMarkup);
    if (!validation.valid) {
      return { success: false, width: 0, height: 0, error: validation.error };
    }

    try {
      // Parse SVG to get dimensions
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgMarkup, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');

      if (!svgElement) {
        return { success: false, width: 0, height: 0, error: 'SVG element not found' };
      }

      // Extract or calculate dimensions
      let width = parseFloat(svgElement.getAttribute('width') || '0');
      let height = parseFloat(svgElement.getAttribute('height') || '0');

      // If width/height not specified, try viewBox
      if (!width || !height) {
        const viewBox = svgElement.getAttribute('viewBox');
        if (viewBox) {
          const [, , vbWidth, vbHeight] = viewBox.split(/\s+/).map(parseFloat);
          width = width || vbWidth;
          height = height || vbHeight;
        }
      }

      // Fallback to default dimensions
      if (!width) width = 300;
      if (!height) height = 150;

      // Scale down if necessary while maintaining aspect ratio
      const aspectRatio = width / height;
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return { success: false, width: 0, height: 0, error: 'Cannot get canvas context' };
      }

      // Set background
      if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      // Convert SVG to data URL and render
      const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      return new Promise((resolve) => {
        const img = new Image();
        
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);
          resolve({ success: true, width, height, canvas });
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve({ 
            success: false, 
            width: 0, 
            height: 0, 
            error: 'Failed to load SVG image' 
          });
        };

        img.src = url;
      });

    } catch (error) {
      return {
        success: false,
        width: 0,
        height: 0,
        error: error instanceof Error ? error.message : 'Unknown parsing error'
      };
    }
  }

  /**
   * Load SVG from file
   */
  static async loadFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsText(file);
    });
  }
}
