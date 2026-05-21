package com.cinema.cenimabackend.repository;

import com.cinema.cenimabackend.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface SeatRepository extends JpaRepository<Seat, UUID> {

    List<Seat> findByRoomIdAndIsActiveTrue(UUID roomId);

    // FIX #16: Đổi NOT IN subquery → LEFT JOIN IS NULL
    // NOT IN với subquery lớn PostgreSQL không dùng index tốt
    // LEFT JOIN + IS NULL luôn dùng được index trên booking_seats(showtime_id, seat_id)
    @Query("""
        SELECT s FROM Seat s
        LEFT JOIN BookingSeat bs
            ON bs.seat.id = s.id AND bs.showtime.id = :showtimeId
        WHERE s.room.id = :roomId
          AND s.isActive = true
          AND bs.id IS NULL
        ORDER BY s.rowLabel, s.colNumber
    """)
    List<Seat> findAvailableSeats(@Param("roomId") UUID roomId,
                                  @Param("showtimeId") UUID showtimeId);
}