package com.rogerjaden.bookmyshow.repository;

import com.rogerjaden.bookmyshow.entity.Payment;
import com.rogerjaden.bookmyshow.entity.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByBooking_IdOrderByCreatedAtDesc(Long bookingId);
    Optional<Payment> findByIdempotencyKey(String idempotencyKey);
    Optional<Payment> findByProviderReference(String providerReference);
    List<Payment> findByStatus(PaymentStatus status);
    boolean existsByIdempotencyKey(String idempotencyKey);
}
