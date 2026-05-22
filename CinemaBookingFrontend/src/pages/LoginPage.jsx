import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const from = location.state?.from || "/";

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    setLoading(true);
    setError("");

    const result = await login({
      email: formData.email.trim(),
      password: formData.password,
    });

    console.log("LOGIN RESULT:", result);

    if (!result.success) {
      setError(result.message || "Đăng nhập thất bại");
      return;
    }

    const roles = result.user?.roles || [];

    console.log("ROLES:", roles);

    if (roles.includes("ROLE_ADMIN")) {
      navigate("/admin", { replace: true });
      return;
    }

    navigate(from, { replace: true });
  } catch (err) {
    setError(err.message || "Đăng nhập thất bại");
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="login-page">
      <section className="login-visual">
        <img
          className="login-visual__image"
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80"
          alt="Cinematic background"
        />

        <div className="login-brand">
          <span className="material-symbols-outlined login-brand__icon">movie</span>
          <h1>Cine Luxe Premiere</h1>
        </div>

        <div className="login-gradient" />

        <p className="login-quote">“Nơi những tuyệt tác điện ảnh được tôn vinh.”</p>
      </section>

      <section className="login-auth">
        <div className="login-ambient" />

        <div className="login-card">
          <header className="login-header">
            <h2>Đăng nhập</h2>
            <p>Chào mừng bạn quay lại với không gian điện ảnh đẳng cấp.</p>
          </header>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}

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
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder=" "
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
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

            <div className="login-actions-row">
              <label className="remember-check">
                <input
                  name="remember"
                  type="checkbox"
                  checked={formData.remember}
                  onChange={handleChange}
                />
                <span className="remember-box">
                  <span className="material-symbols-outlined">check</span>
                </span>
                <span>Ghi nhớ tôi</span>
              </label>

              <Link to="/forgot-password" className="login-link">
                Quên mật khẩu?
              </Link>
            </div>

            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="material-symbols-outlined login-spin">sync</span>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="login-divider">
            <span />
            <p>Hoặc đăng nhập bằng</p>
            <span />
          </div>

          <div className="social-login">
            <button type="button">
              <span className="social-google">G</span>
              <span>Google</span>
            </button>
            <button type="button">
              <span className="social-facebook">f</span>
              <span>Facebook</span>
            </button>
          </div>

          <footer className="login-footer">
            Bạn chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
