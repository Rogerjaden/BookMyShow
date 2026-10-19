import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { createMovie, getMovieById, updateMovie } from '../../api/movieApi';
import { getGenres, assignGenresToMovie } from '../../api/genreApi';

const STATUS_OPTIONS = [
  { value: 'NOW_SHOWING', label: 'Now Showing' },
  { value: 'COMING_SOON', label: 'Coming Soon' },
  { value: 'ENDED', label: 'Ended' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const MovieForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    durationMinutes: '',
    releaseDate: dayjs(),
    language: '',
    certificate: 'UA',
    posterUrl: '',
    trailerUrl: '',
    status: 'COMING_SOON',
    genreIds: [],
  });

  const [availableGenres, setAvailableGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [errorMessage, setErrorMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Load available genres
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await getGenres();
        setAvailableGenres(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load genres', err);
      }
    };
    fetchGenres();
  }, []);

  // If in edit mode, load existing movie
  useEffect(() => {
    if (!isEditMode) return;

    const fetchMovieData = async () => {
      setInitialLoading(true);
      try {
        const res = await getMovieById(id);
        const m = res.data;
        setFormData({
          title: m.title || '',
          description: m.description || '',
          durationMinutes: m.durationMinutes || '',
          releaseDate: m.releaseDate ? dayjs(m.releaseDate) : dayjs(),
          language: m.language || '',
          certificate: m.certificate || 'UA',
          posterUrl: m.posterUrl || '',
          trailerUrl: m.trailerUrl || '',
          status: m.status || 'COMING_SOON',
          genreIds: m.genres ? m.genres.map((g) => g.id) : [],
        });
      } catch (err) {
        console.error('Failed to load movie for editing', err);
        setErrorMessage('Failed to load movie data.');
        setSnackbarOpen(true);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchMovieData();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMessage('Movie title is required.');
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes, 10) : null,
        releaseDate: formData.releaseDate ? formData.releaseDate.format('YYYY-MM-DD') : null,
        language: formData.language.trim(),
        certificate: formData.certificate.trim(),
        posterUrl: formData.posterUrl.trim(),
        trailerUrl: formData.trailerUrl.trim(),
        status: formData.status,
        genreIds: formData.genreIds,
      };

      if (isEditMode) {
        await updateMovie(id, payload);
        if (formData.genreIds) {
          try {
            await assignGenresToMovie(id, formData.genreIds);
          } catch (genreErr) {
            console.warn('Genre assignment note:', genreErr);
          }
        }
      } else {
        await createMovie(payload);
      }

      navigate('/admin/movies');
    } catch (err) {
      console.error('Failed to save movie:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Error saving movie. Please verify your inputs.';
      setErrorMessage(msg);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // Selected genre objects for Autocomplete
  const selectedGenreObjects = availableGenres.filter((g) => formData.genreIds.includes(g.id));

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="md" sx={{ py: 5 }}>
        {/* Back Link */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/movies')}
          sx={{ mb: 2, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
        >
          Back to Movies
        </Button>

        <Paper elevation={3} sx={{ p: 4, backgroundColor: '#1E1E1E', borderRadius: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
            {isEditMode ? 'Edit Movie' : 'Add New Movie'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            {isEditMode
              ? 'Update the movie details and save changes.'
              : 'Fill in the information below to add a new movie to the platform.'}
          </Typography>

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errorMessage}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Title */}
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Movie Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description / Synopsis"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </Grid>

              {/* Language */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Language (e.g. Hindi, English)"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                />
              </Grid>

              {/* Duration Minutes */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (in minutes)"
                  name="durationMinutes"
                  value={formData.durationMinutes}
                  onChange={handleChange}
                  inputProps={{ min: 1 }}
                />
              </Grid>

              {/* Release Date */}
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Release Date"
                  value={formData.releaseDate}
                  onChange={(newDate) =>
                    setFormData((prev) => ({ ...prev, releaseDate: newDate }))
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              {/* Certificate */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Certificate (e.g. U, UA, A, R)"
                  name="certificate"
                  value={formData.certificate}
                  onChange={handleChange}
                />
              </Grid>

              {/* Status */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="status-select-label">Movie Status</InputLabel>
                  <Select
                    labelId="status-select-label"
                    name="status"
                    value={formData.status}
                    label="Movie Status"
                    onChange={handleChange}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Genres Multi-select */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  multiple
                  options={availableGenres}
                  getOptionLabel={(option) => option.name}
                  value={selectedGenreObjects}
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      genreIds: newValue.map((item) => item.id),
                    }));
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return <Chip key={key || option.id} label={option.name} size="small" {...tagProps} />;
                    })
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Select Genres" placeholder="Add genre" />
                  )}
                />
              </Grid>

              {/* Poster URL */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Poster Image URL"
                  name="posterUrl"
                  value={formData.posterUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/poster.jpg"
                />
              </Grid>

              {/* Trailer URL */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Trailer URL"
                  name="trailerUrl"
                  value={formData.trailerUrl}
                  onChange={handleChange}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </Grid>

              {/* Submit Buttons */}
              <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="outlined" color="inherit" onClick={() => navigate('/admin/movies')}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                  sx={{ px: 4, py: 1.2, fontWeight: 700 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Movie'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" sx={{ width: '100%' }}>
            {errorMessage}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
};

export default MovieForm;
