package com.cinema.cenimabackend.repository;

import com.cinema.cenimabackend.entity.Role;
import com.cinema.cenimabackend.enums.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Short> {
    Optional<Role> findByName(RoleName name);
}
