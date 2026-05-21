import { useState, useEffect, useRef, useCallback } from 'react';
import { calcSecondsLeft } from '../utils/format';

/**
 * Hook đếm ngược từ expiresAt (ISO string) hoặc từ số giây ban đầu.
 *
 * @param {string | number} target - ISO datetime string hoặc số giây ban đầu
 * @param {Function} onExpire - callback khi hết giờ
 *
 * @returns {{ secondsLeft, isExpired, reset }}
 *
 * @example
 * // Từ ISO string (booking.expiresAt)
 * const { secondsLeft, isExpired } = useCountdown(booking.expiresAt, () => navigate('/'));
 *
 * // Từ số giây cố định
 * const { secondsLeft, isExpired } = useCountdown(300, handleExpire);
 */
const useCountdown = (target, onExpire) => {
  const getInitialSeconds = useCallback(() => {
    if (!target) return 0;
    if (typeof target === 'number') return target;
    return calcSecondsLeft(target); // ISO string → giây còn lại
  }, [target]);

  const [secondsLeft, setSecondsLeft] = useState(getInitialSeconds);
  const intervalRef = useRef(null);
  const onExpireRef = useRef(onExpire);

  // Giữ ref callback luôn mới nhất (tránh stale closure)
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Reset khi target thay đổi
  useEffect(() => {
    const initial = getInitialSeconds();
    setSecondsLeft(initial);
  }, [getInitialSeconds]);

  // Bộ đếm chính
  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpireRef.current?.();
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [secondsLeft === 0 ? 0 : target]); // eslint-disable-line

  const reset = useCallback((newTarget) => {
    clearInterval(intervalRef.current);
    if (newTarget !== undefined) {
      const s = typeof newTarget === 'number' ? newTarget : calcSecondsLeft(newTarget);
      setSecondsLeft(s);
    } else {
      setSecondsLeft(getInitialSeconds());
    }
  }, [getInitialSeconds]);

  return {
    secondsLeft,
    isExpired: secondsLeft <= 0,
    reset,
  };
};

export default useCountdown;