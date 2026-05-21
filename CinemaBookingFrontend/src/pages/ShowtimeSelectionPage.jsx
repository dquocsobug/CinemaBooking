import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";
import "./ShowtimeSelectionPage.css";

const FALLBACK_POSTER = "https://placehold.co/400x600/151515/e50914?text=Cinema";

function buildNextDays(total = 7) {
  const now = new Date();
  return Array.from({ length: total }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() + index);
    return date;
  });
}

function toApiDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function weekdayVi(date) {
  const day = date.getDay();
  if (day === 0) return "CHỦ NHẬT";
  return `THỨ ${day + 1}`;
}

function formatDateLong(date) {
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "--:--";
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN") + "đ";
}

function normalizeRoomType(type) {
  const map = {
    TWO_D: "2D Digital",
    THREE_D: "3D Digital",
    IMAX: "IMAX 2D",
    FOUR_DX: "4DX",
    SCREENX: "ScreenX",
  };
  return map[type] || type || "Khác";
}

function getTimeRange(startTime) {
  const hour = new Date(startTime).getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

// ─── API fetchers (tách riêng để dễ test) ────────────────────────────────────

async function fetchMovie(movieSlug) {
  const response = await axiosClient.get(`/movies/${movieSlug}`);
  return response?.data ?? null;
}

async function fetchShowtimes({ movieId, date }) {
  const response = await axiosClient.get("/showtimes", {
    params: { movieId, date },
  });
  return Array.isArray(response?.data) ? response.data : [];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ShowtimeSelectionPage() {
  const { movieSlug } = useParams();
  const navigate = useNavigate();

  const days = useMemo(() => buildNextDays(7), []);
  const [selectedDate, setSelectedDate] = useState(toApiDate(days[0]));
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [cityFilter, setCityFilter] = useState("all");
  const [cinemaFilter, setCinemaFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");

  // ── Query 1: thông tin phim ──────────────────────────────────────────────
  // - cache 10 phút (staleTime), giữ data 30 phút (gcTime)
  // - dù bao nhiêu component gọi cùng key, chỉ 1 HTTP request
  const {
    data: movie,
    isLoading: loadingMovie,
    error: movieError,
  } = useQuery({
    queryKey: ["movie", movieSlug],
    queryFn: () => fetchMovie(movieSlug),
    enabled: !!movieSlug,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  // ── Query 2: lịch chiếu ──────────────────────────────────────────────────
  // - key gồm [movieId, date] → đổi ngày = cache riêng, không fetch lại ngày cũ
  // - enabled chỉ chạy khi đã có movie.id
  // - placeholderData: keepPreviousData → không bị "nhấp nháy" khi đổi ngày
  const {
    data: showtimes = [],
    isLoading: loadingShowtimes,
    isFetching: fetchingShowtimes,
    error: showtimesError,
  } = useQuery({
    queryKey: ["showtimes", movie?.id, selectedDate],
    queryFn: () => fetchShowtimes({ movieId: movie.id, date: selectedDate }),
    enabled: !!movie?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev, // giữ data cũ khi đang fetch ngày mới
    retry: 1,
  });

  // ── Reset showtime đã chọn khi đổi ngày ─────────────────────────────────
  // Dùng key prop trên component thay vì useEffect để tránh stale closure
  function handleDateChange(apiDate) {
    setSelectedDate(apiDate);
    setSelectedShowtime(null);
  }

  // ── Derived state (giữ nguyên logic cũ) ─────────────────────────────────
  const cities = useMemo(
    () => [...new Set(showtimes.map((item) => item.city).filter(Boolean))],
    [showtimes]
  );

  const cinemas = useMemo(() => {
    const filtered =
      cityFilter === "all"
        ? showtimes
        : showtimes.filter((item) => item.city === cityFilter);
    return [...new Map(filtered.map((item) => [item.cinemaId, item])).values()];
  }, [showtimes, cityFilter]);

  const roomTypes = useMemo(
    () => [
      ...new Set(
        showtimes.map((item) => item.roomType || item.format).filter(Boolean)
      ),
    ],
    [showtimes]
  );

  const filteredShowtimes = useMemo(() => {
    return showtimes.filter((item) => {
      const roomType = item.roomType || item.format;
      const matchCity = cityFilter === "all" || item.city === cityFilter;
      const matchCinema =
        cinemaFilter === "all" || item.cinemaId === cinemaFilter;
      const matchRoomType =
        roomTypeFilter === "all" || roomType === roomTypeFilter;
      const matchTime =
        timeFilter === "all" || getTimeRange(item.startTime) === timeFilter;
      return matchCity && matchCinema && matchRoomType && matchTime;
    });
  }, [showtimes, cityFilter, cinemaFilter, roomTypeFilter, timeFilter]);

  const groupedByCinema = useMemo(() => {
    const cinemaMap = new Map();

    filteredShowtimes.forEach((showtime) => {
      if (!cinemaMap.has(showtime.cinemaId)) {
        cinemaMap.set(showtime.cinemaId, {
          cinemaId: showtime.cinemaId,
          cinemaName: showtime.cinemaName,
          address:
            showtime.cinemaAddress ||
            showtime.address ||
            "Địa chỉ rạp chưa cập nhật",
          roomGroups: new Map(),
        });
      }

      const cinema = cinemaMap.get(showtime.cinemaId);
      const roomType = showtime.roomType || showtime.format || "OTHER";
      if (!cinema.roomGroups.has(roomType)) {
        cinema.roomGroups.set(roomType, []);
      }
      cinema.roomGroups.get(roomType).push(showtime);
    });

    return Array.from(cinemaMap.values()).map((cinema) => ({
      ...cinema,
      roomGroups: Array.from(cinema.roomGroups.entries()).map(
        ([roomType, items]) => ({
          roomType,
          items: items.sort(
            (a, b) => new Date(a.startTime) - new Date(b.startTime)
          ),
        })
      ),
    }));
  }, [filteredShowtimes]);

  function handleContinue() {
    if (!selectedShowtime) return;
    navigate(`/booking/${selectedShowtime.id}`, {
      state: { movie, showtime: selectedShowtime, selectedDate },
    });
  }

  // ── Render states ────────────────────────────────────────────────────────
  if (loadingMovie) {
    return <main className="showtime-page showtime-center">Đang tải phim...</main>;
  }

  if (movieError && !movie) {
    return (
      <main className="showtime-page showtime-center showtime-error">
        {movieError?.response?.data?.message || "Không tải được thông tin phim."}
      </main>
    );
  }

  return (
    <main className="showtime-page">
      <section className="showtime-movie-header">
        <div className="showtime-poster-wrap">
          <img
            src={movie?.posterUrl || FALLBACK_POSTER}
            alt={movie?.title || "Movie poster"}
          />
        </div>

        <div className="showtime-movie-info">
          <div className="showtime-meta-row">
            <span className="showtime-age">{movie?.ageRating || "P"}</span>
            <span className="showtime-rating">
              ★ {movie?.rating || "--"}/10
            </span>
            <span>{movie?.durationMin || "--"} ph</span>
          </div>
          <h1>{movie?.title}</h1>
          <p>{movie?.description || "Chưa có mô tả cho phim này."}</p>
        </div>
      </section>

      <div className="showtime-layout">
        <section className="showtime-main">
          <div className="showtime-block">
            <h3 className="showtime-label">Chọn ngày chiếu</h3>
            <div className="date-list">
              {days.map((date) => {
                const apiDate = toApiDate(date);
                const active = selectedDate === apiDate;
                return (
                  <button
                    key={apiDate}
                    type="button"
                    className={`date-card glass-card ${active ? "active" : ""}`}
                    onClick={() => handleDateChange(apiDate)}
                  >
                    <span>{weekdayVi(date)}</span>
                    <strong>{String(date.getDate()).padStart(2, "0")}</strong>
                    <small>T{String(date.getMonth() + 1).padStart(2, "0")}</small>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="filter-card glass-card">
            <div className="select-wrap">
              <select
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setCinemaFilter("all");
                }}
              >
                <option value="all">Khu vực</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div className="select-wrap">
              <select
                value={cinemaFilter}
                onChange={(e) => setCinemaFilter(e.target.value)}
              >
                <option value="all">Tất cả rạp</option>
                {cinemas.map((cinema) => (
                  <option key={cinema.cinemaId} value={cinema.cinemaId}>
                    {cinema.cinemaName}
                  </option>
                ))}
              </select>
            </div>

            <div className="select-wrap">
              <select
                value={roomTypeFilter}
                onChange={(e) => setRoomTypeFilter(e.target.value)}
              >
                <option value="all">Loại phòng</option>
                {roomTypes.map((type) => (
                  <option key={type} value={type}>
                    {normalizeRoomType(type)}
                  </option>
                ))}
              </select>
            </div>

            <div className="select-wrap">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
              >
                <option value="all">Khung giờ</option>
                <option value="morning">Sáng trước 12:00</option>
                <option value="afternoon">Chiều 12:00 - 17:00</option>
                <option value="evening">Tối sau 17:00</option>
              </select>
            </div>
          </div>

          {/* Indicator loading nhẹ khi đổi ngày (không ẩn data cũ) */}
          {fetchingShowtimes && !loadingShowtimes && (
            <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 8 }}>
              Đang cập nhật lịch chiếu...
            </div>
          )}

          {loadingShowtimes ? (
            <div className="glass-card empty-state">Đang tải lịch chiếu...</div>
          ) : showtimesError ? (
            <div className="glass-card empty-state">
              {showtimesError?.response?.data?.message ||
                "Không tải được lịch chiếu."}
            </div>
          ) : groupedByCinema.length === 0 ? (
            <div className="glass-card empty-state">
              Không có suất chiếu phù hợp trong ngày này.
            </div>
          ) : (
            <div className="cinema-list">
              {groupedByCinema.map((cinema, index) => (
                <article
                  key={cinema.cinemaId || index}
                  className={`cinema-card glass-card ${
                    index === 0 ? "highlight" : ""
                  }`}
                >
                  <div className="cinema-head">
                    <div>
                      <h2>{cinema.cinemaName}</h2>
                      <p>{cinema.address}</p>
                    </div>
                    <span className="favorite-icon">♡</span>
                  </div>

                  <div className="room-list">
                    {cinema.roomGroups.map((group) => (
                      <div key={group.roomType} className="room-group">
                        <h4
                          className={group.roomType === "IMAX" ? "gold" : ""}
                        >
                          {normalizeRoomType(group.roomType)}
                        </h4>
                        <div className="time-list">
                          {group.items.map((showtime) => {
                            const active = selectedShowtime?.id === showtime.id;
                            return (
                              <button
                                key={showtime.id}
                                type="button"
                                className={`time-card glass-card ${
                                  active ? "selected" : ""
                                }`}
                                onClick={() => setSelectedShowtime(showtime)}
                              >
                                <strong>{formatTime(showtime.startTime)}</strong>
                                <span>{formatMoney(showtime.basePrice)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="booking-summary glass-card">
          <h3>Thông tin đặt vé</h3>
          <div className="summary-list">
            <div className="summary-item">
              <span>🎬</span>
              <div>
                <small>Phim</small>
                <strong>{movie?.title || "Chưa chọn"}</strong>
              </div>
            </div>
            <div className="summary-item">
              <span>📅</span>
              <div>
                <small>Ngày chiếu</small>
                <strong>{formatDateLong(new Date(selectedDate))}</strong>
              </div>
            </div>
            <div className="summary-item">
              <span>📍</span>
              <div>
                <small>Rạp & phòng</small>
                <strong>
                  {selectedShowtime
                    ? `${selectedShowtime.cinemaName} - ${normalizeRoomType(
                        selectedShowtime.roomType || selectedShowtime.format
                      )}`
                    : "Chưa chọn suất chiếu"}
                </strong>
              </div>
            </div>
            <div className="summary-item">
              <span>⏰</span>
              <div>
                <small>Suất chiếu</small>
                <strong>
                  {selectedShowtime
                    ? formatTime(selectedShowtime.startTime)
                    : "--:--"}
                </strong>
              </div>
            </div>
          </div>

          <div className="summary-total">
            <div>
              <span>Tạm tính</span>
              <strong>
                {selectedShowtime ? formatMoney(selectedShowtime.basePrice) : "0đ"}
              </strong>
            </div>
            <button
              type="button"
              disabled={!selectedShowtime}
              onClick={handleContinue}
            >
              TIẾP TỤC
            </button>
            <p>
              Bằng cách nhấn tiếp tục, bạn đồng ý với các điều khoản của chúng
              tôi.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}