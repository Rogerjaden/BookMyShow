export const SEAT_TYPES = ['REGULAR', 'PREMIUM', 'RECLINER', 'ACCESSIBLE'];

export const SEAT_TYPE_META = {
  REGULAR: { label: 'Regular', color: '#5B8DEF', hint: 'Standard seat' },
  PREMIUM: { label: 'Premium', color: '#E8A93B', hint: 'Wider seat with a better view' },
  RECLINER: { label: 'Recliner', color: '#A06BFF', hint: 'Reclining seat with a footrest' },
  ACCESSIBLE: { label: 'Accessible', color: '#2DBFA6', hint: 'Space for wheelchair users' },
};

export const SELECTED_COLOR = '#FF5252';
export const MAX_SEATS_PER_BOOKING = 8;

export const formatPrice = (value) =>
  value === null || value === undefined || value === '' ? '' : `₹${Number(value).toLocaleString('en-IN')}`;

/* ---------- row labels: A..Z, AA, AB ... (backend allows up to 5 characters) ---------- */

export const indexToRowLabel = (index) => {
  let n = index;
  let label = '';
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
};

export const rowLabelToIndex = (label) =>
  String(label)
    .toUpperCase()
    .split('')
    .reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0) - 1;

// "B" < "Z" < "AA": shorter labels first, then alphabetical
export const compareRows = (a, b) => a.length - b.length || a.localeCompare(b);

/* ---------- layout ---------- */

const mostCommon = (values) => {
  const counts = new Map();
  values.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
  let best = null;
  let bestCount = -1;
  counts.forEach((count, value) => {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  });
  return best;
};

/**
 * Groups seats into rows and works out the column range.
 * Seat numbers are treated as physical column positions, so a jump in
 * numbering (5 -> 7) is drawn as an aisle.
 */
export const buildLayout = (seats = []) => {
  const byRow = new Map();
  let minCol = Infinity;
  let maxCol = -Infinity;

  seats.forEach((seat) => {
    const n = Number(seat.seatNumber);
    if (!Number.isFinite(n)) return;
    minCol = Math.min(minCol, n);
    maxCol = Math.max(maxCol, n);
    if (!byRow.has(seat.rowLabel)) byRow.set(seat.rowLabel, []);
    byRow.get(seat.rowLabel).push(seat);
  });

  if (byRow.size === 0) return { rows: [], minCol: 1, maxCol: 1, cols: 0 };

  const rows = [...byRow.keys()].sort(compareRows).map((label) => {
    const rowSeats = byRow.get(label).sort((a, b) => a.seatNumber - b.seatNumber);
    const prices = rowSeats.map((s) => s.price).filter((p) => p !== null && p !== undefined);
    return {
      label,
      seats: rowSeats,
      type: mostCommon(rowSeats.map((s) => s.seatType)),
      price: prices.length ? mostCommon(prices) : null,
    };
  });

  return { rows, minCol, maxCol, cols: maxCol - minCol + 1 };
};

/**
 * "Best available": the contiguous group in one row, one tier, that sits
 * closest to the middle of the hall (about 60% of the way back).
 * Accessible seats are kept for the people who need them.
 */
export const findBestSeats = (seats, count) => {
  const { rows, minCol, maxCol } = buildLayout(seats);
  if (!rows.length || count < 1) return [];

  const targetRow = (rows.length - 1) * 0.6;
  const centerCol = (minCol + maxCol) / 2;
  const usable = (s) => s.status === 'AVAILABLE' && s.seatType !== 'ACCESSIBLE';

  let best = null;
  let bestScore = Infinity;

  rows.forEach((row, rowIdx) => {
    for (let i = 0; i + count <= row.seats.length; i += 1) {
      const group = row.seats.slice(i, i + count);
      const ok = group.every(
        (seat, j) =>
          usable(seat) &&
          (j === 0 ||
            (seat.seatNumber - group[j - 1].seatNumber === 1 && seat.seatType === group[j - 1].seatType))
      );
      if (!ok) continue;
      const mid = (group[0].seatNumber + group[count - 1].seatNumber) / 2;
      const score = Math.abs(rowIdx - targetRow) * 2 + Math.abs(mid - centerCol);
      if (score < bestScore) {
        bestScore = score;
        best = group;
      }
    }
  });

  return best || [];
};
