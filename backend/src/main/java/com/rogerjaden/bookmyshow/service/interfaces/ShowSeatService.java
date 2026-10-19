package com.rogerjaden.bookmyshow.service.interfaces;

import com.rogerjaden.bookmyshow.dto.request.CreateShowSeatRequest;
import com.rogerjaden.bookmyshow.dto.response.ShowSeatResponse;
import java.math.BigDecimal;
import java.util.List;

public interface ShowSeatService {
    // Kept for compatibility with the original interface; uses a zero price placeholder.
    List<ShowSeatResponse> generateInventoryForShow(Long movieShowId);
    List<ShowSeatResponse> generateInventoryForShow(Long movieShowId, BigDecimal defaultPrice);
    ShowSeatResponse createShowSeat(CreateShowSeatRequest request);
    List<ShowSeatResponse> getSeatsForShow(Long movieShowId);
    List<ShowSeatResponse> getAvailableSeats(Long movieShowId);
    ShowSeatResponse updateSeatPrice(Long showSeatId, BigDecimal newPrice);
    ShowSeatResponse updateSeatPrice(Long movieShowId, Long showSeatId, BigDecimal newPrice);
}
