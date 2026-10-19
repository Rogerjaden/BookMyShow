import axiosInstance from './axiosInstance';

export const getShows = (params) => {
  return axiosInstance.get('/v1/shows', { params });
};

export const getShowById = (id) => {
  return axiosInstance.get(`/v1/shows/${id}`);
};

export const createShow = (data) => {
  return axiosInstance.post('/v1/shows', data);
};

export const updateShow = (id, data) => {
  return axiosInstance.patch(`/v1/shows/${id}`, data);
};

export const cancelShow = (id) => {
  return axiosInstance.delete(`/v1/shows/${id}`);
};
