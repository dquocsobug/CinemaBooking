import { useEffect, useMemo, useState } from "react";
import movieApi from "../api/movieApi";
import showtimeApi from "../api/showtimeApi";
import "./CinemasPage.css";

const CINEMA_FALLBACK = {
  address: "Địa chỉ đang cập nhật",
  phone: "1900 0000",
  distance: "Đang cập nhật",
  image:
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop",
};

const CINEMA_STATIC = {
  "CGV Vincom Đà Nẵng": {
    address: "910A Ngô Quyền, Sơn Trà, Đà Nẵng",
    phone: "0236 7300 888",
    distance: "1.8 km",
    image:
      "https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?q=80&w=1200&auto=format&fit=crop",
  },

  "Lotte Cinema Đà Nẵng": {
    address: "Tầng 5 Lotte Mart, Hải Châu, Đà Nẵng",
    phone: "0236 3666 888",
    distance: "3.2 km",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop",
  },

  "Galaxy Cinema Đà Nẵng": {
    address: "Điện Biên Phủ, Thanh Khê, Đà Nẵng",
    phone: "1900 2224",
    distance: "4.5 km",
    image:
      "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=1200&auto=format&fit=crop",
  },
};
const STATIC_CINEMAS = [
  {
    id: "cinema-1",
    name: "CGV Vincom Đà Nẵng",
    address: "910A Ngô Quyền, Sơn Trà, Đà Nẵng",
    phone: "0236 7300 888",
    distance: "1.8 km",
    image:
      "https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?q=80&w=1200&auto=format&fit=crop",
    roomTypes: ["2D", "IMAX", "4DX"],
    showtimes: [],
  },

  {
    id: "cinema-2",
    name: "Lotte Cinema Đà Nẵng",
    address: "Tầng 5 Lotte Mart, Hải Châu, Đà Nẵng",
    phone: "0236 3666 888",
    distance: "3.2 km",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop",
    roomTypes: ["2D", "Gold Class"],
    showtimes: [],
  },

  {
    id: "cinema-3",
    name: "Galaxy Cinema Đà Nẵng",
    address: "Điện Biên Phủ, Thanh Khê, Đà Nẵng",
    phone: "1900 2224",
    distance: "4.5 km",
    image:
      "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=1200&auto=format&fit=crop",
    roomTypes: ["2D", "3D"],
    showtimes: [],
  },

  {
    id: "cinema-4",
    name: "Metiz Cinema Đà Nẵng",
    address: "29 Quang Trung, Hải Châu, Đà Nẵng",
    phone: "0236 3888 999",
    distance: "2.7 km",
    image:
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1200&auto=format&fit=crop",
    roomTypes: ["2D", "IMAX"],
    showtimes: [],
  },
];
const formatTime = (dateString) => {
  if (!dateString) return "--:--";

  return new Date(dateString).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeRoomType = (type) => {
  if (!type) return "2D";
  if (type === "TWO_D") return "2D";
  if (type === "THREE_D") return "3D";
  return type.replaceAll("_", " ");
};

const CinemasPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showtimes, setShowtimes] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [roomType, setRoomType] = useState("");

  useEffect(() => {
  const fetchShowtimes = async () => {
    try {
      setLoading(true);
      setError("");

      const today = new Date().toISOString().slice(0, 10);

      const movieRes = await movieApi.getNowShowing({
        page: 0,
        size: 10,
      });

      const movies = movieRes.data?.content || [];

      const results = await Promise.allSettled(
        movies.map((movie) =>
          showtimeApi.getShowtimes({
            movieId: movie.id,
            date: today,
          })
        )
      );

      const allShowtimes = results.flatMap((result) => {
        if (result.status !== "fulfilled") return [];

        return Array.isArray(result.value.data)
          ? result.value.data
          : [];
      });

      setShowtimes(allShowtimes);
    } catch (err) {
      console.error("Fetch cinemas/showtimes error:", err);
      setError("Không thể tải danh sách rạp chiếu");
    } finally {
      setLoading(false);
    }
  };

  fetchShowtimes();
}, []);

const cinemas = useMemo(() => {
  return STATIC_CINEMAS.map((cinema) => ({
    ...cinema,
    showtimes: showtimes.filter(
      (item) => item.cinemaName === cinema.name
    ),
  }));
}, [showtimes]);

  const filteredCinemas = useMemo(() => {
    return cinemas.filter((cinema) => {
      const matchKeyword = cinema.name
        .toLowerCase()
        .includes(keyword.toLowerCase());

      const matchRoomType = roomType
        ? cinema.roomTypes.includes(roomType)
        : true;

      return matchKeyword && matchRoomType;
    });
  }, [cinemas, keyword, roomType]);

  const selectedCinema = filteredCinemas[0];

  return (
    <div className="cinemas-page">
      <section className="cinemas-hero">
        <div className="cinemas-hero-bg" />
        <div className="cinemas-hero-content">
          <h1>HỆ THỐNG RẠP CHIẾU</h1>
          <p>
            Trải nghiệm điện ảnh đỉnh cao tại mạng lưới rạp chiếu sang trọng
            với công nghệ âm thanh và hình ảnh hiện đại.
          </p>
        </div>
      </section>

      <section className="cinemas-filter-wrap">
        <div className="cinemas-filter">
          <div className="cinemas-search">
            <span>⌕</span>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm tên rạp..."
            />
          </div>

          <select>
            <option>Thành phố</option>
            <option>Đà Nẵng</option>
            <option>Hà Nội</option>
            <option>TP. Hồ Chí Minh</option>
          </select>

          <select>
            <option>Quận/huyện</option>
            <option>Hải Châu</option>
            <option>Thanh Khê</option>
            <option>Sơn Trà</option>
          </select>

          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
          >
            <option value="">Loại phòng</option>
            <option value="2D">2D</option>
            <option value="3D">3D</option>
            <option value="IMAX">IMAX</option>
            <option value="4DX">4DX</option>
          </select>
        </div>
      </section>

      <main>
        <section className="cinemas-grid-section">
          {error && <p className="cinemas-error">{error}</p>}

          {loading ? (
            <div className="cinemas-grid">
              {Array.from({ length: 3 }).map((_, index) => (
                <div className="cinema-card cinema-card-skeleton" key={index} />
              ))}
            </div>
          ) : filteredCinemas.length === 0 ? (
            <div className="cinemas-empty">
              Không tìm thấy rạp chiếu phù hợp.
            </div>
          ) : (
            <div className="cinemas-grid">
              {filteredCinemas.map((cinema) => (
                <article className="cinema-card" key={cinema.id}>
                  <div className="cinema-image">
                    <img src={cinema.image} alt={cinema.name} />

                    <div className="cinema-tags">
                      {cinema.roomTypes.map((type) => (
                        <span key={type}>{type}</span>
                      ))}
                    </div>
                  </div>

                  <div className="cinema-content">
                    <h3>{cinema.name}</h3>

                    <div className="cinema-info">
                      <p>📍 {cinema.address}</p>
                      <p>☎ {cinema.phone}</p>
                      <p className="cinema-distance">➤ {cinema.distance}</p>
                    </div>

                    <div className="cinema-actions">
                      <button className="btn-showtimes">Xem lịch chiếu</button>
                      <button>Chỉ đường</button>
                      <button>Chi tiết</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="cinemas-map-section">
          <div className="cinemas-map-head">
            <div>
              <span>Vị trí rạp gần bạn</span>
              <h2>BẢN ĐỒ CÁC RẠP</h2>
            </div>

            <button>📍 Sử dụng vị trí hiện tại</button>
          </div>

          <div className="cinemas-map-real">
            <iframe
                title="Google Maps Đà Nẵng"
                src="https://www.google.com/maps?q=Đà+Nẵng+Việt+Nam&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
            />
            </div>
        </section>

        {selectedCinema && (
          <section className="cinema-showtime-section">
            <div className="showtime-head">
              <h2>PHIM ĐANG CHIẾU TẠI {selectedCinema.name}</h2>
              <p>Hôm nay</p>
            </div>

            <div className="showtime-list">
              {Object.values(
                selectedCinema.showtimes.reduce((acc, item) => {
                  if (!acc[item.movieId]) {
                    acc[item.movieId] = {
                      movieId: item.movieId,
                      movieTitle: item.movieTitle,
                      moviePoster: item.moviePoster,
                      roomType: normalizeRoomType(item.roomType),
                      language: item.language,
                      times: [],
                    };
                  }

                  acc[item.movieId].times.push(item);
                  return acc;
                }, {})
              ).map((movie) => (
                <article className="showtime-item" key={movie.movieId}>
                  <div className="showtime-poster">
                    <img src={movie.moviePoster} alt={movie.movieTitle} />
                  </div>

                  <div className="showtime-content">
                    <div className="showtime-title">
                      <span>{movie.roomType}</span>
                      <h3>{movie.movieTitle}</h3>
                    </div>

                    <p>{movie.language || "Phụ đề"} • Đang chiếu</p>

                    <div className="showtime-group">
                      <h4>{movie.roomType} {movie.language || "Phụ đề"}</h4>

                      <div className="showtime-buttons">
                        {movie.times.map((time) => (
                          <button key={time.id}>
                            {formatTime(time.startTime)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default CinemasPage;