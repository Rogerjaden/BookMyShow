import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Container, IconButton,
  Paper, Stack, Typography
} from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteIcon from "@mui/icons-material/Delete";
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useNavigate } from 'react-router-dom';
import {
  deleteNotification, getNotifications, markAllNotificationsAsRead,
  markNotificationAsRead
} from '../../api/notificationApi';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getNotifications({ page: 0, size: 100 });
      setNotifications(response.data.content || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Could not load notifications. Please sign in again and retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id) => {
    try {
      const response = await markNotificationAsRead(id);
      setNotifications((current) =>
        current.map((item) => item.id === id ? response.data : item)
      );
    } catch (err) {
      setError('Could not mark this notification as read.');
    }
  };

  const handleMarkAllRead = async () => {
    setBusy(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) => current.map((item) => ({ ...item, read: true, isRead: true })));
    } catch (err) {
      setError('Could not mark all notifications as read.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError('Could not delete this notification.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Notifications</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Booking updates and important account messages
          </Typography>
        </Box>
        <Button
          startIcon={<DoneAllIcon />}
          onClick={handleMarkAllRead}
          disabled={busy || !notifications.some((item) => !(item.isRead ?? item.read))}
        >
          Mark all read
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <NotificationsNoneIcon sx={{ fontSize: 52, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6">You're all caught up</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            New booking and payment notifications will appear here.
          </Typography>
          <Button sx={{ mt: 2 }} onClick={() => navigate('/movies')}>Explore movies</Button>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {notifications.map((item) => {
            const isRead = item.isRead ?? item.read ?? false;
            return (
              <Paper
                key={item.id}
                variant="outlined"
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 3,
                  borderColor: isRead ? 'divider' : 'primary.main',
                  bgcolor: isRead ? 'background.paper' : 'rgba(255, 64, 129, 0.06)',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <NotificationsNoneIcon color={isRead ? 'disabled' : 'primary'} sx={{ mt: 0.5 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography fontWeight={700}>{item.title}</Typography>
                      {!isRead && <Chip label="New" size="small" color="primary" />}
                      {item.type && <Chip label={item.type} size="small" variant="outlined" />}
                    </Stack>
                    <Typography color="text.secondary" sx={{ mt: 0.75, whiteSpace: 'pre-wrap' }}>
                      {item.message}
                    </Typography>
                    {item.createdAt && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        {new Date(item.createdAt).toLocaleString()}
                      </Typography>
                    )}
                    {!isRead && (
                      <Button size="small" sx={{ mt: 1 }} onClick={() => handleMarkRead(item.id)}>
                        Mark as read
                      </Button>
                    )}
                  </Box>
                  <IconButton aria-label="Delete notification" onClick={() => handleDelete(item.id)} size="small">
                    <DeleteIcon/>
                  </IconButton>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Container>
  );
};

export default NotificationsPage;
