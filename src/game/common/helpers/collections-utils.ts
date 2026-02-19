export class CollectionsUtils {
  public static shuffle<T>(source: readonly T[]): T[] {
    const result = [...source];

    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }
}
