
import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import {
  initiatePayment,
  verifyPayment,
} from '../api/paymentApi';

const PAYMENT_METHODS = [
  {
    value: 'UPI',
    label: 'UPI',
    description: 'Google Pay, PhonePe and other UPI apps',
    icon: AccountBalanceWalletOutlinedIcon,
  },
  {
    value: 'CARD',
    label: 'Credit or debit card',
    description: 'Supported debit and credit cards',
    icon: CreditCardOutlinedIcon,
  },
  {
    value: 'NET_BANKING',
    label: 'Net banking',
    description: 'Pay through your bank',
    icon: AccountBalanceOutlinedIcon,
  },
];

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.detail ||
  error?.message ||
  fallback;

const generateIdempotencyKey = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);

    return Array.from(bytes, byte =>
      byte.toString(16).padStart(2, '0')
    ).join('');
  }

  throw new Error('Secure random number generation is unavailable');
};

const PaymentCheckout = ({ booking, onPaymentComplete }) => {
  const [method, setMethod] = useState('UPI');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const bookingId = booking?.id ?? booking?.bookingId;
  const amount = Number(booking?.totalAmount ?? 0);
  const completed = payment?.status === 'SUCCESS';

  const openCheckout = async () => {
    if (!bookingId || loading || completed) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const loaded = await loadRazorpay();

      if (!loaded) {
        throw new Error('Unable to load Razorpay Checkout. Check your connection.');
      }

      let currentOrder = order;

      if (!currentOrder) {
        const response = await initiatePayment({
          bookingId: Number(bookingId),
          paymentMethod: method,
          idempotencyKey: generateIdempotencyKey(),
        });

        currentOrder = response.data;
        setOrder(currentOrder);
      }

      const options = {
        key: currentOrder.keyId,
        amount: currentOrder.amountInPaise,
        currency: currentOrder.currency || 'INR',
        name: 'BookMyShow Clone',
        description: 'Movie ticket booking',
        order_id: currentOrder.razorpayOrderId,
        theme: {
          color: '#e53935',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        handler: async (razorpayResponse) => {
          try {
            setError('');
            setMessage('Verifying your payment...');

            const verificationResponse = await verifyPayment({
              razorpayPaymentId:
                razorpayResponse.razorpay_payment_id,
              razorpayOrderId:
                razorpayResponse.razorpay_order_id,
              razorpaySignature:
                razorpayResponse.razorpay_signature,
            });

            const verifiedPayment = verificationResponse.data;

            if (verifiedPayment.status !== 'SUCCESS') {
              throw new Error(
                'Payment has not been confirmed by the server.'
              );
            }

            setPayment(verifiedPayment);
            setMessage('Payment successful! Your booking is confirmed.');
            onPaymentComplete?.(verifiedPayment);
          } catch (verificationError) {
            setError(
              getErrorMessage(
                verificationError,
                'Payment was submitted, but confirmation could not be verified. Check your booking status before retrying.'
              )
            );
            setMessage('');
          } finally {
            setLoading(false);
          }
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on('payment.failed', (event) => {
        setError(
          event.error?.description ||
            'Payment failed. You can try again while your booking is still valid.'
        );
        setMessage('');
        setLoading(false);
      });

      checkout.open();
    } catch (checkoutError) {
      setError(
        getErrorMessage(
          checkoutError,
          'Unable to initiate payment. Please try again.'
        )
      );
      setLoading(false);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 3 },
        mt: 2,
        borderRadius: 3,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundImage: 'none',
      }}
    >
      <Stack spacing={2.5}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          gap={2}
        >
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Complete your payment
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Booking #{bookingId}
            </Typography>
          </Box>

          <Chip
            icon={<LockOutlinedIcon />}
            label="Secure checkout"
            size="small"
            color="success"
            variant="outlined"
          />
        </Box>

        <Box
          sx={{
            p: 2.5,
            borderRadius: 2,
            bgcolor: 'rgba(229,57,53,0.09)',
            border: '1px solid rgba(229,57,53,0.22)',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Total payable
          </Typography>

          <Typography variant="h4" color="primary.main" fontWeight={800}>
            {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 2,
            }).format(amount)}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Complete payment before your seat reservation expires.
          </Typography>
        </Box>

        {!order && !completed && (
          <>
            <Typography variant="subtitle1" fontWeight={700}>
              Preferred payment method
            </Typography>

            <RadioGroup
              value={method}
              onChange={(event) => setMethod(event.target.value)}
            >
              {PAYMENT_METHODS.map((item) => {
                const Icon = item.icon;

                return (
                  <Paper
                    key={item.value}
                    variant="outlined"
                    sx={{
                      mb: 1,
                      borderRadius: 2,
                      borderColor:
                        method === item.value
                          ? 'primary.main'
                          : 'divider',
                      bgcolor:
                        method === item.value
                          ? 'rgba(229,57,53,0.07)'
                          : 'transparent',
                    }}
                  >
                    <FormControlLabel
                      value={item.value}
                      control={<Radio />}
                      disabled={loading}
                      sx={{
                        m: 0,
                        p: 1,
                        width: '100%',
                      }}
                      label={
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                          sx={{ py: 0.5 }}
                        >
                          <Icon color="primary" />
                          <Box>
                            <Typography fontWeight={700}>
                              {item.label}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {item.description}
                            </Typography>
                          </Box>
                        </Stack>
                      }
                    />
                  </Paper>
                );
              })}
            </RadioGroup>
          </>
        )}

        {order && !completed && (
          <Alert severity="info">
            Razorpay order created. Complete payment in the secure checkout
            window. If an attempt fails, you can reopen checkout for this order.
          </Alert>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {message && (
          <Alert severity={completed ? 'success' : 'info'}>
            {completed && <CheckCircleRoundedIcon sx={{ mr: 1, verticalAlign: 'middle' }} />}
            {message}
          </Alert>
        )}

        {!completed && (
          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={loading || !bookingId || amount <= 0}
            onClick={openCheckout}
            startIcon={
              loading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <LockOutlinedIcon />
              )
            }
            sx={{ py: 1.4, fontWeight: 800 }}
          >
            {loading
              ? 'Processing...'
              : order
                ? 'Reopen Razorpay Checkout'
                : 'Proceed to payment'}
          </Button>
        )}

        {completed && (
          <Button
            variant="contained"
            color="success"
            fullWidth
            onClick={() => onPaymentComplete?.(payment)}
          >
            Continue
          </Button>
        )}

        <Divider />

        <Typography
          variant="caption"
          color="text.secondary"
          textAlign="center"
        >
          Payments are processed by Razorpay. Your booking is confirmed only
          after the backend verifies the payment.
        </Typography>
      </Stack>
    </Paper>
  );
};

export default PaymentCheckout;
