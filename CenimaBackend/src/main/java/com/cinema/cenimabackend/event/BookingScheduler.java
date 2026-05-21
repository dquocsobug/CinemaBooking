package com.cinema.cenimabackend.event;

import com.cinema.cenimabackend.service.impl.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingScheduler {

    private final BookingService bookingService;

    /**
     * Chạy mỗi 60 giây: tìm và hủy booking PENDING quá hạn.
     * Đây là fallback khi Redis TTL event bị mất hoặc app restart.
     */
    @Scheduled(fixedDelay = 60_000)
    public void expireStaleBookings() {
        log.debug("Running booking expiry job...");
        bookingService.expireStaleBookings();
    }

    /**
     * Mỗi ngày 2:00 sáng: chuyển showtime đã qua sang COMPLETED.
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void completeExpiredShowtimes() {
        log.info("Completing past showtimes...");
        // showtimeService.completePastShowtimes();
    }
}