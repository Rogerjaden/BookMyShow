package com.rogerjaden.bookmyshow.service.impl;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import com.rogerjaden.bookmyshow.dto.request.CreatePaymentRequest;
import com.rogerjaden.bookmyshow.dto.request.VerifyRazorpayPaymentRequest;
import com.rogerjaden.bookmyshow.dto.response.PaymentResponse;
import com.rogerjaden.bookmyshow.dto.response.RazorpayOrderResponse;
import com.rogerjaden.bookmyshow.entity.Booking;
import com.rogerjaden.bookmyshow.entity.BookingSeat;
import com.rogerjaden.bookmyshow.entity.Payment;
import com.rogerjaden.bookmyshow.entity.ShowSeat;
import com.rogerjaden.bookmyshow.entity.User;
import com.rogerjaden.bookmyshow.entity.enums.BookingStatus;
import com.rogerjaden.bookmyshow.entity.enums.PaymentStatus;
import com.rogerjaden.bookmyshow.entity.enums.ShowSeatStatus;
import com.rogerjaden.bookmyshow.exception.ConflictException;
import com.rogerjaden.bookmyshow.exception.ResourceNotFoundException;
import com.rogerjaden.bookmyshow.repository.BookingRepository;
import com.rogerjaden.bookmyshow.repository.BookingSeatRepository;
import com.rogerjaden.bookmyshow.repository.PaymentRepository;
import com.rogerjaden.bookmyshow.repository.ShowSeatRepository;
import com.rogerjaden.bookmyshow.repository.UserRepository;
import com.rogerjaden.bookmyshow.service.interfaces.PaymentService;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final ShowSeatRepository showSeatRepository;
    private final UserRepository userRepository;
    private final RazorpayClient razorpayClient;
    private final String razorpayKeyId;
    private final String razorpayKeySecret;

    public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            BookingRepository bookingRepository,
            BookingSeatRepository bookingSeatRepository,
            ShowSeatRepository showSeatRepository,
            UserRepository userRepository,
            RazorpayClient razorpayClient,
            @Value("${razorpay.key.id}") String razorpayKeyId,
            @Value("${razorpay.key.secret}") String razorpayKeySecret) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.bookingSeatRepository = bookingSeatRepository;
        this.showSeatRepository = showSeatRepository;
        this.userRepository = userRepository;
        this.razorpayClient = razorpayClient;
        this.razorpayKeyId = razorpayKeyId;
        this.razorpayKeySecret = razorpayKeySecret;
    }

    @Override
    @Transactional
    public RazorpayOrderResponse initiatePayment(CreatePaymentRequest request) {
        Booking booking = bookingRepository.findByIdForUpdate(request.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking not found with id: " + request.bookingId()));

        ensureOwner(booking);
        validatePendingBooking(booking);

        var existing = paymentRepository.findByIdempotencyKey(
                request.idempotencyKey());

        if (existing.isPresent()) {
            Payment payment = existing.get();

            if (!payment.getBooking().getId().equals(booking.getId())
                    || payment.getPaymentMethod() != request.paymentMethod()) {
                throw new ConflictException(
                        "The idempotency key has already been used.");
            }

            if (payment.getStatus() != PaymentStatus.INITIATED
                    && payment.getStatus() != PaymentStatus.PENDING) {
                throw new ConflictException(
                        "This payment attempt has already been processed.");
            }

            if (payment.getProviderReference() == null) {
                throw new ConflictException(
                        "No Razorpay order is associated with this payment.");
            }

            return toOrderResponse(payment);
        }

        List<Payment> previousPayments =
                paymentRepository.findByBooking_IdOrderByCreatedAtDesc(
                        booking.getId());

        if (!previousPayments.isEmpty()) {
            Payment latest = previousPayments.get(0);

            if (latest.getStatus() == PaymentStatus.SUCCESS) {
                throw new ConflictException(
                        "This booking has already been paid.");
            }

            if (latest.getStatus() == PaymentStatus.INITIATED
                    || latest.getStatus() == PaymentStatus.PENDING) {
                throw new ConflictException(
                        "A payment is already in progress for this booking.");
            }
        }

        long amountInPaise = toPaise(booking.getTotalAmount());

        try {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", booking.getBookingReference());
            orderRequest.put("partial_payment", false);

            JSONObject notes = new JSONObject();
            notes.put("bookingId", booking.getId().toString());
            notes.put("bookingReference", booking.getBookingReference());
            orderRequest.put("notes", notes);

            Order order = razorpayClient.orders.create(orderRequest);

            Payment payment = new Payment();
            payment.setBooking(booking);
            payment.setAmount(booking.getTotalAmount());
            payment.setPaymentMethod(request.paymentMethod());
            payment.setStatus(PaymentStatus.INITIATED);
            payment.setIdempotencyKey(request.idempotencyKey());
            payment.setProviderReference(order.get("id").toString());

            return toOrderResponse(paymentRepository.save(payment));
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Unable to create Razorpay order.", exception);
        }
    }

    @Override
    @Transactional
    public PaymentResponse verifyPayment(
            VerifyRazorpayPaymentRequest request) {

        Payment payment = paymentRepository
                .findByProviderReference(request.razorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment order not found."));

        Booking booking = bookingRepository.findByIdForUpdate(
                        payment.getBooking().getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking not found."));

        ensureOwner(booking);

        if (payment.getStatus() == PaymentStatus.SUCCESS
                && booking.getStatus() == BookingStatus.CONFIRMED) {
            return toResponse(payment);
        }

        if (payment.getStatus() != PaymentStatus.INITIATED
                && payment.getStatus() != PaymentStatus.PENDING) {
            throw new ConflictException(
                    "This payment is no longer awaiting verification.");
        }

        if (!payment.getProviderReference().equals(
                request.razorpayOrderId())) {
            throw new ConflictException("Razorpay order ID does not match.");
        }

        try {
            JSONObject signatureData = new JSONObject();
            signatureData.put("razorpay_order_id",
                    request.razorpayOrderId());
            signatureData.put("razorpay_payment_id",
                    request.razorpayPaymentId());
            signatureData.put("razorpay_signature",
                    request.razorpaySignature());

            boolean signatureValid = Utils.verifyPaymentSignature(
                    signatureData, razorpayKeySecret);

            if (!signatureValid) {
                throw new ConflictException(
                        "Razorpay payment signature is invalid.");
            }

            com.razorpay.Payment providerPayment =
                    razorpayClient.payments.fetch(
                            request.razorpayPaymentId());

            String providerOrderId =
                    providerPayment.get("order_id").toString();
            String providerStatus =
                    providerPayment.get("status").toString();

            if (!request.razorpayOrderId().equals(providerOrderId)) {
                throw new ConflictException(
                        "Payment does not belong to this Razorpay order.");
            }

            if (!"captured".equalsIgnoreCase(providerStatus)) {
                throw new ConflictException(
                        "Payment has not been captured yet.");
            }

            long providerAmount = Long.parseLong(
                    providerPayment.get("amount").toString());

            if (providerAmount != toPaise(payment.getAmount())) {
                throw new ConflictException(
                        "The captured payment amount does not match the booking.");
            }
        } catch (ConflictException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Unable to verify Razorpay payment.", exception);
        }

        validatePendingBooking(booking);

        List<BookingSeat> bookingSeats =
                bookingSeatRepository.findByBooking_Id(booking.getId());

        List<Long> seatIds = bookingSeats.stream()
                .map(bookingSeat -> bookingSeat.getShowSeat().getId())
                .toList();

        List<ShowSeat> seats = showSeatRepository.findAllByIdsForUpdate(
                seatIds, booking.getMovieShow().getId());

        if (seatIds.isEmpty() || seats.size() != seatIds.size()) {
            throw new ConflictException(
                    "Could not verify all reserved seats.");
        }

        LocalDateTime now = LocalDateTime.now();

        for (ShowSeat seat : seats) {
            if (seat.getStatus() != ShowSeatStatus.LOCKED
                    || seat.getLockedUntil() == null
                    || !seat.getLockedUntil().isAfter(now)
                    || !seat.getLockedUntil().equals(booking.getExpiresAt())) {
                throw new ConflictException(
                        "One or more seat reservations have expired.");
            }
        }

        for (ShowSeat seat : seats) {
            seat.setStatus(ShowSeatStatus.BOOKED);
            seat.setLockedUntil(null);
        }

        showSeatRepository.saveAll(seats);

        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setConfirmedAt(now);

        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(now);

        bookingRepository.save(booking);

        return toResponse(paymentRepository.save(payment));
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found with id: " + paymentId));

        ensureOwner(payment.getBooking());

        return toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getLatestPaymentForBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking not found with id: " + bookingId));

        ensureOwner(booking);

        List<Payment> payments =
                paymentRepository.findByBooking_IdOrderByCreatedAtDesc(
                        bookingId);

        if (payments.isEmpty()) {
            throw new ResourceNotFoundException(
                    "No payment found for booking: " + bookingId);
        }

        return toResponse(payments.get(0));
    }

    @Override
    @Transactional
    public RazorpayOrderResponse retryPayment(
            Long bookingId, String idempotencyKey) {

        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking not found with id: " + bookingId));

        ensureOwner(booking);
        validatePendingBooking(booking);

        List<Payment> payments =
                paymentRepository.findByBooking_IdOrderByCreatedAtDesc(
                        bookingId);

        if (!payments.isEmpty()) {
            Payment latest = payments.get(0);

            if (latest.getStatus() == PaymentStatus.SUCCESS) {
                throw new ConflictException(
                        "This booking has already been paid.");
            }

            if (latest.getStatus() == PaymentStatus.INITIATED
                    || latest.getStatus() == PaymentStatus.PENDING) {
                throw new ConflictException(
                        "A payment is already in progress.");
            }
        }

        var method = payments.isEmpty()
                ? com.rogerjaden.bookmyshow.entity.enums.PaymentMethod.UPI
                : payments.get(0).getPaymentMethod();

        return initiatePayment(new CreatePaymentRequest(
                bookingId, method, idempotencyKey));
    }

    @Override
    @Transactional
    public PaymentResponse refundPayment(Long paymentId, String reason) {
        throw new UnsupportedOperationException(
                "Refunds are not configured yet. Integrate Razorpay refunds "
                        + "before exposing this endpoint.");
    }

    private void validatePendingBooking(Booking booking) {
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ConflictException("Booking is not pending.");
        }

        if (booking.getExpiresAt() == null
                || !booking.getExpiresAt().isAfter(LocalDateTime.now())) {
            throw new ConflictException(
                    "Booking has expired. Please select seats again.");
        }
    }

    private void ensureOwner(Booking booking) {
        if (!booking.getUser().getId().equals(getCurrentUser().getId())) {
            throw new AccessDeniedException(
                    "You cannot access another user's booking or payment.");
        }
    }

    private User getCurrentUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || "anonymousUser".equals(authentication.getName())) {
            throw new AccessDeniedException("Authentication is required.");
        }

        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Authenticated user was not found."));
    }

    private long toPaise(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.UNNECESSARY)
                .longValueExact();
    }

    private RazorpayOrderResponse toOrderResponse(Payment payment) {
        long amountInPaise = toPaise(payment.getAmount());

        return new RazorpayOrderResponse(
                payment.getId(),
                payment.getBooking().getId(),
                payment.getProviderReference(),
                razorpayKeyId,
                payment.getAmount(),
                amountInPaise,
                "INR",
                payment.getStatus().name()
        );
    }

    private PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getBooking().getId(),
                payment.getAmount(),
                payment.getStatus(),
                payment.getPaymentMethod(),
                payment.getProviderReference(),
                payment.getFailureReason(),
                payment.getPaidAt(),
                payment.getCreatedAt(),
                payment.getUpdatedAt()
        );
    }
}
