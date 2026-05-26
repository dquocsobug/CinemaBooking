# 🎬 Cinema Booking System

> Full-stack online movie ticket booking platform with realtime seat locking, JWT authentication, MoMo/VNPay integration, and WebSocket synchronization.

🌐 **Live Demo:** [CinemaBooking Live Demo](https://cinema-booking-dquoc.vercel.app/)

---

## 🏗️ System Architecture

```
Frontend (React + Vite)
        ↓
REST API + WebSocket
        ↓
Spring Boot Backend
        ↓
PostgreSQL + Redis
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Version |
|---|---|
| Java | 21 |
| Spring Boot | 3.3 |
| Spring Security + JWT | — |
| Spring Data JPA | — |
| Redis | 7 |
| WebSocket (STOMP) | — |
| PostgreSQL | 16 |
| MapStruct / Lombok / Maven | — |

### Frontend
- React + Vite
- Axios
- React Router
- Tailwind CSS

### DevOps & Deployment
- PostgreSQL hosted on **Neon**
- Backend deployed on **Render**
- Frontend deployed on **Vercel**
- CI/CD with **GitHub Actions**
- **Docker Compose** for local development

---

## 📁 Project Structure

```
CinemaBooking/
│
├── CenimaBackend/            # Spring Boot backend
├── CinemaBookingFrontend/    # React frontend
└── .github/workflows/        # GitHub Actions CI/CD
```

### Backend Package Structure

```
src/main/java/com/cinema/
├── config/
├── controller/
├── dto/
├── entity/
├── enums/
├── event/
├── exception/
├── repository/
├── security/
├── service/
├── util/
└── websocket/
```

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT Authentication
- Role-based Authorization
- Refresh Token Flow
- Spring Security

### 🎥 Movie Management
- Browse & search movies
- Movie detail pages
- Genre filtering

### 🪑 Realtime Seat Booking
- Realtime seat locking with Redis
- WebSocket synchronization
- Automatic seat release after timeout
- Duplicate booking prevention

### 💳 Online Payment
- VNPay integration
- MoMo integration
- QR ticket generation

### 📡 Realtime WebSocket
- STOMP over WebSocket
- Live seat updates
- Seat lock / release / book events

### 🎟️ Ticket Management
- QR Code ticket validation
- Staff ticket scanning

### 🎁 Voucher System
- Voucher validation
- Discount calculation

### ⭐ Reviews
- Movie reviews and ratings

---

## 🔐 Authentication Flow

```
POST /api/v1/auth/register
POST /api/v1/auth/login
        ↓
→ accessToken
→ refreshToken

Authorization: Bearer <token>
```

---

## 🪑 Realtime Seat Booking Flow

```
1. Client requests seat map
2. User locks seats
3. Redis SET NX EX seat locking
4. WebSocket broadcasts SEAT_LOCKED
5. User creates booking
6. Payment initiated (MoMo / VNPay)
7. Payment callback confirms booking
8. WebSocket broadcasts SEAT_BOOKED
9. Redis TTL releases expired locks
```

---

## 📡 WebSocket Events

**Subscribe Endpoint**
```
ws://localhost:8080/ws
```

**Topic**
```
/topic/showtime/{showtimeId}
```

**Events**

```json
{ "type": "SEAT_LOCKED",   "showtimeId": "...", "seatId": "...", "seatCode": "B5", "status": "LOCKED" }
{ "type": "SEAT_RELEASED", "showtimeId": "...", "seatId": "...", "status": "AVAILABLE" }
{ "type": "SEAT_BOOKED",   "showtimeId": "...", "seatId": "...", "seatCode": "B5", "status": "BOOKED" }
```

---

## 🗝️ Redis Key Design

| Key Pattern | Type | TTL | Purpose |
|---|---|---|---|
| `seat:lock:{stId}:{seatId}` | STRING | 300s | Seat locking |
| `showtime:locked:{stId}` | SET | — | Locked seats |
| `booking:session:{userId}:{stId}` | HASH | 300s | Temporary booking cart |
| `showtime:seatmap:{stId}` | HASH | 60s | Seat map cache |
| `ratelimit:payment:{userId}` | STRING | 60s | Payment rate limiting |

---

## 🌐 Main API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/movies/now-showing` | Now showing movies |
| GET | `/api/v1/movies/search` | Search movies |
| GET | `/api/v1/showtimes/{id}/seat-map` | Realtime seat map |
| POST | `/api/v1/bookings/lock-seats` | Lock seats |
| POST | `/api/v1/bookings` | Create booking |
| POST | `/api/v1/payments/initiate` | Initialize payment |
| POST | `/api/v1/payments/callback/momo` | MoMo callback |
| POST | `/api/v1/payments/callback/vnpay` | VNPay callback |
| POST | `/api/v1/staff/tickets/scan` | Ticket scan |

---

## ⚙️ Environment Variables

### Backend
```env
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASS=

REDIS_HOST=
REDIS_PORT=
REDIS_PASS=

JWT_SECRET=

FRONTEND_URL=
```

### Frontend
```env
VITE_API_URL=
```

---

## 🐳 Docker Development

```bash
docker-compose up -d
```

| Service | URL |
|---|---|
| Backend | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## 🚀 CI/CD Pipeline

```
Push to GitHub
       ↓
GitHub Actions (build backend + frontend)
       ↓
Render auto-deploy backend
       ↓
Vercel auto-deploy frontend
```

---

## 🔥 Key Technical Highlights

- Redis distributed seat locking using `SET NX EX`
- WebSocket realtime synchronization
- Redis Keyspace Notifications
- Scheduler-based stale booking cleanup
- Strategy Pattern for payment gateways
- JWT stateless authentication
- Role-based authorization
- Dockerized local development
- CI/CD automation with GitHub Actions

---

## 👨‍💻 Author

**Duy Quốc** — [GitHub: dquocsobug](https://github.com/dquocsobug)

---

## 📄 License

This project is for educational and portfolio purposes.
