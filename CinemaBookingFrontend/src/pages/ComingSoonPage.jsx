import { useEffect, useMemo, useState } from "react";
import "./ComingSoonPage.css";

const openYoutube = (url) => {
  if (!url) return;

  let youtubeUrl = url;

  if (youtubeUrl.includes("/embed/")) {
    const videoId = youtubeUrl.split("/embed/")[1].split("?")[0];
    youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  }

  window.open(youtubeUrl, "_blank", "noopener,noreferrer");
};

const upcomingMovies = [
  {
    id: 1,
    title: "Joker: Folie À Deux",
    releaseDate: "04.10.2024",
    description:
      "Phần tiếp theo đầy ám ảnh về sự trỗi dậy của Arthur Fleck cùng cộng sự mới trong thế giới hỗn loạn của Gotham.",
    genres: "Tâm lý, Nhạc kịch",
    duration: "138 Phút",
    format: "IMAX",
    posterUrl:
      "https://image.tmdb.org/t/p/w500/aciP8Km0waTLXEYf5ybFK5CSUxl.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/uGmYqxh8flqkudioyFtD7IJSHxK.jpg",
    trailerUrl: "https://www.youtube.com/watch?v=_OKAwz2MsJs",
  },
  {
    id: 2,
    title: "Gladiator II",
    releaseDate: "15.11.2024",
    genres: "Hành Động, Sử Thi",
    duration: "148 Phút",
    format: "IMAX",
    posterUrl:
      "https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
    trailerUrl: "https://www.youtube.com/watch?v=4rgYUipGJNo",
  },
  {
    id: 3,
    title: "Wicked",
    releaseDate: "22.11.2024",
    genres: "Nhạc Kịch, Kỳ Ảo",
    duration: "160 Phút",
    posterUrl:
      "https://image.tmdb.org/t/p/w500/xDGbZ0JJ3mYaGKy4Nzd9Kph6M9L.jpg",
    trailerUrl: "https://www.youtube.com/watch?v=6COmYeLsz4c",
  },
  {
    id: 4,
    title: "Moana 2",
    releaseDate: "27.11.2024",
    genres: "Hoạt Hình, Phiêu Lưu",
    duration: "110 Phút",
    posterUrl:
      "https://image.tmdb.org/t/p/w500/aLVkiINlIeCkcZIzb7XHzPYgO6L.jpg",
    trailerUrl: "https://www.youtube.com/watch?v=hDZ7y8RP5HE",
  },
  {
    id: 5,
    title: "Mufasa: The Lion King",
    releaseDate: "20.12.2024",
    genres: "Phiêu Lưu, Gia Đình",
    duration: "130 Phút",
    posterUrl:
      "https://image.tmdb.org/t/p/w500/lurEK87kukWNaHd0zYnsi3yzJrs.jpg",
    trailerUrl: "https://www.youtube.com/watch?v=o17MF9vnabg",
  },
];

const trailers = [
  {
    id: 1,
    title: "SONIC THE HEDGEHOG 3",
    meta: "2.4M lượt xem • 2 ngày trước",
    image:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop",
    trailerUrl: "https://www.youtube.com/watch?v=qSu6i2iFMO0",
  },
  {
    id: 2,
    title: "VENOM: THE LAST DANCE",
    meta: "5.1M lượt xem • 5 ngày trước",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    trailerUrl: "https://www.youtube.com/watch?v=HyIyd9joTTc",
  },
  {
    id: 3,
    title: "PADDINGTON IN PERU",
    meta: "1.8M lượt xem • 1 tuần trước",
    image:
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1200&auto=format&fit=crop",
    trailerUrl: "https://www.youtube.com/watch?v=lKgitu25ZAg",
  },
];

const timeline = [
  { label: "Tuần này", date: "09.09", active: false },
  { label: "Tuần tới", date: "16.09", active: true },
  { label: "Tháng 9", date: "23.09", active: false },
  { label: "Tháng 10", date: "07.10", active: false },
  { label: "Tháng 10", date: "21.10", active: false },
  { label: "Tháng 11", date: "04.11", active: false },
];
const getCountdown = (targetDate) => {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target - now;

  if (diff <= 0) {
    return {
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
};
const ComingSoonPage = () => {
  const heroMovie = useMemo(() => upcomingMovies[0], []);
    const targetDate = "2026-12-20T00:00:00";

    const [countdown, setCountdown] = useState(() =>
    getCountdown(targetDate)
    );

    useEffect(() => {
    const timer = setInterval(() => {
        setCountdown(getCountdown(targetDate));
    }, 1000);

    return () => clearInterval(timer);
    }, []);

  return (
    <div className="coming-page">
      <section className="coming-hero">
        <div className="coming-hero-bg">
          <img src={heroMovie.backdropUrl} alt={heroMovie.title} />
        </div>

        <div className="coming-hero-content">
          <div className="coming-hero-left">
            <span className="coming-release-badge">
              Công Chiếu {heroMovie.releaseDate}
            </span>

            <h1>{heroMovie.title}</h1>

            <p>{heroMovie.description}</p>

            <div className="coming-hero-actions">
              <button
                className="coming-primary-btn"
                onClick={() => openYoutube(heroMovie.trailerUrl)}
              >
                ▶ Xem Trailer
              </button>

              <button className="coming-glass-btn">
                Chi Tiết Phim
              </button>
            </div>
          </div>

          <div className="coming-countdown">
            <div>
                <strong>{countdown.days}</strong>
                <span>Ngày</span>
            </div>

            <div>
                <strong>{countdown.hours}</strong>
                <span>Giờ</span>
            </div>

            <div>
                <strong>{countdown.minutes}</strong>
                <span>Phút</span>
            </div>

            <div>
                <strong>{countdown.seconds}</strong>
                <span>Giây</span>
            </div>

            <p>Đang đếm ngược</p>
            </div>
        </div>
      </section>

      <section className="coming-timeline">
        <h2>Lộ Trình Công Chiếu</h2>

        <div className="coming-timeline-row">
          {timeline.map((item) => (
            <div
              className={`coming-timeline-item ${item.active ? "active" : ""}`}
              key={`${item.label}-${item.date}`}
            >
              <span>{item.label}</span>
              <i />
              <strong>{item.date}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="coming-movies-section">
        <div className="coming-section-head">
          <div>
            <h2>Phim Sắp Chiếu</h2>
            <p>
              Đừng bỏ lỡ những siêu phẩm điện ảnh sắp tới tại Cine Luxe.
            </p>
          </div>

          <div className="coming-head-actions">
            <button>☰</button>
            <button>▦</button>
          </div>
        </div>

        <div className="coming-grid">
          {upcomingMovies.slice(1).map((movie) => (
            <article className="coming-card" key={movie.id}>
              <img src={movie.posterUrl} alt={movie.title} />

              <div className="coming-card-badges">
                <span>{movie.releaseDate}</span>
                {movie.format && <span>{movie.format}</span>}
              </div>

              <div className="coming-card-content">
                <h3>{movie.title}</h3>
                <p>
                  {movie.genres} • {movie.duration}
                </p>

                <button onClick={() => openYoutube(movie.trailerUrl)}>
                  ▶ Xem Trailer
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="coming-trailer-section">
        <div className="coming-trailer-head">
          <h2>Trailer Mới Nhất</h2>
          <p>
            Thưởng thức những thước phim đầu tiên của các bom tấn sắp ra mắt.
          </p>
        </div>

        <div className="coming-trailer-grid">
          {trailers.map((trailer) => (
            <article
              className="coming-trailer-card"
              key={trailer.id}
              onClick={() => openYoutube(trailer.trailerUrl)}
            >
              <img src={trailer.image} alt={trailer.title} />

              <div className="coming-trailer-overlay">
                <div className="coming-play">▶</div>
              </div>

              <div className="coming-trailer-text">
                <h3>{trailer.title}</h3>
                <span>{trailer.meta}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="coming-cta">
        <div className="coming-cta-content">
          <h2>Sẵn sàng cho những đêm diễn rực rỡ?</h2>
          <p>
            Đăng ký để nhận thông báo sớm nhất khi phim mở bán vé và những ưu
            đãi đặc quyền dành riêng cho hội viên Cine Luxe.
          </p>

          <div className="coming-subscribe">
            <input type="email" placeholder="Email của bạn..." />
            <button>Đăng ký ngay</button>
          </div>
        </div>

        <div className="coming-cta-cards">
          <article>
            <span>♥</span>
            <h4>Danh Sách Yêu Thích</h4>
            <p>Lưu lại những bộ phim bạn mong đợi nhất.</p>
          </article>

          <article>
            <span>🎟</span>
            <h4>Săn Vé Sớm</h4>
            <p>Ưu tiên mua vé cho các buổi sneak-show.</p>
          </article>
        </div>
      </section>
    </div>
  );
};

export default ComingSoonPage;