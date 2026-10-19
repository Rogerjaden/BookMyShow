package com.rogerjaden.bookmyshow.service.interfaces;

import com.rogerjaden.bookmyshow.dto.request.CreateScreenRequest;
import com.rogerjaden.bookmyshow.dto.response.ScreenResponse;

import java.util.List;

public interface ScreenService {
    ScreenResponse createScreen(CreateScreenRequest request);
    ScreenResponse updateScreen(Long screenId, CreateScreenRequest request);
    ScreenResponse getScreenById(Long screenId);
    List<ScreenResponse> getScreensByTheatre(Long theatreId);
    void deactivateScreen(Long screenId);
}
