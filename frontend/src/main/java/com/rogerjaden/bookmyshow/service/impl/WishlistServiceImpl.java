package com.rogerjaden.bookmyshow.service.impl;

import com.rogerjaden.bookmyshow.dto.response.PageResponse;
import com.rogerjaden.bookmyshow.dto.response.WishlistResponse;
import com.rogerjaden.bookmyshow.entity.Movie;
import com.rogerjaden.bookmyshow.entity.User;
import com.rogerjaden.bookmyshow.entity.Wishlist;
import com.rogerjaden.bookmyshow.entity.enums.MovieStatus;
import com.rogerjaden.bookmyshow.entity.security.UserPrincipal;
import com.rogerjaden.bookmyshow.exception.ConflictException;
import com.rogerjaden.bookmyshow.exception.ResourceNotFoundException;
import com.rogerjaden.bookmyshow.repository.MovieRepository;
import com.rogerjaden.bookmyshow.repository.UserRepository;
import com.rogerjaden.bookmyshow.repository.WishlistRepository;
import com.rogerjaden.bookmyshow.service.interfaces.WishlistService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class WishlistServiceImpl implements WishlistService {
    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final MovieRepository movieRepository;

    public WishlistServiceImpl(WishlistRepository wishlistRepository,
                               UserRepository userRepository,
                               MovieRepository movieRepository) {
        this.wishlistRepository = wishlistRepository;
        this.userRepository = userRepository;
        this.movieRepository = movieRepository;
    }

    @Override
    public WishlistResponse addMovie(Long movieId) {
        User user = currentUser();
        if (movieId == null || movieId <= 0) {
            throw new IllegalArgumentException("movieId must be a positive number.");
        }
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id: " + movieId));
        if (movie.getStatus() == MovieStatus.INACTIVE) {
            throw new ResourceNotFoundException("Movie not found with id: " + movieId);
        }
        if (wishlistRepository.existsByUser_IdAndMovie_Id(user.getId(), movieId)) {
            throw new ConflictException("This movie is already in your wishlist.");
        }
        Wishlist wishlist = new Wishlist();
        wishlist.setUser(user);
        wishlist.setMovie(movie);
        return toResponse(wishlistRepository.save(wishlist));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<WishlistResponse> getMyWishlist(int page, int size) {
        if (page < 0) throw new IllegalArgumentException("page must be zero or greater.");
        if (size < 1 || size > 100) throw new IllegalArgumentException("size must be between 1 and 100.");
        Page<Wishlist> result = wishlistRepository.findByUser_IdOrderByCreatedAtDesc(
                currentUser().getId(), PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        List<WishlistResponse> content = result.getContent().stream().map(this::toResponse).toList();
        return new PageResponse<>(content, result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    @Override
    public void removeMovie(Long movieId) {
        User user = currentUser();
        Wishlist wishlist = wishlistRepository.findByUser_IdAndMovie_Id(user.getId(), movieId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie is not in your wishlist."));
        wishlistRepository.delete(wishlist);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isMovieInMyWishlist(Long movieId) {
        return wishlistRepository.existsByUser_IdAndMovie_Id(currentUser().getId(), movieId);
    }

    private User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new IllegalStateException("Authenticated user could not be resolved.");
        }
        return userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }

    private WishlistResponse toResponse(Wishlist wishlist) {
        return new WishlistResponse(wishlist.getId(), wishlist.getUser().getId(),
                wishlist.getMovie().getId(), wishlist.getMovie().getTitle(),
                wishlist.getMovie().getPosterUrl(), wishlist.getCreatedAt());
    }
}
