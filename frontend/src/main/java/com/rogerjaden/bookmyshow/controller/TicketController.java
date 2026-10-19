
package com.rogerjaden.bookmyshow.controller;

import com.rogerjaden.bookmyshow.dto.response.TicketResponse;
import com.rogerjaden.bookmyshow.service.interfaces.TicketService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<TicketResponse> getTicket(
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(
                ticketService.getTicket(bookingId));
    }
}
