package com.rogerjaden.bookmyshow.entity;

import com.rogerjaden.bookmyshow.entity.enums.ScreenStatus;
import com.rogerjaden.bookmyshow.entity.enums.ScreenType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
    name = "screen",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_screen_theatre_name",
        columnNames = {"theatre_id", "screen_name"}
    )
)
public class Screen {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "theatre_id", nullable = false)
    private Theatre theatre;

    @Column(name = "screen_name", nullable = false, length = 80)
    private String screenName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ScreenType screenType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ScreenStatus status = ScreenStatus.ACTIVE;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
