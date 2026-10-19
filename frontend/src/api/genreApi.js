import axiosInstance from './axiosInstance';

export const getGenres = () => {
  return axiosInstance.get('/v1/genres');
};

export const createGenre = (data) => {
  return axiosInstance.post('/v1/genres', data);
};

export const updateGenre = (id, data) => {
  return axiosInstance.put(`/v1/genres/${id}`, data);
};

export const deleteGenre = (id) => {
  return axiosInstance.delete(`/v1/genres/${id}`);
};

export const assignGenresToMovie = (movieId, genreIds) => {
  return axiosInstance.put(`/v1/genres/movies/${movieId}`, { genreIds });
};
