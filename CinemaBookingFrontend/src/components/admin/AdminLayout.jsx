import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import "./AdminLayout.css";

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <AdminHeader />
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;