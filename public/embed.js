/**
 * ASCII3D Embed Script
 * Simple script for embedding ASCII 3D components on any website
 * 
 * Usage:
 * <script src="https://yoursite.com/embed.js"></script>
 * <div data-ascii-3d="logo.svg" data-depth="10" data-density="0.6"></div>
 */

(function() {
  'use strict';

  // Check if already loaded
  if (window.ASCII3D) {
    return;
  }

  // Configuration
  const CONFIG = {
    cdnBase: 'https://unpkg.com/three@0.160.0/build/three.module.js',
    defaultDepth: 10,
    defaultDensity: 0.6,
    defaultRotate: true,
    defaultRotationSpeed: 0.01,
    defaultMode: 'points',
    defaultWidth: '100%',
    defaultHeight: '400px',
    defaultBackground: '#000000'
  };

  // ASCII3D Class
  class ASCII3D {
    constructor(element, options = {}) {
      this.element = element;
      this.options = {
        src: options.src || element.getAttribute('data-ascii-3d'),
        svg: options.svg,
        depth: parseFloat(options.depth || element.getAttribute('data-depth') || CONFIG.defaultDepth),
        density: parseFloat(options.density || element.getAttribute('data-density') || CONFIG.defaultDensity),
        rotate: options.rotate !== undefined ? options.rotate : (element.getAttribute('data-rotate') === 'true' || CONFIG.defaultRotate),
        rotationSpeed: parseFloat(options.rotationSpeed || element.getAttribute('data-rotation-speed') || CONFIG.defaultRotationSpeed),
        mode: options.mode || element.getAttribute('data-mode') || CONFIG.defaultMode,
        width: options.width || element.getAttribute('data-width') || CONFIG.defaultWidth,
        height: options.height || element.getAttribute('data-height') || CONFIG.defaultHeight,
        backgroundColor: options.backgroundColor || element.getAttribute('data-background-color') || CONFIG.defaultBackground
      };

      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.object = null;
      this.animationId = null;

      this.init();
    }

    async init() {
      try {
        // Create container
        this.container = document.createElement('div');
        this.container.style.width = this.options.width;
        this.container.style.height = this.options.height;
        this.container.style.position = 'relative';
        this.container.style.backgroundColor = this.options.backgroundColor;
        this.element.appendChild(this.container);

        // Show loading
        const loading = document.createElement('div');
        loading.textContent = 'Loading...';
        loading.style.position = 'absolute';
        loading.style.top = '50%';
        loading.style.left = '50%';
        loading.style.transform = 'translate(-50%, -50%)';
        loading.style.color = '#fff';
        loading.style.fontFamily = 'monospace';
        this.container.appendChild(loading);

        // Load Three.js if not already loaded
        if (!window.THREE) {
          await this.loadThreeJS();
        }

        // Get SVG content
        let svgContent = this.options.svg;
        if (!svgContent && this.options.src) {
          const response = await fetch(this.options.src);
          svgContent = await response.text();
        }

        if (!svgContent) {
          throw new Error('No SVG content provided');
        }

        // Initialize Three.js scene
        await this.initScene(svgContent);

        // Remove loading
        loading.remove();

        // Start animation
        this.animate();

      } catch (error) {
        this.showError(error.message);
      }
    }

    async loadThreeJS() {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/three@0.160.0/build/three.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Three.js'));
        document.head.appendChild(script);
      });
    }

    async initScene(svgContent) {
      const THREE = window.THREE;

      // Setup scene
      this.scene = new THREE.Scene();

      // Setup camera
      this.camera = new THREE.PerspectiveCamera(
        75,
        this.container.clientWidth / this.container.clientHeight,
        0.1,
        1000
      );
      this.camera.position.z = 100;

      // Setup renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setClearColor(this.options.backgroundColor, 1);
      this.container.appendChild(this.renderer.domElement);

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 10);
      this.scene.add(directionalLight);

      // Create simple placeholder object
      // In production, this would parse the SVG and create proper geometry
      const geometry = new THREE.BoxGeometry(20, 20, 20);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00,
        wireframe: this.options.mode === 'wireframe'
      });
      this.object = new THREE.Mesh(geometry, material);
      this.scene.add(this.object);

      // Handle resize
      window.addEventListener('resize', this.onResize.bind(this));
    }

    animate() {
      if (!this.renderer || !this.scene || !this.camera) return;

      this.animationId = requestAnimationFrame(this.animate.bind(this));

      // Auto-rotate
      if (this.options.rotate && this.object) {
        this.object.rotation.x += this.options.rotationSpeed * 0.5;
        this.object.rotation.y += this.options.rotationSpeed;
      }

      this.renderer.render(this.scene, this.camera);
    }

    onResize() {
      if (!this.camera || !this.renderer) return;

      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    showError(message) {
      const error = document.createElement('div');
      error.textContent = `Error: ${message}`;
      error.style.position = 'absolute';
      error.style.top = '50%';
      error.style.left = '50%';
      error.style.transform = 'translate(-50%, -50%)';
      error.style.color = '#ff0000';
      error.style.fontFamily = 'monospace';
      error.style.textAlign = 'center';
      error.style.padding = '20px';
      this.container.appendChild(error);
    }

    destroy() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }

      if (this.renderer) {
        this.renderer.dispose();
        if (this.renderer.domElement.parentNode) {
          this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
      }

      if (this.object) {
        if (this.object.geometry) this.object.geometry.dispose();
        if (this.object.material) this.object.material.dispose();
      }

      window.removeEventListener('resize', this.onResize.bind(this));
    }
  }

  // Auto-initialize elements
  function autoInit() {
    const elements = document.querySelectorAll('[data-ascii-3d]');
    elements.forEach(element => {
      if (!element._ascii3d) {
        element._ascii3d = new ASCII3D(element);
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // Expose API
  window.ASCII3D = ASCII3D;

  // Auto-reinitialize on dynamic content
  const observer = new MutationObserver(autoInit);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();
