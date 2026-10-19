import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { useNavigate, useParams } from 'react-router-dom';
import { getTheatreById } from '../../api/theatreApi';
import { getScreenById } from '../../api/screenApi';
import { createSeatsBulk, deactivateSeat, getSeatsByScreen, updateSeat } from '../../api/seatApi';
import SeatIcon from '../../components/seats/SeatIcon';
import ScreenGlow from '../../components/seats/ScreenGlow';
import { getErrorMessage } from '../../utils/errors';
import { screenTypeMeta } from '../../utils/screenUtils';
import { SEAT_TYPES, SEAT_TYPE_META, compareRows, indexToRowLabel, rowLabelToIndex } from '../../utils/seatUtils';
import { useContainerWidth } from '../../utils/useContainerWidth';
import '../../components/seats/seats.css';

const MAX_ROWS = 26;
const MAX_COLS = 40;
const LABEL_WIDTH = 28;
const BULK_CHUNK = 100;
const POOL_SIZE = 5;

/* ------------------------------------------------------------------ tools */

const TOOLS = [
  ...SEAT_TYPES.map((type, i) => ({
    id: type,
    kind: 'type',
    label: SEAT_TYPE_META[type].label,
    hint: SEAT_TYPE_META[type].hint,
    color: SEAT_TYPE_META[type].color,
    shortcut: String(i + 1),
  })),
  { id: 'MAINTENANCE', kind: 'maintenance', label: 'Out of order', hint: 'Keeps the seat but stops it being sold', color: '#FFB300', shortcut: 'M' },
  { id: 'ERASE', kind: 'erase', label: 'Remove', hint: 'Takes the seat away, leaving a gap or aisle', color: '#FF5252', shortcut: 'E' },
];

const PRESETS = [
  { id: 'classic', label: 'Classic hall', description: 'Regular in front, premium in the middle, recliners at the back' },
  { id: 'regular', label: 'All regular', description: 'Every seat is a regular seat' },
  { id: 'premium', label: 'All premium', description: 'Every seat is a premium seat' },
];

/* ------------------------------------------------------------ pure helpers */

const keyOf = (row, num) => `${row}#${num}`;
const isActive = (cell) => Boolean(cell) && cell.status !== 'INACTIVE';

/**
 * Compares what the person has drawn with what the server has.
 *   new     -> POST (bulk)       revive  -> PUT, seat existed but was removed earlier
 *   edited  -> PUT               removed -> DELETE (the backend marks it INACTIVE)
 */
const classify = (cell, savedSeat) => {
  const active = isActive(cell);
  const savedActive = isActive(savedSeat);
  if (active && !savedActive) return savedSeat ? 'revive' : 'new';
  if (!active && savedActive) return 'removed';
  if (active && savedActive && (cell.seatType !== savedSeat.seatType || cell.status !== savedSeat.status)) return 'edited';
  return 'clean';
};

/** Applies a tool to one position. Mutates `draft`; returns true when something changed. */
const paintInto = (draft, saved, row, num, tool, delay = 0) => {
  const k = keyOf(row, num);
  const cur = draft[k];
  const savedSeat = saved[k];

  if (tool.kind === 'erase') {
    if (!isActive(cur)) return false;
    if (savedSeat) draft[k] = { ...cur, status: 'INACTIVE', rev: cur.rev + 1 };
    else delete draft[k];
    return true;
  }
  if (tool.kind === 'maintenance') {
    if (!isActive(cur) || cur.status === 'MAINTENANCE') return false;
    draft[k] = { ...cur, status: 'MAINTENANCE', rev: cur.rev + 1, delay: 0 };
    return true;
  }
  if (isActive(cur) && cur.seatType === tool.id && cur.status === 'ACTIVE') return false;
  draft[k] = {
    id: savedSeat?.id,
    rowLabel: row,
    seatNumber: num,
    seatType: tool.id,
    status: 'ACTIVE',
    rev: (cur?.rev ?? 0) + 1,
    delay,
  };
  return true;
};

const chunk = (list, size) => {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
};

const runPool = async (items, size, worker) => {
  let next = 0;
  const lane = async () => {
    while (next < items.length) {
      const item = items[next];
      next += 1;
      await worker(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, lane));
};

const parseAisles = (text, cols) =>
  new Set(
    text
      .split(/[\s,]+/)
      .map((s) => parseInt(s, 10))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= cols)
  );

const tierForRow = (preset, rowIdx, rowCount) => {
  if (preset === 'regular') return 'REGULAR';
  if (preset === 'premium') return 'PREMIUM';
  if (rowCount < 4) return 'REGULAR';
  const reclinerRows = rowCount >= 6 ? 2 : 1;
  const premiumRows = Math.max(1, Math.ceil(rowCount * 0.3));
  if (rowIdx >= rowCount - reclinerRows) return 'RECLINER';
  if (rowIdx >= rowCount - reclinerRows - premiumRows) return 'PREMIUM';
  return 'REGULAR';
};

/* ------------------------------------------------------------- small parts */

const Stepper = ({ label, value, min, max, onChange, minHint }) => (
  <Box>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
      <Tooltip title={value <= min && minHint ? minHint : ''}>
        <span>
          <IconButton size="small" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
            <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>−</span>
          </IconButton>
        </span>
      </Tooltip>
      <TextField
        size="small"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        inputProps={{ inputMode: 'numeric', 'aria-label': label, style: { textAlign: 'center', padding: '6px 4px', width: 44 } }}
      />
      <IconButton size="small" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  </Box>
);

const DesignerCell = React.memo(function DesignerCell({ row, num, cell, kind }) {
  const active = isActive(cell);
  const classes = ['dz-cell'];
  if (!active && kind !== 'removed') classes.push('dz-cell--empty');
  if (active && cell.rev > 0) classes.push('dz-cell--paint');
  if (kind === 'new' || kind === 'revive') classes.push('dz-cell--new');
  if (kind === 'edited') classes.push('dz-cell--edited');
  if (kind === 'removed') classes.push('dz-cell--removed');

  const meta = active ? SEAT_TYPE_META[cell.seatType] || SEAT_TYPE_META.REGULAR : null;

  return (
    // Changing `rev` remounts the cell, which replays its pop animation after every paint
    <div
      key={cell ? cell.rev : 0}
      className={classes.join(' ')}
      data-cell
      data-row={row}
      data-num={num}
      style={active && cell.delay ? { animationDelay: `${cell.delay}ms` } : undefined}
    >
      {active && (
        <div
          className="seat"
          data-state={cell.status === 'MAINTENANCE' ? 'maintenance' : 'available'}
          style={{ '--seat-color': meta.color }}
        >
          <SeatIcon type={cell.seatType} />
          <span className="seat__num">{num}</span>
        </div>
      )}
    </div>
  );
});

/* -------------------------------------------------------------------- page */

const AdminSeatLayout = () => {
  const { theatreId, screenId } = useParams();
  const navigate = useNavigate();

  const [theatre, setTheatre] = useState(null);
  const [screen, setScreen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [saved, setSaved] = useState({}); // key -> seat as stored on the server
  const [cells, setCells] = useState({}); // key -> seat as currently drawn
  const [rowsN, setRowsN] = useState(8);
  const [colsN, setColsN] = useState(14);

  const [tool, setTool] = useState(TOOLS[0]);
  const [preset, setPreset] = useState('classic');
  const [aisles, setAisles] = useState('');

  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [sweep, setSweep] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const canvasRef = useRef(null);
  const paintingRef = useRef(false);
  const lastKeyRef = useRef('');
  const pointerTypeRef = useRef('mouse');
  const toolRef = useRef(tool);
  toolRef.current = tool;
  const savedRef = useRef(saved);
  savedRef.current = saved;

  const screensPath = `/admin/theatres/${theatreId}/screens`;

  /* ---------- load ---------- */
  const applyServerSeats = useCallback((seatList) => {
    const savedMap = {};
    const cellMap = {};
    let maxRow = -1;
    let maxCol = 0;
    seatList.forEach((s) => {
      const k = keyOf(s.rowLabel, s.seatNumber);
      savedMap[k] = s;
      cellMap[k] = { ...s, rev: 0, delay: 0 };
      if (s.status !== 'INACTIVE') {
        const idx = rowLabelToIndex(s.rowLabel);
        if (idx >= 0) maxRow = Math.max(maxRow, idx);
        maxCol = Math.max(maxCol, s.seatNumber);
      }
    });
    setSaved(savedMap);
    setCells(cellMap);
    if (maxRow >= 0 || maxCol > 0) {
      setRowsN(Math.max(1, maxRow + 1));
      setColsN(Math.max(1, maxCol));
    }
  }, []);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const [screenRes, theatreRes, seatsRes] = await Promise.all([
        getScreenById(screenId),
        getTheatreById(theatreId),
        getSeatsByScreen(screenId),
      ]);
      setScreen(screenRes.data);
      setTheatre(theatreRes.data);
      applyServerSeats(Array.isArray(seatsRes.data) ? seatsRes.data : []);
    } catch (err) {
      setLoadError(getErrorMessage(err, 'We could not load this screen.'));
    } finally {
      setLoading(false);
    }
  }, [screenId, theatreId, applyServerSeats]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  /* ---------- derived ---------- */
  const { diff, activeCells, minRows, minCols, rowLabels } = useMemo(() => {
    const toCreate = [];
    const toUpdate = [];
    const toRemove = [];
    const active = [];
    let minR = 1;
    let minC = 1;
    const extras = new Set();

    Object.keys(cells).forEach((k) => {
      const c = cells[k];
      const kind = classify(c, saved[k]);
      if (kind === 'new') toCreate.push(c);
      else if (kind === 'revive' || kind === 'edited') toUpdate.push({ cell: c, id: saved[k].id });
      else if (kind === 'removed') toRemove.push({ cell: c, id: saved[k].id });

      if (isActive(c)) {
        active.push(c);
        const idx = rowLabelToIndex(c.rowLabel);
        if (/^[A-Z]+$/.test(c.rowLabel) && idx >= 0) minR = Math.max(minR, idx + 1);
        else extras.add(c.rowLabel);
        minC = Math.max(minC, c.seatNumber);
      }
    });

    const base = Array.from({ length: rowsN }, (_, i) => indexToRowLabel(i));
    return {
      diff: { toCreate, toUpdate, toRemove, total: toCreate.length + toUpdate.length + toRemove.length },
      activeCells: active,
      minRows: minR,
      minCols: minC,
      rowLabels: [...base, ...[...extras].sort(compareRows)],
    };
  }, [cells, saved, rowsN]);

  const effectiveCols = Math.max(colsN, minCols);
  const dirty = diff.total > 0;

  const typeCounts = useMemo(() => {
    const counts = {};
    SEAT_TYPES.forEach((t) => {
      counts[t] = 0;
    });
    let maintenance = 0;
    activeCells.forEach((c) => {
      counts[c.seatType] = (counts[c.seatType] || 0) + 1;
      if (c.status === 'MAINTENANCE') maintenance += 1;
    });
    return { counts, maintenance };
  }, [activeCells]);

  /* ---------- painting ---------- */
  const paintOne = useCallback((row, num) => {
    setCells((prev) => {
      const draft = { ...prev };
      return paintInto(draft, savedRef.current, row, num, toolRef.current) ? draft : prev;
    });
  }, []);

  const paintMany = useCallback((positions) => {
    setCells((prev) => {
      const draft = { ...prev };
      let changed = false;
      positions.forEach(({ row, num, delay }) => {
        if (paintInto(draft, savedRef.current, row, num, toolRef.current, delay)) changed = true;
      });
      return changed ? draft : prev;
    });
  }, []);

  // Row letters and column numbers paint a whole line; a seat position paints just itself.
  const activate = (target, startDrag) => {
    const rowHead = target.closest('[data-rowhead]');
    if (rowHead) {
      const row = rowHead.getAttribute('data-rowhead');
      paintMany(Array.from({ length: effectiveCols }, (_, i) => ({ row, num: i + 1, delay: i * 18 })));
      return;
    }
    const colHead = target.closest('[data-colhead]');
    if (colHead) {
      const num = parseInt(colHead.getAttribute('data-colhead'), 10);
      paintMany(rowLabels.map((row, i) => ({ row, num, delay: i * 30 })));
      return;
    }
    const cell = target.closest('[data-cell]');
    if (!cell) return;
    const row = cell.getAttribute('data-row');
    const num = parseInt(cell.getAttribute('data-num'), 10);
    if (startDrag) {
      paintingRef.current = true;
      lastKeyRef.current = keyOf(row, num);
    }
    paintOne(row, num);
  };

  // Mouse and pen paint straight away and can drag. Touch paints on tap only,
  // so scrolling a wide hall with a finger never paints by accident.
  const handlePointerDown = (e) => {
    pointerTypeRef.current = e.pointerType;
    if (e.pointerType === 'touch') return;
    if (e.target.closest('[data-cell]')) e.preventDefault();
    activate(e.target, true);
  };

  const handleClick = (e) => {
    if (pointerTypeRef.current === 'touch') activate(e.target, false);
  };

  const handlePointerOver = (e) => {
    if (!paintingRef.current) return;
    const cell = e.target.closest('[data-cell]');
    if (!cell) return;
    const row = cell.getAttribute('data-row');
    const num = parseInt(cell.getAttribute('data-num'), 10);
    const k = keyOf(row, num);
    if (k === lastKeyRef.current) return;
    lastKeyRef.current = k;
    paintOne(row, num);
  };

  useEffect(() => {
    const stop = () => {
      paintingRef.current = false;
      lastKeyRef.current = '';
    };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, []);

  /* ---------- quick fill ---------- */
  const handleFill = () => {
    const aisleSet = parseAisles(aisles, effectiveCols);
    const labels = rowLabels.slice(0, rowsN);
    const positions = [];
    labels.forEach((row, rowIdx) => {
      const type = tierForRow(preset, rowIdx, labels.length);
      for (let num = 1; num <= effectiveCols; num += 1) {
        if (aisleSet.has(num)) continue;
        positions.push({ row, num, type, delay: Math.min(rowIdx * 40 + num * 8, 900) });
      }
    });

    setCells((prev) => {
      const draft = { ...prev };
      let added = 0;
      positions.forEach(({ row, num, type, delay }) => {
        if (isActive(draft[keyOf(row, num)])) return; // never overwrite seats that are already placed
        if (paintInto(draft, savedRef.current, row, num, { kind: 'type', id: type }, delay)) added += 1;
      });
      return added ? draft : prev;
    });
  };

  /* ---------- history ---------- */
  const handleDiscard = () => {
    applyServerSeats(Object.values(saved));
  };

  /* ---------- save ---------- */
  const handleSave = async () => {
    if (!dirty || saving) return;
    const payload = (c) => ({ rowLabel: c.rowLabel, seatNumber: c.seatNumber, seatType: c.seatType, status: c.status });
    const total = diff.total;
    let done = 0;
    const errors = [];

    setSaving(true);
    setProgress({ done: 0, total });
    const advance = (n = 1) => {
      done += n;
      setProgress({ done, total });
    };

    try {
      for (const group of chunk(diff.toCreate, BULK_CHUNK)) {
        try {
          await createSeatsBulk(screenId, group.map(payload));
        } catch (err) {
          errors.push(getErrorMessage(err, 'Some new seats could not be added.'));
        }
        advance(group.length);
      }
      await runPool(diff.toUpdate, POOL_SIZE, async ({ cell, id }) => {
        try {
          await updateSeat(screenId, id, payload(cell));
        } catch (err) {
          errors.push(`${cell.rowLabel}${cell.seatNumber}: ${getErrorMessage(err, 'could not be updated.')}`);
        }
        advance();
      });
      await runPool(diff.toRemove, POOL_SIZE, async ({ cell, id }) => {
        try {
          await deactivateSeat(screenId, id);
        } catch (err) {
          errors.push(`${cell.rowLabel}${cell.seatNumber}: ${getErrorMessage(err, 'could not be removed.')}`);
        }
        advance();
      });

      // Reload so the editor always shows exactly what the server holds
      const res = await getSeatsByScreen(screenId);
      applyServerSeats(Array.isArray(res.data) ? res.data : []);

      if (errors.length) {
        const more = errors.length > 1 ? ` (and ${errors.length - 1} more)` : '';
        setSnackbar({ open: true, severity: 'error', message: `Saved with problems. ${errors[0]}${more}` });
      } else {
        setSweep(true);
        setTimeout(() => setSweep(false), 1000);
        setSnackbar({ open: true, severity: 'success', message: `Layout saved. This screen now has seats ready for shows.` });
      }
    } catch (err) {
      setSnackbar({ open: true, severity: 'error', message: getErrorMessage(err, 'We could not save the layout.') });
    } finally {
      setSaving(false);
    }
  };

  const saveRef = useRef(handleSave);
  saveRef.current = handleSave;

  /* ---------- keyboard and leave guards ---------- */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveRef.current();
        return;
      }
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.ctrlKey || e.metaKey || e.altKey) return;
      const match = TOOLS.find((t) => t.shortcut.toLowerCase() === e.key.toLowerCase());
      if (match) setTool(match);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const goBack = () => {
    if (dirty) setLeaveOpen(true);
    else navigate(screensPath);
  };

  /* ---------- sizing ---------- */
  const canvasWidth = useContainerWidth(canvasRef, [loading]);
  const gap = 4;
  const seatSize = canvasWidth
    ? Math.min(40, Math.max(26, Math.floor((canvasWidth - 2 * LABEL_WIDTH - (effectiveCols + 3) * gap - 16) / effectiveCols)))
    : 32;

  /* ---------- render ---------- */
  if (loadError) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={load}>Try again</Button>}>
          {loadError}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(screensPath)}>
          Back to screens
        </Button>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 5 }}>
        <Skeleton variant="text" width={220} height={48} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1fr) 330px' }, gap: 3, mt: 2 }}>
          <Skeleton variant="rounded" height={520} sx={{ borderRadius: 3 }} />
          <Skeleton variant="rounded" height={420} sx={{ borderRadius: 3 }} />
        </Box>
      </Container>
    );
  }

  const meta = screenTypeMeta(screen?.screenType);
  const maxType = Math.max(1, ...Object.values(typeCounts.counts));
  const hasAnySeat = activeCells.length > 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4, pb: { xs: dirty ? 12 : 4, lg: 4 } }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={goBack}
        sx={{ mb: 2, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
      >
        {theatre ? `${theatre.name} screens` : 'Screens'}
      </Button>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Typography variant="h4" component="h1">
          {screen?.screenName}
        </Typography>
        <Chip size="small" label={meta.label} sx={{ fontWeight: 700, bgcolor: `${meta.color}33`, color: meta.color }} />
        {dirty && (
          <Chip
            size="small"
            color="warning"
            label="Unsaved changes"
            sx={{ animation: 'popIn 260ms cubic-bezier(.2,1.3,.4,1) both' }}
          />
        )}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1fr) 330px' }, gap: 3, alignItems: 'start' }}>
        {/* ---------------- canvas ---------------- */}
        <Box sx={{ minWidth: 0 }}>
          {/* Tools */}
          <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.25 }}>
              Paint with
            </Typography>
            <Box role="radiogroup" aria-label="Paint tool" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {TOOLS.map((t) => {
                const active = tool.id === t.id;
                return (
                  <Tooltip key={t.id} title={`${t.hint} (key ${t.shortcut})`} placement="top">
                    <Box
                      component="button"
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setTool(t)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        pl: 1,
                        pr: 1.75,
                        py: 0.75,
                        borderRadius: 2,
                        cursor: 'pointer',
                        font: 'inherit',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'text.primary',
                        bgcolor: active ? `${t.color}26` : 'transparent',
                        border: '1.5px solid',
                        borderColor: active ? t.color : 'rgba(255,255,255,0.14)',
                        boxShadow: active ? `0 0 0 3px ${t.color}22` : 'none',
                        transform: active ? 'translateY(-1px)' : 'none',
                        transition: 'all 160ms ease',
                        '&:hover': { borderColor: t.color },
                      }}
                    >
                      {t.kind === 'type' && (
                        <span className="seat-swatch" style={{ '--seat-color': t.color }}>
                          <SeatIcon type={t.id} />
                        </span>
                      )}
                      {t.kind === 'maintenance' && <LockOutlinedIcon sx={{ fontSize: 20, color: t.color }} />}
                      {t.kind === 'erase' && <DeleteIcon sx={{ fontSize: 20, color: t.color }} />}
                      {t.label}
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25 }}>
              Click or drag across the grid to paint. Click a row letter or a seat number to paint the whole row or column.
              Removing a column makes an aisle.
            </Typography>
          </Paper>

          {/* Grid */}
          <Paper
            className={sweep ? 'dz-saved-sweep' : undefined}
            sx={{ p: { xs: 1.5, md: 3 }, borderRadius: 3 }}
          >
            {!hasAnySeat && (
              <Alert severity="info" sx={{ mb: 2 }}>
                This screen has no seats yet. Choose a layout on the right and press <strong>Fill empty spots</strong>, or
                paint seats by hand.
              </Alert>
            )}

            <ScreenGlow label="Screen" />

            <div className="seat-scroll" ref={canvasRef}>
              <div className="seat-stage">
                <div
                  className="seat-grid"
                  role="grid"
                  aria-label="Seat layout editor"
                  onPointerDown={handlePointerDown}
                  onClick={handleClick}
                  onPointerOver={handlePointerOver}
                  onDragStart={(e) => e.preventDefault()}
                  style={{
                    '--seat': `${seatSize}px`,
                    '--gap': `${gap}px`,
                    '--label': `${LABEL_WIDTH}px`,
                    '--cols': effectiveCols,
                    '--tool-color': tool.color,
                    touchAction: 'manipulation',
                  }}
                >
                  <div className="seat-row">
                    <span />
                    {Array.from({ length: effectiveCols }, (_, i) => (
                      <span key={i} className="dz-head" data-colhead={i + 1} title={`Paint column ${i + 1}`}>
                        {i + 1}
                      </span>
                    ))}
                    <span />
                  </div>

                  {rowLabels.map((row) => (
                    <div className="seat-row" key={row} role="row">
                      <span className="seat-row__label dz-head dz-rowhead" data-rowhead={row} title={`Paint row ${row}`}>
                        {row}
                      </span>
                      {Array.from({ length: effectiveCols }, (_, i) => {
                        const num = i + 1;
                        const k = keyOf(row, num);
                        return <DesignerCell key={k} row={row} num={num} cell={cells[k]} kind={classify(cells[k], saved[k])} />;
                      })}
                      <span className="seat-row__label">{row}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, mt: 1, color: 'text.secondary', fontSize: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 14, height: 14, borderRadius: '4px', border: '1.5px dashed rgba(255,255,255,0.6)' }} />
                New, not saved
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#ffb300' }} />
                Changed
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '4px',
                    border: '1.5px dashed rgba(255,82,82,0.8)',
                    background: 'repeating-linear-gradient(45deg, rgba(255,82,82,0.2) 0 3px, transparent 3px 6px)',
                  }}
                />
                Will be removed
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* ---------------- side panel ---------------- */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, position: { lg: 'sticky' }, top: { lg: 88 } }}>
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
              Hall size
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Stepper
                label="Rows"
                value={rowsN}
                min={minRows}
                max={MAX_ROWS}
                minHint="Remove seats from the last row to shrink the hall"
                onChange={(v) => setRowsN(Math.min(MAX_ROWS, Math.max(minRows, v)))}
              />
              <Stepper
                label="Seats per row"
                value={effectiveCols}
                min={minCols}
                max={MAX_COLS}
                minHint="Remove seats from the last column to shrink the hall"
                onChange={(v) => setColsN(Math.min(MAX_COLS, Math.max(minCols, v)))}
              />
            </Box>
          </Paper>

          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              Quick fill
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              Fills empty spots only. Seats you have already placed are left alone.
            </Typography>

            <Box role="radiogroup" aria-label="Layout preset" sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              {PRESETS.map((p) => {
                const active = preset === p.id;
                return (
                  <Box
                    key={p.id}
                    component="button"
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPreset(p.id)}
                    sx={{
                      textAlign: 'left',
                      p: 1.25,
                      borderRadius: 2,
                      cursor: 'pointer',
                      font: 'inherit',
                      color: 'text.primary',
                      bgcolor: active ? 'rgba(229,57,53,0.12)' : 'transparent',
                      border: '1.5px solid',
                      borderColor: active ? 'primary.main' : 'rgba(255,255,255,0.14)',
                      transition: 'all 160ms ease',
                      '&:hover': { borderColor: 'primary.main' },
                    }}
                  >
                    <Typography variant="subtitle2">{p.label}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
                      {p.description}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            <TextField
              fullWidth
              size="small"
              label="Aisle columns"
              placeholder="e.g. 5, 14"
              value={aisles}
              onChange={(e) => setAisles(e.target.value)}
              helperText="Columns left empty as walkways. Customers see them as gaps in the seat map."
              sx={{ mb: 2 }}
            />

            <Button fullWidth variant="outlined" startIcon={<EventSeatIcon />} onClick={handleFill}>
              Fill empty spots
            </Button>
          </Paper>

          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Seats
              </Typography>
              <Typography variant="h5" color="primary.main">
                {activeCells.length}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 2 }}>
              {SEAT_TYPES.map((t) => (
                <Box key={t}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                    <Typography variant="caption" color="text.secondary">
                      {SEAT_TYPE_META[t].label}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {typeCounts.counts[t]}
                    </Typography>
                  </Box>
                  <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                    <Box
                      sx={{
                        height: '100%',
                        width: `${(typeCounts.counts[t] / maxType) * 100}%`,
                        bgcolor: SEAT_TYPE_META[t].color,
                        borderRadius: 3,
                        transition: 'width 350ms cubic-bezier(.2,.9,.3,1)',
                      }}
                    />
                  </Box>
                </Box>
              ))}
              {typeCounts.maintenance > 0 && (
                <Typography variant="caption" color="warning.main">
                  {typeCounts.maintenance} out of order (not sold)
                </Typography>
              )}
            </Box>

            {dirty && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {[
                  diff.toCreate.length && `${diff.toCreate.length} new`,
                  diff.toUpdate.length && `${diff.toUpdate.length} changed`,
                  diff.toRemove.length && `${diff.toRemove.length} removed`,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </Typography>
            )}

            {saving && (
              <Box sx={{ mb: 1.5 }}>
                <LinearProgress variant="determinate" value={progress.total ? (progress.done / progress.total) * 100 : 0} />
                <Typography variant="caption" color="text.secondary">
                  Saving {progress.done} of {progress.total}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                disabled={!dirty || saving}
                onClick={handleSave}
              >
                {saving ? 'Saving' : 'Save layout'}
              </Button>
              <Tooltip title="Go back to the last saved layout">
                <span>
                  <Button variant="outlined" color="inherit" aria-label="Discard changes" disabled={!dirty || saving} onClick={handleDiscard} sx={{ minWidth: 48, px: 1.25 }}>
                    <RestartAltIcon />
                  </Button>
                </span>
              </Tooltip>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
              Shows already scheduled keep their original seats. To add new seats to one, open its seat page and press
              Generate inventory.
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* Phone save bar */}
      {dirty && (
        <Box
          sx={{
            display: { xs: 'flex', lg: 'none' },
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: (theme) => theme.zIndex.appBar,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            px: 2,
            py: 1.5,
            bgcolor: 'rgba(30,30,30,0.96)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            animation: 'slideUp 280ms cubic-bezier(.2,.9,.3,1) both',
          }}
        >
          <Typography variant="body2">
            {diff.total} unsaved {diff.total === 1 ? 'change' : 'changes'}
          </Typography>
          <Button variant="contained" startIcon={<SaveIcon />} disabled={saving} onClick={handleSave}>
            {saving ? 'Saving' : 'Save layout'}
          </Button>
        </Box>
      )}

      <Dialog open={leaveOpen} onClose={() => setLeaveOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Leave without saving?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have {diff.total} unsaved {diff.total === 1 ? 'change' : 'changes'} to this layout. They will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={() => setLeaveOpen(false)}>
            Keep editing
          </Button>
          <Button color="error" variant="contained" onClick={() => navigate(screensPath)}>
            Discard and leave
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={(_, reason) => reason !== 'clickaway' && setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: dirty ? 88 : 24, lg: 24 } }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminSeatLayout;
