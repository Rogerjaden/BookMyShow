import axiosInstance from './axiosInstance';

export const getSeatsForShow = (showId) => {
  return axiosInstance.get(`/v1/shows/${showId}/seats`);
};

export const getAvailableSeats = (showId) => {
  return axiosInstance.get(`/v1/shows/${showId}/seats/available`);
};

export const generateInventory = (showId, defaultPrice) => {
  return axiosInstance.post(`/v1/shows/${showId}/seats/generate`, null, {
    params: { defaultPrice },
  });
};

export const updateSeatPrice = (showId, showSeatId, price) => {
  return axiosInstance.patch(
    `/v1/shows/${showId}/seats/inventory/${showSeatId}/price`,
    null,
    {
      params: { price },
    }
  );
};
