package com.rogerjaden.bookmyshow.service.interfaces;

import com.rogerjaden.bookmyshow.dto.request.CreatePaymentRequest;
import com.rogerjaden.bookmyshow.dto.request.VerifyRazorpayPaymentRequest;
import com.rogerjaden.bookmyshow.dto.response.PaymentResponse;
import com.rogerjaden.bookmyshow.dto.response.RazorpayOrderResponse;

public interface PaymentService {

    RazorpayOrderResponse initiatePayment(CreatePaymentRequest request);

    PaymentResponse verifyPayment(VerifyRazorpayPaymentRequest request);

    PaymentResponse getPaymentById(Long paymentId);

    PaymentResponse getLatestPaymentForBooking(Long bookingId);

    RazorpayOrderResponse retryPayment(Long bookingId, String idempotencyKey);

    PaymentResponse refundPayment(Long paymentId, String reason);
}