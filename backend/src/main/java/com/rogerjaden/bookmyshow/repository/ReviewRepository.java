package com.rogerjaden.bookmyshow.repository;

import com.rogerjaden.bookmyshow.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    Page<Review> findByMovie_IdOrderByCreatedAtDesc(Long movieId, Pageable pageable);
    Page<Review> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Optional<Review> findByUser_IdAndMovie_Id(Long userId, Long movieId);
    boolean existsByUser_IdAndMovie_Id(Long userId, Long movieId);
}
