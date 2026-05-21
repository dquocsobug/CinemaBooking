import axiosClient from "./axiosClient";

const movieApi = {
  getNowShowing: (params) => {
    return axiosClient.get("/movies/now-showing", { params });
  },

  getMovieDetail: (slug) => {
    return axiosClient.get(`/movies/${slug}`);
  },

  searchMovies: (q) => {
    return axiosClient.get("/movies/search", { params: { q } });
  },
};

export default movieApi;