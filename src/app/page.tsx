'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { SVGParser } from '@/core/svgParser';
import { ASCIIMapper } from '@/core/asciiMapper';
import ASCII3D from '@/components/Ascii3D';

// Demo SVG for first-time users
const DEMO_SVG = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="#333" stroke="#000" stroke-width="2"/>
  <circle cx="35" cy="40" r="5" fill="#fff"/>
  <circle cx="65" cy="40" r="5" fill="#fff"/>
  <path d="M 30 60 Q 50 75 70 60" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
</svg>`;

export default function Home() {
  const [svgContent, setSvgContent] = useState<string>('');
  const [asciiArt, setAsciiArt] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'ascii' | '3d'>('ascii');
  
  // Options
  const [asciiWidth, setAsciiWidth] = useState(80);
  const [characterSet, setCharacterSet] = useState('standard');
  const [customCharacters, setCustomCharacters] = useState('');
  const [invertColors, setInvertColors] = useState(false);
  const [contrast, setContrast] = useState(1.0);
  const [edgeEnhance, setEdgeEnhance] = useState(false);
  const [depth3D, setDepth3D] = useState(8);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert SVG to ASCII
  const convertToASCII = useCallback(async (content?: string) => {
    const svg = content || svgContent;
    if (!svg.trim()) {
      setError('Please provide SVG content');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Validate SVG
      const validation = SVGParser.validate(svg);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid SVG');
      }

      // Parse to canvas
      const result = await SVGParser.parseToCanvas(svg, {
        maxWidth: 800,
        maxHeight: 800,
        backgroundColor: 'white'
      });

      if (!result.success || !result.canvas) {
        throw new Error(result.error || 'Failed to parse SVG');
      }

      // Get character set
      const charsets = ASCIIMapper.getCharacterSets();
      let selectedCharset = charsets[characterSet as keyof typeof charsets] || charsets.standard;
      
      if (characterSet === 'custom' && customCharacters.trim()) {
        selectedCharset = customCharacters;
      }
      
      // Convert to ASCII
      const ascii = ASCIIMapper.canvasToASCII(result.canvas, {
        width: asciiWidth,
        characterSet: selectedCharset,
        invert: invertColors,
        contrast: contrast,
        edgeEnhance: edgeEnhance,
        maintainAspectRatio: true
      });

      setAsciiArt(ascii.ascii);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setAsciiArt('');
    } finally {
      setLoading(false);
    }
  }, [svgContent, asciiWidth, characterSet, customCharacters, invertColors, contrast, edgeEnhance]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to convert
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        convertToASCII();
      }
      // Cmd/Ctrl + Shift + C to copy
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copyToClipboard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [convertToASCII]);

  // Handle SVG file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      const content = await SVGParser.loadFromFile(file);
      setSvgContent(content);
      setTimeout(() => convertToASCII(content), 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
      setLoading(false);
    }
  }, [convertToASCII]);

  // Handle drag and drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.name.endsWith('.svg')) return;

    try {
      setLoading(true);
      setError(null);
      const content = await SVGParser.loadFromFile(file);
      setSvgContent(content);
      setTimeout(() => convertToASCII(content), 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
      setLoading(false);
    }
  }, [convertToASCII]);

  // Handle SVG paste
  const handlePaste = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setSvgContent(content);
    setError(null);
  }, []);

  // Copy to clipboard with feedback
  const copyToClipboard = async () => {
    if (!asciiArt) return;
    await navigator.clipboard.writeText(asciiArt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download functions
  const downloadAsText = () => {
    if (!asciiArt) return;
    const blob = new Blob([asciiArt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ascii-art.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsHTML = () => {
    if (!asciiArt) return;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ASCII Art</title>
  <style>
    body { 
      background: #000; 
      color: #fff; 
      font-family: monospace; 
      display: flex; 
      justify-content: center; 
      padding: 2rem; 
    }
    pre { 
      font-size: 10px; 
      line-height: 1.1; 
      letter-spacing: 0.1em; 
    }
  </style>
</head>
<body>
  <pre>${asciiArt}</pre>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ascii-art.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load demo SVG
  const loadDemo = () => {
    setSvgContent(DEMO_SVG);
    setTimeout(() => convertToASCII(DEMO_SVG), 0);
  };

  // Get current charset for 3D
  const getCurrentCharset = () => {
    if (characterSet === 'custom' && customCharacters.trim()) {
      return customCharacters;
    }
    const charsets = ASCIIMapper.getCharacterSets();
    return charsets[characterSet as keyof typeof charsets] || ASCIIMapper.CHARSET_STANDARD;
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-tight">ASCII</h1>
            <p className="text-xs text-black/40 mt-0.5">SVG → ASCII Art → 3D</p>
          </div>
          <nav className="flex gap-6 text-xs uppercase tracking-widest">
            <a href="/examples" className="text-black/40 hover:text-black transition-colors">
              Examples
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel - Input & Options */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Input Section */}
            <section className="border border-black/10 bg-white">
              <div className="px-6 py-4 border-b border-black/5">
                <h2 className="text-xs uppercase tracking-widest text-black/50">Input</h2>
              </div>
              <div className="p-6 space-y-4">
                {/* File Upload */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="relative"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".svg,image/svg+xml"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-6 py-4 bg-black text-white hover:bg-black/90 transition-colors text-sm tracking-wide btn-lift"
                  >
                    Upload SVG
                  </button>
                  <p className="text-center text-xs text-black/30 mt-2">
                    or drag & drop
                  </p>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-black/10"></div>
                  <span className="text-xs text-black/30">or</span>
                  <div className="flex-1 h-px bg-black/10"></div>
                </div>

                {/* Textarea */}
                <div>
                  <textarea
                    value={svgContent}
                    onChange={handlePaste}
                    placeholder="Paste SVG markup here..."
                    className="w-full h-32 px-4 py-3 bg-black/[0.02] border border-black/10 font-mono text-sm resize-none focus:outline-none focus:border-black/30 transition-colors placeholder:text-black/30"
                  />
                </div>

                {/* Demo button */}
                <button
                  onClick={loadDemo}
                  className="w-full px-4 py-2 text-xs uppercase tracking-widest text-black/40 hover:text-black border border-black/10 hover:border-black/30 transition-colors"
                >
                  Try Demo
                </button>
              </div>
            </section>

            {/* Options Section */}
            <section className="border border-black/10 bg-white">
              <div className="px-6 py-4 border-b border-black/5">
                <h2 className="text-xs uppercase tracking-widest text-black/50">Options</h2>
              </div>
              <div className="p-6 space-y-5">
                {/* Width Slider */}
                <div>
                  <div className="flex justify-between items-baseline mb-3">
                    <label className="text-xs uppercase tracking-widest text-black/50">Width</label>
                    <span className="text-xs text-black/30">{asciiWidth} chars</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="150"
                    value={asciiWidth}
                    onChange={(e) => setAsciiWidth(parseInt(e.target.value))}
                    className="w-full h-1 bg-black/10 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                </div>

                {/* Character Set */}
                <div>
                  <label className="block mb-3 text-xs uppercase tracking-widest text-black/50">
                    Characters
                  </label>
                  <select
                    value={characterSet}
                    onChange={(e) => setCharacterSet(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-black/10 text-sm focus:outline-none focus:border-black/30 transition-colors cursor-pointer"
                  >
                    <option value="detailed">Detailed (@%#*+=-:.)</option>
                    <option value="standard">Standard (@&#*+=-. )</option>
                    <option value="simple">Simple (@#*-. )</option>
                    <option value="blocks">Blocks (█▓▒░)</option>
                    <option value="minimal">Minimal (█░)</option>
                    <option value="binary">Binary (01)</option>
                    <option value="numbers">Numbers (0-9)</option>
                    <option value="letters">Letters (A-Z)</option>
                    <option value="custom">Custom...</option>
                  </select>
                </div>

                {/* Custom Characters */}
                {characterSet === 'custom' && (
                  <div className="animate-fade-in">
                    <label className="block mb-3 text-xs uppercase tracking-widest text-black/50">
                      Custom (dark → light)
                    </label>
                    <input
                      type="text"
                      value={customCharacters}
                      onChange={(e) => setCustomCharacters(e.target.value)}
                      placeholder="e.g., @#*-. or 01 or XO"
                      className="w-full px-4 py-3 bg-white border border-black/10 text-sm font-mono focus:outline-none focus:border-black/30 transition-colors"
                    />
                  </div>
                )}

                {/* Invert Toggle */}
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={invertColors}
                      onChange={(e) => setInvertColors(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-black/10 rounded-full peer-checked:bg-black transition-colors"></div>
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
                  </div>
                  <span className="ml-3 text-xs uppercase tracking-widest text-black/50 group-hover:text-black/70">
                    Invert Colors
                  </span>
                </label>

                {/* Edge Enhancement Toggle */}
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={edgeEnhance}
                      onChange={(e) => setEdgeEnhance(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-black/10 rounded-full peer-checked:bg-black transition-colors"></div>
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
                  </div>
                  <span className="ml-3 text-xs uppercase tracking-widest text-black/50 group-hover:text-black/70">
                    Edge Enhancement
                  </span>
                </label>

                {/* Contrast Slider */}
                <div>
                  <label className="block mb-3 text-xs uppercase tracking-widest text-black/50">
                    Contrast: {contrast.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={contrast}
                    onChange={(e) => setContrast(parseFloat(e.target.value))}
                    className="w-full h-1 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black"
                  />
                  <div className="flex justify-between text-xs text-black/30 mt-1">
                    <span>Soft</span>
                    <span>Sharp</span>
                  </div>
                </div>

                {/* Convert Button */}
                <button
                  onClick={() => convertToASCII()}
                  disabled={!svgContent.trim() || loading}
                  className="w-full px-6 py-4 bg-black text-white hover:bg-black/90 transition-colors text-sm tracking-wide disabled:opacity-30 disabled:cursor-not-allowed btn-lift mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Converting...
                    </span>
                  ) : 'Convert'}
                </button>

                <p className="text-center text-xs text-black/30">
                  ⌘ + Enter
                </p>
              </div>
            </section>
          </div>

          {/* Right Panel - Output */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Error Display */}
            {error && (
              <div className="border border-red-200 bg-red-50 p-4 animate-fade-in">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Output Tabs */}
            {asciiArt && (
              <section className="border border-black/10 bg-white animate-fade-in">
                {/* Tab Header */}
                <div className="flex border-b border-black/5">
                  <button
                    onClick={() => setActiveTab('ascii')}
                    className={`px-6 py-4 text-xs uppercase tracking-widest transition-colors ${
                      activeTab === 'ascii' ? 'text-black border-b-2 border-black -mb-px' : 'text-black/40 hover:text-black/60'
                    }`}
                  >
                    ASCII Art
                  </button>
                  <button
                    onClick={() => setActiveTab('3d')}
                    className={`px-6 py-4 text-xs uppercase tracking-widest transition-colors ${
                      activeTab === '3d' ? 'text-black border-b-2 border-black -mb-px' : 'text-black/40 hover:text-black/60'
                    }`}
                  >
                    3D View
                  </button>
                  
                  {/* Actions - right aligned */}
                  <div className="ml-auto flex items-center gap-1 px-4">
                    <button
                      onClick={copyToClipboard}
                      className={`px-3 py-1.5 text-xs uppercase tracking-widest transition-all ${
                        copied ? 'bg-black text-white' : 'text-black/40 hover:text-black hover:bg-black/5'
                      }`}
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={downloadAsText}
                      className="px-3 py-1.5 text-xs uppercase tracking-widest text-black/40 hover:text-black hover:bg-black/5 transition-colors"
                    >
                      .txt
                    </button>
                    <button
                      onClick={downloadAsHTML}
                      className="px-3 py-1.5 text-xs uppercase tracking-widest text-black/40 hover:text-black hover:bg-black/5 transition-colors"
                    >
                      .html
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'ascii' ? (
                    <div className="bg-black/[0.02] p-6 overflow-auto max-h-[600px]">
                      <pre className="text-[10px] leading-[1.15] whitespace-pre font-mono text-black/80 select-all">
                        {asciiArt}
                      </pre>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* 3D Depth Control */}
                      <div className="flex items-center gap-4 pb-4 border-b border-black/5">
                        <label className="text-xs uppercase tracking-widest text-black/50">Depth</label>
                        <input
                          type="range"
                          min="2"
                          max="20"
                          value={depth3D}
                          onChange={(e) => setDepth3D(parseInt(e.target.value))}
                          className="flex-1 h-1 bg-black/10 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:rounded-full"
                        />
                        <span className="text-xs text-black/30 w-8">{depth3D}</span>
                      </div>
                      
                      {/* 3D Preview */}
                      <div className="bg-black/[0.02] rounded overflow-hidden">
                        <ASCII3D
                          svg={svgContent}
                          depth={depth3D}
                          characterSet={getCurrentCharset()}
                          autoRotate
                          rotationSpeed={0.008}
                          width="100%"
                          height="450px"
                          backgroundColor="#f8f8f8"
                        />
                      </div>
                      <p className="text-xs text-black/30 text-center">
                        Drag to rotate when auto-rotate is disabled
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Empty State */}
            {!asciiArt && !error && (
              <div className="border border-dashed border-black/10 p-16 text-center">
                <div className="text-6xl mb-4 opacity-10">◇</div>
                <p className="text-sm text-black/30 mb-2">No ASCII art yet</p>
                <p className="text-xs text-black/20">Upload or paste an SVG to get started</p>
              </div>
            )}

            {/* Integration Guide */}
            {asciiArt && (
              <section className="border border-black/10 bg-white">
                <div className="px-6 py-4 border-b border-black/5">
                  <h2 className="text-xs uppercase tracking-widest text-black/50">Embed Code</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs uppercase tracking-widest mb-3 text-black/30">React</h3>
                    <pre className="text-xs bg-black/[0.02] p-4 overflow-x-auto border border-black/5 text-black/60">
{`import { ASCII3D } from 'ascii';

<ASCII3D
  svg={svgContent}
  depth={${depth3D}}
  autoRotate
/>`}
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-widest mb-3 text-black/30">Web Component</h3>
                    <pre className="text-xs bg-black/[0.02] p-4 overflow-x-auto border border-black/5 text-black/60">
{`<script src="ascii.js"></script>

<ascii-3d 
  src="logo.svg"
  depth="${depth3D}"
  rotate="true">
</ascii-3d>`}
                    </pre>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/5 mt-24">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-black/30">
            Built with Next.js, Three.js & Tailwind CSS
          </p>
          <div className="flex gap-6 text-xs text-black/30">
            <span>⌘+Enter to convert</span>
            <span>⌘+Shift+C to copy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
