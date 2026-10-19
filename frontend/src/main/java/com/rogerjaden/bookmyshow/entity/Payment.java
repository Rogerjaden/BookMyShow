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
@Table(name = "payment")
public class Payment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="booking_id", nullable=false)
    private Booking booking;

    @Column(nullable=false, precision=10, scale=2)
    private java.math.BigDecimal amount;

    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20)
    private PaymentStatus status = PaymentStatus.INITIATED;

    @Enumerated(EnumType.STRING) @Column(nullable=false, length=25)
    private PaymentMethod paymentMethod;

    @Column(length=150)
    private String providerReference;

    @Column(nullable=false, unique=true, length=100)
    private String idempotencyKey;

    @Column(length=1000)
    private String failureReason;

    private LocalDateTime paidAt;

    @Column(nullable=false, updatable=false)
    private LocalDateTime createdAt;

    @Column(nullable=false)
    private LocalDateTime updatedAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
