import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { paymentApi } from "../api";
import "./PaymentPage.css";

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN") + "đ";
}
const PAYMENT_METHODS = [
  {
    code: "MOMO",
    name: "MoMo",
    description: "Thanh toán qua ví điện tử MoMo",
    logo: "https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Square.png",
  },
  {
    code: "VNPAY",
    name: "VNPay",
    description: "Thanh toán qua ngân hàng và QR",
    logo: "https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR.png",
  },
];

function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const booking = location.state?.booking;
  const movie = location.state?.movie;
  const seats = location.state?.seats || booking?.seats || [];
  const finalPrice = location.state?.finalPrice || booking?.finalPrice || 0;
  const totalPrice = location.state?.totalPrice || booking?.totalPrice || finalPrice;
  const discountAmount = location.state?.discountAmount || booking?.discountAmount || 0;

  const [selectedMethod, setSelectedMethod] = useState("MOMO");
  const [loadingMethod, setLoadingMethod] = useState("");
  const [error, setError] = useState("");

  const bookingId = booking?.id;

  const seatText = useMemo(() => {
    if (!seats.length) return "Chưa có ghế";
    return seats.map((seat) => seat.seatCode).join(", ");
  }, [seats]);

  const createPayment = async () => {
    try {
      setError("");

      if (!bookingId) {
        setError("Không tìm thấy thông tin booking. Vui lòng quay lại chọn ghế.");
        return;
      }

      setLoadingMethod(selectedMethod);

      const response = await paymentApi.initiate({
        bookingId,
        method: selectedMethod,
      });
      const paymentUrl = response?.data?.paymentUrl;

      if (!paymentUrl) {
        setError(`Không lấy được link thanh toán ${selectedMethod}.`);
        return;
      }

      window.location.href = paymentUrl;
    } catch (error) {
      console.error("Create payment error:", error);
      setError(error.message || `Tạo thanh toán ${selectedMethod} thất bại`);
    } finally {
      setLoadingMethod("");
    }
  };

  if (!booking) {
    return (
      <main className="payment-page payment-page--center">
        <section className="payment-empty payment-panel">
          <span className="material-symbols-outlined">receipt_long</span>
          <h1>Không tìm thấy booking</h1>
          <p>Vui lòng quay lại chọn suất chiếu và ghế trước khi thanh toán.</p>
          <Link to="/movies">Chọn phim ngay</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="payment-page">
      <section className="payment-checkout">
        <header className="payment-header">
          <div>
            <span className="payment-kicker">Secure Checkout</span>
            <h1>Thanh toán đơn hàng</h1>
            <p>Kiểm tra thông tin vé và chọn phương thức thanh toán phù hợp.</p>
          </div>

          <button className="payment-back" type="button" onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined">arrow_back</span>
            Quay lại
          </button>
        </header>

        <div className="payment-steps">
          <div className="payment-step payment-step--done">
            <span className="material-symbols-outlined">event_seat</span>
            <p>Chọn ghế</p>
          </div>
          <i />
          <div className="payment-step payment-step--done">
            <span className="material-symbols-outlined">receipt_long</span>
            <p>Tạo booking</p>
          </div>
          <i />
          <div className="payment-step payment-step--active">
            <span className="material-symbols-outlined">payments</span>
            <p>Thanh toán</p>
          </div>
          <i />
          <div className="payment-step">
            <span className="material-symbols-outlined">qr_code_2</span>
            <p>Nhận vé</p>
          </div>
        </div>

        <section className="payment-grid">
          <div className="payment-main">
            <article className="payment-panel payment-order-card">
              <div className="payment-panel-title">
                <span className="material-symbols-outlined">movie</span>
                <div>
                  <h2>Thông tin vé</h2>
                  <p>Mã booking #{booking.bookingCode || "N/A"}</p>
                </div>
              </div>

              <div className="payment-ticket">
                <div className="payment-poster">
                  <img
                    src={
                      movie?.posterUrl ||
                      booking?.showtime?.moviePoster ||
                      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80"
                    }
                    alt={movie?.title || booking?.showtime?.movieTitle || "Movie poster"}
                  />
                  <span>{booking.status || "PENDING"}</span>
                </div>

                <div className="payment-ticket-info">
                  <h3>{movie?.title || booking?.showtime?.movieTitle || "Cinema Movie"}</h3>

                  <div className="payment-info-grid">
                    <div>
                      <span className="material-symbols-outlined">event_seat</span>
                      <p>Ghế đã chọn</p>
                      <strong>{seatText}</strong>
                    </div>

                    <div>
                      <span className="material-symbols-outlined">confirmation_number</span>
                      <p>Số lượng</p>
                      <strong>{seats.length || 0} vé</strong>
                    </div>

                    <div>
                      <span className="material-symbols-outlined">schedule</span>
                      <p>Suất chiếu</p>
                      <strong>{booking?.showtime?.startTime ? new Date(booking.showtime.startTime).toLocaleString("vi-VN") : "Chưa cập nhật"}</strong>
                    </div>

                    <div>
                      <span className="material-symbols-outlined">meeting_room</span>
                      <p>Phòng chiếu</p>
                      <strong>{booking?.showtime?.roomName || "Chưa cập nhật"}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article className="payment-panel">
              <div className="payment-panel-title">
                <span className="material-symbols-outlined">account_balance_wallet</span>
                <div>
                  <h2>Phương thức thanh toán</h2>
                  <p>Chọn cổng thanh toán để tiếp tục.</p>
                </div>
              </div>

              <div className="payment-methods">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.code}
                    type="button"
                    className={`payment-method ${
                      selectedMethod === method.code
                        ? "payment-method--active"
                        : ""
                    }`}
                    onClick={() => setSelectedMethod(method.code)}
                  >
                    <div className="payment-method-logo">
                      <img src={method.logo} alt={method.name} />
                    </div>

                    <div className="payment-method-content">
                      <h3>{method.name}</h3>
                      <p>{method.description}</p>
                    </div>

                    <span className="material-symbols-outlined payment-radio">
                      {selectedMethod === method.code
                        ? "check_circle"
                        : "radio_button_unchecked"}
                    </span>
                  </button>
                ))}
              </div>

              {error && (
                <div className="payment-error">
                  <span className="material-symbols-outlined">error</span>
                  {error}
                </div>
              )}
            </article>
          </div>

          <aside className="payment-summary payment-panel">
            <div className="payment-summary-top">
              <span className="material-symbols-outlined">verified_user</span>
              <div>
                <h2>Tóm tắt thanh toán</h2>
                <p>Giao dịch được mã hóa và bảo mật.</p>
              </div>
            </div>

            <div className="payment-price-list">
              <div>
                <span>Tạm tính</span>
                <strong>{formatMoney(totalPrice)}</strong>
              </div>
              <div>
                <span>Giảm giá</span>
                <strong className="payment-discount">-{formatMoney(discountAmount)}</strong>
              </div>
              <div>
                <span>Phương thức</span>
                <strong>{selectedMethod}</strong>
              </div>
              <div>
                <span>Mã booking</span>
                <strong>#{booking.bookingCode || "N/A"}</strong>
              </div>
            </div>

            <div className="payment-total">
              <span>Cần thanh toán</span>
              <strong>{formatMoney(finalPrice)}</strong>
            </div>

            <button
              type="button"
              className="payment-submit"
              onClick={createPayment}
              disabled={Boolean(loadingMethod)}
            >
              {loadingMethod ? (
                <>
                  <span className="material-symbols-outlined payment-spin">sync</span>
                  Đang chuyển cổng thanh toán...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">lock</span>
                  Thanh toán {formatMoney(finalPrice)}
                </>
              )}
            </button>

            <div className="payment-security">
              <div>
                <span className="material-symbols-outlined">shield_lock</span>
                Bảo mật SSL
              </div>
              <div>
                <span className="material-symbols-outlined">bolt</span>
                Xử lý tức thì
              </div>
            </div>

            <p className="payment-note">
              Sau khi thanh toán thành công, vé QR sẽ được lưu trong lịch sử đặt vé của bạn.
            </p>
          </aside>
        </section>
      </section>
    </main>
  );
}

export default PaymentPage;
