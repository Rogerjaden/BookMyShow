package com.rogerjaden.bookmyshow.service.interfaces;

import com.rogerjaden.bookmyshow.dto.request.CreateGenreRequest;
import com.rogerjaden.bookmyshow.dto.request.UpdateGenreRequest;
import com.rogerjaden.bookmyshow.dto.response.GenreResponse;

import java.util.List;

public interface GenreService {
    GenreResponse createGenre(CreateGenreRequest request);
    GenreResponse updateGenre(Long genreId, UpdateGenreRequest request);
    GenreResponse getGenreById(Long genreId);
    List<GenreResponse> getAllGenres();
    void deleteGenre(Long genreId);
    void assignGenresToMovie(Long movieId, List<Long> genreIds);
}
