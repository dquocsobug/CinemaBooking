package com.cinema.cenimabackend.service.payment;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PaymentInitResult {
    private String paymentUrl;      // URL redirect sang cổng thanh toán
    private String transactionRef;  // mã tham chiếu nội bộ
}