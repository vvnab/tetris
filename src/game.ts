// Типы фигур Тетриса
export type TetrominoType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

// Позиция фигуры на поле
export interface Position {
  x: number;
  y: number;
}

// Фигура Тетриса
export interface Tetromino {
  type: TetrominoType;
  shape: number[][];
  position: Position;
}

// Состояние игры
export interface GameState {
  board: number[][];
  currentPiece: Tetromino | null;
  nextPiece: Tetromino;
  score: number;
  level: number;
  linesCleared: number;
  gameOver: boolean;
  isPaused: boolean;
}

// Конфигурация игры
export interface GameConfig {
  width: number;
  height: number;
  initialLevel: number;
}

// Формы фигур
const SHAPES: Record<TetrominoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

export class TetrisGame {
  private state: GameState;
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
    this.state = this.createInitialState();
  }

  // Создание начального состояния игры
  private createInitialState(): GameState {
    const board = Array(this.config.height)
      .fill(null)
      .map(() => Array(this.config.width).fill(0));

    return {
      board,
      currentPiece: this.createRandomTetromino(),
      nextPiece: this.createRandomTetromino(),
      score: 0,
      level: this.config.initialLevel,
      linesCleared: 0,
      gameOver: false,
      isPaused: false,
    };
  }

  // Создание случайной фигуры
  private createRandomTetromino(): Tetromino {
    const types: TetrominoType[] = ["I", "O", "T", "S", "Z", "J", "L"];
    const type = types[Math.floor(Math.random() * types.length)];

    return {
      type,
      shape: SHAPES[type],
      position: { x: Math.floor(this.config.width / 2) - 1, y: 0 },
    };
  }

  // Получение текущего состояния игры
  public getState(): GameState {
    return { ...this.state };
  }


  // Движение фигуры вниз
  public moveDown(): boolean {
    if (
      this.state.gameOver ||
      this.state.isPaused ||
      !this.state.currentPiece
    ) {
      return false;
    }

    const movedPiece = {
      ...this.state.currentPiece,
      position: {
        ...this.state.currentPiece.position,
        y: this.state.currentPiece.position.y + 1,
      },
    };

    if (this.checkCollision(movedPiece, this.state.board)) {
      this.lockPiece();
      return false;
    }

    this.state.currentPiece = movedPiece;
    return true;
  }

  // Движение фигуры влево
  public moveLeft(): boolean {
    if (
      this.state.gameOver ||
      this.state.isPaused ||
      !this.state.currentPiece
    ) {
      return false;
    }

    const movedPiece = {
      ...this.state.currentPiece,
      position: {
        ...this.state.currentPiece.position,
        x: this.state.currentPiece.position.x - 1,
      },
    };

    if (this.checkCollision(movedPiece, this.state.board)) {
      return false;
    }

    this.state.currentPiece = movedPiece;
    return true;
  }

  // Движение фигуры вправо
  public moveRight(): boolean {
    if (
      this.state.gameOver ||
      this.state.isPaused ||
      !this.state.currentPiece
    ) {
      return false;
    }

    const movedPiece = {
      ...this.state.currentPiece,
      position: {
        ...this.state.currentPiece.position,
        x: this.state.currentPiece.position.x + 1,
      },
    };

    if (this.checkCollision(movedPiece, this.state.board)) {
      return false;
    }

    this.state.currentPiece = movedPiece;
    return true;
  }

  // Вращение фигуры
public rotate(): boolean {
    if (this.state.gameOver || this.state.isPaused || !this.state.currentPiece) {
      return false;
    }

    const rotatedShape = this.rotateMatrix(this.state.currentPiece.shape);
    const originalPiece = this.state.currentPiece;
    
    // Пробуем вращение без смещения
    let rotatedPiece = {
      ...originalPiece,
      shape: rotatedShape,
    };

    if (!this.checkCollision(rotatedPiece, this.state.board)) {
      this.state.currentPiece = rotatedPiece;
      return true;
    }

    // Wall kick: пробуем смещения для I-фигуры и других
    const kickTests = this.getKickTests(originalPiece.type);
    
    for (const [dx, dy] of kickTests) {
      rotatedPiece = {
        ...originalPiece,
        shape: rotatedShape,
        position: {
          x: originalPiece.position.x + dx,
          y: originalPiece.position.y + dy,
        },
      };

      if (!this.checkCollision(rotatedPiece, this.state.board)) {
        this.state.currentPiece = rotatedPiece;
        return true;
      }
    }

    return false;
  }

  // Получение тестов смещения для wall kick
  private getKickTests(type: TetrominoType): [number, number][] {
    // Для I-фигуры особые смещения
    if (type === 'I') {
      return [
        [0, 0], [ -1, 0], [2, 0], [ -1, 0], [2, 0],  // Стандартные смещения для I
        [0, 1], [0, -1], [1, 0], [ -2, 0], [1, 0]   // Дополнительные смещения
      ];
    }

    // Для O-фигуры вращение не нужно (квадрат)
    if (type === 'O') {
      return [[0, 0]];
    }

    // Стандартные смещения для других фигур
    return [
      [0, 0], [ -1, 0], [ -1, 1], [0, -2], [ -1, -2],  // J, L, S, T, Z
      [1, 0], [1, -1], [0, 2], [1, 2], [ -2, 0]        // Альтернативные смещения
    ];
  }

  // Вращение матрицы (исправленная версия)
  private rotateMatrix(matrix: number[][]): number[][] {
    const N = matrix.length;
    const result: number[][] = [];
    
    // Создаем пустую матрицу
    for (let i = 0; i < N; i++) {
      result.push(Array(N).fill(0));
    }
    
    // Поворачиваем по часовой стрелке
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        result[x][N - 1 - y] = matrix[y][x];
      }
    }
    
    return result;
  }

  // Проверка коллизий (добавлена отладочная информация)
  private checkCollision(piece: Tetromino, board: number[][]): boolean {
    const { shape, position } = piece;

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] !== 0) {
          const boardX = position.x + x;
          const boardY = position.y + y;

          // Проверка границ
          if (boardX < 0 || boardX >= this.config.width) {
            return true; // Выход за горизонтальные границы
          }
          
          if (boardY >= this.config.height) {
            return true; // Выход за нижнюю границу
          }
          
          // Проверка столкновения с другими фигурами (только если в пределах доски)
          if (boardY >= 0 && board[boardY][boardX] !== 0) {
            return true;
          }
        }
      }
    }

    return false;
  }

  // Фиксация фигуры на поле
  private lockPiece(): void {
    if (!this.state.currentPiece) return;

    const { shape, position } = this.state.currentPiece;
    const newBoard = this.state.board.map(row => [...row]);

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] !== 0) {
          const boardX = position.x + x;
          const boardY = position.y + y;

          if (boardY >= 0) {
            newBoard[boardY][boardX] = 1;
            
            // Проверка game over: если фигура зафиксировалась в верхнем ряду
            if (boardY <= 1) {
              this.state.gameOver = true;
            }
          }
        }
      }
    }

    this.state.board = newBoard;
    this.clearLines();
    this.spawnNewPiece();
  }

  // Очистка заполненных линий
  private clearLines(): void {
    let linesCleared = 0;

    for (let y = this.config.height - 1; y >= 0; y--) {
      if (this.state.board[y].every((cell) => cell !== 0)) {
        this.state.board.splice(y, 1);
        this.state.board.unshift(Array(this.config.width).fill(0));
        linesCleared++;
        y++;
      }
    }

    if (linesCleared > 0) {
      this.updateScore(linesCleared);
    }
  }

  // Обновление счета
  private updateScore(linesCleared: number): void {
    const points = [0, 100, 300, 500, 800];
    this.state.score += points[linesCleared] * this.state.level;
    this.state.linesCleared += linesCleared;
    this.state.level =
      this.config.initialLevel + Math.floor(this.state.linesCleared / 10);
  }

  // Создание новой фигуры
  private spawnNewPiece(): void {
    this.state.currentPiece = this.state.nextPiece;
    this.state.nextPiece = this.createRandomTetromino();

    if (this.checkCollision(this.state.currentPiece, this.state.board)) {
      this.state.gameOver = true;
    }
  }

  // Hard drop
  public hardDrop(): void {
    if (
      this.state.gameOver ||
      this.state.isPaused ||
      !this.state.currentPiece
    ) {
      return;
    }

    while (this.moveDown()) {;}
  }

  // Пауза/продолжение игры
  public togglePause(): void {
    if (!this.state.gameOver) {
      this.state.isPaused = !this.state.isPaused;
    }
  }

  // Перезапуск игры
  public restart(): void {
    this.state = this.createInitialState();
  }

  // Получение текущего игрового поля с активной фигурой
  public getBoardWithPiece(): number[][] {
    const board = this.state.board.map((row) => [...row]);

    if (this.state.currentPiece) {
      const { shape, position } = this.state.currentPiece;

      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x] !== 0) {
            const boardX = position.x + x;
            const boardY = position.y + y;

            if (
              boardY >= 0 &&
              boardY < this.config.height &&
              boardX >= 0 &&
              boardX < this.config.width
            ) {
              board[boardY][boardX] = 2;
            }
          }
        }
      }
    }

    return board;
  }
}
