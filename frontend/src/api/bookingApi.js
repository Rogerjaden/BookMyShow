
import axiosInstance from './axiosInstance';

export const createBooking = (data) =>
  axiosInstance.post('/v1/bookings', data);

export const getBookingById = (bookingId) =>
  axiosInstance.get(`/v1/bookings/${bookingId}`);

export const getBookingByReference = (reference) =>
  axiosInstance.get(`/v1/bookings/reference/${reference}`);

export const getMyBookings = (page = 0, size = 10) =>
  axiosInstance.get('/v1/bookings/my', {
    params: { page, size },
  });

export const cancelBooking = (bookingId) =>
  axiosInstance.patch(`/v1/bookings/${bookingId}/cancel`);
