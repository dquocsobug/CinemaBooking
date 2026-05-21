import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

export default function ShowtimeSelectionPage() {
  const { movieSlug } = useParams();
  const navigate = useNavigate();

  const days = useMemo(() => buildNextDays(7), []);
  const [selectedDate, setSelectedDate] = useState(toApiDate(days[0]));
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [cityFilter, setCityFilter] = useState("all");
  const [cinemaFilter, setCinemaFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [loadingMovie, setLoadingMovie] = useState(true);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function fetchMovie() {
      try {
        setLoadingMovie(true);
        setError("");
        if (!movieSlug) {
          setError("Thiếu movieSlug trên URL.");
          setLoadingMovie(false);
          return;
        }

        const response = await axiosClient.get(`/movies/${movieSlug}`);
        if (!mounted) return;
        setMovie(response?.data || null);
      } catch (err) {
        if (!mounted) return;
        setError(err.response?.data?.message || "Không tải được thông tin phim.");
      } finally {
        if (mounted) setLoadingMovie(false);
      }
    }

    fetchMovie();
    return () => {
      mounted = false;
    };
  }, [movieSlug]);

  useEffect(() => {
    if (!movie?.id) return;
    let mounted = true;

    async function fetchShowtimes() {
      try {
        setLoadingShowtimes(true);
        setSelectedShowtime(null);
        const response = await axiosClient.get("/showtimes", {
          params: {
            movieId: movie.id,
            date: selectedDate,
          },
        });
        if (!mounted) return;
        setShowtimes(Array.isArray(response?.data) ? response.data : []);
      } catch (err) {
        if (!mounted) return;
        setShowtimes([]);
        setError(err.response?.data?.message || "Không tải được lịch chiếu.");
      } finally {
        if (mounted) setLoadingShowtimes(false);
      }
    }

    fetchShowtimes();
    return () => {
      mounted = false;
    };
  }, [movie?.id, selectedDate]);

  const cities = useMemo(() => {
    return [...new Set(showtimes.map((item) => item.city).filter(Boolean))];
  }, [showtimes]);

  const cinemas = useMemo(() => {
    const filtered = cityFilter === "all" ? showtimes : showtimes.filter((item) => item.city === cityFilter);
    return [...new Map(filtered.map((item) => [item.cinemaId, item])).values()];
  }, [showtimes, cityFilter]);

  const roomTypes = useMemo(() => {
    return [...new Set(showtimes.map((item) => item.roomType || item.format).filter(Boolean))];
  }, [showtimes]);

  const filteredShowtimes = useMemo(() => {
    return showtimes.filter((item) => {
      const roomType = item.roomType || item.format;
      const matchCity = cityFilter === "all" || item.city === cityFilter;
      const matchCinema = cinemaFilter === "all" || item.cinemaId === cinemaFilter;
      const matchRoomType = roomTypeFilter === "all" || roomType === roomTypeFilter;
      const matchTime = timeFilter === "all" || getTimeRange(item.startTime) === timeFilter;
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
          address: showtime.cinemaAddress || showtime.address || "Địa chỉ rạp chưa cập nhật",
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
      roomGroups: Array.from(cinema.roomGroups.entries()).map(([roomType, items]) => ({
        roomType,
        items: items.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
      })),
    }));
  }, [filteredShowtimes]);

  function handleContinue() {
    if (!selectedShowtime) return;
    navigate(`/booking/${selectedShowtime.id}`, {
      state: {
        movie,
        showtime: selectedShowtime,
        selectedDate,
      },
    });
  }

  if (loadingMovie) {
    return <main className="showtime-page showtime-center">Đang tải phim...</main>;
  }

  if (error && !movie) {
    return <main className="showtime-page showtime-center showtime-error">{error}</main>;
  }

  return (
    <main className="showtime-page">
      <section className="showtime-movie-header">
        <div className="showtime-poster-wrap">
          <img src={movie?.posterUrl || FALLBACK_POSTER} alt={movie?.title || "Movie poster"} />
        </div>

        <div className="showtime-movie-info">
          <div className="showtime-meta-row">
            <span className="showtime-age">{movie?.ageRating || "P"}</span>
            <span className="showtime-rating">★ {movie?.rating || "--"}/10</span>
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
                    onClick={() => setSelectedDate(apiDate)}
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
              <select value={cityFilter} onChange={(e) => { setCityFilter(e.target.value); setCinemaFilter("all"); }}>
                <option value="all">Khu vực</option>
                {cities.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>

            <div className="select-wrap">
              <select value={cinemaFilter} onChange={(e) => setCinemaFilter(e.target.value)}>
                <option value="all">Tất cả rạp</option>
                {cinemas.map((cinema) => (
                  <option key={cinema.cinemaId} value={cinema.cinemaId}>{cinema.cinemaName}</option>
                ))}
              </select>
            </div>

            <div className="select-wrap">
              <select value={roomTypeFilter} onChange={(e) => setRoomTypeFilter(e.target.value)}>
                <option value="all">Loại phòng</option>
                {roomTypes.map((type) => <option key={type} value={type}>{normalizeRoomType(type)}</option>)}
              </select>
            </div>

            <div className="select-wrap">
              <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
                <option value="all">Khung giờ</option>
                <option value="morning">Sáng trước 12:00</option>
                <option value="afternoon">Chiều 12:00 - 17:00</option>
                <option value="evening">Tối sau 17:00</option>
              </select>
            </div>
          </div>

          {loadingShowtimes ? (
            <div className="glass-card empty-state">Đang tải lịch chiếu...</div>
          ) : groupedByCinema.length === 0 ? (
            <div className="glass-card empty-state">Không có suất chiếu phù hợp trong ngày này.</div>
          ) : (
            <div className="cinema-list">
              {groupedByCinema.map((cinema, index) => (
                <article key={cinema.cinemaId || index} className={`cinema-card glass-card ${index === 0 ? "highlight" : ""}`}>
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
                        <h4 className={group.roomType === "IMAX" ? "gold" : ""}>{normalizeRoomType(group.roomType)}</h4>
                        <div className="time-list">
                          {group.items.map((showtime) => {
                            const active = selectedShowtime?.id === showtime.id;
                            return (
                              <button
                                key={showtime.id}
                                type="button"
                                className={`time-card glass-card ${active ? "selected" : ""}`}
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
                    ? `${selectedShowtime.cinemaName} - ${normalizeRoomType(selectedShowtime.roomType || selectedShowtime.format)}`
                    : "Chưa chọn suất chiếu"}
                </strong>
              </div>
            </div>
            <div className="summary-item">
              <span>⏰</span>
              <div>
                <small>Suất chiếu</small>
                <strong>{selectedShowtime ? formatTime(selectedShowtime.startTime) : "--:--"}</strong>
              </div>
            </div>
          </div>

          <div className="summary-total">
            <div>
              <span>Tạm tính</span>
              <strong>{selectedShowtime ? formatMoney(selectedShowtime.basePrice) : "0đ"}</strong>
            </div>
            <button type="button" disabled={!selectedShowtime} onClick={handleContinue}>
              TIẾP TỤC
            </button>
            <p>Bằng cách nhấn tiếp tục, bạn đồng ý với các điều khoản của chúng tôi.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
