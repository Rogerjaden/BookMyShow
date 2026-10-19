package com.rogerjaden.bookmyshow.dto.request;

import jakarta.validation.constraints.NotBlank;

public record VerifyRazorpayPaymentRequest(
        @NotBlank String razorpayPaymentId,
        @NotBlank String razorpayOrderId,
        @NotBlank String razorpaySignature
) {}