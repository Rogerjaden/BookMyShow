package com.rogerjaden.bookmyshow.repository;

import com.rogerjaden.bookmyshow.entity.Theatre;
import com.rogerjaden.bookmyshow.entity.enums.TheatreStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TheatreRepository extends JpaRepository<Theatre, Long> {
    Page<Theatre> findByCityIgnoreCase(String city, Pageable pageable);
    Page<Theatre> findByCityIgnoreCaseAndStatus(
            String city, TheatreStatus status, Pageable pageable);
    Page<Theatre> findByStatus(TheatreStatus status, Pageable pageable);
}
