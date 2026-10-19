import axiosInstance from './axiosInstance';

export const getTicket = (bookingId) =>
  axiosInstance.get(`/v1/tickets/${bookingId}`);
