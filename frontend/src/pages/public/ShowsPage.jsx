import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TheatersIcon from '@mui/icons-material/Theaters';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getShows } from '../../api/showApi';
import { getMovieById } from '../../api/movieApi';

const FORMAT_OPTIONS = [
  { value: '', label: 'All Formats' },
  { value: 'TWO_D', label: '2D' },
  { value: 'THREE_D', label: '3D' },
  { value: 'IMAX', label: 'IMAX' },
  { value: 'FOUR_DX', label: '4DX' },
  { value: 'DOLBY_CINEMA', label: 'Dolby Cinema' },
  { value: 'OTHER', label: 'Other' },
];

const ShowsPage = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [city, setCity] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [language, setLanguage] = useState('');
  const [format, setFormat] = useState('');

  // Fetch movie details
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await getMovieById(movieId);
        setMovie(res.data);
      } catch (err) {
        console.error('Error fetching movie details', err);
      }
    };
    if (movieId) {
      fetchMovie();
    }
  }, [movieId]);

  // Fetch shows
  const fetchShowsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        movieId,
        city: city.trim() || undefined,
        date: selectedDate ? selectedDate.format('YYYY-MM-DD') : undefined,
        language: language.trim() || undefined,
        format: format || undefined,
        page: 0,
        size: 50,
      };

      const response = await getShows(params);
      const content = response.data?.content || (Array.isArray(response.data) ? response.data : []);
      setShows(content);
    } catch (err) {
      console.error('Error fetching shows:', err);
      setError('Unable to load shows. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [movieId, city, selectedDate, language, format]);

  useEffect(() => {
    fetchShowsData();
  }, [fetchShowsData]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchShowsData();
  };

  const handleResetFilters = () => {
    setCity('');
    setSelectedDate(dayjs());
    setLanguage('');
    setFormat('');
  };

  // Group shows by Theatre
  const showsByTheatre = shows.reduce((acc, show) => {
    const theatreKey = show.theatreName || `Theatre #${show.theatreId}`;
    if (!acc[theatreKey]) {
      acc[theatreKey] = {
        name: show.theatreName || `Theatre #${show.theatreId}`,
        city: show.city || '',
        shows: [],
      };
    }
    acc[theatreKey].shows.push(show);
    return acc;
  }, {});

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg" sx={{ py: 5 }}>
        {/* Header with Movie title */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/movies/${movieId}`)}
          sx={{ mb: 2, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
        >
          Back to Movie
        </Button>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
            {movie ? `Shows for ${movie.title}` : 'Available Shows'}
          </Typography>
          {movie?.language && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Language: {movie.language} • Duration: {movie.durationMinutes} mins
            </Typography>
          )}
        </Box>

        {/* Filter Controls */}
        <Paper
          component="form"
          onSubmit={handleFilterSubmit}
          elevation={2}
          sx={{
            p: 3,
            mb: 5,
            backgroundColor: '#1E1E1E',
            borderRadius: 3,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="City"
                placeholder="e.g. Mumbai, Delhi"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <DatePicker
                label="Date"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>

            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                size="small"
                label="Language"
                placeholder="e.g. Hindi, English"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="format-select-label">Format</InputLabel>
                <Select
                  labelId="format-select-label"
                  value={format}
                  label="Format"
                  onChange={(e) => setFormat(e.target.value)}
                >
                  {FORMAT_OPTIONS.map((f) => (
                    <MenuItem key={f.value} value={f.value}>
                      {f.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={2} sx={{ display: 'flex', gap: 1 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<FilterAltIcon />}
              >
                Apply
              </Button>
              <Button variant="outlined" color="inherit" onClick={handleResetFilters}>
                Reset
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Shows Listing */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : Object.keys(showsByTheatre).length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {Object.entries(showsByTheatre).map(([theatreName, data]) => (
              <Card
                key={theatreName}
                elevation={2}
                sx={{
                  backgroundColor: '#1E1E1E',
                  borderRadius: 3,
                  p: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TheatersIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {theatreName}
                    </Typography>
                  </Box>
                  {data.city && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                      <LocationOnIcon fontSize="small" />
                      <Typography variant="body2">{data.city}</Typography>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ mb: 2.5 }} />

                {/* Show Timings */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {data.shows.map((show) => {
                    const startFormatted = dayjs(show.startTime).format('hh:mm A');
                    const formatLabel = (show.format || '2D').replace('_', ' ');

                    return (
                      <Box
                        key={show.id}
                        onClick={() => navigate(`/shows/${show.id}/seats`)}
                        sx={{
                          border: '1px solid rgba(229, 57, 53, 0.4)',
                          borderRadius: 2,
                          p: 1.5,
                          cursor: 'pointer',
                          minWidth: 150,
                          textAlign: 'center',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(229, 57, 53, 0.1)',
                            borderColor: 'primary.main',
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5 }}
                        >
                          {startFormatted}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.8 }}>
                          <Chip
                            label={formatLabel}
                            size="small"
                            sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                          />
                          {show.screenName && (
                            <Chip
                              label={show.screenName}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: 10 }}
                            />
                          )}
                        </Box>
                        {show.language && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            {show.language}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Card>
            ))}
          </Box>
        ) : (
          <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: '#1E1E1E', borderRadius: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No shows found matching the filters.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Try selecting a different date or clearing the filters.
            </Typography>
            <Button variant="outlined" color="primary" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </Paper>
        )}
      </Container>
    </LocalizationProvider>
  );
};

export default ShowsPage;
