package com.cinema.cenimabackend.repository;

import com.cinema.cenimabackend.entity.Ticket;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    // FIX #4: Ticket → BookingSeat → Seat + Showtime → Movie + Room → Cinema là chuỗi lazy 5 cấp
    // EntityGraph load tất cả trong 1 JOIN query, tránh 5+ queries riêng lẻ
    @EntityGraph(attributePaths = {
            "bookingSeat",
            "bookingSeat.seat",
            "bookingSeat.showtime",
            "bookingSeat.showtime.movie",
            "bookingSeat.showtime.room",
            "bookingSeat.showtime.room.cinema"
    })
    Optional<Ticket> findByTicketCode(String ticketCode);
    boolean existsByBookingSeatId(UUID bookingSeatId);
    @EntityGraph(attributePaths = {
            "bookingSeat",
            "bookingSeat.seat",
            "bookingSeat.showtime",
            "bookingSeat.showtime.movie",
            "bookingSeat.showtime.room",
            "bookingSeat.showtime.room.cinema"
    })
    Optional<Ticket> findFirstByBookingSeatBookingId(UUID bookingId);
}
