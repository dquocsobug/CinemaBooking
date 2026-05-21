package com.cinema.cenimabackend.service.payment;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PaymentVerifyResult {
    private boolean success;
    private String transactionId;
    private String message;
}