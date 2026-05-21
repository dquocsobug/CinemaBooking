import axiosClient from "./axiosClient";

const reviewApi = {
  getReviewsByMovie: (movieId, page = 0, size = 10) => {
    return axiosClient.get(`/reviews/movie/${movieId}`, {
      params: { page, size },
    });
  },

  createReview: (payload) => {
    return axiosClient.post("/reviews", payload);
  },
};

export default reviewApi;