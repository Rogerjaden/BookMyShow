
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import TheatersIcon from '@mui/icons-material/Theaters';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import SeatMap from '../../components/SeatMap';
import AnimatedNumber from '../../components/AnimatedNumber';
import PaymentCheckout from '../../components/PaymentCheckout';
import { getShowById } from '../../api/showApi';
import { getSeatsForShow } from '../../api/showSeatApi';
import { createBooking } from '../../api/bookingApi';
import { getErrorMessage } from '../../utils/errors';
import {
  MAX_SEATS_PER_BOOKING,
  SEAT_TYPE_META,
  findBestSeats,
  formatPrice,
} from '../../utils/seatUtils';

const REFRESH_MS = 20000;

const SeatSelection = () => {
  const { showId } = useParams();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [quantity, setQuantity] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const [bookingLoading, setBookingLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [bookingError, setBookingError] = useState('');

  const selectedRef = useRef(selectedSeats);
  selectedRef.current = selectedSeats;

  const notify = useCallback((message, severity = 'info') => {
    setToast({ open: true, message, severity });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setSelectedSeats([]);
      selectedRef.current = [];

      try {
        const [showRes, seatsRes] = await Promise.all([
          getShowById(showId),
          getSeatsForShow(showId),
        ]);

        if (cancelled) return;

        setShow(showRes.data);
        setSeats(Array.isArray(seatsRes.data) ? seatsRes.data : []);
      } catch (err) {
        if (!cancelled) {
          setError(
            getErrorMessage(
              err,
              'Failed to load the show or its seating plan.'
            )
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (showId) fetchData();

    return () => {
      cancelled = true;
    };
  }, [showId]);

  useEffect(() => {
    if (!showId) return undefined;

    const timer = setInterval(async () => {
      if (document.hidden || bookingLoading) return;

      try {
        const res = await getSeatsForShow(showId);
        const fresh = Array.isArray(res.data) ? res.data : [];
        const byId = new Map(fresh.map((seat) => [seat.id, seat]));
        const current = selectedRef.current;

        const kept = current
          .map((seat) => byId.get(seat.id))
          .filter((seat) => seat && seat.status === 'AVAILABLE');

        setSeats(fresh);

        if (kept.length !== current.length) {
          setSelectedSeats(kept);
          selectedRef.current = kept;

          notify(
            'Some selected seats are no longer available. Please select again.',
            'warning'
          );
        }
      } catch {
        // Background refresh failures do not interrupt seat selection.
      }
    }, REFRESH_MS);

    return () => clearInterval(timer);
  }, [showId, notify, bookingLoading]);

  const handleSeatToggle = useCallback(
    (seat) => {
      if (bookingLoading || seat.status !== 'AVAILABLE') return;

      const current = selectedRef.current;

      if (current.some((item) => item.id === seat.id)) {
        const updated = current.filter((item) => item.id !== seat.id);
        selectedRef.current = updated;
        setSelectedSeats(updated);
        return;
      }

      if (current.length >= MAX_SEATS_PER_BOOKING) {
        notify(
          `You can book up to ${MAX_SEATS_PER_BOOKING} seats at a time.`,
          'warning'
        );
        return;
      }

      const updated = [...current, seat];
      selectedRef.current = updated;
      setSelectedSeats(updated);
    },
    [bookingLoading, notify]
  );

  const handleBestSeats = () => {
    const group = findBestSeats(seats, quantity);

    if (group.length === 0) {
      notify(
        `There aren't ${quantity} seats together in the same tier. Try fewer seats, or pick them yourself.`,
        'warning'
      );
      return;
    }

    selectedRef.current = group;
    setSelectedSeats(group);
  };

  const totalPrice = selectedSeats.reduce(
    (sum, seat) => sum + (Number(seat.price) || 0),
    0
  );

  const byTier = Object.values(
    selectedSeats.reduce((acc, seat) => {
      const key = `${seat.seatType}|${seat.price}`;

      if (!acc[key]) {
        acc[key] = {
          type: seat.seatType,
          price: seat.price,
          count: 0,
        };
      }

      acc[key].count += 1;
      return acc;
    }, {})
  );

  const handleBookingConfirm = async () => {
    if (selectedRef.current.length === 0 || bookingLoading) return;

    const requestedSeatIds = selectedRef.current.map((seat) => seat.id);

    setBookingLoading(true);
    setBookingError('');

    try {
      const response = await createBooking({
        movieShowId: Number(showId),
        showSeatIds: requestedSeatIds,
      });

      setBooking(response.data);

      selectedRef.current = [];
      setSelectedSeats([]);

      try {
        const freshSeats = await getSeatsForShow(showId);
        setSeats(Array.isArray(freshSeats.data) ? freshSeats.data : []);
      } catch {
        notify(
          'Booking created successfully, but the seat map could not refresh.',
          'warning'
        );
      }
    } catch (err) {
      const message = getErrorMessage(
        err,
        'Unable to create your booking.'
      );

      setBookingError(message);

      if (err.response?.status === 409) {
        notify(
          'These seats are no longer available. Please select different seats.',
          'error'
        );
      } else {
        notify(message, 'error');
      }

      try {
        const freshSeats = await getSeatsForShow(showId);
        setSeats(Array.isArray(freshSeats.data) ? freshSeats.data : []);
      } catch {
        // Keep the current seat map if refreshing fails.
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCopyReference = async () => {
    if (!booking?.bookingReference) return;

    try {
      await navigator.clipboard.writeText(booking.bookingReference);
      notify('Booking reference copied.', 'success');
    } catch {
      notify('Unable to copy the booking reference.', 'error');
    }
  };

  const closeBookingDialog = () => {
    setBooking(null);
    setBookingError('');
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="text" width={160} height={40} sx={{ mb: 2 }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'minmax(0,1fr) 360px',
            },
            gap: 3,
          }}
        >
          <Skeleton
            variant="rounded"
            height={520}
            sx={{ borderRadius: 3 }}
          />
          <Skeleton
            variant="rounded"
            height={380}
            sx={{ borderRadius: 3 }}
          />
        </Box>
      </Container>
    );
  }

  if (error || !show) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'We could not find this show.'}
        </Alert>

        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Go back
        </Button>
      </Container>
    );
  }

  const hasSelection = selectedSeats.length > 0;

  const bookingSeats = booking?.seats || booking?.bookingSeats || [];

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 4,
        pb: { xs: hasSelection ? 14 : 4, lg: 4 },
      }}
    >
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{
          mb: 2,
          color: 'text.secondary',
          '&:hover': { color: 'text.primary' },
        }}
      >
        Back to showtimes
      </Button>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          {show.movieTitle || 'Movie'}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1,
            mt: 1,
          }}
        >
          <Chip
            icon={<TheatersIcon />}
            size="small"
            label={`${show.theatreName || 'Theatre'}, ${show.screenName || 'Screen'}`}
          />

          <Chip
            icon={<AccessTimeIcon />}
            size="small"
            label={dayjs(show.startTime).format('ddd D MMM, hh:mm A')}
          />

          {show.format && (
            <Chip
              size="small"
              variant="outlined"
              label={show.format.replace('_', ' ')}
            />
          )}

          {show.language && (
            <Chip
              size="small"
              variant="outlined"
              label={show.language}
            />
          )}
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'minmax(0,1fr) 360px',
          },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 2,
              p: 2,
              mb: 4,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.04)',
            }}
          >
            <Box sx={{ flex: '1 1 220px' }}>
              <Typography variant="subtitle2">
                Sitting together?
              </Typography>

              <Typography variant="caption" color="text.secondary">
                Choose how many seats and we&apos;ll find the best ones side
                by side.
              </Typography>
            </Box>

            <Box
              sx={{ display: 'flex', gap: 0.75 }}
              role="radiogroup"
              aria-label="Number of seats"
            >
              {Array.from(
                { length: MAX_SEATS_PER_BOOKING },
                (_, index) => index + 1
              ).map((number) => (
                <Box
                  key={number}
                  component="button"
                  type="button"
                  role="radio"
                  aria-checked={quantity === number}
                  onClick={() => setQuantity(number)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: '1px solid',
                    borderColor:
                      quantity === number
                        ? 'primary.main'
                        : 'rgba(255,255,255,0.2)',
                    bgcolor:
                      quantity === number ? 'primary.main' : 'transparent',
                    color: '#fff',
                    font: 'inherit',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 160ms ease',
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                >
                  {number}
                </Box>
              ))}
            </Box>

            <Button
              variant="outlined"
              startIcon={<CheckCircleIcon />}
              onClick={handleBestSeats}
              disabled={bookingLoading}
            >
              Pick best seats
            </Button>
          </Box>

          <SeatMap
            seats={seats}
            selectedSeats={selectedSeats}
            onSeatToggle={handleSeatToggle}
          />
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            position: { lg: 'sticky' },
            top: { lg: 88 },
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Your seats
          </Typography>

          {hasSelection ? (
            <>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  mb: 2,
                }}
              >
                {[...selectedSeats]
                  .sort(
                    (a, b) =>
                      a.rowLabel.localeCompare(b.rowLabel) ||
                      a.seatNumber - b.seatNumber
                  )
                  .map((seat) => (
                    <Chip
                      key={seat.id}
                      label={`${seat.rowLabel}${seat.seatNumber}`}
                      onDelete={() => handleSeatToggle(seat)}
                      disabled={bookingLoading}
                      sx={{
                        fontWeight: 700,
                        bgcolor: 'rgba(255,82,82,0.16)',
                        border: '1px solid rgba(255,82,82,0.5)',
                        animation:
                          'popIn 260ms cubic-bezier(.2,1.3,.4,1) both',
                      }}
                    />
                  ))}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {byTier.map((tier) => (
                  <Box
                    key={`${tier.type}|${tier.price}`}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {(
                        SEAT_TYPE_META[tier.type] ||
                        SEAT_TYPE_META.REGULAR
                      ).label}{' '}
                      × {tier.count}
                    </Typography>

                    <Typography variant="body2">
                      {formatPrice(
                        (Number(tier.price) || 0) * tier.count
                      )}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          ) : (
            <Box
              sx={{
                textAlign: 'center',
                py: 3,
                color: 'text.secondary',
              }}
            >
              <EventSeatIcon sx={{ fontSize: 40, mb: 1, opacity: 0.6 }} />

              <Typography variant="body2">
                Tap a seat on the map to add it here.
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2.5 }} />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              mb: 2.5,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Total
            </Typography>

            <Typography variant="h4" color="primary.main">
              <AnimatedNumber value={totalPrice} prefix="₹" />
            </Typography>
          </Box>

          <Button
            variant="contained"
            fullWidth
            size="large"
            disabled={!hasSelection || bookingLoading}
            startIcon={
              bookingLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <ConfirmationNumberIcon />
              )
            }
            onClick={handleBookingConfirm}
            sx={{ py: 1.4 }}
          >
            {bookingLoading
              ? 'Reserving seats...'
              : hasSelection
                ? `Book ${selectedSeats.length} ${
                    selectedSeats.length === 1 ? 'seat' : 'seats'
                  }`
                : 'Choose your seats'}
          </Button>
        </Paper>
      </Box>

      {hasSelection && (
        <Box
          sx={{
            display: { xs: 'flex', lg: 'none' },
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: (theme) => theme.zIndex.appBar,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            px: 2,
            py: 1.5,
            bgcolor: 'rgba(30,30,30,0.96)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            animation: 'slideUp 280ms cubic-bezier(.2,.9,.3,1) both',
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              {selectedSeats.length}{' '}
              {selectedSeats.length === 1 ? 'seat' : 'seats'}
            </Typography>

            <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
              <AnimatedNumber value={totalPrice} prefix="₹" />
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={handleBookingConfirm}
            disabled={bookingLoading}
            startIcon={
              bookingLoading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <ConfirmationNumberIcon />
              )
            }
          >
            {bookingLoading ? 'Reserving...' : 'Book now'}
          </Button>
        </Box>
      )}

      <Dialog
        open={Boolean(booking)}
        onClose={closeBookingDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
            backgroundImage: 'none',
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {booking && (
          <>
            <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
              <CheckCircleRoundedIcon
                sx={{
                  fontSize: 64,
                  color: 'success.main',
                  mb: 1,
                }}
              />

              <Typography variant="h5" fontWeight={800}>
                Seats reserved!
              </Typography>

              <Typography color="text.secondary" variant="body2">
                Your booking is pending payment confirmation.
              </Typography>
            </DialogTitle>

            <DialogContent>
              <Paper
                variant="outlined"
                sx={{ p: 2.5, borderRadius: 3, mb: 2 }}
              >
                <Typography variant="overline" color="text.secondary">
                  Booking reference
                </Typography>

                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={1}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={800}
                    sx={{ overflowWrap: 'anywhere' }}
                  >
                    {booking.bookingReference || 'Not provided'}
                  </Typography>

                  {booking.bookingReference && (
                    <Button
                      size="small"
                      startIcon={<ContentCopyIcon />}
                      onClick={handleCopyReference}
                    >
                      Copy
                    </Button>
                  )}
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Movie
                    </Typography>

                    <Typography fontWeight={600}>
                      {booking.movieTitle || show.movieTitle || 'Movie'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Theatre
                    </Typography>

                    <Typography fontWeight={600}>
                      {booking.theatreName ||
                        show.theatreName ||
                        'Theatre'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Show time
                    </Typography>

                    <Typography fontWeight={600}>
                      {dayjs(
                        booking.startTime || show.startTime
                      ).format('ddd D MMM YYYY, hh:mm A')}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Seats
                    </Typography>

                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1,
                        flexWrap: 'wrap',
                        mt: 0.5,
                      }}
                    >
                      {bookingSeats.length > 0 ? (
                        bookingSeats.map((seat, index) => (
                          <Chip
                            key={seat.id ?? seat.showSeatId ?? index}
                            label={
                              seat.rowLabel != null &&
                              seat.seatNumber != null
                                ? `${seat.rowLabel}${seat.seatNumber}`
                                : `Seat ${seat.showSeatId ?? seat.id}`
                            }
                            color="primary"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="body2">
                          {requestedSeatIdsLabel(booking)}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Divider />

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography color="text.secondary">
                      Total amount
                    </Typography>

                    <Typography
                      variant="h5"
                      fontWeight={800}
                      color="primary.main"
                    >
                      {formatPrice(Number(booking.totalAmount) || 0)}
                    </Typography>
                  </Stack>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography color="text.secondary">
                      Booking status
                    </Typography>

                    <Chip
                      label={booking.status || 'PENDING'}
                      color={
                        booking.status === 'PENDING'
                          ? 'warning'
                          : booking.status === 'CONFIRMED'
                            ? 'success'
                            : 'default'
                      }
                      size="small"
                    />
                  </Stack>

                  {booking.expiresAt && (
                    <Alert severity="warning">
                      Complete the next booking step before{' '}
                      {dayjs(booking.expiresAt).format(
                        'DD MMM YYYY, hh:mm A'
                      )}
                      .
                    </Alert>
                  )}
                </Stack>
              </Paper>

              <PaymentCheckout
                booking={booking}
                onPaymentComplete={() => {
                  setBooking((previous) => ({
                    ...previous,
                    status: 'CONFIRMED',
                  }));
                  notify(
                    'Payment successful! Your booking is confirmed.',
                    'success'
                  );
                }}
              />

              {bookingError && (
                <Alert severity="error">{bookingError}</Alert>
              )}
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={closeBookingDialog}
              >
                Done
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() =>
          setToast((current) => ({ ...current, open: false }))
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          bottom: { xs: hasSelection ? 88 : 24, lg: 24 },
        }}
      >
        <Alert
          onClose={() =>
            setToast((current) => ({ ...current, open: false }))
          }
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

function requestedSeatIdsLabel(booking) {
  if (booking.showSeatIds?.length) {
    return booking.showSeatIds.join(', ');
  }

  return 'Seat details were not included in the response.';
}

export default SeatSelection;
