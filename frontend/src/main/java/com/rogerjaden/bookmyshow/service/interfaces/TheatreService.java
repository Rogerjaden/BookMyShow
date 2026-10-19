package com.rogerjaden.bookmyshow.service.interfaces;

import com.rogerjaden.bookmyshow.dto.request.CreateTheatreRequest;
import com.rogerjaden.bookmyshow.dto.request.UpdateTheatreRequest;
import com.rogerjaden.bookmyshow.dto.response.PageResponse;
import com.rogerjaden.bookmyshow.dto.response.TheatreResponse;

public interface TheatreService {
    TheatreResponse createTheatre(CreateTheatreRequest request);
    TheatreResponse updateTheatre(Long theatreId, UpdateTheatreRequest request);
    TheatreResponse getTheatreById(Long theatreId);
    PageResponse<TheatreResponse> getTheatres(String city, int page, int size);
    void deactivateTheatre(Long theatreId);
}
