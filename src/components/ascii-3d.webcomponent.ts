/**
 * ASCII3D Web Component
 * Framework-agnostic custom element for embedding ASCII 3D art
 * 
 * Usage:
 * <ascii-3d src="logo.svg" depth="10" density="0.6" rotate="true"></ascii-3d>
 */

import * as THREE from 'three';

// Define the custom element
class ASCII3DElement extends HTMLElement {
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private object: THREE.Object3D | null = null;
  private animationId: number | null = null;
  private shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['src', 'svg', 'depth', 'density', 'rotate', 'rotation-speed', 'mode', 'width', 'height', 'camera-distance', 'background-color'];
  }

  connectedCallback() {
    this.render();
    this.initScene();
  }

  disconnectedCallback() {
    this.cleanup();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      this.cleanup();
      this.render();
      this.initScene();
    }
  }

  private render() {
    const width = this.getAttribute('width') || '100%';
    const height = this.getAttribute('height') || '400px';
    const backgroundColor = this.getAttribute('background-color') || '#000000';

    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          width: ${width};
          height: ${height};
        }
        .container {
          width: 100%;
          height: 100%;
          position: relative;
          background-color: ${backgroundColor};
        }
        .loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #fff;
          font-family: monospace;
        }
        .error {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #ff0000;
          font-family: monospace;
          text-align: center;
          padding: 20px;
        }
      </style>
      <div class="container">
        <div class="loading">Loading...</div>
      </div>
    `;
  }

  private async initScene() {
    const container = this.shadow.querySelector('.container') as HTMLElement;
    if (!container) return;

    const loading = this.shadow.querySelector('.loading') as HTMLElement;

    try {
      // Get attributes
      const src = this.getAttribute('src');
      const svgAttr = this.getAttribute('svg');
      const depth = parseFloat(this.getAttribute('depth') || '10');
      const density = parseFloat(this.getAttribute('density') || '0.6');
      const autoRotate = this.getAttribute('rotate') === 'true';
      const rotationSpeed = parseFloat(this.getAttribute('rotation-speed') || '0.01');
      const mode = this.getAttribute('mode') || 'points';
      const cameraDistance = parseFloat(this.getAttribute('camera-distance') || '100');
      const backgroundColor = this.getAttribute('background-color') || '#000000';

      // Get SVG content
      let svgContent = svgAttr;
      if (!svgContent && src) {
        const response = await fetch(src);
        svgContent = await response.text();
      }

      if (!svgContent) {
        throw new Error('No SVG content provided');
      }

      // Note: In production, import these modules properly
      // For now, this is a template - actual implementation would need bundling
      
      // Setup Three.js scene
      this.scene = new THREE.Scene();

      // Setup camera
      this.camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      );
      this.camera.position.z = cameraDistance;

      // Setup renderer
      this.renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
      });
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setClearColor(backgroundColor, 1);
      container.appendChild(this.renderer.domElement);

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 10);
      this.scene.add(directionalLight);

      // Create simple cube as placeholder
      // In production, this would use the actual geometry builder
      const geometry = new THREE.BoxGeometry(20, 20, 20);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00,
        wireframe: mode === 'wireframe'
      });
      this.object = new THREE.Mesh(geometry, material);
      this.scene.add(this.object);

      // Animation loop
      const animate = () => {
        if (!this.renderer || !this.scene || !this.camera) return;

        this.animationId = requestAnimationFrame(animate.bind(this));

        if (autoRotate && this.object) {
          this.object.rotation.x += rotationSpeed * 0.5;
          this.object.rotation.y += rotationSpeed;
        }

        this.renderer.render(this.scene, this.camera);
      };

      animate();

      // Remove loading indicator
      if (loading) {
        loading.remove();
      }

    } catch (err) {
      if (loading) {
        loading.remove();
      }
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error';
      errorDiv.textContent = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
      container.appendChild(errorDiv);
    }
  }

  private cleanup() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      const canvas = this.renderer.domElement;
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      this.renderer = null;
    }

    if (this.object) {
      if (this.object instanceof THREE.Mesh || this.object instanceof THREE.Points) {
        this.object.geometry.dispose();
        if (this.object.material instanceof THREE.Material) {
          this.object.material.dispose();
        }
      }
      this.object = null;
    }

    this.scene = null;
    this.camera = null;
  }
}

// Register the custom element
if (typeof window !== 'undefined' && !customElements.get('ascii-3d')) {
  customElements.define('ascii-3d', ASCII3DElement);
}

export default ASCII3DElement;
