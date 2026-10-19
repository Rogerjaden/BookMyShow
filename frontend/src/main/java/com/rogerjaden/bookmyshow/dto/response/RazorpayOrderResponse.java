package com.rogerjaden.bookmyshow.dto.response;

import java.math.BigDecimal;

public record RazorpayOrderResponse(
        Long paymentId,
        Long bookingId,
        String razorpayOrderId,
        String keyId,
        BigDecimal amount,
        long amountInPaise,
        String currency,
        String paymentStatus
) {}