package com.cinema.cenimabackend.service.impl;

import com.cinema.cenimabackend.dto.request.*;
import com.cinema.cenimabackend.dto.response.*;
import com.cinema.cenimabackend.entity.*;
import com.cinema.cenimabackend.enums.*;
import com.cinema.cenimabackend.exception.*;
import com.cinema.cenimabackend.repository.*;
import com.cinema.cenimabackend.service.payment.*;
import com.cinema.cenimabackend.util.RedisKeyConstants;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final BookingService bookingService;
    private final List<PaymentGateway> gateways;
    private final StringRedisTemplate redis;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /** Khởi tạo thanh toán — trả về URL redirect */
    @Transactional
    public PaymentResponse initiatePayment(PaymentRequest req, UUID userId) {
        String rateLimitKey = RedisKeyConstants.paymentRateLimit(userId.toString());
        Long count = redis.opsForValue().increment(rateLimitKey);

        if (count != null && count == 1) {
            redis.expire(rateLimitKey, Duration.ofMinutes(1));
        }

        if (count != null && count > 5) {
            throw new RateLimitException("Quá nhiều yêu cầu thanh toán, vui lòng chờ 1 phút");
        }

        Booking booking = bookingRepository.findById(req.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking không tồn tại"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Không có quyền thanh toán booking này");
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new InvalidStateException("Booking không ở trạng thái chờ thanh toán");
        }

        if (booking.getExpiresAt() != null && booking.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidStateException("Booking đã hết hạn, vui lòng đặt lại");
        }

        Payment payment = Payment.builder()
                .booking(booking)
                .amount(booking.getFinalPrice())
                .method(req.getMethod())
                .status(PaymentStatus.PENDING)
                .build();

        paymentRepository.save(payment);

        PaymentGateway gateway = findGateway(req.getMethod());

        String returnUrl = req.getReturnUrl();

        PaymentInitResult result = gateway.initiate(
                booking.getBookingCode(),
                booking.getFinalPrice(),
                returnUrl
        );

        payment.setTransactionId(result.getTransactionRef());
        paymentRepository.save(payment);

        return PaymentResponse.builder()
                .id(payment.getId())
                .bookingId(booking.getId())
                .bookingCode(booking.getBookingCode())
                .amount(payment.getAmount())
                .method(req.getMethod().name())
                .status(PaymentStatus.PENDING.name())
                .paymentUrl(result.getPaymentUrl())
                .transactionId(result.getTransactionRef())
                .build();
    }

    /** Callback chung cho VNPay hoặc gateway nào đã convert sẵn sang PaymentCallbackRequest */
    @Transactional
    public PaymentResponse handleCallback(PaymentCallbackRequest req) {
        Payment payment = paymentRepository.findByTransactionId(req.getTransactionId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch"));

        if (payment.getStatus() != PaymentStatus.PENDING) {
            log.warn("Payment {} already processed with status {}", payment.getId(), payment.getStatus());
            return buildResponse(payment);
        }

        PaymentGateway gateway = findGateway(payment.getMethod());
        PaymentVerifyResult result = gateway.verify(req.getRawData());

        payment.setGatewayResponse(req.getRawData());

        if (result.isSuccess()) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setPaidAt(Instant.now());
            payment.setTransactionId(result.getTransactionId());
            paymentRepository.save(payment);

            bookingService.confirmBooking(
                    payment.getBooking().getId(),
                    result.getTransactionId(),
                    payment.getBooking().getUser().getId()
            );

            log.info("Payment SUCCESS for booking {}", payment.getBooking().getBookingCode());
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);

            log.warn(
                    "Payment FAILED for booking {}: {}",
                    payment.getBooking().getBookingCode(),
                    result.getMessage()
            );
        }

        return buildResponse(payment);
    }

    /** Callback raw JSON từ MoMo */
    @Transactional
    public PaymentResponse handleMomoReturn(Map<String, Object> params) {
        try {
            log.info("===== MOMO RETURN PARAMS ===== {}", params);

            PaymentVerifyResult result = findGateway(PaymentMethod.MOMO).verify(params);

            log.info("MoMo verify result: success={}, transactionId={}, message={}",
                    result.isSuccess(),
                    result.getTransactionId(),
                    result.getMessage());

            Payment payment = paymentRepository.findByTransactionId(result.getTransactionId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Không tìm thấy giao dịch MoMo: " + result.getTransactionId()
                    ));

            if (payment.getStatus() != PaymentStatus.PENDING) {
                log.warn("Payment {} already processed with status {}", payment.getId(), payment.getStatus());
                return buildResponse(payment);
            }

            payment.setGatewayResponse(params);

            if (!result.isSuccess()) {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
                return buildResponse(payment);
            }

            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setPaidAt(Instant.now());
            payment.setTransactionId(result.getTransactionId());
            paymentRepository.saveAndFlush(payment);

            Booking booking = payment.getBooking();

            log.info("Confirming booking {} after MoMo payment success", booking.getBookingCode());

            bookingService.confirmBooking(
                    booking.getId(),
                    result.getTransactionId(),
                    booking.getUser().getId()
            );

            log.info("MoMo Payment SUCCESS and booking CONFIRMED: {}", booking.getBookingCode());

            return buildResponse(payment);

        } catch (Exception e) {
            log.error("MoMo return error", e);
            throw new PaymentException("Lỗi xử lý MoMo return: " + e.getMessage());
        }
    }

    /** Hoàn tiền */
    @Transactional
    public PaymentResponse refund(UUID bookingId, UUID adminId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment không tồn tại"));

        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new InvalidStateException("Chỉ có thể hoàn tiền giao dịch đã thanh toán thành công");
        }

        payment.setStatus(PaymentStatus.REFUNDED);
        payment.setRefundedAt(Instant.now());
        paymentRepository.save(payment);

        Booking booking = payment.getBooking();
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(Instant.now());
        bookingRepository.save(booking);

        log.info("Refund processed for booking {} by admin {}", booking.getBookingCode(), adminId);

        return buildResponse(payment);
    }

    private PaymentGateway findGateway(PaymentMethod method) {
        return gateways.stream()
                .filter(g -> g.supports() == method)
                .findFirst()
                .orElseThrow(() -> new PaymentException("Phương thức thanh toán không được hỗ trợ: " + method));
    }

    private PaymentResponse buildResponse(Payment p) {
        return PaymentResponse.builder()
                .id(p.getId())
                .bookingId(p.getBooking().getId())
                .bookingCode(p.getBooking().getBookingCode())
                .amount(p.getAmount())
                .method(p.getMethod().name())
                .status(p.getStatus().name())
                .transactionId(p.getTransactionId())
                .paidAt(p.getPaidAt())
                .build();
    }
    @Transactional
    public PaymentResponse handleVnpayCallback(Map<String, Object> params) {
        try {
            PaymentVerifyResult result = findGateway(PaymentMethod.VNPAY).verify(params);

            Payment payment = paymentRepository.findByTransactionId(result.getTransactionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch VNPay"));

            if (payment.getStatus() != PaymentStatus.PENDING) {
                log.warn("Payment {} already processed with status {}", payment.getId(), payment.getStatus());
                return buildResponse(payment);
            }

            payment.setGatewayResponse(params);

            if (result.isSuccess()) {
                payment.setStatus(PaymentStatus.SUCCESS);
                payment.setPaidAt(Instant.now());
                payment.setTransactionId(result.getTransactionId());
                paymentRepository.save(payment);

                bookingService.confirmBooking(
                        payment.getBooking().getId(),
                        result.getTransactionId(),
                        payment.getBooking().getUser().getId()
                );

                log.info("VNPay Payment SUCCESS for booking {}", payment.getBooking().getBookingCode());
            } else {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);

                log.warn(
                        "VNPay Payment FAILED for booking {}: {}",
                        payment.getBooking().getBookingCode(),
                        result.getMessage()
                );
            }

            return buildResponse(payment);

        } catch (Exception e) {
            log.error("VNPay callback error", e);
            throw new PaymentException("Lỗi xử lý callback VNPay: " + e.getMessage());
        }
    }
}