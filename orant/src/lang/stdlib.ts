/**
 * Orant Lang Standard Library (TypeScript)
 * Runtime classes and utilities for executing compiled lang code
 */

export interface EntityProperties {
  color?: string;
  position?: Coordinate;
  glow?: string;
  form?: string;
  aspect?: string;
  wings?: number;
  flywheel?: string;
  type?: string;
  size?: number;
  [key: string]: any;
}

export interface Coordinate {
  x?: number;
  y?: number;
  name?: string;
}

export interface ActionConfig {
  type: string;
  entity: string;
  params: Record<string, any>;
}

export interface FrameConfig {
  frameNumber: number;
  actions: ActionConfig[];
}

export interface SequenceConfig {
  duration?: string;
  frames?: FrameConfig[];
  [key: string]: any;
}

export interface RendererConfig {
  sceneName?: string;
  sequence?: Sequence;
  background?: string;
  invoke?: Sequence;
  canvas?: string;
  [key: string]: any;
}

/**
 * Entity - Represents a spiritual being or object in the animation
 */
export class Entity {
  public name: string;
  public type: string;
  public properties: EntityProperties;

  // State
  public position: { x: number; y: number };
  public opacity: number = 1;
  public rotation: number = 0;
  public scale: number = 1;
  public glow: number = 0;
  public visible: boolean = false;

  constructor(name: string, type: string, properties: EntityProperties = {}) {
    this.name = name;
    this.type = type;
    this.properties = properties;

    // Initialize position
    const pos = properties.position || { x: 0, y: 0 };
    this.position = {
      x: (pos as any).x || 0,
      y: (pos as any).y || 0
    };
  }

  /**
   * Update entity state
   */
  public update(deltaTime: number): void {
    // Override in specific entity types
  }

  /**
   * Render entity to canvas
   */
  public render(ctx: CanvasRenderingContext2D, frame: number): void {
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

  private renderByType(ctx: CanvasRenderingContext2D): void {
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

  private renderSon(ctx: CanvasRenderingContext2D, color: string): void {
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

  private renderAngel(ctx: CanvasRenderingContext2D, color: string): void {
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

  private renderIsland(ctx: CanvasRenderingContext2D, color: string): void {
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

  private renderDataSphere(ctx: CanvasRenderingContext2D, color: string): void {
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

  private renderDefault(ctx: CanvasRenderingContext2D, color: string): void {
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
  public name: string;
  public duration: number;
  public frames: FrameConfig[];
  public currentFrame: number = 0;

  constructor(name: string, config: SequenceConfig) {
    this.name = name;
    this.duration = this.parseDuration(config.duration || '3s');
    this.frames = config.frames || [];
  }

  private parseDuration(duration: string | number): number {
    if (typeof duration === 'string' && duration.endsWith('s')) {
      return parseFloat(duration) * 1000; // Convert to milliseconds
    }
    return duration as number;
  }

  /**
   * Execute actions for a specific frame
   */
  public executeFrame(frameNumber: number, runtime: OrantRuntime): void {
    const frame = this.frames.find(f => f.frameNumber === frameNumber);
    if (!frame) return;

    for (const action of frame.actions) {
      this.executeAction(action, runtime);
    }
  }

  private executeAction(action: ActionConfig, runtime: OrantRuntime): void {
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

  private applyMove(entity: Entity, params: any): void {
    const { from, to } = params;
    if (from) entity.position = this.resolvePosition(from);
    if (to) {
      const targetPos = this.resolvePosition(to);
      // Animate to target (simplified - immediate for now)
      entity.position = targetPos;
    }
  }

  private applyAppear(entity: Entity, params: any): void {
    entity.visible = true;
    if (params.position) {
      entity.position = this.resolvePosition(params.position);
    }
  }

  private applyFloat(entity: Entity, params: any): void {
    entity.visible = true;
    // Apply gentle floating motion (can be enhanced with sin wave)
  }

  private applySpin(entity: Entity, params: any): void {
    const speed = params.direction === 'clockwise' ? 0.1 : -0.1;
    entity.rotation += speed;
  }

  private applyFade(entity: Entity, params: any): void {
    if (params.direction === 'in') {
      entity.opacity = 1;
    } else {
      entity.opacity = 0;
    }
  }

  private applyGlow(entity: Entity, params: any): void {
    entity.glow = params.intensity === 'bright' ? 2 : 1;
  }

  private applyMerge(entity: Entity, params: any, runtime: OrantRuntime): void {
    const target = runtime.getEntity(params.target);
    if (target) {
      // Move towards target and fade
      entity.position = { ...target.position };
      entity.opacity *= 0.5;
    }
  }

  private applyEmit(entity: Entity, params: any, runtime: OrantRuntime): void {
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

  private resolvePosition(pos: any): { x: number; y: number } {
    if (pos.x !== undefined && pos.y !== undefined) {
      return { x: pos.x, y: pos.y };
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
  public config: RendererConfig;
  public canvas: HTMLCanvasElement | null = null;
  public ctx: CanvasRenderingContext2D | null = null;
  public currentFrame: number = 0;

  constructor(config: RendererConfig) {
    this.config = config;
  }

  public initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = ctx;

    // Parse canvas size
    if (this.config.canvas) {
      const [width, height] = this.config.canvas.split('x').map(Number);
      this.canvas.width = width || 1920;
      this.canvas.height = height || 1080;
    }
  }

  public render(runtime: OrantRuntime, deltaTime: number): void {
    if (!this.ctx || !this.canvas) return;

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

  private renderStars(): void {
    if (!this.ctx || !this.canvas) return;

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
  public entities: Map<string, Entity> = new Map();
  public sequences: Map<string, Sequence> = new Map();
  public renderers: Renderer[] = [];
  public isRunning: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;

  public addEntity(entity: Entity): void {
    this.entities.set(entity.name, entity);
  }

  public getEntity(name: string): Entity | undefined {
    return this.entities.get(name);
  }

  public addSequence(sequence: Sequence): void {
    this.sequences.set(sequence.name, sequence);
  }

  public getSequence(name: string): Sequence | undefined {
    return this.sequences.get(name);
  }

  public render(renderer: Renderer): void {
    this.renderers.push(renderer);
  }

  public start(canvas?: HTMLCanvasElement): void {
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

  private loop = (): void => {
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

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
