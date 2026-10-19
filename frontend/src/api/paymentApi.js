import axiosInstance from './axiosInstance';

export const initiatePayment = (data) =>
  axiosInstance.post('/v1/payments', data);

export const verifyPayment = (data) =>
  axiosInstance.post('/v1/payments/verify', data);

export const getPaymentById = (id) =>
  axiosInstance.get(`/v1/payments/${id}`);

export const getLatestPaymentForBooking = (bookingId) =>
  axiosInstance.get(`/v1/payments/booking/${bookingId}`);