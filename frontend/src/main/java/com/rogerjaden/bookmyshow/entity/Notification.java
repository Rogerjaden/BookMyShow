package com.rogerjaden.bookmyshow.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import com.rogerjaden.bookmyshow.entity.enums.*;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "notification")
public class Notification {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="user_id", nullable=false)
    private User user;

    @Column(nullable=false, length=180)
    private String title;

    @Column(nullable=false, columnDefinition="TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false, length=25)
    private NotificationType type;

    private Long referenceId;

    @Column(nullable=false)
    private boolean isRead = false;

    @Column(nullable=false, updatable=false)
    private LocalDateTime createdAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); }
}
