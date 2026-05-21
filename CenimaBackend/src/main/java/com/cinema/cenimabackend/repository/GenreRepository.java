package com.cinema.cenimabackend.repository;

import com.cinema.cenimabackend.entity.Genre;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GenreRepository extends JpaRepository<Genre, Short> {
    Optional<Genre> findBySlug(String slug);
    List<Genre> findAllByOrderByNameAsc();
}