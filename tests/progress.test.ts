import { describe, expect, it } from "vitest";
import { mergeProgress, type ProgressState } from "../src/lib/progress/store";

const step = (updatedAt: number, screen = 0) => ({ screen, done: false, updatedAt });

describe("fusion de la progression à la connexion", () => {
  it("garde la version la plus récente de chaque étape et envoie au compte ce qui est plus récent sur l'appareil", () => {
    const local: ProgressState = { "f/m/a": step(200, 4), "f/m/b": step(100, 1), "f/m/c": step(50) };
    const account: ProgressState = { "f/m/a": step(150, 2), "f/m/b": step(300, 6), "f/m/d": step(10) };
    const { merged, toPush } = mergeProgress(local, account);
    expect(merged["f/m/a"].screen).toBe(4);
    expect(merged["f/m/b"].screen).toBe(6);
    expect(Object.keys(merged).sort()).toEqual(["f/m/a", "f/m/b", "f/m/c", "f/m/d"]);
    expect(toPush.sort()).toEqual(["f/m/a", "f/m/c"]);
  });

  it("n'envoie rien quand l'appareil est vide", () => {
    expect(mergeProgress({}, { "f/m/a": step(1) }).toPush).toEqual([]);
  });
});
