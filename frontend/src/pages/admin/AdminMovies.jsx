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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Pagination,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { getMovies, deleteMovie, publishMovie } from '../../api/movieApi';

const AdminMovies = () => {
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Delete Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchMoviesData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMovies({
        page: page - 1,
        size: pageSize,
        sortBy: 'createdAt',
        direction: 'desc',
      });
      const content = res.data?.content || (Array.isArray(res.data) ? res.data : []);
      setMovies(content);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      console.error('Error fetching admin movies:', err);
      setSnackbar({ open: true, message: 'Failed to fetch movies list.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchMoviesData();
  }, [fetchMoviesData]);

  const handleDeleteConfirm = async () => {
    if (!selectedMovie) return;
    try {
      await deleteMovie(selectedMovie.id);
      setSnackbar({ open: true, message: `Movie "${selectedMovie.title}" deleted successfully.`, severity: 'success' });
      setDeleteDialogOpen(false);
      setSelectedMovie(null);
      fetchMoviesData();
    } catch (err) {
      console.error('Failed to delete movie:', err);
      setSnackbar({ open: true, message: 'Failed to delete movie.', severity: 'error' });
    }
  };

  const handlePublish = async (movie) => {
    try {
      await publishMovie(movie.id);
      setSnackbar({ open: true, message: `Movie "${movie.title}" published to Now Showing!`, severity: 'success' });
      fetchMoviesData();
    } catch (err) {
      console.error('Failed to publish movie:', err);
      setSnackbar({ open: true, message: 'Failed to publish movie.', severity: 'error' });
    }
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

  return (
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
            Manage Movies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View, add, edit, or publish movies in the system.
          </Typography>
        </div>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/movies/new')}
          sx={{ fontWeight: 700 }}
        >
          Add Movie
        </Button>
      </Box>

      {/* Movies Table */}
      <TableContainer component={Paper} sx={{ backgroundColor: '#1E1E1E', borderRadius: 3, mb: 4 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Language</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Genres</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress color="primary" />
                </TableCell>
              </TableRow>
            ) : movies.length > 0 ? (
              movies.map((movie) => (
                <TableRow
                  key={movie.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' } }}
                >
                  <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                    {movie.title}
                  </TableCell>
                  <TableCell>{movie.language || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={(movie.status || 'UNKNOWN').replace('_', ' ')}
                      color={getStatusColor(movie.status)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>{movie.durationMinutes ? `${movie.durationMinutes}m` : 'N/A'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {movie.genres?.map((g) => (
                        <Chip key={g.id || g.name} label={g.name} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      {movie.status === 'COMING_SOON' && (
                        <Tooltip title="Publish to Now Showing">
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => handlePublish(movie)}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit Movie">
                        <IconButton
                          color="info"
                          size="small"
                          onClick={() => navigate(`/admin/movies/${movie.id}/edit`)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Movie">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => {
                            setSelectedMovie(movie);
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
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No movies found. Click "Add Movie" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, val) => setPage(val)}
            color="primary"
          />
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { backgroundColor: '#1E1E1E', borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText color="text.secondary">
            Are you sure you want to delete movie <strong>"{selectedMovie?.title}"</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
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
  );
};

export default AdminMovies;
