import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import movieApi from "../api/movieApi";
import { formatAgeRating } from "../utils/format";
import { getPosterUrl, handleImageError } from "../utils/helpers";
import "./MoviesPage.css";

const HERO_BG =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1920&auto=format&fit=crop";

const MovieSkeleton = () => (
  <div className="movies-skeleton">
    <div />
    <span />
    <small />
  </div>
);

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const ageMeta = formatAgeRating(movie.ageRating);

  return (
    <article className="movies-card">
      <div className="movies-card-poster">
        <img
          src={getPosterUrl(movie.posterUrl)}
          alt={movie.title}
          onError={handleImageError}
        />

        <div className="movies-badges">
          {movie.rating && <span>★ {movie.rating}</span>}
          {movie.ageRating && <span>{ageMeta.label}</span>}
        </div>

        <div className="movies-hover-actions">
          <button
  className="movies-glass-btn"
  onClick={(e) => {
    e.stopPropagation();

    if (movie.trailerUrl) {
      let youtubeUrl = movie.trailerUrl;

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

          <button
            className="movies-red-btn"
            onClick={() => navigate(`/movies/${movie.slug}`)}
          >
            🎟 Đặt vé ngay
          </button>
        </div>
      </div>

      <div className="movies-card-info">
        <h3 onClick={() => navigate(`/movies/${movie.slug}`)}>
          {movie.title}
        </h3>

        <div>
          <span>{movie.durationMin || "120"} Phút</span>
          <i />
          <span>{movie.genres?.join(", ") || "Đang cập nhật"}</span>
        </div>
      </div>
    </article>
  );
};

const MoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [genre, setGenre] = useState("ALL");
  const [country, setCountry] = useState("ALL");
  const [ageRating, setAgeRating] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await movieApi.getNowShowing({ page: 0, size: 50 });
        setMovies(res.data?.content || []);
      } catch (err) {
        console.error("Fetch movies error:", err);
        setError("Không thể tải danh sách phim");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const genres = useMemo(() => {
    const list = movies.flatMap((movie) => movie.genres || []);
    return ["ALL", ...new Set(list)];
  }, [movies]);

  const countries = useMemo(() => {
    const list = movies.map((movie) => movie.country).filter(Boolean);
    return ["ALL", ...new Set(list)];
  }, [movies]);

  const filteredMovies = useMemo(() => {
    let result = [...movies];

    if (keyword.trim()) {
      const q = keyword.toLowerCase();
      result = result.filter(
        (movie) =>
          movie.title?.toLowerCase().includes(q) ||
          movie.originalTitle?.toLowerCase().includes(q)
      );
    }

    if (genre !== "ALL") {
      result = result.filter((movie) => movie.genres?.includes(genre));
    }

    if (country !== "ALL") {
      result = result.filter((movie) => movie.country === country);
    }

    if (ageRating !== "ALL") {
      result = result.filter((movie) => movie.ageRating === ageRating);
    }

    if (sortBy === "rating") {
      result.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    if (sortBy === "newest") {
      result.sort(
        (a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0)
      );
    }

    return result;
  }, [movies, keyword, genre, country, ageRating, sortBy]);

  const visibleMovies = filteredMovies.slice(0, visibleCount);

  return (
    <div className="movies-page">
      <section className="movies-hero">
        <div className="movies-hero-bg">
          <img src={HERO_BG} alt="Phim đang chiếu" />
        </div>

        <div className="movies-hero-content">
          <h1>Phim Đang Chiếu</h1>
          <div />
        </div>
      </section>

      <section className="movies-filter-wrap">
        <div className="movies-filter-panel">
          <div className="movies-search-box">
            <span>⌕</span>
            <input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setVisibleCount(10);
              }}
              placeholder="Tìm tên phim..."
            />
          </div>

          <select
            value={genre}
            onChange={(e) => {
              setGenre(e.target.value);
              setVisibleCount(10);
            }}
          >
            {genres.map((item) => (
              <option key={item} value={item}>
                {item === "ALL" ? "Thể loại: Tất cả" : item}
              </option>
            ))}
          </select>

          <select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setVisibleCount(10);
            }}
          >
            {countries.map((item) => (
              <option key={item} value={item}>
                {item === "ALL" ? "Quốc gia: Tất cả" : item}
              </option>
            ))}
          </select>

          <select
            value={ageRating}
            onChange={(e) => {
              setAgeRating(e.target.value);
              setVisibleCount(10);
            }}
          >
            <option value="ALL">Độ tuổi: Tất cả</option>
            <option value="P">P - Mọi độ tuổi</option>
            <option value="T13">T13 - Trên 13 tuổi</option>
            <option value="T16">T16 - Trên 16 tuổi</option>
            <option value="T18">T18 - Trên 18 tuổi</option>
          </select>

          <div className="movies-sort-box">
            <span>Sắp xếp:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Mới nhất</option>
              <option value="rating">Điểm cao</option>
            </select>
          </div>
        </div>
      </section>

      <main className="movies-main">
        {error && <p className="movies-error">{error}</p>}

        <div className="movies-grid">
          {loading
            ? Array.from({ length: 10 }).map((_, index) => (
                <MovieSkeleton key={index} />
              ))
            : visibleMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
        </div>

        {!loading && visibleMovies.length === 0 && (
          <div className="movies-empty">
            Không tìm thấy phim phù hợp.
          </div>
        )}

        {!loading && visibleCount < filteredMovies.length && (
          <div className="movies-loadmore">
            <button onClick={() => setVisibleCount((prev) => prev + 10)}>
              Xem Thêm Phim ↓
            </button>

            <div className="movies-dots">
              <i />
              <i />
              <i />
            </div>
          </div>
        )}
      </main>

      <div className="quick-booking">
        <button>📅</button>

        <div className="quick-booking-panel">
          <h4>Đặt vé nhanh</h4>
          <div>Chọn Phim & Cinema...</div>
          <div>Chọn Suất Chiếu...</div>
          <button>Tìm suất chiếu</button>
        </div>
      </div>
    </div>
  );
};

export default MoviesPage;