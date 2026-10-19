package com.rogerjaden.bookmyshow.service.interfaces;

import com.rogerjaden.bookmyshow.dto.request.CreateMovieRequest;
import com.rogerjaden.bookmyshow.dto.request.UpdateMovieRequest;
import com.rogerjaden.bookmyshow.dto.response.MovieResponse;
import com.rogerjaden.bookmyshow.dto.response.PageResponse;

public interface MovieService {
    MovieResponse createMovie(CreateMovieRequest request);
    MovieResponse updateMovie(Long movieId, UpdateMovieRequest request);
    MovieResponse getMovieById(Long movieId);
    PageResponse<MovieResponse> getMovies(int page, int size, String sortBy, String direction);
    PageResponse<MovieResponse> searchMovies(String query, String language, Long genreId,
                                              int page, int size, String sortBy, String direction);
    MovieResponse publishMovie(Long movieId);
    void deleteMovie(Long movieId);
}
