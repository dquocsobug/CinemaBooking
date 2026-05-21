package com.cinema.cenimabackend.controller;

import com.cinema.cenimabackend.dto.response.ApiResponse;
import com.cinema.cenimabackend.service.impl.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    /** User tải QR vé của booking đã thanh toán */
    @GetMapping("/tickets/download/{bookingId}")
    @PreAuthorize("hasAnyRole('USER','STAFF','ADMIN')")
    public ResponseEntity<byte[]> downloadTicketQr(
            @PathVariable UUID bookingId,
            @AuthenticationPrincipal UUID userId
    ) {
        byte[] qr = ticketService.generateQrForBooking(bookingId);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=ticket-" + bookingId + ".png"
                )
                .contentType(MediaType.IMAGE_PNG)
                .body(qr);
    }
    @GetMapping("/tickets/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Ticket controller OK");
    }

    /** Staff quét vé tại cổng */
    @PostMapping("/staff/tickets/scan")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<ApiResponse<TicketService.TicketScanResult>> scan(
            @RequestParam String code,
            @AuthenticationPrincipal UUID staffId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(ticketService.scanTicket(code, staffId)));
    }
}