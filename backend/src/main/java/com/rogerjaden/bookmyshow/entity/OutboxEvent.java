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
@Table(name = "outbox_event")
public class OutboxEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, length=80)
    private String aggregateType;

    @Column(nullable=false, length=100)
    private String aggregateId;

    @Column(nullable=false, length=100)
    private String eventType;

    @Column(nullable=false, columnDefinition="JSON")
    private String payload;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false, length=20)
    private OutboxStatus status = OutboxStatus.PENDING;

    @Column(nullable=false)
    private Integer attemptCount = 0;

    private LocalDateTime nextAttemptAt;

    @Column(nullable=false, updatable=false)
    private LocalDateTime createdAt;

    private LocalDateTime processedAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); if (nextAttemptAt == null) nextAttemptAt = createdAt; }
}
