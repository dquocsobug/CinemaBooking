import React, { useContext, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [openUserMenu, setOpenUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setOpenUserMenu(false);
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();

    if (!keyword.trim()) return;

    navigate(`/movies?search=${encodeURIComponent(keyword.trim())}`);
    setKeyword("");
  };

  return (
    <header className="cine-navbar">
      <div className="cine-navbar__left">
        <Link to="/" className="cine-navbar__logo">
          <span className="cine-navbar__logo-icon">🎬</span>
          <span>CINE LUXE</span>
        </Link>

        <nav className="cine-navbar__links">
          <NavLink to="/" end>
            Trang chủ
          </NavLink>
          <NavLink to="/movies">Phim đang chiếu</NavLink>
          <NavLink to="/coming-soon">Sắp chiếu</NavLink>
          <NavLink to="/cinemas">Rạp chiếu</NavLink>
          <NavLink to="/promotions">Khuyến mãi</NavLink>
        </nav>
      </div>

      <div className="cine-navbar__right">
        <form className="cine-navbar__search" onSubmit={handleSearch}>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm kiếm phim, rạp..."
          />
          <button type="submit">⌕</button>
        </form>

        {user ? (
          <div className="cine-navbar__user-menu">
            <button
              type="button"
              className="cine-navbar__avatar-btn"
              onClick={() => setOpenUserMenu((prev) => !prev)}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName || "User"} />
              ) : (
                <span>👤</span>
              )}
            </button>

            {openUserMenu && (
              <div className="cine-navbar__dropdown">
                <div className="cine-navbar__dropdown-header">
                  <strong>{user.fullName}</strong>
                  <span>{user.email}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOpenUserMenu(false);
                    navigate("/profile");
                  }}
                >
                  👤 Trang cá nhân
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpenUserMenu(false);
                    navigate("/booking-history");
                  }}
                >
                  🎟️ Lịch sử mua vé
                </button>

                <button
                  type="button"
                  className="cine-navbar__dropdown-logout"
                  onClick={handleLogout}
                >
                  🚪 Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="cine-navbar__login"
            onClick={() => navigate("/login")}
          >
            <span>👤</span>
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;