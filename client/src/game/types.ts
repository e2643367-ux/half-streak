/**
 * HALF / SPLIT style reminder: state names are intentionally small and explicit;
 * the game logic must stay framework-free and preserve the immediate two-choice rhythm.
 */
export type Choice = "left" | "right";

export type GamePhase = "playing" | "correct" | "failed";
