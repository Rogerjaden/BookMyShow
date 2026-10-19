package com.rogerjaden.bookmyshow.service.interfaces;

import com.rogerjaden.bookmyshow.dto.request.CreateBookingRequest;
import com.rogerjaden.bookmyshow.dto.response.BookingResponse;
import com.rogerjaden.bookmyshow.dto.response.PageResponse;

public interface BookingService {
    BookingResponse createBooking(CreateBookingRequest request);
    BookingResponse getBookingById(Long bookingId);
    BookingResponse getBookingByReference(String bookingReference);
    PageResponse<BookingResponse> getMyBookings(int page, int size);
    BookingResponse cancelBooking(Long bookingId);
    BookingResponse expireBooking(Long bookingId);
}
