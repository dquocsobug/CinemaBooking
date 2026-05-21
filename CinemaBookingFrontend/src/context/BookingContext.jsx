import { createContext, useContext, useState, useCallback } from 'react';
import { bookingApi, paymentApi, voucherApi } from '../api';
import { calcTotalPrice, applyVoucher } from '../utils/helpers';

export const BookingContext = createContext();

/**
 * BookingProvider — quản lý toàn bộ flow:
 * Chọn suất chiếu → Chọn ghế → Lock ghế → Tạo booking → Thanh toán
 */
export const BookingProvider = ({ children }) => {
  // ── Suất chiếu đang chọn ────────────────────────────────────────────────
  const [selectedShowtime, setSelectedShowtime] = useState(null);

  // ── Ghế đang chọn (trên seat map) ──────────────────────────────────────
  const [selectedSeats, setSelectedSeats] = useState([]);

  // ── Voucher ─────────────────────────────────────────────────────────────
  const [voucher, setVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);

  // ── Booking vừa tạo ─────────────────────────────────────────────────────
  const [currentBooking, setCurrentBooking] = useState(null);

  // ── Payment ─────────────────────────────────────────────────────────────
  const [currentPayment, setCurrentPayment] = useState(null);

  // ── Loading / Error chung ───────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── COMPUTED ─────────────────────────────────────────────────────────────
  const basePrice = selectedShowtime?.basePrice || 0;
  const totalPrice = calcTotalPrice(selectedSeats, basePrice);
  const { discountAmount, finalPrice } = applyVoucher(totalPrice, voucher);

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────────────────────────

  /** Chọn / bỏ chọn ghế (toggle) */
  const toggleSeat = useCallback((seat) => {
    setSelectedSeats((prev) => {
      const exists = prev.find((s) => s.id === seat.id);
      if (exists) {
        return prev.filter((s) => s.id !== seat.id);
      }
      return [...prev, seat];
    });
  }, []);

  /** Clear toàn bộ ghế đã chọn */
  const clearSeats = useCallback(() => {
    setSelectedSeats([]);
  }, []);

  /** Set showtime — reset ghế + voucher khi đổi suất */
  const selectShowtime = useCallback((showtime) => {
    setSelectedShowtime(showtime);
    setSelectedSeats([]);
    setVoucher(null);
    setVoucherError('');
    setCurrentBooking(null);
    setCurrentPayment(null);
  }, []);

  /** Validate & apply voucher */
  const applyVoucherCode = useCallback(async (code) => {
    if (!code?.trim()) {
      setVoucher(null);
      setVoucherError('');
      return;
    }

    setVoucherLoading(true);
    setVoucherError('');

    try {
      const res = await voucherApi.validateVoucher(code.trim());
      setVoucher(res.data);
    } catch (err) {
      setVoucher(null);
      setVoucherError(
        err.response?.data?.message || 'Mã voucher không hợp lệ hoặc đã hết hạn'
      );
    } finally {
      setVoucherLoading(false);
    }
  }, []);

  /** Bỏ voucher */
  const removeVoucher = useCallback(() => {
    setVoucher(null);
    setVoucherError('');
  }, []);

  /**
   * STEP 1: Lock ghế tạm thời trên Redis (5 phút)
   * @returns {{ success: boolean, message?: string }}
   */
  const lockSeats = useCallback(async () => {
    if (!selectedShowtime || selectedSeats.length === 0) {
      return { success: false, message: 'Vui lòng chọn ghế' };
    }

    setLoading(true);
    setError('');

    try {
      const res = await bookingApi.lockSeats({
        showtimeId: selectedShowtime.id,
        seatIds: selectedSeats.map((s) => s.id),
      });

      // res.data = mảng seatId đã lock thành công
      return { success: true, lockedSeatIds: res.data };
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể giữ ghế, vui lòng thử lại';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [selectedShowtime, selectedSeats]);

  /**
   * STEP 2: Tạo booking (sau khi lock thành công)
   * @returns {{ success: boolean, booking?, message?: string }}
   */
  const createBooking = useCallback(async () => {
    if (!selectedShowtime || selectedSeats.length === 0) {
      return { success: false, message: 'Thiếu thông tin đặt vé' };
    }

    setLoading(true);
    setError('');

    try {
      const res = await bookingApi.createBooking({
        showtimeId: selectedShowtime.id,
        seatIds: selectedSeats.map((s) => s.id),
        voucherCode: voucher?.code || null,
      });

      setCurrentBooking(res.data);
      return { success: true, booking: res.data };
    } catch (err) {
      const msg = err.response?.data?.message || 'Tạo booking thất bại';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [selectedShowtime, selectedSeats, voucher]);

  /**
   * STEP 3: Khởi tạo thanh toán
   * @param {string} method - "MOMO" | "VNPAY" | ...
   * @returns {{ success: boolean, payment?, message?: string }}
   */
  const initiatePayment = useCallback(
    async (method) => {
      if (!currentBooking) {
        return { success: false, message: 'Chưa có booking' };
      }

      setLoading(true);
      setError('');

      try {
        const res = await paymentApi.initiatePayment({
          bookingId: currentBooking.id,
          method,
        });

        setCurrentPayment(res.data);
        return { success: true, payment: res.data };
      } catch (err) {
        const msg = err.response?.data?.message || 'Khởi tạo thanh toán thất bại';
        setError(msg);
        return { success: false, message: msg };
      } finally {
        setLoading(false);
      }
    },
    [currentBooking]
  );

  /** Reset toàn bộ booking state (sau khi thanh toán xong hoặc hủy) */
  const resetBooking = useCallback(() => {
    setSelectedShowtime(null);
    setSelectedSeats([]);
    setVoucher(null);
    setVoucherError('');
    setCurrentBooking(null);
    setCurrentPayment(null);
    setError('');
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <BookingContext.Provider
      value={{
        // State
        selectedShowtime,
        selectedSeats,
        voucher,
        voucherError,
        voucherLoading,
        currentBooking,
        currentPayment,
        loading,
        error,

        // Computed
        basePrice,
        totalPrice,
        discountAmount,
        finalPrice,

        // Actions
        selectShowtime,
        toggleSeat,
        clearSeats,
        applyVoucherCode,
        removeVoucher,
        lockSeats,
        createBooking,
        initiatePayment,
        resetBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

/** Hook tiện lợi để dùng BookingContext */
export const useBooking = () => {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
};

export default BookingProvider;