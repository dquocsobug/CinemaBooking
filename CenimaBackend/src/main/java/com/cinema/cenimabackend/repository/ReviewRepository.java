package com.cinema.cenimabackend.repository;

import com.cinema.cenimabackend.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    // FIX #7: Thêm @EntityGraph để tránh N+1 khi map user.fullName, user.avatarUrl
    @EntityGraph(attributePaths = {"user"})
    Page<Review> findByMovieIdAndIsApprovedTrue(UUID movieId, Pageable pageable);

    boolean existsByUserIdAndMovieId(UUID userId, UUID movieId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.movie.id = :movieId AND r.isApproved = true")
    Double averageRatingByMovie(@Param("movieId") UUID movieId);
}