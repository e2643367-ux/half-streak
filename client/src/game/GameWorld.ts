/**
 * HALF / SPLIT style reminder: the full viewport is the game board—two Signal Lime/Vermilion
 * fields divided by one charcoal fate line, held together by a hard editorial record band.
 */
import { Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { PointerEventTypes, type PointerInfo } from "@babylonjs/core/Events/pointerEvents";
import { Scene } from "@babylonjs/core/scene";
import type { Choice, GamePhase } from "./types";

const COLOR = {
  ink: "#11110F",
  paper: "#F6F0E2",
  lime: "#C9E0BF",
  vermilion: "#F2C0BA",
} as const;

type Label = { mesh: Mesh; texture: DynamicTexture; width: number; height: number };
type ChoiceField = { mesh: Mesh; material: StandardMaterial };
type CelebrationPiece = { mesh: Mesh; velocity: Vector3; spin: number; life: number; duration: number };

export class GameWorld {
  private readonly scene: Scene;
  private readonly canvas: HTMLCanvasElement;
  private readonly camera: FreeCamera;
  private readonly leftField: ChoiceField;
  private readonly rightField: ChoiceField;
  private readonly streakLabel: Label;
  private readonly bestLabel: Label;
  private readonly dotsLabel: Label;
  private readonly statusLabel: Label;
  private readonly feedbackLabel: Label;
  private readonly leftLabel: Label;
  private readonly rightLabel: Label;
  private readonly leftKeyLabel: Label;
  private readonly rightKeyLabel: Label;
  private readonly helpLabel: Label;
  private readonly pointerObserver: unknown;
  private readonly pendingTimers = new Set<number>();
  private readonly celebrationPieces: CelebrationPiece[] = [];

  private phase: GamePhase = "playing";
  private answer: Choice = "left";
  private streak = 0;
  private best = 0;
  private hovered: Choice | null = null;
  private pulse: { choice: Choice; amount: number } | null = null;
  private feedbackLife = 0;
  private streakPulse = 0;

  constructor(scene: Scene, canvas: HTMLCanvasElement) {
    this.scene = scene;
    this.canvas = canvas;
    this.camera = this.createCamera();
    this.best = this.readBest();

    this.leftField = this.createField("left-field", -4, COLOR.lime);
    this.rightField = this.createField("right-field", 4, COLOR.vermilion);
    this.createStaticPanel("fate-line", 0, 0, 0.11, 18, COLOR.ink, 0.15);
    this.createStaticPanel("record-band", 0, 4.03, 16.3, 0.96, COLOR.ink, -0.1);
    this.createStaticPanel("brand-lime", -7.2, 4.03, 0.18, 0.36, COLOR.lime, -0.2);
    this.createStaticPanel("brand-vermilion", -6.96, 4.03, 0.18, 0.36, COLOR.vermilion, -0.2);

    const wordmark = this.createLabel("wordmark", 3.15, 0.42, new Vector3(-5.18, 4.03, -0.5));
    this.setLabel(wordmark, "HALF / STREAK", "800 72px 'Archivo Black', sans-serif", COLOR.paper, "left");
    this.streakLabel = this.createLabel("streak", 2.1, 0.66, new Vector3(0, 4.06, -0.5));
    this.bestLabel = this.createLabel("best", 2.2, 0.42, new Vector3(6.15, 4.03, -0.5));
    this.dotsLabel = this.createLabel("dots", 2.7, 0.22, new Vector3(0, 3.5, -0.5));
    this.statusLabel = this.createLabel("status", 4.8, 0.38, new Vector3(0, 2.5, -0.5));
    this.feedbackLabel = this.createLabel("feedback", 4.0, 0.76, new Vector3(0, 2.5, -0.7));
    this.leftLabel = this.createLabel("left-label", 5.2, 1.65, new Vector3(-4, -0.55, -0.5));
    this.rightLabel = this.createLabel("right-label", 5.2, 1.65, new Vector3(4, -0.55, -0.5));
    this.leftKeyLabel = this.createLabel("left-key", 2.9, 0.34, new Vector3(-4, -2.32, -0.5));
    this.rightKeyLabel = this.createLabel("right-key", 2.9, 0.34, new Vector3(4, -2.32, -0.5));
    this.helpLabel = this.createLabel("help", 7.8, 0.3, new Vector3(0, -3.82, -0.5));

    this.setLabel(this.leftLabel, "左", "900 470px 'Noto Sans JP', sans-serif", COLOR.ink);
    this.setLabel(this.rightLabel, "右", "900 470px 'Noto Sans JP', sans-serif", COLOR.ink);
    this.setLabel(this.leftKeyLabel, "A　/　←", "800 66px 'Archivo Black', sans-serif", COLOR.ink);
    this.setLabel(this.rightKeyLabel, "D　/　→", "800 66px 'Archivo Black', sans-serif", COLOR.ink);
    this.setLabel(this.helpLabel, "クリックでも選べる", "700 40px 'Noto Sans JP', sans-serif", COLOR.ink);
    this.feedbackLabel.mesh.visibility = 0;

    this.pointerObserver = this.scene.onPointerObservable.add((info: PointerInfo) => {
      if (info.type === PointerEventTypes.POINTERMOVE) this.updateHover(info.event as PointerEvent);
      if (info.type === PointerEventTypes.POINTERUP) this.handlePointer(info.event as PointerEvent);
    });
    window.addEventListener("keydown", this.onKeyDown);
    this.beginRound();

    if (new URLSearchParams(window.location.search).has("demo")) {
      this.streak = 2;
      this.updateHud();
      this.schedule(() => this.playDemoStep(0), 250);
    }
  }

  update(deltaMs: number) {
    this.syncCamera();
    const leftScale = this.hovered === "left" ? 1.018 : 1;
    const rightScale = this.hovered === "right" ? 1.018 : 1;
    if (this.pulse) {
      this.pulse.amount = Math.max(0, this.pulse.amount - deltaMs / 240);
      const scale = 1 + this.pulse.amount * 0.045;
      if (this.pulse.choice === "left") this.leftField.mesh.scaling.set(scale, scale, 1);
      else this.rightField.mesh.scaling.set(scale, scale, 1);
      if (this.pulse.amount === 0) this.pulse = null;
    }
    if (!this.pulse) {
      this.leftField.mesh.scaling.set(leftScale, leftScale, 1);
      this.rightField.mesh.scaling.set(rightScale, rightScale, 1);
    }
    if (this.streakPulse > 0) {
      this.streakPulse = Math.max(0, this.streakPulse - deltaMs / 300);
      const scale = 1 + this.streakPulse * 0.18;
      this.streakLabel.mesh.scaling.set(scale, scale, 1);
    } else {
      this.streakLabel.mesh.scaling.set(1, 1, 1);
    }
    if (this.feedbackLife > 0) {
      this.feedbackLife = Math.max(0, this.feedbackLife - deltaMs / 570);
      this.feedbackLabel.mesh.visibility = this.feedbackLife;
    }
    for (let index = this.celebrationPieces.length - 1; index >= 0; index -= 1) {
      const piece = this.celebrationPieces[index];
      piece.life -= deltaMs;
      piece.mesh.position.addInPlace(piece.velocity.scale(deltaMs / 1000));
      piece.velocity.y -= (deltaMs / 1000) * 2.8;
      piece.mesh.rotation.z += piece.spin * (deltaMs / 1000);
      piece.mesh.visibility = Math.max(0, piece.life / piece.duration);
      if (piece.life <= 0) {
        piece.mesh.dispose();
        this.celebrationPieces.splice(index, 1);
      }
    }
  }

  dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    Array.from(this.pendingTimers).forEach((timer) => window.clearTimeout(timer));
    this.pendingTimers.clear();
    if (this.pointerObserver) this.scene.onPointerObservable.remove(this.pointerObserver as never);
    this.celebrationPieces.forEach((piece) => piece.mesh.dispose());
    this.celebrationPieces.length = 0;
  }

  private createCamera() {
    const camera = new FreeCamera("orthographic-camera", new Vector3(0, 0, -10), this.scene);
    camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    camera.setTarget(Vector3.Zero());
    camera.minZ = 0.1;
    camera.maxZ = 100;
    this.scene.activeCamera = camera;
    this.syncCamera(camera);
    return camera;
  }

  private syncCamera(camera = this.camera) {
    const engine = this.scene.getEngine();
    const width = Math.max(1, engine.getRenderWidth());
    const height = Math.max(1, engine.getRenderHeight());
    const aspect = width / height;
    const baseAspect = 16 / 9;
    if (aspect >= baseAspect) {
      const halfWidth = (9 * aspect) / 2;
      camera.orthoLeft = -halfWidth;
      camera.orthoRight = halfWidth;
      camera.orthoTop = 4.5;
      camera.orthoBottom = -4.5;
    } else {
      const halfHeight = 16 / aspect / 2;
      camera.orthoLeft = -8;
      camera.orthoRight = 8;
      camera.orthoTop = halfHeight;
      camera.orthoBottom = -halfHeight;
    }
  }

  private createField(name: string, x: number, color: string): ChoiceField {
    const mesh = MeshBuilder.CreatePlane(name, { width: 7.95, height: 18 }, this.scene);
    mesh.position = new Vector3(x, 0, 0.55);
    const material = new StandardMaterial(`${name}-material`, this.scene);
    material.disableLighting = true;
    material.diffuseColor = Color3.FromHexString(color);
    material.emissiveColor = Color3.FromHexString(color);
    material.backFaceCulling = false;
    mesh.material = material;
    return { mesh, material };
  }

  private createStaticPanel(name: string, x: number, y: number, width: number, height: number, color: string, z: number) {
    const mesh = MeshBuilder.CreatePlane(name, { width, height }, this.scene);
    mesh.position = new Vector3(x, y, z);
    const material = new StandardMaterial(`${name}-material`, this.scene);
    material.disableLighting = true;
    material.diffuseColor = Color3.FromHexString(color);
    material.emissiveColor = Color3.FromHexString(color);
    material.backFaceCulling = false;
    mesh.material = material;
  }

  private createLabel(name: string, width: number, height: number, position: Vector3): Label {
    const textureWidth = Math.round(width * 440);
    const textureHeight = Math.round(height * 440);
    const texture = new DynamicTexture(`${name}-texture`, { width: textureWidth, height: textureHeight }, this.scene, true);
    texture.hasAlpha = true;
    const material = new StandardMaterial(`${name}-material`, this.scene);
    material.disableLighting = true;
    material.diffuseTexture = texture;
    material.emissiveTexture = texture;
    material.useAlphaFromDiffuseTexture = true;
    material.backFaceCulling = false;
    material.specularColor = Color3.Black();
    const mesh = MeshBuilder.CreatePlane(name, { width, height }, this.scene);
    mesh.position = position;
    mesh.material = material;
    return { mesh, texture, width: textureWidth, height: textureHeight };
  }

  private setLabel(label: Label, text: string, font: string, color: string, align: CanvasTextAlign = "center") {
    const context = label.texture.getContext() as CanvasRenderingContext2D;
    context.clearRect(0, 0, label.width, label.height);
    context.font = font;
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = "middle";
    const x = align === "left" ? label.width * 0.03 : align === "right" ? label.width * 0.97 : label.width / 2;
    context.fillText(text, x, label.height / 2);
    label.texture.update();
  }

  private beginRound(keepFeedback = false) {
    this.phase = "playing";
    this.answer = Math.random() < 0.5 ? "left" : "right";
    if (!keepFeedback) {
      this.feedbackLabel.mesh.visibility = 0;
      this.feedbackLife = 0;
    }
    this.leftField.material.alpha = this.hovered === "left" ? 0.86 : 1;
    this.rightField.material.alpha = this.hovered === "right" ? 0.86 : 1;
    this.setLabel(this.statusLabel, "どちらを選ぶ？", "700 54px 'Noto Sans JP', sans-serif", COLOR.ink);
    this.updateHud();
  }

  private choose(choice: Choice) {
    if (this.phase === "failed") {
      this.streak = 0;
      this.beginRound(true);
    }
    if (this.phase !== "playing") return;

    const hit = choice === this.answer;
    this.pulse = { choice, amount: 1 };
    if (hit) {
      this.streak += 1;
      this.best = Math.max(this.best, this.streak);
      this.persistBest();
      const milestoneTier = this.getMilestoneTier();
      this.streakPulse = 1 + milestoneTier * 0.5;
      this.createCelebration(choice, milestoneTier);
      this.showFeedback(this.getFeedbackMessage(milestoneTier), COLOR.paper, milestoneTier);
      this.updateHud();
      this.beginRound(true);
      if (milestoneTier > 0) {
        this.setLabel(this.statusLabel, `${this.streak}連勝！ 次も選べ`, "700 54px 'Noto Sans JP', sans-serif", COLOR.ink);
      }
      return;
    }

    this.phase = "failed";
    const winningWord = this.answer === "left" ? "左" : "右";
    this.showFeedback("MISS", COLOR.paper);
    this.setLabel(this.statusLabel, `正解は「${winningWord}」`, "700 54px 'Noto Sans JP', sans-serif", COLOR.ink);
    this.updateHud();
  }

  private updateHud() {
    this.setLabel(this.streakLabel, String(this.streak).padStart(2, "0"), "900 196px 'Archivo Black', sans-serif", COLOR.paper);
    this.setLabel(this.bestLabel, `BEST  ${String(this.best).padStart(2, "0")}`, "900 72px 'Archivo Black', sans-serif", COLOR.paper, "right");
    const dots = Array.from({ length: 8 }, (_, index) => (index < Math.min(this.streak, 8) ? "●" : "○")).join("  ");
    this.setLabel(this.dotsLabel, dots, "600 42px 'Noto Sans JP', sans-serif", COLOR.ink);
  }

  private showFeedback(text: string, color: string, milestoneTier = 0) {
    const size = milestoneTier === 2 ? 274 : milestoneTier === 1 ? 246 : 220;
    this.setLabel(this.feedbackLabel, text, `900 ${size}px 'Archivo Black', sans-serif`, color);
    this.feedbackLabel.mesh.visibility = 1;
    this.feedbackLife = 1 + milestoneTier * 0.7;
  }

  private createCelebration(choice: Choice, milestoneTier: number) {
    const originX = choice === "left" ? -4 : 4;
    const palette = [COLOR.paper, COLOR.ink];
    const pieceCount = 16 + milestoneTier * 12;
    const spread = 1 + milestoneTier * 0.65;
    const lifetime = 670 + milestoneTier * 350;
    for (let index = 0; index < pieceCount; index += 1) {
      const mesh = MeshBuilder.CreatePlane(`celebration-${Date.now()}-${index}`, {
        width: (0.09 + Math.random() * 0.08) * (1 + milestoneTier * 0.28),
        height: (0.28 + Math.random() * 0.24) * (1 + milestoneTier * 0.22),
      }, this.scene);
      mesh.position = new Vector3(originX + (Math.random() - 0.5) * 0.9 * spread, -0.1 + (Math.random() - 0.5) * 0.55, -0.85);
      mesh.rotation.z = Math.random() * Math.PI;
      const material = new StandardMaterial(`celebration-material-${Date.now()}-${index}`, this.scene);
      material.disableLighting = true;
      const color = Color3.FromHexString(palette[index % palette.length]);
      material.diffuseColor = color;
      material.emissiveColor = color;
      material.backFaceCulling = false;
      mesh.material = material;
      this.celebrationPieces.push({
        mesh,
        velocity: new Vector3((Math.random() - 0.5) * 3.1 * spread, (2.2 + Math.random() * 2.2) * spread, 0),
        spin: (Math.random() - 0.5) * 10 * (1 + milestoneTier * 0.3),
        life: lifetime - 190 + Math.random() * 190,
        duration: lifetime,
      });
    }
  }

  private getMilestoneTier() {
    if (this.streak % 5 === 0) return 2;
    if (this.streak % 3 === 0) return 1;
    return 0;
  }

  private getFeedbackMessage(milestoneTier: number) {
    if (milestoneTier === 2) return `${this.streak} STREAK!`;
    if (milestoneTier === 1) return `${this.streak} STREAK!`;
    return this.streak > 1 ? `${this.streak} STREAK` : "NICE!";
  }

  private updateHover(event: PointerEvent) {
    if (this.phase !== "playing") return;
    const choice = this.choiceForPointer(event);
    if (choice === this.hovered) return;
    this.hovered = choice;
    this.leftField.material.alpha = choice === "left" ? 0.86 : 1;
    this.rightField.material.alpha = choice === "right" ? 0.86 : 1;
  }

  private handlePointer(event: PointerEvent) {
    this.canvas.focus();
    this.choose(this.choiceForPointer(event));
  }

  private choiceForPointer(event: PointerEvent): Choice {
    const rect = this.canvas.getBoundingClientRect();
    return event.clientX - rect.left < rect.width / 2 ? "left" : "right";
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (["ArrowLeft", "a", "A"].includes(event.key)) {
      event.preventDefault();
      this.choose("left");
    }
    if (["ArrowRight", "d", "D"].includes(event.key)) {
      event.preventDefault();
      this.choose("right");
    }
  };

  private playDemoStep(step: number) {
    if (step >= 5) return;
    if (this.phase === "playing") this.choose(this.answer);
    this.schedule(() => this.playDemoStep(step + 1), step === 0 ? 1750 : 1150);
  }

  private schedule(callback: () => void, ms: number) {
    const timer = window.setTimeout(() => {
      this.pendingTimers.delete(timer);
      callback();
    }, ms);
    this.pendingTimers.add(timer);
  }

  private readBest() {
    try {
      return Number(window.localStorage.getItem("half-streak-best") ?? 0) || 0;
    } catch {
      return 0;
    }
  }

  private persistBest() {
    try {
      window.localStorage.setItem("half-streak-best", String(this.best));
    } catch {
      // Storage is an enhancement; an unavailable browser store must not interrupt play.
    }
  }
}
