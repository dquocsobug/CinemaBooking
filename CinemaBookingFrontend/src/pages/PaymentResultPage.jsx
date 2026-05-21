import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import "./PaymentResultPage.css";

function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("PROCESSING");
  const [message, setMessage] = useState("Đang xác nhận thanh toán...");

  const queryString = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const resultCode = searchParams.get("resultCode");

        if (resultCode !== "0") {
          setStatus("FAILED");
          setMessage("Thanh toán chưa hoàn tất hoặc đã bị hủy.");
          return;
        }

        const response = await axiosClient.get(
          `/payments/return/momo?${queryString}`
        );

        if (response?.data?.status === "SUCCESS") {
          setStatus("SUCCESS");
          setMessage("Thanh toán thành công. Vé của bạn đã được xác nhận.");
        } else {
          setStatus("FAILED");
          setMessage("Backend chưa xác nhận được thanh toán.");
        }
      } catch (error) {
        console.error(error);
        setStatus("FAILED");
        setMessage(error.message || "Không thể xác nhận thanh toán.");
      }
    };

    confirmPayment();
  }, [queryString, searchParams]);

  return (
    <main className="payment-result-page">
      <div className="payment-result-card">
        <h2>Kết quả thanh toán</h2>

        <p>{message}</p>

        <p>
          <strong>Trạng thái:</strong> {status}
        </p>

        <div className="payment-result-actions">
          <Link to="/" className="home-btn">
            Về trang chủ
          </Link>

          <Link to="/my-bookings" className="booking-btn">
            Vé của tôi
          </Link>
        </div>
      </div>
    </main>
  );
}

export default PaymentResultPage;