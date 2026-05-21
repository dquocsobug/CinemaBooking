import "./AdminHeader.css";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

const AdminHeader = () => {
  const { user, logout } = useContext(AuthContext);

  const roleLabel = user?.roles?.includes("ROLE_ADMIN")
    ? "Quản trị viên"
    : user?.roles?.join(", ") || "Admin";

  const initial = (user?.fullName || user?.email || "A").charAt(0).toUpperCase();

  return (
    <header className="admin-header">
      <div className="admin-header-brand">
        <div className="admin-header-logo">
          <span className="material-symbols-outlined">movie</span>
        </div>

        <div>
          <h2>Cinema Admin</h2>
          <p>Quản lý hệ thống đặt vé</p>
        </div>
      </div>

      <div className="admin-header-actions">
        <button className="admin-header-icon-btn" type="button" title="Thông báo">
          <span className="material-symbols-outlined">notifications</span>
        </button>

        <div className="admin-header-user">
          <div className="admin-header-avatar">{initial}</div>

          <div className="admin-header-user-text">
            <strong>{user?.fullName || "Cinema Admin"}</strong>
            <span>{roleLabel}</span>
          </div>
        </div>

        <button className="admin-header-logout" type="button" onClick={logout}>
          <span className="material-symbols-outlined">logout</span>
          Đăng xuất
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
