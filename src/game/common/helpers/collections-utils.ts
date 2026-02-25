export class CollectionsUtils {
  /**
   * Creates a shuffled copy of the given collection using the Fisher-Yates algorithm.
   */
  public static shuffle<T>(source: readonly T[]): T[] {
    const result = [...source];

    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  /**
   * Removes the first occurrence of `obj` from `source` in place and returns it.
   */
  public static remove<T>(source: T[], obj: T): T | null {
    const index = source.indexOf(obj);

    if (index < 0) {
      return null;
    }

    return source.splice(index, 1)[0];
  }
}
