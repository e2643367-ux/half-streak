/**
 * HALF / SPLIT style reminder: this component is only the picture frame; the full-screen
 * charcoal game stage, its fate line, and all interaction belong to Babylon GameWorld.
 */
import { useEffect, useRef } from "react";
import { Engine } from "@babylonjs/core/Engines/engine";
import { createGameScene, type GameHandle } from "@/game/scene";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || startedRef.current) return;
    startedRef.current = true;

    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      adaptToDeviceRatio: true,
    });

    let handle: GameHandle | null = null;
    let disposed = false;
    createGameScene(engine, canvas).then((nextHandle) => {
      if (disposed) {
        nextHandle.dispose();
        return;
      }
      handle = nextHandle;
      engine.runRenderLoop(() => nextHandle.scene.render());
    });

    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      handle?.dispose();
      engine.dispose();
      startedRef.current = false;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-full w-full touch-none outline-none"
      style={{ touchAction: "none" }}
      aria-label="HALF STREAK。左右どちらかを選び、連勝記録を伸ばすゲーム。"
      role="application"
      tabIndex={0}
    />
  );
}
