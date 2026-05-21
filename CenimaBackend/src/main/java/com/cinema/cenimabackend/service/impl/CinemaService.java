package com.cinema.cenimabackend.service.impl;

import com.cinema.cenimabackend.entity.Cinema;
import com.cinema.cenimabackend.exception.ResourceNotFoundException;
import com.cinema.cenimabackend.repository.CinemaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class CinemaService {

    private final CinemaRepository cinemaRepository;

    @Cacheable("cinemas")
    @Transactional(readOnly = true)
    public List<Cinema> getByCity(String city) {
        return cinemaRepository.findByCityAndIsActiveTrue(city);
    }

    @Transactional(readOnly = true)
    public List<Cinema> getAll() {
        return cinemaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Cinema getById(UUID id) {
        return cinemaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rạp không tồn tại"));
    }
}
