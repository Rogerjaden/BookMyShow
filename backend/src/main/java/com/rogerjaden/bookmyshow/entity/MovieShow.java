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
@Table(name = "movie_show")
public class MovieShow {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="movie_id", nullable=false)
    private Movie movie;

    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="screen_id", nullable=false)
    private Screen screen;

    @Column(nullable=false)
    private LocalDateTime startTime;

    @Column(nullable=false)
    private LocalDateTime endTime;

    @Column(nullable=false, length=60)
    private String language;

    @Enumerated(EnumType.STRING) @Column(nullable=false, length=30)
    private MovieFormat format;

    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20)
    private ShowStatus status = ShowStatus.SCHEDULED;

    @Column(nullable=false, updatable=false)
    private LocalDateTime createdAt;

    @Column(nullable=false)
    private LocalDateTime updatedAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
