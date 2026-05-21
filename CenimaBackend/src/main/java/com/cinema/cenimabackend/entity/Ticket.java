package com.cinema.cenimabackend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_seat_id", nullable = false, unique = true)
    private BookingSeat bookingSeat;

    @Column(name = "ticket_code", nullable = false, unique = true, length = 30)
    private String ticketCode;

    @Column(name = "is_used", nullable = false)
    @Builder.Default
    private Boolean isUsed = false;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "issued_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant issuedAt = Instant.now();
}