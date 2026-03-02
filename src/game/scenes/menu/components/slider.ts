const TRACK_HEIGHT = 8;
const TRACK_BG_COLOR = 0x20242b;
const TRACK_FILL_COLOR = 0xffffff;
const TRACK_SELECTED_COLOR = 0x6be1ff;
const KNOB_RADIUS = 10;
const KNOB_COLOR = 0xffffff;
const KNOB_SELECTED_COLOR = 0x6be1ff;
const VALUE_TEXT_OFFSET_X = 48;
const VALUE_TEXT_SIZE = '28px';

type SliderConfig = {
  x: number;
  y: number;
  width: number;
  initialValue: number;
  onChange?: (value: number) => void;
};

export class Slider {
  private readonly scene: Phaser.Scene;
  private readonly x: number;
  private readonly y: number;
  private readonly width: number;
  private readonly onChange?: (value: number) => void;

  private readonly trackBg: Phaser.GameObjects.Rectangle;
  private readonly trackFill: Phaser.GameObjects.Graphics;
  private readonly knob: Phaser.GameObjects.Arc;
  private readonly valueText: Phaser.GameObjects.Text;

  private dragging = false;
  private selected = false;
  private value = 0;

  constructor(scene: Phaser.Scene, config: SliderConfig) {
    this.scene = scene;
    this.x = config.x;
    this.y = config.y;
    this.width = config.width;
    this.onChange = config.onChange;

    this.trackBg = this.scene.add
      .rectangle(this.x, this.y, this.width, TRACK_HEIGHT, TRACK_BG_COLOR)
      .setOrigin(0.5)
      .setDepth(2)
      .setInteractive({ useHandCursor: true });

    this.trackFill = this.scene.add.graphics().setDepth(2);

    this.knob = this.scene.add
      .circle(this.x - this.width / 2, this.y, KNOB_RADIUS, KNOB_COLOR)
      .setDepth(3)
      .setInteractive({ useHandCursor: true });

    this.valueText = this.scene.add
      .text(this.x + this.width / 2 + VALUE_TEXT_OFFSET_X, this.y, '0', {
        fontFamily: 'Fredoka, Arial, Helvetica, sans-serif',
        fontSize: VALUE_TEXT_SIZE,
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(2);

    const onPointerDown = (pointer: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.setValueFromPointer(this.getPointerWorldX(pointer));
    };
    const onPointerMove = (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging) {
        return;
      }

      this.setValueFromPointer(this.getPointerWorldX(pointer));
    };
    const onPointerUp = () => {
      this.dragging = false;
    };

    this.trackBg.on('pointerdown', onPointerDown);
    this.knob.on('pointerdown', onPointerDown);
    this.scene.input.on('pointermove', onPointerMove);
    this.scene.input.on('pointerup', onPointerUp);
    this.scene.input.on('pointerupoutside', onPointerUp);

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.trackBg.off('pointerdown', onPointerDown);
      this.knob.off('pointerdown', onPointerDown);
      this.scene.input.off('pointermove', onPointerMove);
      this.scene.input.off('pointerup', onPointerUp);
      this.scene.input.off('pointerupoutside', onPointerUp);
    });

    this.setValue(config.initialValue, false);
  }

  public getValue(): number {
    return this.value;
  }

  public setSelected(selected: boolean): void {
    this.selected = selected;
    this.knob.setFillStyle(this.selected ? KNOB_SELECTED_COLOR : KNOB_COLOR);
    this.redrawFill();
  }

  public adjustBy(step: number): void {
    this.setValue(this.value + step);
  }

  public setValue(value: number, emit = true): void {
    const nextValue = Phaser.Math.Clamp(Math.floor(value), 0, 100);
    if (nextValue === this.value && emit) {
      return;
    }

    this.value = nextValue;
    const normalized = this.value / 100;
    const fillWidth = this.width * normalized;
    this.redrawFill();
    this.knob.setX(this.x - this.width / 2 + fillWidth);
    this.valueText.setText(String(this.value));

    if (emit) {
      this.onChange?.(this.value);
    }
  }

  public destroy(): void {
    this.trackBg.destroy();
    this.trackFill.destroy();
    this.knob.destroy();
    this.valueText.destroy();
  }

  private setValueFromPointer(pointerX: number): void {
    const leftX = this.x - this.width / 2;
    const normalized = Phaser.Math.Clamp((pointerX - leftX) / this.width, 0, 1);
    this.setValue(normalized * 100);
  }

  private getPointerWorldX(pointer: Phaser.Input.Pointer): number {
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    return worldPoint.x;
  }

  private redrawFill(): void {
    this.trackFill.clear();
    const fillWidth = this.width * (this.value / 100);
    if (fillWidth <= 0) {
      return;
    }

    const leftX = this.x - this.width / 2;
    const topY = this.y - TRACK_HEIGHT / 2;
    this.trackFill.fillStyle(this.selected ? TRACK_SELECTED_COLOR : TRACK_FILL_COLOR, 1);
    this.trackFill.fillRect(leftX, topY, fillWidth, TRACK_HEIGHT);
  }
}
