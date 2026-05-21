package com.cinema.cenimabackend.service.impl;

import com.cinema.cenimabackend.dto.response.ApiResponse;
import com.cinema.cenimabackend.entity.Voucher;
import com.cinema.cenimabackend.exception.*;
import com.cinema.cenimabackend.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class VoucherService {

    private final VoucherRepository voucherRepository;

    @Transactional(readOnly = true)
    public VoucherValidateResult validate(String code, BigDecimal orderAmount) {
        Voucher voucher = voucherRepository.findValidByCode(code, Instant.now())
                .orElseThrow(() -> new InvalidVoucherException("Mã giảm giá không hợp lệ hoặc đã hết hạn"));

        if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit())
            throw new InvalidVoucherException("Mã giảm giá đã hết lượt sử dụng");

        if (orderAmount.compareTo(voucher.getMinOrderValue()) < 0)
            throw new InvalidVoucherException(
                    "Đơn hàng tối thiểu " + voucher.getMinOrderValue() + "đ để dùng voucher này");

        BigDecimal discount;
        if (voucher.getDiscountType().name().equals("PERCENT")) {
            discount = orderAmount.multiply(voucher.getDiscountValue())
                    .divide(BigDecimal.valueOf(100));
            if (voucher.getMaxDiscount() != null)
                discount = discount.min(voucher.getMaxDiscount());
        } else {
            discount = voucher.getDiscountValue().min(orderAmount);
        }

        return new VoucherValidateResult(voucher.getCode(), discount,
                voucher.getDiscountType().name(), voucher.getDiscountValue());
    }

    public record VoucherValidateResult(
            String code,
            BigDecimal discountAmount,
            String discountType,
            BigDecimal discountValue) {}
}