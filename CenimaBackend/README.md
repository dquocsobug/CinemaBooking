# 🎬 Cinema Booking System — Backend

> Spring Boot 3.3 · PostgreSQL 16 · Redis 7 · Java 21 · WebSocket (STOMP)

---

## 📁 Cấu trúc dự án

```
src/main/java/com/cinema/
├── CinemaBookingApplication.java
├── config/
│   ├── SecurityConfig.java          # JWT + CORS + Method Security
│   ├── RedisConfig.java             # RedisTemplate + CacheManager + Keyspace Listener
│   ├── WebSocketConfig.java         # STOMP over WebSocket
│   ├── JpaAuditingConfig.java       # AuditorAware
│   └── OpenApiConfig.java           # Swagger UI
├── controller/
│   ├── AuthController.java          # POST /api/v1/auth/register|login
│   ├── MovieController.java         # GET /api/v1/movies/**
│   ├── ShowtimeController.java      # GET /api/v1/showtimes/**
│   ├── BookingController.java       # POST /api/v1/bookings/**
│   ├── PaymentController.java       # POST /api/v1/payments/**
│   ├── ReviewController.java        # CRUD /api/v1/reviews
│   ├── CinemaController.java        # GET /api/v1/cinemas
│   ├── GenreController.java         # GET /api/v1/genres
│   ├── UserController.java          # GET /api/v1/users/me
│   ├── VoucherController.java       # GET /api/v1/vouchers/validate
│   ├── TicketController.java        # POST /api/v1/staff/tickets/scan
│   ├── AdminShowtimeController.java # POST /api/v1/admin/showtimes
│   └── WebSocketController.java     # STOMP /app/showtime/{id}/ping
├── entity/                          # JPA Entities (14 tables)
├── enums/                           # BookingStatus, SeatStatus, ...
├── repository/                      # Spring Data JPA Repositories
├── service/
│   ├── impl/
│   │   ├── AuthService.java
│   │   ├── MovieService.java
│   │   ├── ShowtimeService.java
│   │   ├── BookingService.java      # ★ Core booking + seat lock flow
│   │   ├── PaymentService.java
│   │   ├── ReviewService.java
│   │   ├── VoucherService.java
│   │   ├── TicketService.java
│   │   └── CinemaService.java
│   ├── SeatLockService.java         # ★ Redis seat locking (NX EX)
│   └── payment/
│       ├── PaymentGateway.java      # Strategy interface
│       ├── MomoGateway.java
│       └── VnpayGateway.java
├── security/
│   ├── JwtTokenProvider.java
│   ├── JwtAuthenticationFilter.java
│   └── UserDetailsServiceImpl.java
├── websocket/
│   ├── SeatEvent.java
│   └── SeatWebSocketPublisher.java  # Broadcast SEAT_LOCKED/RELEASED/BOOKED
├── event/
│   ├── RedisKeyspaceListener.java   # Bắt TTL expired → broadcast WebSocket
│   └── BookingScheduler.java        # Expire stale bookings mỗi 60s
├── dto/
│   ├── request/                     # LoginRequest, CreateBookingRequest, ...
│   └── response/                    # ApiResponse<T>, PageResponse<T>, ...
├── exception/
│   ├── GlobalExceptionHandler.java
│   └── [Custom Exceptions]
└── util/
    ├── RedisKeyConstants.java       # Redis key naming conventions
    ├── SecurityUtils.java
    └── SlugUtils.java
```

---

## 🚀 Khởi chạy nhanh

```bash
# Clone và chạy toàn bộ stack
docker-compose up -d

# App chạy tại: http://localhost:8080
# Swagger UI:   http://localhost:8080/swagger-ui.html
# PostgreSQL:   localhost:5432 / cinema_db
# Redis:        localhost:6379
```

---

## 🔐 Authentication Flow

```
POST /api/v1/auth/register   { email, password, fullName }
POST /api/v1/auth/login      { email, password }
  → { accessToken, refreshToken, user }

Header: Authorization: Bearer <accessToken>
```

---

## 🪑 Seat Booking Flow (Realtime)

```
1. [GET]  /api/v1/showtimes/{id}/seat-map
         → Danh sách tất cả ghế + trạng thái (AVAILABLE/LOCKED/BOOKED)
         → Client subscribe WebSocket: /topic/showtime/{id}

2. [POST] /api/v1/bookings/lock-seats
         { showtimeId, seatIds[] }
         → Redis SET seat:lock:{stId}:{seatId} NX EX 300
         → WebSocket broadcast: SEAT_LOCKED

3. [POST] /api/v1/bookings
         { showtimeId, seatIds[], voucherCode? }
         → Tạo Booking + BookingSeats trong PostgreSQL
         → UNIQUE constraint bắt duplicate ở DB level

4. [POST] /api/v1/payments/initiate
         { bookingId, method: "MOMO"|"VNPAY" }
         → Trả về paymentUrl (redirect sang cổng thanh toán)

5. [POST] /api/v1/payments/callback/momo  (từ MoMo server)
         → Xác minh signature → UPDATE booking CONFIRMED
         → Redis: markSeatsBooked → DEL lock keys
         → WebSocket broadcast: SEAT_BOOKED
         → Tạo Ticket với QR code

6. Nếu user không thanh toán trong 5 phút:
         → Redis TTL expired → KeyspaceListener
         → WebSocket broadcast: SEAT_RELEASED
         → Scheduler: UPDATE booking EXPIRED
```

---

## 📡 WebSocket Events

Subscribe: `ws://localhost:8080/ws` (SockJS)
Topic: `/topic/showtime/{showtimeId}`

```json
// SEAT_LOCKED
{ "type": "SEAT_LOCKED",  "showtimeId": "...", "seatId": "...", "seatCode": "B5",  "status": "LOCKED"    }

// SEAT_RELEASED (Redis TTL expired)
{ "type": "SEAT_RELEASED","showtimeId": "...", "seatId": "...", "status": "AVAILABLE" }

// SEAT_BOOKED (thanh toán thành công)
{ "type": "SEAT_BOOKED",  "showtimeId": "...", "seatId": "...", "seatCode": "B5",  "status": "BOOKED"    }
```

---

## 🗝️ Redis Key Design

| Key Pattern | Type | TTL | Mục đích |
|---|---|---|---|
| `seat:lock:{stId}:{seatId}` | STRING | 300s | Giữ ghế cho user |
| `showtime:locked:{stId}` | SET | - | Tập hợp seatId đang bị lock |
| `booking:session:{userId}:{stId}` | HASH | 300s | Giỏ hàng tạm |
| `showtime:seatmap:{stId}` | HASH | 60s | Cache trạng thái sơ đồ ghế |
| `ratelimit:payment:{userId}` | STRING | 60s | Chống spam thanh toán |

---

## 🌐 API Endpoints

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Đăng ký |
| POST | `/api/v1/auth/login` | Public | Đăng nhập |
| GET | `/api/v1/movies/now-showing` | Public | Phim đang chiếu |
| GET | `/api/v1/movies/{slug}` | Public | Chi tiết phim |
| GET | `/api/v1/movies/search?q=` | Public | Tìm kiếm phim |
| GET | `/api/v1/showtimes?movieId=&date=` | Public | Lịch chiếu |
| GET | `/api/v1/showtimes/{id}/seat-map` | Public | Sơ đồ ghế realtime |
| POST | `/api/v1/bookings/lock-seats` | User | Giữ ghế (Redis) |
| POST | `/api/v1/bookings` | User | Tạo booking |
| GET | `/api/v1/bookings` | User | Lịch sử đặt vé |
| POST | `/api/v1/payments/initiate` | User | Khởi tạo thanh toán |
| POST | `/api/v1/payments/callback/momo` | System | Callback MoMo |
| POST | `/api/v1/payments/callback/vnpay` | System | Callback VNPay |
| GET | `/api/v1/vouchers/validate?code=` | User | Kiểm tra voucher |
| POST | `/api/v1/reviews` | User | Đánh giá phim |
| POST | `/api/v1/staff/tickets/scan?code=` | Staff | Quét vé tại cổng |
| POST | `/api/v1/admin/showtimes` | Admin | Tạo suất chiếu |

---

## ⚙️ Environment Variables

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cinema_db
DB_USER=postgres
DB_PASS=postgres
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASS=
JWT_SECRET=<min-256-bit-secret>
FRONTEND_URL=http://localhost:3000
```

---

## 🏗️ Tech Stack

- **Java 21** — Virtual threads ready
- **Spring Boot 3.3** — Web, Security, Data JPA, WebSocket, Cache
- **PostgreSQL 16** — Main database với EXCLUDE USING GIST chống trùng lịch
- **Redis 7** — Seat locking (SET NX EX), Keyspace Notifications, Cache
- **Redisson** — Redis distributed lock nâng cao (nếu cần)
- **JWT (JJWT 0.12)** — Stateless authentication
- **STOMP WebSocket** — Realtime seat map broadcast
- **MapStruct** — DTO mapping
- **Lombok** — Boilerplate reduction
- **Docker Compose** — Local development stack
