export type WorkerTask =
  | 'idle'
  | 'to_ball'
  | 'to_cat'
  | 'to_resource'
  | 'to_energy'
  | 'to_base'
  | 'energy'
  | 'cooldown';

export class Worker<CatPayload = unknown, ResourcePayload = unknown> {
  public readonly id: number;
  public readonly body: Phaser.GameObjects.Rectangle;
  public readonly cargoBall: Phaser.GameObjects.Arc;
  public readonly homeX: number;
  public readonly homeY: number;
  public task: WorkerTask = 'idle';
  public cooldownMs = 0;
  public walkPhase = 0;
  public targetX: number;
  public targetY: number;
  public carryingResource = 0;
  public carryingBall = false;
  public returningAfterEnergy = false;
  public returningAfterBallDelivery = false;
  public carryingCat?: CatPayload;
  public targetResource?: ResourcePayload;
  public targetCat?: CatPayload;
  public targetCatSlotIndex?: number;
  public energyTaskMs = 0;
  public energyTaskFilled = 0;

  constructor(scene: Phaser.Scene, id: number, homeX: number, homeY: number) {
    this.id = id;
    this.homeX = homeX;
    this.homeY = homeY;
    this.targetX = homeX;
    this.targetY = homeY;
    this.body = scene.add
      .rectangle(homeX, homeY, 8, 16, 0xd9dfee, 1)
      .setDepth(907);
    this.cargoBall = scene.add
      .circle(homeX, homeY - 10, 4, 0xfff4cc, 1)
      .setDepth(908) as Phaser.GameObjects.Arc;
    this.cargoBall.setVisible(false);
    this.draw();
  }

  public tickCooldown(deltaMs: number): void {
    this.cooldownMs = Math.max(0, this.cooldownMs - deltaMs);
    if (this.cooldownMs <= 0) {
      this.task = 'idle';
    }
  }

  public startCooldown(durationMs: number): void {
    this.task = 'cooldown';
    this.cooldownMs = durationMs;
  }

  public moveTo(
    targetX: number,
    targetY: number,
    deltaSeconds: number,
    baseSpeed: number,
  ): boolean {
    const dx = targetX - this.body.x;
    const dy = targetY - this.body.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) {
      this.body.setPosition(targetX, targetY);
      this.cargoBall.setPosition(targetX, targetY - 11);
      this.setIdlePose();
      return true;
    }

    const speed = baseSpeed * (this.task === 'to_ball' ? 1.5 : 1);
    const step = Math.min(speed * deltaSeconds, distance);
    this.body.setPosition(
      this.body.x + (dx / distance) * step,
      this.body.y + (dy / distance) * step,
    );
    this.cargoBall.setPosition(this.body.x, this.body.y - 11);
    this.walkPhase += deltaSeconds * 16;
    const cycle = (Math.sin(this.walkPhase) + 1) * 0.5;
    this.body.setDisplaySize(8 + cycle * 3, 16 - cycle * 3.5);
    this.cargoBall.setVisible(this.carryingBall);
    return false;
  }

  public setIdlePose(): void {
    this.body.setDisplaySize(8, 16);
    this.cargoBall.setPosition(this.body.x, this.body.y - 11);
    this.cargoBall.setVisible(this.carryingBall);
  }

  public draw(): void {
    this.body.setDepth(907);
    this.cargoBall.setDepth(908);
    this.setIdlePose();
  }
}
