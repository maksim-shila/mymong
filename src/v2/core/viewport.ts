const BASE_WORLD_WIDTH = 1600;
const BASE_WORLD_HEIGHT = 1200;

export type ResolutionViewport = {
  zoom: number;
  worldWidth: number;
  worldHeight: number;
  viewX: number;
  viewY: number;
  viewWidth: number;
  viewHeight: number;
};

export function applyViewportToCamera(scene: Phaser.Scene): ResolutionViewport {
  const { width, height } = scene.scale.gameSize;

  const viewport = getViewport(width, height);

  const cam = scene.cameras.main;

  cam.setOrigin(0, 0);
  cam.setZoom(viewport.zoom);
  cam.setScroll(viewport.viewX, viewport.viewY);

  return viewport;
}

function getViewport(width: number, height: number): ResolutionViewport {
  const zoomX = width / BASE_WORLD_WIDTH;
  const zoomY = height / BASE_WORLD_HEIGHT;
  const zoom = Math.min(zoomX, zoomY);

  const viewWidth = width / zoom;
  const viewHeight = height / zoom;

  const viewX = (BASE_WORLD_WIDTH - viewWidth) / 2;
  const viewY = (BASE_WORLD_HEIGHT - viewHeight) / 2;

  return {
    zoom,
    worldWidth: BASE_WORLD_WIDTH,
    worldHeight: BASE_WORLD_HEIGHT,
    viewX,
    viewY,
    viewWidth,
    viewHeight,
  };
}
