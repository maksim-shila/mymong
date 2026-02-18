import { CellType } from '@game/cells/Cell';
import {
  type Battlefield,
  type BattlefieldSlot,
} from '@game/objects/Battlefield';
import { Mole } from '@game/objects/Mole';

export type MoleBuildSite = {
  moleId: number;
  slotIndex: number;
  body: MatterJS.BodyType;
  graphics: Phaser.GameObjects.Graphics;
  buildType: CellType;
  targetLives: number;
  totalBuildMs: number;
  remainingBuildMs: number;
  builtLives: number;
  flickerPhase: number;
};

type MoleBaseConfig = {
  moleCount?: number;
  enragedMoleCount?: number;
  moleSpeed?: number;
  moleCooldownMs?: number;
  moleWarningDurationMs?: number;
  showDebugMarkers: boolean;
};

type MoleResourceDrop = {
  container: Phaser.GameObjects.Container;
  pulseTween: Phaser.Tweens.Tween;
  collected: boolean;
};

type MoleCatDrop = {
  sprite: Phaser.GameObjects.Image;
  collected: boolean;
};

type MoleBaseUpdateContext = {
  deltaMs: number;
  endState: 'none' | 'gameover' | 'win';
  isPaused: boolean;
  hasGameStarted: boolean;
  battlefield: Battlefield;
  resourceDrops: MoleResourceDrop[];
  catDrops: MoleCatDrop[];
};

export class MoleBase {
  private static readonly DEFAULT_MOLE_COUNT = 3;
  private readonly scene: Phaser.Scene;
  private readonly moles: Mole[] = [];
  private readonly buildSiteByBodyId = new Map<number, MoleBuildSite>();
  private battlefield?: Battlefield;
  private readonly moleSpeed: number;
  private readonly moleCooldownMs: number;
  private readonly moleWarningDurationMs: number;
  private readonly enragedMoleCount: number;
  private readonly showDebugMarkers: boolean;
  private rageActive = false;

  constructor(scene: Phaser.Scene, config: MoleBaseConfig) {
    this.scene = scene;
    this.moleSpeed = config.moleSpeed ?? 130 / 1.5;
    this.moleCooldownMs = config.moleCooldownMs ?? 3000;
    this.moleWarningDurationMs = config.moleWarningDurationMs ?? 2000;
    this.enragedMoleCount = config.enragedMoleCount ?? 5;
    this.showDebugMarkers = config.showDebugMarkers;
    this.createMoles(config.moleCount ?? MoleBase.DEFAULT_MOLE_COUNT);
  }

  public isRageActive(): boolean {
    return this.rageActive;
  }

  public enterRageMode(): void {
    if (this.rageActive) {
      return;
    }
    this.rageActive = true;
    while (this.moles.length < this.enragedMoleCount) {
      this.moles.push(this.createMole(this.moles.length));
    }
  }

  public getBuildSiteByBodyId(bodyId: number): MoleBuildSite | undefined {
    return this.buildSiteByBodyId.get(bodyId);
  }

  public breakBuildSite(site: MoleBuildSite, battlefield: Battlefield): void {
    const slot = battlefield.getSlot(site.slotIndex);
    if (slot) {
      slot.reservedByMoleId = undefined;
    }
    this.scene.matter.world.remove(site.body);
    site.graphics.destroy();
    this.buildSiteByBodyId.delete(site.body.id);
    const mole = this.moles.find((item) => item.id === site.moleId);
    if (mole) {
      this.resetMole(mole, battlefield);
    }
  }

  public applyBuildRollback(site: MoleBuildSite): void {
    site.remainingBuildMs = Math.min(
      site.totalBuildMs,
      site.remainingBuildMs + 1000,
    );
    site.builtLives = this.getBuiltLives(site);
    this.redrawBuildSite(site);
    const mole = this.moles.find((item) => item.id === site.moleId);
    if (mole) {
      mole.timerMs = site.remainingBuildMs;
    }
  }

  public update(context: MoleBaseUpdateContext): void {
    this.battlefield = context.battlefield;
    const deltaSeconds = context.deltaMs / 1000;
    const rageSpeedMultiplier = this.rageActive ? 2 : 1;
    for (const mole of this.moles) {
      if (mole.task === 'to_site') {
        const moveSpeed = this.moleSpeed * (this.rageActive ? 3 : 1);
        if (
          mole.moveTowards(mole.targetX, mole.targetY, deltaSeconds, moveSpeed)
        ) {
          const slotIndex = mole.slotIndex;
          const slot =
            slotIndex === undefined
              ? undefined
              : context.battlefield.getSlot(slotIndex);
          if (!slot || slot.cell || slot.reservedByMoleId !== mole.id) {
            this.resetMole(mole, context.battlefield);
            continue;
          }
          mole.task = 'warning';
          mole.timerMs = this.moleWarningDurationMs;
          mole.indicator = this.scene.add
            .circle(slot.x, slot.y, slot.size * 0.22, 0xffffff, 0)
            .setStrokeStyle(2, 0xffffff, 0.9)
            .setDepth(54) as Phaser.GameObjects.Arc;
          mole.indicatorTween = this.scene.tweens.add({
            targets: mole.indicator,
            scale: 1.35,
            duration: 240,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut',
          });
        }
        continue;
      }

      if (mole.task === 'to_home') {
        const moveSpeed = this.moleSpeed * (this.rageActive ? 3 : 1);
        if (mole.moveTowards(mole.homeX, mole.homeY, deltaSeconds, moveSpeed)) {
          if (this.rageActive) {
            mole.task = 'idle';
            mole.timerMs = 0;
          } else {
            mole.task = 'cooldown';
            mole.timerMs = this.moleCooldownMs;
          }
        }
        continue;
      }

      if (mole.task === 'cooldown') {
        if (this.rageActive) {
          mole.task = 'idle';
          mole.timerMs = 0;
          continue;
        }
        mole.timerMs = Math.max(0, mole.timerMs - context.deltaMs);
        if (mole.timerMs <= 0) {
          mole.task = 'idle';
        }
        continue;
      }

      if (mole.task === 'idle') {
        this.tryStartTask(mole, context);
        continue;
      }

      mole.timerMs = Math.max(
        0,
        mole.timerMs - context.deltaMs * rageSpeedMultiplier,
      );
      if (mole.task === 'warning') {
        if (mole.timerMs <= 0) {
          this.startBuilding(mole, context);
        }
        continue;
      }

      if (mole.task === 'building') {
        const site = this.getBuildSiteByMoleId(mole.id);
        if (!site) {
          this.resetMole(mole, context.battlefield);
          continue;
        }
        site.remainingBuildMs = Math.max(
          0,
          site.remainingBuildMs - context.deltaMs * rageSpeedMultiplier,
        );
        site.builtLives = this.getBuiltLives(site);
        site.flickerPhase += context.deltaMs / 1000;
        this.redrawBuildSite(site);
        if (site.remainingBuildMs <= 0) {
          this.completeBuilding(mole, context.battlefield);
        }
      }
    }
  }

  private createMoles(count: number): void {
    this.moles.length = 0;
    for (let i = 0; i < count; i += 1) {
      this.moles.push(this.createMole(i));
    }
  }

  private createMole(id: number): Mole {
    const homeX = this.scene.scale.width - 36 - id * 12;
    const homeY = 34 + id * 10;
    return new Mole(this.scene, id, homeX, homeY, this.showDebugMarkers);
  }

  private tryStartTask(mole: Mole, context: MoleBaseUpdateContext): void {
    if (
      context.endState !== 'none' ||
      context.isPaused ||
      !context.hasGameStarted
    ) {
      return;
    }
    if (
      !this.rageActive &&
      this.moles.some(
        (item) => item.task === 'to_site' || item.task === 'warning',
      )
    ) {
      return;
    }

    const availableSlots = context.battlefield
      .getSlots()
      .map((slot, index) => ({ slot, index }))
      .filter(({ slot }) => !slot.cell && slot.reservedByMoleId === undefined);
    if (availableSlots.length === 0) {
      return;
    }

    const chosen = Phaser.Utils.Array.GetRandom(availableSlots);
    if (!chosen) {
      return;
    }

    const { slot, index } = chosen;
    slot.reservedByMoleId = mole.id;
    mole.task = 'to_site';
    mole.slotIndex = index;
    mole.buildType = CellType.BASIC;
    mole.buildLives = Phaser.Math.Between(1, 4);
    mole.targetX = slot.x;
    mole.targetY = slot.y;
    mole.timerMs = 0;
  }

  private startBuilding(mole: Mole, context: MoleBaseUpdateContext): void {
    const slotIndex = mole.slotIndex;
    if (slotIndex === undefined) {
      this.resetMole(mole, context.battlefield);
      return;
    }
    const slot = context.battlefield.getSlot(slotIndex);
    if (!slot || slot.cell || slot.reservedByMoleId !== mole.id) {
      this.resetMole(mole, context.battlefield);
      return;
    }

    this.consumeDropsForBuild(
      mole,
      slot,
      context.resourceDrops,
      context.catDrops,
    );

    mole.indicatorTween?.stop();
    mole.indicator?.destroy();
    mole.indicatorTween = undefined;
    mole.indicator = undefined;

    const body = this.scene.matter.add.rectangle(
      slot.x,
      slot.y,
      slot.size,
      slot.size,
      {
        isStatic: true,
        restitution: 1,
        friction: 0,
        frictionStatic: 0,
        frictionAir: 0,
      },
    );
    const graphics = this.scene.add.graphics().setDepth(55);
    const totalBuildMs = mole.buildLives * 1000;

    const site: MoleBuildSite = {
      moleId: mole.id,
      slotIndex,
      body,
      graphics,
      buildType: mole.buildType,
      targetLives: mole.buildLives,
      totalBuildMs,
      remainingBuildMs: totalBuildMs,
      builtLives: 0,
      flickerPhase: 0,
    };
    this.buildSiteByBodyId.set(body.id, site);
    this.redrawBuildSite(site);

    mole.task = 'building';
    mole.timerMs = totalBuildMs;
  }

  private completeBuilding(mole: Mole, battlefield: Battlefield): void {
    const slotIndex = mole.slotIndex;
    if (slotIndex === undefined) {
      this.resetMole(mole, battlefield);
      return;
    }
    const slot = battlefield.getSlot(slotIndex);
    if (!slot) {
      this.resetMole(mole, battlefield);
      return;
    }

    this.removeBuildSite(mole.id);
    slot.reservedByMoleId = undefined;
    battlefield.spawnCellInSlot(
      slotIndex,
      mole.buildType,
      mole.buildLives,
      slot.size,
      null,
    );
    mole.task = 'to_home';
    mole.targetX = mole.homeX;
    mole.targetY = mole.homeY;
    mole.timerMs = 0;
  }

  private removeBuildSite(moleId: number): void {
    for (const [bodyId, site] of this.buildSiteByBodyId.entries()) {
      if (site.moleId !== moleId) {
        continue;
      }
      this.scene.matter.world.remove(site.body);
      site.graphics.destroy();
      this.buildSiteByBodyId.delete(bodyId);
      return;
    }
  }

  private resetMole(mole: Mole, battlefield: Battlefield): void {
    if (mole.slotIndex !== undefined) {
      const slot = battlefield.getSlot(mole.slotIndex);
      if (slot && slot.reservedByMoleId === mole.id && !slot.cell) {
        slot.reservedByMoleId = undefined;
      }
    }
    mole.indicatorTween?.stop();
    mole.indicator?.destroy();
    mole.indicatorTween = undefined;
    mole.indicator = undefined;
    mole.task = 'idle';
    mole.slotIndex = undefined;
    mole.timerMs = 0;
    mole.buildType = CellType.BASIC;
    mole.buildLives = 1;
    mole.targetX = mole.homeX;
    mole.targetY = mole.homeY;
    mole.x = mole.homeX;
    mole.y = mole.homeY;
    mole.marker?.setPosition(mole.x, mole.y);
  }

  private getBuildSiteByMoleId(moleId: number): MoleBuildSite | undefined {
    for (const site of this.buildSiteByBodyId.values()) {
      if (site.moleId === moleId) {
        return site;
      }
    }
    return undefined;
  }

  private getBuiltLives(site: MoleBuildSite): number {
    const elapsed = site.totalBuildMs - site.remainingBuildMs;
    return Phaser.Math.Clamp(Math.floor(elapsed / 1000), 0, site.targetLives);
  }

  private redrawBuildSite(site: MoleBuildSite): void {
    const slot = this.battlefield?.getSlot(site.slotIndex) as
      | BattlefieldSlot
      | undefined;
    if (!slot) {
      return;
    }
    const half = slot.size / 2;
    site.graphics.clear();
    const flickerAlpha = 0.72 + (Math.sin(site.flickerPhase * 18) + 1) * 0.14;
    if (site.builtLives > 0) {
      const fillColor = this.getCellColorByLives(site.builtLives);
      site.graphics.fillStyle(fillColor, flickerAlpha);
      site.graphics.fillRect(
        slot.x - half,
        slot.y - half,
        slot.size,
        slot.size,
      );
    }
    site.graphics.lineStyle(1.5, 0xffffff, 0.65);
    site.graphics.strokeRect(
      slot.x - half,
      slot.y - half,
      slot.size,
      slot.size,
    );
  }

  private getCellColorByLives(lives: number): number {
    const lowLivesColor = 0x12464f;
    const highLivesColor = 0xbefcf6;
    const t = 1 - Phaser.Math.Clamp((lives - 1) / 3, 0, 1);
    const r = Math.round(
      Phaser.Math.Linear(
        (lowLivesColor >> 16) & 0xff,
        (highLivesColor >> 16) & 0xff,
        t,
      ),
    );
    const g = Math.round(
      Phaser.Math.Linear(
        (lowLivesColor >> 8) & 0xff,
        (highLivesColor >> 8) & 0xff,
        t,
      ),
    );
    const b = Math.round(
      Phaser.Math.Linear(lowLivesColor & 0xff, highLivesColor & 0xff, t),
    );
    return (r << 16) | (g << 8) | b;
  }

  private consumeDropsForBuild(
    mole: Mole,
    slot: BattlefieldSlot,
    resourceDrops: MoleResourceDrop[],
    catDrops: MoleCatDrop[],
  ): void {
    const snapDistance = slot.size * 0.25;

    for (const drop of resourceDrops) {
      if (drop.collected) {
        continue;
      }
      const dx = drop.container.x - slot.x;
      const dy = drop.container.y - slot.y;
      if (Math.hypot(dx, dy) > snapDistance) {
        continue;
      }
      drop.collected = true;
      drop.pulseTween.stop();
      drop.container.destroy();
    }

    for (const drop of catDrops) {
      if (drop.collected) {
        continue;
      }
      const dx = drop.sprite.x - slot.x;
      const dy = drop.sprite.y - slot.y;
      if (Math.hypot(dx, dy) > snapDistance) {
        continue;
      }
      drop.collected = true;
      drop.sprite.destroy();
      mole.buildType = CellType.CAT_CAGE;
      mole.buildLives = 3;
      break;
    }
  }
}
