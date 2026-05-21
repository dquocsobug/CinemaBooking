import { useState, useEffect } from 'react';

/**
 * Debounce một giá trị — chỉ cập nhật sau khi user ngừng thay đổi `delay` ms.
 * Dùng cho search input để tránh gọi API liên tục.
 *
 * @param {any} value - Giá trị cần debounce
 * @param {number} delay - Thời gian delay (ms), mặc định 400ms
 * @returns {any} debouncedValue
 *
 * @example
 * const [query, setQuery] = useState('');
 * const debouncedQuery = useDebounce(query, 400);
 *
 * useEffect(() => {
 *   if (debouncedQuery) fetchMovies(debouncedQuery);
 * }, [debouncedQuery]);
 */
const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;