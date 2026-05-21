// ─── VALIDATION ──────────────────────────────────────────────────────────────

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validate số điện thoại Việt Nam (10 số, bắt đầu bằng 0)
 */
export const isValidPhone = (phone) => {
  return /^(0[3|5|7|8|9])+([0-9]{8})$/.test(phone);
};

/**
 * Validate password (tối thiểu 6 ký tự)
 */
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// ─── STRING ───────────────────────────────────────────────────────────────────

/**
 * Truncate string dài, thêm "..."
 * @example truncate("Hello World", 5) → "Hello..."
 */
export const truncate = (str, maxLength = 100) => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trim() + '...';
};

/**
 * Capitalize chữ cái đầu
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Tạo initials từ full name (dùng cho avatar fallback)
 * @example getInitials("Nguyen Van A") → "NA"
 */
export const getInitials = (fullName) => {
  if (!fullName) return '?';
  const parts = fullName.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// ─── ARRAY / OBJECT ───────────────────────────────────────────────────────────

/**
 * Group mảng ghế theo rowLabel để render seat map
 * @param {Array} seats
 * @returns {Object} { A: [...], B: [...], ... }
 */
export const groupSeatsByRow = (seats = []) => {
  return seats.reduce((acc, seat) => {
    const row = seat.rowLabel;
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    // Sort theo colNumber
    acc[row].sort((a, b) => a.colNumber - b.colNumber);
    return acc;
  }, {});
};

/**
 * Sort object keys theo alphabet (để rows hiển thị theo đúng thứ tự A, B, C...)
 */
export const sortedKeys = (obj) => {
  return Object.keys(obj).sort();
};

/**
 * Tính tổng giá từ danh sách ghế đã chọn và showtime base_price
 * @param {Array} selectedSeats - [{ extraFee, ... }]
 * @param {number} basePrice
 * @returns {number}
 */
export const calcTotalPrice = (selectedSeats = [], basePrice = 0) => {
  return selectedSeats.reduce((total, seat) => {
    return total + basePrice + (seat.extraFee || 0);
  }, 0);
};

/**
 * Tính giá sau khi áp voucher
 * @param {number} totalPrice
 * @param {{ discountType, discountValue, maxDiscount }} voucher
 * @returns {{ discountAmount, finalPrice }}
 */
export const applyVoucher = (totalPrice, voucher) => {
  if (!voucher) return { discountAmount: 0, finalPrice: totalPrice };

  let discountAmount = 0;

  if (voucher.discountType === 'PERCENT') {
    discountAmount = Math.floor((totalPrice * voucher.discountValue) / 100);
    if (voucher.maxDiscount) {
      discountAmount = Math.min(discountAmount, voucher.maxDiscount);
    }
  } else if (voucher.discountType === 'FIXED') {
    discountAmount = voucher.discountValue;
  }

  discountAmount = Math.min(discountAmount, totalPrice);
  const finalPrice = totalPrice - discountAmount;

  return { discountAmount, finalPrice };
};

// ─── URL / NAVIGATION ─────────────────────────────────────────────────────────

/**
 * Lấy query param từ URL hiện tại
 * @example getQueryParam('code') → "ABC123"
 */
export const getQueryParam = (key) => {
  return new URLSearchParams(window.location.search).get(key);
};

/**
 * Build URL với query params từ object
 * @example buildUrl('/movies', { page: 1, size: 12 }) → "/movies?page=1&size=12"
 */
export const buildUrl = (path, params = {}) => {
  const query = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return query ? `${path}?${query}` : path;
};

// ─── IMAGE ────────────────────────────────────────────────────────────────────

/**
 * Fallback khi poster_url bị lỗi hoặc null
 */
export const getPosterUrl = (url) => {
  if (!url) return '/placeholder-poster.jpg';
  return url;
};

/**
 * Xử lý lỗi load ảnh — set về placeholder
 */
export const handleImageError = (e) => {
  e.target.src = '/placeholder-poster.jpg';
  e.target.onerror = null; // tránh loop vô hạn
};

// ─── MISC ─────────────────────────────────────────────────────────────────────

/**
 * Delay (dùng trong async/await)
 * @example await sleep(500)
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Kiểm tra user có role cụ thể không
 * @param {Object} user - { roles: ["ROLE_USER", ...] }
 * @param {string} role - "ROLE_ADMIN"
 */
export const hasRole = (user, role) => {
  if (!user || !user.roles) return false;
  return user.roles.includes(role);
};

/**
 * Kiểm tra token còn hạn không (decode payload JWT, không verify signature)
 * @param {string} token
 * @returns {boolean}
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

/**
 * Copy text vào clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

/**
 * Generate màu ngẫu nhiên từ string (dùng cho avatar fallback bg)
 * @example stringToColor("Nguyen Van A") → "#3a8fd1"
 */
export const stringToColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 45%)`;
};