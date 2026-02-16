type ResolvePaddleCollisionParams = {
  pair: MatterJS.ICollisionPair;
  isBallA: boolean;
  ballBody: MatterJS.BodyType;
  paddleBody: MatterJS.BodyType;
  ball: {
    applyImpactPulse: (amount: number) => void;
    bounceFromPaddle: (paddleAngleDeg: number, pushStrength: number) => void;
    applyCollisionDamping: (factor: number) => void;
  };
  paddle: {
    angle: number;
    getPushStrength: () => number;
  };
  onPaddleHit: (pushStrength: number) => void;
};

export const resolvePaddleCollision = ({
  pair,
  isBallA,
  ballBody,
  paddleBody,
  ball,
  paddle,
  onPaddleHit,
}: ResolvePaddleCollisionParams): boolean => {
  const isBallPaddlePair =
    (isBallA && pair.bodyA === ballBody && pair.bodyB === paddleBody) ||
    (!isBallA && pair.bodyB === ballBody && pair.bodyA === paddleBody);

  if (!isBallPaddlePair) {
    return false;
  }

  ball.applyImpactPulse(0.75);
  const pushStrength = paddle.getPushStrength();
  ball.bounceFromPaddle(paddle.angle, pushStrength);
  ball.applyCollisionDamping(0.55);
  onPaddleHit(pushStrength);
  return true;
};
