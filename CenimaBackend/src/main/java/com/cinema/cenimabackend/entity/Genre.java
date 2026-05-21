package com.cinema.cenimabackend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "genres")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Genre {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short id;

    @Column(nullable = false, unique = true, length = 80)
    private String name;

    @Column(nullable = false, unique = true, length = 80)
    private String slug;
}