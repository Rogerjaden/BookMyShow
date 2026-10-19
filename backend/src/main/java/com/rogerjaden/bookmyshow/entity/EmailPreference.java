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
@Table(name = "email_preference")
public class EmailPreference {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="user_id", nullable=false, unique=true)
    private User user;

    @Column(nullable=false)
    private boolean marketingEmailsEnabled = true;

    @Column(nullable=false)
    private boolean bookingEmailsEnabled = true;

    @Column(nullable=false)
    private LocalDateTime updatedAt;

    @PrePersist @PreUpdate void onSave() { updatedAt = LocalDateTime.now(); }
}
