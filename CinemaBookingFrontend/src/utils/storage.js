export const storage = {
  setAccessToken: (token) => {
    localStorage.setItem("accessToken", token);
  },

  getAccessToken: () => {
    return localStorage.getItem("accessToken");
  },

  setRefreshToken: (token) => {
    localStorage.setItem("refreshToken", token);
  },

  getRefreshToken: () => {
    return localStorage.getItem("refreshToken");
  },

  setUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
  },

  getUser: () => {
    const user = localStorage.getItem("user");

    return user ? JSON.parse(user) : null;
  },

  clear: () => {
    localStorage.clear();
  },
};