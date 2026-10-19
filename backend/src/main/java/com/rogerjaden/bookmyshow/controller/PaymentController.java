package com.rogerjaden.bookmyshow.controller;

import com.rogerjaden.bookmyshow.dto.request.CreatePaymentRequest;
import com.rogerjaden.bookmyshow.dto.request.VerifyRazorpayPaymentRequest;
import com.rogerjaden.bookmyshow.dto.response.PaymentResponse;
import com.rogerjaden.bookmyshow.dto.response.RazorpayOrderResponse;
import com.rogerjaden.bookmyshow.service.interfaces.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<RazorpayOrderResponse> initiatePayment(
            @Valid @RequestBody CreatePaymentRequest request) {
        return ResponseEntity.ok(
                paymentService.initiatePayment(request));
    }

    @PostMapping("/verify")
    public ResponseEntity<PaymentResponse> verifyPayment(
            @Valid @RequestBody VerifyRazorpayPaymentRequest request) {
        return ResponseEntity.ok(
                paymentService.verifyPayment(request));
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponse> getPaymentById(
            @PathVariable Long paymentId) {
        return ResponseEntity.ok(
                paymentService.getPaymentById(paymentId));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<PaymentResponse> getLatestPaymentForBooking(
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(
                paymentService.getLatestPaymentForBooking(bookingId));
    }
}