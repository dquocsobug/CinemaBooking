// ─── CURRENCY ────────────────────────────────────────────────────────────────

/**
 * Format số thành tiền VND
 * @example formatCurrency(75000) → "75.000 ₫"
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format số ngắn gọn không có ký hiệu tiền tệ
 * @example formatNumber(75000) → "75.000"
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined) return '0';
  return new Intl.NumberFormat('vi-VN').format(number);
};

// ─── DATE & TIME ─────────────────────────────────────────────────────────────

/**
 * Format ISO string → "HH:mm"
 * @example formatTime("2026-05-16T12:30:00Z") → "19:30" (UTC+7)
 */
export const formatTime = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  });
};

/**
 * Format ISO string → "dd/MM/yyyy"
 * @example formatDate("2026-05-16T00:00:00Z") → "16/05/2026"
 */
export const formatDate = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
};

/**
 * Format ISO string → "HH:mm - dd/MM/yyyy"
 */
export const formatDateTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const time = date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  });
  const day = date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
  return `${time} - ${day}`;
};

/**
 * Format "yyyy-MM-dd" string (từ date input) → "dd/MM/yyyy" để hiển thị
 */
export const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Lấy ngày hiện tại theo format "yyyy-MM-dd" (dùng làm default cho date picker)
 */
export const getTodayStr = () => {
  const now = new Date();
  const tzOffset = 7 * 60; // UTC+7
  const local = new Date(now.getTime() + tzOffset * 60 * 1000);
  return local.toISOString().slice(0, 10);
};

/**
 * Tạo mảng N ngày tiếp theo từ hôm nay (dùng cho tab chọn ngày chiếu)
 * @returns [{ value: "2026-05-16", label: "Hôm nay", dayName: "Thứ Sáu" }, ...]
 */
export const getNextDays = (n = 7) => {
  const days = [];
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  for (let i = 0; i < n; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    days.push({
      value: `${yyyy}-${MM}-${dd}`,
      label: i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : `${dd}/${MM}`,
      dayName: dayNames[date.getDay()],
    });
  }

  return days;
};

// ─── MOVIE ───────────────────────────────────────────────────────────────────

/**
 * Format thời lượng phim từ phút
 * @example formatDuration(125) → "2h 05p"
 */
export const formatDuration = (minutes) => {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}p`;
  return `${h}h ${String(m).padStart(2, '0')}p`;
};

/**
 * Map age rating code → badge text + color class
 */
export const formatAgeRating = (code) => {
  const map = {
    P: { label: 'P', colorClass: 'age-p', title: 'Mọi lứa tuổi' },
    K: { label: 'K', colorClass: 'age-k', title: 'Dưới 13 tuổi, có phụ huynh' },
    T13: { label: '13+', colorClass: 'age-t13', title: 'Từ 13 tuổi trở lên' },
    T16: { label: '16+', colorClass: 'age-t16', title: 'Từ 16 tuổi trở lên' },
    T18: { label: '18+', colorClass: 'age-t18', title: 'Từ 18 tuổi trở lên' },
  };
  return map[code] || { label: code || 'N/A', colorClass: 'age-default', title: '' };
};

/**
 * Map movie status → label tiếng Việt
 */
export const formatMovieStatus = (status) => {
  const map = {
    NOW_SHOWING: 'Đang chiếu',
    COMING_SOON: 'Sắp chiếu',
    ENDED: 'Đã kết thúc',
  };
  return map[status] || status;
};

// ─── BOOKING ─────────────────────────────────────────────────────────────────

/**
 * Map booking status → label + class CSS
 */
export const formatBookingStatus = (status) => {
  const map = {
    PENDING: { label: 'Chờ thanh toán', colorClass: 'status-pending' },
    CONFIRMED: { label: 'Đã xác nhận', colorClass: 'status-confirmed' },
    CANCELLED: { label: 'Đã hủy', colorClass: 'status-cancelled' },
    EXPIRED: { label: 'Hết hạn', colorClass: 'status-expired' },
  };
  return map[status] || { label: status, colorClass: '' };
};

/**
 * Map seat type → label tiếng Việt
 */
export const formatSeatType = (type) => {
  const map = {
    STANDARD: 'Thường',
    VIP: 'VIP',
    COUPLE: 'Đôi',
    WHEELCHAIR: 'Xe lăn',
  };
  return map[type] || type;
};

/**
 * Map payment method → label
 */
export const formatPaymentMethod = (method) => {
  const map = {
    MOMO: 'MoMo',
    VNPAY: 'VNPay',
    ZALOPAY: 'ZaloPay',
    CREDIT_CARD: 'Thẻ tín dụng',
    CASH: 'Tiền mặt',
  };
  return map[method] || method;
};

// ─── ROOM TYPE ────────────────────────────────────────────────────────────────

export const formatRoomType = (type) => {
  const map = {
    '2D': '2D',
    TWO_D: '2D',
    '3D': '3D',
    THREE_D: '3D',
    IMAX: 'IMAX',
    '4DX': '4DX',
    SCREENX: 'ScreenX',
  };
  return map[type] || type;
};

// ─── COUNTDOWN ───────────────────────────────────────────────────────────────

/**
 * Tính số giây còn lại tính từ bây giờ đến ISO expires time
 * @returns number (giây), 0 nếu đã hết hạn
 */
export const calcSecondsLeft = (expiresAt) => {
  if (!expiresAt) return 0;
  const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
  return Math.max(0, diff);
};

/**
 * Format giây → "mm:ss"
 * @example formatCountdown(245) → "04:05"
 */
export const formatCountdown = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};