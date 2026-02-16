type ResolveBuildSiteCollisionParams<BuildSite> = {
  buildSite?: BuildSite;
  ballCellHitCooldownMs: number;
  normalX: number;
  normalY: number;
  ball: {
    applyImpactPulse: (amount: number) => void;
    applyCollisionDamping: (factor: number) => void;
    constrainBounceByNormal: (x: number, y: number) => void;
    consumePushEmpoweredHit: () => boolean;
  };
  onBreakBuildSite: (site: BuildSite) => void;
  onRollbackBuildSite: (site: BuildSite) => void;
  shouldBreakOnNormalHit: (site: BuildSite) => boolean;
};

export const resolveBuildSiteCollision = <BuildSite>({
  buildSite,
  ballCellHitCooldownMs,
  normalX,
  normalY,
  ball,
  onBreakBuildSite,
  onRollbackBuildSite,
  shouldBreakOnNormalHit,
}: ResolveBuildSiteCollisionParams<BuildSite>): {
  handled: boolean;
  nextCooldownMs: number;
} => {
  if (!buildSite) {
    return { handled: false, nextCooldownMs: ballCellHitCooldownMs };
  }

  ball.applyImpactPulse(0.4);
  ball.applyCollisionDamping(0.6);
  ball.constrainBounceByNormal(normalX, normalY);

  if (ballCellHitCooldownMs > 0) {
    return { handled: true, nextCooldownMs: ballCellHitCooldownMs };
  }

  if (ball.consumePushEmpoweredHit()) {
    onBreakBuildSite(buildSite);
  } else if (shouldBreakOnNormalHit(buildSite)) {
    onBreakBuildSite(buildSite);
  } else {
    onRollbackBuildSite(buildSite);
  }

  return { handled: true, nextCooldownMs: 45 };
};
