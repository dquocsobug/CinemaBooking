import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import "./ShowtimesPage.css";

const initialForm = {
  movieId: "",
  roomId: "",
  startTime: "",
  endTime: "",
  basePrice: "90000",
  language: "Phụ đề",
  subtitleLang: "Tiếng Việt",
  format: "TWO_D",
  status: "OPEN",
};

const statusOptions = ["OPEN", "SCHEDULED", "CANCELLED", "COMPLETED"];
const formatOptions = ["TWO_D", "THREE_D", "IMAX", "FOUR_DX", "SCREENX"];

function unwrapPage(res) {
  return res?.data?.content || res?.data || [];
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN") + "đ";
}

function formatDateTime(value) {
  if (!value) return "--";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}


function toDateInputValue(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ShowtimesPage() {
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [selectedDate, setSelectedDate] = useState(toDateInputValue());
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [formatFilter, setFormatFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  
  const selectedMovie = useMemo(
    () => movies.find((movie) => movie.id === selectedMovieId),
    [movies, selectedMovieId]
  );

  const filteredShowtimes = useMemo(() => {
    const query = keyword.trim().toLowerCase();

    return showtimes.filter((item) => {
      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchFormat = formatFilter === "ALL" || item.format === formatFilter || item.roomType === formatFilter;
      const text = `${item.movieTitle || ""} ${item.cinemaName || ""} ${item.roomName || ""}`.toLowerCase();
      const matchKeyword = !query || text.includes(query);
      return matchStatus && matchFormat && matchKeyword;
    });
  }, [showtimes, statusFilter, formatFilter, keyword]);

  const stats = useMemo(() => {
    return {
      total: filteredShowtimes.length,
      open: filteredShowtimes.filter((x) => x.status === "OPEN").length,
      scheduled: filteredShowtimes.filter((x) => x.status === "SCHEDULED").length,
      cancelled: filteredShowtimes.filter((x) => x.status === "CANCELLED").length,
    };
  }, [filteredShowtimes]);

  useEffect(() => {
    fetchMovies();
    fetchRoomsSafely();
  }, []);

  useEffect(() => {
    if (selectedMovieId) fetchShowtimes();
  }, [selectedMovieId, selectedDate]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/movies/now-showing");
      const list = unwrapPage(res);
      setMovies(list);

      if (list.length > 0) {
        setSelectedMovieId((prev) => prev || list[0].id);
        setForm((prev) => ({ ...prev, movieId: prev.movieId || list[0].id }));
      }
    } catch (err) {
      console.error("Fetch movies error:", err);
      setError(err.message || "Không thể tải danh sách phim");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomsSafely = async () => {
  // Backend hiện chưa có /admin/rooms nên không gọi API để tránh 404.
  setRooms([]);
};

  const fetchShowtimes = async () => {
    if (!selectedMovieId) return;

    try {
      setLoading(true);
      setError("");
      const res = await axiosClient.get(`/showtimes?movieId=${selectedMovieId}&date=${selectedDate}`);
      setShowtimes(res?.data || []);
    } catch (err) {
      console.error("Fetch showtimes error:", err);
      setError(err.message || "Không thể tải lịch chiếu");
      setShowtimes([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ ...initialForm, movieId: selectedMovieId || movies[0]?.id || "", roomId: rooms[0]?.id || "" });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setForm({
      movieId: item.movieId || selectedMovieId,
      roomId: item.roomId || "",
      startTime: item.startTime ? item.startTime.slice(0, 16) : "",
      endTime: item.endTime ? item.endTime.slice(0, 16) : "",
      basePrice: item.basePrice || "",
      language: item.language || "Phụ đề",
      subtitleLang: item.subtitleLang || "Tiếng Việt",
      format: item.format || item.roomType || "TWO_D",
      status: item.status || "OPEN",
    });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => ({
    movieId: form.movieId,
    roomId: form.roomId,
    startTime: form.startTime,
    endTime: form.endTime,
    basePrice: Number(form.basePrice || 0),
    language: form.language,
    subtitleLang: form.subtitleLang,
    format: form.format,
    status: form.status,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.movieId || !form.roomId || !form.startTime || !form.endTime) {
      setError("Vui lòng nhập đầy đủ phim, phòng, giờ bắt đầu và giờ kết thúc");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await axiosClient.put(`/admin/showtimes/${editingId}`, buildPayload());
      } else {
        await axiosClient.post("/admin/showtimes", buildPayload());
      }

      setModalOpen(false);
      await fetchShowtimes();
    } catch (err) {
      console.error("Save showtime error:", err);
      setError(err.message || "Không thể lưu suất chiếu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Bạn chắc chắn muốn xóa suất chiếu này?");
    if (!ok) return;

    try {
      await axiosClient.delete(`/admin/showtimes/${id}`);
      await fetchShowtimes();
    } catch (err) {
      console.error("Delete showtime error:", err);
      setError(err.message || "Không thể xóa suất chiếu");
    }
  };

  return (
    <main className="admin-showtimes-page">
      <section className="showtimes-hero glass-panel">
        <div>
          <p className="eyebrow">Admin Control</p>
          <h1>Quản lý suất chiếu</h1>
          <p>Tạo, lọc và theo dõi lịch chiếu theo phim, ngày, phòng và trạng thái.</p>
        </div>
        <button className="primary-btn" onClick={openCreateModal}>
          <span className="material-symbols-outlined">add</span>
          Tạo suất chiếu
        </button>
      </section>

      {error && <div className="admin-alert">{error}</div>}

      <section className="showtime-stats-grid">
        <article className="stat-card glass-panel">
          <span className="material-symbols-outlined">event_available</span>
          <div><strong>{stats.total}</strong><p>Tổng suất</p></div>
        </article>
        <article className="stat-card glass-panel">
          <span className="material-symbols-outlined">lock_open</span>
          <div><strong>{stats.open}</strong><p>Đang mở</p></div>
        </article>
        <article className="stat-card glass-panel">
          <span className="material-symbols-outlined">schedule</span>
          <div><strong>{stats.scheduled}</strong><p>Đã lên lịch</p></div>
        </article>
        <article className="stat-card glass-panel danger">
          <span className="material-symbols-outlined">event_busy</span>
          <div><strong>{stats.cancelled}</strong><p>Đã hủy</p></div>
        </article>
      </section>

      <section className="filters-card glass-panel">
        <label>
          <span>Phim</span>
          <select value={selectedMovieId} onChange={(e) => setSelectedMovieId(e.target.value)}>
            {movies.map((movie) => <option key={movie.id} value={movie.id}>{movie.title}</option>)}
          </select>
        </label>

        <label>
          <span>Ngày</span>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </label>

        <label>
          <span>Trạng thái</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">Tất cả</option>
            {statusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>

        <label>
          <span>Định dạng</span>
          <select value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)}>
            <option value="ALL">Tất cả</option>
            {formatOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>

        <label className="search-field">
          <span>Tìm kiếm</span>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tên rạp, phòng, phim..." />
        </label>
      </section>

      <section className="showtimes-table-card glass-panel">
        <div className="table-header">
          <div>
            <h2>{selectedMovie?.title || "Lịch chiếu"}</h2>
            <p>{selectedDate} • {filteredShowtimes.length} suất chiếu</p>
          </div>
          <button className="ghost-btn" onClick={fetchShowtimes} disabled={loading}>
            <span className="material-symbols-outlined">refresh</span>
            Làm mới
          </button>
        </div>

        {loading ? (
          <div className="empty-state">Đang tải dữ liệu...</div>
        ) : filteredShowtimes.length === 0 ? (
          <div className="empty-state">Không có suất chiếu phù hợp.</div>
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Phim</th>
                  <th>Rạp / Phòng</th>
                  <th>Bắt đầu</th>
                  <th>Kết thúc</th>
                  <th>Định dạng</th>
                  <th>Giá vé</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredShowtimes.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="movie-cell">
                        <img src={item.moviePoster || "https://via.placeholder.com/80x120?text=Movie"} alt={item.movieTitle} />
                        <div><strong>{item.movieTitle}</strong><span>{item.language || "--"}</span></div>
                      </div>
                    </td>
                    <td><strong>{item.cinemaName}</strong><span>{item.roomName} • {item.roomType}</span></td>
                    <td>{formatDateTime(item.startTime)}</td>
                    <td>{formatDateTime(item.endTime)}</td>
                    <td><span className="format-pill">{item.format || item.roomType || "--"}</span></td>
                    <td>{formatMoney(item.basePrice)}</td>
                    <td><span className={`status-pill ${String(item.status).toLowerCase()}`}>{item.status}</span></td>
                    <td>
                      <div className="row-actions">
                        <button onClick={() => openEditModal(item)}><span className="material-symbols-outlined">edit</span></button>
                        <button onClick={() => handleDelete(item.id)}><span className="material-symbols-outlined">delete</span></button>
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
        <div className="modal-backdrop" onMouseDown={() => setModalOpen(false)}>
          <form className="showtime-modal glass-panel" onSubmit={handleSubmit} onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-title-row">
              <div><p className="eyebrow">Showtime</p><h2>{editingId ? "Cập nhật suất chiếu" : "Tạo suất chiếu"}</h2></div>
              <button type="button" className="icon-btn" onClick={() => setModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="form-grid">
              <label><span>Phim</span><select name="movieId" value={form.movieId} onChange={handleChange}>{movies.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}</select></label>
              <label><span>Phòng chiếu</span>{rooms.length > 0 ? <select name="roomId" value={form.roomId} onChange={handleChange}>{rooms.map((r) => <option key={r.id} value={r.id}>{r.cinemaName ? `${r.cinemaName} - ` : ""}{r.name || r.roomName}</option>)}</select> : <input name="roomId" value={form.roomId} onChange={handleChange} placeholder="Nhập roomId UUID" />}</label>
              <label><span>Bắt đầu</span><input type="datetime-local" name="startTime" value={form.startTime} onChange={handleChange} /></label>
              <label><span>Kết thúc</span><input type="datetime-local" name="endTime" value={form.endTime} onChange={handleChange} /></label>
              <label><span>Giá cơ bản</span><input name="basePrice" value={form.basePrice} onChange={handleChange} inputMode="numeric" /></label>
              <label><span>Ngôn ngữ</span><input name="language" value={form.language} onChange={handleChange} /></label>
              <label><span>Phụ đề</span><input name="subtitleLang" value={form.subtitleLang} onChange={handleChange} /></label>
              <label><span>Định dạng</span><select name="format" value={form.format} onChange={handleChange}>{formatOptions.map((f) => <option key={f} value={f}>{f}</option>)}</select></label>
              <label><span>Trạng thái</span><select name="status" value={form.status} onChange={handleChange}>{statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
            </div>

            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setModalOpen(false)}>Hủy</button>
              <button type="submit" className="primary-btn" disabled={saving}>{saving ? "Đang lưu..." : "Lưu suất chiếu"}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
