import React, { useEffect, useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { addToWishlist, isMovieWishlisted, removeFromWishlist } from '../api/wishlistApi';

const WishlistButton = ({ movieId, fullWidth = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!user || !movieId) return () => { active = false; };
    isMovieWishlisted(movieId)
      .then((response) => { if (active) setSaved(Boolean(response.data)); })
      .catch(() => { if (active) setSaved(false); });
    return () => { active = false; };
  }, [movieId, user]);

  const toggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (saved) {
        await removeFromWishlist(movieId);
        setSaved(false);
      } else {
        await addToWishlist(movieId);
        setSaved(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || (saved ? 'Could not remove movie.' : 'Could not add movie.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <span>
      <Button
        variant={saved ? 'contained' : 'outlined'}
        color={saved ? 'error' : 'inherit'}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : saved ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        onClick={toggle}
        disabled={loading}
        fullWidth={fullWidth}
      >
        {saved ? 'Saved to Wishlist' : 'Add to Wishlist'}
      </Button>
      {error && <span role="alert" style={{ display: 'block', color: '#f44336', fontSize: 12, marginTop: 4 }}>{error}</span>}
    </span>
  );
};

export default WishlistButton;
