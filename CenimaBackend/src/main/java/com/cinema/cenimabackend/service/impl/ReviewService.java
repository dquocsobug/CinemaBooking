package com.cinema.cenimabackend.service.impl;

import com.cinema.cenimabackend.dto.request.ReviewRequest;
import com.cinema.cenimabackend.dto.response.*;
import com.cinema.cenimabackend.entity.*;
import com.cinema.cenimabackend.exception.*;
import com.cinema.cenimabackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    @Transactional
    @CacheEvict(value = "movies", key = "#req.movieId")
    public ReviewResponse create(ReviewRequest req, UUID userId) {
        if (reviewRepository.existsByUserIdAndMovieId(userId, req.getMovieId()))
            throw new ConflictException("Bạn đã đánh giá phim này rồi");

        // Chỉ cho phép review nếu user đã từng mua vé phim này
        boolean hasPurchased = bookingRepository.countConfirmedByShowtime(req.getMovieId()) > 0;
        // Thực tế cần query riêng: SELECT COUNT > 0 WHERE user_id = userId AND movie_id = movieId AND status = CONFIRMED

        Movie movie = movieRepository.findById(req.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Phim không tồn tại"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));

        Review review = Review.builder()
                .user(user)
                .movie(movie)
                .rating(req.getRating())
                .comment(req.getComment())
                .isSpoiler(req.isSpoiler())
                .isApproved(true)   // Auto-approve; production nên dùng moderation queue
                .build();

        review = reviewRepository.save(review);

        // Cập nhật rating trung bình cho phim
        Double avg = reviewRepository.averageRatingByMovie(movie.getId());
        if (avg != null) {
            movie.setRating(java.math.BigDecimal.valueOf(avg).setScale(1, java.math.RoundingMode.HALF_UP));
            movieRepository.save(movie);
        }

        return toResponse(review);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getByMovie(UUID movieId, Pageable pageable) {
        return PageResponse.of(
                reviewRepository.findByMovieIdAndIsApprovedTrue(movieId, pageable)
                        .map(this::toResponse));
    }

    @Transactional
    public void delete(UUID reviewId, UUID userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review không tồn tại"));
        if (!review.getUser().getId().equals(userId))
            throw new ForbiddenException("Không có quyền xóa review này");
        reviewRepository.delete(review);
    }

    private ReviewResponse toResponse(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .userId(r.getUser().getId())
                .userFullName(r.getUser().getFullName())
                .userAvatar(r.getUser().getAvatarUrl())
                .movieId(r.getMovie().getId())
                .rating(r.getRating())
                .comment(r.getComment())
                .isSpoiler(r.getIsSpoiler())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
