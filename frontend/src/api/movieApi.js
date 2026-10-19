import axiosInstance from './axiosInstance';

export const getMovies = (params) => {
  return axiosInstance.get('/v1/movies', { params });
};

export const searchMovies = (params) => {
  return axiosInstance.get('/v1/movies/search', { params });
};

export const getMovieById = (id) => {
  return axiosInstance.get(`/v1/movies/${id}`);
};

export const createMovie = (data) => {
  return axiosInstance.post('/v1/movies', data);
};

export const updateMovie = (id, data) => {
  return axiosInstance.patch(`/v1/movies/${id}`, data);
};

export const publishMovie = (id) => {
  return axiosInstance.patch(`/v1/movies/${id}/publish`);
};

export const deleteMovie = (id) => {
  return axiosInstance.delete(`/v1/movies/${id}`);
};
