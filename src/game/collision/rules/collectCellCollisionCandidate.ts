export type CellCollisionCandidate<CellT> = {
  cell: CellT;
  body: MatterJS.BodyType;
  normalX: number;
  normalY: number;
  depth: number;
  approachSpeed: number;
};

type CollectCellCollisionCandidateParams<CellT> = {
  current?: CellCollisionCandidate<CellT>;
  cell?: CellT;
  body: MatterJS.BodyType;
  depth: number;
  normalX: number;
  normalY: number;
  velocityX: number;
  velocityY: number;
};

export const collectCellCollisionCandidate = <CellT>({
  current,
  cell,
  body,
  depth,
  normalX,
  normalY,
  velocityX,
  velocityY,
}: CollectCellCollisionCandidateParams<CellT>):
  | CellCollisionCandidate<CellT>
  | undefined => {
  if (!cell) {
    return current;
  }

  const approachSpeed = Math.abs(velocityX * normalX + velocityY * normalY);
  if (!current || depth > current.depth) {
    return {
      cell,
      body,
      normalX,
      normalY,
      depth,
      approachSpeed,
    };
  }

  return current;
};
