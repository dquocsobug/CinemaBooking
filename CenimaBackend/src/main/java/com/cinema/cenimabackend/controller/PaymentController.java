package com.cinema.cenimabackend.controller;

import com.cinema.cenimabackend.dto.request.*;
import com.cinema.cenimabackend.dto.response.*;
import com.cinema.cenimabackend.service.impl.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.util.Map;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /** Khởi tạo thanh toán — trả về paymentUrl */
    @PostMapping("/initiate")
    public ResponseEntity<ApiResponse<PaymentResponse>> initiate(
            @Valid @RequestBody PaymentRequest req,
            @AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(ApiResponse.ok(
                paymentService.initiatePayment(req, userId)));
    }

    @GetMapping("/return/momo")
    public ResponseEntity<ApiResponse<PaymentResponse>> momoReturn(
            @RequestParam Map<String, Object> params) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.handleMomoReturn(params)));
    }

    /** Callback từ VNPay */
    @GetMapping("/callback/vnpay")
    public ResponseEntity<ApiResponse<PaymentResponse>> vnpayCallback(
            @RequestParam Map<String, Object> params) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.handleVnpayCallback(params)));
    }
    /** Hoàn tiền — Admin only */
    @PostMapping("/{bookingId}/refund")
    public ResponseEntity<ApiResponse<PaymentResponse>> refund(
            @PathVariable UUID bookingId,
            @AuthenticationPrincipal UUID adminId) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.refund(bookingId, adminId)));
    }
}