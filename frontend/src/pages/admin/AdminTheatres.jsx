import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Skeleton,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import TheatersIcon from '@mui/icons-material/Theaters';
import TvIcon from '@mui/icons-material/Tv';
import { useNavigate } from 'react-router-dom';
import {
  getTheatres,
  createTheatre,
  updateTheatre,
  deactivateTheatre,
  getScreensByTheatre,
} from '../../api/theatreApi';
import EmptyState from '../../components/EmptyState';
import { getErrorMessage } from '../../utils/errors';

const EMPTY_FORM = { name: '', addressLine: '', city: '', state: '', postalCode: '' };

// Mirrors the backend limits in CreateTheatreRequest; every field is required there.
const FIELDS = [
  { key: 'name', label: 'Theatre name', max: 150, span: 2, autoFocus: true },
  { key: 'addressLine', label: 'Address', max: 255, span: 2 },
  { key: 'city', label: 'City', max: 100 },
  { key: 'state', label: 'State', max: 100 },
  { key: 'postalCode', label: 'PIN code', max: 15 },
];

const validate = (form) => {
  const errors = {};
  FIELDS.forEach(({ key, label, max }) => {
    const value = form[key].trim();
    if (!value) errors[key] = `${label} is required.`;
    else if (value.length > max) errors[key] = `Keep this under ${max} characters.`;
  });
  return errors;
};

const AdminTheatres = () => {
  const navigate = useNavigate();

  const [theatres, setTheatres] = useState([]);
  const [screenCounts, setScreenCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('');
  const [debouncedCity, setDebouncedCity] = useState('');

  // Add / edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Deactivate dialog
  const [toDeactivate, setToDeactivate] = useState(null);
  const [deactivateError, setDeactivateError] = useState('');
  const [deactivating, setDeactivating] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success', action: null });
  const requestId = useRef(0);

  // Wait for the person to stop typing before filtering
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCity(cityFilter.trim()), 300);
    return () => clearTimeout(timer);
  }, [cityFilter]);

  const fetchTheatres = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const res = await getTheatres({ city: debouncedCity || undefined, page: 0, size: 50 });
      if (id !== requestId.current) return;
      const content = res.data?.content || (Array.isArray(res.data) ? res.data : []);
      setTheatres(content);

      // Screen counts load in the background so the cards appear straight away
      const results = await Promise.allSettled(content.map((t) => getScreensByTheatre(t.id)));
      if (id !== requestId.current) return;
      const counts = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && Array.isArray(r.value.data)) counts[content[i].id] = r.value.data.length;
      });
      setScreenCounts(counts);
    } catch (err) {
      if (id !== requestId.current) return;
      setSnackbar({ open: true, message: getErrorMessage(err, 'Failed to load theatres.'), severity: 'error', action: null });
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [debouncedCity]);

  useEffect(() => {
    fetchTheatres();
  }, [fetchTheatres]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (theatre) => {
    setEditing(theatre);
    setForm({
      name: theatre.name || '',
      addressLine: theatre.addressLine || '',
      city: theatre.city || '',
      state: theatre.state || '',
      postalCode: theatre.postalCode || '',
    });
    setErrors({});
    setFormError('');
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      name: form.name.trim(),
      addressLine: form.addressLine.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
      status: editing?.status || 'ACTIVE', // the backend requires a status on every save
    };

    setSubmitting(true);
    setFormError('');
    try {
      if (editing) {
        await updateTheatre(editing.id, payload);
        setSnackbar({ open: true, message: `Saved changes to ${payload.name}.`, severity: 'success', action: null });
      } else {
        const res = await createTheatre(payload);
        const created = res.data;
        setSnackbar({
          open: true,
          message: `${payload.name} is ready. Next, add its screens.`,
          severity: 'success',
          action: created?.id ? { label: 'Add screens', to: `/admin/theatres/${created.id}/screens` } : null,
        });
      }
      setDialogOpen(false);
      fetchTheatres();
    } catch (err) {
      setFormError(getErrorMessage(err, 'We could not save this theatre.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!toDeactivate) return;
    setDeactivating(true);
    setDeactivateError('');
    try {
      await deactivateTheatre(toDeactivate.id);
      setSnackbar({ open: true, message: `${toDeactivate.name} was deactivated.`, severity: 'success', action: null });
      setToDeactivate(null);
      fetchTheatres();
    } catch (err) {
      setDeactivateError(getErrorMessage(err, 'We could not deactivate this theatre.'));
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/admin')}
        sx={{ mb: 2, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
      >
        Dashboard
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Theatres
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Each theatre has screens, and each screen has its own seat layout.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
          Add theatre
        </Button>
      </Box>

      <TextField
        fullWidth
        size="small"
        placeholder="Search by city"
        value={cityFilter}
        onChange={(e) => setCityFilter(e.target.value)}
        sx={{ mb: 3, maxWidth: 380 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: cityFilter && (
            <InputAdornment position="end">
              <IconButton size="small" aria-label="Clear search" onClick={() => setCityFilter('')}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {loading && theatres.length === 0 ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2.5 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={190} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : theatres.length === 0 ? (
        <EmptyState
          icon={<TheatersIcon />}
          title={debouncedCity ? `No theatres in ${debouncedCity}` : 'No theatres yet'}
          description={
            debouncedCity
              ? 'Try a different city, or clear the search to see every theatre.'
              : 'Add your first theatre, then give it screens and seats so shows can be scheduled.'
          }
          action={
            !debouncedCity && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
                Add your first theatre
              </Button>
            )
          }
        />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 2.5,
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 200ms ease',
          }}
        >
          {theatres.map((theatre, index) => {
            const count = screenCounts[theatre.id];
            return (
              <Box
                key={theatre.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  border: '1px solid rgba(255,255,255,0.07)',
                  transition: 'transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease',
                  animation: 'popIn 380ms cubic-bezier(.2,.9,.3,1.1) both',
                  animationDelay: `${Math.min(index * 45, 270)}ms`,
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    borderColor: 'rgba(229,57,53,0.5)',
                    boxShadow: '0 10px 28px rgba(0,0,0,0.35)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                  <Typography variant="h6" sx={{ lineHeight: 1.25 }}>
                    {theatre.name}
                  </Typography>
                  <Box sx={{ display: 'flex', flexShrink: 0, mt: -0.5, mr: -1 }}>
                    <Tooltip title="Edit details">
                      <IconButton size="small" aria-label={`Edit ${theatre.name}`} onClick={() => openEdit(theatre)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Deactivate">
                      <IconButton
                        size="small"
                        aria-label={`Deactivate ${theatre.name}`}
                        onClick={() => {
                          setDeactivateError('');
                          setToDeactivate(theatre);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 0.75, color: 'text.secondary', mt: 1, mb: 2, flexGrow: 1 }}>
                  <LocationOnIcon sx={{ fontSize: 18, mt: 0.25 }} />
                  <Typography variant="body2">
                    {theatre.addressLine}
                    <br />
                    {theatre.city}, {theatre.state} {theatre.postalCode}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Chip
                    size="small"
                    label={count === undefined ? 'Screens' : `${count} ${count === 1 ? 'screen' : 'screens'}`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.08)' }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<TvIcon />}
                    onClick={() => navigate(`/admin/theatres/${theatre.id}/screens`)}
                  >
                    Manage screens
                  </Button>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Add / edit */}
      <Dialog open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogTitle>{editing ? 'Edit theatre' : 'Add a theatre'}</DialogTitle>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 1 }}>
              {FIELDS.map(({ key, label, max, span, autoFocus }) => (
                <TextField
                  key={key}
                  required
                  fullWidth
                  autoFocus={autoFocus}
                  label={label}
                  value={form[key]}
                  error={Boolean(errors[key])}
                  helperText={errors[key]}
                  inputProps={{ maxLength: max }}
                  onChange={(e) => {
                    setForm({ ...form, [key]: e.target.value });
                    if (errors[key]) setErrors({ ...errors, [key]: undefined });
                  }}
                  sx={{ gridColumn: { sm: span === 2 ? '1 / -1' : 'auto' } }}
                />
              ))}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button color="inherit" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting} sx={{ minWidth: 130 }}>
              {submitting ? <CircularProgress size={22} color="inherit" /> : editing ? 'Save changes' : 'Add theatre'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Deactivate */}
      <Dialog open={Boolean(toDeactivate)} onClose={() => !deactivating && setToDeactivate(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Deactivate {toDeactivate?.name}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            The theatre will disappear from this list and no new shows can be scheduled there. Its screens must be
            deactivated first.
          </Typography>
          {deactivateError && (
            <Alert
              severity="warning"
              sx={{ mt: 2 }}
              action={
                <Button color="inherit" size="small" onClick={() => navigate(`/admin/theatres/${toDeactivate.id}/screens`)}>
                  Open screens
                </Button>
              }
            >
              {deactivateError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={() => setToDeactivate(null)} disabled={deactivating}>
            Keep theatre
          </Button>
          <Button color="error" variant="contained" onClick={handleDeactivate} disabled={deactivating}>
            {deactivating ? <CircularProgress size={22} color="inherit" /> : 'Deactivate'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={(_, reason) => reason !== 'clickaway' && setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
          action={
            snackbar.action && (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  setSnackbar((s) => ({ ...s, open: false }));
                  navigate(snackbar.action.to);
                }}
              >
                {snackbar.action.label}
              </Button>
            )
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminTheatres;
