package com.rogerjaden.bookmyshow.repository;

import com.rogerjaden.bookmyshow.entity.Wishlist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    Page<Wishlist> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Optional<Wishlist> findByUser_IdAndMovie_Id(Long userId, Long movieId);
    boolean existsByUser_IdAndMovie_Id(Long userId, Long movieId);
}
