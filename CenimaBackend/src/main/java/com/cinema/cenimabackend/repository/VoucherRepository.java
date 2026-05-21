package com.cinema.cenimabackend.repository;

import com.cinema.cenimabackend.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface VoucherRepository extends JpaRepository<Voucher, UUID> {

    @Query("""
        SELECT v FROM Voucher v
        WHERE v.code = :code
          AND v.isActive = true
          AND v.validFrom <= :now
          AND v.validUntil >= :now
    """)
    Optional<Voucher> findValidByCode(@Param("code") String code, @Param("now") Instant now);
}