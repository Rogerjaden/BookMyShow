package com.rogerjaden.bookmyshow.service.impl;

import com.rogerjaden.bookmyshow.dto.request.CreateReviewRequest;
import com.rogerjaden.bookmyshow.dto.request.UpdateReviewRequest;
import com.rogerjaden.bookmyshow.dto.response.PageResponse;
import com.rogerjaden.bookmyshow.dto.response.ReviewResponse;
import com.rogerjaden.bookmyshow.entity.Movie;
import com.rogerjaden.bookmyshow.entity.Review;
import com.rogerjaden.bookmyshow.entity.User;
import com.rogerjaden.bookmyshow.entity.enums.MovieStatus;
import com.rogerjaden.bookmyshow.exception.ConflictException;
import com.rogerjaden.bookmyshow.exception.ResourceNotFoundException;
import com.rogerjaden.bookmyshow.repository.MovieRepository;
import com.rogerjaden.bookmyshow.repository.ReviewRepository;
import com.rogerjaden.bookmyshow.repository.UserRepository;
import com.rogerjaden.bookmyshow.service.interfaces.ReviewService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ReviewServiceImpl implements ReviewService {
    private final ReviewRepository reviewRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;

    public ReviewServiceImpl(
            ReviewRepository reviewRepository,
            MovieRepository movieRepository,
            UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.movieRepository = movieRepository;
        this.userRepository = userRepository;
    }

    @Override
    public ReviewResponse createReview(CreateReviewRequest request) {
        User user = getCurrentUser();
        Movie movie = findMovie(request.movieId());

        if (movie.getStatus() == MovieStatus.INACTIVE) {
            throw new ConflictException("Reviews cannot be added to an inactive movie.");
        }

        if (reviewRepository.existsByUser_IdAndMovie_Id(user.getId(), movie.getId())) {
            throw new ConflictException("You have already reviewed this movie.");
        }

        Review review = new Review();
        review.setUser(user);
        review.setMovie(movie);
        review.setRating(request.rating());
        review.setComment(normalizeComment(request.comment()));

        return toResponse(reviewRepository.save(review));
    }

    @Override
    public ReviewResponse updateReview(Long reviewId, UpdateReviewRequest request) {
        Review review = findReview(reviewId);
        ensureOwner(review);
        review.setRating(request.rating());
        review.setComment(normalizeComment(request.comment()));
        return toResponse(reviewRepository.save(review));
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewResponse getReviewById(Long reviewId) {
        return toResponse(findReview(reviewId));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getReviewsForMovie(Long movieId, int page, int size) {
        findMovie(movieId);
        Pageable pageable = pageable(page, size);
        return toPageResponse(reviewRepository.findByMovie_IdOrderByCreatedAtDesc(movieId, pageable));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getMyReviews(int page, int size) {
        User user = getCurrentUser();
        return toPageResponse(reviewRepository.findByUser_IdOrderByCreatedAtDesc(
                user.getId(), pageable(page, size)));
    }

    @Override
    public void deleteReview(Long reviewId) {
        Review review = findReview(reviewId);
        ensureOwner(review);
        reviewRepository.delete(review);
    }

    private Movie findMovie(Long movieId) {
        if (movieId == null || movieId <= 0) {
            throw new IllegalArgumentException("movieId must be a positive number.");
        }
        return movieRepository.findById(movieId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Movie not found with id: " + movieId));
    }

    private Review findReview(Long reviewId) {
        if (reviewId == null || reviewId <= 0) {
            throw new IllegalArgumentException("reviewId must be a positive number.");
        }
        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Review not found with id: " + reviewId));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName() == null
                || "anonymousUser".equals(authentication.getName())) {
            throw new AccessDeniedException("Authentication is required.");
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Authenticated user was not found."));
    }

    private void ensureOwner(Review review) {
        if (!review.getUser().getId().equals(getCurrentUser().getId())) {
            throw new AccessDeniedException("You can only modify your own reviews.");
        }
    }

    private Pageable pageable(int page, int size) {
        if (page < 0) {
            throw new IllegalArgumentException("page must be zero or greater.");
        }
        if (size < 1 || size > 100) {
            throw new IllegalArgumentException("size must be between 1 and 100.");
        }
        return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    private PageResponse<ReviewResponse> toPageResponse(Page<Review> result) {
        return new PageResponse<>(
                result.getContent().stream().map(this::toResponse).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.isLast());
    }

    private ReviewResponse toResponse(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getUser().getId(),
                review.getUser().getName(),
                review.getMovie().getId(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getUpdatedAt());
    }

    private String normalizeComment(String comment) {
        if (comment == null) {
            return null;
        }
        String normalized = comment.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
