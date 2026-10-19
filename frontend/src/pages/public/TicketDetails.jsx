
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import { QRCodeSVG } from 'qrcode.react';
import { getTicket } from '../../api/ticketApi';

const formatDate = (value) => {
  if (!value) return 'Not available';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatMoney = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(Number(amount || 0));

const TicketDetails = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadTicket = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getTicket(bookingId);

        if (active) {
          setTicket(response.data);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              'Unable to load this ticket. Make sure the booking is confirmed and payment succeeded.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTicket();

    return () => {
      active = false;
    };
  }, [bookingId]);

  const downloadTicket = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !ticket) {
    return (
      <Box sx={{ maxWidth: 700, mx: 'auto', p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Ticket not found.'}
        </Alert>

        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
        >
          Back to dashboard
        </Button>
      </Box>
    );
  }

  const qrPayload = JSON.stringify({
    bookingReference: ticket.bookingReference,
    bookingId: ticket.bookingId,
  });

  return (
    <Box
      sx={{
        maxWidth: 900,
        mx: 'auto',
        px: { xs: 2, sm: 3 },
        py: { xs: 3, md: 5 },
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        sx={{ mb: 3 }}
        className="ticket-actions"
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
        >
          My bookings
        </Button>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={downloadTicket}
        >
          Print / Save ticket
        </Button>
      </Stack>

      <Card
        id="movie-ticket"
        sx={{
          overflow: 'hidden',
          borderRadius: 4,
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 8,
        }}
      >
        <Box
          sx={{
            px: { xs: 2.5, sm: 4 },
            py: 3,
            background:
              'linear-gradient(120deg, rgba(229,57,53,.22), rgba(30,30,30,.2))',
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            gap={2}
          >
            <Box>
              <Typography variant="overline" color="text.secondary">
                BOOKMYSHOW CLONE
              </Typography>

              <Typography variant="h4" fontWeight={800}>
                Your Ticket
              </Typography>
            </Box>

            <Chip
              label={ticket.bookingStatus}
              color="success"
              variant="filled"
            />
          </Stack>
        </Box>

        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
            {ticket.movieTitle}
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {ticket.language} - {ticket.format}
          </Typography>

          <Stack spacing={2}>
            <Box>
              <Typography color="text.secondary" variant="body2">
                DATE & TIME
              </Typography>

              <Typography variant="h6">
                {formatDate(ticket.showStartTime)}
              </Typography>
            </Box>

            <Box>
              <Typography color="text.secondary" variant="body2">
                THEATRE
              </Typography>

              <Typography variant="h6">
                {ticket.theatreName}
              </Typography>

              <Typography color="text.secondary">
                Screen: {ticket.screenName}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'minmax(0, 1fr) auto',
              },
              gap: 3,
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography color="text.secondary" variant="body2">
                NUMBER OF SEATS
              </Typography>

              <Typography variant="h5" fontWeight={700}>
                {ticket.seats.length} Ticket(s)
              </Typography>

              <Typography
                variant="h4"
                fontWeight={800}
                sx={{ mt: 2, overflowWrap: 'anywhere' }}
              >
                {ticket.seats.join(', ')}
              </Typography>

              <Typography
                color="text.secondary"
                variant="body2"
                sx={{ mt: 2 }}
              >
                BOOKING ID
              </Typography>

              <Typography
                fontWeight={700}
                sx={{ overflowWrap: 'anywhere' }}
              >
                {ticket.bookingReference}
              </Typography>
            </Box>

            <Box
              sx={{
                textAlign: 'center',
                p: 2,
                bgcolor: '#ffffff',
                color: '#111111',
                borderRadius: 2,
                width: 'fit-content',
                mx: { xs: 'auto', sm: 0 },
              }}
            >
              <QRCodeSVG
                value={qrPayload}
                size={180}
                level="H"
                marginSize={2}
                title={`Ticket ${ticket.bookingReference}`}
              />

              <Typography
                variant="caption"
                display="block"
                sx={{ mt: 1, color: '#333333' }}
              >
                Booking reference QR
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            gap={2}
          >
            <Box>
              <Typography color="text.secondary" variant="body2">
                PAYMENT STATUS
              </Typography>

              <Chip
                label={ticket.paymentStatus}
                color={
                  ticket.paymentStatus === 'SUCCESS'
                    ? 'success'
                    : 'default'
                }
                sx={{ mt: 0.5 }}
              />
            </Box>

            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography color="text.secondary" variant="body2">
                TOTAL AMOUNT
              </Typography>

              <Typography variant="h4" fontWeight={800}>
                {formatMoney(ticket.totalAmount)}
              </Typography>
            </Box>
          </Stack>

          <Alert severity="info" sx={{ mt: 3 }} className="ticket-actions">
            Keep this ticket available when you arrive at the theatre.
          </Alert>
        </CardContent>
      </Card>

      <style>
        {`
          @media print {
            body {
              background: white !important;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }

            body * {
              visibility: hidden;
            }

            #movie-ticket,
            #movie-ticket * {
              visibility: visible;
            }

            #movie-ticket {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              box-shadow: none !important;
            }

            .ticket-actions {
              display: none !important;
            }
          }
        `}
      </style>
    </Box>
  );
};

export default TicketDetails;