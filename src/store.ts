import { TetrisGame } from "./game";
import type { GameState, GameConfig } from "./game";

export class TetrisStore {
  private game: TetrisGame;
  private listeners: Set<() => void> = new Set();
  private lastUpdateTime: number = 0;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastSnapshot: GameState;
  private hasChanges: boolean = false;

  constructor(config: GameConfig) {
    this.game = new TetrisGame(config);
    this.lastSnapshot = this.game.getState();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): GameState => {
    if (this.hasChanges) {
      this.lastSnapshot = this.game.getState();
      this.hasChanges = false;
    }
    return this.lastSnapshot;
  };

  private notifyListeners = (): void => {
    this.hasChanges = true;
    this.listeners.forEach((listener) => listener());
  };

  private gameLoop = (timestamp: number): void => {
    if (!this.isRunning) return;

    const state = this.getSnapshot();
    if (state.gameOver || state.isPaused) {
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
      return;
    }

    const speed = 1000 - (state.level - 1) * 50;
    const elapsed = timestamp - this.lastUpdateTime;

    if (elapsed > speed) {
      this.moveDown();
      this.lastUpdateTime = timestamp;
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  startGameLoop = (): void => {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastUpdateTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  stopGameLoop = (): void => {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  };

  moveDown = (): boolean => {
    const result = this.game.moveDown();
    if (result) {
      this.notifyListeners();
    } else {
      // При столкновении также уведомляем, так как состояние могло измениться (game over)
      this.notifyListeners();
    }
    return result;
  };

  hardDrop = (): void => {
    this.game.hardDrop();
    this.notifyListeners(); // Всегда уведомляем после hard drop
  };

  moveLeft = (): boolean => {
    const result = this.game.moveLeft();
    if (result) {
      this.notifyListeners();
    }
    return result;
  };

  moveRight = (): boolean => {
    const result = this.game.moveRight();
    if (result) {
      this.notifyListeners();
    }
    return result;
  };

  rotate = (): boolean => {
    const result = this.game.rotate();
    if (result) {
      this.notifyListeners();
    }
    return result;
  };

  togglePause = (): void => {
    this.game.togglePause();
    this.notifyListeners();
  };

  restart = (): void => {
    this.game.restart();
    this.lastSnapshot = this.game.getState();
    this.hasChanges = true;
    this.notifyListeners();
  };

  getBoardWithPiece = (): number[][] => {
    return this.game.getBoardWithPiece();
  };

  destroy = (): void => {
    this.stopGameLoop();
    this.listeners.clear();
  };
}

export const createTetrisStore = (config: GameConfig): TetrisStore => {
  return new TetrisStore(config);
};

export const defaultConfig: GameConfig = {
  width: 10,
  height: 20,
  initialLevel: 1,
};
