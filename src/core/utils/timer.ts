export class Timer {
  private durationMs = 0;
  private elapsedMs = 0;

  constructor(durationMs = 0, shouldReset = true) {
    this.durationMs = Math.max(0, durationMs);
    this.elapsedMs = shouldReset ? this.durationMs : 0;
  }

  public get elapsed(): number {
    return this.elapsedMs;
  }

  public get duration(): number {
    return this.durationMs;
  }

  public get remaining(): number {
    return this.durationMs - this.elapsedMs;
  }

  public get progress(): number {
    if (this.durationMs <= 0) {
      return 1;
    }

    return this.elapsedMs / this.durationMs;
  }

  public get active(): boolean {
    return !this.done;
  }

  public get done(): boolean {
    return this.elapsedMs >= this.durationMs;
  }

  public set(durationMs: number): void {
    this.durationMs = Math.max(0, durationMs);
    this.elapsedMs = 0;
  }

  public setIfInactive(durationMs: number): void {
    if (!this.active) {
      this.set(durationMs);
    }
  }

  public reset(): void {
    this.elapsedMs = 0;
  }

  public tick(deltaMs: number): boolean {
    if (this.done) {
      return true;
    }

    this.elapsedMs = Math.min(this.durationMs, this.elapsedMs + Math.max(0, deltaMs));
    return this.done;
  }
}
