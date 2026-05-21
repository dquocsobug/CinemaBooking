package com.cinema.cenimabackend.service.impl;

import com.cinema.cenimabackend.entity.Ticket;
import com.cinema.cenimabackend.exception.*;
import com.cinema.cenimabackend.repository.*;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;

    /** Staff quét vé tại cổng */
    @Transactional
    public TicketScanResult scanTicket(String ticketCode, UUID staffId) {
        Ticket ticket = ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new ResourceNotFoundException("Vé không tồn tại: " + ticketCode));

        if (ticket.getIsUsed()) {
            return TicketScanResult.builder()
                    .valid(false)
                    .message("Vé đã được sử dụng lúc " + ticket.getUsedAt())
                    .ticketCode(ticketCode)
                    .build();
        }

        // Kiểm tra suất chiếu còn hợp lệ
        var showtime = ticket.getBookingSeat().getShowtime();
        if (showtime.getStartTime().isAfter(Instant.now().plusSeconds(3600))) {
            return TicketScanResult.builder()
                    .valid(false)
                    .message("Suất chiếu chưa đến giờ (bắt đầu lúc " + showtime.getStartTime() + ")")
                    .ticketCode(ticketCode)
                    .build();
        }

        ticket.setIsUsed(true);
        ticket.setUsedAt(Instant.now());
        ticketRepository.save(ticket);

        log.info("Ticket {} scanned by staff {}", ticketCode, staffId);

        var seat = ticket.getBookingSeat().getSeat();
        return TicketScanResult.builder()
                .valid(true)
                .message("Vé hợp lệ — " + seat.getSeatCode())
                .ticketCode(ticketCode)
                .seatCode(seat.getSeatCode())
                .movieTitle(showtime.getMovie().getTitle())
                .cinemaName(showtime.getRoom().getCinema().getName())
                .roomName(showtime.getRoom().getName())
                .startTime(showtime.getStartTime())
                .build();
    }

    @Transactional(readOnly = true)
    public byte[] generateQrForBooking(UUID bookingId) {
        Ticket ticket = ticketRepository.findFirstByBookingSeatBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vé QR"));

        try {
            var bookingSeat = ticket.getBookingSeat();
            var seat = bookingSeat.getSeat();
            var showtime = bookingSeat.getShowtime();

            String qrContent = String.join("|",
                    "TICKET=" + ticket.getTicketCode(),
                    "SEAT=" + seat.getSeatCode(),
                    "MOVIE=" + showtime.getMovie().getTitle(),
                    "CINEMA=" + showtime.getRoom().getCinema().getName(),
                    "ROOM=" + showtime.getRoom().getName(),
                    "START=" + showtime.getStartTime()
            );

            BitMatrix matrix = new MultiFormatWriter().encode(
                    qrContent,
                    BarcodeFormat.QR_CODE,
                    350,
                    350
            );

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", outputStream);

            return outputStream.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Không thể tạo mã QR: " + e.getMessage());
        }
    }
    @lombok.Builder
    @lombok.Data
    public static class TicketScanResult {
        private boolean valid;
        private String message;
        private String ticketCode;
        private String seatCode;
        private String movieTitle;
        private String cinemaName;
        private String roomName;
        private Instant startTime;
    }
}

