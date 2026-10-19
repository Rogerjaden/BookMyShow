package com.rogerjaden.bookmyshow.service.interfaces;

import com.rogerjaden.bookmyshow.dto.response.NotificationResponse;
import com.rogerjaden.bookmyshow.dto.response.PageResponse;

public interface NotificationService {
    PageResponse<NotificationResponse> getMyNotifications(int page, int size);
    PageResponse<NotificationResponse> getMyUnreadNotifications(int page, int size);
    long countMyUnreadNotifications();
    NotificationResponse markAsRead(Long notificationId);
    void markAllAsRead();
}
