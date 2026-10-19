package com.rogerjaden.bookmyshow.dto.request;

import com.rogerjaden.bookmyshow.entity.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreatePaymentRequest(
        @NotNull @Positive Long bookingId,
        @NotNull PaymentMethod paymentMethod,
        @NotBlank @Size(max = 100) String idempotencyKey
) {}
