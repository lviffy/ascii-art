# Quick Start Guide.

Get up and running with SVG to ASCII / 3D ASCII Components in minutes!

## Installation

```bash
# Clone or download the project
cd ascii

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## First Steps

### 1. Try the Web Converter

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Upload an SVG file or paste SVG markup
3. Adjust the settings:
   - ASCII Width (40-200 characters)
   - Character Set (Detailed, Standard, Simple, Blocks, Minimal)
   - Invert Colors (checkbox)
4. Click **"Convert to ASCII"**
5. View your ASCII art!
6. Use the buttons to:
   - Copy to clipboard
   - Download as `.txt`
   - Download as `.md`

### 2. Enable 3D Preview

1. After converting, check **"Show 3D Preview"**
2. Adjust 3D settings:
   - Depth (5-30)
   - Density (0.1-1.0)
   - Render Mode (Points, Mesh, Wireframe)
3. Watch your ASCII art come to life in 3D!
4. The 3D preview auto-rotates by default

### 3. View Examples

Visit [http://localhost:3000/examples](http://localhost:3000/examples) to see:
- Points mode rendering
- Mesh mode rendering
- Wireframe mode rendering
- Loading from file
- Interactive (mouse drag) mode

---

## Using in Your Own Project

### React Component

```tsx
import ASCII3D from '@/components/Ascii3D';

function MyComponent() {
  return (
    <ASCII3D
      src="/my-logo.svg"
      depth={12}
      density={0.7}
      mode="points"
      autoRotate
    />
  );
}
```

### Programmatic Conversion

```tsx
import { SVGParser, ASCIIMapper } from '@/core';

async function convertSVG(svgMarkup: string) {
  // Parse SVG to canvas
  const result = await SVGParser.parseToCanvas(svgMarkup, {
    maxWidth: 800,
    backgroundColor: 'white'
  });

  if (!result.success || !result.canvas) {
    throw new Error(result.error);
  }

  // Convert to ASCII
  const ascii = ASCIIMapper.canvasToASCII(result.canvas, {
    width: 80,
    characterSet: ASCIIMapper.CHARSET_STANDARD
  });

  return ascii.ascii;
}
```

---

## Sample SVG Files

The project includes a sample SVG at `/public/sample.svg`. You can test with it:

```tsx
<ASCII3D src="/sample.svg" />
```

Or create your own SVG files and place them in the `/public` directory.

---

## Common Patterns

### Pattern 1: File Upload + ASCII Conversion

```tsx
const [svgContent, setSvgContent] = useState('');
const [asciiArt, setAsciiArt] = useState('');

async function handleFileUpload(file: File) {
  const content = await SVGParser.loadFromFile(file);
  setSvgContent(content);
  
  const result = await SVGParser.parseToCanvas(content);
  if (result.success && result.canvas) {
    const ascii = ASCIIMapper.canvasToASCII(result.canvas, {
      width: 100
    });
    setAsciiArt(ascii.ascii);
  }
}
```

### Pattern 2: Different Character Sets

```tsx
const charsets = ASCIIMapper.getCharacterSets();

// Detailed ASCII
const detailed = ASCIIMapper.canvasToASCII(canvas, {
  characterSet: charsets.detailed
});

// Block style
const blocks = ASCIIMapper.canvasToASCII(canvas, {
  characterSet: charsets.blocks
});
```

### Pattern 3: Multiple Render Modes

```tsx
function MultiModeViewer({ svg }: { svg: string }) {
  return (
    <>
      <ASCII3D svg={svg} mode="points" />
      <ASCII3D svg={svg} mode="mesh" />
      <ASCII3D svg={svg} mode="wireframe" />
    </>
  );
}
```

---

## Tips & Tricks

### Better ASCII Quality

- Use **higher ASCII width** (100-150) for more detail
- Choose **Detailed character set** for complex images
- Use **white background** when parsing for better contrast
- **Invert colors** if your ASCII looks backwards

### Better 3D Performance

- Use **Points mode** for fastest rendering
- Reduce **density** (0.3-0.5) for complex SVGs
- Lower **depth** values (5-10) for simpler geometry
- Disable **autoRotate** and enable mouse interaction

### Best SVG Practices

- Keep SVGs simple (avoid too many paths)
- Use solid fills rather than gradients
- Ensure SVG has width/height or viewBox
- Test with transparent backgrounds

---

## Troubleshooting

### "No SVG element found"

Make sure your SVG markup includes `<svg>` tags:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- content -->
</svg>
```

### "Failed to load SVG image"

- Check SVG syntax is valid
- Ensure all paths are closed
- Verify xmlns attribute is present

### 3D Preview Not Showing

- Check browser WebGL support
- Verify console for errors
- Try refreshing the page

### ASCII Art Looks Distorted

- Enable **maintainAspectRatio** option
- Adjust ASCII width to match source aspect ratio
- Try different character sets

---

## Next Steps

1. Read the full [API Documentation](./API.md)
2. Check out the [examples page](http://localhost:3000/examples)
3. Experiment with your own SVG files
4. Customize the UI styling
5. Deploy to production

---

## Building for Production

```bash
# Build the project
npm run build

# Start production server
npm start
```

Your app will be available at [http://localhost:3000](http://localhost:3000).

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Other Platforms

The app is a standard Next.js application and can be deployed to:
- Netlify
- AWS Amplify
- Railway
- Render
- Any Node.js hosting

Just run `npm run build` and deploy the `.next` directory.

---

## Getting Help

- Check the [API Documentation](./API.md)
- Review the [main README](./README.md)
- Inspect the example code in `/src/app/examples/page.tsx`
- Look at the core modules in `/src/core/`

Happy ASCII art creating! 🎨
