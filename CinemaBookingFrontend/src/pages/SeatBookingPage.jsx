import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";
import "./SeatBookingPage.css";

const FALLBACK_POSTER =
  "https://placehold.co/800x500/151515/e50914?text=Cinema";
const LOCK_SECONDS = 300;

function formatTime(value) {
  if (!value) return "--:--";
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(value) {
  if (!value) return "--/--/----";
  return new Date(value).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
  return map[type] || type || "2D";
}

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function groupSeatsByRow(seats) {
  const rowMap = new Map();

  seats.forEach((seat) => {
    const row = seat.rowLabel || "?";
    if (!rowMap.has(row)) rowMap.set(row, []);
    rowMap.get(row).push(seat);
  });

  return Array.from(rowMap.entries())
    .sort(([a], [b]) => a.localeCompare(b, "vi", { numeric: true }))
    .map(([rowLabel, items]) => ({
      rowLabel,
      seats: items.sort((a, b) => Number(a.colNumber) - Number(b.colNumber)),
    }));
}

function isCoupleDisplaySeat(seat) {
  return seat.seatType === "VIP";
}

function findCouplePair(seat, seats) {
  if (!isCoupleDisplaySeat(seat)) return [seat];

  const rowSeats = seats
    .filter((item) => item.rowLabel === seat.rowLabel && item.seatType === "VIP")
    .sort((a, b) => Number(a.colNumber) - Number(b.colNumber));

  const index = rowSeats.findIndex((item) => item.id === seat.id);
  if (index === -1) return [seat];

  const pairIndex = index % 2 === 0 ? index + 1 : index - 1;
  const pairSeat = rowSeats[pairIndex];

  return pairSeat ? [seat, pairSeat] : [seat];
}

async function fetchSeatMap(showtimeId) {
  const response = await axiosClient.get(`/showtimes/${showtimeId}/seat-map`);
  return response?.data || null;
}

export default function SeatBookingPage() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const movie = location.state?.movie || null;
  const showtime = location.state?.showtime || null;

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [voucherCode, setVoucherCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [countdown, setCountdown] = useState(LOCK_SECONDS);
  const [submitting, setSubmitting] = useState(false);

  const {
    data: seatMap = null,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["seat-map", showtimeId],
    queryFn: () => fetchSeatMap(showtimeId),
    enabled: Boolean(showtimeId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (selectedSeats.length === 0) {
      setCountdown(LOCK_SECONDS);
      return undefined;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setSelectedSeats([]);
          return LOCK_SECONDS;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedSeats.length]);

  const seats = seatMap?.seats || [];
  const rows = useMemo(() => groupSeatsByRow(seats), [seats]);

  const selectedSeatIds = useMemo(
    () => new Set(selectedSeats.map((seat) => seat.id)),
    [selectedSeats]
  );

  const basePrice = Number(showtime?.basePrice || 0);

  const ticketTotal = selectedSeats.reduce((sum, seat) => {
    return sum + basePrice + Number(seat.extraFee || 0);
  }, 0);

  const extraFeeTotal = selectedSeats.reduce(
    (sum, seat) => sum + Number(seat.extraFee || 0),
    0
  );

  const finalTotal = Math.max(ticketTotal - discountAmount, 0);

  function canChooseSeat(seat) {
    return seat.status === "AVAILABLE" || seat.lockedByMe === true;
  }

  function handleToggleSeat(seat) {
    if (!canChooseSeat(seat)) return;

    const pairSeats = findCouplePair(seat, seats);

    const invalidPair = pairSeats.some((item) => !canChooseSeat(item));
    if (invalidPair) {
      alert("Ghế đôi này đã có ghế bị đặt hoặc đang giữ.");
      return;
    }

    setSelectedSeats((prev) => {
      const pairIds = pairSeats.map((item) => item.id);
      const isSelected = pairIds.every((id) =>
        prev.some((item) => item.id === id)
      );

      if (isSelected) {
        return prev.filter((item) => !pairIds.includes(item.id));
      }

      const withoutPair = prev.filter((item) => !pairIds.includes(item.id));
      return [...withoutPair, ...pairSeats];
    });
  }

  function getSeatClass(seat) {
    const selected = selectedSeatIds.has(seat.id);
    const booked = seat.status === "BOOKED";
    const locked = seat.status === "LOCKED" && !seat.lockedByMe;
    const couple = seat.seatType === "VIP" || seat.seatType === "COUPLE";

    return [
      "seat-btn",
      selected ? "selected" : "",
      booked ? "booked" : "",
      locked ? "locked" : "",
      couple ? "couple" : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  async function handleApplyVoucher() {
    if (!voucherCode.trim()) return;

    try {
      const response = await axiosClient.get("/vouchers/validate", {
        params: {
          code: voucherCode.trim(),
          orderValue: ticketTotal,
        },
      });

      const voucher = response?.data;
      const amount = Number(voucher?.discountAmount || voucher?.amount || 0);
      setDiscountAmount(amount);
    } catch (err) {
      setDiscountAmount(0);
      alert(err.message || "Voucher không hợp lệ.");
    }
  }

  async function handleCheckout() {
    if (selectedSeats.length === 0) {
      alert("Vui lòng chọn ít nhất một ghế.");
      return;
    }

    const seatIds = selectedSeats.map((seat) => seat.id);

    try {
      setSubmitting(true);

      await axiosClient.post("/bookings/lock-seats", {
        showtimeId,
        seatIds,
      });

      const bookingResponse = await axiosClient.post("/bookings", {
        showtimeId,
        seatIds,
        voucherCode: voucherCode.trim() || null,
      });

      const booking = bookingResponse?.data || bookingResponse;

      if (!booking?.id) {
        alert("Không lấy được thông tin booking.");
        return;
      }

      navigate(`/payment/${booking.id}`, {
        state: {
          booking,
          movie,
          showtime,
          seats: selectedSeats,
          totalPrice: ticketTotal,
          discountAmount,
          finalPrice: finalTotal,
        },
      });
    } catch (err) {
      alert(err.message || "Không thể tạo booking. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!showtimeId) {
    return (
      <main className="seat-page seat-center seat-error">
        Không tìm thấy showtimeId trên URL.
      </main>
    );
  }

  if (loading) {
    return <main className="seat-page seat-center">Đang tải sơ đồ ghế...</main>;
  }

  if (error) {
    return (
      <main className="seat-page seat-center seat-error">
        {error?.response?.data?.message ||
          error?.message ||
          "Không tải được sơ đồ ghế."}
      </main>
    );
  }

  return (
    <main className="seat-page">
      <section className="seat-area">
        <div className="seat-movie-head">
          <h1>{movie?.title || showtime?.movieTitle || "Chọn ghế"}</h1>

          <div className="seat-meta">
            <span>
              📅 {formatTime(showtime?.startTime)} -{" "}
              {formatDate(showtime?.startTime)}
            </span>
            <i />
            <span>📍 {showtime?.cinemaName || "Rạp chiếu"}</span>
            <i />
            <span>
              🎭{" "}
              {showtime?.roomName ||
                normalizeRoomType(showtime?.roomType || showtime?.format)}
            </span>
          </div>
        </div>

        <div className="screen-wrap">
          <div className="screen-label">Màn Hình</div>
          <div className="cinema-screen" />
          <div className="screen-light" />
        </div>

        <div className="seat-map-wrap">
          {rows.map((row) => (
            <div className="seat-row" key={row.rowLabel}>
              <span className="row-label">{row.rowLabel}</span>

              <div className="seat-row-grid">
                {row.seats.map((seat) => {
                  const selected = selectedSeatIds.has(seat.id);
                  const disabled = !canChooseSeat(seat);

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      className={getSeatClass(seat)}
                      disabled={disabled}
                      title={`${seat.seatCode} - ${
                        seat.seatType
                      } - ${formatMoney(
                        basePrice + Number(seat.extraFee || 0)
                      )}`}
                      onClick={() => handleToggleSeat(seat)}
                    >
                      {seat.status === "BOOKED"
                        ? "✕"
                        : seat.status === "LOCKED" && !seat.lockedByMe
                        ? "🔒"
                        : selected
                        ? seat.seatCode
                        : ""}
                    </button>
                  );
                })}
              </div>

              <span className="row-label right">{row.rowLabel}</span>
            </div>
          ))}
        </div>

        <div className="seat-legend glass-panel">
          <div>
            <span className="legend-box available" /> Có sẵn
          </div>
          <div>
            <span className="legend-box selected" /> Đang chọn
          </div>
          <div>
            <span className="legend-box booked">✕</span>
            Đã bán
          </div>
          <div>
            <span className="legend-box couple" /> Ghế đôi
          </div>
          <div>
            <span className="legend-box locked" /> Giữ chỗ
          </div>
        </div>
      </section>

      <aside className="seat-summary glass-panel">
        <div className="summary-poster">
          <img
            src={movie?.posterUrl || showtime?.moviePoster || FALLBACK_POSTER}
            alt={movie?.title || "Poster"}
          />
          <div className="poster-overlay" />
          <div className="poster-title">
            <span>Now Showing</span>
            <h2>{movie?.title || showtime?.movieTitle || "Cinema"}</h2>
          </div>
        </div>

        <div className="summary-content">
          <div className="summary-selected">
            <div>
              <p>Ghế đã chọn</p>
              <div className="selected-seat-list">
                {selectedSeats.length > 0 ? (
                  selectedSeats.map((seat) => (
                    <span key={seat.id}>{seat.seatCode}</span>
                  ))
                ) : (
                  <em>Chưa chọn ghế</em>
                )}
              </div>
            </div>

            <div className="ticket-type">
              <p>Loại vé</p>
              <strong>
                {selectedSeats.some((seat) => seat.seatType === "VIP")
                  ? `Ghế đôi (x${selectedSeats.length})`
                  : `Standard (x${selectedSeats.length})`}
              </strong>
            </div>
          </div>

          <div className="divider" />

          <div className="price-list">
            <div>
              <span>Giá vé cơ bản</span>
              <strong>{formatMoney(basePrice * selectedSeats.length)}</strong>
            </div>
            <div>
              <span>Phụ phí ghế</span>
              <strong>{formatMoney(extraFeeTotal)}</strong>
            </div>
            <div>
              <span>Giảm giá voucher</span>
              <strong className="discount">-{formatMoney(discountAmount)}</strong>
            </div>
          </div>

          <div className="voucher-row">
            <input
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              placeholder="Nhập mã voucher..."
            />
            <button type="button" onClick={handleApplyVoucher}>
              Áp dụng
            </button>
          </div>

          <div className="divider" />

          <div className="total-row">
            <span>Tổng cộng</span>
            <div>
              <strong>{formatMoney(finalTotal)}</strong>
              <small>Giá đã bao gồm VAT</small>
            </div>
          </div>

          {selectedSeats.length > 0 && (
            <p className="policy-text">
              Thời gian giữ ghế: {formatCountdown(countdown)}
            </p>
          )}

          <button
            type="button"
            className="checkout-btn"
            disabled={selectedSeats.length === 0 || submitting}
            onClick={handleCheckout}
          >
            {submitting ? "ĐANG XỬ LÝ..." : "THANH TOÁN →"}
          </button>

          <p className="policy-text">
            Bằng cách nhấn thanh toán, bạn đồng ý với các Điều khoản & Chính
            sách của Cine Luxe Premiere.
          </p>
        </div>
      </aside>
    </main>
  );
}