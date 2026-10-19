package com.rogerjaden.bookmyshow.service.impl;

import com.rogerjaden.bookmyshow.dto.response.NotificationResponse;
import com.rogerjaden.bookmyshow.dto.response.PageResponse;
import com.rogerjaden.bookmyshow.entity.Notification;
import com.rogerjaden.bookmyshow.entity.User;
import com.rogerjaden.bookmyshow.entity.enums.NotificationType;
import com.rogerjaden.bookmyshow.entity.enums.UserStatus;
import com.rogerjaden.bookmyshow.entity.security.UserPrincipal;
import com.rogerjaden.bookmyshow.exception.ResourceNotFoundException;
import com.rogerjaden.bookmyshow.repository.NotificationRepository;
import com.rogerjaden.bookmyshow.repository.UserRepository;
import com.rogerjaden.bookmyshow.service.interfaces.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository,
                                   UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getMyNotifications(int page, int size) {
        User user = getCurrentUser();
        return toPageResponse(notificationRepository.findByUser_IdOrderByCreatedAtDesc(
                user.getId(), pageable(page, size)));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getMyUnreadNotifications(int page, int size) {
        User user = getCurrentUser();
        return toPageResponse(notificationRepository.findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(
                user.getId(), pageable(page, size)));
    }

    @Override
    @Transactional(readOnly = true)
    public long countMyUnreadNotifications() {
        return notificationRepository.countByUser_IdAndIsReadFalse(getCurrentUser().getId());
    }

    @Override
    public NotificationResponse markAsRead(Long notificationId) {
        Notification notification = findOwnedNotification(notificationId);
        notification.setRead(true);
        return toResponse(notificationRepository.save(notification));
    }

    @Override
    public void markAllAsRead() {
        User user = getCurrentUser();
        var notifications = notificationRepository
                .findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(
                        user.getId(), PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent();
        notifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    @Override
    public void deleteNotification(Long notificationId) {
        notificationRepository.delete(findOwnedNotification(notificationId));
    }

    @Override
    public NotificationResponse createForUser(Long userId, String title, String message,
                                               NotificationType type, Long referenceId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setReferenceId(referenceId);
        return toResponse(notificationRepository.save(notification));
    }

    @Override
    public int broadcastToAllUsers(
            String title,
            String message,
            NotificationType type) {

        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Title cannot be blank.");
        }

        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Message cannot be blank.");
        }

        if (title.length() > 180) {
            throw new IllegalArgumentException(
                    "Title cannot exceed 180 characters.");
        }

        if (type == null) {
            throw new IllegalArgumentException(
                    "Notification type is required.");
        }

        List<User> users = userRepository.findAllByStatus(UserStatus.ACTIVE);

        List<Notification> notifications = users.stream()
                .map(user -> {
                    Notification notification = new Notification();
                    notification.setUser(user);
                    notification.setTitle(title.trim());
                    notification.setMessage(message.trim());
                    notification.setType(type);
                    notification.setRead(false);
                    return notification;
                })
                .toList();

        notificationRepository.saveAll(notifications);

        return notifications.size();
    }

    private Notification findOwnedNotification(Long notificationId) {
        if (notificationId == null || notificationId <= 0) {
            throw new IllegalArgumentException("notificationId must be a positive number.");
        }
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification not found with id: " + notificationId));
        if (!notification.getUser().getId().equals(getCurrentUser().getId())) {
            throw new AccessDeniedException("You cannot access another user's notification.");
        }
        return notification;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new AccessDeniedException("Authenticated user not found.");
        }
        return userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));
    }

    private PageRequest pageable(int page, int size) {
        if (page < 0) throw new IllegalArgumentException("page must be zero or greater.");
        if (size < 1 || size > 100) throw new IllegalArgumentException("size must be between 1 and 100.");
        return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    private PageResponse<NotificationResponse> toPageResponse(Page<Notification> result) {
        return new PageResponse<>(result.getContent().stream().map(this::toResponse).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(),
                result.getTotalPages(), result.isLast());
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(notification.getId(), notification.getTitle(),
                notification.getMessage(), notification.getType(), notification.getReferenceId(),
                notification.isRead(), notification.getCreatedAt());
    }
}
