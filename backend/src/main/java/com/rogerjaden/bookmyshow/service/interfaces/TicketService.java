
package com.rogerjaden.bookmyshow.service.interfaces;

import com.rogerjaden.bookmyshow.dto.response.TicketResponse;

public interface TicketService {
    TicketResponse getTicket(Long bookingId);
}
