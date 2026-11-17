import {
  DEFAULT_DIFFICULTY,
  DEFAULT_TIME_LIMIT_SECONDS,
  pickPuzzle,
  type Difficulty,
  type SudokuPuzzle,
} from "./puzzles";

export type GameStatus = "completed" | "abandoned" | "timed_out";

export type CellState = {
  value: number | null;
  given: boolean;
  correctOnce: boolean;
};

export type SudokuStats = {
  correctEntries: number;
  incorrectEntries: number;
  mistakesCount: number;
  completionTimeSeconds: number;
  finalScore: number;
  status: GameStatus | null;
};

export type SudokuEngine = {
  puzzle: SudokuPuzzle;
  difficulty: Difficulty;
  timeLimitSeconds: number;
  cells: CellState[];
  selectedIndex: number | null;
  stats: SudokuStats;
  finished: boolean;
};

function parseBoard(puzzle: SudokuPuzzle): CellState[] {
  return puzzle.puzzle.split("").map((ch) => {
    if (ch === "." || ch === "0") {
      return { value: null, given: false, correctOnce: false };
    }
    return { value: Number(ch), given: true, correctOnce: true };
  });
}

export function createEngine(
  difficulty: Difficulty = DEFAULT_DIFFICULTY,
  timeLimitSeconds: number = DEFAULT_TIME_LIMIT_SECONDS,
): SudokuEngine {
  const puzzle = pickPuzzle(difficulty);
  return {
    puzzle,
    difficulty,
    timeLimitSeconds,
    cells: parseBoard(puzzle),
    selectedIndex: null,
    stats: {
      correctEntries: 0,
      incorrectEntries: 0,
      mistakesCount: 0,
      completionTimeSeconds: 0,
      finalScore: 0,
      status: null,
    },
    finished: false,
  };
}

export function computeScore(
  correctEntries: number,
  mistakesCount: number,
  timeLimitSeconds: number,
  completionTimeSeconds: number,
): number {
  const raw =
    correctEntries * 10 -
    mistakesCount * 5 +
    Math.max(0, timeLimitSeconds - completionTimeSeconds) * 0.1;
  return Math.max(0, Math.round(raw * 100) / 100);
}

function isSolved(cells: CellState[], solution: string): boolean {
  return cells.every((cell, index) => {
    const expected = Number(solution[index]);
    return cell.value === expected;
  });
}

function finalize(
  engine: SudokuEngine,
  status: GameStatus,
  elapsedSeconds: number,
): SudokuEngine {
  const completionTimeSeconds = Math.min(
    engine.timeLimitSeconds,
    Math.max(0, Math.floor(elapsedSeconds)),
  );
  const finalScore = computeScore(
    engine.stats.correctEntries,
    engine.stats.mistakesCount,
    engine.timeLimitSeconds,
    completionTimeSeconds,
  );
  return {
    ...engine,
    finished: true,
    selectedIndex: null,
    stats: {
      ...engine.stats,
      completionTimeSeconds,
      finalScore,
      status,
    },
  };
}

export function selectCell(engine: SudokuEngine, index: number): SudokuEngine {
  if (engine.finished) {
    return engine;
  }
  if (index < 0 || index > 80) {
    return engine;
  }
  return { ...engine, selectedIndex: index };
}

export function clearSelected(engine: SudokuEngine): SudokuEngine {
  if (engine.finished || engine.selectedIndex === null) {
    return engine;
  }
  const index = engine.selectedIndex;
  const cell = engine.cells[index];
  if (cell.given || cell.value === null) {
    return engine;
  }
  const cells = engine.cells.slice();
  cells[index] = { ...cell, value: null };
  return { ...engine, cells };
}

export function placeDigit(
  engine: SudokuEngine,
  digit: number,
  elapsedSeconds: number,
): SudokuEngine {
  if (engine.finished || engine.selectedIndex === null) {
    return engine;
  }
  if (digit < 1 || digit > 9) {
    return engine;
  }

  const index = engine.selectedIndex;
  const cell = engine.cells[index];
  if (cell.given) {
    return engine;
  }

  const expected = Number(engine.puzzle.solution[index]);
  const cells = engine.cells.slice();
  let correctEntries = engine.stats.correctEntries;
  let incorrectEntries = engine.stats.incorrectEntries;
  let mistakesCount = engine.stats.mistakesCount;
  let correctOnce = cell.correctOnce;

  if (digit === expected) {
    if (!correctOnce) {
      correctEntries += 1;
      correctOnce = true;
    }
    cells[index] = { value: digit, given: false, correctOnce };
  } else {
    incorrectEntries += 1;
    mistakesCount += 1;
    cells[index] = { value: digit, given: false, correctOnce };
  }

  const next: SudokuEngine = {
    ...engine,
    cells,
    stats: {
      ...engine.stats,
      correctEntries,
      incorrectEntries,
      mistakesCount,
    },
  };

  if (isSolved(cells, engine.puzzle.solution)) {
    return finalize(next, "completed", elapsedSeconds);
  }
  return next;
}

export function markTimedOut(
  engine: SudokuEngine,
  elapsedSeconds: number,
): SudokuEngine {
  if (engine.finished) {
    return engine;
  }
  return finalize(engine, "timed_out", elapsedSeconds);
}

export function markAbandoned(
  engine: SudokuEngine,
  elapsedSeconds: number,
): SudokuEngine {
  if (engine.finished) {
    return engine;
  }
  return finalize(engine, "abandoned", elapsedSeconds);
}

export function formatCountdown(remainingSeconds: number): string {
  const safe = Math.max(0, remainingSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
