import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "./Layout.css";

const Layout = () => {
  return (
    <div className="app-layout">
      <Navbar />

      <main className="app-main">
        <Outlet />   {/* 🔥 QUAN TRỌNG NHẤT */}
      </main>

      <Footer />
    </div>
  );
};

export default Layout;