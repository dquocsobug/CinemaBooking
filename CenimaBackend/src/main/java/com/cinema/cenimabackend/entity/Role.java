package com.cinema.cenimabackend.entity;

import com.cinema.cenimabackend.enums.RoleName;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "roles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Role {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 50)
    private RoleName name;

    @Column(length = 255)
    private String description;
}