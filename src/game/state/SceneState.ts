export type EndState = 'none' | 'gameover' | 'win';

export type SceneState = {
  pause: {
    isPaused: boolean;
  };
  end: {
    state: EndState;
  };
  ball: {
    isLaunched: boolean;
    wasLaunchDown: boolean;
    explosionArmed: boolean;
    lastSeenPushSerial: number;
    lastPaddleHitAtMs: number;
    latePushConsumed: boolean;
    ballCellHitCooldownMs: number;
  };
  player: {
    lives: number;
    resources: number;
    hasGameStarted: boolean;
    firstPushIsFree: boolean;
  };
  countdown: {
    active: boolean;
    ms: number;
    lastShown: number;
    winSequenceStarted: boolean;
  };
  cats: {
    totalToRescue: number;
  };
  energy: {
    value: number;
  };
};

export const createSceneState = (
  energyMax: number,
  livesMax: number,
): SceneState => ({
  pause: {
    isPaused: false,
  },
  end: {
    state: 'none',
  },
  ball: {
    isLaunched: false,
    wasLaunchDown: false,
    explosionArmed: false,
    lastSeenPushSerial: 0,
    lastPaddleHitAtMs: -10000,
    latePushConsumed: true,
    ballCellHitCooldownMs: 0,
  },
  player: {
    lives: livesMax,
    resources: 0,
    hasGameStarted: false,
    firstPushIsFree: true,
  },
  countdown: {
    active: false,
    ms: 0,
    lastShown: -1,
    winSequenceStarted: false,
  },
  cats: {
    totalToRescue: 0,
  },
  energy: {
    value: energyMax,
  },
});
