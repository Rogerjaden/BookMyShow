package com.rogerjaden.bookmyshow.service.interfaces;

import com.rogerjaden.bookmyshow.dto.response.NotificationResponse;
import com.rogerjaden.bookmyshow.dto.response.PageResponse;
import com.rogerjaden.bookmyshow.entity.enums.NotificationType;

public interface NotificationService {
    PageResponse<NotificationResponse> getMyNotifications(int page, int size);
    PageResponse<NotificationResponse> getMyUnreadNotifications(int page, int size);
    long countMyUnreadNotifications();
    NotificationResponse markAsRead(Long notificationId);
    void markAllAsRead();
    void deleteNotification(Long notificationId);
    NotificationResponse createForUser(Long userId, String title, String message,
                                       NotificationType type, Long referenceId);
    int broadcastToAllUsers(
            String title,
            String message,
            NotificationType type
    );
}
