package com.cinema.cenimabackend.repository;

import com.cinema.cenimabackend.entity.Cinema;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface CinemaRepository extends JpaRepository<Cinema, UUID> {
    List<Cinema> findByCityAndIsActiveTrue(String city);
    Optional<Cinema> findBySlug(String slug);
}