package com.rogerjaden.bookmyshow.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import com.rogerjaden.bookmyshow.entity.enums.ShowSeatStatus;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "show_seat", uniqueConstraints = @UniqueConstraint(
        name = "uk_show_seat_show_seat", columnNames = {"movie_show_id", "seat_id"}))
public class ShowSeat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movie_show_id", nullable = false)
    private MovieShow movieShow;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seat_id", nullable = false)
    private Seat seat;

    @Column(nullable = false, precision = 10, scale = 2)
    private java.math.BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ShowSeatStatus status = ShowSeatStatus.AVAILABLE;

    private LocalDateTime lockedUntil;

    @Version
    private Long version;
}
