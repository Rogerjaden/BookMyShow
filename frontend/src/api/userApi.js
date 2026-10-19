import axiosInstance from './axiosInstance';

export const getMyProfile = () => axiosInstance.get('/v1/users/me');
