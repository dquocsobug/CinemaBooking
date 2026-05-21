package com.cinema.cenimabackend.controller;

import com.cinema.cenimabackend.dto.response.ApiResponse;
import com.cinema.cenimabackend.service.impl.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;

    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<VoucherService.VoucherValidateResult>> validate(
            @RequestParam String code,
            @RequestParam BigDecimal orderAmount) {
        return ResponseEntity.ok(ApiResponse.ok(voucherService.validate(code, orderAmount)));
    }
}
