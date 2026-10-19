
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { Link, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const verificationStarted = useRef(false);

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState(
    'Verifying your email address...'
  );

  useEffect(() => {
    if (verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;

    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('The verification link is missing its token.');
        return;
      }

      try {
        const response = await axiosInstance.get(
          '/auth/verify-email',
          {
            params: { token },
          }
        );

        setStatus('success');
        setMessage(
          response.data?.message ||
            'Your email has been verified successfully. You can now sign in.'
        );
      } catch (error) {
        console.error(
          'Email verification failed:',
          error.response?.status,
          error.response?.data || error.message
        );

        setStatus('error');
        setMessage(
          error.response?.data?.message ||
            error.response?.data?.error ||
            'This verification link is invalid, expired, or already used.'
        );
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <Paper
        elevation={4}
        sx={{
          p: 5,
          textAlign: 'center',
          backgroundColor: '#1E1E1E',
          borderRadius: 3,
        }}
      >
        {status === 'loading' && (
          <>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h5">
              Verifying your email
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Please wait while we verify your account.
            </Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircleIcon
              color="success"
              sx={{ fontSize: 64, mb: 2 }}
            />
            <Typography variant="h5" sx={{ mb: 2 }}>
              Email Verified!
            </Typography>
            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
              {message}
            </Alert>
            <Button
              component={Link}
              to="/login"
              variant="contained"
              fullWidth
            >
              Continue to Login
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <ErrorIcon
              color="error"
              sx={{ fontSize: 64, mb: 2 }}
            />
            <Typography variant="h5" sx={{ mb: 2 }}>
              Verification Failed
            </Typography>
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              {message}
            </Alert>
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              fullWidth
            >
              Go to Login
            </Button>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default VerifyEmail;