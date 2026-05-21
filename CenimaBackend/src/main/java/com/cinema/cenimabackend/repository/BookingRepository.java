package com.cinema.cenimabackend.repository;

import com.cinema.cenimabackend.entity.Booking;
import com.cinema.cenimabackend.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.*;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    @EntityGraph(attributePaths = {
            "bookingSeats", "bookingSeats.seat",
            "showtime", "showtime.movie", "showtime.room", "showtime.room.cinema",
            "voucher"
    })
    Optional<Booking> findByBookingCode(String bookingCode);

    // FIX #2: Thêm @EntityGraph để tránh N+1 khi render danh sách booking của user
    // bookingSeats.seat cần để hiển thị seatCode; showtime.movie để hiển thị tên phim
    @EntityGraph(attributePaths = {
            "bookingSeats", "bookingSeats.seat",
            "showtime", "showtime.movie"
    })
    Page<Booking> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    // FIX #3: Thêm EntityGraph cho confirmBooking (cần bookingSeats + seat để broadcast WS)
    @EntityGraph(attributePaths = {
            "bookingSeats", "bookingSeats.seat",
            "showtime", "user"
    })
    Optional<Booking> findWithDetailsById(UUID id);

    // FIX #8: Bulk UPDATE thay vì loop save từng booking → 1 query thay N queries
    @Modifying
    @Query("""
        UPDATE Booking b SET b.status = 'EXPIRED', b.cancelledAt = :now
        WHERE b.status = 'PENDING' AND b.expiresAt < :now
    """)
    int bulkExpireBookings(@Param("now") Instant now);

    // Giữ lại cho Scheduler cần biết booking nào vừa expire (để log/notify)
    @Query("SELECT b.id FROM Booking b WHERE b.status = 'PENDING' AND b.expiresAt < :now")
    List<UUID> findExpiredPendingIds(@Param("now") Instant now);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.showtime.id = :showtimeId AND b.status = 'CONFIRMED'")
    long countConfirmedByShowtime(@Param("showtimeId") UUID showtimeId);

    @Query("""
    select distinct b
    from Booking b
    left join fetch b.bookingSeats bs
    left join fetch bs.seat
    left join fetch b.showtime
    left join fetch b.user
    where b.status = 'PENDING'
      and b.expiresAt < :now
""")
    List<Booking> findExpiredPendingBookingsWithDetails(@Param("now") Instant now);
}