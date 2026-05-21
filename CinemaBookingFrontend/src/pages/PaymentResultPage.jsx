import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";
import "./PaymentResultPage.css";

async function confirmMomoPayment(queryString) {
  const response = await axiosClient.get(
    `/payments/return/momo?${queryString}`
  );

  return response?.data;
}

function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const queryString = useMemo(
    () => searchParams.toString(),
    [searchParams]
  );

  const resultCode = searchParams.get("resultCode");

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["payment-return", queryString],
    queryFn: () => confirmMomoPayment(queryString),
    enabled: resultCode === "0" && !!queryString,
    staleTime: Infinity,
    retry: 0,
  });

  const isSuccess =
    resultCode === "0" && data?.status === "SUCCESS";

  useEffect(() => {
    if (!isSuccess) return;

    queryClient.invalidateQueries({
      queryKey: ["booking-history"],
    });

    const timer = setTimeout(() => {
      navigate("/booking-history", {
        replace: true,
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [isSuccess, navigate, queryClient]);

  let status = "PROCESSING";
  let message = "Đang xác nhận thanh toán...";

  if (resultCode && resultCode !== "0") {
    status = "FAILED";
    message = "Thanh toán chưa hoàn tất hoặc đã bị hủy.";
  } else if (error) {
    status = "FAILED";
    message =
      error?.response?.data?.message ||
      error.message ||
      "Không thể xác nhận thanh toán.";
  } else if (isSuccess) {
    status = "SUCCESS";
    message =
      "Thanh toán thành công. Đang chuyển đến lịch sử đặt vé...";
  } else if (!isLoading && data?.status !== "SUCCESS") {
    status = "FAILED";
    message = "Backend chưa xác nhận được thanh toán.";
  }

  return (
    <main className="payment-result-page">
      <div className="payment-result-card">
        <h2>Kết quả thanh toán</h2>

        <p>{message}</p>

        <p>
          <strong>Trạng thái:</strong> {status}
        </p>

        {status === "PROCESSING" && (
          <div className="payment-loading">
            <span className="material-symbols-outlined payment-spin">
              sync
            </span>
          </div>
        )}
      </div>
    </main>
  );
}

export default PaymentResultPage;