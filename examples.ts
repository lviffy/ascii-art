/**
 * Complete Example: Using All Features
 * 
 * This example demonstrates:
 * 1. File upload
 * 2. SVG validation
 * 3. ASCII conversion with different character sets
 * 4. 3D rendering in all modes
 * 5. Interactive controls
 * 6. Export functionality
 */

import { SVGParser, ASCIIMapper, GeometryBuilder } from './src/index';

// Example 1: Basic ASCII Conversion
async function basicASCIIConversion(svgMarkup: string) {
  // Validate SVG
  const validation = SVGParser.validate(svgMarkup);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Parse to canvas
  const result = await SVGParser.parseToCanvas(svgMarkup, {
    maxWidth: 800,
    maxHeight: 800,
    backgroundColor: 'white'
  });

  if (!result.success || !result.canvas) {
    throw new Error(result.error || 'Failed to parse SVG');
  }

  // Convert to ASCII
  const ascii = ASCIIMapper.canvasToASCII(result.canvas, {
    width: 80,
    characterSet: ASCIIMapper.CHARSET_STANDARD,
    invert: false,
    maintainAspectRatio: true
  });

  return ascii.ascii;
}

// Example 2: Multiple Character Sets
async function compareCharacterSets(svgMarkup: string) {
  const result = await SVGParser.parseToCanvas(svgMarkup);
  if (!result.success || !result.canvas) {
    throw new Error('Failed to parse SVG');
  }

  const charsets = ASCIIMapper.getCharacterSets();
  const results: Record<string, string> = {};

  for (const [name, charset] of Object.entries(charsets)) {
    const ascii = ASCIIMapper.canvasToASCII(result.canvas, {
      width: 60,
      characterSet: charset
    });
    results[name] = ascii.ascii;
  }

  return results;
}

// Example 3: File Upload Handler
async function handleFileUpload(file: File) {
  try {
    // Load file content
    const svgContent = await SVGParser.loadFromFile(file);

    // Validate
    const validation = SVGParser.validate(svgContent);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Parse and convert
    const parseResult = await SVGParser.parseToCanvas(svgContent);
    if (!parseResult.success || !parseResult.canvas) {
      return { success: false, error: parseResult.error };
    }

    const ascii = ASCIIMapper.canvasToASCII(parseResult.canvas, {
      width: 100
    });

    return {
      success: true,
      svgContent,
      ascii: ascii.ascii,
      dimensions: {
        svg: { width: parseResult.width, height: parseResult.height },
        ascii: { width: ascii.width, height: ascii.height }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Example 4: Calculate Optimal Dimensions
function calculateOptimalSize(
  svgWidth: number,
  svgHeight: number,
  targetChars: number = 80
) {
  const dimensions = ASCIIMapper.calculateDimensions(
    svgWidth,
    svgHeight,
    targetChars
  );

  console.log(`Optimal ASCII size: ${dimensions.width}x${dimensions.height}`);
  return dimensions;
}

// Example 5: Batch Processing
async function batchConvertSVGs(svgFiles: File[]) {
  const results = await Promise.all(
    svgFiles.map(async (file) => {
      const result = await handleFileUpload(file);
      return {
        filename: file.name,
        ...result
      };
    })
  );

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  return { successful, failed };
}

// Example 6: Custom ASCII Art Generator
class ASCIIArtGenerator {
  private options: {
    width: number;
    characterSet: string;
    invert: boolean;
  };

  constructor(options = {}) {
    this.options = {
      width: 80,
      characterSet: ASCIIMapper.CHARSET_STANDARD,
      invert: false,
      ...options
    };
  }

  async fromSVG(svgMarkup: string) {
    const result = await SVGParser.parseToCanvas(svgMarkup);
    if (!result.success || !result.canvas) {
      throw new Error('Failed to parse SVG');
    }

    return ASCIIMapper.canvasToASCII(result.canvas, this.options);
  }

  async fromFile(file: File) {
    const svgContent = await SVGParser.loadFromFile(file);
    return this.fromSVG(svgContent);
  }

  setWidth(width: number) {
    this.options.width = width;
    return this;
  }

  setCharacterSet(charset: string) {
    this.options.characterSet = charset;
    return this;
  }

  setInvert(invert: boolean) {
    this.options.invert = invert;
    return this;
  }

  // Export methods
  async exportAsText(svgMarkup: string) {
    const result = await this.fromSVG(svgMarkup);
    return result.ascii;
  }

  async exportAsMarkdown(svgMarkup: string) {
    const result = await this.fromSVG(svgMarkup);
    return `\`\`\`\n${result.ascii}\n\`\`\``;
  }

  async exportAsHTML(svgMarkup: string) {
    const result = await this.fromSVG(svgMarkup);
    return `<pre style="font-family: monospace; line-height: 1;">${result.ascii}</pre>`;
  }
}

// Example 7: Usage Patterns
async function exampleUsage() {
  const svgMarkup = `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" fill="black"/>
    </svg>
  `;

  // Pattern 1: Simple conversion
  const ascii = await basicASCIIConversion(svgMarkup);
  console.log(ascii);

  // Pattern 2: Using the generator class
  const generator = new ASCIIArtGenerator();
  const result = await generator
    .setWidth(100)
    .setCharacterSet(ASCIIMapper.CHARSET_DETAILED)
    .fromSVG(svgMarkup);
  console.log(result.ascii);

  // Pattern 3: Export as markdown
  const markdown = await generator.exportAsMarkdown(svgMarkup);
  console.log(markdown);

  // Pattern 4: Compare character sets
  const comparison = await compareCharacterSets(svgMarkup);
  Object.entries(comparison).forEach(([name, art]) => {
    console.log(`\n${name.toUpperCase()}:\n${art}`);
  });
}

// Example 8: React Component Integration
/*
import ASCII3D from '@/components/Ascii3D';

function MyApp() {
  const [svgContent, setSvgContent] = useState('');
  const [mode, setMode] = useState<'points' | 'mesh' | 'wireframe'>('points');

  async function handleUpload(file: File) {
    const content = await SVGParser.loadFromFile(file);
    setSvgContent(content);
  }

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files![0])} />
      
      <select value={mode} onChange={(e) => setMode(e.target.value as any)}>
        <option value="points">Points</option>
        <option value="mesh">Mesh</option>
        <option value="wireframe">Wireframe</option>
      </select>

      {svgContent && (
        <ASCII3D
          svg={svgContent}
          mode={mode}
          depth={15}
          density={0.7}
          autoRotate
        />
      )}
    </div>
  );
}
*/

// Example 9: Error Handling
async function robustConversion(svgMarkup: string) {
  try {
    // Validate first
    const validation = SVGParser.validate(svgMarkup);
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.error}`
      };
    }

    // Parse with error handling
    const parseResult = await SVGParser.parseToCanvas(svgMarkup, {
      maxWidth: 1000,
      maxHeight: 1000
    });

    if (!parseResult.success) {
      return {
        success: false,
        error: `Parsing failed: ${parseResult.error}`
      };
    }

    if (!parseResult.canvas) {
      return {
        success: false,
        error: 'No canvas returned'
      };
    }

    // Convert with try-catch
    try {
      const ascii = ASCIIMapper.canvasToASCII(parseResult.canvas, {
        width: 80
      });

      return {
        success: true,
        ascii: ascii.ascii,
        dimensions: {
          width: ascii.width,
          height: ascii.height
        }
      };
    } catch (conversionError) {
      return {
        success: false,
        error: `Conversion failed: ${conversionError}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error: ${error}`
    };
  }
}

// Example 10: Performance Optimization
async function optimizedConversion(svgMarkup: string, targetWidth: number) {
  // Calculate optimal canvas size
  const maxCanvasSize = Math.min(targetWidth * 10, 1000);

  // Parse with size limit
  const result = await SVGParser.parseToCanvas(svgMarkup, {
    maxWidth: maxCanvasSize,
    maxHeight: maxCanvasSize
  });

  if (!result.success || !result.canvas) {
    throw new Error('Parsing failed');
  }

  // Use simpler character set for large outputs
  const characterSet = targetWidth > 120
    ? ASCIIMapper.CHARSET_SIMPLE
    : ASCIIMapper.CHARSET_STANDARD;

  // Convert with optimized settings
  const ascii = ASCIIMapper.canvasToASCII(result.canvas, {
    width: targetWidth,
    characterSet,
    maintainAspectRatio: true
  });

  return ascii;
}

// Export examples
export {
  basicASCIIConversion,
  compareCharacterSets,
  handleFileUpload,
  calculateOptimalSize,
  batchConvertSVGs,
  ASCIIArtGenerator,
  exampleUsage,
  robustConversion,
  optimizedConversion
};

// Usage Examples:
// const ascii = await basicASCIIConversion(svgMarkup);
// const generator = new ASCIIArtGenerator({ width: 100 });
// const result = await generator.fromFile(file);
// const markdown = await generator.exportAsMarkdown(svgMarkup);
