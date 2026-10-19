import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Skeleton,
  Button,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TheatersIcon from '@mui/icons-material/Theaters';
import UpcomingIcon from '@mui/icons-material/Upcoming';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import MovieCard from '../../components/MovieCard';
import { getMovies } from '../../api/movieApi';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [nowShowing, setNowShowing] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch a batch of movies to populate sections
      const response = await getMovies({ page: 0, size: 24, sortBy: 'createdAt', direction: 'desc' });
      const movies = response.data?.content || (Array.isArray(response.data) ? response.data : []);

      const showing = movies.filter((m) => m.status === 'NOW_SHOWING');
      const upcoming = movies.filter((m) => m.status === 'COMING_SOON');

      // Fallback: if status isn't strictly set or no movies match, distribute them nicely
      if (showing.length === 0 && upcoming.length === 0 && movies.length > 0) {
        setNowShowing(movies.slice(0, 8));
        setComingSoon(movies.slice(8, 16));
      } else {
        setNowShowing(showing);
        setComingSoon(upcoming);
      }
    } catch (err) {
      console.error('Error fetching movies for homepage:', err);
      setError('Unable to load movies right now. Please check your connection or backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?query=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/movies');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', pb: 8 }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #B71C1C 0%, #E53935 30%, #121212 90%)',
          pt: { xs: 8, md: 10 },
          pb: { xs: 8, md: 10 },
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 720, mx: 'auto', textAlign: 'center' }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 900,
                letterSpacing: '-0.5px',
                mb: 2,
                fontSize: { xs: '2.2rem', sm: '3rem', md: '3.6rem' },
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              Book Your Experience
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255, 255, 255, 0.85)',
                mb: 4,
                fontWeight: 400,
                fontSize: { xs: '1rem', sm: '1.2rem' },
              }}
            >
              Discover the latest movies, book tickets seamlessly, and enjoy the best theatre experience.
            </Typography>

            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{
                display: 'flex',
                maxWidth: 600,
                mx: 'auto',
                backgroundColor: 'rgba(30, 30, 30, 0.9)',
                borderRadius: 3,
                p: 0.8,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
              }}
            >
              <TextField
                fullWidth
                variant="standard"
                placeholder="Search for Movies, Languages, or Genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start" sx={{ pl: 1.5, color: 'text.secondary' }}>
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  sx: { px: 1, py: 0.5, color: '#fff' },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ px: 3, py: 1.2, borderRadius: 2 }}
              >
                Search
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content Sections */}
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Now Showing Section */}
        <Box sx={{ mb: 7 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TheatersIcon sx={{ color: 'primary.main', fontSize: 32 }} />
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                Now Showing
              </Typography>
            </Box>
            <Button
              variant="text"
              color="primary"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/movies')}
            >
              See All
            </Button>
          </Box>

          <Grid container spacing={3}>
            {loading ? (
              Array.from(new Array(4)).map((_, idx) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
                  <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} />
                  <Skeleton variant="text" sx={{ mt: 1, fontSize: '1.2rem' }} />
                  <Skeleton variant="text" width="60%" />
                </Grid>
              ))
            ) : nowShowing.length > 0 ? (
              nowShowing.map((movie) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={movie.id}>
                  <MovieCard movie={movie} onClick={() => navigate(`/movies/${movie.id}`)} />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No movies currently showing. Check back soon!
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Coming Soon Section */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <UpcomingIcon sx={{ color: 'secondary.main', fontSize: 32 }} />
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                Coming Soon
              </Typography>
            </Box>
            <Button
              variant="text"
              color="secondary"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/movies')}
            >
              Explore
            </Button>
          </Box>

          <Grid container spacing={3}>
            {loading ? (
              Array.from(new Array(4)).map((_, idx) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
                  <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} />
                  <Skeleton variant="text" sx={{ mt: 1, fontSize: '1.2rem' }} />
                  <Skeleton variant="text" width="60%" />
                </Grid>
              ))
            ) : comingSoon.length > 0 ? (
              comingSoon.map((movie) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={movie.id}>
                  <MovieCard movie={movie} onClick={() => navigate(`/movies/${movie.id}`)} />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No upcoming movies scheduled at the moment.
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default Home;
