import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Chip,
  Button,
  Paper,
  Skeleton,
  Alert,
  Divider,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TranslateIcon from '@mui/icons-material/Translate';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getMovieById } from '../../api/movieApi';
import ReviewsSection from '../../components/ReviewsSection';
import WishlistButton from '../../components/WishlistButton';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getMovieById(id);
        setMovie(response.data);
      } catch (err) {
        console.error('Failed to load movie details:', err);
        setError('Movie not found or failed to load details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMovie();
    }
  }, [id]);

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';

    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'NOW_SHOWING':
        return 'success';
      case 'COMING_SOON':
        return 'warning';
      case 'ENDED':
        return 'default';
      default:
        return 'default';
    }
  };

  const defaultPoster =
    'https://via.placeholder.com/380x540?text=No+Poster';

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Skeleton
              variant="rectangular"
              height={500}
              sx={{ borderRadius: 3 }}
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <Skeleton variant="text" height={60} width="80%" />
            <Skeleton
              variant="text"
              height={30}
              width="40%"
              sx={{ my: 1 }}
            />
            <Skeleton
              variant="rectangular"
              height={100}
              sx={{ my: 2, borderRadius: 2 }}
            />
            <Skeleton variant="rectangular" height={50} width={200} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error || !movie) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Movie not found.'}
        </Alert>

        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/movies')}
        >
          Back to Movies
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '90vh', py: 5 }}>
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/movies')}
          sx={{
            mb: 3,
            color: 'text.secondary',
            '&:hover': { color: 'text.primary' },
          }}
        >
          Back
        </Button>

        <Paper
          elevation={4}
          sx={{
            p: { xs: 3, md: 5 },
            backgroundColor: '#1E1E1E',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <Grid container spacing={5}>
            <Grid item xs={12} sm={5} md={4}>
              <Box
                component="img"
                src={movie.posterUrl || defaultPoster}
                alt={movie.title}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultPoster;
                }}
                sx={{
                  width: '100%',
                  borderRadius: 3,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  objectFit: 'cover',
                  maxHeight: 520,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={7} md={8}>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 1.5,
                }}
              >
                {movie.status && (
                  <Chip
                    label={movie.status.replace('_', ' ')}
                    color={getStatusColor(movie.status)}
                    sx={{ fontWeight: 700 }}
                  />
                )}

                {movie.certificate && (
                  <Chip
                    icon={<VerifiedUserIcon />}
                    label={movie.certificate}
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Box>

              <Typography
                variant="h3"
                component="h1"
                sx={{ fontWeight: 800, mb: 2, lineHeight: 1.2 }}
              >
                {movie.title}
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 3,
                  color: 'text.secondary',
                  mb: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <TranslateIcon color="primary" fontSize="small" />
                  <Typography variant="body2">
                    {movie.language || 'Unknown'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <AccessTimeIcon color="primary" fontSize="small" />
                  <Typography variant="body2">
                    {formatDuration(movie.durationMinutes)}
                  </Typography>
                </Box>

                {movie.releaseDate && (
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}
                  >
                    <CalendarMonthIcon color="primary" fontSize="small" />
                    <Typography variant="body2">
                      {dayjs(movie.releaseDate).format('D MMM, YYYY')}
                    </Typography>
                  </Box>
                )}
              </Box>

              {movie.genres && movie.genres.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Genres
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {movie.genres.map((genre) => (
                      <Chip
                        key={genre.id || genre.name}
                        label={genre.name}
                        variant="filled"
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          fontWeight: 500,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                About the Movie
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ lineHeight: 1.7, mb: 4 }}
              >
                {movie.description ||
                  'No detailed synopsis available for this movie.'}
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 2,
                  mt: 'auto',
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<ConfirmationNumberIcon />}
                  onClick={() => navigate(`/movies/${movie.id}/shows`)}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.05rem',
                    fontWeight: 700,
                  }}
                >
                  Book Tickets
                </Button>

                {movie.trailerUrl && (
                  <Button
                    variant="outlined"
                    color="inherit"
                    size="large"
                    startIcon={<PlayArrowIcon />}
                    href={movie.trailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ px: 3, py: 1.5 }}
                  >
                    Watch Trailer
                  </Button>
                )}

                <WishlistButton movieId={movie.id} />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <ReviewsSection movieId={movie.id} />
      </Container>
    </Box>
  );
};

export default MovieDetail;