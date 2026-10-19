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
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { getGenres, createGenre, updateGenre, deleteGenre } from '../../api/genreApi';

const AdminGenres = () => {
  const navigate = useNavigate();

  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Dialog state (Add or Edit)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  // Delete Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [genreToDelete, setGenreToDelete] = useState(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchGenresData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getGenres();
      setGenres(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch genres:', err);
      setSnackbar({ open: true, message: 'Failed to load genres.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGenresData();
  }, [fetchGenresData]);

  const handleOpenAdd = () => {
    setEditingGenre(null);
    setFormData({ name: '', description: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (genre) => {
    setEditingGenre(genre);
    setFormData({ name: genre.name, description: genre.description || '' });
    setDialogOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      if (editingGenre) {
        await updateGenre(editingGenre.id, formData);
        setSnackbar({ open: true, message: 'Genre updated successfully.', severity: 'success' });
      } else {
        await createGenre(formData);
        setSnackbar({ open: true, message: 'Genre created successfully.', severity: 'success' });
      }
      setDialogOpen(false);
      fetchGenresData();
    } catch (err) {
      console.error('Failed to save genre:', err);
      setSnackbar({ open: true, message: 'Error saving genre.', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!genreToDelete) return;
    try {
      await deleteGenre(genreToDelete.id);
      setSnackbar({ open: true, message: `Genre "${genreToDelete.name}" deleted.`, severity: 'success' });
      setDeleteDialogOpen(false);
      setGenreToDelete(null);
      fetchGenresData();
    } catch (err) {
      console.error('Failed to delete genre:', err);
      setSnackbar({ open: true, message: 'Failed to delete genre.', severity: 'error' });
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
            Manage Genres
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure movie classifications and categories.
          </Typography>
        </div>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ fontWeight: 700 }}
        >
          Add Genre
        </Button>
      </Box>

      {/* Genres Table */}
      <TableContainer component={Paper} sx={{ backgroundColor: '#1E1E1E', borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <TableCell sx={{ fontWeight: 700, width: '25%' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, width: '55%' }}>Description</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, width: '20%' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                  <CircularProgress color="primary" />
                </TableCell>
              </TableRow>
            ) : genres.length > 0 ? (
              genres.map((genre) => (
                <TableRow
                  key={genre.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' } }}
                >
                  <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                    {genre.name}
                  </TableCell>
                  <TableCell color="text.secondary">{genre.description || '—'}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Tooltip title="Edit Genre">
                        <IconButton color="info" size="small" onClick={() => handleOpenEdit(genre)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Genre">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => {
                            setGenreToDelete(genre);
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
                <TableCell colSpan={3} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No genres found. Click "Add Genre" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add / Edit Genre Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { backgroundColor: '#1E1E1E', borderRadius: 3, p: 1 } }}
      >
        <Box component="form" onSubmit={handleFormSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editingGenre ? 'Edit Genre' : 'Add New Genre'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              required
              fullWidth
              label="Genre Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              margin="dense"
              fullWidth
              multiline
              rows={3}
              label="Description (Optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitting}>
              {submitting ? <CircularProgress size={22} /> : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { backgroundColor: '#1E1E1E', borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText color="text.secondary">
            Are you sure you want to delete genre <strong>"{genreToDelete?.name}"</strong>?
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
  );
};

export default AdminGenres;
