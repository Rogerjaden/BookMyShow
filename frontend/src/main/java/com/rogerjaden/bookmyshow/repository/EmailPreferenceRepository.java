package com.rogerjaden.bookmyshow.repository;

import com.rogerjaden.bookmyshow.entity.EmailPreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailPreferenceRepository extends JpaRepository<EmailPreference, Long> {
    Optional<EmailPreference> findByUser_Id(Long userId);
    boolean existsByUser_Id(Long userId);
}
