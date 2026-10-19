import React, { useMemo } from 'react';
import { SEAT_TYPE_META, buildLayout } from '../../utils/seatUtils';
import './seats.css';

/** A tiny dot-per-seat preview of a screen's layout, for cards and lists. */
const MiniSeatMap = ({ seats = [] }) => {
  const layout = useMemo(
    () => buildLayout(seats.filter((s) => s.status !== 'INACTIVE')),
    [seats]
  );
  if (!layout.rows.length) return null;

  const dot = Math.max(3, Math.min(7, Math.floor(240 / layout.cols) - 2));

  return (
    <div
      className="mini-map"
      style={{
        gridTemplateColumns: `repeat(${layout.cols}, ${dot}px)`,
        gridAutoRows: `${dot}px`,
        '--dot': `${dot}px`,
      }}
      aria-hidden="true"
    >
      {layout.rows.map((row, rowIdx) =>
        row.seats.map((seat) => (
          <i
            key={seat.id}
            style={{
              gridColumn: seat.seatNumber - layout.minCol + 1,
              gridRow: rowIdx + 1,
              width: dot,
              height: dot,
              '--seat-color': seat.status === 'MAINTENANCE' ? '#8a7f66' : (SEAT_TYPE_META[seat.seatType] || SEAT_TYPE_META.REGULAR).color,
              animationDelay: `${Math.min(rowIdx * 30 + seat.seatNumber * 4, 600)}ms`,
            }}
          />
        ))
      )}
    </div>
  );
};

export default React.memo(MiniSeatMap);
