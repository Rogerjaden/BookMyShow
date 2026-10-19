import axiosInstance from './axiosInstance';

export const getMyWishlist = (params = { page: 0, size: 100 }) =>
  axiosInstance.get('/v1/wishlist', { params });

export const addToWishlist = (movieId) =>
  axiosInstance.post('/v1/wishlist', { movieId });

export const removeFromWishlist = (movieId) =>
  axiosInstance.delete(`/v1/wishlist/${movieId}`);

export const isMovieWishlisted = (movieId) =>
  axiosInstance.get(`/v1/wishlist/contains/${movieId}`);
