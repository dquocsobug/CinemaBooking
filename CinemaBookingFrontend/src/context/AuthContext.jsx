import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api";
import { storage } from "../utils/storage";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(storage.getUser());
  const [loading, setLoading] = useState(false);

  const login = async (values) => {
    try {
      setLoading(true);

      const res = await authApi.login(values);
      const data = res.data;

      storage.setAccessToken(data.accessToken);
      storage.setRefreshToken(data.refreshToken);
      storage.setUser(data.user);

      setUser(data.user);

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Đăng nhập thất bại",
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (values) => {
    try {
      setLoading(true);

      const res = await authApi.register(values);
      const data = res.data;

      storage.setAccessToken(data.accessToken);
      storage.setRefreshToken(data.refreshToken);
      storage.setUser(data.user);

      setUser(data.user);

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Đăng ký thất bại",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    storage.clear();
    setUser(null);
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const currentUser = storage.getUser();

    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;