import axiosInstance from './axiosInstance';

export const login = (data) => {
  return axiosInstance.post('/auth/login', data);
};

export const register = (data) => {
  return axiosInstance.post('/auth/register', data);
};

export const logout = (data) => {
  return axiosInstance.post('/auth/logout', data);
};

export const refresh = (data) => {
  return axiosInstance.post('/auth/refresh', data);
};
