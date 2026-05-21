import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import "./MoviesPage.css";

const EMPTY_FORM = {
  title: "",
  originalTitle: "",
  slug: "",
  description: "",
  durationMin: "",
  releaseDate: "",
  endDate: "",
  language: "",
  country: "",
  director: "",
  castList: "",
  posterUrl: "",
  trailerUrl: "",
  rating: "",
  ageRating: "T13",
  status: "NOW_SHOWING",
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả" },
  { value: "NOW_SHOWING", label: "Đang chiếu" },
  { value: "COMING_SOON", label: "Sắp chiếu" },
  { value: "ENDED", label: "Đã kết thúc" },
];

const AGE_OPTIONS = ["P", "K", "T13", "T16", "T18"];

const statusLabel = {
  NOW_SHOWING: "Đang chiếu",
  COMING_SOON: "Sắp chiếu",
  ENDED: "Đã kết thúc",
};

const statusClass = {
  NOW_SHOWING: "is-showing",
  COMING_SOON: "is-coming",
  ENDED: "is-ended",
};

function normalizeMoviePayload(form) {
  return {
    title: form.title.trim(),
    originalTitle: form.originalTitle?.trim() || null,
    slug: form.slug.trim(),
    description: form.description?.trim() || null,
    durationMin: Number(form.durationMin),
    releaseDate: form.releaseDate,
    endDate: form.endDate || null,
    language: form.language?.trim() || null,
    country: form.country?.trim() || null,
    director: form.director?.trim() || null,
    castList: form.castList?.trim() || null,
    posterUrl: form.posterUrl?.trim() || null,
    trailerUrl: form.trailerUrl?.trim() || null,
    rating: form.rating === "" ? null : Number(form.rating),
    ageRating: form.ageRating,
    status: form.status,
  };
}

function createSlug(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("vi-VN");
}

function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError("");

      const [nowRes, searchRes] = await Promise.allSettled([
        axiosClient.get("/movies/now-showing"),
        axiosClient.get("/movies/search", { params: { q: keyword || "" } }),
      ]);

      const nowMovies =
        nowRes.status === "fulfilled" ? nowRes.value?.data?.content || [] : [];
      const searchedMovies =
        searchRes.status === "fulfilled"
          ? searchRes.value?.data?.content || []
          : [];

      const merged = [...nowMovies, ...searchedMovies].reduce((acc, movie) => {
        if (movie?.id && !acc.some((item) => item.id === movie.id)) {
          acc.push(movie);
        }
        return acc;
      }, []);

      setMovies(merged);
    } catch (err) {
      console.error("Fetch admin movies error:", err);
      setError(err.message || "Không thể tải danh sách phim");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredMovies = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    return movies.filter((movie) => {
      const matchKeyword =
        !text ||
        movie.title?.toLowerCase().includes(text) ||
        movie.slug?.toLowerCase().includes(text) ||
        movie.director?.toLowerCase().includes(text);

      const matchStatus =
        statusFilter === "ALL" || movie.status === statusFilter;

      return matchKeyword && matchStatus;
    });
  }, [movies, keyword, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: movies.length,
      showing: movies.filter((m) => m.status === "NOW_SHOWING").length,
      coming: movies.filter((m) => m.status === "COMING_SOON").length,
      ended: movies.filter((m) => m.status === "ENDED").length,
    };
  }, [movies]);

  const openCreateModal = () => {
    setEditingMovie(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (movie) => {
    setEditingMovie(movie);
    setForm({
      title: movie.title || "",
      originalTitle: movie.originalTitle || "",
      slug: movie.slug || "",
      description: movie.description || "",
      durationMin: movie.durationMin || "",
      releaseDate: movie.releaseDate || "",
      endDate: movie.endDate || "",
      language: movie.language || "",
      country: movie.country || "",
      director: movie.director || "",
      castList: movie.castList || movie.cast || "",
      posterUrl: movie.posterUrl || "",
      trailerUrl: movie.trailerUrl || "",
      rating: movie.rating ?? "",
      ageRating: movie.ageRating || "T13",
      status: movie.status || "NOW_SHOWING",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingMovie(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => {
      if (name === "title" && !editingMovie) {
        return { ...prev, title: value, slug: createSlug(value) };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.slug.trim() || !form.durationMin || !form.releaseDate) {
      setError("Vui lòng nhập đủ tên phim, slug, thời lượng và ngày phát hành");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = normalizeMoviePayload(form);

      if (editingMovie) {
        await axiosClient.put(`/admin/movies/${editingMovie.id}`, payload);
      } else {
        await axiosClient.post("/admin/movies", payload);
      }

      closeModal();
      await fetchMovies();
    } catch (err) {
      console.error("Save movie error:", err);
      setError(err.message || "Không thể lưu phim. Kiểm tra endpoint admin/movies ở backend.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (movie) => {
    const ok = window.confirm(`Xóa phim "${movie.title}"?`);
    if (!ok) return;

    try {
      setError("");
      await axiosClient.delete(`/admin/movies/${movie.id}`);
      setMovies((prev) => prev.filter((item) => item.id !== movie.id));
    } catch (err) {
      console.error("Delete movie error:", err);
      setError(err.message || "Không thể xóa phim. Có thể backend chưa có API DELETE /admin/movies/{id}.");
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchMovies();
  };

  return (
    <main className="admin-movies-page">
      <section className="admin-movies-hero">
        <div>
          <p className="admin-eyebrow">Quản trị nội dung</p>
          <h1>Quản lý phim</h1>
          <p className="admin-hero-desc">
            Theo dõi danh sách phim, trạng thái chiếu, thông tin poster, trailer và dữ liệu hiển thị cho khách đặt vé.
          </p>
        </div>

        <button className="admin-primary-btn" onClick={openCreateModal}>
          <span className="material-symbols-outlined">add</span>
          Thêm phim
        </button>
      </section>

      <section className="movie-stats-grid">
        <div className="movie-stat-card">
          <span>Tổng phim</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="movie-stat-card">
          <span>Đang chiếu</span>
          <strong>{stats.showing}</strong>
        </div>
        <div className="movie-stat-card">
          <span>Sắp chiếu</span>
          <strong>{stats.coming}</strong>
        </div>
        <div className="movie-stat-card">
          <span>Đã kết thúc</span>
          <strong>{stats.ended}</strong>
        </div>
      </section>

      <section className="movie-toolbar glass-panel">
        <form className="movie-search" onSubmit={handleSearchSubmit}>
          <span className="material-symbols-outlined">search</span>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm phim theo tên, slug, đạo diễn..."
          />
          <button type="submit">Tìm</button>
        </form>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </section>

      {error && <div className="admin-error-box">{error}</div>}

      <section className="glass-panel movie-table-panel">
        <div className="movie-table-header">
          <h2>Danh sách phim</h2>
          <span>{filteredMovies.length} kết quả</span>
        </div>

        {loading ? (
          <div className="admin-empty-state">Đang tải dữ liệu phim...</div>
        ) : filteredMovies.length === 0 ? (
          <div className="admin-empty-state">Chưa có phim phù hợp</div>
        ) : (
          <div className="movie-table-wrap">
            <table className="movie-table">
              <thead>
                <tr>
                  <th>Phim</th>
                  <th>Thời lượng</th>
                  <th>Phát hành</th>
                  <th>Đánh giá</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredMovies.map((movie) => (
                  <tr key={movie.id}>
                    <td>
                      <div className="movie-info-cell">
                        <img
                          src={movie.posterUrl || "https://placehold.co/120x180/201f1f/e5e2e1?text=Cine"}
                          alt={movie.title}
                          onError={(e) => {
                            e.currentTarget.src = "https://placehold.co/120x180/201f1f/e5e2e1?text=Cine";
                          }}
                        />
                        <div>
                          <strong>{movie.title}</strong>
                          <span>{movie.slug}</span>
                          <small>{movie.country || "—"} · {movie.language || "—"}</small>
                        </div>
                      </div>
                    </td>
                    <td>{movie.durationMin || "—"} phút</td>
                    <td>{formatDate(movie.releaseDate)}</td>
                    <td>
                      <span className="rating-pill">
                        <span className="material-symbols-outlined">star</span>
                        {movie.rating ?? "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${statusClass[movie.status] || ""}`}>
                        {statusLabel[movie.status] || movie.status || "—"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button onClick={() => openEditModal(movie)} title="Sửa phim">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button onClick={() => handleDelete(movie)} title="Xóa phim">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="movie-modal-backdrop" onMouseDown={closeModal}>
          <div className="movie-modal glass-panel" onMouseDown={(e) => e.stopPropagation()}>
            <div className="movie-modal-header">
              <div>
                <p className="admin-eyebrow">{editingMovie ? "Cập nhật" : "Tạo mới"}</p>
                <h2>{editingMovie ? "Sửa thông tin phim" : "Thêm phim mới"}</h2>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form className="movie-form" onSubmit={handleSubmit}>
              <div className="form-grid two-cols">
                <label>
                  Tên phim *
                  <input name="title" value={form.title} onChange={handleChange} placeholder="Ví dụ: Mai" />
                </label>
                <label>
                  Tên gốc
                  <input name="originalTitle" value={form.originalTitle} onChange={handleChange} />
                </label>
              </div>

              <label>
                Slug *
                <input name="slug" value={form.slug} onChange={handleChange} placeholder="mai" />
              </label>

              <label>
                Mô tả
                <textarea name="description" value={form.description} onChange={handleChange} rows="4" />
              </label>

              <div className="form-grid three-cols">
                <label>
                  Thời lượng *
                  <input name="durationMin" type="number" min="1" value={form.durationMin} onChange={handleChange} />
                </label>
                <label>
                  Ngày phát hành *
                  <input name="releaseDate" type="date" value={form.releaseDate} onChange={handleChange} />
                </label>
                <label>
                  Ngày kết thúc
                  <input name="endDate" type="date" value={form.endDate} onChange={handleChange} />
                </label>
              </div>

              <div className="form-grid three-cols">
                <label>
                  Ngôn ngữ
                  <input name="language" value={form.language} onChange={handleChange} />
                </label>
                <label>
                  Quốc gia
                  <input name="country" value={form.country} onChange={handleChange} />
                </label>
                <label>
                  Đạo diễn
                  <input name="director" value={form.director} onChange={handleChange} />
                </label>
              </div>

              <label>
                Diễn viên
                <input name="castList" value={form.castList} onChange={handleChange} placeholder="Ngăn cách bằng dấu phẩy" />
              </label>

              <div className="form-grid two-cols">
                <label>
                  Poster URL
                  <input name="posterUrl" value={form.posterUrl} onChange={handleChange} />
                </label>
                <label>
                  Trailer URL
                  <input name="trailerUrl" value={form.trailerUrl} onChange={handleChange} />
                </label>
              </div>

              <div className="form-grid three-cols">
                <label>
                  Rating
                  <input name="rating" type="number" step="0.1" min="0" max="10" value={form.rating} onChange={handleChange} />
                </label>
                <label>
                  Độ tuổi
                  <select name="ageRating" value={form.ageRating} onChange={handleChange}>
                    {AGE_OPTIONS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Trạng thái
                  <select name="status" value={form.status} onChange={handleChange}>
                    {STATUS_OPTIONS.filter((item) => item.value !== "ALL").map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="admin-secondary-btn" onClick={closeModal}>
                  Hủy
                </button>
                <button type="submit" className="admin-primary-btn" disabled={saving}>
                  {saving ? "Đang lưu..." : editingMovie ? "Lưu thay đổi" : "Tạo phim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default MoviesPage;
