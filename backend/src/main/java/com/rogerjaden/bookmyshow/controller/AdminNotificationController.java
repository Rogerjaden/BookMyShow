package com.rogerjaden.bookmyshow.controller;

import com.rogerjaden.bookmyshow.dto.request.BroadcastNotificationRequest;
import com.rogerjaden.bookmyshow.service.interfaces.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/notifications")
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final NotificationService notificationService;

    public AdminNotificationController(
            NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/broadcast")
    public ResponseEntity<Map<String, Object>> broadcast(
            @Valid @RequestBody BroadcastNotificationRequest request) {

        int recipientCount = notificationService.broadcastToAllUsers(
                request.title().trim(),
                request.message().trim(),
                request.type()
        );

        return ResponseEntity.ok(Map.of(
                "message", "Notifications sent successfully",
                "recipientCount", recipientCount
        ));
    }
}