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
@Table(name = "email_delivery")
public class EmailDelivery {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="user_id", nullable=false)
    private User user;

    @Column(nullable=false, length=80)
    private String eventType;

    private Long referenceId;

    @Column(nullable=false, length=255)
    private String recipientEmail;

    @Column(nullable=false, unique=true, length=120)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20)
    private EmailDeliveryStatus status = EmailDeliveryStatus.PENDING;

    @Column(nullable=false)
    private Integer attemptCount = 0;

    @Column(length=2000)
    private String lastError;

    private LocalDateTime sentAt;
    @Column(nullable=false, updatable=false)
    private LocalDateTime createdAt;

    @Column(nullable=false)
    private LocalDateTime updatedAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
