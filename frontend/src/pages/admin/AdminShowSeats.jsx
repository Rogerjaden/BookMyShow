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
  DialogActions,
  TextField,
  Chip,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import TheatersIcon from '@mui/icons-material/Theaters';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getShowById } from '../../api/showApi';
import {
  getSeatsForShow,
  generateInventory,
  updateSeatPrice,
} from '../../api/showSeatApi';

const AdminShowSeats = () => {
  const { showId } = useParams();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Generate Inventory Dialog
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [defaultPrice, setDefaultPrice] = useState(250);
  const [generating, setGenerating] = useState(false);

  // Inline Price Editing
  const [editingSeatId, setEditingSeatId] = useState(null);
  const [editingPrice, setEditingPrice] = useState('');
  const [updatingPrice, setUpdatingPrice] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [showRes, seatsRes] = await Promise.all([
        getShowById(showId),
        getSeatsForShow(showId),
      ]);
      setShow(showRes.data);
      setSeats(Array.isArray(seatsRes.data) ? seatsRes.data : []);
    } catch (err) {
      console.error('Failed to load show seats data:', err);
      setSnackbar({ open: true, message: 'Failed to load show and seat inventory.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [showId]);

  useEffect(() => {
    if (showId) {
      fetchData();
    }
  }, [showId, fetchData]);

  const handleGenerateInventory = async () => {
    if (!defaultPrice || defaultPrice <= 0) return;
    setGenerating(true);
    try {
      await generateInventory(showId, defaultPrice);
      setSnackbar({ open: true, message: 'Inventory generated successfully!', severity: 'success' });
      setGenerateDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to generate inventory:', err);
      setSnackbar({ open: true, message: 'Failed to generate inventory for show.', severity: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const handleStartEditPrice = (seat) => {
    setEditingSeatId(seat.id);
    setEditingPrice(seat.price || 0);
  };

  const handleCancelEditPrice = () => {
    setEditingSeatId(null);
    setEditingPrice('');
  };

  const handleSavePrice = async (seat) => {
    const newPrice = parseFloat(editingPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      setSnackbar({ open: true, message: 'Please enter a valid price.', severity: 'warning' });
      return;
    }

    setUpdatingPrice(true);
    try {
      await updateSeatPrice(showId, seat.id, newPrice);
      setSnackbar({ open: true, message: `Price updated for seat ${seat.rowLabel}${seat.seatNumber}`, severity: 'success' });
      setEditingSeatId(null);
      fetchData();
    } catch (err) {
      console.error('Failed to update seat price:', err);
      setSnackbar({ open: true, message: 'Failed to update seat price.', severity: 'error' });
    } finally {
      setUpdatingPrice(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'BOOKED':
        return 'error';
      case 'LOCKED':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Back button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/admin/shows')}
        sx={{ mb: 2, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
      >
        Back to Shows
      </Button>

      {/* Show Details Header Card */}
      {show && (
        <Paper elevation={3} sx={{ p: 3, mb: 4, backgroundColor: '#1E1E1E', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
                {show.movieTitle || 'Movie Show'}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, color: 'text.secondary' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <TheatersIcon fontSize="small" />
                  <Typography variant="body2">
                    {show.theatreName} • {show.screenName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <AccessTimeIcon fontSize="small" />
                  <Typography variant="body2">
                    {dayjs(show.startTime).format('D MMM YYYY, hh:mm A')}
                  </Typography>
                </Box>
                <Chip
                  label={(show.format || '2D').replace('_', ' ')}
                  size="small"
                  color="secondary"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Box>

            <Button
              variant="contained"
              color="primary"
              startIcon={<AutorenewIcon />}
              onClick={() => setGenerateDialogOpen(true)}
              sx={{ fontWeight: 700 }}
            >
              Generate Inventory
            </Button>
          </Box>
        </Paper>
      )}

      {/* Seats Table */}
      <TableContainer component={Paper} sx={{ backgroundColor: '#1E1E1E', borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <TableCell sx={{ fontWeight: 700 }}>Row</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Seat Number</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Price (₹)</TableCell>
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
            ) : seats.length > 0 ? (
              seats.map((seat) => {
                const isEditing = editingSeatId === seat.id;

                return (
                  <TableRow
                    key={seat.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' } }}
                  >
                    <TableCell sx={{ fontWeight: 700 }}>{seat.rowLabel}</TableCell>
                    <TableCell>{seat.seatNumber}</TableCell>
                    <TableCell>
                      <Chip label={seat.seatType} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={seat.status}
                        color={getStatusColor(seat.status)}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 160 }}>
                      {isEditing ? (
                        <TextField
                          type="number"
                          size="small"
                          value={editingPrice}
                          onChange={(e) => setEditingPrice(e.target.value)}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                          sx={{ width: 120 }}
                          autoFocus
                        />
                      ) : (
                        <Typography sx={{ fontWeight: 600 }}>
                          ₹{seat.price != null ? seat.price : '—'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {isEditing ? (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Tooltip title="Save Price">
                            <span>
                              <IconButton
                                color="success"
                                size="small"
                                onClick={() => handleSavePrice(seat)}
                                disabled={updatingPrice}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <span>
                              <IconButton
                                color="inherit"
                                size="small"
                                onClick={handleCancelEditPrice}
                                disabled={updatingPrice}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Tooltip title="Edit Price">
                          <IconButton
                            color="info"
                            size="small"
                            onClick={() => handleStartEditPrice(seat)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No seat inventory generated yet for this show. Click "Generate Inventory" to initialize seats.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Generate Inventory Dialog */}
      <Dialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { backgroundColor: '#1E1E1E', borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Generate Show Inventory</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
            This generates seat records for this show based on the screen's seating layout.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            type="number"
            label="Default Ticket Price (₹)"
            value={defaultPrice}
            onChange={(e) => setDefaultPrice(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setGenerateDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleGenerateInventory}
            variant="contained"
            color="primary"
            disabled={generating}
          >
            {generating ? <CircularProgress size={22} /> : 'Generate'}
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

export default AdminShowSeats;
