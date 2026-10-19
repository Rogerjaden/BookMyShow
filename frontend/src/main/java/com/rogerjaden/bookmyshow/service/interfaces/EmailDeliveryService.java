package com.rogerjaden.bookmyshow.service.interfaces;

import com.rogerjaden.bookmyshow.dto.response.EmailDeliveryResponse;
import com.rogerjaden.bookmyshow.dto.response.PageResponse;

public interface EmailDeliveryService {
    EmailDeliveryResponse getDeliveryById(Long deliveryId);
    PageResponse<EmailDeliveryResponse> getMyEmailDeliveries(int page, int size);
    void queueBookingConfirmation(Long bookingId);
    void queueMovieAnnouncement(Long movieId);
    void retryFailedDelivery(Long deliveryId);
}
