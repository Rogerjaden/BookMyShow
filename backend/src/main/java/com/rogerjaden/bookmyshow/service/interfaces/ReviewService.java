package com.rogerjaden.bookmyshow.service.interfaces;

import com.rogerjaden.bookmyshow.dto.request.CreateReviewRequest;
import com.rogerjaden.bookmyshow.dto.request.UpdateReviewRequest;
import com.rogerjaden.bookmyshow.dto.response.PageResponse;
import com.rogerjaden.bookmyshow.dto.response.ReviewResponse;

public interface ReviewService {
    ReviewResponse createReview(CreateReviewRequest request);
    ReviewResponse updateReview(Long reviewId, UpdateReviewRequest request);
    ReviewResponse getReviewById(Long reviewId);
    PageResponse<ReviewResponse> getReviewsForMovie(Long movieId, int page, int size);
    PageResponse<ReviewResponse> getMyReviews(int page, int size);
    void deleteReview(Long reviewId);
}
