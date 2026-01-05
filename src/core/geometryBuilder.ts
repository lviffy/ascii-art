/**
 * Geometry Builder Module
 * Converts SVG paths to 3D geometry with ASCII texture/material
 */

import * as THREE from 'three';

export interface GeometryBuilderOptions {
  depth?: number;
  segments?: number;
  bevelEnabled?: boolean;
  bevelThickness?: number;
  bevelSize?: number;
  asciiDensity?: number;
  wireframe?: boolean;
}

export interface ASCII3DResult {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  points?: THREE.Points;
  mesh?: THREE.Mesh;
}

export class GeometryBuilder {
  private static readonly DEFAULT_DEPTH = 10;
  private static readonly DEFAULT_SEGMENTS = 12;

  /**
   * Create 3D ASCII text from ASCII string
   */
  static createASCIIText3D(
    asciiText: string,
    asciiWidth: number,
    asciiHeight: number,
    options: GeometryBuilderOptions = {}
  ): THREE.Group {
    const { depth = 2 } = options;
    const group = new THREE.Group();
    
    const lines = asciiText.split('\n');
    
    // Character spacing (adjust for monospace)
    const charSpacing = 1.0;
    const lineHeight = 1.8;
    const charDepth = depth;
    
    // Cache for character materials to improve performance
    const materialCache: Record<string, THREE.Material> = {};
    
    lines.forEach((line, lineIndex) => {
      for (let charIndex = 0; charIndex < line.length; charIndex++) {
        const char = line[charIndex];
        if (char === ' ' || char === '') continue;
        
        let material = materialCache[char];
        
        if (!material) {
          // Create a canvas texture for each unique character
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          
          // Clear and draw character
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 64, 64);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 52px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(char, 32, 32);
          
          // Create texture from canvas
          const texture = new THREE.CanvasTexture(canvas);
          texture.needsUpdate = true;
          
          material = new THREE.MeshStandardMaterial({ 
            map: texture,
            color: 0xffffff,
            metalness: 0.1,
            roughness: 0.8
          });
          
          materialCache[char] = material;
        }
        
        // Create a box geometry for the character
        // We can also reuse geometry if all chars have same dimensions
        const geometry = new THREE.BoxGeometry(charSpacing * 0.8, lineHeight * 0.8, charDepth);
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position the character
        const x = (charIndex - line.length / 2) * charSpacing;
        const y = (asciiHeight / 2 - lineIndex) * lineHeight;
        mesh.position.set(x, y, 0);
        
        group.add(mesh);
      }
    });
    
    return group;
  }

  /**
   * Create 3D geometry from SVG path data
   */
  static createFromSVGPath(
    pathData: string,
    options: GeometryBuilderOptions = {}
  ): THREE.ExtrudeGeometry {
    const {
      depth = this.DEFAULT_DEPTH,
      segments = this.DEFAULT_SEGMENTS,
      bevelEnabled = true,
      bevelThickness = 1,
      bevelSize = 0.5
    } = options;

    // Create shape from SVG path
    const shape = this.svgPathToShape(pathData);

    // Extrude settings
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth,
      bevelEnabled,
      bevelThickness,
      bevelSize,
      bevelSegments: segments,
      steps: segments
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  /**
   * Convert SVG path to THREE.Shape
   */
  private static svgPathToShape(pathData: string): THREE.Shape {
    const shape = new THREE.Shape();
    
    // Simple path parser (supports basic commands: M, L, H, V, C, Q, Z)
    const commands = this.parseSVGPath(pathData);
    
    for (const cmd of commands) {
      switch (cmd.type) {
        case 'M': // Move to
          shape.moveTo(cmd.x!, cmd.y!);
          break;
        case 'L': // Line to
          shape.lineTo(cmd.x!, cmd.y!);
          break;
        case 'H': // Horizontal line
          shape.lineTo(cmd.x!, shape.currentPoint.y);
          break;
        case 'V': // Vertical line
          shape.lineTo(shape.currentPoint.x, cmd.y!);
          break;
        case 'C': // Cubic bezier
          shape.bezierCurveTo(
            cmd.x1!, cmd.y1!,
            cmd.x2!, cmd.y2!,
            cmd.x!, cmd.y!
          );
          break;
        case 'Q': // Quadratic bezier
          shape.quadraticCurveTo(cmd.x1!, cmd.y1!, cmd.x!, cmd.y!);
          break;
        case 'Z': // Close path
          shape.closePath();
          break;
      }
    }

    return shape;
  }

  /**
   * Parse SVG path data into commands
   */
  private static parseSVGPath(pathData: string): Array<any> {
    const commands: Array<any> = [];
    const regex = /([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi;
    let match;

    while ((match = regex.exec(pathData)) !== null) {
      const type = match[1].toUpperCase();
      const args = match[2].trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));

      switch (type) {
        case 'M':
        case 'L':
          commands.push({ type, x: args[0], y: args[1] });
          break;
        case 'H':
          commands.push({ type, x: args[0] });
          break;
        case 'V':
          commands.push({ type, y: args[0] });
          break;
        case 'C':
          commands.push({ 
            type, 
            x1: args[0], y1: args[1],
            x2: args[2], y2: args[3],
            x: args[4], y: args[5]
          });
          break;
        case 'Q':
          commands.push({ 
            type,
            x1: args[0], y1: args[1],
            x: args[2], y: args[3]
          });
          break;
        case 'Z':
          commands.push({ type });
          break;
      }
    }

    return commands;
  }

  /**
   * Create ASCII point cloud from canvas
   */
  static createASCIIPoints(
    canvas: HTMLCanvasElement,
    options: GeometryBuilderOptions = {}
  ): THREE.Points {
    const { depth = this.DEFAULT_DEPTH, asciiDensity = 0.6 } = options;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }

    // Sample points from canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const positions: number[] = [];
    const colors: number[] = [];

    // Center the coordinates
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Sample pixels based on density
    const step = Math.max(1, Math.floor(1 / asciiDensity));

    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const idx = (y * canvas.width + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        const a = pixels[idx + 3];

        // Only add visible pixels
        if (a > 128) {
          // Calculate luminance for Z depth
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const z = luminance * depth;

          // Add position (centered and scaled)
          positions.push(
            (x - centerX) * 0.1,
            -(y - centerY) * 0.1, // Flip Y
            z
          );

          // Add color
          colors.push(r / 255, g / 255, b / 255);
        }
      }
    }

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Create material
    const material = new THREE.PointsMaterial({
      size: 1.0,
      vertexColors: true,
      sizeAttenuation: true
    });

    return new THREE.Points(geometry, material);
  }

  /**
   * Create extruded mesh from canvas silhouette
   */
  static createExtrudedMesh(
    canvas: HTMLCanvasElement,
    options: GeometryBuilderOptions = {}
  ): THREE.Mesh {
    const { 
      depth = this.DEFAULT_DEPTH,
      wireframe = false
    } = options;

    // Extract shape from canvas
    const shape = this.canvasToShape(canvas);

    // Extrude the shape
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: 1,
      bevelSize: 0.5,
      bevelSegments: 3
    });

    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: 0x333333,
      wireframe,
      metalness: 0.2,
      roughness: 0.5
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Convert canvas to THREE.Shape by tracing edges
   */
  private static canvasToShape(canvas: HTMLCanvasElement): THREE.Shape {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Simple approach: create rectangular shape from bounding box
    // For production, implement proper edge detection/tracing
    let minX = canvas.width, maxX = 0;
    let minY = canvas.height, maxY = 0;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        const a = pixels[idx + 3];

        if (a > 128) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 0.1;

    const shape = new THREE.Shape();
    shape.moveTo((minX - centerX) * scale, -(minY - centerY) * scale);
    shape.lineTo((maxX - centerX) * scale, -(minY - centerY) * scale);
    shape.lineTo((maxX - centerX) * scale, -(maxY - centerY) * scale);
    shape.lineTo((minX - centerX) * scale, -(maxY - centerY) * scale);
    shape.closePath();

    return shape;
  }

  /**
   * Create ASCII texture from canvas
   */
  static createASCIITexture(
    asciiText: string,
    width: number,
    height: number
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    const fontSize = 10;
    const charWidth = fontSize * 0.6;
    const charHeight = fontSize;

    canvas.width = width * charWidth;
    canvas.height = height * charHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }

    // Setup canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff00';
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';

    // Draw ASCII text
    const lines = asciiText.split('\n');
    lines.forEach((line, y) => {
      for (let x = 0; x < line.length; x++) {
        ctx.fillText(line[x], x * charWidth, y * charHeight);
      }
    });

    return new THREE.CanvasTexture(canvas);
  }
}
