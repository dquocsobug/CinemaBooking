package com.cinema.cenimabackend.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PaymentResponse {
    private UUID id;
    private UUID bookingId;
    private String bookingCode;
    private BigDecimal amount;
    private String method;
    private String status;
    private String paymentUrl;      // redirect URL cho online payment
    private String transactionId;
    private Instant paidAt;
}