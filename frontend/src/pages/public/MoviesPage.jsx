import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Pagination,
  Paper,
  InputAdornment,
  Button,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MovieCard from '../../components/MovieCard';
import { getMovies, searchMovies } from '../../api/movieApi';
import { getGenres } from '../../api/genreApi';

const MoviesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [language, setLanguage] = useState(searchParams.get('language') || '');
  const [genreId, setGenreId] = useState(searchParams.get('genreId') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;

  // Load genres once
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await getGenres();
        setGenres(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Failed to load genres', err);
      }
    };
    fetchGenres();
  }, []);

  const fetchMoviesData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      const currentPageIndex = Math.max(0, page - 1);

      const hasFilters = query.trim() || language.trim() || genreId;
      if (hasFilters) {
        response = await searchMovies({
          query: query.trim() || undefined,
          language: language.trim() || undefined,
          genreId: genreId || undefined,
          page: currentPageIndex,
          size: pageSize,
        });
      } else {
        response = await getMovies({
          page: currentPageIndex,
          size: pageSize,
          sortBy: 'createdAt',
          direction: 'desc',
        });
      }

      const content = response.data?.content || (Array.isArray(response.data) ? response.data : []);
      setMovies(content);
      setTotalPages(response.data?.totalPages || 1);
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError('Unable to load movies. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [page, query, language, genreId]);

  useEffect(() => {
    fetchMoviesData();
  }, [fetchMoviesData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchParams({
      ...(query ? { query } : {}),
      ...(language ? { language } : {}),
      ...(genreId ? { genreId } : {}),
      page: '1',
    });
  };

  const handleResetFilters = () => {
    setQuery('');
    setLanguage('');
    setGenreId('');
    setPage(1);
    setSearchParams({});
  };

  const handlePageChange = (_, value) => {
    setPage(value);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(value));
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
          Explore Movies
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse through all current releases and upcoming blockbusters.
        </Typography>
      </Box>

      {/* Filter Bar */}
      <Paper
        component="form"
        onSubmit={handleSearchSubmit}
        elevation={2}
        sx={{
          p: 3,
          mb: 5,
          backgroundColor: '#1E1E1E',
          borderRadius: 3,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by title, description..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Filter by language (e.g. Hindi, English)"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="genre-select-label">Genre</InputLabel>
              <Select
                labelId="genre-select-label"
                value={genreId}
                label="Genre"
                onChange={(e) => setGenreId(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Genres</em>
                </MenuItem>
                {genres.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.name}
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
              startIcon={<FilterListIcon />}
            >
              Filter
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleResetFilters}
              title="Reset Filters"
              sx={{ minWidth: 44, px: 1 }}
            >
              <RestartAltIcon />
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Movie Grid */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : movies.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {movies.map((movie) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={movie.id}>
                <MovieCard movie={movie} onClick={() => navigate(`/movies/${movie.id}`)} />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No movies found matching your criteria.
          </Typography>
          <Button variant="outlined" color="primary" onClick={handleResetFilters} sx={{ mt: 2 }}>
            Clear Filters
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default MoviesPage;
