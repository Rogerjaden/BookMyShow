package com.rogerjaden.bookmyshow.service.interfaces;

import com.rogerjaden.bookmyshow.dto.request.CreateSeatRequest;
import com.rogerjaden.bookmyshow.dto.response.SeatResponse;

import java.util.List;

public interface SeatService {
    SeatResponse createSeat(CreateSeatRequest request);

    List<SeatResponse> createSeats(Long screenId, List<CreateSeatRequest> requests);

    SeatResponse updateSeat(Long screenId, Long seatId, CreateSeatRequest request);

    SeatResponse getSeatById(Long screenId, Long seatId);

    List<SeatResponse> getSeatsByScreen(Long screenId);

    void deactivateSeat(Long screenId, Long seatId);
}
