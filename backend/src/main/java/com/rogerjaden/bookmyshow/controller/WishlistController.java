package com.rogerjaden.bookmyshow.controller;

import com.rogerjaden.bookmyshow.dto.request.AddWishlistRequest;
import com.rogerjaden.bookmyshow.dto.response.PageResponse;
import com.rogerjaden.bookmyshow.dto.response.WishlistResponse;
import com.rogerjaden.bookmyshow.service.interfaces.WishlistService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/wishlist")
public class WishlistController {
    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @PostMapping
    public ResponseEntity<WishlistResponse> addMovie(@Valid @RequestBody AddWishlistRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(wishlistService.addMovie(request.movieId()));
    }

    @GetMapping
    public ResponseEntity<PageResponse<WishlistResponse>> getMyWishlist(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(wishlistService.getMyWishlist(page, size));
    }

    @GetMapping("/contains/{movieId}")
    public ResponseEntity<Boolean> containsMovie(@PathVariable Long movieId) {
        return ResponseEntity.ok(wishlistService.isMovieInMyWishlist(movieId));
    }

    @DeleteMapping("/{movieId}")
    public ResponseEntity<Void> removeMovie(@PathVariable Long movieId) {
        wishlistService.removeMovie(movieId);
        return ResponseEntity.noContent().build();
    }
}
