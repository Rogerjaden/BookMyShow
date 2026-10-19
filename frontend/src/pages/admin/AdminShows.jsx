import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getShows, createShow, cancelShow } from '../../api/showApi';
import { getMovies } from '../../api/movieApi';
import { getTheatres, getScreensByTheatre } from '../../api/theatreApi';
import { getErrorMessage } from '../../utils/errors';

const FORMAT_OPTIONS = ['TWO_D', 'THREE_D', 'IMAX', 'FOUR_DX', 'DOLBY_CINEMA', 'OTHER'];

const AdminShows = () => {
  const navigate = useNavigate();

  const [shows, setShows] = useState([]);
  const [moviesList, setMoviesList] = useState([]);
  const [theatresList, setTheatresList] = useState([]);
  const [screensForSelectedTheatre, setScreensForSelectedTheatre] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [selectedMovieFilter, setSelectedMovieFilter] = useState('');

  // Create Show Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTheatreId, setSelectedTheatreId] = useState('');
  const [formData, setFormData] = useState({
    movieId: '',
    screenId: '',
    startTime: dayjs().add(2, 'hour'),
    endTime: dayjs().add(4, 'hour').add(30, 'minute'),
    language: 'Hindi',
    format: 'TWO_D',
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showToDelete, setShowToDelete] = useState(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Initial load of movies and theatres
  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [moviesRes, theatresRes] = await Promise.all([
          getMovies({ page: 0, size: 100 }),
          getTheatres({ page: 0, size: 100 }),
        ]);
        const m = moviesRes.data?.content || (Array.isArray(moviesRes.data) ? moviesRes.data : []);
        const t = theatresRes.data?.content || (Array.isArray(theatresRes.data) ? theatresRes.data : []);
        setMoviesList(m);
        setTheatresList(t);
      } catch (err) {
        console.error('Failed to load prerequisites:', err);
      }
    };
    loadPrerequisites();
  }, []);

  const fetchShowsData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getShows({
        movieId: selectedMovieFilter || undefined,
        page: 0,
        size: 50,
      });
      const content = res.data?.content || (Array.isArray(res.data) ? res.data : []);
      setShows(content);
    } catch (err) {
      console.error('Failed to load shows:', err);
      setSnackbar({ open: true, message: 'Failed to load shows.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedMovieFilter]);

  useEffect(() => {
    fetchShowsData();
  }, [fetchShowsData]);

  // When theatre selected in dialog, fetch screens
  const handleTheatreChange = async (e) => {
    const tId = e.target.value;
    setSelectedTheatreId(tId);
    setFormData((prev) => ({ ...prev, screenId: '' }));
    if (!tId) {
      setScreensForSelectedTheatre([]);
      return;
    }
    try {
      const res = await getScreensByTheatre(tId);
      setScreensForSelectedTheatre(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch screens for theatre:', err);
    }
  };

  const handleOpenAdd = () => {
    setSelectedTheatreId('');
    setScreensForSelectedTheatre([]);
    setFormData({
      movieId: moviesList[0]?.id || '',
      screenId: '',
      startTime: dayjs().add(2, 'hour'),
      endTime: dayjs().add(4, 'hour').add(30, 'minute'),
      language: 'Hindi',
      format: 'TWO_D',
    });
    setDialogOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.movieId || !formData.screenId || !formData.startTime || !formData.endTime) {
      setSnackbar({ open: true, message: 'Please complete all required fields.', severity: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      await createShow({
        movieId: parseInt(formData.movieId, 10),
        screenId: parseInt(formData.screenId, 10),
        // The backend field is a LocalDateTime: send local wall-clock time, not UTC ("...Z")
        startTime: formData.startTime.format('YYYY-MM-DDTHH:mm:ss'),
        endTime: formData.endTime.format('YYYY-MM-DDTHH:mm:ss'),
        language: formData.language,
        format: formData.format,
        status: 'SCHEDULED', // required by CreateMovieShowRequest
      });
      setSnackbar({ open: true, message: 'Show scheduled successfully.', severity: 'success' });
      setDialogOpen(false);
      fetchShowsData();
    } catch (err) {
      console.error('Failed to create show:', err);
      setSnackbar({ open: true, message: getErrorMessage(err, 'Failed to schedule show.'), severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!showToDelete) return;
    try {
      await cancelShow(showToDelete.id);
      setSnackbar({ open: true, message: 'Show cancelled/deleted successfully.', severity: 'success' });
      setDeleteDialogOpen(false);
      setShowToDelete(null);
      fetchShowsData();
    } catch (err) {
      console.error('Failed to cancel show:', err);
      setSnackbar({ open: true, message: getErrorMessage(err, 'Failed to cancel show.'), severity: 'error' });
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg" sx={{ py: 5 }}>
        {/* Back button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin')}
          sx={{ mb: 2, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
        >
          Back to Dashboard
        </Button>

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <div>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
              Manage Movie Shows
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Schedule showtimes across theatres and screens.
            </Typography>
          </div>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{ fontWeight: 700 }}
          >
            Create Show
          </Button>
        </Box>

        {/* Filter bar */}
        <Paper sx={{ p: 2, mb: 4, backgroundColor: '#1E1E1E', borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="filter-movie-label">Filter by Movie</InputLabel>
                <Select
                  labelId="filter-movie-label"
                  value={selectedMovieFilter}
                  label="Filter by Movie"
                  onChange={(e) => setSelectedMovieFilter(e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Movies</em>
                  </MenuItem>
                  {moviesList.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => setSelectedMovieFilter('')}
              >
                Clear Filter
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Shows Table */}
        <TableContainer component={Paper} sx={{ backgroundColor: '#1E1E1E', borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                <TableCell sx={{ fontWeight: 700 }}>Movie</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Theatre & Screen</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>City</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Start Time</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>End Time</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Format</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress color="primary" />
                  </TableCell>
                </TableRow>
              ) : shows.length > 0 ? (
                shows.map((show) => (
                  <TableRow
                    key={show.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' } }}
                  >
                    <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                      {show.movieTitle || `Movie #${show.movieId}`}
                    </TableCell>
                    <TableCell>
                      {show.theatreName || `Theatre #${show.theatreId}`}
                      {show.screenName && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Screen: {show.screenName}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{show.city || '—'}</TableCell>
                    <TableCell>{dayjs(show.startTime).format('D MMM, hh:mm A')}</TableCell>
                    <TableCell>{dayjs(show.endTime).format('D MMM, hh:mm A')}</TableCell>
                    <TableCell>
                      <Chip
                        label={(show.format || '2D').replace('_', ' ')}
                        color="secondary"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="Manage Show Seats & Inventory">
                          <Button
                            variant="outlined"
                            size="small"
                            color="primary"
                            startIcon={<EventSeatIcon fontSize="small" />}
                            onClick={() => navigate(`/admin/shows/${show.id}/seats`)}
                            sx={{ textTransform: 'none', py: 0.5 }}
                          >
                            Seats
                          </Button>
                        </Tooltip>
                        <Tooltip title="Cancel Show">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => {
                              setShowToDelete(show);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No shows scheduled. Click "Create Show" to schedule one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Create Show Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { backgroundColor: '#1E1E1E', borderRadius: 3, p: 1 } }}
        >
          <Box component="form" onSubmit={handleFormSubmit}>
            <DialogTitle sx={{ fontWeight: 700 }}>Schedule New Show</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                {/* Movie */}
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="select-movie-label">Movie</InputLabel>
                    <Select
                      labelId="select-movie-label"
                      value={formData.movieId}
                      label="Movie"
                      onChange={(e) => setFormData({ ...formData, movieId: e.target.value })}
                    >
                      {moviesList.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          {m.title} ({m.language})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Theatre */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="select-theatre-label">Theatre</InputLabel>
                    <Select
                      labelId="select-theatre-label"
                      value={selectedTheatreId}
                      label="Theatre"
                      onChange={handleTheatreChange}
                    >
                      {theatresList.map((t) => (
                        <MenuItem key={t.id} value={t.id}>
                          {t.name} ({t.city})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Screen */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required disabled={!selectedTheatreId}>
                    <InputLabel id="select-screen-label">Screen</InputLabel>
                    <Select
                      labelId="select-screen-label"
                      value={formData.screenId}
                      label="Screen"
                      onChange={(e) => setFormData({ ...formData, screenId: e.target.value })}
                    >
                      {screensForSelectedTheatre.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.screenName} ({s.screenType})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Start Time */}
                <Grid item xs={12} sm={6}>
                  <DateTimePicker
                    label="Start Time"
                    value={formData.startTime}
                    onChange={(newVal) => setFormData({ ...formData, startTime: newVal })}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>

                {/* End Time */}
                <Grid item xs={12} sm={6}>
                  <DateTimePicker
                    label="End Time"
                    value={formData.endTime}
                    onChange={(newVal) => setFormData({ ...formData, endTime: newVal })}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>

                {/* Language */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Language"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  />
                </Grid>

                {/* Format */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="select-format-label">Format</InputLabel>
                    <Select
                      labelId="select-format-label"
                      value={formData.format}
                      label="Format"
                      onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    >
                      {FORMAT_OPTIONS.map((f) => (
                        <MenuItem key={f} value={f}>
                          {f.replace('_', ' ')}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setDialogOpen(false)} color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary" disabled={submitting}>
                {submitting ? <CircularProgress size={22} /> : 'Create Show'}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>

        {/* Cancel Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{ sx: { backgroundColor: '#1E1E1E', borderRadius: 3, p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: 700 }}>Confirm Cancellation</DialogTitle>
          <DialogContent>
            <DialogContentText color="text.secondary">
              Are you sure you want to cancel/delete this show? All booked/available seats for this show will be removed.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Confirm Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
};

export default AdminShows;
