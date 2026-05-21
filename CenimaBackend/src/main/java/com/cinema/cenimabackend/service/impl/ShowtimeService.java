package com.cinema.cenimabackend.service.impl;

import com.cinema.cenimabackend.dto.request.CreateShowtimeRequest;
import com.cinema.cenimabackend.dto.response.*;
import com.cinema.cenimabackend.entity.*;
import com.cinema.cenimabackend.enums.*;
import com.cinema.cenimabackend.exception.*;
import com.cinema.cenimabackend.repository.*;
import com.cinema.cenimabackend.service.SeatLockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShowtimeService {

    private final ShowtimeRepository showtimeRepository;
    private final MovieRepository movieRepository;
    private final RoomRepository roomRepository;
    private final SeatRepository seatRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final SeatLockService seatLockService;

    @Transactional(readOnly = true)
    public List<ShowtimeResponse> getByMovieAndDate(UUID movieId, Instant date) {
        Instant from = date.truncatedTo(ChronoUnit.DAYS);
        Instant to = from.plus(1, ChronoUnit.DAYS);

        return showtimeRepository.findByMovieAndDateRange(movieId, from, to)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SeatMapResponse getSeatMap(UUID showtimeId, String currentUserId) {
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new ResourceNotFoundException("Suất chiếu không tồn tại"));

        List<Seat> allSeats = seatRepository.findByRoomIdAndIsActiveTrue(showtime.getRoom().getId());
        Set<UUID> bookedIds = bookingSeatRepository.findBookedSeatIdsByShowtime(showtimeId);
        Set<String> lockedIds = seatLockService.getLockedSeatIds(showtimeId.toString());

        int available = 0;
        int locked = 0;
        int booked = 0;

        List<SeatResponse> seats = new ArrayList<>();

        for (Seat seat : allSeats) {
            String seatIdStr = seat.getId().toString();
            SeatStatus status;

            if (bookedIds.contains(seat.getId())) {
                status = SeatStatus.BOOKED;
                booked++;
            } else if (lockedIds.contains(seatIdStr)) {
                status = SeatStatus.LOCKED;
                locked++;
            } else {
                status = SeatStatus.AVAILABLE;
                available++;
            }

            String lockedByMe = null;

            if (status == SeatStatus.LOCKED
                    && currentUserId != null
                    && seatLockService.isLockedByUser(showtimeId.toString(), seatIdStr, currentUserId)) {
                lockedByMe = currentUserId;
            }

            seats.add(SeatResponse.builder()
                    .id(seat.getId())
                    .rowLabel(seat.getRowLabel())
                    .colNumber(seat.getColNumber())
                    .seatCode(seat.getSeatCode())
                    .seatType(seat.getSeatType().name())
                    .extraFee(seat.getExtraFee())
                    .status(status)
                    .lockedByMe(lockedByMe)
                    .build());
        }

        return SeatMapResponse.builder()
                .showtimeId(showtimeId.toString())
                .seats(seats)
                .totalAvailable(available)
                .totalLocked(locked)
                .totalBooked(booked)
                .build();
    }

    @Transactional
    public ShowtimeResponse create(CreateShowtimeRequest req) {
        Movie movie = movieRepository.findById(req.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Phim không tồn tại"));

        Room room = roomRepository.findById(req.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Phòng chiếu không tồn tại"));

        Instant endTime = req.getStartTime()
                .plusSeconds(movie.getDurationMin() * 60L + 1800);

        if (showtimeRepository.existsConflict(req.getRoomId(), req.getStartTime(), endTime)) {
            throw new ConflictException("Phòng chiếu đã có lịch trong khung giờ này");
        }

        Showtime showtime = Showtime.builder()
                .movie(movie)
                .room(room)
                .startTime(req.getStartTime())
                .endTime(endTime)
                .basePrice(req.getBasePrice())
                .language(req.getLanguage())
                .subtitleLang(req.getSubtitleLang())
                .status(ShowtimeStatus.SCHEDULED)
                .build();

        return toResponse(showtimeRepository.save(showtime));
    }

    public ShowtimeResponse toResponse(Showtime s) {
        return ShowtimeResponse.builder()
                .id(s.getId())
                .movieId(s.getMovie().getId())
                .movieTitle(s.getMovie().getTitle())
                .moviePoster(s.getMovie().getPosterUrl())
                .cinemaId(s.getRoom().getCinema().getId())
                .cinemaName(s.getRoom().getCinema().getName())
                .roomId(s.getRoom().getId())
                .roomName(s.getRoom().getName())
                .roomType(s.getRoom().getRoomType().name())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .basePrice(s.getBasePrice())
                .language(s.getLanguage())
                .subtitleLang(s.getSubtitleLang())
                .status(s.getStatus().name())
                .build();
    }
}