package com.rogerjaden.bookmyshow.service.interfaces;

public interface OutboxEventService {
    void processPendingEvents(int batchSize);
    void retryFailedEvents();
}
