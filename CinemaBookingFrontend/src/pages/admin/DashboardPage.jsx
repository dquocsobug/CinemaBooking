import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "./DashboardPage.css";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const formatMoney = (value = 0) => currency.format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) return "--";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const getTime = (value) => {
  if (!value) return "--:--";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const unwrapPageContent = (res) => {
  if (!res) return [];

  // axiosClient của bạn đã return response.data
  // Backend format: { success, data, message, timestamp }
  const root = res?.data ?? res;

  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.content)) return root.content;
  if (Array.isArray(root?.data)) return root.data;
  if (Array.isArray(root?.data?.content)) return root.data.content;

  return [];
};

function StatCard({ icon, label, value, hint, tone = "red" }) {
  return (
    <article className={`admin-stat-card admin-stat-card--${tone}`}>
      <div className="admin-stat-icon">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {hint && <span>{hint}</span>}
      </div>
    </article>
  );
}

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    let mounted = true;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const today = new Date().toISOString().slice(0, 10);

        // 1. Lấy phim đang chiếu
        const movieRes = await axiosClient.get("/movies/now-showing");
        const movieList = unwrapPageContent(movieRes);

        // 2. Backend showtimes của bạn cần movieId + date
        // Vì vậy không gọi /showtimes?date=... nữa để tránh lỗi 400
        const showtimeResults = await Promise.allSettled(
          movieList.map((movie) =>
            axiosClient.get(`/showtimes?movieId=${movie.id}&date=${today}`)
          )
        );

        const showtimeList = showtimeResults.flatMap((result) => {
          if (result.status !== "fulfilled") return [];
          return unwrapPageContent(result.value);
        });

        // 3. /bookings là API cần token và thường chỉ trả booking của user hiện tại.
        // Nếu backend chưa có admin bookings, dashboard sẽ tính doanh thu tạm từ data này.
        let bookingList = [];
        try {
          const bookingRes = await axiosClient.get("/bookings");
          bookingList = unwrapPageContent(bookingRes);
        } catch (bookingErr) {
          console.warn("Không lấy được bookings:", bookingErr?.message || bookingErr);
          bookingList = [];
        }

        if (!mounted) return;

        setMovies(movieList);
        setShowtimes(showtimeList);
        setBookings(bookingList);
      } catch (err) {
        console.error("Fetch admin dashboard error:", err);
        if (mounted) {
          setError(err.message || "Không thể tải dữ liệu dashboard");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const pendingBookings = bookings.filter(
      (item) => item.status === "PENDING"
    ).length;

    const confirmedBookings = bookings.filter(
      (item) => item.status === "CONFIRMED"
    ).length;

    // Doanh thu tạm tính:
    // - Nếu chưa có payment SUCCESS API, dùng finalPrice của booking PENDING + CONFIRMED.
    // - Khi backend có /admin/payments hoặc /admin/dashboard, nên đổi sang doanh thu từ payment SUCCESS.
    const revenue = bookings
      .filter((item) => ["PENDING", "CONFIRMED"].includes(item.status))
      .reduce((sum, item) => sum + Number(item.finalPrice || 0), 0);

    return {
      totalMovies: movies.length,
      todayShowtimes: showtimes.length,
      pendingBookings,
      confirmedBookings,
      revenue,
    };
  }, [movies, showtimes, bookings]);

  const showtimesByCinema = useMemo(() => {
    const groups = showtimes.reduce((acc, item) => {
      const key = item.cinemaName || "Chưa rõ rạp";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    return Object.entries(groups).map(([cinemaName, items]) => ({
      cinemaName,
      items: items.sort(
        (a, b) => new Date(a.startTime || 0) - new Date(b.startTime || 0)
      ),
    }));
  }, [showtimes]);

  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [bookings]);

  return (
    <main className="admin-dashboard-page">
      <section className="admin-dashboard-hero">
        <div>
          <p className="admin-eyebrow">Admin Dashboard</p>
          <h1>Quản trị Cine Luxe Premiere</h1>
          <span>Theo dõi phim, lịch chiếu, booking và doanh thu trong ngày.</span>
        </div>

        <div className="admin-hero-actions">
          <Link to="/admin/movies" className="admin-ghost-btn">
            Quản lý phim
          </Link>
          <Link to="/admin/showtimes" className="admin-primary-btn">
            Tạo suất chiếu
          </Link>
        </div>
      </section>

      {error && <div className="admin-alert">{error}</div>}

      <section className="admin-stats-grid">
        <StatCard
          icon="movie"
          label="Phim đang chiếu"
          value={stats.totalMovies}
          hint="Now showing"
        />

        <StatCard
          icon="event_available"
          label="Suất chiếu hôm nay"
          value={stats.todayShowtimes}
          hint="Theo ngày hiện tại"
          tone="gold"
        />

        <StatCard
          icon="confirmation_number"
          label="Booking chờ xử lý"
          value={stats.pendingBookings}
          hint={`${stats.confirmedBookings} đã xác nhận`}
          tone="blue"
        />

        <StatCard
          icon="payments"
          label="Doanh thu tạm tính"
          value={formatMoney(stats.revenue)}
          hint="Từ booking lấy được"
          tone="green"
        />
      </section>

      {loading ? (
        <section className="admin-loading-card">
          <span className="material-symbols-outlined admin-spin">sync</span>
          <p>Đang tải dữ liệu dashboard...</p>
        </section>
      ) : (
        <section className="admin-dashboard-grid">
          <article className="admin-panel admin-panel-large">
            <div className="admin-panel-header">
              <div>
                <p className="admin-eyebrow">Lịch chiếu</p>
                <h2>Suất chiếu hôm nay</h2>
              </div>
              <Link to="/admin/showtimes">Xem tất cả</Link>
            </div>

            {showtimesByCinema.length === 0 ? (
              <div className="admin-empty-state">
                Chưa có suất chiếu hôm nay hoặc backend không trả lịch chiếu cho ngày hiện tại.
              </div>
            ) : (
              <div className="admin-cinema-list">
                {showtimesByCinema.map((group) => (
                  <div className="admin-cinema-card" key={group.cinemaName}>
                    <div className="admin-cinema-title">
                      <span className="material-symbols-outlined">location_on</span>
                      <strong>{group.cinemaName}</strong>
                    </div>

                    <div className="admin-showtime-table">
                      {group.items.slice(0, 6).map((item) => (
                        <div className="admin-showtime-row" key={item.id}>
                          <div>
                            <strong>{item.movieTitle}</strong>
                            <span>
                              {item.roomName} • {item.roomType || item.format || "2D"}
                            </span>
                          </div>

                          <div className="admin-showtime-time">
                            <strong>{getTime(item.startTime)}</strong>
                            <span>{formatMoney(item.basePrice)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <aside className="admin-side-stack">
            <article className="admin-panel">
              <div className="admin-panel-header compact">
                <div>
                  <p className="admin-eyebrow">Phim</p>
                  <h2>Đang chiếu</h2>
                </div>
              </div>

              {movies.length === 0 ? (
                <div className="admin-empty-state small">Chưa có phim đang chiếu.</div>
              ) : (
                <div className="admin-movie-list">
                  {movies.slice(0, 4).map((movie) => (
                    <Link
                      to={`/movies/${movie.slug}`}
                      className="admin-movie-item"
                      key={movie.id}
                    >
                      <img
                        src={
                          movie.posterUrl ||
                          "https://placehold.co/90x130/1c1b1b/e50914?text=Cine"
                        }
                        alt={movie.title}
                      />
                      <div>
                        <strong>{movie.title}</strong>
                        <span>
                          {movie.durationMin} phút • {movie.ageRating || "P"}
                        </span>
                        <small>
                          {movie.rating ? `${movie.rating}/10` : "Chưa có rating"}
                        </small>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </article>

            <article className="admin-panel">
              <div className="admin-panel-header compact">
                <div>
                  <p className="admin-eyebrow">Booking</p>
                  <h2>Gần đây</h2>
                </div>
              </div>

              {recentBookings.length === 0 ? (
                <div className="admin-empty-state small">
                  Chưa có booking hoặc tài khoản hiện tại không có quyền xem booking.
                </div>
              ) : (
                <div className="admin-booking-list">
                  {recentBookings.map((booking) => (
                    <div className="admin-booking-item" key={booking.id}>
                      <div>
                        <strong>{booking.bookingCode}</strong>
                        <span>{formatDateTime(booking.createdAt)}</span>
                      </div>

                      <div>
                        <em
                          className={`admin-status admin-status-${String(
                            booking.status
                          ).toLowerCase()}`}
                        >
                          {booking.status}
                        </em>
                        <span>{formatMoney(booking.finalPrice)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </aside>
        </section>
      )}
    </main>
  );
}

export default DashboardPage;
