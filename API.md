# API Documentation

## Core Modules

### SVGParser

The `SVGParser` module handles SVG validation, parsing, and rendering to HTML canvas.

#### Methods

##### `SVGParser.validate(svgMarkup: string)`

Validates SVG markup structure.

**Parameters:**
- `svgMarkup` (string): The SVG markup to validate

**Returns:**
```typescript
{
  valid: boolean;
  error?: string;
}
```

**Example:**
```typescript
import { SVGParser } from '@/core/svgParser';

const validation = SVGParser.validate('<svg>...</svg>');
if (!validation.valid) {
  console.error(validation.error);
}
```

---

##### `SVGParser.parseToCanvas(svgMarkup: string, options?: SVGParserOptions)`

Parse SVG and render to canvas.

**Parameters:**
- `svgMarkup` (string): The SVG markup to parse
- `options` (object, optional):
  - `maxWidth` (number): Maximum canvas width (default: 2000)
  - `maxHeight` (number): Maximum canvas height (default: 2000)
  - `backgroundColor` (string): Background color (default: 'transparent')

**Returns:**
```typescript
Promise<{
  success: boolean;
  width: number;
  height: number;
  canvas?: HTMLCanvasElement;
  error?: string;
}>
```

**Example:**
```typescript
const result = await SVGParser.parseToCanvas(svgMarkup, {
  maxWidth: 800,
  maxHeight: 800,
  backgroundColor: 'white'
});

if (result.success && result.canvas) {
  // Use the canvas
}
```

---

##### `SVGParser.loadFromFile(file: File)`

Load SVG content from a file.

**Parameters:**
- `file` (File): The file to load

**Returns:** `Promise<string>` - The SVG content

**Example:**
```typescript
const svgContent = await SVGParser.loadFromFile(file);
```

---

### ASCIIMapper

The `ASCIIMapper` module converts pixel data to ASCII characters based on luminance.

#### Character Sets

```typescript
ASCIIMapper.CHARSET_DETAILED  // '@%#*+=-:. '
ASCIIMapper.CHARSET_STANDARD  // '@&#*+=-. '
ASCIIMapper.CHARSET_SIMPLE    // '@#*-. '
ASCIIMapper.CHARSET_BLOCKS    // '█▓▒░ '
ASCIIMapper.CHARSET_MINIMAL   // '█░ '
```

#### Methods

##### `ASCIIMapper.canvasToASCII(canvas: HTMLCanvasElement, options?: ASCIIMapperOptions)`

Convert canvas to ASCII art.

**Parameters:**
- `canvas` (HTMLCanvasElement): The canvas to convert
- `options` (object, optional):
  - `width` (number): Target ASCII width (default: 80)
  - `height` (number): Target ASCII height (auto-calculated if not provided)
  - `characterSet` (string): Character set to use (default: CHARSET_STANDARD)
  - `invert` (boolean): Invert colors (default: false)
  - `maintainAspectRatio` (boolean): Maintain aspect ratio (default: true)

**Returns:**
```typescript
{
  ascii: string;
  width: number;
  height: number;
}
```

**Example:**
```typescript
import { ASCIIMapper } from '@/core/asciiMapper';

const ascii = ASCIIMapper.canvasToASCII(canvas, {
  width: 100,
  characterSet: ASCIIMapper.CHARSET_DETAILED,
  invert: false
});

console.log(ascii.ascii);
```

---

##### `ASCIIMapper.calculateDimensions(sourceWidth, sourceHeight, targetWidth?, targetHeight?)`

Calculate optimal ASCII dimensions.

**Parameters:**
- `sourceWidth` (number): Source image width
- `sourceHeight` (number): Source image height
- `targetWidth` (number, optional): Target ASCII width
- `targetHeight` (number, optional): Target ASCII height

**Returns:**
```typescript
{
  width: number;
  height: number;
}
```

---

##### `ASCIIMapper.getCharacterSets()`

Get all available character sets.

**Returns:**
```typescript
{
  detailed: string;
  standard: string;
  simple: string;
  blocks: string;
  minimal: string;
}
```

---

### GeometryBuilder

The `GeometryBuilder` module creates 3D geometry from canvas data for Three.js rendering.

#### Methods

##### `GeometryBuilder.createASCIIPoints(canvas: HTMLCanvasElement, options?: GeometryBuilderOptions)`

Create ASCII point cloud from canvas.

**Parameters:**
- `canvas` (HTMLCanvasElement): The canvas to convert
- `options` (object, optional):
  - `depth` (number): Z-depth based on luminance (default: 10)
  - `asciiDensity` (number): Point sampling density 0-1 (default: 0.6)

**Returns:** `THREE.Points` - A Three.js Points object

**Example:**
```typescript
import { GeometryBuilder } from '@/core/geometryBuilder';

const points = GeometryBuilder.createASCIIPoints(canvas, {
  depth: 15,
  asciiDensity: 0.8
});

scene.add(points);
```

---

##### `GeometryBuilder.createExtrudedMesh(canvas: HTMLCanvasElement, options?: GeometryBuilderOptions)`

Create extruded mesh from canvas silhouette.

**Parameters:**
- `canvas` (HTMLCanvasElement): The canvas to convert
- `options` (object, optional):
  - `depth` (number): Extrusion depth (default: 10)
  - `wireframe` (boolean): Render as wireframe (default: false)

**Returns:** `THREE.Mesh` - A Three.js Mesh object

**Example:**
```typescript
const mesh = GeometryBuilder.createExtrudedMesh(canvas, {
  depth: 20,
  wireframe: false
});

scene.add(mesh);
```

---

##### `GeometryBuilder.createASCIITexture(asciiText: string, width: number, height: number)`

Create ASCII texture from text.

**Parameters:**
- `asciiText` (string): The ASCII art text
- `width` (number): ASCII width in characters
- `height` (number): ASCII height in characters

**Returns:** `THREE.CanvasTexture` - A Three.js texture

---

## React Component

### ASCII3D

The main React component for rendering 3D ASCII art.

#### Props

```typescript
interface ASCII3DProps {
  svg?: string;              // SVG markup content
  src?: string;              // URL to SVG file
  depth?: number;            // Extrusion depth (default: 10)
  density?: number;          // ASCII density 0-1 (default: 0.6)
  autoRotate?: boolean;      // Enable auto-rotation (default: true)
  rotationSpeed?: number;    // Rotation speed (default: 0.01)
  mode?: 'points' | 'mesh' | 'wireframe'; // Render mode (default: 'points')
  width?: string | number;   // Container width (default: '100%')
  height?: string | number;  // Container height (default: '400px')
  cameraDistance?: number;   // Camera distance (default: 100)
  backgroundColor?: string;  // Background color (default: '#000000')
  onLoad?: () => void;       // Callback when loaded
  onError?: (error: string) => void; // Callback on error
}
```

#### Usage

```tsx
import ASCII3D from '@/components/Ascii3D';

function MyComponent() {
  return (
    <ASCII3D
      svg={svgMarkup}
      depth={15}
      density={0.8}
      mode="points"
      autoRotate
      rotationSpeed={0.01}
      width="600px"
      height="400px"
      backgroundColor="#000000"
      onLoad={() => console.log('Loaded!')}
      onError={(err) => console.error(err)}
    />
  );
}
```

---

## Web Component

### `<ascii-3d>`

Framework-agnostic custom element for embedding ASCII 3D art.

#### Attributes

- `src` (string): URL to SVG file
- `svg` (string): Inline SVG markup
- `depth` (number): Extrusion depth (default: 10)
- `density` (number): ASCII density 0-1 (default: 0.6)
- `rotate` (boolean): Enable auto-rotation (default: true)
- `rotation-speed` (number): Rotation speed (default: 0.01)
- `mode` (string): Render mode - 'points', 'mesh', 'wireframe' (default: 'points')
- `width` (string): Container width (default: '100%')
- `height` (string): Container height (default: '400px')
- `camera-distance` (number): Camera distance (default: 100)
- `background-color` (string): Background color (default: '#000000')

#### Usage

```html
<!-- Import the web component -->
<script type="module">
  import '/path/to/ascii-3d.webcomponent.js';
</script>

<!-- Use the component -->
<ascii-3d 
  src="logo.svg"
  depth="15"
  density="0.8"
  mode="points"
  rotate="true"
  rotation-speed="0.01"
  width="600px"
  height="400px"
  background-color="#000000">
</ascii-3d>
```

---

## Embed Script

### Window API

When you include `embed.js`, it exposes a global `ASCII3D` class.

#### Constructor

```javascript
new ASCII3D(element, options)
```

**Parameters:**
- `element` (HTMLElement): Container element
- `options` (object):
  - `src` (string): URL to SVG file
  - `svg` (string): SVG markup
  - `depth` (number): Extrusion depth
  - `density` (number): ASCII density
  - `rotate` (boolean): Auto-rotate
  - `rotationSpeed` (number): Rotation speed
  - `mode` (string): Render mode
  - `width` (string): Container width
  - `height` (string): Container height
  - `backgroundColor` (string): Background color

#### Usage

```html
<script src="https://yoursite.com/embed.js"></script>

<!-- Automatic initialization via data attributes -->
<div 
  data-ascii-3d="logo.svg"
  data-depth="15"
  data-density="0.8"
  data-mode="points"
  data-rotate="true">
</div>

<!-- Or programmatic initialization -->
<div id="container"></div>
<script>
  const container = document.getElementById('container');
  const ascii3d = new ASCII3D(container, {
    src: 'logo.svg',
    depth: 15,
    density: 0.8,
    mode: 'points',
    rotate: true
  });
</script>
```

#### Methods

##### `destroy()`

Clean up and remove the 3D scene.

```javascript
ascii3d.destroy();
```

---

## Luminance Formula

The ASCII conversion uses the standard luminance formula:

```
L = 0.299R + 0.587G + 0.114B
```

Where:
- `R` = Red channel (0-255)
- `G` = Green channel (0-255)
- `B` = Blue channel (0-255)
- `L` = Luminance (0-255)

This formula weights green more heavily as human eyes are most sensitive to green light.

---

## Character Aspect Ratio

Most monospace fonts have an aspect ratio of approximately 0.5 (width:height). The ASCII mapper accounts for this when `maintainAspectRatio` is enabled to prevent distortion.

---

## Performance Tips

1. **Reduce ASCII density** for better performance with large SVGs
2. **Lower canvas resolution** when parsing large SVGs
3. **Use `points` mode** for fastest rendering
4. **Limit ASCII width** to 150 or less for real-time conversion
5. **Disable auto-rotation** for interactive scenes
6. **Use lower depth values** for simpler 3D geometry

---

## TypeScript Types

All modules export their TypeScript types:

```typescript
import type { 
  SVGParseResult, 
  SVGParserOptions 
} from '@/core/svgParser';

import type { 
  ASCIIMapperOptions, 
  ASCIIResult 
} from '@/core/asciiMapper';

import type { 
  GeometryBuilderOptions, 
  ASCII3DResult 
} from '@/core/geometryBuilder';

import type { 
  ASCII3DProps 
} from '@/components/Ascii3D';
```
