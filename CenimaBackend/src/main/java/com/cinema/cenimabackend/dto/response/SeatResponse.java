package com.cinema.cenimabackend.dto.response;

import com.cinema.cenimabackend.enums.SeatStatus;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SeatResponse {
    private UUID id;
    private String rowLabel;
    private Short colNumber;
    private String seatCode;
    private String seatType;
    private BigDecimal extraFee;
    private SeatStatus status;      // AVAILABLE | LOCKED | BOOKED
    private String lockedByMe;      // userId nếu chính mình đang lock
}