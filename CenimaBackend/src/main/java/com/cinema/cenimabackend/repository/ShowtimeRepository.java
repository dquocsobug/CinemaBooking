package com.cinema.cenimabackend.repository;

import com.cinema.cenimabackend.entity.Showtime;
import com.cinema.cenimabackend.enums.ShowtimeStatus;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.*;

public interface ShowtimeRepository extends JpaRepository<Showtime, UUID> {

    @EntityGraph(attributePaths = {"movie", "room", "room.cinema"})
    @Query("""
        SELECT s FROM Showtime s
        WHERE s.movie.id = :movieId
          AND s.startTime >= :from
          AND s.startTime < :to
          AND s.status IN ('SCHEDULED','OPEN')
        ORDER BY s.startTime ASC
    """)
    List<Showtime> findByMovieAndDateRange(@Param("movieId") UUID movieId,
                                           @Param("from") Instant from,
                                           @Param("to") Instant to);

    @EntityGraph(attributePaths = {"movie", "room", "room.cinema"})
    @Query("""
        SELECT s FROM Showtime s
        JOIN s.room r
        JOIN r.cinema c
        WHERE c.id = :cinemaId
          AND s.startTime >= :from
          AND s.startTime < :to
          AND s.status IN ('SCHEDULED','OPEN')
        ORDER BY s.startTime ASC
    """)
    List<Showtime> findByCinemaAndDateRange(@Param("cinemaId") UUID cinemaId,
                                            @Param("from") Instant from,
                                            @Param("to") Instant to);

    // Kiểm tra trùng lịch phòng (Java-level validation trước khi DB constraint bắt)
    @Query("""
        SELECT COUNT(s) > 0 FROM Showtime s
        WHERE s.room.id = :roomId
          AND s.status <> 'CANCELLED'
          AND s.startTime < :endTime
          AND s.endTime > :startTime
    """)
    boolean existsConflict(@Param("roomId") UUID roomId,
                           @Param("startTime") Instant startTime,
                           @Param("endTime") Instant endTime);
}