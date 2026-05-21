import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { hasRole } from '../utils/helpers';

/**
 * ProtectedRoute — Bảo vệ route theo trạng thái đăng nhập và role.
 *
 * @param {React.ReactNode} children
 * @param {string[]} roles - Danh sách role được phép (nếu bỏ trống → chỉ cần đăng nhập)
 * @param {string} redirectTo - Đường dẫn redirect nếu không đủ quyền
 *
 * @example
 * // Chỉ cần đăng nhập
 * <ProtectedRoute><BookingHistoryPage /></ProtectedRoute>
 *
 * // Cần role ADMIN
 * <ProtectedRoute roles={["ROLE_ADMIN"]}><DashboardPage /></ProtectedRoute>
 */
const ProtectedRoute = ({
  children,
  roles = [],
  redirectTo = '/login',
}) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const location = useLocation();

  // Chưa đăng nhập → về trang login, lưu lại current path để redirect sau đăng nhập
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Kiểm tra role nếu có yêu cầu
  if (roles.length > 0) {
    const hasAccess = roles.some((role) => hasRole(user, role));
    if (!hasAccess) {
      // Đã đăng nhập nhưng không đủ quyền → về trang chủ
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;