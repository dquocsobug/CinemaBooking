package com.cinema.cenimabackend.repository;

import com.cinema.cenimabackend.entity.Movie;
import com.cinema.cenimabackend.enums.MovieStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface MovieRepository extends JpaRepository<Movie, UUID> {

    @EntityGraph(attributePaths = "genres")
    Page<Movie> findByStatus(MovieStatus status, Pageable pageable);

    @EntityGraph(attributePaths = "genres")
    Optional<Movie> findBySlug(String slug);

    // FIX #5: Thêm @EntityGraph để tránh N+1 khi map genres
    // DISTINCT bắt buộc với JOIN + pagination → dùng countQuery riêng tránh COUNT DISTINCT chậm
    @EntityGraph(attributePaths = "genres")
    @Query(value = """
        SELECT DISTINCT m FROM Movie m
        JOIN m.genres g
        WHERE g.id = :genreId AND m.status = :status
    """,
            countQuery = """
        SELECT COUNT(DISTINCT m.id) FROM Movie m
        JOIN m.genres g
        WHERE g.id = :genreId AND m.status = :status
    """)
    Page<Movie> findByGenreAndStatus(@Param("genreId") Short genreId,
                                     @Param("status") MovieStatus status,
                                     Pageable pageable);

    // FIX #6: Thêm @EntityGraph + dùng ILIKE native PostgreSQL thay LOWER+LIKE
    // ILIKE tận dụng pg_trgm GIN index đã tạo trong schema.sql
    @EntityGraph(attributePaths = "genres")
    @Query("""
        SELECT m FROM Movie m
        WHERE m.title ILIKE CONCAT('%',:q,'%')
           OR m.originalTitle ILIKE CONCAT('%',:q,'%')
    """)
    Page<Movie> search(@Param("q") String query, Pageable pageable);

    boolean existsBySlug(String slug);
}