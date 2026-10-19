import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Divider, Paper, Rating,
  Stack, TextField, Typography
} from '@mui/material';
import dayjs from 'dayjs';
import { createReview, getMovieReviews } from '../api/reviewApi';

const ReviewsSection = ({ movieId }) => {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(8);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMovieReviews(movieId, { page: 0, size: 10 });
      setReviews(response.data?.content || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load reviews.');
    } finally {
      setLoading(false);
    }
  }, [movieId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const submitReview = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await createReview({ movieId: Number(movieId), rating, comment: comment.trim() || null });
      setComment('');
      setRating(8);
      setSuccess('Your review was submitted.');
      await loadReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit your review. You may already have reviewed this movie.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>Reviews & Ratings</Typography>
      <Paper component="form" onSubmit={submitReview} sx={{ p: { xs: 2, md: 3 }, mb: 3, bgcolor: '#1E1E1E', borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Write a review</Typography>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Rating value={rating} max={10} onChange={(_, value) => value && setRating(value)} />
          <Typography color="text.secondary">{rating}/10</Typography>
        </Stack>
        <TextField fullWidth multiline minRows={3} label="Your thoughts (optional)" value={comment} onChange={(e) => setComment(e.target.value)} inputProps={{ maxLength: 5000 }} sx={{ mb: 2 }} />
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? <CircularProgress size={22} color="inherit" /> : 'Submit Review'}
        </Button>
      </Paper>

      {loading ? <CircularProgress /> : reviews.length === 0 ? (
        <Typography color="text.secondary">No reviews yet. Be the first to review this movie.</Typography>
      ) : reviews.map((review) => (
        <Paper key={review.id} sx={{ p: 2.5, mb: 2, bgcolor: '#1E1E1E', borderRadius: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box>
              <Typography fontWeight={700}>{review.userName || 'Moviegoer'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {review.createdAt ? dayjs(review.createdAt).format('D MMM YYYY') : ''}
              </Typography>
            </Box>
            <Typography fontWeight={800} color="primary.main">★ {review.rating}/10</Typography>
          </Stack>
          {review.comment && <Typography sx={{ mt: 1.5, whiteSpace: 'pre-wrap' }}>{review.comment}</Typography>}
          <Divider sx={{ mt: 2 }} />
        </Paper>
      ))}
    </Box>
  );
};

export default ReviewsSection;
