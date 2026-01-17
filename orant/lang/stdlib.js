/**
 * Orant Lang Standard Library
 * Runtime classes and utilities for executing compiled lang code
 */

/**
 * Entity - Represents a spiritual being or object in the animation
 */
export class Entity {
  constructor(name, type, properties = {}) {
    this.name = name;
    this.type = type;
    this.properties = properties;

    // State
    this.position = properties.position || { x: 0, y: 0 };
    this.opacity = 1;
    this.rotation = 0;
    this.scale = 1;
    this.glow = 0;
    this.visible = false;
  }

  // Update entity state
  update(deltaTime) {
    // Override in specific entity types
  }

  // Render entity to canvas
  render(ctx, frame) {
    if (!this.visible) return;

    ctx.save();

    // Apply transformations
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scale, this.scale);
    ctx.globalAlpha = this.opacity;

    // Render based on type
    this.renderByType(ctx);

    // Add glow effect
    if (this.glow > 0) {
      ctx.shadowBlur = this.glow * 20;
      ctx.shadowColor = this.properties.color || '#FFFFFF';
    }

    ctx.restore();
  }

  renderByType(ctx) {
    const color = this.properties.color || '#FFFFFF';

    switch (this.type.toLowerCase()) {
      case 'son':
        this.renderSon(ctx, color);
        break;
      case 'angel':
        this.renderAngel(ctx, color);
        break;
      case 'island':
        this.renderIsland(ctx, color);
        break;
      case 'datasphere':
        this.renderDataSphere(ctx, color);
        break;
      default:
        this.renderDefault(ctx, color);
    }
  }

  renderSon(ctx, color) {
    // Translucent humanoid form
    ctx.fillStyle = color;
    ctx.globalAlpha = this.opacity * 0.7;

    // Simple humanoid shape
    ctx.beginPath();
    ctx.arc(0, -30, 20, 0, Math.PI * 2); // Head
    ctx.fill();

    ctx.fillRect(-10, -10, 20, 40); // Body

    // Glow aura
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 60);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(-60, -60, 120, 120);
  }

  renderAngel(ctx, color) {
    // Six-winged angel
    ctx.fillStyle = color;
    ctx.globalAlpha = this.opacity * 0.8;

    // Wings
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const wingX = Math.cos(angle) * 50;
      const wingY = Math.sin(angle) * 50;

      ctx.save();
      ctx.translate(wingX, wingY);
      ctx.rotate(angle);

      // Wing shape
      ctx.beginPath();
      ctx.ellipse(0, 0, 30, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Body with flywheel
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();

    // Flywheel
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.stroke();
  }

  renderIsland(ctx, color) {
    // Floating island
    ctx.fillStyle = color;
    ctx.globalAlpha = this.opacity * 0.6;

    ctx.beginPath();
    ctx.ellipse(0, 0, 80, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(-100, -100, 200, 200);
  }

  renderDataSphere(ctx, color) {
    // Glowing data sphere
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
  }

  renderDefault(ctx, color) {
    // Default rendering
    ctx.fillStyle = color;
    ctx.globalAlpha = this.opacity;
    ctx.fillRect(-20, -20, 40, 40);
  }
}

/**
 * Sequence - A series of animated frames
 */
export class Sequence {
  constructor(name, config) {
    this.name = name;
    this.duration = this.parseDuration(config.duration || '3s');
    this.frames = config.frames || [];
    this.currentFrame = 0;
  }

  parseDuration(duration) {
    if (typeof duration === 'string' && duration.endsWith('s')) {
      return parseFloat(duration) * 1000; // Convert to milliseconds
    }
    return duration;
  }

  // Execute actions for a specific frame
  executeFrame(frameNumber, runtime) {
    const frame = this.frames.find(f => f.frameNumber === frameNumber);
    if (!frame) return;

    for (const action of frame.actions) {
      this.executeAction(action, runtime);
    }
  }

  executeAction(action, runtime) {
    const entity = runtime.getEntity(action.entity);
    if (!entity) {
      console.warn(`Entity ${action.entity} not found`);
      return;
    }

    switch (action.type) {
      case 'move':
        this.applyMove(entity, action.params);
        break;
      case 'appear':
        this.applyAppear(entity, action.params);
        break;
      case 'float':
        this.applyFloat(entity, action.params);
        break;
      case 'spin':
        this.applySpin(entity, action.params);
        break;
      case 'fade':
        this.applyFade(entity, action.params);
        break;
      case 'glow':
        this.applyGlow(entity, action.params);
        break;
      case 'merge':
        this.applyMerge(entity, action.params, runtime);
        break;
      case 'emit':
        this.applyEmit(entity, action.params, runtime);
        break;
    }
  }

  applyMove(entity, params) {
    const { from, to } = params;
    if (from) entity.position = this.resolvePosition(from);
    if (to) {
      const targetPos = this.resolvePosition(to);
      // Animate to target (simplified - immediate for now)
      entity.position = targetPos;
    }
  }

  applyAppear(entity, params) {
    entity.visible = true;
    if (params.position) {
      entity.position = this.resolvePosition(params.position);
    }
  }

  applyFloat(entity, params) {
    entity.visible = true;
    // Apply gentle floating motion (can be enhanced with sin wave)
  }

  applySpin(entity, params) {
    const speed = params.direction === 'clockwise' ? 0.1 : -0.1;
    entity.rotation += speed;
  }

  applyFade(entity, params) {
    if (params.direction === 'in') {
      entity.opacity = 1;
    } else {
      entity.opacity = 0;
    }
  }

  applyGlow(entity, params) {
    entity.glow = params.intensity === 'bright' ? 2 : 1;
  }

  applyMerge(entity, params, runtime) {
    const target = runtime.getEntity(params.target);
    if (target) {
      // Move towards target and fade
      entity.position = target.position;
      entity.opacity *= 0.5;
    }
  }

  applyEmit(entity, params, runtime) {
    const { emitType, count } = params;

    // Create particle entities
    for (let i = 0; i < count; i++) {
      const particle = new Entity(`particle_${Date.now()}_${i}`, 'particle', {
        color: entity.properties.color,
        position: { ...entity.position }
      });
      particle.visible = true;
      particle.scale = 0.3;

      runtime.addEntity(particle);
    }
  }

  resolvePosition(pos) {
    if (pos.x !== undefined && pos.y !== undefined) {
      return pos;
    }

    // Named positions
    switch (pos.name?.toLowerCase()) {
      case 'center':
        return { x: 960, y: 540 }; // Assuming 1920x1080
      case 'left':
        return { x: 400, y: 540 };
      case 'right':
        return { x: 1520, y: 540 };
      default:
        return { x: 0, y: 0 };
    }
  }
}

/**
 * Renderer - Handles rendering to canvas
 */
export class Renderer {
  constructor(config) {
    this.config = config;
    this.canvas = null;
    this.ctx = null;
    this.currentFrame = 0;
  }

  initialize(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Parse canvas size
    if (this.config.canvas) {
      const [width, height] = this.config.canvas.split('x').map(Number);
      this.canvas.width = width || 1920;
      this.canvas.height = height || 1080;
    }
  }

  render(runtime, deltaTime) {
    if (!this.ctx) return;

    // Clear canvas
    this.ctx.fillStyle = '#1A1A2E'; // Cosmic void background
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render stars
    this.renderStars();

    // Render all entities
    for (const entity of runtime.entities.values()) {
      entity.render(this.ctx, this.currentFrame);
    }

    this.currentFrame++;
  }

  renderStars() {
    this.ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      const size = Math.random() * 2;

      this.ctx.globalAlpha = Math.random() * 0.5 + 0.3;
      this.ctx.fillRect(x, y, size, size);
    }
    this.ctx.globalAlpha = 1;
  }
}

/**
 * OrantRuntime - Main runtime system
 */
export class OrantRuntime {
  constructor() {
    this.entities = new Map();
    this.sequences = new Map();
    this.renderers = [];
    this.isRunning = false;
    this.lastTime = 0;
  }

  addEntity(entity) {
    this.entities.set(entity.name, entity);
  }

  getEntity(name) {
    return this.entities.get(name);
  }

  addSequence(sequence) {
    this.sequences.set(sequence.name, sequence);
  }

  getSequence(name) {
    return this.sequences.get(name);
  }

  render(renderer) {
    this.renderers.push(renderer);
  }

  start(canvas) {
    this.isRunning = true;

    // Initialize renderers
    if (canvas) {
      for (const renderer of this.renderers) {
        renderer.initialize(canvas);
      }
    }

    // Start animation loop
    this.lastTime = performance.now();
    this.loop();
  }

  loop() {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Update entities
    for (const entity of this.entities.values()) {
      entity.update(deltaTime);
    }

    // Execute sequences
    for (const sequence of this.sequences.values()) {
      const frame = Math.floor(currentTime / 100) % 120; // Simple frame calculation
      sequence.executeFrame(frame, this);
    }

    // Render
    for (const renderer of this.renderers) {
      renderer.render(this, deltaTime);
    }

    requestAnimationFrame(() => this.loop());
  }

  stop() {
    this.isRunning = false;
  }
}
