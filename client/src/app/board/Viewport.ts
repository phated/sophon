import UIEmitter, { UIEmitterEvent } from '../../utils/UIEmitter';
import { WorldCoords, CanvasCoords, distL2 } from '../../utils/Coordinates';
import autoBind from 'auto-bind';
import AbstractUIManager from './AbstractUIManager';
import { ExploredChunkData, Planet } from '../../_types/global/GlobalTypes';

class Viewport {
  // The sole listener for events from Canvas
  // Handles panning and zooming
  // Handles reports of user interaction in canvas coords, transforms these events to world coords and filters when necessary,
  // and sends events up to GameUIManager

  static instance: Viewport | null;

  centerWorldCoords: WorldCoords;
  widthInWorldUnits: number;
  heightInWorldUnits: number;
  viewportWidth: number;
  viewportHeight: number;
  isPanning = false;
  mouseLastCoords: CanvasCoords | null;
  canvas: HTMLCanvasElement;

  isFirefox: boolean;

  gameUIManager: AbstractUIManager;

  mousedownCoords: CanvasCoords | null = null;

  private constructor(
    gameUIManager: AbstractUIManager,
    centerWorldCoords: WorldCoords,
    widthInWorldUnits: number,
    viewportWidth: number,
    viewportHeight: number,
    canvas: HTMLCanvasElement
  ) {
    this.gameUIManager = gameUIManager;
    this.gameUIManager.setDetailLevel(this.getDetailLevel());

    // each of these is measured relative to the world coordinate system
    this.centerWorldCoords = centerWorldCoords;
    this.widthInWorldUnits = widthInWorldUnits;
    this.heightInWorldUnits =
      (widthInWorldUnits * viewportHeight) / viewportWidth;
    // while all of the above are in the world coordinate system, the below are in the page coordinate system
    this.viewportWidth = viewportWidth; // width / height
    this.viewportHeight = viewportHeight;

    this.mouseLastCoords = centerWorldCoords;
    this.canvas = canvas;

    this.isFirefox = navigator.userAgent.indexOf('Firefox') > 0;

    this.isPanning = false;
    autoBind(this);
  }

  static getInstance(): Viewport {
    if (!Viewport.instance) {
      throw new Error('Attempted to get Viewport object before initialized');
    }

    return Viewport.instance;
  }

  static destroyInstance(): void {
    const uiEmitter = UIEmitter.getInstance();
    const viewport = Viewport.instance;

    if (viewport) {
      uiEmitter
        .removeListener(UIEmitterEvent.CanvasMouseDown, viewport.onMouseDown)
        .removeListener(UIEmitterEvent.CanvasMouseMove, viewport.onMouseMove)
        .removeListener(UIEmitterEvent.CanvasMouseUp, viewport.onMouseUp)
        .removeListener(UIEmitterEvent.CanvasMouseOut, viewport.onMouseOut)
        .removeListener(UIEmitterEvent.CanvasScroll, viewport.onScroll)
        .removeListener(UIEmitterEvent.WindowResize, viewport.onWindowResize)
        .removeListener(UIEmitterEvent.CenterPlanet, viewport.centerPlanet)
        .removeListener(UIEmitterEvent.ZoomIn, viewport.zoomIn)
        .removeListener(UIEmitterEvent.ZoomOut, viewport.zoomOut);
    }
    Viewport.instance = null;
  }

  static initialize(
    gameUIManager: AbstractUIManager,
    widthInWorldUnits: number,
    canvas: HTMLCanvasElement
  ): Viewport {
    const uiEmitter = UIEmitter.getInstance();

    const homeCoords = gameUIManager.getHomeCoords();

    const viewport = new Viewport(
      gameUIManager,
      homeCoords,
      widthInWorldUnits,
      canvas.width,
      canvas.height,
      canvas
    );

    uiEmitter
      .on(UIEmitterEvent.CanvasMouseDown, viewport.onMouseDown)
      .on(UIEmitterEvent.CanvasMouseMove, viewport.onMouseMove)
      .on(UIEmitterEvent.CanvasMouseUp, viewport.onMouseUp)
      .on(UIEmitterEvent.CanvasMouseOut, viewport.onMouseOut)
      .on(UIEmitterEvent.CanvasScroll, viewport.onScroll)
      .on(UIEmitterEvent.WindowResize, viewport.onWindowResize)
      .on(UIEmitterEvent.CenterPlanet, viewport.centerPlanet)
      .on(UIEmitterEvent.ZoomIn, viewport.zoomIn)
      .on(UIEmitterEvent.ZoomOut, viewport.zoomOut);

    Viewport.instance = viewport;

    return viewport;
  }

  centerPlanet(planet: Planet | null): void {
    if (!planet) return;
    const loc = this.gameUIManager.getLocationOfPlanet(planet.locationId);
    if (!loc) return;
    const { x, y } = loc.coords;
    this.centerWorldCoords = { x, y };
  }

  centerChunk(chunk: ExploredChunkData): void {
    const { bottomLeft, sideLength } = chunk.chunkFootprint;
    this.centerWorldCoords = {
      x: bottomLeft.x + sideLength / 2,
      y: bottomLeft.y + sideLength / 2,
    };
  }

  zoomIn(): void {
    this.onScroll(-300, true);
  }

  zoomOut(): void {
    this.onScroll(300, true);
  }

  // Event handlers
  onMouseDown(canvasCoords: CanvasCoords) {
    this.mousedownCoords = canvasCoords;

    const uiManager = this.gameUIManager;
    const uiEmitter = UIEmitter.getInstance();

    const worldCoords = this.canvasToWorldCoords(canvasCoords);
    if (!uiManager.isOverOwnPlanet(worldCoords)) {
      this.isPanning = true;
    }
    uiEmitter.emit(UIEmitterEvent.WorldMouseDown, worldCoords);
    this.mouseLastCoords = canvasCoords;
  }

  onMouseMove(canvasCoords: CanvasCoords) {
    const uiEmitter = UIEmitter.getInstance();

    if (this.isPanning && this.mouseLastCoords) {
      // if panning, don't need to emit mouse move event
      const dx = canvasCoords.x - this.mouseLastCoords.x;
      const dy = canvasCoords.y - this.mouseLastCoords.y;
      this.centerWorldCoords.x -= dx * this.scale();
      this.centerWorldCoords.y -= -1 * dy * this.scale();
    } else {
      const worldCoords = this.canvasToWorldCoords(canvasCoords);
      uiEmitter.emit(UIEmitterEvent.WorldMouseMove, worldCoords);
    }
    this.mouseLastCoords = canvasCoords;
  }

  onMouseUp(canvasCoords: CanvasCoords) {
    const uiEmitter = UIEmitter.getInstance();

    const worldCoords = this.canvasToWorldCoords(canvasCoords);
    if (
      this.mousedownCoords &&
      distL2(canvasCoords, this.mousedownCoords) < 3
    ) {
      uiEmitter.emit(UIEmitterEvent.WorldMouseClick, worldCoords);
    }

    this.mousedownCoords = null;
    uiEmitter.emit(UIEmitterEvent.WorldMouseUp, worldCoords);
    this.isPanning = false;
    this.mouseLastCoords = canvasCoords;
  }

  onMouseOut() {
    const uiEmitter = UIEmitter.getInstance();

    uiEmitter.emit(UIEmitterEvent.WorldMouseOut);
    this.isPanning = false;
    this.mouseLastCoords = null;
  }

  onScroll(deltaY: number, forceZoom = false) {
    if (this.mouseLastCoords !== null || forceZoom) {
      let mouseWorldCoords = this.centerWorldCoords;
      if (this.mouseLastCoords) {
        mouseWorldCoords = this.canvasToWorldCoords(this.mouseLastCoords);
      }
      const centersDiff = {
        x: this.centerWorldCoords.x - mouseWorldCoords.x,
        y: this.centerWorldCoords.y - mouseWorldCoords.y,
      };
      const base = this.isFirefox ? 1.005 : 1.0006;
      const newCentersDiff = {
        x: centersDiff.x * base ** deltaY,
        y: centersDiff.y * base ** deltaY,
      };
      const newCenter = {
        x: mouseWorldCoords.x + newCentersDiff.x,
        y: mouseWorldCoords.y + newCentersDiff.y,
      };
      this.centerWorldCoords.x = newCenter.x;
      this.centerWorldCoords.y = newCenter.y;

      const newWidth = this.widthInWorldUnits * base ** deltaY;
      this.setWorldWidth(newWidth);
      this.gameUIManager.setDetailLevel(this.getDetailLevel());
    }
  }

  onWindowResize() {
    this.viewportHeight = this.canvas.height;
    this.viewportWidth = this.canvas.width;
  }

  // Camera utility functions
  scale(): number {
    return this.widthInWorldUnits / this.viewportWidth;
  }

  canvasToWorldCoords(canvasCoords: CanvasCoords): WorldCoords {
    const worldX = this.canvasToWorldX(canvasCoords.x);
    const worldY = this.canvasToWorldY(canvasCoords.y);
    return { x: worldX, y: worldY };
  }

  worldToCanvasCoords(worldCoords: WorldCoords): CanvasCoords {
    const canvasX = this.worldToCanvasX(worldCoords.x);
    const canvasY = this.worldToCanvasY(worldCoords.y);
    return { x: canvasX, y: canvasY };
  }

  worldToCanvasDist(d: number): number {
    return d / this.scale();
  }

  canvasToWorldDist(d: number): number {
    return d * this.scale();
  }

  worldToCanvasX(x: number): number {
    return (
      (x - this.centerWorldCoords.x) / this.scale() + this.viewportWidth / 2
    );
  }

  canvasToWorldX(x: number): number {
    return (
      (x - this.viewportWidth / 2) * this.scale() + this.centerWorldCoords.x
    );
  }

  worldToCanvasY(y: number): number {
    return (
      (-1 * (y - this.centerWorldCoords.y)) / this.scale() +
      this.viewportHeight / 2
    );
  }

  canvasToWorldY(y: number): number {
    return (
      -1 * (y - this.viewportHeight / 2) * this.scale() +
      this.centerWorldCoords.y
    );
  }

  isInOrAroundViewport(coords: WorldCoords): boolean {
    if (
      Math.abs(coords.x - this.centerWorldCoords.x) >
      0.6 * this.widthInWorldUnits
    ) {
      return false;
    }
    if (
      Math.abs(coords.y - this.centerWorldCoords.y) >
      0.6 * this.heightInWorldUnits
    ) {
      return false;
    }
    return true;
  }

  intersectsViewport(chunk: ExploredChunkData): boolean {
    const chunkLeft = chunk.chunkFootprint.bottomLeft.x;
    const chunkRight = chunkLeft + chunk.chunkFootprint.sideLength;
    const chunkBottom = chunk.chunkFootprint.bottomLeft.y;
    const chunkTop = chunkBottom + chunk.chunkFootprint.sideLength;

    const viewportLeft = this.centerWorldCoords.x - this.widthInWorldUnits / 2;
    const viewportRight = this.centerWorldCoords.x + this.widthInWorldUnits / 2;
    const viewportBottom =
      this.centerWorldCoords.y - this.heightInWorldUnits / 2;
    const viewportTop = this.centerWorldCoords.y + this.heightInWorldUnits / 2;
    if (
      chunkLeft > viewportRight ||
      chunkRight < viewportLeft ||
      chunkBottom > viewportTop ||
      chunkTop < viewportBottom
    ) {
      return false;
    }
    return true;
  }

  private setWorldWidth(width: number): void {
    // world scale width
    this.widthInWorldUnits = width;
    this.heightInWorldUnits =
      (width * this.viewportHeight) / this.viewportWidth;
  }

  private getDetailLevel(): number {
    if (this.widthInWorldUnits > 65536) {
      return 5;
    }
    if (this.widthInWorldUnits > 32768) {
      return 4;
    }
    if (this.widthInWorldUnits > 16384) {
      return 3;
    }
    if (this.widthInWorldUnits > 8192) {
      return 2;
    }
    if (this.widthInWorldUnits > 4096) {
      return 1;
    }
    if (this.widthInWorldUnits > 2048) {
      return 0;
    }
    if (this.widthInWorldUnits > 1024) {
      return -1;
    }
    if (this.widthInWorldUnits > 512) {
      return -2;
    }
    return -3;
  }
}

export default Viewport;
