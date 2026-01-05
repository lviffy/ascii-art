'use client';

import { useState } from 'react';
import ASCII3D from '@/components/Ascii3D';
import { ASCIIMapper } from '@/core/asciiMapper';

// Demo SVGs
const DEMOS = {
  smiley: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="45" fill="#333"/>
  <circle cx="35" cy="38" r="6" fill="#fff"/>
  <circle cx="65" cy="38" r="6" fill="#fff"/>
  <path d="M 28 58 Q 50 78 72 58" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
</svg>`,
  star: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="#333"/>
</svg>`,
  heart: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M50 88 C20 60 5 40 5 25 C5 10 20 5 35 5 C45 5 50 15 50 15 C50 15 55 5 65 5 C80 5 95 10 95 25 C95 40 80 60 50 88Z" fill="#333"/>
</svg>`,
  cube: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="60" height="60" fill="#333"/>
</svg>`
};

type DemoKey = keyof typeof DEMOS;

export default function ExamplesPage() {
  const [activeDemo, setActiveDemo] = useState<DemoKey>('smiley');
  const [depth, setDepth] = useState(8);
  const [charSet, setCharSet] = useState('standard');
  const [isRotating, setIsRotating] = useState(true);

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-tight">Examples</h1>
            <p className="text-xs text-black/40 mt-0.5">ASCII3D Component Showcase</p>
          </div>
          <a 
            href="/" 
            className="text-xs uppercase tracking-widest text-black/40 hover:text-black transition-colors"
          >
            ← Back
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Interactive Demo */}
        <section className="mb-16">
          <div className="border border-black/10 bg-white overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3">
              {/* Preview */}
              <div className="lg:col-span-2 bg-black/[0.02]">
                <ASCII3D
                  svg={DEMOS[activeDemo]}
                  depth={depth}
                  characterSet={ASCIIMapper.getCharacterSets()[charSet as keyof ReturnType<typeof ASCIIMapper.getCharacterSets>] || ASCIIMapper.CHARSET_STANDARD}
                  autoRotate={isRotating}
                  rotationSpeed={0.01}
                  width="100%"
                  height="500px"
                  backgroundColor="#f8f8f8"
                />
              </div>

              {/* Controls */}
              <div className="p-6 border-l border-black/5 space-y-6">
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-black/50 mb-4">Shape</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(DEMOS) as DemoKey[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => setActiveDemo(key)}
                        className={`px-4 py-3 text-xs uppercase tracking-widest border transition-colors ${
                          activeDemo === key 
                            ? 'bg-black text-white border-black' 
                            : 'bg-white text-black/60 border-black/10 hover:border-black/30'
                        }`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-3">
                    <h3 className="text-xs uppercase tracking-widest text-black/50">Depth</h3>
                    <span className="text-xs text-black/30">{depth}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="20"
                    value={depth}
                    onChange={(e) => setDepth(parseInt(e.target.value))}
                    className="w-full h-1 bg-black/10 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:rounded-full"
                  />
                </div>

                <div>
                  <h3 className="text-xs uppercase tracking-widest text-black/50 mb-3">Characters</h3>
                  <select
                    value={charSet}
                    onChange={(e) => setCharSet(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-black/10 text-sm focus:outline-none focus:border-black/30 transition-colors cursor-pointer"
                  >
                    <option value="detailed">Detailed</option>
                    <option value="standard">Standard</option>
                    <option value="simple">Simple</option>
                    <option value="blocks">Blocks</option>
                    <option value="binary">Binary</option>
                    <option value="numbers">Numbers</option>
                  </select>
                </div>

                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isRotating}
                      onChange={(e) => setIsRotating(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-black/10 rounded-full peer-checked:bg-black transition-colors"></div>
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
                  </div>
                  <span className="ml-3 text-xs uppercase tracking-widest text-black/50">
                    Auto Rotate
                  </span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Code Examples */}
        <section className="mb-16">
          <h2 className="text-xs uppercase tracking-widest text-black/50 mb-6">Usage</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* React */}
            <div className="border border-black/10 bg-white p-6">
              <h3 className="text-xs uppercase tracking-widest text-black/30 mb-4">React Component</h3>
              <pre className="text-xs bg-black/[0.02] p-4 overflow-x-auto text-black/70 border border-black/5">
{`import { ASCII3D } from 'ascii';

export default function App() {
  return (
    <ASCII3D
      svg={svgContent}
      depth={${depth}}
      autoRotate={${isRotating}}
      characterSet="${charSet}"
      width="100%"
      height="400px"
    />
  );
}`}
              </pre>
            </div>

            {/* Props */}
            <div className="border border-black/10 bg-white p-6">
              <h3 className="text-xs uppercase tracking-widest text-black/30 mb-4">Available Props</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-black/5">
                  <code className="text-black/70">svg</code>
                  <span className="text-black/40">SVG markup string</span>
                </div>
                <div className="flex justify-between py-2 border-b border-black/5">
                  <code className="text-black/70">src</code>
                  <span className="text-black/40">SVG file URL</span>
                </div>
                <div className="flex justify-between py-2 border-b border-black/5">
                  <code className="text-black/70">depth</code>
                  <span className="text-black/40">2-20 (default: 8)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-black/5">
                  <code className="text-black/70">autoRotate</code>
                  <span className="text-black/40">boolean (default: true)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-black/5">
                  <code className="text-black/70">characterSet</code>
                  <span className="text-black/40">Character string</span>
                </div>
                <div className="flex justify-between py-2">
                  <code className="text-black/70">backgroundColor</code>
                  <span className="text-black/40">CSS color</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-black/50 mb-6">Gallery</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.entries(DEMOS) as [DemoKey, string][]).map(([key, svg]) => (
              <div key={key} className="border border-black/10 bg-white overflow-hidden group">
                <ASCII3D
                  svg={svg}
                  depth={6}
                  autoRotate
                  rotationSpeed={0.005}
                  width="100%"
                  height="200px"
                  backgroundColor="#fafafa"
                />
                <div className="px-4 py-3 border-t border-black/5">
                  <p className="text-xs uppercase tracking-widest text-black/40">{key}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/5 mt-24">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <a
            href="/"
            className="inline-block px-8 py-3 bg-black text-white hover:bg-black/90 text-xs uppercase tracking-widest transition-colors"
          >
            Try the Converter
          </a>
        </div>
      </footer>
    </div>
  );
}
