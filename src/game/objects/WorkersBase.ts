import { Worker } from '@game/objects/Worker';

export type BaseCatSlot = {
  x: number;
  y: number;
  occupied: boolean;
  reservedByWorkerId?: number;
};

type WorkersBaseConfig = {
  playfieldLeft: number;
  sceneHeight: number;
  workerCount: number;
  livesMax: number;
};

export type WorkersBaseCatPayload = {
  sprite: Phaser.GameObjects.Image;
  assignedWorkerId?: number;
  collected: boolean;
};

export type WorkersBaseResourcePayload = {
  container: Phaser.GameObjects.Container;
  pulseTween: Phaser.Tweens.Tween;
  amount: number;
  assignedWorkerId?: number;
  collected: boolean;
};

type WorkersUpdateContext<
  CatPayload extends WorkersBaseCatPayload,
  ResourcePayload extends WorkersBaseResourcePayload,
> = {
  deltaMs: number;
  workerSpeed: number;
  workerCooldownMs: number;
  energy: number;
  energyMax: number;
  workerEnergyTaskDurationMs: number;
  workerEnergyTaskMaxFill: number;
  paddleX: number;
  paddleY: number;
  paddleHeight: number;
  ballRadiusPx: number;
  resourceDrops: ResourcePayload[];
  catDrops: CatPayload[];
  onEnergyGain: (amount: number) => void;
  onResourceDelivered: (amount: number) => void;
  onBallDelivered: () => void;
  onCatDelivered: () => void;
};

export class WorkersBase<
  CatPayload extends WorkersBaseCatPayload = WorkersBaseCatPayload,
  ResourcePayload extends WorkersBaseResourcePayload =
    WorkersBaseResourcePayload,
> {
  public readonly workers: Worker<CatPayload, ResourcePayload>[] = [];
  public readonly catSlots: BaseCatSlot[] = [];
  public readonly baseX: number;
  public readonly baseY: number;
  public readonly baseDropX: number;
  public readonly baseDropY: number;
  private readonly scene: Phaser.Scene;
  private readonly workerCount: number;
  private readonly livesMax: number;
  private displayedEnergy = 0;
  private energyTween?: Phaser.Tweens.Tween;
  private pendingBallDelivery = false;
  private ballDeliveryWorkerId?: number;
  private energyWorkerId?: number;
  private resourcesText!: Phaser.GameObjects.Text;
  private energyBarBg!: Phaser.GameObjects.Rectangle;
  private energyBarFill!: Phaser.GameObjects.Rectangle;
  private energyLabel!: Phaser.GameObjects.Text;
  private readonly lifeDots: Phaser.GameObjects.Arc[] = [];

  constructor(scene: Phaser.Scene, config: WorkersBaseConfig) {
    this.scene = scene;
    this.workerCount = config.workerCount;
    this.livesMax = config.livesMax;
    this.baseX = config.playfieldLeft * 0.45;
    this.baseY = config.sceneHeight - 70;
    this.baseDropX = this.baseX + 8;
    this.baseDropY = this.baseY + 8;
  }

  public create(): void {
    this.scene.add
      .rectangle(this.baseX, this.baseY, 70, 70, 0x3e4252, 0.88)
      .setStrokeStyle(2, 0xc3cadf, 0.5)
      .setDepth(905);

    this.resourcesText = this.scene.add
      .text(this.baseX, this.baseY + 58, 'RESOURCES: 0', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '13px',
        color: '#f4f7ff',
      })
      .setOrigin(0.5)
      .setDepth(912);

    const slotStartX = this.baseX - 24;
    const slotY = this.baseY - 52;
    this.scene.add
      .rectangle(this.baseX, slotY, 92, 26, 0x1b2130, 0.55)
      .setStrokeStyle(1, 0xffffff, 0.35)
      .setDepth(904);
    for (let i = 0; i < 3; i += 1) {
      const x = slotStartX + i * 24;
      this.catSlots.push({
        x,
        y: slotY,
        occupied: false,
        reservedByWorkerId: undefined,
      });
      this.scene.add
        .rectangle(x, slotY + 8, 18, 18, 0x0a0a0a, 0)
        .setStrokeStyle(1, 0xffffff, 0.28)
        .setDepth(904);
    }

    for (let i = 0; i < this.workerCount; i += 1) {
      const homeX = this.baseX - 20 + i * 20;
      const homeY = this.baseY + 20;
      this.workers.push(
        new Worker<CatPayload, ResourcePayload>(this.scene, i, homeX, homeY),
      );
    }

    this.createEnergyUi();
    this.createLivesUi();
  }

  public isBallDeliveryPending(): boolean {
    return this.pendingBallDelivery;
  }

  public requestBallDelivery(): void {
    this.pendingBallDelivery = true;
    this.ballDeliveryWorkerId = undefined;
  }

  public clearBallDeliveryRequest(): void {
    this.pendingBallDelivery = false;
    this.ballDeliveryWorkerId = undefined;
  }

  public updateWorkers(
    context: WorkersUpdateContext<CatPayload, ResourcePayload>,
  ): void {
    const deltaSeconds = context.deltaMs / 1000;
    if (this.pendingBallDelivery && this.ballDeliveryWorkerId === undefined) {
      this.commandeerWorkerForBallDelivery();
    }

    for (const worker of this.workers) {
      if (worker.task === 'cooldown') {
        worker.tickCooldown(context.deltaMs);
        worker.setIdlePose();
        continue;
      }

      if (worker.task === 'idle') {
        this.assignWorkerTask(worker, context);
      }

      if (
        worker.task === 'to_ball' ||
        worker.task === 'to_cat' ||
        worker.task === 'to_resource' ||
        worker.task === 'to_base' ||
        worker.task === 'to_energy'
      ) {
        if (worker.task === 'to_ball' && worker.carryingBall) {
          worker.targetX = context.paddleX;
          worker.targetY =
            context.paddleY -
            context.paddleHeight / 2 -
            context.ballRadiusPx -
            2;
        }
        const reached = worker.moveTo(
          worker.targetX,
          worker.targetY,
          deltaSeconds,
          context.workerSpeed,
        );
        if (reached) {
          this.onWorkerReachedTarget(worker, context);
        }
        continue;
      }

      if (worker.task === 'energy') {
        if (
          context.energy >= context.energyMax ||
          worker.energyTaskMs <= 0 ||
          worker.energyTaskFilled >= context.workerEnergyTaskMaxFill
        ) {
          if (this.energyWorkerId === worker.id) {
            this.energyWorkerId = undefined;
          }
          worker.returningAfterEnergy = true;
          worker.task = 'to_base';
          worker.targetX = worker.homeX;
          worker.targetY = worker.homeY;
          continue;
        }
        const amount = Math.min(
          (context.workerEnergyTaskMaxFill * context.deltaMs) /
            context.workerEnergyTaskDurationMs,
          context.workerEnergyTaskMaxFill - worker.energyTaskFilled,
        );
        context.onEnergyGain(amount);
        worker.energyTaskMs -= context.deltaMs;
        worker.energyTaskFilled += amount;
        worker.setIdlePose();
      }
    }
  }

  public setResources(resources: number): void {
    this.resourcesText.setText(`RESOURCES: ${resources}`);
  }

  public setEnergyInstant(energy: number): void {
    if (this.energyTween) {
      this.energyTween.stop();
      this.energyTween = undefined;
    }
    this.displayedEnergy = energy;
  }

  public animateEnergyToTarget(targetEnergy: number, durationMs: number): void {
    if (this.energyTween) {
      this.energyTween.stop();
    }
    this.energyTween = this.scene.tweens.add({
      targets: this,
      displayedEnergy: targetEnergy,
      duration: durationMs,
      ease: 'Cubic.Out',
      onComplete: () => {
        this.displayedEnergy = targetEnergy;
      },
    });
  }

  public getEnergyTaskTarget(): { x: number; y: number } {
    return {
      x: this.energyBarBg.x,
      y: this.energyBarBg.y + this.energyBarBg.height / 2 + 18,
    };
  }

  public updateEnergy(currentEnergy: number, energyMax: number): void {
    if (!this.energyTween || !this.energyTween.isPlaying()) {
      this.displayedEnergy = Phaser.Math.Linear(this.displayedEnergy, currentEnergy, 0.22);
    }
    const t = Phaser.Math.Clamp(this.displayedEnergy / energyMax, 0, 1);
    const borderInset = 2;
    const stripWidth = 16;
    const maxStripHeight = this.energyBarBg.height - borderInset * 2;
    const fillHeight = Math.max(2, maxStripHeight * t);
    const rightX =
      this.energyBarBg.x +
      this.energyBarBg.width / 2 -
      borderInset -
      stripWidth / 2;
    const bottomY =
      this.energyBarBg.y + this.energyBarBg.height / 2 - borderInset;
    this.energyBarFill.width = stripWidth;
    this.energyBarFill.height = fillHeight;
    this.energyBarFill.x = rightX;
    this.energyBarFill.y = bottomY;
    this.energyBarFill.setFillStyle(0x28b34c, 1);
    this.energyLabel.setAlpha(t > 0 ? 1 : 0.45);
  }

  public setLives(lives: number): void {
    for (let i = 0; i < this.lifeDots.length; i += 1) {
      const active = i < lives;
      this.lifeDots[i].setAlpha(active ? 1 : 0.2);
    }
  }

  public getRescuedCatsCount(): number {
    return this.catSlots.reduce(
      (acc, slot) => acc + (slot.occupied ? 1 : 0),
      0,
    );
  }

  private createEnergyUi(): void {
    const barWidth = 74;
    const barHeight = 128;
    const borderInset = 2;
    const stripWidth = 16;
    const x = this.baseX;
    const y = this.baseY - 138;

    this.energyBarBg = this.scene.add
      .rectangle(x, y, barWidth, barHeight, 0xd8d8d8, 0.95)
      .setStrokeStyle(2, 0x000000, 1)
      .setDepth(910);
    this.energyBarFill = this.scene.add
      .rectangle(
        x + barWidth / 2 - borderInset - stripWidth / 2,
        y + barHeight / 2 - borderInset,
        stripWidth,
        barHeight - borderInset * 2,
        0x28b34c,
        1,
      )
      .setStrokeStyle(1, 0x000000, 0.85)
      .setOrigin(0.5, 1)
      .setDepth(911);
    this.energyLabel = this.scene.add
      .text(x, y - barHeight / 2 - 12, 'ENERGY', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '10px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(912);
  }

  private createLivesUi(): void {
    const xCenter = this.baseX;
    const startY = this.baseY - 18;
    const offsetX = 18;
    const offsetY = 16;
    const radius = 5;

    const positions = [
      { x: xCenter - offsetX / 2, y: startY },
      { x: xCenter + offsetX / 2, y: startY },
      { x: xCenter - offsetX / 2, y: startY + offsetY },
      { x: xCenter + offsetX / 2, y: startY + offsetY },
    ];

    for (const pos of positions) {
      const dot = this.scene.add
        .circle(pos.x, pos.y, radius, 0xfff4cc, 1)
        .setStrokeStyle(1, 0xffffff, 0.55)
        .setDepth(912) as Phaser.GameObjects.Arc;
      this.lifeDots.push(dot);
    }
    this.setLives(this.livesMax);
  }

  private commandeerWorkerForBallDelivery(): void {
    const freeWorker = this.workers.find(
      (worker) =>
        worker.task === 'idle' &&
        !worker.carryingBall &&
        worker.carryingResource <= 0 &&
        !worker.carryingCat,
    );
    if (freeWorker) {
      this.ballDeliveryWorkerId = freeWorker.id;
      this.startBallDeliveryNow(freeWorker);
      return;
    }

    const returningCandidates = this.workers.filter(
      (worker) => worker.task === 'to_base',
    );
    if (returningCandidates.length > 0) {
      const worker = returningCandidates.reduce((best, current) => {
        const bestDistance = Phaser.Math.Distance.Between(
          best.body.x,
          best.body.y,
          this.baseDropX,
          this.baseDropY,
        );
        const currentDistance = Phaser.Math.Distance.Between(
          current.body.x,
          current.body.y,
          this.baseDropX,
          this.baseDropY,
        );
        return currentDistance < bestDistance ? current : best;
      });
      this.ballDeliveryWorkerId = worker.id;
      return;
    }

    const enRouteCandidates = this.workers.filter(
      (worker) =>
        worker.task !== 'to_ball' &&
        worker.task !== 'to_base' &&
        worker.task !== 'cooldown' &&
        !worker.carryingBall &&
        worker.carryingResource <= 0 &&
        !worker.carryingCat,
    );
    if (enRouteCandidates.length > 0) {
      const worker = enRouteCandidates.reduce((best, current) => {
        const bestDistance = Phaser.Math.Distance.Between(
          best.body.x,
          best.body.y,
          this.baseDropX,
          this.baseDropY,
        );
        const currentDistance = Phaser.Math.Distance.Between(
          current.body.x,
          current.body.y,
          this.baseDropX,
          this.baseDropY,
        );
        return currentDistance < bestDistance ? current : best;
      });
      this.ballDeliveryWorkerId = worker.id;
      this.interruptWorkerAndReturnToBase(worker);
    }
  }

  private startBallDeliveryNow(
    worker: Worker<CatPayload, ResourcePayload>,
  ): void {
    if (this.energyWorkerId === worker.id) {
      this.energyWorkerId = undefined;
    }
    worker.task = 'to_ball';
    worker.cooldownMs = 0;
    worker.carryingBall = false;
    worker.returningAfterEnergy = false;
    worker.returningAfterBallDelivery = false;
    worker.energyTaskMs = 0;
    worker.energyTaskFilled = 0;
    worker.targetX = this.baseDropX;
    worker.targetY = this.baseDropY;
    worker.cargoBall.setVisible(false);
  }

  private interruptWorkerAndReturnToBase(
    worker: Worker<CatPayload, ResourcePayload>,
  ): void {
    if (this.energyWorkerId === worker.id) {
      this.energyWorkerId = undefined;
    }
    if (worker.targetResource && !worker.targetResource.collected) {
      worker.targetResource.assignedWorkerId = undefined;
    }
    if (worker.targetCat && !worker.targetCat.collected) {
      worker.targetCat.assignedWorkerId = undefined;
    }
    worker.targetResource = undefined;
    worker.targetCat = undefined;
    if (!worker.carryingCat) {
      worker.targetCatSlotIndex = undefined;
    }
    worker.returningAfterEnergy = false;
    worker.returningAfterBallDelivery = false;
    worker.energyTaskMs = 0;
    worker.energyTaskFilled = 0;
    worker.task = 'to_base';
    worker.cooldownMs = 0;
    worker.targetX = worker.homeX;
    worker.targetY = worker.homeY;
    worker.cargoBall.setVisible(false);
  }

  private assignWorkerTask(
    worker: Worker<CatPayload, ResourcePayload>,
    context: WorkersUpdateContext<CatPayload, ResourcePayload>,
  ): void {
    if (this.pendingBallDelivery && this.ballDeliveryWorkerId === worker.id) {
      return;
    }

    const freeCatDrop = context.catDrops.find(
      (drop) => !drop.collected && drop.assignedWorkerId === undefined,
    );
    if (freeCatDrop) {
      freeCatDrop.assignedWorkerId = worker.id;
      worker.targetCat = freeCatDrop;
      worker.task = 'to_cat';
      worker.targetX = freeCatDrop.sprite.x;
      worker.targetY = freeCatDrop.sprite.y;
      return;
    }

    const freeResourceDrop = context.resourceDrops.find(
      (drop) => !drop.collected && drop.assignedWorkerId === undefined,
    );
    if (freeResourceDrop) {
      freeResourceDrop.assignedWorkerId = worker.id;
      worker.targetResource = freeResourceDrop;
      worker.task = 'to_resource';
      worker.targetX = freeResourceDrop.container.x;
      worker.targetY = freeResourceDrop.container.y;
      return;
    }

    if (
      context.energy < context.energyMax - 1 &&
      this.energyWorkerId === undefined
    ) {
      this.energyWorkerId = worker.id;
      worker.task = 'to_energy';
      const energyTarget = this.getEnergyTaskTarget();
      worker.targetX = energyTarget.x;
      worker.targetY = energyTarget.y;
      return;
    }

    worker.task = 'to_base';
    worker.targetX = worker.homeX;
    worker.targetY = worker.homeY;
  }

  private onWorkerReachedTarget(
    worker: Worker<CatPayload, ResourcePayload>,
    context: WorkersUpdateContext<CatPayload, ResourcePayload>,
  ): void {
    if (worker.task === 'to_ball') {
      if (!worker.carryingBall) {
        worker.carryingBall = true;
        worker.targetX = context.paddleX;
        worker.targetY =
          context.paddleY - context.paddleHeight / 2 - context.ballRadiusPx - 2;
        return;
      }

      worker.carryingBall = false;
      this.clearBallDeliveryRequest();
      context.onBallDelivered();
      worker.returningAfterBallDelivery = true;
      worker.task = 'to_base';
      worker.targetX = worker.homeX;
      worker.targetY = worker.homeY;
      return;
    }

    if (worker.task === 'to_cat') {
      const drop = worker.targetCat;
      worker.targetCat = undefined;
      if (!drop || drop.collected) {
        worker.task = 'idle';
        return;
      }
      drop.collected = true;
      drop.sprite.setVisible(false);
      worker.carryingCat = drop;
      const slotIndex = this.catSlots.findIndex(
        (slot) => !slot.occupied && slot.reservedByWorkerId === undefined,
      );
      if (slotIndex < 0) {
        worker.carryingCat = undefined;
        drop.collected = false;
        drop.assignedWorkerId = undefined;
        drop.sprite.setVisible(true).setPosition(worker.body.x, worker.body.y);
        this.finishWorkerTask(worker, context);
        return;
      }
      this.catSlots[slotIndex].reservedByWorkerId = worker.id;
      worker.targetCatSlotIndex = slotIndex;
      worker.task = 'to_base';
      worker.targetX = this.catSlots[slotIndex].x;
      worker.targetY = this.catSlots[slotIndex].y;
      return;
    }

    if (worker.task === 'to_resource') {
      const drop = worker.targetResource;
      worker.targetResource = undefined;
      if (!drop || drop.collected) {
        worker.task = 'idle';
        return;
      }
      drop.collected = true;
      drop.pulseTween.stop();
      drop.container.destroy();
      worker.carryingResource = drop.amount;
      worker.task = 'to_base';
      worker.targetX = this.baseDropX;
      worker.targetY = this.baseDropY;
      return;
    }

    if (worker.task === 'to_energy') {
      worker.task = 'energy';
      worker.energyTaskMs = context.workerEnergyTaskDurationMs;
      worker.energyTaskFilled = 0;
      return;
    }

    if (worker.task === 'to_base') {
      if (worker.returningAfterBallDelivery) {
        worker.returningAfterBallDelivery = false;
        if (this.shouldStartBallDeliveryNow(worker)) {
          this.startBallDeliveryNow(worker);
        } else {
          this.finishWorkerTask(worker, context);
        }
        return;
      }

      if (worker.returningAfterEnergy) {
        worker.returningAfterEnergy = false;
        if (this.shouldStartBallDeliveryNow(worker)) {
          this.startBallDeliveryNow(worker);
        } else {
          this.finishWorkerTask(worker, context);
        }
        return;
      }

      if (worker.carryingResource > 0) {
        context.onResourceDelivered(worker.carryingResource);
        worker.carryingResource = 0;
        if (this.shouldStartBallDeliveryNow(worker)) {
          this.startBallDeliveryNow(worker);
        } else {
          this.finishWorkerTask(worker, context);
        }
        return;
      }

      if (worker.carryingCat) {
        const slotIndex = worker.targetCatSlotIndex ?? -1;
        const slot = slotIndex >= 0 ? this.catSlots[slotIndex] : undefined;
        if (slot && (!slot.occupied || slot.reservedByWorkerId === worker.id)) {
          slot.occupied = true;
          slot.reservedByWorkerId = undefined;
          worker.carryingCat.sprite
            .setVisible(true)
            .setPosition(slot.x, slot.y)
            .setDisplaySize(14, 14)
            .setDepth(909);
          context.onCatDelivered();
        } else {
          if (slot && slot.reservedByWorkerId === worker.id) {
            slot.reservedByWorkerId = undefined;
          }
          worker.carryingCat.collected = false;
          worker.carryingCat.assignedWorkerId = undefined;
          worker.carryingCat.sprite
            .setVisible(true)
            .setPosition(worker.body.x, worker.body.y)
            .setDisplaySize(20, 20)
            .setDepth(52);
        }
        worker.carryingCat = undefined;
        worker.targetCatSlotIndex = undefined;
        if (this.shouldStartBallDeliveryNow(worker)) {
          this.startBallDeliveryNow(worker);
        } else {
          this.finishWorkerTask(worker, context);
        }
        return;
      }

      if (this.shouldStartBallDeliveryNow(worker)) {
        this.startBallDeliveryNow(worker);
      } else {
        worker.task = 'idle';
      }
    }
  }

  private shouldStartBallDeliveryNow(
    worker: Worker<CatPayload, ResourcePayload>,
  ): boolean {
    return (
      this.pendingBallDelivery &&
      this.ballDeliveryWorkerId === worker.id &&
      !worker.carryingBall
    );
  }

  private finishWorkerTask(
    worker: Worker<CatPayload, ResourcePayload>,
    context: WorkersUpdateContext<CatPayload, ResourcePayload>,
  ): void {
    if (this.energyWorkerId === worker.id) {
      this.energyWorkerId = undefined;
    }
    if (worker.targetCatSlotIndex !== undefined && !worker.carryingCat) {
      const slot = this.catSlots[worker.targetCatSlotIndex];
      if (slot?.reservedByWorkerId === worker.id) {
        slot.reservedByWorkerId = undefined;
      }
    }
    worker.startCooldown(context.workerCooldownMs);
    worker.targetCat = undefined;
    worker.targetResource = undefined;
    worker.targetCatSlotIndex = undefined;
    worker.energyTaskMs = 0;
    worker.energyTaskFilled = 0;
    worker.carryingBall = false;
    worker.returningAfterEnergy = false;
    worker.returningAfterBallDelivery = false;
    worker.cargoBall.setVisible(false);
    worker.setIdlePose();
  }
}
