import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="cine-footer">
      <div className="cine-footer__top">
        <div className="cine-footer__brand">
          <Link to="/" className="cine-footer__logo">
            <span>🎬</span>
            CINE LUXE
          </Link>

          <p>
            Trải nghiệm điện ảnh đỉnh cao với đặt vé nhanh, chọn ghế realtime
            và những bom tấn mới nhất.
          </p>
        </div>

        <div className="cine-footer__cols">
          <div>
            <h4>Khám phá</h4>
            <Link to="/">Trang chủ</Link>
            <Link to="/movies">Phim đang chiếu</Link>
            <a href="#coming-soon">Sắp chiếu</a>
            <a href="#trailers">Trailer</a>
          </div>

          <div>
            <h4>Hỗ trợ</h4>
            <a href="#terms">Điều khoản</a>
            <a href="#privacy">Bảo mật</a>
            <a href="#contact">Liên hệ</a>
            <a href="#faq">Câu hỏi thường gặp</a>
          </div>

          <div>
            <h4>Liên hệ</h4>
            <p>Hotline: 1900 9999</p>
            <p>Email: support@cineluxe.vn</p>
            <p>Giờ mở cửa: 08:00 - 23:00</p>
          </div>
        </div>
      </div>

      <div className="cine-footer__bottom">
        <p>© 2026 CINE LUXE. All rights reserved.</p>

        <div className="cine-footer__socials">
          <a href="#facebook">Facebook</a>
          <a href="#instagram">Instagram</a>
          <a href="#youtube">YouTube</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;