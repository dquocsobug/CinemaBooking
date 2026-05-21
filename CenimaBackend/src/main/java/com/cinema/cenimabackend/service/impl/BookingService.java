package com.cinema.cenimabackend.service.impl;

import com.cinema.cenimabackend.dto.request.*;
import com.cinema.cenimabackend.dto.response.*;
import com.cinema.cenimabackend.entity.*;
import com.cinema.cenimabackend.enums.*;
import com.cinema.cenimabackend.exception.*;
import com.cinema.cenimabackend.repository.*;
import com.cinema.cenimabackend.service.SeatLockService;
import com.cinema.cenimabackend.websocket.SeatWebSocketPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final ShowtimeRepository showtimeRepository;
    private final SeatRepository seatRepository;
    private final VoucherRepository voucherRepository;
    private final UserRepository userRepository;
    private final SeatLockService seatLockService;
    private final SeatWebSocketPublisher wsPublisher;
    private final TicketRepository ticketRepository;

    /** BƯỚC 1: Lock ghế trong Redis */
    public List<String> lockSeats(LockSeatsRequest req, UUID userId) {
        String showtimeId = req.getShowtimeId().toString();
        List<String> seatIds = req.getSeatIds().stream()
                .map(UUID::toString).collect(Collectors.toList());

        // Validate ghế thuộc đúng phòng chiếu
        showtimeRepository.findById(req.getShowtimeId())
                .orElseThrow(() -> new ResourceNotFoundException("Suất chiếu không tồn tại"));

        List<String> locked = seatLockService.lockSeats(showtimeId, seatIds, userId.toString());

        // Broadcast cho tất cả client đang xem suất chiếu này
        for (int i = 0; i < req.getSeatIds().size(); i++) {
            UUID seatId = req.getSeatIds().get(i);
            Seat seat = seatRepository.findById(seatId).orElseThrow();
            wsPublisher.publishSeatLocked(showtimeId, seatId.toString(), seat.getSeatCode());
        }

        return locked;
    }

    /** BƯỚC 2: Tạo booking trong PostgreSQL sau khi đã lock Redis */
    @Transactional
    public BookingResponse createBooking(CreateBookingRequest req, UUID userId) {
        String showtimeId = req.getShowtimeId().toString();

        // Xác minh tất cả ghế vẫn còn đang được user giữ trên Redis
        for (UUID seatId : req.getSeatIds()) {
            if (!seatLockService.isLockedByUser(showtimeId, seatId.toString(), userId.toString())) {
                throw new SeatNotLockedException("Ghế " + seatId + " không thuộc session của bạn hoặc đã hết hạn");
            }
        }

        Showtime showtime = showtimeRepository.findById(req.getShowtimeId())
                .orElseThrow(() -> new ResourceNotFoundException("Suất chiếu không tồn tại"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));

        // Tính giá
        List<Seat> seats = seatRepository.findAllById(req.getSeatIds());
        BigDecimal totalPrice = seats.stream()
                .map(s -> showtime.getBasePrice().add(s.getExtraFee()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Áp dụng voucher
        BigDecimal discountAmount = BigDecimal.ZERO;
        Voucher voucher = null;
        if (req.getVoucherCode() != null) {
            voucher = voucherRepository.findValidByCode(req.getVoucherCode(), Instant.now())
                    .orElseThrow(() -> new InvalidVoucherException("Voucher không hợp lệ hoặc đã hết hạn"));

            if (totalPrice.compareTo(voucher.getMinOrderValue()) < 0)
                throw new InvalidVoucherException("Đơn hàng chưa đạt giá trị tối thiểu để dùng voucher");

            if (voucher.getDiscountType() == DiscountType.PERCENT) {
                discountAmount = totalPrice.multiply(voucher.getDiscountValue())
                        .divide(BigDecimal.valueOf(100));
                if (voucher.getMaxDiscount() != null)
                    discountAmount = discountAmount.min(voucher.getMaxDiscount());
            } else {
                discountAmount = voucher.getDiscountValue().min(totalPrice);
            }
        }

        BigDecimal finalPrice = totalPrice.subtract(discountAmount);

        // Tạo Booking
        Booking booking = Booking.builder()
                .user(user)
                .showtime(showtime)
                .voucher(voucher)
                .bookingCode(generateBookingCode())
                .totalPrice(totalPrice)
                .discountAmount(discountAmount)
                .finalPrice(finalPrice)
                .expiresAt(Instant.now().plusSeconds(300))
                .build();

        // Tạo BookingSeats — UNIQUE(seat_id, showtime_id) bắt duplicate ở DB level
        for (Seat seat : seats) {
            BookingSeat bs = BookingSeat.builder()
                    .booking(booking)
                    .seat(seat)
                    .showtime(showtime)
                    .unitPrice(showtime.getBasePrice().add(seat.getExtraFee()))
                    .build();
            booking.getBookingSeats().add(bs);
        }

        try {
            bookingRepository.save(booking);
        } catch (Exception e) {
            // UNIQUE violation → ghế đã được đặt bởi luồng khác
            throw new SeatAlreadyLockedException("Một hoặc nhiều ghế đã được đặt. Vui lòng chọn lại.");
        }

        // Cập nhật voucher used_count
        if (voucher != null) {
            voucher.setUsedCount(voucher.getUsedCount() + 1);
            voucherRepository.save(voucher);
        }

        log.info("Booking created: {} for user {}", booking.getBookingCode(), userId);
        return toResponse(booking);
    }

    /** BƯỚC 3: Xác nhận sau thanh toán thành công */
    @Transactional
    public BookingResponse confirmBooking(UUID bookingId, String transactionId, UUID userId) {
        // FIX #3: Dùng findWithDetailsById (có @EntityGraph bookingSeats+seat+showtime)
        // thay vì findById bình thường → tránh lazy load từng seat một khi broadcast WS
        Booking booking = bookingRepository.findWithDetailsById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking không tồn tại"));

        if (!booking.getUser().getId().equals(userId))
            throw new ForbiddenException("Không có quyền truy cập booking này");

        if (booking.getStatus() != BookingStatus.PENDING)
            throw new InvalidStateException("Booking không ở trạng thái PENDING");

        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setConfirmedAt(Instant.now());
        bookingRepository.save(booking);

        // Giải phóng Redis lock → mark BOOKED
        List<String> seatIds = booking.getBookingSeats().stream()
                .map(bs -> bs.getSeat().getId().toString())
                .collect(Collectors.toList());
        seatLockService.markSeatsBooked(
                booking.getShowtime().getId().toString(), seatIds, userId.toString());

        // Broadcast SEAT_BOOKED — bookingSeats.seat đã được load sẵn bởi EntityGraph, không lazy
        for (BookingSeat bs : booking.getBookingSeats()) {
            wsPublisher.publishSeatBooked(
                    booking.getShowtime().getId().toString(),
                    bs.getSeat().getId().toString(),
                    bs.getSeat().getSeatCode());
        }

        // Tạo Tickets
        for (BookingSeat bs : booking.getBookingSeats()) {
            boolean exists = ticketRepository.existsByBookingSeatId(bs.getId());

            if (!exists) {
                Ticket ticket = Ticket.builder()
                        .bookingSeat(bs)
                        .ticketCode(generateTicketCode())
                        .build();

                ticketRepository.save(ticket);
            }
        }

        return toResponse(booking);
    }

    @Transactional(readOnly = true)
    public PageResponse<BookingResponse> getUserBookings(UUID userId, Pageable pageable) {
        return PageResponse.of(
                bookingRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                        .map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public BookingResponse getByCode(String code, UUID userId) {
        Booking booking = bookingRepository.findByBookingCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Booking không tồn tại"));
        if (!booking.getUser().getId().equals(userId))
            throw new ForbiddenException("Không có quyền truy cập");
        return toResponse(booking);
    }

    /** Scheduled job: hủy booking hết hạn (chạy mỗi 1 phút) */
    @Transactional
    public void expireStaleBookings() {
        Instant now = Instant.now();

        List<Booking> expiredBookings = bookingRepository.findExpiredPendingBookingsWithDetails(now);

        if (expiredBookings.isEmpty()) {
            return;
        }

        for (Booking booking : expiredBookings) {
            List<String> seatIds = booking.getBookingSeats().stream()
                    .map(bs -> bs.getSeat().getId().toString())
                    .collect(Collectors.toList());

            String showtimeId = booking.getShowtime().getId().toString();
            String userId = booking.getUser().getId().toString();

            seatLockService.releaseSeats(showtimeId, seatIds, null);

            for (BookingSeat bs : booking.getBookingSeats()) {
                wsPublisher.publishSeatReleased(
                        showtimeId,
                        bs.getSeat().getId().toString()
                );
            }

            booking.setStatus(BookingStatus.EXPIRED);
            booking.setCancelledAt(now);

            log.info("Expired booking {} and released {} seats",
                    booking.getBookingCode(),
                    seatIds.size());
        }

        bookingRepository.saveAll(expiredBookings);
    }

    // FIX #13: bookingCode dùng UUID prefix để đảm bảo unique kể cả concurrent requests
    // "CB" + System.currentTimeMillis() có thể trùng nếu 2 request đến cùng millisecond
    private String generateBookingCode() {
        return "CB" + UUID.randomUUID().toString()
                .replace("-", "")
                .substring(0, 10)
                .toUpperCase();
    }

    private String generateTicketCode() {
        return "TK" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }

    private BookingResponse toResponse(Booking b) {
        List<SeatResponse> seats = b.getBookingSeats().stream()
                .map(bs -> SeatResponse.builder()
                        .id(bs.getSeat().getId())
                        .rowLabel(bs.getSeat().getRowLabel())
                        .colNumber(bs.getSeat().getColNumber())
                        .seatCode(bs.getSeat().getSeatCode())
                        .seatType(bs.getSeat().getSeatType().name())
                        .extraFee(bs.getSeat().getExtraFee())
                        .status(SeatStatus.BOOKED)
                        .build())
                .collect(Collectors.toList());

        return BookingResponse.builder()
                .id(b.getId())
                .bookingCode(b.getBookingCode())
                .status(b.getStatus().name())
                .seats(seats)
                .totalPrice(b.getTotalPrice())
                .discountAmount(b.getDiscountAmount())
                .finalPrice(b.getFinalPrice())
                .voucherCode(b.getVoucher() != null ? b.getVoucher().getCode() : null)
                .expiresAt(b.getExpiresAt())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
