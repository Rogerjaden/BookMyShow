import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardActions, CardContent, CardMedia, CircularProgress, Container, Grid, IconButton, Typography } from '@mui/material';
import DeleteIcon from "@mui/icons-material/Delete";
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useNavigate } from 'react-router-dom';
import { getMyWishlist, removeFromWishlist } from '../../api/wishlistApi';

const WishlistPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMyWishlist({ page: 0, size: 100 });
      setItems(response.data.content || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your wishlist.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadWishlist(); }, [loadWishlist]);

  const remove = async (movieId) => {
    setRemovingId(movieId);
    try {
      await removeFromWishlist(movieId);
      setItems((current) => current.filter((item) => item.movieId !== movieId));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove this movie.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, minHeight: '80vh' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <FavoriteIcon color="error" fontSize="large" />
        <Typography variant="h4" fontWeight={800}>My Wishlist</Typography>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 4 }}>Movies you want to watch later.</Typography>
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <FavoriteIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>Your wishlist is empty</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Add movies using the wishlist button on a movie's details page.</Typography>
          <Button variant="contained" onClick={() => navigate('/movies')}>Explore Movies</Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {items.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1E1E1E', overflow: 'hidden' }}>
                <CardMedia component="img" height="300" image={item.posterUrl || 'https://via.placeholder.com/380x540?text=No+Poster'} alt={item.movieTitle}
                  onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = 'https://via.placeholder.com/380x540?text=No+Poster'; }}
                  sx={{ objectFit: 'cover', cursor: 'pointer' }} onClick={() => navigate(`/movies/${item.movieId}`)} />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight={700}>{item.movieTitle}</Typography>
                  {item.createdAt && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Added {new Date(item.createdAt).toLocaleDateString()}</Typography>}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Button onClick={() => navigate(`/movies/${item.movieId}`)} size="small">View Movie</Button>
                  <IconButton color="error" aria-label={`Remove ${item.movieTitle} from wishlist`} onClick={() => remove(item.movieId)} disabled={removingId === item.movieId}>
                    {removingId === item.movieId ? <CircularProgress size={20} /> : <DeleteIcon />}
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default WishlistPage;
