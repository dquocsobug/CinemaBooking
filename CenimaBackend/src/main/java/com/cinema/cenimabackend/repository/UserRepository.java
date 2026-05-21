package com.cinema.cenimabackend.repository;

import com.cinema.cenimabackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.*;

public interface UserRepository extends JpaRepository<User, UUID> {
    @EntityGraph(attributePaths = "roles")
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);

    @EntityGraph(attributePaths = "roles")
    Optional<User> findById(UUID id);
}