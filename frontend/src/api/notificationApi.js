import axiosInstance from './axiosInstance';

export const getNotifications = (params = {}) =>
  axiosInstance.get('/v1/notifications', { params });

export const getUnreadNotifications = (params = {}) =>
  axiosInstance.get('/v1/notifications/unread', { params });

export const getUnreadNotificationCount = () =>
  axiosInstance.get('/v1/notifications/unread-count');

export const markNotificationAsRead = (notificationId) =>
  axiosInstance.patch(`/v1/notifications/${notificationId}/read`);

export const markAllNotificationsAsRead = () =>
  axiosInstance.patch('/v1/notifications/read-all');

export const deleteNotification = (notificationId) =>
  axiosInstance.delete(`/v1/notifications/${notificationId}`);
