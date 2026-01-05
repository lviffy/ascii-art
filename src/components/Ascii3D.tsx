'use client';

/**
 * ASCII3D React Component
 * Renders ASCII art as 3D text blocks using Three.js
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { SVGParser } from '@/core/svgParser';
import { ASCIIMapper } from '@/core/asciiMapper';

export interface ASCII3DProps {
  /** SVG markup or URL to SVG file */
  svg?: string;
  /** SVG URL */
  src?: string;
  /** Extrusion depth */
  depth?: number;
  /** Auto-rotate */
  autoRotate?: boolean;
  /** Rotation speed */
  rotationSpeed?: number;
  /** Width of container */
  width?: string | number;
  /** Height of container */
  height?: string | number;
  /** Camera distance */
  cameraDistance?: number;
  /** Background color */
  backgroundColor?: string;
  /** Character set to use */
  characterSet?: string;
  /** On load callback */
  onLoad?: () => void;
  /** On error callback */
  onError?: (error: string) => void;
}

export default function ASCII3D({
  svg,
  src,
  depth = 8,
  autoRotate = true,
  rotationSpeed = 0.008,
  width = '100%',
  height = '400px',
  cameraDistance = 100,
  backgroundColor = '#f8f8f8',
  characterSet = ASCIIMapper.CHARSET_STANDARD,
  onLoad,
  onError
}: ASCII3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const materialCacheRef = useRef<Map<string, THREE.MeshStandardMaterial>>(new Map());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize props that affect 3D scene to prevent unnecessary re-renders
  const sceneKey = useMemo(() => 
    `${svg}-${src}-${depth}-${characterSet}`,
    [svg, src, depth, characterSet]
  );

  // Character weight map for variable depth (heavier = more depth)
  const getCharWeight = useCallback((char: string): number => {
    const heavyChars = '@#%&WMB8';
    const mediumChars = '*+=XO0QD';
    const lightChars = '-:.,\'"`^';
    
    if (heavyChars.includes(char)) return 1.0;
    if (mediumChars.includes(char)) return 0.7;
    if (lightChars.includes(char)) return 0.3;
    return 0.5; // Default medium weight
  }, []);

  // Create 3D ASCII text from ASCII string with variable depth
  const createASCIIText3D = useCallback((
    asciiText: string,
    asciiHeight: number,
    charDepth: number
  ): THREE.Group => {
    const group = new THREE.Group();
    const lines = asciiText.split('\n').filter(line => line.length > 0);
    
    const charSpacing = 1.0;
    const lineHeight = 1.6;
    
    // Reuse or create materials
    const materialCache = materialCacheRef.current;
    
    // Geometry cache for performance
    const geometryCache = new Map<string, THREE.BoxGeometry>();
    
    lines.forEach((line, lineIndex) => {
      for (let charIndex = 0; charIndex < line.length; charIndex++) {
        const char = line[charIndex];
        if (char === ' ' || char === '') continue;
        
        // Calculate variable depth based on character weight
        const weight = getCharWeight(char);
        const actualDepth = charDepth * (0.3 + weight * 0.7);
        const depthKey = actualDepth.toFixed(2);
        
        let material = materialCache.get(char);
        
        if (!material) {
          // Create canvas texture for character with better rendering
          const canvas = document.createElement('canvas');
          canvas.width = 128; // Higher resolution for crisp text
          canvas.height = 128;
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          
          // Draw character with subtle gradient background
          const gradient = ctx.createLinearGradient(0, 0, 0, 128);
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(1, '#f0f0f0');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 128, 128);
          
          // Add subtle border/edge
          ctx.strokeStyle = 'rgba(0,0,0,0.05)';
          ctx.lineWidth = 2;
          ctx.strokeRect(1, 1, 126, 126);
          
          // Draw character with slight shadow for depth
          ctx.fillStyle = 'rgba(0,0,0,0.1)';
          ctx.font = 'bold 90px ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(char, 66, 68); // Shadow offset
          
          ctx.fillStyle = '#1a1a1a';
          ctx.fillText(char, 64, 66);
          
          const texture = new THREE.CanvasTexture(canvas);
          texture.needsUpdate = true;
          texture.anisotropy = 4; // Better texture quality at angles
          
          material = new THREE.MeshStandardMaterial({ 
            map: texture,
            color: 0xffffff,
            metalness: 0.05,
            roughness: 0.8,
            envMapIntensity: 0.3
          });
          
          materialCache.set(char, material);
        }
        
        // Get or create geometry for this depth
        let geometry = geometryCache.get(depthKey);
        if (!geometry) {
          geometry = new THREE.BoxGeometry(charSpacing * 0.88, lineHeight * 0.88, actualDepth);
          geometryCache.set(depthKey, geometry);
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position character with slight Z offset based on weight for layered effect
        const x = (charIndex - line.length / 2) * charSpacing;
        const y = (lines.length / 2 - lineIndex) * lineHeight;
        const z = (weight - 0.5) * charDepth * 0.2; // Heavier chars slightly forward
        mesh.position.set(x, y, z);
        
        // Cast shadows for more depth
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        group.add(mesh);
      }
    });
    
    return group;
  }, [getCharWeight]);

  // Initialize and render scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let mounted = true;

    const initScene = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get SVG content
        let svgContent = svg;
        if (!svgContent && src) {
          const response = await fetch(src);
          svgContent = await response.text();
        }

        if (!svgContent) {
          throw new Error('No SVG content provided');
        }

        // Parse SVG to canvas
        const parseResult = await SVGParser.parseToCanvas(svgContent, {
          maxWidth: 400,
          maxHeight: 400,
          backgroundColor: 'transparent'
        });

        if (!parseResult.success || !parseResult.canvas) {
          throw new Error(parseResult.error || 'Failed to parse SVG');
        }

        // Convert to ASCII
        const asciiResult = ASCIIMapper.canvasToASCII(parseResult.canvas, {
          width: 50,
          characterSet: characterSet,
          maintainAspectRatio: true
        });

        // Setup Three.js scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(
          45,
          container.clientWidth / container.clientHeight,
          0.1,
          1000
        );
        camera.position.set(0, 0, cameraDistance);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ 
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(backgroundColor, 1);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Enhanced Lighting for better depth perception
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // Main key light with shadows
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(30, 50, 40);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 200;
        mainLight.shadow.camera.left = -50;
        mainLight.shadow.camera.right = 50;
        mainLight.shadow.camera.top = 50;
        mainLight.shadow.camera.bottom = -50;
        mainLight.shadow.bias = -0.001;
        scene.add(mainLight);

        // Fill light (softer, from opposite side)
        const fillLight = new THREE.DirectionalLight(0xf0f0ff, 0.3);
        fillLight.position.set(-20, 10, -20);
        scene.add(fillLight);

        // Rim/back light for edge definition
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
        rimLight.position.set(0, -10, -30);
        scene.add(rimLight);

        // Subtle hemisphere light for natural ambient
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe0e0e0, 0.3);
        scene.add(hemiLight);

        // Create 3D ASCII text
        const group = createASCIIText3D(
          asciiResult.ascii,
          asciiResult.height,
          depth
        );

        scene.add(group);
        groupRef.current = group;

        // Animation loop
        const animate = () => {
          if (!mounted) return;
          animationIdRef.current = requestAnimationFrame(animate);

          if (autoRotate && groupRef.current) {
            groupRef.current.rotation.y += rotationSpeed;
            groupRef.current.rotation.x = Math.sin(Date.now() * 0.0003) * 0.1;
          }

          renderer.render(scene, camera);
        };

        animate();

        if (mounted) {
          setLoading(false);
          onLoad?.();
        }

      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setError(errorMessage);
          setLoading(false);
          onError?.(errorMessage);
        }
      }
    };

    initScene();

    // Cleanup
    return () => {
      mounted = false;

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }

      if (groupRef.current) {
        groupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
          }
        });
        sceneRef.current?.remove(groupRef.current);
      }

      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      groupRef.current = null;
    };
  }, [sceneKey, depth, cameraDistance, backgroundColor, autoRotate, rotationSpeed, characterSet, createASCIIText3D, onLoad, onError]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

      const container = containerRef.current;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;

      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse interaction when not auto-rotating
  useEffect(() => {
    const container = containerRef.current;
    if (!container || autoRotate) return;

    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
      container.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !groupRef.current) return;

      const deltaX = e.clientX - previousMouseX;
      const deltaY = e.clientY - previousMouseY;

      groupRef.current.rotation.y += deltaX * 0.01;
      groupRef.current.rotation.x += deltaY * 0.01;

      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
      container.style.cursor = 'grab';
    };

    container.style.cursor = 'grab';
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [autoRotate]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        width, 
        height,
        position: 'relative',
        backgroundColor: backgroundColor,
        overflow: 'hidden'
      }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-black/40">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Loading 3D...
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-red-500 text-center px-4">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
