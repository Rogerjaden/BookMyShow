import axiosInstance from './axiosInstance';

// Backend: ScreenController  ->  /api/v1/screens  (admin only)

export const getScreenById = (screenId) => axiosInstance.get(`/v1/screens/${screenId}`);

export const getScreensByTheatre = (theatreId) =>
  axiosInstance.get(`/v1/screens/by-theatre/${theatreId}`);

// data: { theatreId, screenName, screenType, status }
export const createScreen = (data) => axiosInstance.post('/v1/screens', data);

export const updateScreen = (screenId, data) => axiosInstance.put(`/v1/screens/${screenId}`, data);

export const deactivateScreen = (screenId) => axiosInstance.delete(`/v1/screens/${screenId}`);
