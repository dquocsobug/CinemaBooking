import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import movieApi from "../api/movieApi";
import showtimeApi from "../api/showtimeApi";
import reviewApi from "../api/reviewApi";
import { formatAgeRating, formatDate } from "../utils/format";
import { getPosterUrl, handleImageError } from "../utils/helpers";
import "./MovieDetailPage.css";

function toApiDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const getNextDates = () => {
  const days = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);

    return {
      value: toApiDate(date),
      day: days[date.getDay()],
      date: String(date.getDate()).padStart(2, "0"),
      month: `T${String(date.getMonth() + 1).padStart(2, "0")}`,
    };
  });
};

const MovieDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const dates = useMemo(() => getNextDates(), []);
  const [selectedDate, setSelectedDate] = useState(dates[0].value);
  const [selectedShowtimeId, setSelectedShowtimeId] = useState("");

  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(9);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSpoiler, setReviewSpoiler] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [loading, setLoading] = useState(true);
  const [showtimeLoading, setShowtimeLoading] = useState(false);
  const [error, setError] = useState("");


  useEffect(() => {
    const fetchMovieDetail = async () => {
      try {
        setLoading(true);
        setError("");

        const detailRes = await movieApi.getMovieDetail(slug);
        const movieData = detailRes?.data || null;

        setMovie(movieData);

        try {
          const relatedRes = await movieApi.getNowShowing({ page: 0, size: 10 });
          const relatedData = relatedRes?.data?.content || [];
          setRelatedMovies(relatedData.filter((item) => item.slug !== slug));
        } catch (relatedErr) {
          console.warn("Fetch related movies error:", relatedErr);
          setRelatedMovies([]);
        }
      } catch (err) {
        console.error("Fetch movie detail error:", err);
        setError("Không thể tải chi tiết phim");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchMovieDetail();
    } else {
      setError("Thiếu slug phim");
      setLoading(false);
    }
  }, [slug]);

 useEffect(() => {
  if (!movie?.id) return;

  const fetchShowtimes = async () => {
    try {
      setShowtimeLoading(true);

      const res = await showtimeApi.getShowtimes({ 
        movieId: movie.id, 
        date: selectedDate      // ← thêm date
      });

      const allShowtimes = Array.isArray(res?.data) ? res.data : [];
      // Bỏ filter thủ công — backend đã filter theo movieId rồi
      setShowtimes(allShowtimes);
      setSelectedShowtimeId(allShowtimes[0]?.id || "");
    } catch (err) {
      console.error("Fetch showtimes error:", err);
      setShowtimes([]);
      setSelectedShowtimeId("");
    } finally {
      setShowtimeLoading(false);
    }
  };

  fetchShowtimes();
}, [movie?.id, selectedDate]);   // ← thêm selectedDate vào deps

useEffect(() => {
  if (!movie?.id) return;

  const fetchReviews = async () => {
    try {
      const res = await reviewApi.getReviewsByMovie(movie.id);

      const data = res?.data?.content || [];

      setReviews(data);
    } catch (err) {
      console.error("Fetch reviews error:", err);
      setReviews([]);
    }
  };

  fetchReviews();
}, [movie?.id]);

  const ageMeta = useMemo(() => {
    return movie?.ageRating ? formatAgeRating(movie.ageRating) : null;
  }, [movie]);

  const selectedShowtime = showtimes.find(
    (item) => item.id === selectedShowtimeId
  );

  const handleGoShowtimes = () => {
  if (!movie?.slug) {
    alert("Không tìm thấy thông tin phim");
    return;
  }

  navigate(`/showtimes/${movie.slug}`);
};

const handleQuickBooking = () => {
  if (!selectedShowtimeId) {
    alert("Vui lòng chọn suất chiếu");
    return;
  }

  navigate(`/booking/${selectedShowtimeId}`, {
    state: {
      movie,
      showtime: selectedShowtime,
    },
  });
};
  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      alert("Vui lòng nhập nội dung đánh giá");
      return;
    }

    try {
      setSubmittingReview(true);

      const payload = {
        movieId: movie.id,
        rating: Number(reviewRating),
        comment: reviewComment.trim(),
        isSpoiler: reviewSpoiler,
      };

      const res = await reviewApi.createReview(payload);
      const createdReview = res?.data;

      setReviews((prev) => [
        {
          id: createdReview?.id || Date.now(),
          userFullName: createdReview?.userFullName || "Bạn",
          rating: createdReview?.rating || payload.rating,
          comment: createdReview?.comment || payload.comment,
          isSpoiler: createdReview?.isSpoiler || payload.isSpoiler,
          createdAt: createdReview?.createdAt || new Date().toISOString(),
        },
        ...prev,
      ]);

      setReviewComment("");
      setReviewRating(9);
      setReviewSpoiler(false);

      alert("Cảm ơn bạn đã đánh giá!");
    } catch (err) {
      console.error("Create review error:", err);
      alert("Bạn cần đăng nhập để đánh giá phim");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="movie-detail-page">
        <div className="detail-loading">Đang tải chi tiết phim...</div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="movie-detail-page">
        <div className="detail-loading">{error || "Không tìm thấy phim"}</div>
      </div>
    );
  }

  return (
    <div className="movie-detail-page">
      <section className="detail-hero">
        <div
          className="detail-hero-bg"
          style={{ backgroundImage: `url(${getPosterUrl(movie.posterUrl)})` }}
        />

        <div className="detail-hero-gradient" />

        <div className="detail-hero-content">
          <div className="detail-poster-wrap">
            <div className="detail-poster">
              <img
                src={getPosterUrl(movie.posterUrl)}
                alt={movie.title}
                onError={handleImageError}
              />

              <div className="detail-poster-hover">
                <button>🔍 View Poster</button>
              </div>
            </div>
          </div>

          <div className="detail-info">
            <div className="detail-genres">
              {(movie.genres?.length ? movie.genres : ["Điện ảnh"]).map(
                (genre) => (
                  <span key={genre}>{genre}</span>
                )
              )}
            </div>

            <h1>{movie.title}</h1>

            {movie.originalTitle && (
              <p className="detail-original-title">{movie.originalTitle}</p>
            )}

            <div className="detail-meta-row">
              <div className="detail-rating">
                <span>★</span>
                <strong>{movie.rating || "8.8"}</strong>
                <small>/10</small>
              </div>

              {ageMeta && <span className="detail-age">{ageMeta.label}</span>}

              <div className="detail-duration">
                <span>⏱</span>
                {movie.durationMin || 120} ph
              </div>
            </div>

            <div className="detail-facts">
              <div>
                <p>Khởi Chiếu</p>
                <strong>{formatDate(movie.releaseDate)}</strong>
              </div>

              <div>
                <p>Đạo Diễn</p>
                <strong>{movie.director || "Đang cập nhật"}</strong>
              </div>

              <div>
                <p>Ngôn Ngữ</p>
                <strong>{movie.language || "Đang cập nhật"}</strong>
              </div>

              <div>
                <p>Quốc Gia</p>
                <strong>{movie.country || "Đang cập nhật"}</strong>
              </div>
            </div>

            <div className="detail-actions">
              <button className="detail-btn-primary" onClick={handleGoShowtimes}>
                🎟 ĐẶT VÉ NGAY
              </button>

              <button
                className="detail-btn-outline"
                onClick={() => {
                  if (movie.trailerUrl) window.open(movie.trailerUrl, "_blank");
                }}
              >
                ▶ XEM TRAILER
              </button>

              <button className="detail-btn-icon">♡</button>
            </div>
          </div>
        </div>
      </section>

      <section className="detail-main">
        <div className="detail-left">
          <section className="detail-block">
            <h2>Nội Dung Phim</h2>

            <div className="glass-panel detail-description">
              <p>{movie.description || "Nội dung phim đang được cập nhật."}</p>

              <p>
                CineVerse mang đến trải nghiệm đặt vé nhanh chóng, lựa chọn ghế
                tiện lợi và cập nhật thông tin phim mới nhất cho khán giả.
              </p>
            </div>
          </section>

          <section className="detail-block">
            <div className="detail-block-head">
              <h2>Đánh Giá Từ Khán Giả</h2>
            </div>

            <div className="glass-panel review-form">
              <div className="review-form-row">
                <label>
                  Điểm
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(e.target.value)}
                  >
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((point) => (
                      <option key={point} value={point}>
                        {point}/10
                      </option>
                    ))}
                  </select>
                </label>

                <label className="spoiler-check">
                  <input
                    type="checkbox"
                    checked={reviewSpoiler}
                    onChange={(e) => setReviewSpoiler(e.target.checked)}
                  />
                  Có spoiler
                </label>
              </div>

              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Viết cảm nhận của bạn về phim..."
              />

              <button onClick={handleSubmitReview} disabled={submittingReview}>
                {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>

            <div className="review-grid">
              {reviews.length === 0 ? (
                <div className="glass-panel review-empty">
                  Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá
                  phim này.
                </div>
              ) : (
                reviews.map((review) => (
                  <article className="glass-panel review-card" key={review.id}>
                    <div className="review-top">
                      <div className="review-user">
                        <div className="review-avatar">
                          {(review.userFullName || "U").charAt(0)}
                        </div>

                        <div>
                          <strong>{review.userFullName || "Người dùng"}</strong>
                          <div className="review-stars">
                            {"★".repeat(Math.round((review.rating || 0) / 2))}
                            {"☆".repeat(
                              5 - Math.round((review.rating || 0) / 2)
                            )}
                          </div>
                        </div>
                      </div>

                      <span>
                        {review.createdAt
                          ? new Date(review.createdAt).toLocaleDateString(
                              "vi-VN"
                            )
                          : "Vừa xong"}
                      </span>
                    </div>

                    <p className={review.isSpoiler ? "blur-text" : ""}>
                      “{review.comment}”
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="detail-booking">
          <div className="glass-panel booking-widget">
            <h3>🎫 Mua Vé Nhanh</h3>

            <div className="booking-group">
              <p>Chọn Ngày</p>

              <div className="date-list">
                {dates.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={selectedDate === item.value ? "active" : ""}
                    onClick={() => {
                      setSelectedDate(item.value);
                      setSelectedShowtimeId("");
                    }}
                  >
                    <span>{item.day}</span>
                    <strong>{item.date}</strong>
                    <small>{item.month}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="booking-group">
              <p>Rạp chiếu</p>

              <div className="cinema-default">
                <strong>
                  {selectedShowtime?.cinemaName ||
                    showtimes[0]?.cinemaName ||
                    "Chưa có rạp"}
                </strong>
                <span>
                  {selectedShowtime?.roomName || showtimes[0]?.roomName || ""}
                </span>
              </div>
            </div>

            <div className="booking-group">
              <p>Suất Chiếu</p>

              {showtimeLoading ? (
                <div className="no-showtime">Đang tải suất chiếu...</div>
              ) : (
                <div className="showtime-grid">
                  {showtimes.length > 0 ? (
                    showtimes.map((item) => (
                      <button
                        key={item.id}
                        className={
                          selectedShowtimeId === item.id ? "active" : ""
                        }
                        onClick={() => setSelectedShowtimeId(item.id)}
                        type="button"
                      >
                        <strong>
                          {new Date(item.startTime).toLocaleTimeString(
                            "vi-VN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </strong>
                        <span>{item.roomType || item.format || "2D"}</span>
                      </button>
                    ))
                  ) : (
                    <div className="no-showtime">Chưa có suất chiếu</div>
                  )}
                </div>
              )}
            </div>

            <button className="booking-submit" onClick={handleQuickBooking}>
              TIẾP TỤC
            </button>

            <small>
              * Giá vé có thể thay đổi tùy theo loại ghế và phòng chiếu.
            </small>
          </div>
        </aside>
      </section>

      <section className="related-section">
        <h2>Phim Liên Quan</h2>

        <div className="related-row">
          {relatedMovies.map((item) => (
            <article
              className="related-card"
              key={item.id}
              onClick={() => navigate(`/movies/${item.slug}`)}
            >
              <div>
                <img
                  src={getPosterUrl(item.posterUrl)}
                  alt={item.title}
                  onError={handleImageError}
                />

                {item.rating && <span>{item.rating}</span>}
              </div>

              <h3>{item.title}</h3>
              <p>{item.genres?.[0] || item.country || "Điện ảnh"}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MovieDetailPage;