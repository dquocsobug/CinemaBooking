import "./AdminSidebar.css";
import { NavLink } from "react-router-dom";

const navItems = [
  {
    to: "/admin",
    end: true,
    icon: "dashboard",
    label: "Dashboard",
  },
  {
    to: "/admin/movies",
    icon: "movie",
    label: "Movies",
  },
  {
    to: "/admin/showtimes",
    icon: "event_available",
    label: "Showtimes",
  },
];

const AdminSidebar = () => {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-top">
        <div className="admin-sidebar-mark">
          <span className="material-symbols-outlined">local_movies</span>
        </div>

        <div>
          <h3>Admin Panel</h3>
          <p>Cine Luxe</p>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? "admin-sidebar-link active" : "admin-sidebar-link"
            }
          >
            <span className="admin-sidebar-link-icon material-symbols-outlined">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-card">
        <span className="material-symbols-outlined">verified</span>
        <strong>Admin Mode</strong>
        <p>Quản lý phim, lịch chiếu và booking.</p>
      </div>
    </aside>
  );
};

export default AdminSidebar;
