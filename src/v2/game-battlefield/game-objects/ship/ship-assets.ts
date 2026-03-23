import shipImage from '@assets/image/ship.png';

export const ShipAssets = {
  SHIP: {
    key: 'ship',
    path: shipImage,
  },
} as const;

export function loadShipAssets(scene: Phaser.Scene) {
  scene.load.image(ShipAssets.SHIP.key, ShipAssets.SHIP.path);
}
