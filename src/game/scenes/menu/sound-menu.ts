import { Controls } from '@game/input-old/controls';
import { Key } from '@game/input-old/key';
import { SoundManagerOld, type SoundSettings } from '@game/settings/sound';
import { SCENE } from '../../../scenes';
import { Slider } from './components/slider';
import { OptionsMenuBase, type MenuOptions } from './options-menu-base';
import { MusicManager } from '@game/settings/music';

const SLIDER_WIDTH = 340;
const SOUND_AREA_WIDTH = 780;
const LABEL_LEFT_PADDING = 80;
const SLIDER_VALUE_AREA_WIDTH = 90;
const SLIDER_STEP = 5;

const MASTER_INDEX = 0;
const MUSIC_INDEX = 1;
const EFFECTS_INDEX = 2;

export class SoundMenu extends OptionsMenuBase {
  private pendingSettings: SoundSettings = SoundManagerOld.load();

  private masterSlider?: Slider;
  private musicSlider?: Slider;
  private effectsSlider?: Slider;

  private selectedIndex = 0;
  private controls!: Controls;

  constructor(sceneName: string) {
    super(sceneName);
  }

  protected override getTitle(): string {
    return 'SOUND';
  }

  protected override getMenuOptions(): MenuOptions {
    return {
      options: [
        { label: 'Master', onSelect: () => undefined },
        { label: 'Music', onSelect: () => undefined },
        { label: 'Effects', onSelect: () => undefined },
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

    this.masterSlider = new Slider(this, {
      x: sliderX,
      y: context.optionRowY(MASTER_INDEX),
      width: SLIDER_WIDTH,
      initialValue: this.pendingSettings.master,
      onChange: (value) => {
        this.pendingSettings.master = value;
        SoundManagerOld.save(this.pendingSettings);
        MusicManager.syncVolume();
      },
    });
    this.musicSlider = new Slider(this, {
      x: sliderX,
      y: context.optionRowY(MUSIC_INDEX),
      width: SLIDER_WIDTH,
      initialValue: this.pendingSettings.music,
      onChange: (value) => {
        this.pendingSettings.music = value;
        SoundManagerOld.save(this.pendingSettings);
        MusicManager.syncVolume();
      },
    });
    this.effectsSlider = new Slider(this, {
      x: sliderX,
      y: context.optionRowY(EFFECTS_INDEX),
      width: SLIDER_WIDTH,
      initialValue: this.pendingSettings.effects,
      onChange: (value) => {
        this.pendingSettings.effects = value;
        SoundManagerOld.save(this.pendingSettings);
      },
    });

    this.controls = new Controls(this);
    this.syncSliderSelection();

    const adjustLeft = () => this.adjustSlider(-SLIDER_STEP);
    const adjustRight = () => this.adjustSlider(SLIDER_STEP);

    this.controls.onKeyDown(Key.LEFT, adjustLeft);
    this.controls.onKeyDown(Key.RIGHT, adjustRight);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
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
