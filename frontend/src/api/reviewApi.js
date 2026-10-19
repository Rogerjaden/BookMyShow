import axiosInstance from './axiosInstance';

export const getMovieReviews = (movieId, params = {}) =>
  axiosInstance.get(`/v1/movies/${movieId}/reviews`, { params });

export const createReview = (data) => axiosInstance.post('/v1/reviews', data);
