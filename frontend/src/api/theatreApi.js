import axiosInstance from './axiosInstance';
import {
  getScreensByTheatre as fetchScreensByTheatre,
  createScreen as createScreenRequest,
  deactivateScreen,
} from './screenApi';

export const getTheatres = (params) => {
  return axiosInstance.get('/v1/theatres', { params });
};

export const getTheatreById = (id) => {
  return axiosInstance.get(`/v1/theatres/${id}`);
};

export const createTheatre = (data) => {
  return axiosInstance.post('/v1/theatres', data);
};

export const updateTheatre = (id, data) => {
  return axiosInstance.put(`/v1/theatres/${id}`, data);
};

export const deactivateTheatre = (id) => {
  return axiosInstance.delete(`/v1/theatres/${id}`);
};

/*
 * Screens do not live under /theatres on the backend, they have their own
 * /v1/screens endpoints (see screenApi.js). These wrappers keep the old
 * names working so existing imports, such as AdminShows, do not break.
 */
export const getScreensByTheatre = (theatreId) => fetchScreensByTheatre(theatreId);

export const createScreen = (theatreId, data) =>
  createScreenRequest({ status: 'ACTIVE', ...data, theatreId: Number(theatreId) });

export const deleteScreen = (_theatreId, screenId) => deactivateScreen(screenId);
