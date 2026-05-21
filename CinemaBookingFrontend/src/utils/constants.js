// ===============================
// API CONFIG
// ===============================
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/api/v1";

// ===============================
// STORAGE KEYS
// ===============================
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
};

// ===============================
// USER ROLES
// ===============================
export const USER_ROLES = {
  USER: "ROLE_USER",
  ADMIN: "ROLE_ADMIN",
  STAFF: "ROLE_STAFF",
};

// ===============================
// MOVIE STATUS
// ===============================
export const MOVIE_STATUS = {
  COMING_SOON: "COMING_SOON",
  NOW_SHOWING: "NOW_SHOWING",
  ENDED: "ENDED",
};

// ===============================
// SHOWTIME STATUS
// ===============================
export const SHOWTIME_STATUS = {
  SCHEDULED: "SCHEDULED",
  OPEN: "OPEN",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
};

// ===============================
// SEAT STATUS (Redis + Backend sync)
// ===============================
export const SEAT_STATUS = {
  AVAILABLE: "AVAILABLE",
  LOCKED: "LOCKED",
  BOOKED: "BOOKED",
};

// ===============================
// BOOKING STATUS
// ===============================
export const BOOKING_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
};

// ===============================
// PAYMENT METHODS
// ===============================
export const PAYMENT_METHOD = {
  MOMO: "MOMO",
  VNPAY: "VNPAY",
  ZALOPAY: "ZALOPAY",
  CASH: "CASH",
};

// ===============================
// PAYMENT STATUS
// ===============================
export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
};