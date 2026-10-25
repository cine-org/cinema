// row letters skip I and O so they are not confused with 1 and 0
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

const rowLabel = (index: number) =>
  index < LETTERS.length
    ? LETTERS[index]
    : LETTERS[Math.floor(index / LETTERS.length) - 1] + LETTERS[index % LETTERS.length];

// a preview only: the api labels the seats it stores. Rows without seats get no letter.
export const labelSeats = (seats: { x: number; y: number }[]) => {
  const rows = [...new Set(seats.map((s) => s.y))].sort((a, b) => a - b);
  const rowLetter = new Map(rows.map((y, i) => [y, rowLabel(i)]));
  const codes = new Map<string, string>();
  for (const y of rows) {
    seats
      .filter((s) => s.y === y)
      .sort((a, b) => a.x - b.x)
      .forEach((s, i) =>
        codes.set(`${s.x},${s.y}`, `${rowLetter.get(y)}${String(i + 1).padStart(2, '0')}`),
      );
  }
  return { codes, rowLetter };
};
