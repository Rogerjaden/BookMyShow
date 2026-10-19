import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';

import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';

import { useAuth } from '../../context/AuthContext';
import { getMyBookings, cancelBooking } from '../../api/bookingApi';
import { getMyProfile } from '../../api/userApi';

const formatDate = (value) => {
  if (!value) return 'Not available';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
};

const formatMoney = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(Number(amount || 0));

const statusColor = (status) => {
  switch (String(status || '').toUpperCase()) {
    case 'CONFIRMED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'CANCELLED':
    case 'EXPIRED':
    case 'FAILED':
      return 'error';
    default:
      return 'default';
  }
};

const Dashboard = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [profileResult, bookingsResult] = await Promise.all([
        getMyProfile(),
        getMyBookings(0, 100),
      ]);

      setProfile(profileResult.data);

      const data = bookingsResult.data;

      setBookings(
        Array.isArray(data) ? data : data?.content || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not load your dashboard. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const upcomingBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          String(booking.status || '').toUpperCase() === 'CONFIRMED' &&
          booking.showStartTime &&
          new Date(booking.showStartTime) >= new Date()
      ),
    [bookings]
  );

  const visibleBookings = useMemo(() => {
    if (tab === 1) {
      return upcomingBookings;
    }

    if (tab === 2) {
      return bookings.filter((booking) => {
        const status = String(booking.status || '').toUpperCase();

        return (
          ['CANCELLED', 'EXPIRED', 'FAILED'].includes(status) ||
          (status === 'CONFIRMED' &&
            booking.showStartTime &&
            new Date(booking.showStartTime) < new Date())
        );
      });
    }

    return bookings;
  }, [bookings, tab, upcomingBookings]);

  const handleCancel = async (booking) => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this booking?'
    );

    if (!confirmed) return;

    setActionError('');
    setCancellingId(booking.id);

    try {
      await cancelBooking(booking.id);
      await loadDashboard();
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          'Unable to cancel this booking.'
      );
    } finally {
      setCancellingId(null);
    }
  };

  const displayName =
    profile?.name || user?.name || user?.email || 'Movie lover';

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Box
      sx={{
        maxWidth: 1180,
        mx: 'auto',
        px: { xs: 2, md: 3 },
        py: { xs: 3, md: 5 },
      }}
    >
      <Stack spacing={0.75} sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          My dashboard
        </Typography>

        <Typography color="text.secondary">
          Your profile and all your movie bookings in one place.
        </Typography>
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={loadDashboard}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {actionError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setActionError('')}
        >
          {actionError}
        </Alert>
      )}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              height: '100%',
              background:
                'linear-gradient(135deg, rgba(229,57,53,.18), rgba(30,30,30,1) 68%)',
              border: '1px solid rgba(255,255,255,.08)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
              >
                <Avatar
                  sx={{
                    width: 62,
                    height: 62,
                    bgcolor: 'primary.main',
                    fontSize: 25,
                    fontWeight: 700,
                  }}
                >
                  {initial}
                </Avatar>

                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" noWrap>
                    {displayName}
                  </Typography>

                  <Typography
                    color="text.secondary"
                    variant="body2"
                    sx={{ overflowWrap: 'anywhere' }}
                  >
                    {profile?.email || user?.email || '—'}
                  </Typography>

                  <Chip
                    size="small"
                    label={profile?.role || user?.role || 'USER'}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Stack>

              <Divider
                sx={{
                  my: 2.5,
                  borderColor: 'rgba(255,255,255,.1)',
                }}
              />

              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  gap={2}
                >
                  <Typography color="text.secondary" variant="body2">
                    <PersonOutlinedIcon
                      sx={{
                        fontSize: 17,
                        verticalAlign: 'middle',
                        mr: 0.75,
                      }}
                    />
                    Phone:
                  </Typography>

                  <Typography variant="body2">
                    {profile?.phone || 'Not added'}
                  </Typography>
                </Stack>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  gap={2}
                >
                  <Typography color="text.secondary" variant="body2">
                    Account status
                  </Typography>

                  <Chip
                    size="small"
                    label={profile?.status || 'Unknown'}
                    color={
                      String(profile?.status).toUpperCase() === 'ACTIVE'
                        ? 'success'
                        : 'default'
                    }
                  />
                </Stack>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  gap={2}
                >
                  <Typography color="text.secondary" variant="body2">
                    Email verified:
                  </Typography>

                  <Typography variant="body2">
                    {profile?.emailVerified ? 'Yes' : 'Not verified'}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Grid container spacing={2} sx={{ height: '100%' }}>
            <Grid item xs={12} sm={6}>
              <Card
                sx={{
                  height: '100%',
                  border: '1px solid rgba(255,255,255,.08)',
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Total bookings
                      </Typography>

                      <Typography variant="h3" sx={{ mt: 1 }}>
                        {loading ? '—' : bookings.length}
                      </Typography>
                    </Box>

                    <Avatar
                      sx={{
                        bgcolor: 'rgba(229,57,53,.16)',
                        color: 'primary.main',
                        width: 52,
                        height: 52,
                      }}
                    >
                      <ConfirmationNumberOutlinedIcon />
                    </Avatar>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Card
                sx={{
                  height: '100%',
                  border: '1px solid rgba(255,255,255,.08)',
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Upcoming movies
                      </Typography>

                      <Typography variant="h3" sx={{ mt: 1 }}>
                        {loading ? '—' : upcomingBookings.length}
                      </Typography>
                    </Box>

                    <Avatar
                      sx={{
                        bgcolor: 'rgba(76,175,80,.14)',
                        color: 'success.main',
                        width: 52,
                        height: 52,
                      }}
                    >
                      <EventAvailableOutlinedIcon />
                    </Avatar>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card
                sx={{
                  height: '100%',
                  border: '1px solid rgba(255,255,255,.08)',
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    gap={2}
                  >
                    <Box>
                      <Typography variant="h6">
                        Ready for your next movie?
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        Explore movies and book your seats.
                      </Typography>
                    </Box>

                    <Button variant="contained" href="/movies">
                      Browse movies
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Card sx={{ border: '1px solid rgba(255,255,255,.08)' }}>
        <Box
          sx={{
            px: { xs: 1.5, sm: 2.5 },
            pt: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="h6">Booking history</Typography>

          <Button
            startIcon={<RefreshIcon />}
            onClick={loadDashboard}
            disabled={loading}
            size="small"
          >
            Refresh
          </Button>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
          sx={{ px: 1.5 }}
        >
          <Tab label={`All bookings (${bookings.length})`} />

          <Tab
            icon={<EventAvailableOutlinedIcon />}
            iconPosition="start"
            label={`Upcoming (${upcomingBookings.length})`}
          />

          <Tab
            icon={<HistoryOutlinedIcon />}
            iconPosition="start"
            label="Past & cancelled"
          />
        </Tabs>

        <Divider sx={{ borderColor: 'rgba(255,255,255,.08)' }} />

        <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                py: 7,
              }}
            >
              <CircularProgress />
            </Box>
          ) : visibleBookings.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <ConfirmationNumberOutlinedIcon
                sx={{
                  fontSize: 44,
                  color: 'text.secondary',
                  mb: 1,
                }}
              />

              <Typography variant="h6">
                No bookings here yet
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.5, mb: 2 }}
              >
                Your movie tickets will appear here after you book.
              </Typography>

              <Button variant="contained" href="/movies">
                Explore movies
              </Button>
            </Box>
          ) : (
            <Stack spacing={2}>
              {visibleBookings.map((booking) => (
                <Box
                  key={booking.id}
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,.09)',
                    bgcolor: 'rgba(255,255,255,.015)',
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                    spacing={1.5}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        flexWrap="wrap"
                        gap={1}
                        sx={{ mb: 0.75 }}
                      >
                        <Typography variant="h6">
                          {booking.movieTitle || 'Movie booking'}
                        </Typography>

                        <Chip
                          size="small"
                          label={booking.status || 'UNKNOWN'}
                          color={statusColor(booking.status)}
                        />
                      </Stack>

                      <Typography color="text.secondary" variant="body2">
                        {booking.theatreName || 'Theatre not available'}
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Showtime: {formatDate(booking.showStartTime)}
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Seats:{' '}
                        {booking.seats?.length
                          ? booking.seats
                              .map(
                                (seat) =>
                                  `${seat.rowLabel || ''}${seat.seatNumber ?? ''}`
                              )
                              .join(', ')
                          : '—'}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        textAlign: { xs: 'left', sm: 'right' },
                        minWidth: { sm: 170 },
                      }}
                    >
                      <Typography variant="h6">
                        {formatMoney(booking.totalAmount)}
                      </Typography>

                      <Typography
                        color="text.secondary"
                        variant="caption"
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        Booking ref
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{ overflowWrap: 'anywhere' }}
                      >
                        {booking.bookingReference || `#${booking.id}`}
                      </Typography>

                      {String(booking.status || '').toUpperCase() ===
                        'CONFIRMED' && (
                        <Button
                          variant="contained"
                          size="small"
                          sx={{ mt: 1.5, mr: 1 }}
                          href={`/tickets/${booking.id}`}
                        >
                          View Ticket
                        </Button>
                      )}

                      {String(booking.status || '').toUpperCase() ===
                        'PENDING' && (
                        <Button
                          color="error"
                          variant="outlined"
                          size="small"
                          sx={{ mt: 1.5 }}
                          disabled={cancellingId === booking.id}
                          onClick={() => handleCancel(booking)}
                        >
                          {cancellingId === booking.id
                            ? 'Cancelling…'
                            : 'Cancel booking'}
                        </Button>
                      )}
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;