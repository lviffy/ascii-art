# ASCII

> Transform SVG graphics into ASCII art with interactive 3D rendering

A modern web application that converts SVG files into beautiful ASCII art, with the unique ability to render the result as interactive 3D text blocks using Three.js.

![License](https://img.shields.io/badge/license-MIT-black)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Three.js](https://img.shields.io/badge/Three.js-0.182-black)

## ✨ Features

- **SVG to ASCII Conversion** — Transform any SVG into ASCII art with adjustable width and multiple character sets
- **3D ASCII Rendering** — View your ASCII art as interactive 3D text blocks with auto-rotation
- **Multiple Character Sets** — Choose from detailed, standard, blocks, binary, numbers, letters, or define your own
- **Real-time Preview** — See changes instantly as you adjust settings
- **Export Options** — Download as `.txt` or standalone `.html` file
- **Keyboard Shortcuts** — ⌘+Enter to convert, ⌘+Shift+C to copy
- **Responsive Design** — Works beautifully on desktop and mobile
- **Zero Configuration** — Works entirely in the browser, no backend required

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to use the application.

## 📁 Project Structure

```
ascii/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main converter UI
│   │   ├── examples/         # Examples showcase
│   │   ├── layout.tsx        # Root layout with SEO
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   └── Ascii3D.tsx       # React 3D component
│   ├── core/
│   │   ├── svgParser.ts      # SVG validation & parsing
│   │   ├── asciiMapper.ts    # ASCII conversion engine
│   │   └── geometryBuilder.ts # Three.js 3D geometry
│   └── index.ts              # Library exports
├── public/                   # Static assets
└── package.json
```

## 🎨 Character Sets

| Name | Characters | Best For |
|------|------------|----------|
| Detailed | `@%#*+=-:. ` | High detail images |
| Standard | `@&#*+=-. ` | General use |
| Simple | `@#*-. ` | Clean output |
| Blocks | `█▓▒░ ` | Pixel art style |
| Binary | `01 ` | Matrix/tech aesthetic |
| Numbers | `9876543210 ` | Numeric art |
| Letters | `A-Z` | Text-based art |
| Custom | Any | Your creativity |

## 🧩 Using as a Component

### React Component

```tsx
import { ASCII3D } from 'ascii';

function App() {
  return (
    <ASCII3D
      svg={svgContent}
      depth={8}
      autoRotate
      characterSet="@#*-. "
      width="100%"
      height="400px"
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `svg` | `string` | — | SVG markup string |
| `src` | `string` | — | SVG file URL |
| `depth` | `number` | `8` | 3D extrusion depth |
| `autoRotate` | `boolean` | `true` | Enable auto-rotation |
| `rotationSpeed` | `number` | `0.008` | Rotation speed |
| `characterSet` | `string` | Standard | Characters for ASCII |
| `backgroundColor` | `string` | `#f8f8f8` | Background color |
| `width` | `string \| number` | `100%` | Container width |
| `height` | `string \| number` | `400px` | Container height |

## 🛠 Core Modules

### SVGParser

```ts
import { SVGParser } from 'ascii';

// Validate SVG
const { valid, error } = SVGParser.validate(svgMarkup);

// Parse to canvas
const result = await SVGParser.parseToCanvas(svgMarkup, {
  maxWidth: 800,
  maxHeight: 800,
  backgroundColor: 'white'
});
```

### ASCIIMapper

```ts
import { ASCIIMapper } from 'ascii';

// Convert canvas to ASCII
const { ascii, width, height } = ASCIIMapper.canvasToASCII(canvas, {
  width: 80,
  characterSet: ASCIIMapper.CHARSET_STANDARD,
  invert: false,
  maintainAspectRatio: true
});

// Available character sets
ASCIIMapper.CHARSET_DETAILED
ASCIIMapper.CHARSET_STANDARD
ASCIIMapper.CHARSET_SIMPLE
ASCIIMapper.CHARSET_BLOCKS
ASCIIMapper.CHARSET_BINARY
ASCIIMapper.CHARSET_NUMBERS
ASCIIMapper.CHARSET_LETTERS
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘/Ctrl + Enter` | Convert SVG to ASCII |
| `⌘/Ctrl + Shift + C` | Copy ASCII to clipboard |

## 🎯 Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

## 📄 License

MIT © 2026

---

Built with [Next.js](https://nextjs.org), [Three.js](https://threejs.org), and [Tailwind CSS](https://tailwindcss.com)
