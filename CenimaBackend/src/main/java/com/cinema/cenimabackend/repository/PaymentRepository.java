package com.cinema.cenimabackend.repository;

import com.cinema.cenimabackend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByBookingId(UUID bookingId);
    Optional<Payment> findByTransactionId(String transactionId);
}