import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api";
import { storage } from "../utils/storage";
import "./RegisterPage.css";

function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agree: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return "Vui lòng nhập họ và tên";
    if (!formData.email.trim()) return "Vui lòng nhập email";
    if (!formData.phone.trim()) return "Vui lòng nhập số điện thoại";
    if (formData.password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
    if (formData.password !== formData.confirmPassword) return "Mật khẩu xác nhận không khớp";
    if (!formData.agree) return "Bạn cần đồng ý với điều khoản sử dụng";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const message = validateForm();
    if (message) {
      setError(message);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await authApi.register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      });

      const registerData = res.data;

      if (registerData?.accessToken) {
        storage.setAccessToken(registerData.accessToken);
      }
      if (registerData?.refreshToken) {
        storage.setRefreshToken(registerData.refreshToken);
      }
      if (registerData?.user) {
        storage.setUser(registerData.user);
      }

      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "Đăng ký thất bại, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-page">
      <section className="register-visual">
        <img
          className="register-visual__image"
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80"
          alt="Cinematic background"
        />

        <div className="register-brand">
          <span className="material-symbols-outlined register-brand__icon">movie</span>
          <h1>Cine Luxe Premiere</h1>
        </div>

        <div className="register-gradient" />
        <p className="register-quote">“Khám phá thế giới điện ảnh với các đặc quyền VIP.”</p>
      </section>

      <section className="register-auth">
        <div className="register-ambient" />

        <div className="register-card">
          <header className="register-header">
            <h2>Đăng ký thành viên</h2>
            <p>Khám phá thế giới điện ảnh với các đặc quyền VIP.</p>
          </header>

          <form className="register-form" onSubmit={handleSubmit}>
            {error && <div className="register-error">{error}</div>}

            <div className="floating-field">
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder=" "
                value={formData.fullName}
                onChange={handleChange}
                autoComplete="name"
                required
              />
              <label htmlFor="fullName">Họ và tên</label>
            </div>

            <div className="floating-field">
              <input
                id="email"
                name="email"
                type="email"
                placeholder=" "
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
              <label htmlFor="email">Email</label>
            </div>

            <div className="floating-field">
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder=" "
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
                required
              />
              <label htmlFor="phone">Số điện thoại</label>
            </div>

            <div className="floating-field">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder=" "
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <label htmlFor="password">Mật khẩu</label>
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>

            <div className="floating-field">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder=" "
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"}
              >
                <span className="material-symbols-outlined">
                  {showConfirmPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>

            <label className="agree-check">
              <input
                name="agree"
                type="checkbox"
                checked={formData.agree}
                onChange={handleChange}
              />
              <span className="agree-box">
                <span className="material-symbols-outlined">check</span>
              </span>
              <span>
                Tôi đồng ý với <Link to="/terms">điều khoản sử dụng</Link> và chính sách bảo mật.
              </span>
            </label>

            <button className="register-submit" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="material-symbols-outlined register-spin">sync</span>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <span>Đăng ký</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="register-divider">
            <span />
            <p>Hoặc đăng nhập bằng</p>
            <span />
          </div>

          <div className="social-register">
            <button type="button">
              <span className="social-google">G</span>
              <span>Google</span>
            </button>
            <button type="button">
              <span className="social-facebook">f</span>
              <span>Facebook</span>
            </button>
          </div>

          <footer className="register-footer">
            Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default RegisterPage;
