package com.cinema.cenimabackend.entity;

import com.cinema.cenimabackend.enums.SeatType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "seats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seat {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "row_label", nullable = false, length = 2)
    private String rowLabel;

    @Column(name = "col_number", nullable = false)
    private Short colNumber;

    @Column(name = "seat_code", nullable = false, length = 10)
    private String seatCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "seat_type", nullable = false, length = 20)
    @Builder.Default
    private SeatType seatType = SeatType.STANDARD;

    @Column(name = "extra_fee", nullable = false, precision = 10, scale = 0)
    @Builder.Default
    private BigDecimal extraFee = BigDecimal.ZERO;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}