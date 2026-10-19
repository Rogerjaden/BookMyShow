package com.rogerjaden.bookmyshow.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "booking_seat")
public class BookingSeat {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="booking_id", nullable=false)
    private Booking booking;

    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="show_seat_id", nullable=false)
    private ShowSeat showSeat;

    @Column(nullable=false, precision=10, scale=2)
    private java.math.BigDecimal priceAtBooking;

    @Column(nullable=false, updatable=false)
    private LocalDateTime createdAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); }
}
