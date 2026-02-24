export class CollisionsUtils {
  public static hasIntersection(
    left: MatterJS.BodyType | null,
    right: MatterJS.BodyType | null,
  ): boolean {
    if (!left || !right) {
      return false;
    }

    const leftBounds = left.bounds;
    const rightBounds = right.bounds;

    return (
      leftBounds.max.x >= rightBounds.min.x &&
      leftBounds.min.x <= rightBounds.max.x &&
      leftBounds.max.y >= rightBounds.min.y &&
      leftBounds.min.y <= rightBounds.max.y
    );
  }
}
