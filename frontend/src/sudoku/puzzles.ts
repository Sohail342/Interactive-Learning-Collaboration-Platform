export type Difficulty = "easy" | "medium" | "hard";

export type SudokuPuzzle = {
  id: string;
  difficulty: Difficulty;
  /** 81 chars, '.' for empty, '1'-'9' for givens */
  puzzle: string;
  /** 81 chars, full solved board */
  solution: string;
};

const PUZZLES: SudokuPuzzle[] = [
  {
    id: "easy-1",
    difficulty: "easy",
    puzzle:
      "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79",
    solution:
      "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
  },
  {
    id: "medium-1",
    difficulty: "medium",
    puzzle:
      "..3.2.6..9..3.5..1..18.64....81.29..7.......8..67.82....26.95..8..2.3..9..5.1.3..",
    solution:
      "483921657967345821251876493548132976729564138136798245372689514814253769695417382",
  },
  {
    id: "hard-1",
    difficulty: "hard",
    puzzle:
      "4.....8.5.3..........7......2.....6.....8.4......1.......6.3.7.5..2.....1.4......",
    solution:
      "417369825632158947958724316825437169791586432346912758289643571573291684164875293",
  },
];

export const DEFAULT_DIFFICULTY: Difficulty = "medium";
export const DEFAULT_TIME_LIMIT_SECONDS = 600;

export function pickPuzzle(difficulty: Difficulty = DEFAULT_DIFFICULTY): SudokuPuzzle {
  const matches = PUZZLES.filter((item) => item.difficulty === difficulty);
  if (matches.length === 0) {
    return PUZZLES[0];
  }
  return matches[Math.floor(Math.random() * matches.length)];
}
