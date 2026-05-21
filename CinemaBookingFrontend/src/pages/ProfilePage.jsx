import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { bookingApi } from "../api";
import "./ProfilePage.css";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1800&q=80";

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (dateValue) => {
  if (!dateValue) return "Chưa cập nhật";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatJoinMonth = (dateValue) => {
  if (!dateValue) return "Tham gia gần đây";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Tham gia gần đây";

  return `Tham gia T${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

function ToggleSwitch({ defaultChecked = false }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <button
      type="button"
      className={`profile-switch ${checked ? "profile-switch--active" : ""}`}
      onClick={() => setChecked((prev) => !prev)}
      aria-label="Bật tắt thông báo"
    >
      <span />
    </button>
  );
}

function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        setLoadingBookings(true);
        const res = await bookingApi.getBookings({ page: 0, size: 20 });
        setBookings(res?.data?.content || []);
      } catch (err) {
        console.error("Fetch profile bookings error:", err);
        setBookings([]);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookings();
  }, [user]);

  const stats = useMemo(() => {
    const totalTickets = bookings.reduce(
      (sum, booking) => sum + (booking.seats?.length || 0),
      0
    );

    const watchedMovies = new Set(
      bookings
        .map((booking) => booking.showtime?.movieTitle)
        .filter(Boolean)
    ).size;

    const totalSpent = bookings.reduce(
      (sum, booking) => sum + Number(booking.finalPrice || 0),
      0
    );

    const points = Math.floor(totalSpent / 10000);

    return {
      totalTickets,
      watchedMovies,
      totalSpent,
      points,
    };
  }, [bookings]);

  const recentActivities = useMemo(() => {
    return bookings.slice(0, 3).map((booking) => ({
      id: booking.id,
      title: `Đã đặt vé ${booking.showtime?.movieTitle || booking.bookingCode}`,
      desc: `${formatDate(booking.createdAt)} • ${booking.seats?.length || 0} ghế • ${booking.status}`,
      icon: "confirmation_number",
    }));
  }, [bookings]);

  const handleLogoutAll = () => {
    logout();
    navigate("/login");
  };

  if (!user) {
    return (
      <main className="profile-page profile-page--empty">
        <div className="profile-empty glass-card">
          <span className="material-symbols-outlined">lock</span>
          <h1>Bạn cần đăng nhập</h1>
          <p>Vui lòng đăng nhập để xem hồ sơ cá nhân.</p>
          <Link to="/login">Đăng nhập ngay</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <img className="profile-hero__bg" src={HERO_IMAGE} alt="Cinema hall" />
        <div className="profile-hero__gradient" />

        <div className="profile-hero__content">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              <img src={user.avatarUrl || DEFAULT_AVATAR} alt={user.fullName || "User"} />
            </div>
            <button className="profile-avatar-edit" type="button">
              <span className="material-symbols-outlined">edit</span>
            </button>
          </div>

          <div className="profile-identity">
            <div className="profile-identity__title-row">
              <h1>{user.fullName || "Người dùng Cine Luxe"}</h1>
              <span className="profile-rank">
                <span className="material-symbols-outlined">workspace_premium</span>
                Thành viên Kim cương
              </span>
            </div>

            <div className="profile-meta">
              <span>
                <span className="material-symbols-outlined">mail</span>
                {user.email || "Chưa cập nhật email"}
              </span>
              <span>
                <span className="material-symbols-outlined">calendar_today</span>
                {formatJoinMonth(user.createdAt)}
              </span>
            </div>
          </div>

          <button className="profile-edit-btn" type="button">
            <span className="material-symbols-outlined">edit_square</span>
            Chỉnh sửa hồ sơ
          </button>
        </div>
      </section>

      <section className="profile-stats">
        <div className="profile-stat-card glass-card">
          <div>
            <span className="material-symbols-outlined">confirmation_number</span>
            <small>+12% tháng này</small>
          </div>
          <p>Tổng số vé</p>
          <h3>{loadingBookings ? "..." : stats.totalTickets}</h3>
        </div>

        <div className="profile-stat-card glass-card">
          <div>
            <span className="material-symbols-outlined">movie</span>
            <small>Top người dùng</small>
          </div>
          <p>Phim đã xem</p>
          <h3>{loadingBookings ? "..." : stats.watchedMovies}</h3>
        </div>

        <div className="profile-stat-card glass-card">
          <div>
            <span className="material-symbols-outlined">payments</span>
            <small>VND</small>
          </div>
          <p>Tổng chi tiêu</p>
          <h3>{loadingBookings ? "..." : formatCurrency(stats.totalSpent)}</h3>
        </div>

        <div className="profile-stat-card glass-card">
          <div>
            <span className="material-symbols-outlined">stars</span>
            <small>Tích lũy</small>
          </div>
          <p>Điểm tích lũy</p>
          <h3>{loadingBookings ? "..." : stats.points.toLocaleString("vi-VN")}</h3>
        </div>
      </section>

      <section className="profile-content-grid">
        <div className="profile-left">
          <div className="profile-card glass-card">
            <div className="profile-card__header">
              <h2>Thông tin cá nhân</h2>
              <span className={`profile-verified ${user.isVerified ? "profile-verified--yes" : ""}`}>
                <span className="material-symbols-outlined">verified</span>
                {user.isVerified ? "Đã xác thực" : "Chưa xác thực"}
              </span>
            </div>

            <div className="profile-info">
              <div className="profile-info__row">
                <div>
                  <label>Họ và tên</label>
                  <p>{user.fullName || "Chưa cập nhật"}</p>
                </div>
                <div>
                  <label>Ngày sinh</label>
                  <p>{formatDate(user.dateOfBirth)}</p>
                </div>
              </div>

              <div>
                <label>Địa chỉ email</label>
                <p>{user.email || "Chưa cập nhật"}</p>
              </div>

              <div>
                <label>Số điện thoại</label>
                <p>{user.phone || "Chưa cập nhật"}</p>
              </div>

              <div className="profile-actions">
                <button type="button">Đổi mật khẩu</button>
                <button type="button">Tải ảnh đại diện</button>
              </div>
            </div>
          </div>

          <div className="profile-card glass-card">
            <h2>Cài đặt thông báo</h2>

            <div className="profile-setting-list">
              <div className="profile-setting">
                <div>
                  <h4>Thông báo Email</h4>
                  <p>Cập nhật phim hàng tuần và bản tin</p>
                </div>
                <ToggleSwitch />
              </div>

              <div className="profile-setting">
                <div>
                  <h4>Nhắc nhở đặt vé</h4>
                  <p>Cảnh báo 2 giờ trước khi phim bắt đầu</p>
                </div>
                <ToggleSwitch defaultChecked />
              </div>

              <div className="profile-setting">
                <div>
                  <h4>Thông báo khuyến mãi</h4>
                  <p>Ưu đãi độc quyền và giảm giá nhanh</p>
                </div>
                <ToggleSwitch defaultChecked />
              </div>
            </div>
          </div>
        </div>

        <div className="profile-right">
          <div className="profile-card glass-card">
            <div className="profile-card__header">
              <h2>Lịch sử mua vé gần đây</h2>
              <button type="button" onClick={() => navigate("/booking-history")}>
                Xem tất cả
              </button>
            </div>

            <div className="profile-ticket-list">
              {bookings.length === 0 ? (
                <div className="profile-empty-list">
                  <span className="material-symbols-outlined">confirmation_number</span>
                  <p>Chưa có lịch sử mua vé.</p>
                </div>
              ) : (
                bookings.slice(0, 4).map((booking) => (
                  <div className="profile-ticket" key={booking.id}>
                    <div className="profile-ticket__icon">
                      <span className="material-symbols-outlined">local_activity</span>
                    </div>
                    <div>
                      <h4>{booking.showtime?.movieTitle || `Mã vé ${booking.bookingCode}`}</h4>
                      <p>
                        {booking.seats?.map((seat) => seat.seatCode).join(", ") || "Chưa có ghế"}
                        {" • "}
                        {formatCurrency(booking.finalPrice)}
                      </p>
                    </div>
                    <span className={`profile-ticket__status profile-ticket__status--${booking.status?.toLowerCase()}`}>
                      {booking.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="profile-two-col">
            <div className="profile-card glass-card">
              <h2>Hoạt động gần đây</h2>

              <div className="profile-activity-list">
                {recentActivities.length === 0 ? (
                  <p className="profile-muted">Chưa có hoạt động gần đây.</p>
                ) : (
                  recentActivities.map((activity) => (
                    <div className="profile-activity" key={activity.id}>
                      <div>
                        <span className="material-symbols-outlined">{activity.icon}</span>
                      </div>
                      <section>
                        <h4>{activity.title}</h4>
                        <p>{activity.desc}</p>
                      </section>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="profile-card glass-card">
              <h2>Bảo mật & Thiết bị</h2>

              <div className="profile-device-list">
                <div className="profile-device profile-device--active">
                  <div className="profile-device__top">
                    <span>Phiên hoạt động</span>
                    <i />
                  </div>
                  <div className="profile-device__body">
                    <span className="material-symbols-outlined">laptop_mac</span>
                    <div>
                      <p>Thiết bị hiện tại</p>
                      <small>Chrome • Web App</small>
                    </div>
                  </div>
                </div>

                <div className="profile-device profile-device--disabled">
                  <div className="profile-device__body">
                    <span className="material-symbols-outlined">smartphone</span>
                    <div>
                      <p>Ứng dụng di động</p>
                      <small>Chưa kết nối</small>
                    </div>
                  </div>
                </div>

                <button className="profile-danger-btn" type="button" onClick={handleLogoutAll}>
                  Đăng xuất tất cả thiết bị
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ProfilePage;
