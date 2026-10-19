package com.rogerjaden.bookmyshow.service.interfaces;

import com.rogerjaden.bookmyshow.dto.request.CreateMovieShowRequest;
import com.rogerjaden.bookmyshow.dto.request.UpdateMovieShowRequest;
import com.rogerjaden.bookmyshow.dto.response.MovieShowResponse;
import com.rogerjaden.bookmyshow.dto.response.PageResponse;

import java.time.LocalDate;

public interface MovieShowService {
    MovieShowResponse createShow(CreateMovieShowRequest request);
    MovieShowResponse updateShow(Long showId, UpdateMovieShowRequest request);
    MovieShowResponse getShowById(Long showId);
    PageResponse<MovieShowResponse> findShows(Long movieId, String city, LocalDate date,
                                               String language, String format,
                                               int page, int size, String sortBy, String direction);
    void cancelShow(Long showId);
}
