import React, { useCallback, useEffect, useState } from 'react';
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
  DialogTitle,
  IconButton,
  Skeleton,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import TvIcon from '@mui/icons-material/Tv';
import { useNavigate, useParams } from 'react-router-dom';
import { getTheatreById } from '../../api/theatreApi';
import { createScreen, deactivateScreen, getScreensByTheatre, updateScreen } from '../../api/screenApi';
import { getSeatsByScreen } from '../../api/seatApi';
import EmptyState from '../../components/EmptyState';
import MiniSeatMap from '../../components/seats/MiniSeatMap';
import ScreenGlow from '../../components/seats/ScreenGlow';
import { getErrorMessage } from '../../utils/errors';
import { SCREEN_TYPES, screenTypeMeta } from '../../utils/screenUtils';
import { SEAT_TYPE_META } from '../../utils/seatUtils';

const NAME_MAX = 80; // the screen table column is 80 characters

const countSeats = (seats) => seats.filter((s) => s.status !== 'INACTIVE').length;

const AdminScreens = () => {
  const { theatreId } = useParams();
  const navigate = useNavigate();

  const [theatre, setTheatre] = useState(null);
  const [screens, setScreens] = useState([]);
  const [seatsByScreen, setSeatsByScreen] = useState({}); // screenId -> seats[]
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Add / edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ screenName: '', screenType: 'STANDARD' });
  const [nameError, setNameError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Deactivate dialog
  const [toDeactivate, setToDeactivate] = useState(null);
  const [deactivateError, setDeactivateError] = useState('');
  const [deactivating, setDeactivating] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const designerPath = (screenId) => `/admin/theatres/${theatreId}/screens/${screenId}/seats`;

  const loadSeats = useCallback(async (list) => {
    const results = await Promise.allSettled(list.map((s) => getSeatsByScreen(s.id)));
    const next = {};
    results.forEach((r, i) => {
      next[list[i].id] = r.status === 'fulfilled' && Array.isArray(r.value.data) ? r.value.data : [];
    });
    setSeatsByScreen(next);
  }, []);

  const fetchData = useCallback(async () => {
    setLoadError('');
    try {
      const [theatreRes, screensRes] = await Promise.all([getTheatreById(theatreId), getScreensByTheatre(theatreId)]);
      const list = Array.isArray(screensRes.data) ? screensRes.data : [];
      setTheatre(theatreRes.data);
      setScreens(list);
      setLoading(false);
      loadSeats(list); // previews fill in after the cards are on screen
    } catch (err) {
      setLoadError(getErrorMessage(err, 'We could not load this theatre.'));
      setLoading(false);
    }
  }, [theatreId, loadSeats]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const openAdd = () => {
    setEditing(null);
    setForm({ screenName: '', screenType: 'STANDARD' });
    setNameError('');
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (screen) => {
    setEditing(screen);
    setForm({ screenName: screen.screenName, screenType: screen.screenType });
    setNameError('');
    setFormError('');
    setDialogOpen(true);
  };

  const submit = async (thenDesign = false) => {
    const name = form.screenName.trim();
    if (!name) {
      setNameError('Give the screen a name, for example "Screen 1" or "Audi 2".');
      return;
    }
    setSubmitting(true);
    setFormError('');
    const payload = {
      theatreId: Number(theatreId),
      screenName: name,
      screenType: form.screenType,
      status: editing?.status || 'ACTIVE', // required by the backend
    };
    try {
      if (editing) {
        await updateScreen(editing.id, payload);
        setSnackbar({ open: true, message: `Saved changes to ${name}.`, severity: 'success' });
      } else {
        const res = await createScreen(payload);
        setSnackbar({ open: true, message: `${name} added.`, severity: 'success' });
        if (thenDesign && res.data?.id) {
          navigate(designerPath(res.data.id));
          return;
        }
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      setFormError(getErrorMessage(err, 'We could not save this screen.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!toDeactivate) return;
    setDeactivating(true);
    setDeactivateError('');
    try {
      await deactivateScreen(toDeactivate.id);
      setSnackbar({ open: true, message: `${toDeactivate.screenName} was removed.`, severity: 'success' });
      setToDeactivate(null);
      fetchData();
    } catch (err) {
      setDeactivateError(getErrorMessage(err, 'We could not remove this screen.'));
    } finally {
      setDeactivating(false);
    }
  };

  const totalSeats = Object.values(seatsByScreen).reduce((sum, seats) => sum + countSeats(seats), 0);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/admin/theatres')}
        sx={{ mb: 2, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
      >
        Theatres
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2, mb: 1 }}>
        <Box>
          <Typography variant="h4" component="h1">
            {theatre ? theatre.name : 'Screens'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {theatre ? `${theatre.city}, ${theatre.state}` : 'Loading theatre'}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} disabled={Boolean(loadError)}>
          Add screen
        </Button>
      </Box>

      {!loading && !loadError && (
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Chip size="small" label={`${screens.length} ${screens.length === 1 ? 'screen' : 'screens'}`} />
          <Chip size="small" label={`${totalSeats.toLocaleString('en-IN')} seats`} />
        </Box>
      )}

      {loadError ? (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchData}>Try again</Button>}>
          {loadError}
        </Alert>
      ) : loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2.5, mt: 3 }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} variant="rounded" height={300} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : screens.length === 0 ? (
        <EmptyState
          icon={<TvIcon />}
          title="This theatre has no screens yet"
          description="Add a screen, then lay out its seats. Shows can only be scheduled on screens that have seats."
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
              Add the first screen
            </Button>
          }
        />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2.5 }}>
          {screens.map((screen, index) => {
            const meta = screenTypeMeta(screen.screenType);
            const seats = seatsByScreen[screen.id];
            const seatsLoaded = seats !== undefined;
            const count = seatsLoaded ? countSeats(seats) : 0;
            const tierCounts = seatsLoaded
              ? Object.keys(SEAT_TYPE_META)
                  .map((type) => ({ type, n: seats.filter((s) => s.status !== 'INACTIVE' && s.seatType === type).length }))
                  .filter((t) => t.n > 0)
              : [];

            return (
              <Box
                key={screen.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                  border: '1px solid rgba(255,255,255,0.07)',
                  transition: 'transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease',
                  animation: 'popIn 380ms cubic-bezier(.2,.9,.3,1.1) both',
                  animationDelay: `${Math.min(index * 60, 300)}ms`,
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    borderColor: meta.color,
                    boxShadow: '0 10px 28px rgba(0,0,0,0.35)',
                  },
                }}
              >
                {/* Preview */}
                <Box
                  sx={{
                    height: 170,
                    px: 2,
                    pt: 1.5,
                    pb: 1,
                    bgcolor: 'rgba(0,0,0,0.28)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {!seatsLoaded ? (
                    <Box className="skeleton" sx={{ height: 100 }} />
                  ) : count === 0 ? (
                    <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                      <EventSeatIcon sx={{ fontSize: 34, opacity: 0.55 }} />
                      <Typography variant="body2">No seats yet</Typography>
                    </Box>
                  ) : (
                    <>
                      <Box sx={{ transform: 'scale(0.55)', transformOrigin: 'top center', height: 34, mb: -0.5 }}>
                        <ScreenGlow label="" width="90%" />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'center', overflow: 'hidden', maxHeight: 110 }}>
                        <MiniSeatMap seats={seats} />
                      </Box>
                    </>
                  )}
                </Box>

                <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box>
                      <Typography variant="h6" sx={{ lineHeight: 1.25 }}>
                        {screen.screenName}
                      </Typography>
                      <Chip
                        size="small"
                        label={meta.label}
                        sx={{ mt: 0.75, fontWeight: 700, bgcolor: `${meta.color}33`, color: meta.color }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', mt: -0.5, mr: -1 }}>
                      <Tooltip title="Rename or change type">
                        <IconButton size="small" aria-label={`Edit ${screen.screenName}`} onClick={() => openEdit(screen)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove screen">
                        <IconButton
                          size="small"
                          aria-label={`Remove ${screen.screenName}`}
                          onClick={() => {
                            setDeactivateError('');
                            setToDeactivate(screen);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: 20 }}>
                    {!seatsLoaded
                      ? 'Counting seats'
                      : count === 0
                      ? 'Add seats so customers can book this screen.'
                      : `${count} seats: ${tierCounts.map((t) => `${t.n} ${SEAT_TYPE_META[t.type].label.toLowerCase()}`).join(', ')}`}
                  </Typography>

                  <Button
                    variant={count === 0 && seatsLoaded ? 'contained' : 'outlined'}
                    startIcon={<EventSeatIcon />}
                    onClick={() => navigate(designerPath(screen.id))}
                    sx={{ mt: 'auto' }}
                  >
                    {count === 0 && seatsLoaded ? 'Design seat layout' : 'Edit seat layout'}
                  </Button>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Add / edit */}
      <Dialog open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <Box
          component="form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit(false);
          }}
        >
          <DialogTitle>{editing ? 'Edit screen' : 'Add a screen'}</DialogTitle>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <TextField
              autoFocus
              required
              fullWidth
              label="Screen name"
              placeholder="Screen 1"
              value={form.screenName}
              error={Boolean(nameError)}
              helperText={nameError || 'Shown to customers next to the theatre name.'}
              inputProps={{ maxLength: NAME_MAX }}
              onChange={(e) => {
                setForm({ ...form, screenName: e.target.value });
                setNameError('');
              }}
              sx={{ mt: 1, mb: 3 }}
            />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Screen type
            </Typography>
            <Box
              role="radiogroup"
              aria-label="Screen type"
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' }, gap: 1.25 }}
            >
              {SCREEN_TYPES.map((t) => {
                const active = form.screenType === t.value;
                return (
                  <Box
                    key={t.value}
                    component="button"
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setForm({ ...form, screenType: t.value })}
                    sx={{
                      textAlign: 'left',
                      p: 1.5,
                      borderRadius: 2,
                      cursor: 'pointer',
                      font: 'inherit',
                      color: 'text.primary',
                      bgcolor: active ? `${t.color}26` : 'transparent',
                      border: '1.5px solid',
                      borderColor: active ? t.color : 'rgba(255,255,255,0.14)',
                      transition: 'all 160ms ease',
                      '&:hover': { borderColor: t.color },
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: active ? t.color : 'inherit' }}>
                      {t.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
                      {t.description}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, flexWrap: 'wrap', gap: 1 }}>
            <Button color="inherit" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            {editing ? (
              <Button type="submit" variant="contained" disabled={submitting} sx={{ minWidth: 130 }}>
                {submitting ? <CircularProgress size={22} color="inherit" /> : 'Save changes'}
              </Button>
            ) : (
              <>
                <Button type="submit" variant="outlined" disabled={submitting}>
                  Add screen
                </Button>
                <Button variant="contained" disabled={submitting} onClick={() => submit(true)}>
                  {submitting ? <CircularProgress size={22} color="inherit" /> : 'Add and design seats'}
                </Button>
              </>
            )}
          </DialogActions>
        </Box>
      </Dialog>

      {/* Remove */}
      <Dialog open={Boolean(toDeactivate)} onClose={() => !deactivating && setToDeactivate(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove {toDeactivate?.screenName}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            The screen is hidden from this theatre and no new shows can be scheduled on it. Its seat layout is kept.
          </Typography>
          {deactivateError && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {deactivateError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={() => setToDeactivate(null)} disabled={deactivating}>
            Keep screen
          </Button>
          <Button color="error" variant="contained" onClick={handleDeactivate} disabled={deactivating}>
            {deactivating ? <CircularProgress size={22} color="inherit" /> : 'Remove screen'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={(_, reason) => reason !== 'clickaway' && setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminScreens;
