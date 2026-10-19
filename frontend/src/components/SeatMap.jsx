import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import SeatIcon from './seats/SeatIcon';
import ScreenGlow from './seats/ScreenGlow';
import { SEAT_TYPE_META, SELECTED_COLOR, buildLayout, formatPrice } from '../utils/seatUtils';
import './seats/seats.css';

const ZOOM_LEVELS = [0.8, 1, 1.2, 1.4];
const LABEL_WIDTH = 26;

const STATE_TEXT = {
  available: 'Available',
  selected: 'Selected',
  booked: 'Already booked',
  locked: 'Held by another customer',
  blocked: 'Not for sale',
};

const getSeatState = (seat, selected) => {
  if (seat.status === 'BOOKED') return 'booked';
  if (seat.status === 'LOCKED') return 'locked';
  if (seat.status === 'BLOCKED') return 'blocked';
  return selected ? 'selected' : 'available';
};

const SeatButton = React.memo(function SeatButton({ seat, state, column, delay, onToggle, onHover, onLeave }) {
  const unavailable = state === 'booked' || state === 'locked' || state === 'blocked';
  const meta = SEAT_TYPE_META[seat.seatType] || SEAT_TYPE_META.REGULAR;
  const label = `Row ${seat.rowLabel}, seat ${seat.seatNumber}, ${meta.label}, ${formatPrice(seat.price)}, ${STATE_TEXT[state]}`;

  return (
    <div className="seat-cell" style={{ gridColumn: column, animationDelay: `${delay}ms` }}>
      <button
        type="button"
        className="seat"
        data-state={state}
        style={{ '--seat-color': meta.color }}
        disabled={unavailable}
        aria-label={label}
        aria-pressed={state === 'selected'}
        onClick={() => onToggle(seat)}
        onPointerEnter={(e) => onHover(seat, e.currentTarget, state)}
        onPointerLeave={onLeave}
        onFocus={(e) => onHover(seat, e.currentTarget, state)}
        onBlur={onLeave}
      >
        <SeatIcon type={seat.seatType} />
        <span className="seat__num">{state === 'booked' ? '×' : seat.seatNumber}</span>
      </button>
    </div>
  );
});

const LegendItem = ({ color, label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
    <span className="seat-swatch" style={{ '--seat-color': color }}>
      <SeatIcon />
    </span>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
  </Box>
);

const SeatMap = ({ seats = [], selectedSeats = [], onSeatToggle }) => {
  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  const toggleRef = useRef(onSeatToggle);
  toggleRef.current = onSeatToggle;

  const [width, setWidth] = useState(0);
  const [zoomIdx, setZoomIdx] = useState(1);
  const [tip, setTip] = useState(null);

  const layout = useMemo(() => buildLayout(seats), [seats]);
  const hasSeats = layout.rows.length > 0;

  // Track the available width so the hall fits the screen (phones included)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const update = () => setWidth(el.clientWidth);
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasSeats]);

  const selectedIds = useMemo(
    () => new Set(selectedSeats.map((s) => (s && typeof s === 'object' ? s.id : s))),
    [selectedSeats]
  );

  const typesPresent = useMemo(() => {
    const found = new Set(seats.map((s) => s.seatType));
    return Object.keys(SEAT_TYPE_META).filter((t) => found.has(t));
  }, [seats]);

  // Per-tier availability for the headings ("Premium ₹300, 12 left")
  const tierStats = useMemo(() => {
    const stats = {};
    layout.rows.forEach((row) => {
      const key = `${row.type}|${row.price}`;
      if (!stats[key]) stats[key] = { total: 0, free: 0 };
      row.seats.forEach((s) => {
        stats[key].total += 1;
        if (s.status === 'AVAILABLE') stats[key].free += 1;
      });
    });
    return stats;
  }, [layout]);

  const handleToggle = useCallback((seat) => toggleRef.current?.(seat), []);

  const handleHover = useCallback((seat, el, state) => {
    const stage = stageRef.current;
    if (!stage) return;
    const s = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setTip({
      x: r.left - s.left + r.width / 2,
      y: r.top - s.top - 6,
      title: `${seat.rowLabel}${seat.seatNumber}`,
      line1: `${(SEAT_TYPE_META[seat.seatType] || SEAT_TYPE_META.REGULAR).label}, ${formatPrice(seat.price)}`,
      line2: STATE_TEXT[state],
    });
  }, []);
  const handleLeave = useCallback(() => setTip(null), []);

  if (!hasSeats) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, px: 2, width: '100%' }}>
        <EventSeatIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
        <Typography variant="h6" sx={{ mb: 0.5 }}>
          Seats haven&apos;t been set up for this show yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please check back soon, or pick another showtime.
        </Typography>
      </Box>
    );
  }

  // Seat size: fit the container, then apply the person's zoom
  const baseSize = width
    ? Math.min(44, Math.max(24, Math.floor((width - 2 * LABEL_WIDTH - (layout.cols + 3) * 5) / layout.cols)))
    : 34;
  const seatSize = Math.round(baseSize * ZOOM_LEVELS[zoomIdx]);
  const gap = Math.max(3, Math.round(seatSize * 0.17));
  const centerCol = (layout.minCol + layout.maxCol) / 2;
  let previousTier = null;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Legend and zoom */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2.5 } }}>
          {typesPresent.map((t) => (
            <LegendItem key={t} color={SEAT_TYPE_META[t].color} label={SEAT_TYPE_META[t].label} />
          ))}
          <LegendItem color={SELECTED_COLOR} label="Your pick" />
          <LegendItem color="#3a3a42" label="Taken" />
          <LegendItem color="#6c6c76" label="On hold" />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Smaller seats">
            <span>
              <IconButton size="small" aria-label="Zoom out" disabled={zoomIdx === 0} onClick={() => setZoomIdx((z) => z - 1)}>
                <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>−</span>
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Larger seats">
            <span>
              <IconButton
                size="small"
                aria-label="Zoom in"
                disabled={zoomIdx === ZOOM_LEVELS.length - 1}
                onClick={() => setZoomIdx((z) => z + 1)}
              >
                <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>+</span>
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <ScreenGlow label="Screen this way" />

      <div className="seat-scroll" ref={wrapRef}>
        <div className="seat-stage" ref={stageRef}>
          <div
            className="seat-grid"
            style={{
              '--seat': `${seatSize}px`,
              '--gap': `${gap}px`,
              '--label': `${LABEL_WIDTH}px`,
              '--cols': layout.cols,
            }}
          >
            {layout.rows.map((row, rowIdx) => {
              const tierKey = `${row.type}|${row.price}`;
              const showTier = tierKey !== previousTier;
              previousTier = tierKey;
              const meta = SEAT_TYPE_META[row.type] || SEAT_TYPE_META.REGULAR;
              const stats = tierStats[tierKey];

              return (
                <React.Fragment key={row.label}>
                  {showTier && (
                    <div className="seat-tier">
                      <strong style={{ color: meta.color }}>{meta.label}</strong>
                      {row.price !== null && <strong>{formatPrice(row.price)}</strong>}
                      <span>{stats.free > 0 ? `${stats.free} left` : 'Sold out'}</span>
                    </div>
                  )}
                  <div className="seat-row" role="group" aria-label={`Row ${row.label}`}>
                    <span className="seat-row__label" style={{ gridColumn: 1 }}>
                      {row.label}
                    </span>
                    {row.seats.map((seat) => {
                      const column = seat.seatNumber - layout.minCol + 2;
                      // The hall lights up from the middle outwards, front to back
                      const delay = Math.min(rowIdx * 55 + Math.abs(seat.seatNumber - centerCol) * 7, 1100);
                      return (
                        <SeatButton
                          key={seat.id}
                          seat={seat}
                          state={getSeatState(seat, selectedIds.has(seat.id))}
                          column={column}
                          delay={delay}
                          onToggle={handleToggle}
                          onHover={handleHover}
                          onLeave={handleLeave}
                        />
                      );
                    })}
                    <span className="seat-row__label" style={{ gridColumn: layout.cols + 2 }}>
                      {row.label}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {tip && (
            <div className="seat-tip" style={{ left: tip.x, top: tip.y }} role="tooltip">
              <strong>{tip.title}</strong>
              <span>{tip.line1}</span>
              <br />
              <span>{tip.line2}</span>
            </div>
          )}
        </div>
      </div>
    </Box>
  );
};

export default SeatMap;
