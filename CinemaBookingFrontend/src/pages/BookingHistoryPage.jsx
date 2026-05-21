import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bookingApi, paymentApi } from "../api";
import axiosClient from "../api/axiosClient";
import "./BookingHistoryPage.css";

const FALLBACK_POSTER =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80";

const STATUS_TABS = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Đã đặt" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const statusConfig = {
  PENDING: {
    label: "ĐANG CHỜ",
    className: "booking-status--pending",
  },
  CONFIRMED: {
    label: "ĐÃ XÁC NHẬN",
    className: "booking-status--confirmed",
  },
  CANCELLED: {
    label: "ĐÃ HỦY",
    className: "booking-status--cancelled",
  },
  EXPIRED: {
    label: "ĐÃ HẾT HẠN",
    className: "booking-status--expired",
  },
};

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getSeatText = (seats = []) => {
  if (!seats.length) return "Chưa có ghế";
  return seats.map((seat) => seat.seatCode).join(", ");
};

const getMovieTitle = (booking) => {
  return (
    booking.showtime?.movieTitle ||
    booking.movieTitle ||
    `Đơn đặt vé ${booking.bookingCode || ""}`
  );
};

const getPoster = (booking) => {
  return booking.showtime?.moviePoster || booking.moviePoster || FALLBACK_POSTER;
};

function BookingStatusBadge({ status }) {
  const config = statusConfig[status] || {
    label: status || "UNKNOWN",
    className: "booking-status--unknown",
  };

  return (
    <div className={`booking-status ${config.className}`}>
      <span />
      <strong>{config.label}</strong>
    </div>
  );
}

function BookingCard({ booking, onPayNow, onDownloadQr }) {

  const showtime = booking.showtime || {};
  const status = booking.status;
  const isCancelled = status === "CANCELLED" || status === "EXPIRED";
  const isPending = status === "PENDING";
  const isConfirmed = status === "CONFIRMED";

  return (
    <article
      className={`booking-history-card glass-panel ${
        isCancelled ? "booking-history-card--muted" : ""
      }`}
    >
      <div className="booking-history-card__poster">
        <img src={getPoster(booking)} alt={getMovieTitle(booking)} />
        <div />
        <span>{showtime.format || showtime.roomType || "2D"}</span>
      </div>

      <div className="booking-history-card__body">
        <div className="booking-history-card__top">
          <div>
            <div className="booking-history-card__title">
              <h2>{getMovieTitle(booking)}</h2>
              <span>{booking.ageRating || "P"}</span>
            </div>

            <div className="booking-history-card__meta">
              {showtime.movieDuration && (
                <span>
                  <span className="material-symbols-outlined">schedule</span>
                  {showtime.movieDuration} phút
                </span>
              )}

              {showtime.basePrice && (
                <span>
                  <span className="material-symbols-outlined">local_activity</span>
                  Giá gốc {formatCurrency(showtime.basePrice)}
                </span>
              )}
            </div>
          </div>

          <BookingStatusBadge status={status} />
        </div>

        <div className="booking-history-card__grid">
          <div>
            <p>Mã đặt vé</p>
            <strong>#{booking.bookingCode}</strong>
          </div>

          <div>
            <p>Rạp / Phòng</p>
            <strong>
              {showtime.cinemaName || "Chưa cập nhật"} /{" "}
              {showtime.roomName || "Chưa cập nhật"}
            </strong>
          </div>

          <div>
            <p>Suất chiếu</p>
            <strong>{formatDateTime(showtime.startTime || booking.createdAt)}</strong>
          </div>

          <div>
            <p>Ghế</p>
            <strong>{getSeatText(booking.seats)}</strong>
          </div>
        </div>

        <div className="booking-history-card__bottom">
          <div>
            <p>
              {isPending && booking.expiresAt ? (
                <>
                  Hạn thanh toán: <b>{formatDateTime(booking.expiresAt)}</b>
                </>
              ) : isCancelled ? (
                "Trạng thái đơn"
              ) : (
                "Tổng cộng"
              )}
            </p>

            <strong className={isCancelled ? "booking-price--muted" : ""}>
              {formatCurrency(booking.finalPrice)}
            </strong>
          </div>

          <div className="booking-history-card__actions">
            <button type="button">Xem chi tiết</button>

            {isPending && (
              <button
                type="button"
                className="booking-main-btn"
                onClick={() => onPayNow(booking)}
              >
                <span className="material-symbols-outlined">payments</span>
                Thanh toán ngay
              </button>
            )}

            {isConfirmed && (
              <button
                type="button"
                className="booking-main-btn"
                onClick={() => onDownloadQr(booking.id, booking.bookingCode)}
              >
                <span className="material-symbols-outlined">qr_code_2</span>
                Tải vé QR
              </button>
            )}

            {isCancelled && <button type="button">Liên hệ hỗ trợ</button>}
          </div>
        </div>
      </div>
    </article>
  );
}

function BookingHistoryPage() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [payingId, setPayingId] = useState("");
  
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);

        const res = await bookingApi.getBookings({
          page,
          size: 6,
        });

        const data = res?.data || {};
        setBookings(data.content || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error("Fetch booking history error:", err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [page]);

  const filteredBookings = useMemo(() => {
  return bookings.filter((booking) => {
    const matchStatus =
      activeStatus === "ALL" || booking.status === activeStatus;

    const matchKeyword =
      !keyword.trim() ||
      booking.bookingCode?.toLowerCase().includes(keyword.trim().toLowerCase());

    const bookingDate = booking.showtime?.startTime || booking.createdAt;
    const matchDate =
      !selectedDate ||
      (bookingDate &&
        new Date(bookingDate).toISOString().slice(0, 10) === selectedDate);

    return matchStatus && matchKeyword && matchDate;
  });
}, [bookings, activeStatus, keyword, selectedDate]);

  const totalTickets = useMemo(
    () => bookings.reduce((sum, booking) => sum + (booking.seats?.length || 0), 0),
    [bookings]
  );

  const upcomingTickets = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status === "CONFIRMED" &&
          booking.showtime?.startTime &&
          new Date(booking.showtime.startTime).getTime() > Date.now()
      ).length,
    [bookings]
  );

  const handlePayNow = async (booking) => {
    try {
      setPayingId(booking.id);

      const res = await paymentApi.initiatePayment({
        bookingId: booking.id,
        method: "MOMO",
      });

      const paymentUrl = res?.data?.paymentUrl;

      if (paymentUrl) {
        window.location.href = paymentUrl;
      }
    } catch (err) {
      console.error("Initiate payment error:", err);
      alert(err.message || "Không thể khởi tạo thanh toán");
    } finally {
      setPayingId("");
    }
  };

  const handleDownloadQr = async (bookingId, bookingCode) => {
  try {
    const blob = await axiosClient.get(`/tickets/download/${bookingId}`, {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `Ma-ve-xem-phim-${bookingCode}.png`;

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download QR error:", err);
    alert(err.message || "Không thể tải mã QR");
  }
};

  return (
    <main className="booking-history-page">
        <div className="booking-history-container">
      <section className="booking-history-header">
        <div>
          <h1>Lịch sử đặt vé</h1>
          <p>Quản lý các hành trình điện ảnh của bạn tại Cine Luxe Premiere.</p>
        </div>

        <div className="booking-history-summary">
          <div className="glass-panel">
            <span className="material-symbols-outlined">confirmation_number</span>
            <div>
              <p>Tổng số vé</p>
              <strong>{loading ? "..." : totalTickets}</strong>
            </div>
          </div>

          <div className="glass-panel">
            <span className="material-symbols-outlined booking-green">event_available</span>
            <div>
              <p>Vé sắp tới</p>
              <strong>{loading ? "..." : upcomingTickets}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="booking-history-filter glass-panel">
        <div className="booking-tabs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={activeStatus === tab.value ? "booking-tab--active" : ""}
              onClick={() => setActiveStatus(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="booking-search-row">
          <div className="booking-search-box">
            <span className="material-symbols-outlined">search</span>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Nhập mã đặt vé..."
            />
          </div>

          <div className="booking-date-box">
  <span className="material-symbols-outlined">calendar_month</span>

  <input
    type="date"
    value={selectedDate}
    onChange={(e) => setSelectedDate(e.target.value)}
  />
</div>
        </div>
      </section>

      <section className="booking-history-list">
        {loading ? (
          <div className="booking-empty glass-panel">
            <span className="material-symbols-outlined booking-spin">sync</span>
            <p>Đang tải lịch sử đặt vé...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="booking-empty glass-panel">
            <span className="material-symbols-outlined">local_activity</span>
            <h2>Chưa có đơn đặt vé</h2>
            <p>Hãy chọn một bộ phim và bắt đầu hành trình điện ảnh của bạn.</p>
            <button type="button" onClick={() => navigate("/movies")}>
              Xem phim ngay
            </button>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onPayNow={payingId === booking.id ? () => {} : handlePayNow}
              onDownloadQr={handleDownloadQr}
            />
          ))
        )}
      </section>

      {totalPages > 1 && (
        <nav className="booking-pagination">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              type="button"
              className={page === index ? "booking-page--active" : ""}
              onClick={() => setPage(index)}
            >
              {index + 1}
            </button>
          ))}

          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </nav>
      )}
      </div>
    </main>
  );
}

export default BookingHistoryPage;
