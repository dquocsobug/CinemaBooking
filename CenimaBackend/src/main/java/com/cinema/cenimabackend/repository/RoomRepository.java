package com.cinema.cenimabackend.repository;

import com.cinema.cenimabackend.entity.Genre;
import com.cinema.cenimabackend.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface RoomRepository extends JpaRepository<Room, UUID> {
    List<Room> findByCinemaIdAndIsActiveTrue(UUID cinemaId);
}

