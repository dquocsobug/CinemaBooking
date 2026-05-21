import { useState } from "react";
import "./PromotionsPage.css";
import promotionApi from "../api/promotionApi";

const promos = [
  {
    id: 1,
    title: "Combo Bắp Nước VIP",
    desc: "Thưởng thức bắp rang bơ cao cấp và nước ngọt size L với mức giá ưu đãi khi đặt trước.",
    tag: "-30%",
    expire: "Hết hạn: 31/12",
    image:
      "https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Thanh toán qua MoMo",
    desc: "Nhập mã MOMOLUXE giảm ngay 50.000đ cho hóa đơn từ 200.000đ khi thanh toán qua ví MoMo.",
    tag: "Giảm 50K",
    expire: "Hết hạn: 15/11",
    image:
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Thành Viên Diamond",
    desc: "Tặng 2 vé xem phim 2D/3D miễn phí vào tháng sinh nhật cho tất cả thành viên hạng Diamond.",
    tag: "VIP ONLY",
    expire: "Ưu đãi độc quyền",
    vip: true,
    image:
      "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Ưu Đãi Thẻ VNPay",
    desc: "Quét mã VNPay-QR nhận hoàn tiền trực tiếp 20% vào tài khoản ngân hàng, tối đa 30K.",
    tag: "Hoàn 20%",
    expire: "Hết hạn: 30/11",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200&auto=format&fit=crop",
  },
];

const events = [
  {
    id: 1,
    type: "Ra mắt phim",
    title: "Premiere: Night Walker",
    desc: "Tham gia buổi công chiếu sớm và giao lưu cùng đoàn làm phim.",
    image:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    type: "Lễ hội phim",
    title: "CineFest Autumn 2026",
    desc: "Tuần lễ phim nghệ thuật với sự góp mặt của các tác phẩm đoạt giải.",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 3,
    type: "Công nghệ mới",
    title: "Experience Dolby Cinema",
    desc: "Trải nghiệm âm thanh và hình ảnh sống động chưa từng có.",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop",
  },
];

const partners = [
  {
    name: "MoMo",
    shortName: "MoMo",
    logo: "https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Square.png",
  },
  {
    name: "VNPay",
    shortName: "VNP",
    logo: "https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR.png",
  },
  {
    name: "ZaloPay",
    shortName: "Zalo",
    logo: "https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-ZaloPay-Square.png",
  },
  {
    name: "Vietcombank",
    shortName: "VCB",
    logo: "https://cdn.haitrieu.com/wp-content/uploads/2022/02/Logo-Vietcombank.png",
  },
  {
    name: "Techcombank",
    shortName: "TCB",
    logo: "https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Techcombank.png",
  },
];

const PromotionsPage = () => {
    const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucher, setVoucher] = useState("");
  const [voucherMessage, setVoucherMessage] = useState("");

  const handleApplyVoucher = async () => {
  if (!voucher.trim()) {
    setVoucherMessage("Vui lòng nhập mã voucher.");
    return;
  }

  try {
    setVoucherLoading(true);

    const res = await promotionApi.validateVoucher(voucher);

    if (res.success) {
      setVoucherMessage(
        `Voucher hợp lệ: ${voucher.toUpperCase()}`
      );
    } else {
      setVoucherMessage("Voucher không hợp lệ.");
    }
  } catch (err) {
    setVoucherMessage(
      err.message || "Không thể kiểm tra voucher."
    );
  } finally {
    setVoucherLoading(false);
  }
};

  return (
    <div className="promo-page">
      <section className="promo-hero">
        <div className="promo-hero-bg" />

        <div className="promo-hero-content">
          <span className="promo-label">Khuyến mãi giới hạn</span>

          <h1>
            Trải Nghiệm <br />
            <span>Đẳng Cấp VIP</span>
          </h1>

          <p>
            Nhận ngay ưu đãi 50% cho gói thành viên VIP Diamond và tận hưởng
            phòng chờ thượng hạng cùng hệ thống âm thanh Dolby Atmos đỉnh cao.
          </p>

          <div className="promo-hero-actions">
            <button>Nhận ưu đãi ngay</button>
            <button className="promo-btn-glass">Xem chi tiết</button>
          </div>
        </div>

        <div className="promo-slider-dots">
          <span />
          <span />
          <span />
        </div>
      </section>

      <section className="voucher-section">
        <div className="voucher-card">
          <div className="voucher-input-wrap">
            <label>Bạn có mã voucher?</label>

            <div className="voucher-input">
              <input
                value={voucher}
                onChange={(e) => setVoucher(e.target.value)}
                placeholder="Nhập mã tại đây, ví dụ: CINELUXE2026"
              />
              <span>🎟</span>
            </div>
          </div>

          <button onClick={handleApplyVoucher}>
  {voucherLoading ? "Đang kiểm tra..." : "Áp dụng"}
</button>

          <p className="voucher-note">
            {voucherMessage ||
              "Ưu đãi sẽ được tự động tính tại trang thanh toán sau khi xác thực."}
          </p>
        </div>
      </section>

      <section className="promo-section">
        <div className="promo-section-head">
          <div>
            <h2>Ưu Đãi Đặc Biệt</h2>
            <div />
          </div>

          <div className="promo-arrows">
            <button>‹</button>
            <button>›</button>
          </div>
        </div>

        <div className="promo-grid">
          {promos.map((promo) => (
            <article
              className={`promo-card ${promo.vip ? "promo-card-vip" : ""}`}
              key={promo.id}
            >
              <div className="promo-card-img">
                <img src={promo.image} alt={promo.title} />
                <span>{promo.tag}</span>
              </div>

              <div className="promo-card-body">
                <h3>{promo.title}</h3>
                <p>{promo.desc}</p>

                <div className="promo-card-footer">
                  <small>⏱ {promo.expire}</small>
                  <button>Chi tiết</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="member-section">
        <div className="member-content">
          <h2>
            Càng Xem Càng <br />
            <span>Nhiều Đặc Quyền</span>
          </h2>

          <p>
            Trở thành thành viên của Cine Luxe Premiere để tích lũy điểm thưởng
            và đổi lấy những phần quà giá trị cùng trải nghiệm điện ảnh không
            giới hạn.
          </p>

          <div className="member-benefits">
            <div>
              <strong>⭐</strong>
              <h4>Tích Điểm 10%</h4>
              <p>Tích lũy 10% giá trị mỗi giao dịch vào ví điểm Luxe.</p>
            </div>

            <div>
              <strong>🎫</strong>
              <h4>Vé Miễn Phí</h4>
              <p>Đổi 1000 điểm lấy 1 vé xem phim 2D bất kỳ.</p>
            </div>
          </div>

          <button>Đăng ký thành viên ngay</button>
        </div>

        <div className="member-visual">
          <img
            src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=1200&auto=format&fit=crop"
            alt="Membership card"
          />

          <div className="member-stat">
            <strong>5.2K+</strong>
            <span>Thành viên Diamond</span>
          </div>
        </div>
      </section>

      <section className="event-section">
        <h2>Sự Kiện & Đối Tác Chiến Lược</h2>

        <div className="event-grid">
          {events.map((event) => (
            <article className="event-card" key={event.id}>
              <img src={event.image} alt={event.title} />

              <div>
                <span>{event.type}</span>
                <h3>{event.title}</h3>
                <p>{event.desc}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="partner-box">
          <p>Đối tác thanh toán tin dùng</p>

          <div className="partner-list">
  {partners.map((partner) => (
    <div className="partner-item" key={partner.name}>
      <div className="partner-logo-box">
        <img
          src={partner.logo}
          alt={partner.name}
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.parentElement.classList.add("logo-error");
          }}
        />
        <span>{partner.shortName}</span>
      </div>

      <strong>{partner.name}</strong>
    </div>
  ))}
</div>
        </div>
      </section>

      <div className="floating-voucher">
        <div className="floating-card">
          <p>Ưu đãi đang chờ bạn!</p>

          <div>
            <span>🏷</span>
            <div>
              <strong>LUXE20</strong>
              <small>Giảm 20% vé lẻ</small>
            </div>
          </div>

          <button>Dùng ngay</button>
        </div>

        <button className="floating-btn">🎟</button>
      </div>
    </div>
  );
};

export default PromotionsPage;