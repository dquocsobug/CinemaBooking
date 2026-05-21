import axiosClient from "./axiosClient";

const showtimeApi = {
  getShowtimes: (params) => {
    return axiosClient.get("/showtimes", { params });
  },

  getShowtimeSeatMap: (showtimeId) => {
    return axiosClient.get(`/showtimes/${showtimeId}/seat-map`);
  },
};

export default showtimeApi;