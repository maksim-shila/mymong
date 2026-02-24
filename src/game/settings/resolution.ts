export type GameResolution = {
  width: number;
  height: number;
};

export type ResolutionOption = GameResolution & {
  label: string;
};

export type ResolutionViewport = {
  zoom: number;
  worldWidth: number;
  worldHeight: number;
  viewX: number;
  viewY: number;
  viewWidth: number;
  viewHeight: number;
};

const RESOLUTION_STORAGE_KEY = 'mymong.resolution';
const VSYNC_STORAGE_KEY = 'mymong.vsync';

export const BASE_WORLD_WIDTH = 1600;
export const BASE_WORLD_HEIGHT = 1200;

export const RESOLUTION_OPTIONS: readonly ResolutionOption[] = [
  { width: 800, height: 600, label: '800 x 600' },
  { width: 1200, height: 900, label: '1200 x 900' },
  { width: 1600, height: 1200, label: '1600 x 1200' },
  { width: 1920, height: 1440, label: '1920 x 1440' },
  { width: 2560, height: 1440, label: '2560 x 1440' },
  { width: 3200, height: 1800, label: '3200 x 1800' },
  { width: 3840, height: 2160, label: '3840 x 2160 (4K)' },
];

export const DEFAULT_RESOLUTION: ResolutionOption = RESOLUTION_OPTIONS[6];

export const loadResolution = (): ResolutionOption => {
  try {
    const raw = localStorage.getItem(RESOLUTION_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_RESOLUTION;
    }

    const parsed = JSON.parse(raw) as Partial<GameResolution>;
    const matched = RESOLUTION_OPTIONS.find(
      (option) => option.width === parsed.width && option.height === parsed.height,
    );
    return matched ?? DEFAULT_RESOLUTION;
  } catch {
    return DEFAULT_RESOLUTION;
  }
};

export const saveResolution = (resolution: GameResolution): void => {
  try {
    localStorage.setItem(RESOLUTION_STORAGE_KEY, JSON.stringify(resolution));
  } catch {
    // Ignore storage write failures in restricted environments.
  }
};

export const loadVSyncEnabled = (): boolean => {
  try {
    const raw = localStorage.getItem(VSYNC_STORAGE_KEY);
    if (raw === null) {
      return true;
    }
    return raw === '1';
  } catch {
    return true;
  }
};

export const saveVSyncEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(VSYNC_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // Ignore storage write failures in restricted environments.
  }
};

export const getResolutionZoom = (width: number, height: number): number => {
  const zoomX = width / BASE_WORLD_WIDTH;
  const zoomY = height / BASE_WORLD_HEIGHT;
  return Math.min(zoomX, zoomY);
};

export const getResolutionViewport = (width: number, height: number): ResolutionViewport => {
  const zoom = getResolutionZoom(width, height);
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
};

export const applyResolutionCamera = (scene: Phaser.Scene): ResolutionViewport => {
  const width = scene.scale.gameSize.width;
  const height = scene.scale.gameSize.height;
  const viewport = getResolutionViewport(width, height);

  scene.cameras.main.setOrigin(0, 0);
  scene.cameras.main.setZoom(viewport.zoom);
  scene.cameras.main.setScroll(viewport.viewX, viewport.viewY);
  return viewport;
};
