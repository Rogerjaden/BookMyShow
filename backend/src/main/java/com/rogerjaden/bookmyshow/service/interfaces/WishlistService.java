package com.rogerjaden.bookmyshow.service.interfaces;

import com.rogerjaden.bookmyshow.dto.response.PageResponse;
import com.rogerjaden.bookmyshow.dto.response.WishlistResponse;

public interface WishlistService {
    WishlistResponse addMovie(Long movieId);
    PageResponse<WishlistResponse> getMyWishlist(int page, int size);
    void removeMovie(Long movieId);
    boolean isMovieInMyWishlist(Long movieId);
}
