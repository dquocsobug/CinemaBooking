import axiosClient from "./axiosClient";

export const authApi = {
  register: (data) => {
    return axiosClient.post("/auth/register", data);
  },

  login: (data) => {
    return axiosClient.post("/auth/login", data);
  },
};

export const movieApi = {
  getNowShowing: (params) => {
    return axiosClient.get("/movies/now-showing", {
      params,
    });
  },

  getMovieDetail: (slug) => {
    return axiosClient.get(`/movies/${slug}`);
  },

  searchMovies: (q) => {
    return axiosClient.get("/movies/search", {
      params: { q },
    });
  },
};

export const showtimeApi = {
  getShowtimes: (movieId, date) => {
    return axiosClient.get("/showtimes", {
      params: {
        movieId,
        date,
      },
    });
  },

  getSeatMap: (showtimeId) => {
    return axiosClient.get(`/showtimes/${showtimeId}/seat-map`);
  },
};

export const bookingApi = {
  lockSeats: (data) => {
    return axiosClient.post("/bookings/lock-seats", data);
  },

  createBooking: (data) => {
    return axiosClient.post("/bookings", data);
  },

  getBookings: (params) => {
    return axiosClient.get("/bookings", {
      params,
    });
  },
};

export const paymentApi = {
  initiate: (data) => axiosClient.post("/payments/initiate", data),

  payWithMomo: async (bookingId) => {
    const response = await axiosClient.post("/payments/initiate", {
      bookingId,
      method: "MOMO",
    });

    const paymentUrl = response?.data?.paymentUrl;

    if (paymentUrl) {
      window.location.href = paymentUrl;
    }

    return response;
  },

  payWithVnpay: async (bookingId) => {
    const response = await axiosClient.post("/payments/initiate", {
      bookingId,
      method: "VNPAY",
    });

    const paymentUrl = response?.data?.paymentUrl;

    if (paymentUrl) {
      window.location.href = paymentUrl;
    }

    return response;
  },
};

export const voucherApi = {
  validateVoucher: (code) => {
    return axiosClient.get("/vouchers/validate", {
      params: { code },
    });
  },
};

export const reviewApi = {
  createReview: (data) => {
    return axiosClient.post("/reviews", data);
  },
};