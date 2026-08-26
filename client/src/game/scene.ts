/**
 * HALF / SPLIT style reminder: Babylon renders two full-height choice fields split by one line
 * and anchored by a record band; React only hosts the scene.
 */
import { Engine } from "@babylonjs/core/Engines/engine";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Scene } from "@babylonjs/core/scene";
import { GameWorld } from "./GameWorld";

export type GameHandle = {
  scene: Scene;
  dispose: () => void;
};

export async function createGameScene(engine: Engine, canvas: HTMLCanvasElement): Promise<GameHandle> {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.067, 0.067, 0.059, 1);
  const world = new GameWorld(scene, canvas);
  const updateObserver = scene.onBeforeRenderObservable.add(() => world.update(engine.getDeltaTime()));

  return {
    scene,
    dispose: () => {
      scene.onBeforeRenderObservable.remove(updateObserver);
      world.dispose();
      scene.dispose();
    },
  };
}
