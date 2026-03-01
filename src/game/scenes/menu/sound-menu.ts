import { SoundManager, type SoundSettings } from '@game/settings/sound';
import { SCENE } from '../../../scenes';
import { Slider } from './components/slider';
import { OptionsMenuBase, type MenuOptions } from './options-menu-base';

const SLIDER_WIDTH = 340;
const SOUND_AREA_WIDTH = 780;
const LABEL_LEFT_PADDING = 80;
const SLIDER_VALUE_AREA_WIDTH = 90;
const SLIDER_STEP = 5;

const MASTER_INDEX = 0;
const MUSIC_INDEX = 1;
const EFFECTS_INDEX = 2;

export class SoundMenu extends OptionsMenuBase {
  private pendingSettings: SoundSettings = SoundManager.load();

  private masterSlider?: Slider;
  private musicSlider?: Slider;
  private effectsSlider?: Slider;

  private selectedIndex = 0;

  constructor(sceneName: string) {
    super(sceneName);
  }

  protected override getTitle(): string {
    return 'SOUND';
  }

  protected override getMenuOptions(): MenuOptions {
    return {
      options: [
        { type: 'slider', label: 'Master', onSelect: () => undefined },
        { type: 'slider', label: 'Music', onSelect: () => undefined },
        { type: 'slider', label: 'Effects', onSelect: () => undefined },
      ],
      onBack: () => this.scene.start(SCENE.OPTIONS),
    };
  }

  protected override afterOptionsCreated(context: {
    worldWidth: number;
    worldHeight: number;
    optionRowY: (index: number) => number;
    optionButtons: Phaser.GameObjects.Text[];
  }): void {
    const areaCenterX = context.worldWidth / 2;
    const areaLeftX = areaCenterX - SOUND_AREA_WIDTH / 2;
    const areaRightX = areaCenterX + SOUND_AREA_WIDTH / 2;
    const labelLeftX = areaLeftX + LABEL_LEFT_PADDING;
    const sliderX = areaRightX - (SLIDER_WIDTH / 2 + SLIDER_VALUE_AREA_WIDTH);

    context.optionButtons[MASTER_INDEX].setOrigin(0, 0.5).setX(labelLeftX);
    context.optionButtons[MUSIC_INDEX].setOrigin(0, 0.5).setX(labelLeftX);
    context.optionButtons[EFFECTS_INDEX].setOrigin(0, 0.5).setX(labelLeftX);

    this.masterSlider = new Slider({
      scene: this,
      x: sliderX,
      y: context.optionRowY(MASTER_INDEX),
      width: SLIDER_WIDTH,
      initialValue: this.pendingSettings.master,
      onChange: (value) => {
        this.pendingSettings.master = value;
        SoundManager.save(this.pendingSettings);
      },
    });
    this.musicSlider = new Slider({
      scene: this,
      x: sliderX,
      y: context.optionRowY(MUSIC_INDEX),
      width: SLIDER_WIDTH,
      initialValue: this.pendingSettings.music,
      onChange: (value) => {
        this.pendingSettings.music = value;
        SoundManager.save(this.pendingSettings);
      },
    });
    this.effectsSlider = new Slider({
      scene: this,
      x: sliderX,
      y: context.optionRowY(EFFECTS_INDEX),
      width: SLIDER_WIDTH,
      initialValue: this.pendingSettings.effects,
      onChange: (value) => {
        this.pendingSettings.effects = value;
        SoundManager.save(this.pendingSettings);
      },
    });

    this.syncSliderSelection();

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    const adjustLeft = () => this.adjustSlider(-SLIDER_STEP);
    const adjustRight = () => this.adjustSlider(SLIDER_STEP);

    keyboard.on('keydown-LEFT', adjustLeft);
    keyboard.on('keydown-A', adjustLeft);
    keyboard.on('keydown-RIGHT', adjustRight);
    keyboard.on('keydown-D', adjustRight);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off('keydown-LEFT', adjustLeft);
      keyboard.off('keydown-A', adjustLeft);
      keyboard.off('keydown-RIGHT', adjustRight);
      keyboard.off('keydown-D', adjustRight);
      this.masterSlider?.destroy();
      this.musicSlider?.destroy();
      this.effectsSlider?.destroy();
      this.masterSlider = undefined;
      this.musicSlider = undefined;
      this.effectsSlider = undefined;
    });
  }

  protected override onMenuSelectionChanged(selectedIndex: number): void {
    this.selectedIndex = selectedIndex;
    this.syncSliderSelection();
  }

  private adjustSlider(step: number): void {
    if (this.selectedIndex === MASTER_INDEX) {
      this.masterSlider?.adjustBy(step);
      return;
    }

    if (this.selectedIndex === MUSIC_INDEX) {
      this.musicSlider?.adjustBy(step);
      return;
    }

    if (this.selectedIndex === EFFECTS_INDEX) {
      this.effectsSlider?.adjustBy(step);
    }
  }

  private syncSliderSelection(): void {
    this.masterSlider?.setSelected(this.selectedIndex === MASTER_INDEX);
    this.musicSlider?.setSelected(this.selectedIndex === MUSIC_INDEX);
    this.effectsSlider?.setSelected(this.selectedIndex === EFFECTS_INDEX);
  }
}
