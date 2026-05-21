import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import movieApi from "../api/movieApi";
import { formatAgeRating } from "../utils/format";
import { getPosterUrl, handleImageError } from "../utils/helpers";
import "./HomePage.css";

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1925&auto=format&fit=crop";

const STATIC_COMING_SOON = [
  {
    id: "coming-1",
    title: "The Singularity",
    releaseText: "Coming Dec 15",
    posterUrl:
      "https://res.cloudinary.com/dmapggr4w/image/upload/v1779027562/The_Singularity_jknyje",
  },
  {
    id: "coming-2",
    title: "Ethereal Realm",
    releaseText: "Coming Jan 05",
    posterUrl:
      "https://res.cloudinary.com/dmapggr4w/image/upload/v1779027562/Ethereal_Realm_xyqkhj",
  },
  {
    id: "coming-3",
    title: "Fragmented Minds",
    releaseText: "Coming Jan 22",
    posterUrl:
      "https://res.cloudinary.com/dmapggr4w/image/upload/v1779027562/Fragmented_Minds_nkjhgg",
  },
  {
    id: "coming-4",
    title: "Neon Overdrive",
    releaseText: "Coming Feb 14",
    posterUrl:
      "https://res.cloudinary.com/dmapggr4w/image/upload/v1779027562/Neon_Overdrive_kfxmvu",
  },
  {
  id: "coming-5",
  title: "The Manor",
  releaseText: "Coming Feb 28",
  posterUrl:
    "https://res.cloudinary.com/dmapggr4w/image/upload/v1779027562/The_Manor_byveff",
},
];

const STATIC_TRAILERS = [
  {
    id: 1,
    title: "Behind the Scenes: Dune Part Two",
    meta: "3:45 • Cine Luxe Exclusive",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "First Look: Ordinary Souls",
    meta: "2:15 • Official Trailer",
    image:
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Speed Rush: Final Trailer",
    meta: "2:58 • Official Trailer",
    image:
      "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=1200&auto=format&fit=crop",
  },
];

const MovieCardSkeleton = () => <div className="cl-movie-skeleton" />;

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const ageMeta = formatAgeRating(movie.ageRating);

  return (
    <div
      className="now-card"
      onClick={() => navigate(`/movies/${movie.slug}`)}
    >
      <img
        className="now-card__img"
        src={getPosterUrl(movie.posterUrl)}
        alt={movie.title}
        onError={handleImageError}
      />

      <div className="now-card__badges">
        {movie.rating && (
          <span className="now-card__rating">{movie.rating}</span>
        )}
        {movie.ageRating && (
          <span className="now-card__age">{ageMeta.label}</span>
        )}
      </div>

      <div className="now-card__overlay">
        <h3>{movie.title}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/movies/${movie.slug}`);
          }}
        >
          Đặt vé
        </button>
      </div>
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();

  const [nowShowing, setNowShowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await movieApi.getNowShowing({ page: 0, size: 10 });

        setNowShowing(res.data?.content || []);
      } catch (err) {
        console.error("Fetch now showing error:", err);
        setError("Không thể tải phim đang chiếu");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const heroMovie = useMemo(() => nowShowing[0], [nowShowing]);

  return (
    <div className="cine-home">
      <section className="cine-hero">
        <div className="cine-hero-bg">
          <img
            src={heroMovie ? getPosterUrl(heroMovie.posterUrl) : FALLBACK_HERO}
            alt={heroMovie?.title || "Cine Luxe"}
            onError={handleImageError}
          />
        </div>

        <div className="cine-hero-content">
          <div className="cine-hero-meta-top">
            <span className="cine-hot-badge">Hot Now</span>
            <span className="cine-rating">★ {heroMovie?.rating || "8.8"}/10</span>
          </div>

          <h1>{heroMovie?.title || "CINE LUXE"}</h1>

          <div className="cine-hero-info">
            <span>{heroMovie?.genres?.join(", ") || "Hành động, Viễn tưởng"}</span>
            <i />
            <span>{heroMovie?.durationMin || 166} ph</span>
            <i />
            <span className="cine-age">
              {heroMovie?.ageRating || "T13"}
            </span>
          </div>

          <p className="cine-hero-desc">
            {heroMovie?.description ||
              "Trải nghiệm điện ảnh đỉnh cao với không gian sang trọng, âm thanh sống động và những bom tấn mới nhất."}
          </p>

          <div className="cine-hero-actions">
            <button
              className="cine-btn cine-btn-primary"
              onClick={() => heroMovie && navigate(`/movies/${heroMovie.slug}`)}
            >
              🎟 Đặt Vé Ngay
            </button>

            <button
  className="cine-btn cine-btn-glass"
  onClick={() => {
    if (heroMovie?.trailerUrl) {
      let youtubeUrl = heroMovie.trailerUrl;

      // convert embed -> watch
      if (youtubeUrl.includes("/embed/")) {
        const videoId = youtubeUrl.split("/embed/")[1];
        youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      }

      window.open(youtubeUrl, "_blank");
    }
  }}
>
  ▶ Trailer
</button>
          </div>
        </div>
      </section>

      <main className="cine-main">
        <section className="cine-section">
          <div className="cine-section-head">
            <div>
              <h2>Phim Đang Chiếu</h2>
              <div className="cine-title-line cine-title-line-red" />
            </div>

            <button className="cine-view-all">
              Tất cả ›
            </button>
          </div>

          {error && <p className="cine-error">{error}</p>}

          <div className="now-grid">
  {loading
    ? Array.from({ length: 5 }).map((_, index) => (
        <div className="now-card-skeleton" key={index} />
      ))
    : nowShowing.slice(0, 5).map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
</div>
        </section>

        <section className="cine-section cine-coming-section">
          <div className="cine-section-head">
            <div>
              <h2>Sắp Chiếu</h2>
              <div className="cine-title-line" />
            </div>
          </div>

          <div className="cine-coming-row">
            {STATIC_COMING_SOON.map((movie) => (
              <article className="cine-coming-card" key={movie.id}>
                <div className="cine-coming-poster">
                  <img src={movie.posterUrl} alt={movie.title} />
                  <div className="cine-coming-hover">📅</div>
                </div>

                <h4>{movie.releaseText}</h4>
                <p>{movie.title}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cine-trailer-section">
          <div className="cine-center-head">
            <h2>Trailers & Behind The Scenes</h2>
            <p>
              Cùng đón xem những thước phim hậu trường và các đoạn trailer nóng
              hổi nhất từ các bom tấn sắp ra mắt.
            </p>
          </div>

          <div className="cine-trailer-grid">
            {STATIC_TRAILERS.map((trailer) => (
              <article className="cine-trailer-card" key={trailer.id}>
                <div className="cine-trailer-thumb">
                  <img src={trailer.image} alt={trailer.title} />
                  <div className="cine-play-btn">▶</div>
                </div>

                <h3>{trailer.title}</h3>
                <p>{trailer.meta}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cine-premium">
          <div>
            <span>Premium Experience</span>
            <h2>Đặt vé nhanh, chọn ghế đẹp, tận hưởng phim hay</h2>
            <p>
              CineVerse mang đến trải nghiệm rạp chiếu hiện đại với hệ thống đặt
              vé trực tuyến, sơ đồ ghế realtime và thanh toán tiện lợi.
            </p>
          </div>

          <div className="cine-premium-grid">
            <article>
              <strong>01</strong>
              <h3>Âm thanh sống động</h3>
              <p>Không gian điện ảnh chuẩn rạp với chất lượng cao.</p>
            </article>

            <article>
              <strong>02</strong>
              <h3>Giữ ghế realtime</h3>
              <p>Chọn ghế và giữ ghế nhanh chóng trong quá trình đặt vé.</p>
            </article>

            <article>
              <strong>03</strong>
              <h3>Thanh toán tiện lợi</h3>
              <p>Hỗ trợ thanh toán online và quản lý lịch sử đặt vé.</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;