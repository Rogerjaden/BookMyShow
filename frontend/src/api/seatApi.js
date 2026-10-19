import axiosInstance from './axiosInstance';

// Backend: SeatController  ->  /api/v1/screens/{screenId}/seats  (admin only)

export const getSeatsByScreen = (screenId) => axiosInstance.get(`/v1/screens/${screenId}/seats`);

// seat: { screenId, rowLabel, seatNumber, seatType, status }
export const createSeat = (screenId, seat) =>
  axiosInstance.post(`/v1/screens/${screenId}/seats`, { ...seat, screenId });

// The backend validates every item in the list, including screenId, so it is added here.
export const createSeatsBulk = (screenId, seats) =>
  axiosInstance.post(
    `/v1/screens/${screenId}/seats/bulk`,
    seats.map((seat) => ({ ...seat, screenId }))
  );

export const updateSeat = (screenId, seatId, seat) =>
  axiosInstance.put(`/v1/screens/${screenId}/seats/${seatId}`, { ...seat, screenId });

// Soft delete: the seat is marked INACTIVE
export const deactivateSeat = (screenId, seatId) =>
  axiosInstance.delete(`/v1/screens/${screenId}/seats/${seatId}`);
