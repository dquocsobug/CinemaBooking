// import { Routes, Route } from 'react-router-dom';

// // Layout
// import Layout from '../components/layout/Layout';

// // Pages
// import HomePage from '../pages/HomePage';
// import HomePage from '../pages/MoviesPage';
// // import MovieDetailPage from '../pages/MovieDetailPage';
// // import LoginPage from '../pages/LoginPage';
// // import RegisterPage from '../pages/RegisterPage';
// // import NotFoundPage from '../pages/NotFoundPage';
// // import PaymentResultPage from '../pages/PaymentResultPage';

// // import SeatBookingPage from '../pages/SeatBookingPage';
// // import PaymentPage from '../pages/PaymentPage';
// // import BookingHistoryPage from '../pages/BookingHistoryPage';
// // import ProfilePage from '../pages/ProfilePage';

// // Admin
// // import AdminLayout from '../components/admin/AdminLayout';
// // import DashboardPage from '../pages/admin/DashboardPage';
// // import MoviesPage from '../pages/admin/MoviesPage';
// // import ShowtimesPage from '../pages/admin/ShowtimesPage';

// // Guards
// // import ProtectedRoute from './ProtectedRoute';

// const AppRouter = () => {
//   return (
//     <Routes>
//       {/* =========================
//           ONLY HOME PAGE ACTIVE
//       ========================== */}
//       <Route element={<Layout />}>
//         <Route path="/" element={<HomePage />} />
//       </Route>

//       {/* =========================
//           AUTH PAGES (DISABLED)
//       ========================== */}
//       {/*
//       <Route path="/login" element={<LoginPage />} />
//       <Route path="/register" element={<RegisterPage />} />
//       */}

//       {/* =========================
//           MOVIE DETAIL (DISABLED)
//       ========================== */}
      
//       <Route path="/movies/:slug" element={<MovieDetailPage />} />
     

//       {/* =========================
//           BOOKING FLOW (DISABLED)
//       ========================== */}
//       {/*
//       <Route path="/booking/:showtimeId" element={<SeatBookingPage />} />
//       <Route path="/payment/:bookingId" element={<PaymentPage />} />
//       <Route path="/my-bookings" element={<BookingHistoryPage />} />
//       <Route path="/profile" element={<ProfilePage />} />
//       <Route path="/payment/result/:bookingCode" element={<PaymentResultPage />} />
//       */}

//       {/* =========================
//           ADMIN (DISABLED)
//       ========================== */}
//       {/*
//       <Route path="/admin" element={<AdminLayout />}>
//         <Route index element={<DashboardPage />} />
//         <Route path="movies" element={<MoviesPage />} />
//         <Route path="showtimes" element={<ShowtimesPage />} />
//       </Route>
//       */}

//       {/* =========================
//           404 (DISABLED)
//       ========================== */}
//       {/*
//       <Route path="*" element={<NotFoundPage />} />
//       */}
//     </Routes>
//   );
// };

// export default AppRouter;

import { Routes, Route } from "react-router-dom";

import Layout from "../components/layout/Layout";

import HomePage from "../pages/HomePage";
import MoviesPage from "../pages/MoviesPage";
import ComingSoonPage from "../pages/ComingSoonPage";
import CinemasPage from "../pages/CinemasPage";
import PromotionsPage from "../pages/PromotionsPage";
import MovieDetailPage from "../pages/MovieDetailPage";
import ShowtimeSelectionPage from "../pages/ShowtimeSelectionPage";
import SeatBookingPage from "../pages/SeatBookingPage";
import PaymentPage from "../pages/PaymentPage";
import PaymentResultPage from "../pages/PaymentResultPage";
import ProfilePage from "../pages/ProfilePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import BookingHistoryPage from "../pages/BookingHistoryPage";

import AdminLayout from "../components/admin/AdminLayout";
import DashboardPage from "../pages/admin/DashboardPage";
import AdminMoviesPage from "../pages/admin/MoviesPage";
import ShowtimesPage from "../pages/admin/ShowtimesPage";

const AppRouter = () => {
  return (
    <Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />

  {/* ADMIN - không dùng Layout user */}
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<DashboardPage />} />
    <Route path="movies" element={<AdminMoviesPage />} />
    <Route path="showtimes" element={<ShowtimesPage />} />
  </Route>

  {/* USER - mới dùng Layout có Header/Footer */}
  <Route element={<Layout />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/movies" element={<MoviesPage />} />
    <Route path="/coming-soon" element={<ComingSoonPage />} />
    <Route path="/cinemas" element={<CinemasPage />} />
    <Route path="/promotions" element={<PromotionsPage />} />
    <Route path="/movies/:slug" element={<MovieDetailPage />} />
    <Route path="/showtimes/:movieSlug" element={<ShowtimeSelectionPage />} />
    <Route path="/booking/:showtimeId" element={<SeatBookingPage />} />
    <Route path="/payment/:bookingId" element={<PaymentPage />} />
    <Route path="/payment/result" element={<PaymentResultPage />} />
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/booking-history" element={<BookingHistoryPage />} />
  </Route>
    </Routes>
  );
};

export default AppRouter;