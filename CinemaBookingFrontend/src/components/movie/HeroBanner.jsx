import { useNavigate } from 'react-router-dom';
import { formatDuration, formatDate } from '../../utils/format';

const HeroBanner = ({ movie }) => {
  const navigate = useNavigate();

  if (!movie) {
    return (
      <section className="hero-banner hero-banner-empty">
        <div className="hero-banner-copy">
          <p className="hero-eyebrow">Rạp chiếu phim hiện đại</p>
          <h1>Đắm chìm trong thế giới điện ảnh</h1>
          <p className="hero-description">
            Khám phá phim mới, trailer hấp dẫn và lịch chiếu chuẩn xác ngay hôm nay.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={() => navigate('/movies')}>
              Khám phá phim
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="hero-banner">
      <div className="hero-banner-media">
        <img
          src={movie.posterUrl || '/placeholder-poster.jpg'}
          alt={movie.title}
          loading="lazy"
          onError={(e) => {
            e.target.src = '/placeholder-poster.jpg';
            e.target.onerror = null;
          }}
        />
      </div>

      <div className="hero-banner-copy">
        <span className="hero-eyebrow">Phim nổi bật</span>
        <h1>{movie.title}</h1>
        {movie.genres?.length > 0 && (
          <p className="hero-genres">{movie.genres.map((genre) => genre.name).join(', ')}</p>
        )}

        <div className="hero-meta">
          {movie.durationMin && <span>{formatDuration(movie.durationMin)}</span>}
          {movie.releaseDate && <span>{formatDate(movie.releaseDate)}</span>}
        </div>

        <div className="hero-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(`/movies/${movie.slug}`)}
          >
            Xem chi tiết
          </button>
          {movie.trailerUrl && (
            <a
              href={movie.trailerUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              Xem trailer
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
