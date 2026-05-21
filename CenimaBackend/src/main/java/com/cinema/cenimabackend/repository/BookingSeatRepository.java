package com.cinema.cenimabackend.repository;

import com.cinema.cenimabackend.entity.BookingSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface BookingSeatRepository extends JpaRepository<BookingSeat, UUID> {

    @Query("SELECT bs.seat.id FROM BookingSeat bs WHERE bs.showtime.id = :showtimeId")
    Set<UUID> findBookedSeatIdsByShowtime(@Param("showtimeId") UUID showtimeId);

    boolean existsBySeatIdAndShowtimeId(UUID seatId, UUID showtimeId);
}